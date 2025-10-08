import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import type { Model } from '@modular/recipes/lib/types'
import endpointStore from '@/lib/EndpointStore'

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const endpointId = searchParams.get('endpointId')
    const baseUrl = searchParams.get('baseUrl')
    const apiKey = endpointStore.apiKey(endpointId)

    if (!baseUrl || !apiKey || !endpointId) {
        return NextResponse.json(
            { error: 'Missing required parameter' },
            { status: 400 }
        )
    }

    try {
        const response = await fetch(`${baseUrl}/models`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json', Authorization: apiKey },
        })

        if (!response.ok) {
            return NextResponse.json(
                { error: response.statusText },
                { status: response.status }
            )
        }

        const data = await response.json()

        const models: Model[] =
            data.data?.map((model: { id: string; object: string }) => ({
                id: model.id,
                name: model.id,
                endpoint: endpointId || baseUrl,
            })) || []

        return NextResponse.json(models)
    } catch (err) {
        console.error(err)
        const message = `Error fetching models: ${(err as Error).message}`
        return NextResponse.json({ error: message }, { status: 500 })
    }
}
