import { generateText } from 'ai'
import { createOpenAI } from '@ai-sdk/openai'
import endpointStore from '@/store/EndpointStore'

/*
 * The captioning API mirrors our multi-turn chat route but returns a single
 * string instead of a streaming response. Because Modular MAX speaks the
 * OpenAI-compatible protocol, the Vercel AI SDK can works with Modular MAX
 * out of the box.
 */

// ============================================================================
// POST /api — generates an image caption
// ============================================================================
/** Processes caption requests for either Modular MAX or OpenAI. */
export async function POST(req: Request) {
    const { messages, modelName, endpointId } = await req.json()
    const apiKey = endpointStore.apiKey(endpointId)
    const baseURL = endpointStore.apiKey(endpointId)

    if (!baseURL || !apiKey || !modelName) {
        return new Response('Problem with baseURL, apiKey, or modelName', {
            status: 422,
        })
    }

    const openai = createOpenAI({
        // baseURL identifies which provider should fulfill the request.
        baseURL,
        apiKey,
    })

    try {
        const { text } = await generateText({
            // generateText handles the familiar chat-completions format via the Vercel AI SDK.
            model: openai.chat(modelName),
            messages,
        })

        return Response.json({ text })
    } catch (error) {
        console.error('OpenAI API error:', error)
        return new Response('Failed to generate caption', { status: 500 })
    }
}
