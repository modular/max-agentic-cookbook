import type { RecipeContext } from '@modular/recipes/lib/types'
import { recipeRegistry } from '@modular/recipes'
import endpointStore from '@/lib/EndpointStore'

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

    const recipe = recipeRegistry[recipeId]
    if (!recipe) {
        return createErrorResponse(`Recipe not found: ${recipeId}`, undefined, 404)
    }

    const context: RecipeContext = {
        getAuthenticatedModel: endpointStore.buildModel.bind(endpointStore),
    }

    try {
        const response = recipe.api(req, context)
        return response
    } catch (error) {
        return createErrorResponse(
            `Encountered problem with POST handler for recipe ${recipeId}`,
            error
        )
    }
}
