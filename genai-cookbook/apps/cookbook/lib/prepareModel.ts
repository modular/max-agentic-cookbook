import { createModelClient, ModelPreparationError } from '@modular/recipe-sdk/prepareModel'
import endpointStore from '@/store/EndpointStore'

export { ModelPreparationError }

/**
 * Wrapper around recipe-sdk's createModelClient that looks up endpoint data from the store.
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

    // Use createModelClient from recipe-sdk
    return await createModelClient(baseURL, apiKey, modelName)
}
