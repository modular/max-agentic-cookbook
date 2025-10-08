import recipeStore from '@/lib/RecipeStore'
import { getAuthenticatedModel } from '@/lib/getAuthenticatedModel'
import type { RecipeContext } from '@modular/recipe-sdk/types'

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

    let handleRequest
    try {
        handleRequest = await recipeStore.getHandler(recipeId)
    } catch (error) {
        return createErrorResponse(`Unable to load POST handler for recipe ${recipeId}`, error)
    }

    // Create context with dependencies for recipe handlers
    const context: RecipeContext = {
        getAuthenticatedModel,
    }

    try {
        const response = handleRequest?.(req, context)
        return response
    } catch (error) {
        return createErrorResponse(`Encountered problem with POST handler for recipe ${recipeId}`, error)
    }
}
