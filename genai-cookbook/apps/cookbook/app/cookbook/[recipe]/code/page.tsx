import { redirect } from 'next/navigation'
import { cookbookRoute } from '@/utils/constants'
import { CodeViewer } from '@/components/CodeViewer'
import { getRecipeSource, getRecipeMetadata } from '@modular/recipes/server'

export default async function RecipeCode({ params }: { params: { recipe?: string } }) {
    if (!params.recipe) return redirect(cookbookRoute())

    const metadata = await getRecipeMetadata(params.recipe)
    if (!metadata) return redirect(cookbookRoute())

    const beCode = await getRecipeSource(params.recipe, 'api')
    const feCode = await getRecipeSource(params.recipe, 'ui')

    return (
        <CodeViewer
            description={metadata.description}
            beCode={beCode}
            feCode={feCode}
        />
    )
}
