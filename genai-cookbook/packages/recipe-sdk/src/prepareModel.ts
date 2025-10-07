import { createOpenAI } from '@ai-sdk/openai'

export class ModelPreparationError extends Error {
    status: number

    constructor(status: number, message: string) {
        super(message)
        this.name = 'ModelPreparationError'
        this.status = status
    }
}

export async function createModelClient(
    baseUrl: string | undefined,
    apiKey: string | undefined,
    modelName: string | undefined
) {
    if (!baseUrl || !apiKey || !modelName) {
        throw new ModelPreparationError(
            400,
            'Must provide baseUrl, apiKey, and modelName'
        )
    }

    // Obtain an OpenAI-compatible model provider
    let model
    try {
        // `openai.chat(model)` returns a model chat completions handle
        const client = createOpenAI({ baseURL: baseUrl, apiKey })
        model = client.chat(modelName)
    } catch (error) {
        const errorMessage = error instanceof Error ? `(${error.message})` : ''
        throw new ModelPreparationError(
            502,
            `Problem obtaining model provider ${errorMessage}`
        )
    }

    return model
}
