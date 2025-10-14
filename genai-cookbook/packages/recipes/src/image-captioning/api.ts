import { generateText } from 'ai'
import { RecipeContext } from '../types'
import { createOpenAI } from '@ai-sdk/openai'

/*
 * The captioning API can handle both single and batch caption requests.
 * For batch processing, it accepts an array of image caption requests and
 * processes them in parallel, returning results mapped by image ID.
 * Because Modular MAX speaks the OpenAI-compatible protocol, the Vercel AI SDK
 * works with Modular MAX out of the box.
 */

// ============================================================================
// POST /api — generates image captions (single or batch)
// ============================================================================
export default async function POST(req: Request, context: RecipeContext) {
    const { apiKey, baseUrl, modelName } = context
    const body = await req.json()

    // Support both single caption requests and batch requests
    const isBatch = Array.isArray(body.batch)

    if (!isBatch && !body.messages) {
        return new Response('Client did not provide messages or batch', { status: 400 })
    }

    // Use the Vercel AI SDK to connect to the MAX endpoint
    try {
        // createOpenAI returns an OpenAI-compatible client
        const client = createOpenAI({ baseURL: baseUrl, apiKey })

        // chat(modelName) works with LLM servers like MAX that
        // implement the chat-completions format
        const model = client.chat(modelName)

        if (isBatch) {
            // Handle batch caption requests
            const results = await Promise.all(
                body.batch.map(async (item: { imageId: string; messages: any }) => {
                    try {
                        const { text } = await generateText({
                            model: model,
                            messages: item.messages,
                        })
                        return { imageId: item.imageId, text }
                    } catch (error) {
                        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
                        return { imageId: item.imageId, error: errorMessage }
                    }
                })
            )
            return Response.json({ results })
        } else {
            // Handle single caption request (backward compatibility)
            const { text } = await generateText({
                model: model,
                messages: body.messages,
            })
            return Response.json({ text })
        }
    } catch (error) {
        const errorMessage = error instanceof Error ? `(${error.message})` : ''
        return new Response(`Failed to generate caption ${errorMessage}`, {
            status: 424,
        })
    }
}
