'use client'

import { redirect, usePathname } from 'next/navigation'
import { cookbookRoute } from '@/utils/constants'
import { useCookbook } from '@/context'
import { recipeMetadata, recipeUiRegistry } from '@modular/recipes'

export default function Page({ params }: { params: { recipe?: string } }) {
    const pathname = usePathname()
    const { selectedEndpoint, selectedModel } = useCookbook()

    if (!params.recipe) return redirect(cookbookRoute())

    const recipe = recipeMetadata[params.recipe]
    const RecipeComponent = recipeUiRegistry[params.recipe]

    if (!recipe || !RecipeComponent) {
        throw new Error(`Unable to load recipe ${params.recipe}`)
    }

    return (
        <RecipeComponent
            endpoint={selectedEndpoint}
            model={selectedModel}
            pathname={pathname}
        />
    )
}
