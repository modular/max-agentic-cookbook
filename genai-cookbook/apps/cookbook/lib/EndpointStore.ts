import { Endpoint } from '@modular/recipes/lib/types'

// Only store the API key server side
interface EndpointWithApiKey extends Endpoint {
    apiKey: string
}

type ServerSideEndpoints = EndpointWithApiKey[] | null

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
