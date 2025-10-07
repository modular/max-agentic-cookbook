'use client'

/*
 * This walkthrough shows how Modular MAX can share the same surface as OpenAI by
 * leaning on the Vercel AI SDK. We configure a single transport that can talk to
 * many models, stream responses token by token, and keep the UI responsive
 * the entire time.
 *
 * Mantine powers the visible shell because it ships polished primitives—such as
 * ScrollArea—that would be tedious to build from scratch. Modular's internal
 * Design Language System also layers on Mantine, so this mirrors our own
 * production ergonomics.
 *
 * Below you will find three sections: the top-level chat surface, the helpers
 * that present streamed messages, and the composer form. Comments along the way
 * trace how data and events move between the Vercel AI SDK, Modular MAX, and the
 * surrounding React components.
 */

import { useEffect, useRef, useState } from 'react'
import { DefaultChatTransport } from 'ai'
import { useChat } from '@ai-sdk/react'
import { usePathname } from 'next/navigation'
import { Box, ScrollArea } from '@mantine/core'
import { useCookbook } from '@modular/recipe-sdk/context'

// ============================================================================
// Chat surface component
// ============================================================================

/*
 * The chat surface brings everything together. It wires the Vercel AI SDK to a
 * Modular MAX-compatible transport, tracks scroll position for auto-follow, and
 * hands message data to the presentation components further down the file.
 */
export default function Recipe() {
    // Controlled value for the chat composer input.
    const [input, setInput] = useState('')

    // Route-aware API path so every recipe can host its own chat endpoint.
    const pathname = usePathname()

    // Use the currently selected endpoint so we can swap demos on the fly.
    const { selectedEndpoint, selectedModel } = useCookbook()

    // useChat from the AI SDK abstracts the streaming plumbing behind
    // a familiar React hook that's compatible with MAX.
    const { messages, sendMessage, status } = useChat({
        // We must supply a chat id tied to the pathname, endpoint, and model so
        // useChat recreates its transport once selections load instead of staying
        // bound to the initially null values.
        id: `${pathname}|${selectedEndpoint?.id ?? '?'}|${selectedModel?.id ?? '?'}`,
        transport: new DefaultChatTransport({
            api: `${pathname}/api`,
            body: {
                endpointId: selectedEndpoint?.id,
                modelName: selectedModel?.name,
            },
        }),
    })

    // Handy flag so we can disable the send button when necessary.
    const disabled =
        status === 'submitted' ||
        status === 'streaming' ||
        !selectedEndpoint ||
        !selectedModel

    // Track whether we should auto-scroll to the bottom of the conversation.
    const [followStream, setFollowStream] = useState(true)
    const viewportRef = useRef<HTMLDivElement>(null)
    const bottomRef = useRef<HTMLDivElement>(null)

    // Whenever a new message arrives, keep the latest tokens in view unless
    // we've intentionally scrolled upward to review earlier context.
    useEffect(() => {
        if (!followStream) return
        bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
    }, [messages, followStream])

    return (
        <>
            <Box style={{ flex: 1, minHeight: 0 }}>
                <ScrollArea
                    // Mantine exposes scroll info through a forwarded ref so we can detect manual scrolling.
                    h="100%"
                    type="auto"
                    viewportRef={viewportRef}
                    onScrollPositionChange={() => {
                        const el = viewportRef.current
                        if (!el) return
                        const distanceToBottom =
                            el.scrollHeight - el.scrollTop - el.clientHeight
                        const nearBottomThreshold = 4 // px
                        const nearBottom = distanceToBottom <= nearBottomThreshold

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
// Message panel types and components
// ============================================================================

/*
 * These helpers focus on rendering the chat history. They apply subtle
 * animations, label each message by role, and prepare a scroll anchor so the
 * surface can follow the newest streamed tokens coming from Modular MAX
 * through the AI SDK transport.
 */
import type { UIMessage } from 'ai'
import type { RefObject } from 'react'

/**
 * Shared props for our message history block.
 * bottomRef gives us a DOM target to scroll into view for the newest message.
 */
interface MessagesPanelProps {
    messages: UIMessage[]
    bottomRef?: RefObject<HTMLDivElement>
}

/**
 * Lists every chat exchange and injects a fade-in animation for readability.
 */
function MessagesPanel({ messages, bottomRef }: MessagesPanelProps) {
    return (
        <dl>
            {messages.map((m) => (
                // Pair the speaker label with the text body for each message in order.
                <div key={m.id} className="pb-4">
                    <MessageRole message={m} />
                    <MessageContent message={m} />
                </div>
            ))}
            <div ref={bottomRef} />

            {/* Quick CSS-in-JS block so new messages fade in as they stream. */}
            <style jsx>{`
                @keyframes fadeIn {
                    from {
                        opacity: 0;
                    }
                    to {
                        opacity: 1;
                    }
                }

                .message-fade {
                    animation: fadeIn 180ms ease-out both;
                }
            `}</style>
        </dl>
    )
}

/** Keeps type information consistent across role and content renderers. */
interface MessageContentProps {
    message: UIMessage
}

/**
 * Displays who said the message (user vs. assistant) with quick capitalization.
 */
function MessageRole({ message }: MessageContentProps) {
    return (
        <dt className="message-fade font-bold">
            {/* GenAI roles come through lowercase, so we prettify them for the UI. */}
            {message.role.charAt(0).toUpperCase() + message.role.slice(1)}
        </dt>
    )
}

/**
 * Streams message text with simple formatting that respects whitespace.
 */
function MessageContent({ message }: MessageContentProps) {
    return (
        <dd>
            <pre
                style={{ fontFamily: 'inherit' }}
                className="whitespace-pre-wrap break-words"
            >
                {/* Only render text parts so other message types (like tool calls) can be added later. */}
                {message.parts
                    .filter((p) => p.type === 'text')
                    .map((p, i) =>
                        'text' in p ? (
                            <span key={i} className="message-fade">
                                {p.text}
                            </span>
                        ) : null
                    )}
            </pre>
        </dd>
    )
}

// ============================================================================
// Composer form
// ============================================================================

/*
 * The composer accepts user prompts and invokes the `useChat` helper. It keeps
 * the input controlled, clears the text once a prompt is submitted, and
 * delegates provider-agnostic networking to the transport configured above.
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
