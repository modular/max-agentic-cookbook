import { redirect } from 'next/navigation'
import { cookbookRoute } from '@/utils/constants'
import { CodeViewer } from '@/components/CodeViewer'
import { getRecipeSource, recipeRegistry } from '@modular/recipes'

export default async function RecipeCode({ params }: { params: { recipe?: string } }) {
    if (!params.recipe) return redirect(cookbookRoute())

    const recipe = recipeRegistry[params.recipe]
    if (!recipe) return redirect(cookbookRoute())

    const beCode = await getRecipeSource(params.recipe, 'api')
    const feCode = await getRecipeSource(params.recipe, 'ui')

    return (
        <CodeViewer description={recipe.description} beCode={beCode} feCode={feCode} />
    )
}
