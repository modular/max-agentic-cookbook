import { redirect } from 'next/navigation'
import { cookbookRoute } from '@/lib/constants'
import recipeStore from '@/store/RecipeStore'

export default async function Page({ params }: { params: { recipe?: string } }) {
    const RecipeComponent = await recipeStore.getComponent(params.recipe)

    if (!RecipeComponent) return redirect(cookbookRoute())

    return <RecipeComponent />
}
