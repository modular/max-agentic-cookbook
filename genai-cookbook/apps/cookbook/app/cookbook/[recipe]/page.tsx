'use client'

import { redirect, usePathname } from 'next/navigation'
import { cookbookRoute } from '@/lib/constants'
import { useCookbook } from '@/context'
import { recipeRegistry } from '@modular/recipes'

export default function Page({ params }: { params: { recipe?: string } }) {
    const pathname = usePathname()
    const { selectedEndpoint, selectedModel } = useCookbook()

    if (!params.recipe) return redirect(cookbookRoute())

    const recipe = recipeRegistry[params.recipe]

    if (!recipe) {
        throw new Error(`Unable to load recipe ${params.recipe}`)
    }

    const RecipeComponent = recipe.ui

    return (
        <RecipeComponent
            endpoint={selectedEndpoint}
            model={selectedModel}
            pathname={pathname}
        />
    )
}
