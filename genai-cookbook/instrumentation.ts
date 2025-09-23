export async function register() {
    console.log('✓ Server instrumentation running...')

    if (process.env.NEXT_RUNTIME === 'nodejs') {
        await import('@/store/EndpointStore')
        console.log('✓ EndpointStore singleton initialized')

        await import('@/store/RecipeStore')
        console.log('✓ RecipeStore singleton initialized')
    }
}
