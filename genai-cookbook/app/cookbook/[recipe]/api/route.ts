import recipeStore from '@/store/RecipeStore'

export async function POST(req: Request) {
    const data = req.url
    return Response.json(data)
}

export async function GET(req: Request) {
    // return new Response('GET Not Implemented; Use POST.', { status: 405 })
    const url = new URL(req.url)
    const segments = url.pathname.split('/').filter((seg) => seg.length > 0)
    const recipeId = segments[segments.length - 2]
    const handler = await recipeStore.getHandler(recipeId)

    return new Response(handler?.toString(), { status: 405 })
}
