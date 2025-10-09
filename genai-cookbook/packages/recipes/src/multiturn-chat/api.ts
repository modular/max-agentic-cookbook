import { convertToModelMessages, streamText } from 'ai'
import { RecipeContext } from '../types'
import { createOpenAI } from '@ai-sdk/openai'

/*
 * This API route is the bridge between our chat surface and the provider that
 * fulfills each request. Modular MAX exposes an OpenAI-compatible interface, so
 * we can drive Modular MAX through existing Vercel AI SDK helpers.
 *
 * The client passes along the currently selected provider configuration
 * (`baseURL` + `model`). This handler uses that data to stream the assistant
 * response back to the browser in a format that `useChat` can render token by
 * token.
 */

// ============================================================================
// POST /api route — streams chat completions
// ============================================================================
export default async function POST(req: Request, context: RecipeContext) {
    const { apiKey, baseUrl, modelName } = context
    const { messages } = await req.json()
    if (!messages) {
        return new Response('Client did not provide messages', { status: 400 })
    }

    try {
        // createOpenAI returns an OpenAI-compatible client
        const client = createOpenAI({ baseURL: baseUrl, apiKey })

        // chat(modelName) works with LLM servers like MAX that
        // implement the chat-completions format
        const model = client.chat(modelName)

        const result = streamText({
            model: model,
            // Convert messages from the UIMessage format
            messages: convertToModelMessages(messages),
            // Respect the same stop sequence used by the model
            stopSequences: ['<end_of_turn>'],
        })

        // Convert the streaming result into the structure the recipe UI consumes
        return result.toUIMessageStreamResponse({
            originalMessages: messages,
        })
    } catch (error) {
        const errorMessage = error instanceof Error ? `(${error.message})` : ''
        return new Response(`Failed to generate caption ${errorMessage}`, {
            status: 424,
        })
    }
}
