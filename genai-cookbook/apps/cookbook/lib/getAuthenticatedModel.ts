import { createOpenAI } from '@ai-sdk/openai'
import type { LanguageModel } from 'ai'
import endpointStore from './EndpointStore'

export class ModelPreparationError extends Error {
    status: number

    constructor(status: number, message: string) {
        super(message)
        this.name = 'ModelPreparationError'
        this.status = status
    }
}

/**
 * Gets an authenticated model client by looking up endpoint configuration from the store.
 * This is used by recipe API handlers to obtain authenticated models.
 */
export async function getAuthenticatedModel(
    endpointId: string | undefined,
    modelName: string | undefined
): Promise<LanguageModel> {
    if (!endpointId || !modelName) {
        throw new ModelPreparationError(
            400,
            'Client did not provide endpointId and/or modelName'
        )
    }

    // Look up API key and base URL for the given endpoint ID
    const apiKey = endpointStore.apiKey(endpointId)
    const baseUrl = endpointStore.baseUrl(endpointId)

    if (!baseUrl || !apiKey) {
        throw new ModelPreparationError(
            424,
            `Unable to obtain apiKey and/or baseURL for endpoint ${endpointId}`
        )
    }

    // Obtain an OpenAI-compatible model provider
    try {
        // `openai.chat(model)` returns a model chat completions handle
        const client = createOpenAI({ baseURL: baseUrl, apiKey })
        return client.chat(modelName)
    } catch (error) {
        const errorMessage = error instanceof Error ? `(${error.message})` : ''
        throw new ModelPreparationError(
            502,
            `Problem obtaining model provider ${errorMessage}`
        )
    }
}
