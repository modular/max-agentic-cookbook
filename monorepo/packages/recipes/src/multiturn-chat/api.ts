import { convertToModelMessages, streamText } from 'ai'
import { RecipeContext } from '../types'
import { createOpenAI } from '@ai-sdk/openai'

/*
 * Multi-turn Chat API with Token Streaming
 *
 * This API route streams chat completions from Modular MAX or any OpenAI-compatible
 * endpoint. The Vercel AI SDK handles message conversion, streaming, and response
 * formatting for seamless client-side consumption.
 *
 * Key features:
 * - Token streaming: Response text streams progressively to the client
 * - Message conversion: UIMessage format → model-compatible format
 * - OpenAI-compatible: Works with Modular MAX, OpenAI, or other compatible servers
 * - Stop sequences: Configurable end-of-turn markers for generation control
 */
export default async function POST(req: Request, context: RecipeContext) {
    const { apiKey, baseUrl, modelName } = context
    const { messages } = await req.json()
    if (!messages) {
        return new Response('Client did not provide messages', { status: 400 })
    }

    try {
        // The Vercel AI SDK's createOpenAI works with any OpenAI-compatible endpoint
        const client = createOpenAI({ baseURL: baseUrl, apiKey })
        const model = client.chat(modelName)

        // Stream chat completion with message format conversion
        const result = streamText({
            model: model,
            // convertToModelMessages transforms UIMessage → model-compatible format
            messages: convertToModelMessages(messages),
            // Stop sequences control when generation should end
            stopSequences: ['<end_of_turn>'],
        })

        // toUIMessageStreamResponse formats the stream for client-side useChat hook
        return result.toUIMessageStreamResponse({
            originalMessages: messages,
        })
    } catch (error) {
        const errorMessage = error instanceof Error ? `(${error.message})` : ''
        return new Response(`Failed to stream chat completion ${errorMessage}`, {
            status: 424,
        })
    }
}
