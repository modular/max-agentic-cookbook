import { Endpoint } from '@modular/recipes/lib/types'
import { createOpenAI } from '@ai-sdk/openai'
import type { LanguageModel } from 'ai'

// Only store the API key server side
interface EndpointWithApiKey extends Endpoint {
    apiKey: string
}

type ServerSideEndpoints = EndpointWithApiKey[] | null

export class ModelPreparationError extends Error {
    status: number

    constructor(status: number, message: string) {
        super(message)
        this.name = 'ModelPreparationError'
        this.status = status
    }
}

// Store endpoints server-side in memory to access them across routes
class EndpointStore {
    private endpoints: ServerSideEndpoints = null

    getAll(): ServerSideEndpoints {
        return this.endpoints
    }

    set(newEndpoints: ServerSideEndpoints) {
        this.endpoints = newEndpoints
    }

    apiKey(endpointId: string | null | undefined): string | undefined {
        const endpoint = this.endpoints?.find((e) => e.id === endpointId)
        return endpoint?.apiKey
    }

    baseUrl(endpointId: string | null | undefined): string | undefined {
        const endpoint = this.endpoints?.find((e) => e.id === endpointId)
        return endpoint?.baseUrl
    }

    /**
     * Gets an authenticated model client by looking up endpoint configuration from the store.
     * This is used by recipe API handlers to obtain authenticated models.
     */
    async buildModel(
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
        const apiKey = this.apiKey(endpointId)
        const baseUrl = this.baseUrl(endpointId)

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
}

// Add store to the NodeJS global type
declare global {
    // eslint-disable-next-line no-var
    var endpointStore: EndpointStore | undefined
}

// Prevent multiple instances of store in development
const endpointStore = globalThis.endpointStore || new EndpointStore()
if (process.env.NODE_ENV !== 'production') {
    globalThis.endpointStore = endpointStore
}

export default endpointStore
