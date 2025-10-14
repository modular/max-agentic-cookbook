import { generateText } from 'ai'
import { RecipeContext } from '../types'
import { createOpenAI } from '@ai-sdk/openai'

/*
 * Image Captioning API with NDJSON Streaming
 *
 * This API demonstrates progressive response streaming using NDJSON (newline-delimited JSON).
 * Instead of waiting for all captions to complete, we stream each result as it's generated,
 * providing immediate feedback to users.
 *
 * Key concepts:
 * - NDJSON format: One JSON object per line, easy to parse progressively
 * - Parallel processing: All images caption simultaneously for speed
 * - Stream-as-you-go: Results appear in the UI the moment they're ready
 * - OpenAI-compatible: Works with Modular MAX or any OpenAI-compatible server
 */

export default async function POST(req: Request, context: RecipeContext) {
    const { apiKey, baseUrl, modelName } = context
    const body = await req.json()

    const isBatch = Array.isArray(body.batch)

    if (!isBatch && !body.messages) {
        return new Response('Client did not provide messages or batch', { status: 400 })
    }

    try {
        // The Vercel AI SDK's createOpenAI works with any OpenAI-compatible endpoint
        const client = createOpenAI({ baseURL: baseUrl, apiKey })
        const model = client.chat(modelName)

        if (isBatch) {
            // NDJSON streaming: send results progressively as they complete
            const encoder = new TextEncoder()
            const stream = new ReadableStream({
                async start(controller) {
                    try {
                        // Process all images in parallel using Promise.all
                        // As each caption completes, we immediately stream it to the client
                        await Promise.all(
                            body.batch.map(async (item: { imageId: string; messages: any }) => {
                                try {
                                    // Generate caption using Vercel AI SDK
                                    const { text } = await generateText({
                                        model: model,
                                        messages: item.messages,
                                    })

                                    // NDJSON format: JSON object + newline
                                    // Client can parse each line as soon as it arrives
                                    const line = JSON.stringify({ imageId: item.imageId, text }) + '\n'
                                    controller.enqueue(encoder.encode(line))
                                } catch (error) {
                                    // Send errors per-image so UI can show partial results
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
            // Single caption request: return JSON immediately (no streaming needed)
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
