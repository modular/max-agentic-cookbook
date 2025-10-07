import { createOpenAI } from '@ai-sdk/openai'
import endpointStore from './store/EndpointStore'

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

/**
 * Wrapper around createModelClient that looks up endpoint data from the store.
 * This is used by recipe API handlers to prepare models.
 */
export async function prepareModel(
    endpointId: string | undefined,
    modelName: string | undefined
) {
    if (!endpointId || !modelName) {
        throw new ModelPreparationError(
            400,
            'Client did not provide endpointId and/or modelName'
        )
    }

    // Look up API key and base URL for the given endpoint ID
    let apiKey, baseURL
    try {
        apiKey = endpointStore.apiKey(endpointId)
        baseURL = endpointStore.baseUrl(endpointId)
    } catch (error) {
        const errorMessage = error instanceof Error ? `- ${error.message}` : ''
        throw new ModelPreparationError(
            424,
            `Unable to obtain apiKey and/or baseURL for endpoint ${endpointId} ${errorMessage}`
        )
    }

    // Use createModelClient to get the model
    return await createModelClient(baseURL, apiKey, modelName)
}
