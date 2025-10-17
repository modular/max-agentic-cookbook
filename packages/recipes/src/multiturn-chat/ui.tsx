'use client'

/*
 * Multi-turn Chat with Token Streaming
 *
 * This recipe demonstrates how to build a chat interface that works with Modular MAX
 * or any OpenAI-compatible endpoint using the Vercel AI SDK. Messages stream token-by-token
 * for fluid, real-time responses.
 *
 * Key features:
 * - Token streaming: Response text appears progressively as it's generated
 * - Auto-scroll: Automatically follows new messages with smart manual scroll detection
 * - Streamdown: Renders markdown with syntax-highlighted code blocks
 * - Conversation history: Multi-turn context maintained across messages
 * - Mantine UI: Polished components (ScrollArea, forms) for production-ready UX
 *
 * Architecture:
 * - useChat hook (Vercel AI SDK): Manages streaming, message state, and transport
 * - DefaultChatTransport: Routes requests to the selected OpenAI-compatible endpoint
 * - Streamdown component: Renders streamed markdown with Shiki syntax highlighting
 */

import { useEffect, useRef, useState } from 'react'
import { DefaultChatTransport } from 'ai'
import { useChat } from '@ai-sdk/react'
import { Box, Paper, ScrollArea, Space, Stack, Text } from '@mantine/core'
import { RecipeProps } from '../types'

// ============================================================================
// Chat surface component
// ============================================================================

/*
 * Main chat component: wires the Vercel AI SDK to an OpenAI-compatible transport,
 * tracks scroll position for auto-follow behavior, and manages message state.
 */
export default function Recipe({ endpoint, model, pathname }: RecipeProps) {
    // Controlled value for the chat composer input.
    const [input, setInput] = useState('')

    // useChat from the AI SDK abstracts the streaming plumbing behind
    // a familiar React hook that's compatible with MAX.
    const { messages, sendMessage, status } = useChat({
        // We must supply a chat id tied to the pathname, endpoint, and model so
        // useChat recreates its transport once selections load instead of staying
        // bound to the initially null values.
        id: `${pathname}|${endpoint?.id ?? '?'}|${model?.id ?? '?'}`,
        transport: new DefaultChatTransport({
            api: `${pathname}/api`,
            body: {
                endpointId: endpoint?.id,
                modelName: model?.name,
            },
        }),
    })

    // Handy flag so we can disable the send button when necessary.
    const disabled =
        status === 'submitted' || status === 'streaming' || !endpoint || !model

    // Track whether we should auto-scroll to the bottom of the conversation.
    const [followStream, setFollowStream] = useState(true)
    const viewportRef = useRef<HTMLDivElement>(null)
    const bottomRef = useRef<HTMLDivElement>(null)
    const isAutoScrolling = useRef(false)

    // Whenever a new message arrives, keep the latest tokens in view unless
    // we've intentionally scrolled upward to review earlier context.
    useEffect(() => {
        if (!followStream) return

        // Mark that we're about to programmatically scroll
        isAutoScrolling.current = true
        bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })

        // Clear the flag after scroll animation starts (~100ms is enough)
        const timer = setTimeout(() => {
            isAutoScrolling.current = false
        }, 100)

        return () => clearTimeout(timer)
    }, [messages, followStream])

    return (
        <>
            <Box style={{ flex: 1, minHeight: 0 }}>
                <ScrollArea
                    // Mantine exposes scroll info through a forwarded ref
                    // so we can detect manual scrolling.
                    h="100%"
                    type="auto"
                    viewportRef={viewportRef}
                    onScrollPositionChange={() => {
                        const el = viewportRef.current
                        if (!el) return

                        const distanceToBottom =
                            el.scrollHeight - el.scrollTop - el.clientHeight
                        const nearBottomThreshold = 20 // px
                        const nearBottom = distanceToBottom <= nearBottomThreshold

                        // If user has clearly scrolled away (>50px from bottom),
                        // they want to stop following - even during auto-scroll
                        if (isAutoScrolling.current && distanceToBottom > 50) {
                            isAutoScrolling.current = false
                            setFollowStream(false)
                            return
                        }

                        // Don't interfere with programmatic auto-scroll when close to bottom
                        if (isAutoScrolling.current) return

                        // Pause auto-follow when the user scrolls up to read older content.
                        setFollowStream(nearBottom)
                    }}
                >
                    <MessagesPanel messages={messages} bottomRef={bottomRef} />
                </ScrollArea>
            </Box>

            <Composer
                // Hand off controlled state and send handler to the composer form.
                input={input}
                setInput={setInput}
                disabled={disabled}
                onSend={(v) => sendMessage({ text: v })}
            />
        </>
    )
}

// ============================================================================
// Message panel
// ============================================================================

/*
 * Renders chat history with Streamdown for markdown formatting and syntax highlighting.
 * Provides a scroll anchor for auto-follow behavior as new tokens stream in.
 */
import type { UIMessage } from 'ai'
import type { RefObject } from 'react'
import { Streamdown } from 'streamdown'

/**
 * Shared props for our message history block.
 * bottomRef gives us a DOM target to scroll into view for the newest message.
 */
interface MessagesPanelProps {
    messages: UIMessage[]
    bottomRef?: RefObject<HTMLDivElement>
}

/**
 * Displays chat messages using Streamdown for markdown rendering with syntax highlighting.
 * Streamdown is part of the Vercel AI SDK ecosystem for rendering streamed text.
 */
function MessagesPanel({ messages, bottomRef }: MessagesPanelProps) {
    return (
        <Stack align="flex-start" justify="flex-start" gap="sm">
            {messages.map((message) => (
                // The outer loop maps each message from the user or assistant
                <Box key={message.id} w="100%">
                    <Text fw="bold" tt="capitalize">
                        {message.role}
                    </Text>
                    <Paper>
                        {message.parts
                            // The inner loop maps each message part, with support
                            // for streaming responses from the LLM
                            .filter((part) => part.type === 'text')
                            .map((part, index) => (
                                <Streamdown
                                    controls={false}
                                    shikiTheme={[
                                        'material-theme-lighter',
                                        'material-theme-darker',
                                    ]}
                                    key={index}
                                >
                                    {part.text}
                                </Streamdown>
                            ))}
                    </Paper>
                    <Space h="xs" />
                </Box>
            ))}
            <Box ref={bottomRef} />
        </Stack>
    )
}

// ============================================================================
// Composer form
// ============================================================================

/*
 * Composer form: accepts user prompts and triggers message submission.
 * Controlled input is cleared on send, with networking delegated to useChat transport.
 */
import { Button, Group, Input } from '@mantine/core'

/** Simple contract for wiring the composer to the parent component. */
interface ComposerProps {
    input: string
    setInput: (v: string) => void
    disabled: boolean
    onSend: (value: string) => Promise<void>
}

/**
 * Presents a straightforward text prompt form that triggers the GenAI request.
 */
function Composer({ input, setInput, disabled, onSend }: ComposerProps) {
    return (
        <form
            onSubmit={async (e) => {
                e.preventDefault()
                const value = input.trim()
                if (!value) return

                // Clear the field immediately so it's obvious the prompt was accepted.
                setInput('')

                // useChat handles the request/response cycle once we pass the cleaned value in.
                await onSend(value)
            }}
        >
            <Group w="100%" gap="sm" wrap="nowrap">
                <Input
                    value={input}
                    onChange={(e) => setInput(e.currentTarget.value)}
                    placeholder="Type a message..."
                    flex={1}
                />
                <Button
                    variant="filled"
                    type="submit"
                    disabled={disabled || !input.trim()}
                >
                    Send
                </Button>
            </Group>
        </form>
    )
}
