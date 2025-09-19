import { generateText } from 'ai'
import { createOpenAI } from '@ai-sdk/openai'
import endpointStore from '@/store/EndpointStore'

/*
 * The captioning API mirrors our multi-turn chat route but returns a single
 * string instead of a streaming response. Because Modular MAX speaks the
 * OpenAI-compatible protocol, the Vercel AI SDK can multiplex between Modular
 * and OpenAI-compatible backends without branching code.
 */

// ============================================================================
// POST /api — generates an image caption
// ============================================================================
/** Processes caption requests for either Modular MAX or OpenAI. */
export async function POST(req: Request) {
    const { messages, baseUrl, model, endpointId } = await req.json()
    const apiKey = endpointStore.apiKey(endpointId)

    if (!baseUrl || !apiKey || !model) {
        return new Response('Missing required configuration', { status: 400 })
    }

    const openai = createOpenAI({
        // baseURL identifies which provider should fulfill the request.
        baseURL: baseUrl,
        apiKey,
    })

    try {
        const { text } = await generateText({
            // generateText handles the familiar chat-completions format via the Vercel AI SDK.
            model: openai.chat(model),
            messages,
        })

        return Response.json({ text })
    } catch (error) {
        console.error('OpenAI API error:', error)
        return new Response('Failed to generate caption', { status: 500 })
    }
}
