import { convertToModelMessages, streamText } from 'ai'
import { RecipeContext, ModelPreparationError } from '@modular/recipe-sdk/types'

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
export default async function POST(req: Request, context: RecipeContext) {
    const { messages, endpointId, modelName } = await req.json()
    if (!messages) {
        return new Response('Client did not provide messages', { status: 400 })
    }

    let model
    try {
        model = await context.prepareModel(endpointId, modelName)
    } catch (error) {
        const modelError = error as ModelPreparationError
        return new Response(modelError.message, { status: modelError.status })
    }

    try {
        const result = streamText({
            model: model,
            messages: convertToModelMessages(messages),
            // Respect the same stop sequence used by the model.
            stopSequences: ['<end_of_turn>'],
        })

        // Convert the streaming result into the structure the React UI consumes.
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
