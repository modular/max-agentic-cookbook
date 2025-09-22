import { Endpoint } from '@/lib/types'

// Only store the API key server side
interface EndpointWithApiKey extends Endpoint {
    apiKey: string
}

type ServerSideEndpoints = EndpointWithApiKey[] | null

// Store endpoints server-side in memory to access them across routes
class EndpointStore {
    _endpoints: ServerSideEndpoints = null

    get(): ServerSideEndpoints {
        return this._endpoints
    }

    set(newEndpoints: ServerSideEndpoints) {
        this._endpoints = newEndpoints
    }

    apiKey(endpointId: string | null | undefined): string | undefined {
        const endpoint = this._endpoints?.find((e) => e.id === endpointId)
        return endpoint?.apiKey
    }
}

// Persist store across hot-reload when running in dev mode
declare global {
    // eslint-disable-next-line no-var
    var __endpointStore__: EndpointStore | undefined
}

const endpointStore: EndpointStore =
    globalThis.__endpointStore__ ?? (globalThis.__endpointStore__ = new EndpointStore())

export default endpointStore
