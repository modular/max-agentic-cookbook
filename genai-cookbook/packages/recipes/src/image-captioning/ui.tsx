'use client'

/*
 * Image Captioning with NDJSON Streaming
 *
 * This recipe demonstrates how to caption images using Modular MAX or any OpenAI-compatible
 * server, with progressive streaming updates for better UX. Instead of waiting for all captions
 * to complete, users see each result as soon as it's ready.
 *
 * Architecture:
 * - Custom useNDJSON hook: Handles NDJSON streaming from the API (no external dependencies)
 * - Progressive UI updates: Captions appear one-by-one as they complete
 * - Mantine components: File upload, image gallery, and form controls
 * - Vercel AI SDK: OpenAI-compatible API client (works with MAX, OpenAI, etc.)
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { nanoid } from 'nanoid'
import { SystemModelMessage, UserModelMessage } from 'ai'
import prettyMilliseconds from 'pretty-ms'
import {
    Stack,
    SimpleGrid,
    Textarea,
    Space,
    ScrollArea,
    AspectRatio,
} from '@mantine/core'

// ============================================================================
// Shared types and data structures
// ============================================================================

/**
 * Tracks everything we need to caption an uploaded image, including async state
 * so the UI can show spinners while Modular MAX/OpenAI generate text.
 */
interface ImageData {
    id: string
    fileName: string
    imageData: string
    mimeType: string
    caption: string | null
    processing: boolean
    captionDuration: number | null
    captionTTFT: number | null
}

// ============================================================================
// Custom NDJSON streaming hook
// ============================================================================

/**
 * useNDJSON: A reusable hook for streaming NDJSON responses
 *
 * NDJSON (newline-delimited JSON) is a simple streaming format where each line is a
 * separate JSON object. This hook handles the complexity of parsing incomplete chunks
 * and buffering partial lines, giving you a clean callback-based API.
 *
 * Usage:
 *   const { trigger, isMutating, error } = useNDJSON<MyType>(apiUrl)
 *   await trigger(requestBody, (data) => {
 *     // Called for each line of NDJSON as it arrives
 *   })
 */
function useNDJSON<T>(url: string) {
    const [isMutating, setIsMutating] = useState(false)
    const [error, setError] = useState<Error | null>(null)
    const abortControllerRef = useRef<AbortController | null>(null)

    const trigger = useCallback(
        async (body: any, onMessage: (data: T) => void) => {
            setIsMutating(true)
            setError(null)
            abortControllerRef.current = new AbortController()

            try {
                const response = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(body),
                    signal: abortControllerRef.current.signal,
                })

                if (!response.ok) {
                    throw new Error(await response.text())
                }

                // Stream NDJSON: read chunks and parse complete lines
                const reader = response.body!.getReader()
                const decoder = new TextDecoder()
                let buffer = ''

                while (true) {
                    const { done, value } = await reader.read()
                    if (done) break

                    // Accumulate chunks and split by newline
                    buffer += decoder.decode(value, { stream: true })
                    const lines = buffer.split('\n')

                    // Keep the last (potentially incomplete) line in the buffer
                    buffer = lines.pop() || ''

                    // Parse and deliver each complete line
                    for (const line of lines) {
                        if (!line.trim()) continue

                        try {
                            const data = JSON.parse(line)
                            onMessage(data)
                        } catch (parseError) {
                            console.error(
                                'Failed to parse NDJSON line:',
                                line,
                                parseError
                            )
                        }
                    }
                }
            } catch (err) {
                if (err instanceof Error && err.name === 'AbortError') {
                    return // User cancelled, ignore
                }
                setError(err as Error)
                throw err
            } finally {
                setIsMutating(false)
            }
        },
        [url]
    )

    const cancel = useCallback(() => {
        abortControllerRef.current?.abort()
    }, [])

    useEffect(() => {
        return () => abortControllerRef.current?.abort()
    }, [])

    return { trigger, isMutating, error, cancel }
}

// ============================================================================
// Image captioning recipe surface
// ============================================================================

/**
 * Main recipe component: handles file uploads, triggers caption generation,
 * and displays results as they stream in from the API.
 */
export default function Recipe({ endpoint, model, pathname }: RecipeProps) {
    const [images, setImages] = useState<ImageData[]>([])

    const imageCaptioningPrompt =
        'You are given an image. Respond with a concise caption that describes the main subject or scene. Keep it to one short sentence. Do not add explanations, reasoning, or formatting—only the caption.'
    const [prompt, setPrompt] = useState(imageCaptioningPrompt)

    const maxSizeMb = 5

    // NDJSON streaming hook provides progressive updates with timing metrics
    interface CaptionResult {
        imageId: string
        text?: string
        error?: string
        ttft?: number
        duration?: number
    }
    const { trigger, isMutating, error } = useNDJSON<CaptionResult>(`${pathname}/api`)

    const onFileDroppped = useCallback(
        async (newFiles: File[]) => {
            if (!newFiles || newFiles.length === 0) return

            // Convert Files to base64 data URLs for API transport
            const newImages = await Promise.all(
                newFiles.map(async (file) => ({
                    id: nanoid(),
                    fileName: file.name,
                    imageData: await getDataFromFile(file),
                    mimeType: file.type,
                    caption: null,
                    captionDuration: null,
                    captionTTFT: null,
                    processing: false,
                }))
            )

            setImages((prevImages) => [...prevImages, ...newImages])
        },
        [setImages]
    )

    const onGenerateClicked = useCallback(async () => {
        if (!endpoint || !model) return

        const queue = images.filter((img) => img.caption === null && !img.processing)
        if (queue.length === 0) return

        // Show spinners immediately
        setImages((data) =>
            data.map((prev) =>
                queue.find((queued) => queued.id === prev.id)
                    ? { ...prev, processing: true }
                    : prev
            )
        )

        try {
            // Build OpenAI-compatible message format for each image
            const systemMessage: SystemModelMessage = {
                role: 'system',
                content: prompt,
            }

            const batch = queue.map((image) => ({
                imageId: image.id,
                messages: [
                    systemMessage,
                    {
                        role: 'user',
                        content: [{ type: 'image', image: image.imageData }],
                    } as UserModelMessage,
                ],
            }))

            // Stream captions as they're generated
            await trigger(
                {
                    endpointId: endpoint.id,
                    modelName: model.name,
                    batch,
                },
                (result) => {
                    // Update UI with each caption as it arrives, including timing metrics
                    setImages((data) =>
                        data.map((prev) =>
                            prev.id === result.imageId
                                ? {
                                      ...prev,
                                      processing: false,
                                      caption: result.text || null,
                                      captionTTFT: result.ttft || null,
                                      captionDuration: result.duration || null,
                                  }
                                : prev
                        )
                    )
                }
            )
        } catch (err) {
            setImages((data) => data.map((img) => ({ ...img, processing: false })))
        }
    }, [endpoint, model, images, prompt, trigger])

    return (
        <Stack flex={1} h="100%" style={{ overflow: 'hidden', minHeight: 0 }}>
            <ErrorAlert error={error} />

            <ScrollArea flex={1} h="100%" w="100%">
                <Stack>
                    <SimpleGrid cols={{ base: 1, md: 2 }}>
                        <FileDrop onDrop={onFileDroppped} maxSizeMb={maxSizeMb} />
                        <Textarea
                            label="Prompt"
                            autosize
                            minRows={4}
                            maxRows={4}
                            w="100%"
                            value={prompt}
                            onChange={(event) => setPrompt(event.currentTarget.value)}
                        />
                    </SimpleGrid>
                    <Gallery images={images} />
                </Stack>
            </ScrollArea>
            <FormActions
                actionsDisabled={images.length < 1 || isMutating}
                generateClicked={onGenerateClicked}
                resetClicked={() => {
                    setImages([])
                }}
            />
        </Stack>
    )
}

// ============================================================================
// Form actions
// ============================================================================
import { Button, Group } from '@mantine/core'

interface FormActionsProps {
    title?: string
    actionsDisabled: boolean
    generateClicked: () => void
    resetClicked: () => void
}

/** Action buttons for generating captions and resetting the workspace */
function FormActions({
    actionsDisabled,
    generateClicked,
    resetClicked,
}: FormActionsProps) {
    return (
        <Group bg="var(--mantine-color-default)" p="sm">
            <Space ml="auto" />
            <Button disabled={actionsDisabled} onClick={generateClicked}>
                Generate Captions
            </Button>
            <Button variant="outline" disabled={actionsDisabled} onClick={resetClicked}>
                Reset
            </Button>
            <Space mr="auto" />
        </Group>
    )
}

// ============================================================================
// Error reporting
// ============================================================================
import { Alert, Divider } from '@mantine/core'
import { IconExclamationCircle } from '@tabler/icons-react'

/** Shows error banner when caption generation fails */
function ErrorAlert({ error }: { error: Error | null }) {
    const errorIcon = <IconExclamationCircle />

    if (error) {
        return (
            <Alert variant="light" color="red" title="Error" icon={errorIcon}>
                {error.message}
            </Alert>
        )
    } else {
        return <Divider />
    }
}

// ============================================================================
// File dropzone
// ============================================================================

interface FileDropProps {
    onDrop: (files: File[]) => void
    maxSizeMb?: number
    disabled?: boolean
}

import { Text } from '@mantine/core'
import { Dropzone } from '@mantine/dropzone'
import { IconUpload, IconPhoto, IconX } from '@tabler/icons-react'

const centerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'space-between',
    overflow: 'hidden',
}

/** Drag-and-drop file upload zone powered by Mantine's Dropzone */
function FileDrop({ onDrop, maxSizeMb, disabled }: FileDropProps) {
    const maxSizeBytes = maxSizeMb ? maxSizeMb * 1024 ** 2 : undefined
    return (
        <Stack gap={0} w="100%" mt={1}>
            <Text size="sm">Upload Images</Text>
            <Dropzone
                onDrop={onDrop}
                onReject={(files) => console.log('rejected files', files)}
                maxSize={maxSizeBytes}
                accept={['image/png', 'image/jpeg']}
                multiple={true}
                style={centerStyle}
                disabled={disabled}
                mt="4"
                h="100"
                p="md"
                w="100%"
                bd="1px solid var(--mantine-color-default-border)"
            >
                <Group
                    justify="center"
                    h={59}
                    gap="sm"
                    style={{ pointerEvents: 'none' }}
                >
                    <Dropzone.Accept>
                        <IconUpload
                            size={36}
                            color="var(--mantine-color-blue-6)"
                            stroke={1.5}
                        />
                    </Dropzone.Accept>
                    <Dropzone.Reject>
                        <IconX
                            size={36}
                            color="var(--mantine-color-red-6)"
                            stroke={1.5}
                        />
                    </Dropzone.Reject>
                    <Dropzone.Idle>
                        <IconPhoto
                            size={36}
                            color="var(--mantine-color-dimmed)"
                            stroke={1.5}
                        />
                    </Dropzone.Idle>

                    <Box>
                        <Text inline>Drag images or click to browse</Text>
                        <Text size="sm" c="dimmed" inline mt={7}>
                            {`Files must be smaller than ${maxSizeMb} MB each`}
                        </Text>
                    </Box>
                </Group>
            </Dropzone>
        </Stack>
    )
}

// ============================================================================
// Image gallery
// ============================================================================
import { Box, Image, LoadingOverlay } from '@mantine/core'
import { RecipeProps } from '../types'

/** Displays uploaded images in a responsive grid with caption text below each */
function Gallery({ images }: { images: ImageData[] }) {
    const ImageBox = ({ image }: { image: ImageData }) => {
        return (
            <Box>
                <AspectRatio pos="relative" ratio={4 / 3}>
                    <LoadingOverlay visible={image.processing} zIndex={1000} />
                    <Image
                        src={image.imageData}
                        alt={image.caption ?? 'Image has not been captioned yet'}
                    />
                </AspectRatio>
                <Text c={!image.caption ? 'dimmed' : ''}>
                    {image.caption ?? 'Image not yet captioned'}
                </Text>

                <Text c="dimmed" size="sm">
                    TTFT:{' '}
                    {image.captionTTFT
                        ? prettyMilliseconds(image.captionTTFT, { unitCount: 3 })
                        : '--'}
                    , Duration:{' '}
                    {image.captionDuration
                        ? '+' +
                          prettyMilliseconds(image.captionDuration, { unitCount: 3 })
                        : '--'}
                </Text>
            </Box>
        )
    }

    return (
        <SimpleGrid cols={{ base: 1, sm: 2, lg: 4, xl: 5 }}>
            {images.map((image) => (
                <ImageBox key={image.id} image={image} />
            ))}
        </SimpleGrid>
    )
}

// ============================================================================
// File helper utilities
// ============================================================================

/** Converts a File to a base64 data URL for transport to the API route. */
async function getDataFromFile(file: File): Promise<string> {
    return await new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(String(reader.result))
        reader.onerror = (e) => reject(e)
        reader.readAsDataURL(file)
    })
}
