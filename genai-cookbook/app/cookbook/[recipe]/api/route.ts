export async function POST(req: Request) {
    const data = await req.json()
    return Response.json(data)
}

export async function GET() {
    return new Response('GET Not Implemented; Use POST.', { status: 405 })
}
