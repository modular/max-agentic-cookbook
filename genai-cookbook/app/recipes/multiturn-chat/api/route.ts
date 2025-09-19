import { streamText, convertToModelMessages } from 'ai'
import { createOpenAI } from '@ai-sdk/openai'
import endpointStore from '@/store/EndpointStore'

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
/** Handles chat completions for Modular MAX via compatibility with OpenAI. */
export async function POST(req: Request) {
    const { messages, baseURL, model, id } = await req.json()

    // Pull the endpoint ID from the ID that we created for the useChat hook
    const endpointId = id.split('::')[1]
    const apiKey = endpointStore.apiKey(endpointId)

    if (!baseURL || !apiKey || !model) {
        return new Response('Missing required configuration', { status: 400 })
    }

    const openai = createOpenAI({
        // baseURL can point at Modular MAX, OpenAI, or any OpenAI-compatible host.
        baseURL,
    })

    const result = streamText({
        // `openai.chat(model)` returns a model handle that stays compatible across providers.
        model: openai.chat(model),
        // model: openai.chat('google/gemma-3-27b-it'),
        // Normalize incoming UI messages into the format the SDK expects.
        messages: convertToModelMessages(messages),
        // Respect the same stop sequence used by Modular MAX models.
        stopSequences: ['<end_of_turn>'],
    })

    // Convert the streaming result into the structure the React UI consumes.
    return result.toUIMessageStreamResponse({ originalMessages: messages })
}
