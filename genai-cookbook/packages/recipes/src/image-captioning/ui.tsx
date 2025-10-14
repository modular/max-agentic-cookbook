'use client'

/*
 * This recipe shows how to use Modular MAX for the image captioning
 * using the Vercel AI SDK plumbing for OpenAI-compatble endpoints.
 * We lean on Mantine for UI primitives—matching Modular's Mantine-based
 * design system—so we can focus on the GenAI workflow.
 *
 * The page is organized into the core recipe component, UI helpers for user
 * interaction, and the request helpers that translate files into provider-ready
 * messages.
 *
 * This implementation uses SWR for data fetching with automatic request
 * deduplication and built-in loading/error states.
 */

import { useCallback, useState } from 'react'
import { nanoid } from 'nanoid'
import { SystemModelMessage, UserModelMessage } from 'ai'
import useSWRMutation from 'swr/mutation'
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
}

// ============================================================================
// Image captioning recipe surface
// ============================================================================

/**
 * Manages the end-to-end captioning flow: collecting files, configuring the
 * prompt, and delegating caption generation to the API route that speaks the
 * Modular MAX/OpenAI protocol. Uses SWR for efficient data fetching.
 */
export default function Recipe({ endpoint, model, pathname }: RecipeProps) {
    // Track every uploaded image plus its caption/processing state so the UI can render progress.
    const [images, setImages] = useState<ImageData[]>([])

    // Allow the user to tweak the instruction set that accompanies each caption request.
    const imageCaptioningPrompt =
        'You are given an image. Respond with a concise caption that describes the main subject or scene. Keep it to one short sentence. Do not add explanations, reasoning, or formatting—only the caption.'
    const [prompt, setPrompt] = useState(imageCaptioningPrompt)

    // Store any transport/runtime failures so ErrorAlert can surface them.
    const [error, setError] = useState<string | null>(null)

    // Set a reasonable max file size limit here
    const maxSizeMb = 5

    // SWR mutation hook for batch caption generation
    const { trigger, isMutating } = useSWRMutation(
        `${pathname}/api`,
        batchCaptionFetcher
    )

    // Callback for the FileDrop component
    const onFileDroppped = useCallback(
        async (newFiles: File[]) => {
            // Reset stale error state and convert the selected File objects to our ImageData shape.
            setError(null)
            if (!newFiles || newFiles.length === 0) return
            const newImages = await Promise.all(
                newFiles.map(async (file) => ({
                    id: nanoid(),
                    fileName: file.name,
                    imageData: await getDataFromFile(file),
                    mimeType: file.type,
                    caption: null,
                    processing: false,
                }))
            )
            // Merge freshly prepared data URLs into the gallery queue.
            setImages((prevImages) => [...prevImages, ...newImages])
        },
        [setImages]
    )

    // Callback for the Generate button - uses SWR mutation
    const onGenerateClicked = useCallback(async () => {
        setError(null)

        try {
            if (!endpoint || !model) {
                throw new Error('Model is not selected')
            }

            // Only send images that still need captions and are not currently being processed.
            const queue = images.filter(
                (img) => img.caption === null && !img.processing
            )

            if (queue.length === 0) return

            // Optimistically mark queued images as processing so the gallery overlays spinners immediately.
            setImages((data) =>
                data.map((prev) =>
                    queue.find((queued) => queued.id === prev.id)
                        ? { ...prev, processing: true }
                        : prev
                )
            )

            // Trigger the batch caption request via SWR
            const captions = await trigger({
                images: queue,
                prompt,
                endpointId: endpoint.id,
                modelName: model.name,
            })

            // Update all captions at once
            setImages((data) =>
                data.map((prev) => {
                    const caption = captions.get(prev.id)
                    return caption !== undefined
                        ? { ...prev, processing: false, caption }
                        : prev
                })
            )
        } catch (error) {
            setError('Unable to generate captions. ' + (error as Error)?.message)
            setImages((data) => data.map((img) => ({ ...img, processing: false })))
        }
    }, [endpoint, model, images, pathname, prompt, trigger])

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
                    setError(null)
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

/**
 * Presents buttons for generating captions or clearing the workspace. Both are
 * disabled while requests to Modular MAX/OpenAI are in flight.
 */
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
// Error reporting banner
// ============================================================================
import { Alert, Divider } from '@mantine/core'
import { IconExclamationCircle } from '@tabler/icons-react'

/** Surfaces transport errors so users can adjust configuration or retry. */
function ErrorAlert({ error }: { error: string | null }) {
    const errorIcon = <IconExclamationCircle />

    if (error) {
        return (
            <Alert variant="light" color="red" title="Error" icon={errorIcon}>
                {error}
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

/**
 * Wraps Mantine's Dropzone so we can accept image uploads with minimal setup.
 */
function FileDrop({ onDrop, maxSizeMb, disabled }: FileDropProps) {
    const maxSizeBytes = maxSizeMb ? maxSizeMb * 1024 ** 2 : undefined
    return (
        <Stack gap={0} w="100%" mt={1}>
            <Text size="sm">Upload Images</Text>
            {/* Mantine Dropzone handles drag-and-drop + click-to-upload with built-in validation states. */}
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
                {/* Layout inside the dropzone uses Mantine Group/Box/Text for consistent spacing and color. */}
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
// Generated caption gallery
// ============================================================================
import { Box, Image, LoadingOverlay } from '@mantine/core'
import { RecipeProps } from '../types'

/**
 * Renders each uploaded image alongside its streaming caption status inside a
 * scrollable grid. The local `ImageBox` helper keeps the loading overlay and
 * aspect ratio consistent per card, while `ScrollArea` + `SimpleGrid` stretch to
 * the available height so overflow is handled without breaking the outer flex
 * layout.
 */
function Gallery({ images }: { images: ImageData[] }) {
    const ImageBox = ({ image }: { image: ImageData }) => {
        return (
            <Box>
                {/* Mantine Box + LoadingOverlay show spinner on top of the image while captioning. */}
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
// Request helpers with SWR
// ============================================================================

/** Parameters for batch caption generation via SWR mutation */
interface BatchCaptionRequest {
    images: ImageData[]
    prompt: string
    endpointId: string
    modelName: string
}

/** Result from batch caption API */
interface BatchCaptionResult {
    imageId: string
    text?: string
    error?: string
}

/**
 * SWR fetcher for batch caption generation. Sends multiple images to the API
 * in a single request and returns a Map of imageId -> caption text.
 * The payload matches the OpenAI-compatible schema, so Modular MAX or OpenAI
 * can be swapped by changing the endpoint selection.
 */
async function batchCaptionFetcher(
    url: string,
    { arg }: { arg: BatchCaptionRequest }
): Promise<Map<string, string>> {
    const systemMessage: SystemModelMessage = {
        role: 'system',
        content: arg.prompt,
    }

    // Build batch request with each image and its messages
    const batch = arg.images.map((image) => {
        const userMessage: UserModelMessage = {
            role: 'user',
            content: [
                {
                    type: 'image',
                    image: image.imageData,
                },
            ],
        }
        return {
            imageId: image.id,
            messages: [systemMessage, userMessage],
        }
    })

    const response = await fetch(url, {
        method: 'POST',
        body: JSON.stringify({
            endpointId: arg.endpointId,
            modelName: arg.modelName,
            batch,
        }),
    })

    if (!response.ok) {
        throw new Error(await response.text())
    }

    const data = await response.json()
    const results = new Map<string, string>()

    // Convert array results to Map for easy lookup
    data.results.forEach((result: BatchCaptionResult) => {
        if (result.text) {
            results.set(result.imageId, result.text)
        } else if (result.error) {
            throw new Error(
                `Failed to caption image ${result.imageId}: ${result.error}`
            )
        }
    })

    return results
}

/** Converts a File to a base64 data URL for transport to the API route. */
async function getDataFromFile(file: File): Promise<string> {
    return await new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(String(reader.result))
        reader.onerror = (e) => reject(e)
        reader.readAsDataURL(file)
    })
}
