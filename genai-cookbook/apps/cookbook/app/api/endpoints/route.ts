import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import endpointStore from '@/lib/EndpointStore'
import type { Endpoint } from '@modular/recipes/lib/types'

export function GET(_request: NextRequest) {
    const raw = process.env.COOKBOOK_ENDPOINTS

    if (!raw) {
        const error = 'COOKBOOK_ENDPOINTS is not set in the environment'
        console.error(`[endpoints] ${error}`)
        return NextResponse.json({ error }, { status: 500 })
    }

    try {
        const parsed = JSON.parse(raw)
        if (!Array.isArray(parsed)) {
            const error = 'COOKBOOK_ENDPOINTS must be a JSON array'
            console.error(`[endpoints] ${error}`)
            return NextResponse.json({ error }, { status: 400 })
        }

        const endpoints: Endpoint[] = parsed.reduce((list: Endpoint[], e) => {
            const endpoint = {
                id: String(e.id ?? ''),
                baseUrl: String(e.baseUrl ?? ''),
                aiModel: String(e.aiModel ?? ''),
                hwMake: e.hwMake,
                hwModel: e.hwModel,
            }

            if (list.some((existing) => existing.id === endpoint.id)) {
                const error = `Duplicate endpoint ID found: ${endpoint.id}`
                console.error(`[endpoints] ${error}`)
                throw new Error(error)
            }

            return [...list, endpoint]
        }, [])

        const endpointsWithApiKeys = endpoints.map((endpoint) => {
            const original = parsed.find((e: Endpoint) => e.id === endpoint.id)
            return original ? { ...endpoint, ...original } : endpoint
        })

        endpointStore.set(endpointsWithApiKeys)

        return NextResponse.json(endpoints)
    } catch (err) {
        const message = `Invalid COOKBOOK_ENDPOINTS JSON: ${(err as Error).message}`
        console.error(`[cookbook] ${message}`)
        return NextResponse.json({ error: message }, { status: 400 })
    }
}
