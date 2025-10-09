import { generateText } from 'ai'
import { RecipeContext, ModelPreparationError } from '../types'

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
export default async function POST(req: Request, context: RecipeContext) {
    const { messages, endpointId, modelName } = await req.json()
    if (!messages) {
        return new Response('Client did not provide messages', { status: 400 })
    }

    let model
    try {
        model = await context.buildModel(endpointId, modelName)
    } catch (error) {
        const modelError = error as ModelPreparationError
        return new Response(modelError.message, { status: modelError.status })
    }

    try {
        const { text } = await generateText({
            // generateText handles the chat-completions format via the Vercel AI SDK.
            model: model,
            messages: messages,
        })

        return Response.json({ text })
    } catch (error) {
        const errorMessage = error instanceof Error ? `(${error.message})` : ''
        return new Response(`Failed to generate caption ${errorMessage}`, {
            status: 424,
        })
    }
}
