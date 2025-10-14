import { generateText } from 'ai'
import { RecipeContext } from '../types'
import { createOpenAI } from '@ai-sdk/openai'

/*
 * The captioning API streams caption results as NDJSON (newline-delimited JSON).
 * For batch processing, it accepts an array of image caption requests, processes
 * them in parallel, and streams each result as it completes. This provides
 * progressive feedback to the UI as captions are generated.
 * Because Modular MAX speaks the OpenAI-compatible protocol, the Vercel AI SDK
 * works with Modular MAX out of the box.
 */

// ============================================================================
// POST /api — generates image captions and streams NDJSON results
// ============================================================================
export default async function POST(req: Request, context: RecipeContext) {
    const { apiKey, baseUrl, modelName } = context
    const body = await req.json()

    // Support both single caption requests and batch NDJSON streaming
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
            // Handle batch caption requests with NDJSON streaming
            const encoder = new TextEncoder()
            const stream = new ReadableStream({
                async start(controller) {
                    try {
                        // Process all images in parallel, stream results as they complete
                        await Promise.all(
                            body.batch.map(async (item: { imageId: string; messages: any }) => {
                                try {
                                    const { text } = await generateText({
                                        model: model,
                                        messages: item.messages,
                                    })

                                    // Send NDJSON line: one JSON object per line
                                    const line = JSON.stringify({ imageId: item.imageId, text }) + '\n'
                                    controller.enqueue(encoder.encode(line))
                                } catch (error) {
                                    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
                                    const line = JSON.stringify({
                                        imageId: item.imageId,
                                        error: errorMessage
                                    }) + '\n'
                                    controller.enqueue(encoder.encode(line))
                                }
                            })
                        )

                        controller.close()
                    } catch (error) {
                        controller.error(error)
                    }
                },
            })

            return new Response(stream, {
                headers: {
                    'Content-Type': 'application/x-ndjson',
                },
            })
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
