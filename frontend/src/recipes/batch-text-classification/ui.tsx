/**
 * Text Classification with JSONL Support and Custom Prompts
 *
 * This recipe demonstrates Text Classification using OpenAI-compatible endpoints
 * with flexible JSONL schema support. Users upload JSONL files, specify which field
 * contains the text to classify, provide a custom prompt, and get back classified
 * results with performance metrics.
 */

import { useCallback, useState } from 'react'
import { nanoid } from 'nanoid'
import prettyMilliseconds from 'pretty-ms'
import useSWRMutation from 'swr/mutation'
import {
    Stack,
    Textarea,
    TextInput,
    Space,
    ScrollArea,
    Button,
    Group,
    Alert,
    Divider,
    Text,
    Box,
    Table,
    Paper,
    Badge,
    Pagination,
} from '@mantine/core'
import { Dropzone } from '@mantine/dropzone'
import {
    IconExclamationCircle,
    IconUpload,
    IconFile,
    IconX,
    IconDownload,
} from '@tabler/icons-react'
import type { Endpoint, Model } from '~/lib/types'

// ============================================================================
// Types and interfaces
// ============================================================================

/**
 * Represents a single item from the uploaded JSONL file before classification
 */
interface TextItem {
    id: string
    originalData: unknown
    text: string | null
    classification: string | null
    duration: number | null
}

/**
 * Request body for batch classification mutation
 */
interface BatchClassificationRequestBody {
    endpointId: string
    modelName: string
    systemPrompt: string
    textField: string
    batch: Array<{ itemId: string; originalData: unknown }>
}

/**
 * Response from the backend after classification
 */
interface ClassificationResult {
    itemId: string
    originalText: string
    classification: string
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
 * Fetcher function for batch classification mutation
 */
async function classifyBatch(
    url: string,
    { arg }: { arg: BatchClassificationRequestBody }
): Promise<ClassificationResult[]> {
    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(arg),
    })

    if (!response.ok) {
        const errorText = await response.text()
        throw new Error(errorText || 'Classification failed')
    }

    return response.json()
}

// ============================================================================
// Main recipe component
// ============================================================================

/**
 * Main recipe component: handles JSONL upload, configuration, classification,
 * and result display/download.
 */
export function Component({ endpoint, model }: RecipeProps) {
    const [uploadedItems, setUploadedItems] = useState<TextItem[]>([])
    const [results, setResults] = useState<ClassificationResult[]>([])
    const [textField, setTextField] = useState('text')
    const [systemPrompt, setSystemPrompt] = useState(
        'Classify the following text. Respond with only the classification label.'
    )
    const [error, setError] = useState<Error | null>(null)
    const [previewPage, setPreviewPage] = useState(1)
    const [resultsPage, setResultsPage] = useState(1)

    const itemsPerPage = 20

    // Use SWR mutation for batch classification
    const {
        trigger: triggerClassification,
        isMutating: isProcessing,
        error: mutationError,
    } = useSWRMutation('/api/recipes/batch-text-classification', classifyBatch)

    // Parse JSONL file on drop
    const onFileDropped = useCallback(async (newFiles: File[]) => {
        if (!newFiles || newFiles.length === 0) return

        try {
            setError(null)
            const file = newFiles[0] // Only accept one file at a time

            // Validate file size (max 10MB to prevent browser crashes)
            const maxSizeBytes = 10 * 1024 * 1024 // 10MB
            if (file.size > maxSizeBytes) {
                throw new Error(
                    `File too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Maximum size is 10MB.`
                )
            }

            const text = await file.text()

            // Parse JSONL: split by newlines, parse each line as JSON
            const lines = text.split('\n').filter((line) => line.trim())
            const items: TextItem[] = []

            for (const line of lines) {
                try {
                    const data = JSON.parse(line)
                    items.push({
                        id: nanoid(),
                        originalData: data,
                        text: null, // Will be extracted based on textField
                        classification: null,
                        duration: null,
                    })
                } catch (parseError) {
                    console.error('Failed to parse JSONL line:', line, parseError)
                }
            }

            if (items.length === 0) {
                throw new Error('No valid JSON lines found in file')
            }

            setUploadedItems(items)
            setResults([])
            setPreviewPage(1)
            setResultsPage(1)
        } catch (err) {
            setError(err as Error)
        }
    }, [])

    // Extract text from item using the configured textField
    const extractText = (item: TextItem): string | null => {
        try {
            const data = item.originalData as Record<string, unknown>
            const value = data[textField]

            if (value === null || value === undefined) {
                return null
            }

            if (typeof value === 'string') {
                return value
            }

            // Try to convert to string if it's another type
            return String(value)
        } catch {
            return null
        }
    }

    // Classify all items
    const onClassifyClicked = useCallback(async () => {
        if (!endpoint || !model || uploadedItems.length === 0) return

        setError(null)

        try {
            // Extract text for all items
            const itemsWithText = uploadedItems.map((item) => ({
                ...item,
                text: extractText(item),
            }))

            // Filter out items with null text
            const validItems = itemsWithText.filter((item) => item.text !== null)

            if (validItems.length === 0) {
                throw new Error(`No text found in field "${textField}" for any items`)
            }

            // Build batch request
            const batch = validItems.map((item) => ({
                itemId: item.id,
                originalData: item.originalData,
            }))

            // Trigger the classification mutation
            const classificationResults = await triggerClassification({
                endpointId: endpoint.id,
                modelName: model.id,
                systemPrompt,
                textField,
                batch,
            })

            // Update items with results
            const updatedItems = itemsWithText.map((item) => {
                const result = classificationResults.find((r) => r.itemId === item.id)
                return {
                    ...item,
                    text: extractText(item),
                    classification: result?.classification || null,
                    duration: result?.duration || null,
                }
            })

            setUploadedItems(updatedItems)
            setResults(classificationResults)
            setResultsPage(1)
        } catch (err) {
            setError(err as Error)
        }
    }, [
        endpoint,
        model,
        uploadedItems,
        systemPrompt,
        textField,
        extractText,
        triggerClassification,
    ])

    // Calculate performance summary
    const performanceSummary = () => {
        if (results.length === 0) return null

        const durations = results.map((r) => r.duration)
        const total = durations.length
        const avg = Math.round(durations.reduce((a, b) => a + b, 0) / total)
        const min = Math.min(...durations)
        const max = Math.max(...durations)

        return { total, avg, min, max }
    }

    // Export results as JSONL
    const exportResults = () => {
        if (results.length === 0) return

        const jsonlContent = results.map((result) => JSON.stringify(result)).join('\n')

        const blob = new Blob([jsonlContent], { type: 'application/jsonl' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `classified-results-${Date.now()}.jsonl`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
    }

    // Paginate preview items
    const previewStart = (previewPage - 1) * itemsPerPage
    const previewEnd = previewStart + itemsPerPage
    const previewItems = uploadedItems.slice(previewStart, previewEnd)
    const previewPages = Math.ceil(uploadedItems.length / itemsPerPage)

    // Paginate results
    const resultsStart = (resultsPage - 1) * itemsPerPage
    const resultsEnd = resultsStart + itemsPerPage
    const resultsItems = results.slice(resultsStart, resultsEnd)
    const resultsPages = Math.ceil(results.length / itemsPerPage)

    const summary = performanceSummary()

    return (
        <Stack flex={1} h="100%" style={{ overflow: 'hidden', minHeight: 0 }}>
            <ErrorAlert error={error || mutationError} />

            <ScrollArea flex={1} h="100%" w="100%">
                <Stack p="md">
                    {/* File Upload Section */}
                    <Paper p="md" radius="md" withBorder>
                        <FileDrop onDrop={onFileDropped} disabled={isProcessing} />
                    </Paper>

                    {/* Configuration Section */}
                    {uploadedItems.length > 0 && (
                        <Paper p="md" radius="md" withBorder>
                            <Stack>
                                <Text fw={500} size="sm">
                                    Configuration
                                </Text>
                                <TextInput
                                    label="Text Field Name"
                                    placeholder="e.g., text, content, message"
                                    description="Which field in your JSON contains the text to classify?"
                                    value={textField}
                                    onChange={(e) =>
                                        setTextField(e.currentTarget.value)
                                    }
                                    disabled={isProcessing}
                                />
                                <Textarea
                                    label="Classification Prompt"
                                    placeholder="Enter your classification instructions..."
                                    minRows={4}
                                    value={systemPrompt}
                                    onChange={(e) =>
                                        setSystemPrompt(e.currentTarget.value)
                                    }
                                    disabled={isProcessing}
                                />
                                <Text size="sm" c="dimmed">
                                    Preview: First item text will be classified with
                                    this prompt
                                </Text>
                            </Stack>
                        </Paper>
                    )}

                    {/* Preview Table Section */}
                    {uploadedItems.length > 0 && results.length === 0 && (
                        <Paper p="md" radius="md" withBorder>
                            <Stack>
                                <Group>
                                    <Text fw={500} size="sm">
                                        Preview ({uploadedItems.length} items)
                                    </Text>
                                    <Badge>{uploadedItems.length} items total</Badge>
                                </Group>

                                <div style={{ overflowX: 'auto' }}>
                                    <PreviewTable
                                        items={previewItems}
                                        textField={textField}
                                    />
                                </div>

                                {previewPages > 1 && (
                                    <Group justify="center">
                                        <Pagination
                                            value={previewPage}
                                            onChange={setPreviewPage}
                                            total={previewPages}
                                        />
                                    </Group>
                                )}

                                <Text size="sm" c="dimmed">
                                    Showing {previewStart + 1}–
                                    {Math.min(previewEnd, uploadedItems.length)} of{' '}
                                    {uploadedItems.length} items
                                </Text>
                            </Stack>
                        </Paper>
                    )}

                    {/* Results Section */}
                    {results.length > 0 && (
                        <Paper p="md" radius="md" withBorder>
                            <Stack>
                                <Group>
                                    <Text fw={500} size="sm">
                                        Results ({results.length} classified)
                                    </Text>
                                    {summary && (
                                        <Badge variant="light">
                                            Avg: {summary.avg}ms | Min: {summary.min}ms
                                            | Max: {summary.max}ms
                                        </Badge>
                                    )}
                                </Group>

                                <div style={{ overflowX: 'auto' }}>
                                    <ResultsTable items={resultsItems} />
                                </div>

                                {resultsPages > 1 && (
                                    <Group justify="center">
                                        <Pagination
                                            value={resultsPage}
                                            onChange={setResultsPage}
                                            total={resultsPages}
                                        />
                                    </Group>
                                )}

                                <Text size="sm" c="dimmed">
                                    Showing {resultsStart + 1}–
                                    {Math.min(resultsEnd, results.length)} of{' '}
                                    {results.length} results
                                </Text>
                            </Stack>
                        </Paper>
                    )}
                </Stack>
            </ScrollArea>

            {/* Action Buttons */}
            <FormActions
                onClassify={onClassifyClicked}
                onExport={exportResults}
                onReset={() => {
                    setUploadedItems([])
                    setResults([])
                    setError(null)
                }}
                classifyDisabled={
                    !endpoint ||
                    !model ||
                    uploadedItems.length === 0 ||
                    isProcessing ||
                    results.length > 0
                }
                exportDisabled={results.length === 0}
                isProcessing={isProcessing}
            />
        </Stack>
    )
}

// ============================================================================
// Form actions
// ============================================================================

interface FormActionsProps {
    onClassify: () => void
    onExport: () => void
    onReset: () => void
    classifyDisabled: boolean
    exportDisabled: boolean
    isProcessing: boolean
}

/** Action buttons for classification, export, and reset */
function FormActions({
    onClassify,
    onExport,
    onReset,
    classifyDisabled,
    exportDisabled,
    isProcessing,
}: FormActionsProps) {
    return (
        <Group bg="var(--mantine-color-default)" p="sm">
            <Space ml="auto" />
            <Button
                disabled={classifyDisabled}
                onClick={onClassify}
                loading={isProcessing}
            >
                Classify All
            </Button>
            <Button
                disabled={exportDisabled}
                onClick={onExport}
                leftSection={<IconDownload />}
            >
                Download Results
            </Button>
            <Button variant="outline" onClick={onReset}>
                Reset
            </Button>
            <Space mr="auto" />
        </Group>
    )
}

// ============================================================================
// Error reporting
// ============================================================================

/** Shows error banner when classification fails */
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

// ============================================================================
// File dropzone
// ============================================================================

interface FileDropProps {
    onDrop: (files: File[]) => void
    disabled?: boolean
}

const centerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'space-between',
    overflow: 'hidden',
}

/** Drag-and-drop file upload zone for JSONL files */
function FileDrop({ onDrop, disabled }: FileDropProps) {
    return (
        <Stack gap={0} w="100%">
            <Text size="sm" fw={500}>
                Upload JSONL File
            </Text>
            <Dropzone
                onDrop={onDrop}
                onReject={(files) => console.log('rejected files', files)}
                accept={{ 'text/plain': ['.jsonl'] }}
                multiple={false}
                style={centerStyle}
                disabled={disabled}
                mt="sm"
                h={120}
                p="md"
                w="100%"
                bd="1px solid var(--mantine-color-default-border)"
            >
                <Dropzone.Accept>
                    <IconUpload
                        size={36}
                        color="var(--mantine-color-blue-6)"
                        stroke={1.5}
                    />
                </Dropzone.Accept>
                <Dropzone.Reject>
                    <IconX size={36} color="var(--mantine-color-red-6)" stroke={1.5} />
                </Dropzone.Reject>
                <Dropzone.Idle>
                    <IconFile
                        size={36}
                        color="var(--mantine-color-dimmed)"
                        stroke={1.5}
                    />
                </Dropzone.Idle>

                <Box>
                    <Text inline fw={500}>
                        Drag JSONL file or click to browse
                    </Text>
                    <Text size="sm" c="dimmed" inline mt={7}>
                        File must be in JSONL format (one JSON object per line)
                    </Text>
                </Box>
            </Dropzone>
        </Stack>
    )
}

// ============================================================================
// Preview table
// ============================================================================

interface PreviewTableProps {
    items: TextItem[]
    textField: string
}

/** Table showing preview of uploaded items before classification */
function PreviewTable({ items, textField }: PreviewTableProps) {
    const extractText = (item: TextItem): string | null => {
        try {
            const data = item.originalData as Record<string, unknown>
            const value = data[textField]

            if (value === null || value === undefined) {
                return null
            }

            if (typeof value === 'string') {
                return value.substring(0, 100) // Truncate for preview
            }

            return String(value).substring(0, 100)
        } catch {
            return null
        }
    }

    return (
        <Table striped highlightOnHover>
            <Table.Thead>
                <Table.Tr>
                    <Table.Th>#</Table.Th>
                    <Table.Th>Extracted Text</Table.Th>
                    <Table.Th>Data Preview</Table.Th>
                </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
                {items.map((item, index) => {
                    const text = extractText(item)
                    return (
                        <Table.Tr key={item.id}>
                            <Table.Td>{index + 1}</Table.Td>
                            <Table.Td c={!text ? 'dimmed' : ''}>
                                {text || `[No text in field "${textField}"]`}
                            </Table.Td>
                            <Table.Td c="dimmed">
                                <code style={{ fontSize: '0.75rem' }}>
                                    {JSON.stringify(item.originalData).substring(0, 80)}
                                    ...
                                </code>
                            </Table.Td>
                        </Table.Tr>
                    )
                })}
            </Table.Tbody>
        </Table>
    )
}

// ============================================================================
// Results table
// ============================================================================

interface ResultsTableProps {
    items: ClassificationResult[]
}

/** Table displaying classification results */
function ResultsTable({ items }: ResultsTableProps) {
    return (
        <Table striped highlightOnHover>
            <Table.Thead>
                <Table.Tr>
                    <Table.Th>#</Table.Th>
                    <Table.Th>Original Text</Table.Th>
                    <Table.Th>Classification</Table.Th>
                    <Table.Th>Duration (ms)</Table.Th>
                </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
                {items.map((item, index) => (
                    <Table.Tr key={item.itemId}>
                        <Table.Td>{index + 1}</Table.Td>
                        <Table.Td>{item.originalText.substring(0, 100)}</Table.Td>
                        <Table.Td>
                            <Badge size="lg">{item.classification}</Badge>
                        </Table.Td>
                        <Table.Td>
                            {prettyMilliseconds(item.duration, { unitCount: 2 })}
                        </Table.Td>
                    </Table.Tr>
                ))}
            </Table.Tbody>
        </Table>
    )
}
