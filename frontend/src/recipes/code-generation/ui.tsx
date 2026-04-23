/*
 * Code Generation with Kimi K2.5 / DeepSeek V3
 *
 * Demonstrates streaming code generation with a configurable system prompt.
 * The system prompt is the primary lever for real code generation workflows:
 * it sets the language, style, and project context the model responds in.
 *
 * Key features:
 * - Two-panel layout: config/editor on the left, streaming output on the right
 * - System prompt textarea: directly editable, pre-filled with a sensible default
 * - Model compatibility warning: alerts when the selected model wasn't trained for code
 * - Streamdown: syntax-highlighted code rendering as tokens arrive
 *
 * Architecture:
 * - useChat hook (Vercel AI SDK): manages streaming state and transport
 * - DefaultChatTransport: routes to /api/recipes/code-generation with systemPrompt in body
 * - Model is selected via the global model selector in the toolbar
 */

import { useEffect, useRef, useState } from 'react'
import { DefaultChatTransport } from 'ai'
import { useChat } from '@ai-sdk/react'
import {
    Alert,
    Box,
    Button,
    Grid,
    Paper,
    ScrollArea,
    Stack,
    Text,
    Textarea,
} from '@mantine/core'
import { IconAlertTriangle } from '@tabler/icons-react'
import type { RecipeProps } from '~/lib/types'

function isCodeOptimizedModel(modelId: string): boolean {
    const id = modelId.toLowerCase()
    return id.includes('kimi') || id.includes('deepseek')
}

const DEFAULT_SYSTEM_PROMPT =
    'You are a code assistant. Respond only with code unless asked to explain. Use the language and style of the surrounding context.'

// ============================================================================
// Main component
// ============================================================================

export function Component({ endpoint, model, pathname }: RecipeProps) {
    const [systemPrompt, setSystemPrompt] = useState(DEFAULT_SYSTEM_PROMPT)
    const [input, setInput] = useState('')

    const modelName = model?.name ?? ''
    const isIncompatibleModel = !!model && !isCodeOptimizedModel(model.id)

    // Include systemPrompt in the chat id so useChat resets when the prompt changes.
    const chatId = `${pathname}|${endpoint?.id ?? '?'}|${model?.id ?? '?'}|${systemPrompt.slice(0, 40)}`

    const { messages, sendMessage, status } = useChat({
        id: chatId,
        transport: new DefaultChatTransport({
            api: '/api/recipes/code-generation',
            body: {
                endpointId: endpoint?.id,
                modelName,
                systemPrompt,
            },
        }),
    })

    const disabled =
        status === 'submitted' || status === 'streaming' || !endpoint || !model

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
                {/* Left panel: configuration */}
                <Grid.Col span={4} style={{ display: 'flex', flexDirection: 'column' }}>
                    <ConfigPanel
                        systemPrompt={systemPrompt}
                        setSystemPrompt={setSystemPrompt}
                        input={input}
                        setInput={setInput}
                        disabled={disabled}
                        onSend={(v) => sendMessage({ text: v })}
                    />
                </Grid.Col>

                {/* Right panel: streaming output */}
                <Grid.Col span={8} style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                    <OutputPanel messages={messages} />
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
    onSend: (value: string) => Promise<void>
}

function ConfigPanel({
    systemPrompt,
    setSystemPrompt,
    input,
    setInput,
    disabled,
    onSend,
}: ConfigPanelProps) {
    return (
        <form
            style={{ display: 'flex', flexDirection: 'column', gap: 12, height: '100%' }}
            onSubmit={async (e) => {
                e.preventDefault()
                const value = input.trim()
                if (!value) return
                setInput('')
                await onSend(value)
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
                        setInput('')
                        onSend(value)
                    }
                }}
            />

            <Button
                type="submit"
                variant="filled"
                disabled={disabled || !input.trim()}
                fullWidth
            >
                Generate
            </Button>
        </form>
    )
}

// ============================================================================
// Output panel
// ============================================================================

import type { UIMessage } from 'ai'
import { Streamdown } from 'streamdown'

interface OutputPanelProps {
    messages: UIMessage[]
}

function OutputPanel({ messages }: OutputPanelProps) {
    const [followStream, setFollowStream] = useState(true)
    const viewportRef = useRef<HTMLDivElement>(null)
    const bottomRef = useRef<HTMLDivElement>(null)
    const isAutoScrolling = useRef(false)

    useEffect(() => {
        if (!followStream) return

        isAutoScrolling.current = true
        bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })

        const timer = setTimeout(() => {
            isAutoScrolling.current = false
        }, 100)

        return () => clearTimeout(timer)
    }, [messages, followStream])

    const assistantMessages = messages.filter((m) => m.role === 'assistant')

    return (
        <Paper h="100%" p="sm" withBorder style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <ScrollArea
                h="100%"
                type="auto"
                viewportRef={viewportRef}
                onScrollPositionChange={() => {
                    const el = viewportRef.current
                    if (!el) return

                    const distanceToBottom = el.scrollHeight - el.scrollTop - el.clientHeight
                    const nearBottom = distanceToBottom <= 20

                    if (isAutoScrolling.current && distanceToBottom > 50) {
                        isAutoScrolling.current = false
                        setFollowStream(false)
                        return
                    }

                    if (isAutoScrolling.current) return

                    setFollowStream(nearBottom)
                }}
            >
                {assistantMessages.length === 0 ? (
                    <Text c="dimmed" size="sm" style={{ padding: 8 }}>
                        Output will appear here as tokens stream in.
                    </Text>
                ) : (
                    <Stack gap="md">
                        {assistantMessages.map((message) =>
                            message.parts
                                .filter((part) => part.type === 'text')
                                .map((part, index) => (
                                    <Streamdown
                                        key={`${message.id}-${index}`}
                                        controls={false}
                                        shikiTheme={[
                                            'material-theme-lighter',
                                            'material-theme-darker',
                                        ]}
                                    >
                                        {part.text}
                                    </Streamdown>
                                ))
                        )}
                    </Stack>
                )}
                <Box ref={bottomRef} />
            </ScrollArea>
        </Paper>
    )
}
