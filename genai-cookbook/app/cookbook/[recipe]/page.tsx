import recipeStore from '@/store/RecipeStore'

export default async function Page({ params }: { params: { recipe?: string } }) {
    const RecipeComponent = await recipeStore.getComponent(params.recipe)

    if (!RecipeComponent) throw new Error(`Recipe Not Found ${params.recipe}`)

    return <RecipeComponent />
}
