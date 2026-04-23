/*
 * Code Generation with Kimi K2.5 / DeepSeek V3
 *
 * Demonstrates an agentic code generation loop with tool calling. The model can
 * call read_file to pull in source context and run_code to execute what it writes,
 * mirroring the behavior of coding agents like opencode.
 *
 * Key features:
 * - Two-panel layout: config/editor on the left, streaming output on the right
 * - Tool call log: read_file and run_code calls surface distinctly above the output
 * - System prompt textarea: directly editable, pre-filled with a sensible default
 * - Model compatibility warning: alerts when the selected model wasn't trained for code
 *
 * Architecture:
 * - useCodeGenStream: custom hook that reads the raw SSE stream directly, handling
 *   both standard text-delta events and custom tool-call / tool-result events
 * - Streamdown: syntax-highlighted code rendering as tokens arrive
 * - Model is selected via the global model selector in the toolbar
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import {
    Accordion,
    Alert,
    Badge,
    Box,
    Button,
    Code,
    Grid,
    Loader,
    Paper,
    Stack,
    Text,
    Textarea,
} from '@mantine/core'
import { IconAlertTriangle, IconFile, IconPlayerPlay } from '@tabler/icons-react'
import { Streamdown } from 'streamdown'
import type { RecipeProps } from '~/lib/types'
import styles from './code-generation.module.css'

// ============================================================================
// Constants
// ============================================================================

function isCodeOptimizedModel(modelId: string): boolean {
    const id = modelId.toLowerCase()
    return id.includes('kimi') || id.includes('deepseek')
}

const DEFAULT_SYSTEM_PROMPT = `You are an expert coding assistant. Follow these rules for every response:

- Always return code in a fenced markdown code block with the correct language identifier (e.g. \`\`\`python).
- Match the language, naming conventions, and style of any code the user provides.
- Write idiomatic, production-quality code. Prefer clarity over cleverness.
- Keep responses focused: return only the relevant function, class, or snippet — not a full file unless asked.
- Do not include explanations unless the user explicitly asks for them.
- If the request is ambiguous, make a reasonable assumption and state it in a single comment at the top of the code block.`

// ============================================================================
// Types
// ============================================================================

interface ToolEvent {
    toolCallId: string
    toolName: 'read_file' | 'run_code'
    args: Record<string, string>
    result?: string
    status: 'calling' | 'done'
}

type StreamStatus = 'idle' | 'submitted' | 'streaming' | 'error'

// ============================================================================
// Custom streaming hook
// ============================================================================

/*
 * Reads the raw SSE stream from /api/recipes/code-generation, parsing both the
 * standard text-delta events and the custom tool-call / tool-result events that
 * useChat + DefaultChatTransport would silently discard.
 */
function useCodeGenStream({
    endpointId,
    modelName,
    systemPrompt,
}: {
    endpointId: string | undefined
    modelName: string
    systemPrompt: string
}) {
    const [output, setOutput] = useState('')
    const [toolEvents, setToolEvents] = useState<ToolEvent[]>([])
    const [status, setStatus] = useState<StreamStatus>('idle')
    const abortRef = useRef<AbortController | null>(null)

    const clear = useCallback(() => {
        abortRef.current?.abort()
        setOutput('')
        setToolEvents([])
        setStatus('idle')
    }, [])

    const send = useCallback(
        async (message: string) => {
            abortRef.current?.abort()
            const controller = new AbortController()
            abortRef.current = controller

            setOutput('')
            setToolEvents([])
            setStatus('submitted')

            try {
                const response = await fetch('/api/recipes/code-generation', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        endpointId,
                        modelName,
                        systemPrompt,
                        messages: [
                            {
                                id: `msg-${Date.now()}`,
                                role: 'user',
                                parts: [{ type: 'text', text: message }],
                            },
                        ],
                    }),
                    signal: controller.signal,
                })

                if (!response.ok || !response.body) {
                    setStatus('error')
                    return
                }

                setStatus('streaming')

                const reader = response.body.getReader()
                const decoder = new TextDecoder()
                let buffer = ''

                while (true) {
                    const { done, value } = await reader.read()
                    if (done) break

                    buffer += decoder.decode(value, { stream: true })
                    const lines = buffer.split('\n')
                    buffer = lines.pop() ?? ''

                    for (const line of lines) {
                        if (!line.startsWith('data: ')) continue
                        const raw = line.slice(6).trim()
                        if (raw === '[DONE]') break

                        try {
                            const event = JSON.parse(raw)

                            if (event.type === 'text-delta') {
                                setOutput((prev) => prev + event.delta)
                            } else if (event.type === 'tool-call') {
                                setToolEvents((prev) => [
                                    ...prev,
                                    {
                                        toolCallId: event.toolCallId,
                                        toolName: event.toolName,
                                        args: event.args,
                                        status: 'calling',
                                    },
                                ])
                            } else if (event.type === 'tool-result') {
                                setToolEvents((prev) =>
                                    prev.map((te) =>
                                        te.toolCallId === event.toolCallId
                                            ? { ...te, result: event.result, status: 'done' }
                                            : te
                                    )
                                )
                            } else if (event.type === 'finish') {
                                setStatus('idle')
                            } else if (event.type === 'error') {
                                setStatus('error')
                            }
                        } catch {
                            // Malformed JSON line — skip
                        }
                    }
                }
            } catch (err: unknown) {
                if (err instanceof Error && err.name !== 'AbortError') {
                    setStatus('error')
                }
            }
        },
        [endpointId, modelName, systemPrompt]
    )

    // Abort any in-flight request on unmount.
    useEffect(() => () => abortRef.current?.abort(), [])

    return { output, toolEvents, status, send, clear }
}

// ============================================================================
// Main component
// ============================================================================

export function Component({ endpoint, model, pathname: _pathname }: RecipeProps) {
    const [systemPrompt, setSystemPrompt] = useState(DEFAULT_SYSTEM_PROMPT)
    const [input, setInput] = useState('')

    const isIncompatibleModel = !!model && !isCodeOptimizedModel(model.id)

    const { output, toolEvents, status, send, clear } = useCodeGenStream({
        endpointId: endpoint?.id,
        modelName: model?.name ?? '',
        systemPrompt,
    })

    const disabled = status === 'submitted' || status === 'streaming' || !endpoint || !model

    const handleSend = (value: string) => {
        clear()
        send(value)
        setInput('')
    }

    return (
        <Stack gap="xs" h="100%" style={{ overflow: 'hidden' }}>
            {isIncompatibleModel && (
                <Alert
                    icon={<IconAlertTriangle size={16} />}
                    color="yellow"
                    title="Model not optimized for code generation"
                >
                    {model.name} was not trained specifically for code tasks. For best results,
                    select <strong>Kimi K2.5</strong> or <strong>DeepSeek V3</strong> from the
                    model dropdown.
                </Alert>
            )}

            <Grid gutter="md" style={{ flex: 1, overflow: 'hidden', minHeight: 0 }}>
                <Grid.Col span={4} style={{ display: 'flex', flexDirection: 'column' }}>
                    <ConfigPanel
                        systemPrompt={systemPrompt}
                        setSystemPrompt={setSystemPrompt}
                        input={input}
                        setInput={setInput}
                        disabled={disabled}
                        onSend={handleSend}
                    />
                </Grid.Col>

                <Grid.Col span={8} style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                    <OutputPanel
                        output={output}
                        toolEvents={toolEvents}
                        status={status}
                    />
                </Grid.Col>
            </Grid>
        </Stack>
    )
}

// ============================================================================
// Config panel
// ============================================================================

interface ConfigPanelProps {
    systemPrompt: string
    setSystemPrompt: (v: string) => void
    input: string
    setInput: (v: string) => void
    disabled: boolean
    onSend: (value: string) => void
}

function ConfigPanel({ systemPrompt, setSystemPrompt, input, setInput, disabled, onSend }: ConfigPanelProps) {
    return (
        <form
            style={{ display: 'flex', flexDirection: 'column', gap: 12, height: '100%' }}
            onSubmit={(e) => {
                e.preventDefault()
                const value = input.trim()
                if (!value) return
                onSend(value)
            }}
        >
            <Textarea
                label="System prompt"
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.currentTarget.value)}
                minRows={4}
                autosize
            />

            <Textarea
                label="Prompt"
                placeholder="Ask for code, paste a snippet to extend, or describe what you need..."
                value={input}
                onChange={(e) => setInput(e.currentTarget.value)}
                minRows={6}
                style={{ flex: 1 }}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                        e.preventDefault()
                        const value = input.trim()
                        if (!value || disabled) return
                        onSend(value)
                    }
                }}
            />

            <Button type="submit" variant="filled" disabled={disabled || !input.trim()} fullWidth>
                Generate
            </Button>
        </form>
    )
}

// ============================================================================
// Tool call log
// ============================================================================

const TOOL_ICONS: Record<string, React.ReactNode> = {
    read_file: <IconFile size={14} />,
    run_code: <IconPlayerPlay size={14} />,
}

function ToolCallLog({ events }: { events: ToolEvent[] }) {
    if (events.length === 0) return null

    return (
        <Accordion variant="separated" chevronPosition="right">
            {events.map((event) => {
                const argSummary =
                    event.toolName === 'read_file'
                        ? event.args.path
                        : (event.args.code ?? '').split('\n')[0].slice(0, 60)

                return (
                    <Accordion.Item key={event.toolCallId} value={event.toolCallId}>
                        <Accordion.Control>
                            <Box style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                {TOOL_ICONS[event.toolName]}
                                <Text size="sm" fw={500}>{event.toolName}</Text>
                                <Text size="sm" c="dimmed" style={{ fontFamily: 'monospace' }}>
                                    {argSummary}
                                </Text>
                                {event.status === 'calling' && <Loader size={12} />}
                                {event.status === 'done' && (
                                    <Badge size="xs" color="green" variant="light">done</Badge>
                                )}
                            </Box>
                        </Accordion.Control>
                        <Accordion.Panel>
                            {event.result !== undefined && (
                                <Code block style={{ whiteSpace: 'pre-wrap', fontSize: 12 }}>
                                    {event.result}
                                </Code>
                            )}
                        </Accordion.Panel>
                    </Accordion.Item>
                )
            })}
        </Accordion>
    )
}

// ============================================================================
// Output panel
// ============================================================================

const STATUS_PROPS: Record<StreamStatus, { label: string; color: string; loading?: boolean }> = {
    idle:      { label: 'Ready',      color: 'gray' },
    submitted: { label: 'Waiting…',   color: 'blue', loading: true },
    streaming: { label: 'Generating', color: 'green', loading: true },
    error:     { label: 'Error',      color: 'red' },
}

interface OutputPanelProps {
    output: string
    toolEvents: ToolEvent[]
    status: StreamStatus
}

function OutputPanel({ output, toolEvents, status }: OutputPanelProps) {
    const { label, color, loading } = STATUS_PROPS[status]
    const [followStream, setFollowStream] = useState(true)
    const viewportRef = useRef<HTMLDivElement>(null)
    const bottomRef = useRef<HTMLDivElement>(null)
    const isAutoScrolling = useRef(false)

    useEffect(() => {
        if (!followStream) return
        isAutoScrolling.current = true
        bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
        const timer = setTimeout(() => { isAutoScrolling.current = false }, 100)
        return () => clearTimeout(timer)
    }, [output, followStream])

    return (
        <Paper
            h="100%"
            p="sm"
            withBorder
            style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: 8 }}
        >
            <Box style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Badge color={color} variant="light" size="sm">{label}</Badge>
                {loading && <Loader size={12} color={color} />}
            </Box>

            {/* Tool call log sits outside the ScrollArea so it's always visible
                and never buried by auto-scroll to the output below. The maxHeight
                prevents it from inflating the panel and pushing the left column's
                Generate button out of position. */}
            {toolEvents.length > 0 && (
                <Box style={{ maxHeight: 200, overflowY: 'auto', flexShrink: 0 }}>
                    <ToolCallLog events={toolEvents} />
                </Box>
            )}

            <div
                ref={viewportRef}
                style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}
                onScroll={() => {
                    const el = viewportRef.current
                    if (!el) return
                    const distanceToBottom = el.scrollHeight - el.scrollTop - el.clientHeight
                    if (isAutoScrolling.current && distanceToBottom > 50) {
                        isAutoScrolling.current = false
                        setFollowStream(false)
                        return
                    }
                    if (isAutoScrolling.current) return
                    setFollowStream(distanceToBottom <= 20)
                }}
            >
                {output ? (
                    <Box className={styles.codeOutput}>
                        <Streamdown
                            controls={false}
                            shikiTheme={['material-theme-lighter', 'material-theme-darker']}
                        >
                            {output}
                        </Streamdown>
                    </Box>
                ) : (
                    toolEvents.length === 0 && (
                        <Text c="dimmed" size="sm" style={{ padding: 8 }}>
                            Output will appear here as tokens stream in.
                        </Text>
                    )
                )}
                <div ref={bottomRef} />
            </div>
        </Paper>
    )
}
