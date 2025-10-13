import cache from '@/utils/cache'
import { getRecipeApiHandler } from '@modular/recipes/server'

function createErrorResponse(message: string, error?: unknown, status = 400): Response {
    const errorMessage = error instanceof Error ? `: ${error.message}` : ''
    return new Response(`${message}${errorMessage}`, { status })
}

export async function GET() {
    return createErrorResponse('GET Not Implemented; Use POST.', undefined, 405)
}

export async function POST(req: Request) {
    let recipeId
    try {
        const url = new URL(req.url)
        const segments = url.pathname.split('/').filter((seg) => seg.length > 0)
        recipeId = segments[segments.length - 2]
    } catch (error) {
        return createErrorResponse('Cannot determine recipe slug', error)
    }

    const apiHandler = await getRecipeApiHandler(recipeId)
    if (!apiHandler) {
        return createErrorResponse(`Recipe not found: ${recipeId}`, undefined, 404)
    }

    const { endpointId, modelName } = await req.clone().json()
    const apiKey = cache.apiKey(endpointId)
    const baseUrl = cache.baseUrl(endpointId)

    if (!apiKey || !baseUrl) {
        return createErrorResponse(
            `Endpoint not available: Failed to lookup baseUrl / apiKey.`,
            undefined,
            502
        )
    }

    try {
        const response = apiHandler(req, { apiKey, baseUrl, modelName })
        return response
    } catch (error) {
        return createErrorResponse(
            `Encountered problem with POST handler for recipe ${recipeId}`,
            error
        )
    }
}
