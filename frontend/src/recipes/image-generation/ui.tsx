/**
 * Image Generation with Text-to-Image Diffusion Models
 *
 * This recipe demonstrates image generation from text prompts using
 * OpenAI-compatible endpoints with Modular MAX's FLUX.2 diffusion models.
 * Users provide a text description and optional generation parameters,
 * and receive a generated image with performance metrics.
 */

import { useState } from 'react'
import prettyMilliseconds from 'pretty-ms'
import useSWRMutation from 'swr/mutation'
import {
    Stack,
    Textarea,
    NumberInput,
    ScrollArea,
    Button,
    Group,
    Alert,
    Divider,
    Text,
    Image,
    Paper,
    Badge,
    Collapse,
    Space,
    UnstyledButton,
} from '@mantine/core'
import { IconExclamationCircle, IconDownload, IconSettings } from '@tabler/icons-react'
import type { Endpoint, Model } from '~/lib/types'

// ============================================================================
// Types and interfaces
// ============================================================================

/**
 * Request body for image generation
 */
interface ImageGenerationRequestBody {
    endpointId: string
    modelName: string
    prompt: string
    width: number
    height: number
    steps: number
    guidance_scale: number
    negative_prompt: string
}

/**
 * Response from the backend after image generation
 */
interface ImageGenerationResult {
    image_b64: string
    width: number
    height: number
    duration: number
}

interface RecipeProps {
    endpoint: Endpoint | null
    model: Model | null
    pathname: string
}

// ============================================================================
// API fetchers
// ============================================================================

/**
 * Fetcher function for image generation mutation
 */
async function generateImage(
    url: string,
    { arg }: { arg: ImageGenerationRequestBody }
): Promise<ImageGenerationResult> {
    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(arg),
    })

    if (!response.ok) {
        const errorText = await response.text()
        throw new Error(errorText || 'Image generation failed')
    }

    return response.json()
}

// ============================================================================
// Main recipe component
// ============================================================================

/**
 * Main recipe component: handles prompt input, generation parameters,
 * image generation, and result display with download.
 */
export function Component({ endpoint, model }: RecipeProps) {
    const [prompt, setPrompt] = useState('')
    const [width, setWidth] = useState(1024)
    const [height, setHeight] = useState(1024)
    const [steps, setSteps] = useState(28)
    const [guidanceScale, setGuidanceScale] = useState(3.5)
    const [negativePrompt, setNegativePrompt] = useState('')
    const [showAdvanced, setShowAdvanced] = useState(false)
    const [result, setResult] = useState<ImageGenerationResult | null>(null)
    const [error, setError] = useState<Error | null>(null)

    // Use SWR mutation for image generation
    const {
        trigger,
        isMutating,
        error: mutationError,
    } = useSWRMutation('/api/recipes/image-generation', generateImage)

    const onGenerateClicked = async () => {
        if (!endpoint || !model || !prompt.trim()) return

        setError(null)

        try {
            const generationResult = await trigger({
                endpointId: endpoint.id,
                modelName: model.id,
                prompt: prompt.trim(),
                width,
                height,
                steps,
                guidance_scale: guidanceScale,
                negative_prompt: negativePrompt,
            })

            setResult(generationResult)
        } catch (err) {
            setError(err as Error)
        }
    }

    const downloadImage = () => {
        if (!result) return

        const link = document.createElement('a')
        link.href = `data:image/png;base64,${result.image_b64}`
        link.download = `generated-image-${Date.now()}.png`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }

    const generateDisabled = !endpoint || !model || !prompt.trim() || isMutating

    return (
        <Stack flex={1} h="100%" style={{ overflow: 'hidden', minHeight: 0 }}>
            <ErrorAlert error={error || mutationError} />

            <ScrollArea flex={1} h="100%" w="100%">
                <Stack p="md">
                    {/* Prompt Section */}
                    <Paper p="md" radius="md" withBorder>
                        <Stack>
                            <Text fw={500} size="sm">
                                Prompt
                            </Text>
                            <Textarea
                                placeholder="Describe the image you want to generate..."
                                minRows={3}
                                maxRows={6}
                                autosize
                                value={prompt}
                                onChange={(e) => setPrompt(e.currentTarget.value)}
                                disabled={isMutating}
                            />
                        </Stack>
                    </Paper>

                    {/* Advanced Settings */}
                    <Paper p="md" radius="md" withBorder>
                        <UnstyledButton
                            onClick={() => setShowAdvanced((v) => !v)}
                            w="100%"
                        >
                            <Group>
                                <IconSettings
                                    size={16}
                                    color="var(--mantine-color-dimmed)"
                                />
                                <Text fw={500} size="sm">
                                    Advanced Settings
                                </Text>
                                <Text size="xs" c="dimmed">
                                    {showAdvanced ? '(hide)' : '(show)'}
                                </Text>
                            </Group>
                        </UnstyledButton>

                        <Collapse in={showAdvanced}>
                            <Stack mt="md" gap="md">
                                <Group grow>
                                    <NumberInput
                                        label="Width"
                                        value={width}
                                        onChange={(v) =>
                                            setWidth(typeof v === 'number' ? v : 1024)
                                        }
                                        min={256}
                                        max={2048}
                                        step={16}
                                        disabled={isMutating}
                                    />
                                    <NumberInput
                                        label="Height"
                                        value={height}
                                        onChange={(v) =>
                                            setHeight(typeof v === 'number' ? v : 1024)
                                        }
                                        min={256}
                                        max={2048}
                                        step={16}
                                        disabled={isMutating}
                                    />
                                </Group>
                                <Group grow>
                                    <NumberInput
                                        label="Steps"
                                        description="Number of denoising iterations"
                                        value={steps}
                                        onChange={(v) =>
                                            setSteps(typeof v === 'number' ? v : 28)
                                        }
                                        min={1}
                                        max={50}
                                        disabled={isMutating}
                                    />
                                    <NumberInput
                                        label="Guidance Scale"
                                        description="Prompt adherence strength"
                                        value={guidanceScale}
                                        onChange={(v) =>
                                            setGuidanceScale(
                                                typeof v === 'number' ? v : 3.5
                                            )
                                        }
                                        min={0}
                                        max={20}
                                        step={0.5}
                                        decimalScale={1}
                                        disabled={isMutating}
                                    />
                                </Group>
                                <Textarea
                                    label="Negative Prompt"
                                    description="Describe what to avoid in the generated image"
                                    placeholder="e.g., blurry, low quality, distorted"
                                    minRows={2}
                                    maxRows={4}
                                    autosize
                                    value={negativePrompt}
                                    onChange={(e) =>
                                        setNegativePrompt(e.currentTarget.value)
                                    }
                                    disabled={isMutating}
                                />
                            </Stack>
                        </Collapse>
                    </Paper>

                    {/* Result Section */}
                    {result && (
                        <Paper p="md" radius="md" withBorder>
                            <Stack>
                                <Group>
                                    <Text fw={500} size="sm">
                                        Generated Image
                                    </Text>
                                    <Badge variant="light">
                                        {prettyMilliseconds(result.duration, {
                                            unitCount: 2,
                                        })}
                                    </Badge>
                                    <Badge variant="light" color="gray">
                                        {result.width} x {result.height}
                                    </Badge>
                                </Group>
                                <Image
                                    src={`data:image/png;base64,${result.image_b64}`}
                                    alt="Generated image"
                                    radius="md"
                                    maw={result.width}
                                    w="100%"
                                    fit="contain"
                                />
                            </Stack>
                        </Paper>
                    )}
                </Stack>
            </ScrollArea>

            {/* Action Buttons */}
            <Group bg="var(--mantine-color-default)" p="sm">
                <Space ml="auto" />
                <Button
                    disabled={generateDisabled}
                    onClick={onGenerateClicked}
                    loading={isMutating}
                >
                    Generate
                </Button>
                <Button
                    disabled={!result}
                    onClick={downloadImage}
                    leftSection={<IconDownload />}
                >
                    Download
                </Button>
                <Button
                    variant="outline"
                    onClick={() => {
                        setResult(null)
                        setError(null)
                        setPrompt('')
                    }}
                >
                    Reset
                </Button>
                <Space mr="auto" />
            </Group>
        </Stack>
    )
}

// ============================================================================
// Error reporting
// ============================================================================

/** Shows error banner when generation fails */
function ErrorAlert({ error }: { error: Error | unknown | null }) {
    const errorIcon = <IconExclamationCircle />

    if (error) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        return (
            <Alert variant="light" color="red" title="Error" icon={errorIcon}>
                {errorMessage}
            </Alert>
        )
    } else {
        return <Divider />
    }
}
