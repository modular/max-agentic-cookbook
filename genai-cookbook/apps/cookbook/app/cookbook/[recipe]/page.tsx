'use client'

import { useCookbook } from '@/context'
import { RecipeProps } from '@modular/recipe-sdk/types'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import type { ComponentType } from 'react'

export default function RecipeContent({ params }: { params: { recipe?: string } }) {
    const pathname = usePathname()
    const { selectedEndpoint, selectedModel } = useCookbook()
    const [RecipeComponent, setRecipeComponent] =
        useState<ComponentType<RecipeProps> | null>(null)

    useEffect(() => {
        const loadRecipe = async () => {
            if (!params.recipe) return

            try {
                // Dynamically import the recipe registry (client-safe)
                const { recipeRegistry } = await import('@modular/recipes')
                const recipe = recipeRegistry[params.recipe]

                if (recipe?.ui) {
                    setRecipeComponent(() => recipe.ui)
                } else {
                    console.warn(`Recipe not found in registry: ${params.recipe}`)
                }
            } catch (error) {
                console.error(`Failed loading recipe: ${params.recipe}`, error)
            }
        }
        loadRecipe()
    }, [params.recipe])

    if (!RecipeComponent) return <div />

    return (
        <RecipeComponent
            endpoint={selectedEndpoint}
            model={selectedModel}
            pathname={pathname}
        />
    )
}
