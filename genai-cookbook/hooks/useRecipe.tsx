// hooks/useDynamicRecipe.ts
import { useState, useEffect, ComponentType } from 'react'
import dynamic from 'next/dynamic'

export function useRecipe(slug: string | undefined): ComponentType | null {
    const [RecipeComponent, setRecipeComponent] = useState<ComponentType | null>(null)

    useEffect(() => {
        // Only try to load a component if a recipeSlug is provided
        if (slug) {
            const LazyComponent = dynamic(
                () =>
                    import(`@/recipes/${slug}`).catch(() => {
                        // Fallback component if the import fails (e.g., 404)
                        const NotFoundComponent = () => <div>Recipe not found</div>
                        NotFoundComponent.displayName = 'RecipeNotFound'
                        return NotFoundComponent
                    }),
                {
                    // Component to show while the actual component is loading
                    loading: () => <p></p>,
                    ssr: false, // Not needed for this client-side dynamic load
                }
            )

            setRecipeComponent(() => LazyComponent)
        } else {
            // If recipeSlug is undefined, reset the component to null
            setRecipeComponent(null)
        }
    }, [slug]) // Re-run the effect whenever the slug changes

    return RecipeComponent
}
