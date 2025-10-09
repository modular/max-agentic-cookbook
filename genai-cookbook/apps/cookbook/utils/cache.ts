import { Endpoint } from '@modular/recipes'

// Only store the API key server side
interface EndpointWithApiKey extends Endpoint {
    apiKey: string
}

class CookbookCache {
    private endpoints: EndpointWithApiKey[] | null = null

    getAll(): EndpointWithApiKey[] | null {
        return this.endpoints
    }

    set(newEndpoints: EndpointWithApiKey[] | null) {
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
    var cookbookCache: CookbookCache | undefined
}

// Prevent multiple instances of store in development
const cache = globalThis.cookbookCache || new CookbookCache()
if (process.env.NODE_ENV !== 'production') {
    globalThis.cookbookCache = cache
}

export default cache
