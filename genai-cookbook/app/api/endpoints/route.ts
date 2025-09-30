import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import endpointStore from '@/store/EndpointStore'
import type { Endpoint } from '@/lib/types'

import fs from 'fs'
import path from 'path'

export function GET(_request: NextRequest) {
    let raw = process.env.COOKBOOK_ENDPOINTS

    if (!raw) {
        console.warn('[endpoints] Environment variable COOKBOOK_ENDPOINTS is not set')
        console.warn('[endpoints] Looking for endpoints.json instead')

        try {
            raw = fs.readFileSync(path.join(process.cwd(), 'endpoints.json'), 'utf8')
        } catch (err) {
            console.error(`[endpoints] Failed to read endpoints.json file`, err)
            return NextResponse.json(
                { error: 'No endpoints configured' },
                { status: 500 }
            )
        }
    }

    try {
        const parsed = JSON.parse(raw)
        if (!Array.isArray(parsed)) {
            const error = 'Endpoints must be provided in a JSON array'
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
        const message = `Invalid JSON: ${(err as Error).message}`
        console.error(`[endpoints] ${message}`)
        return NextResponse.json({ error: message }, { status: 400 })
    }
}
