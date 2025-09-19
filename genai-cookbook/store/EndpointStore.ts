import { Endpoint } from '@/lib/types'

interface EndpointWithApiKey extends Endpoint {
    apiKey: string
}

type EndpointCollection = EndpointWithApiKey[] | null

class EndpointStore {
    _endpoints: EndpointCollection = null

    get(): EndpointCollection {
        return this._endpoints
    }

    set(newEndpoints: EndpointCollection) {
        this._endpoints = newEndpoints
    }

    apiKey(endpointId: string | null | undefined): string | undefined {
        const endpoint = this._endpoints?.find((e) => e.id === endpointId)
        return endpoint?.apiKey
    }
}

declare global {
    // eslint-disable-next-line no-var
    var __endpointStore__: EndpointStore | undefined
}

const endpointStore: EndpointStore =
    globalThis.__endpointStore__ ?? (globalThis.__endpointStore__ = new EndpointStore())

export default endpointStore
