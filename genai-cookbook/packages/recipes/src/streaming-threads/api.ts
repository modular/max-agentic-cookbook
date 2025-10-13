import { generateText } from 'ai'
import { RecipeContext } from '../types'
import { createOpenAI } from '@ai-sdk/openai'

export default async function POST(req: Request, context: RecipeContext) {
    const { apiKey, baseUrl, modelName } = context
    const { messages } = await req.json()
    if (!messages) {
        return new Response('Client did not provide messages', { status: 400 })
    }

    // Use the the Vercel AI SDK to connect to the MAX endpoint
    try {
        // createOpenAI returns an OpenAI-compatible client
        const client = createOpenAI({ baseURL: baseUrl, apiKey })

        // chat(modelName) works with LLM servers like MAX that
        // implement the chat-completions format
        const model = client.chat(modelName)

        // Finally, we call generateText to get a caption for our images
        const { text } = await generateText({
            // The recipe UI creates messages in the ModelMessage format,
            // so converting from UIMessage to ModelMessage is unnecessary
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
