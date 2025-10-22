/**
 * RecipeRoute - Component for rendering individual recipe routes
 */

import { Suspense, type ComponentType } from 'react'
import { Text } from '@mantine/core'
import { Route, useLocation } from 'react-router-dom'
import { useEndpointFromQuery, useModelFromQuery } from '../lib/hooks'
import type { RecipeProps } from '../lib/types'
import { getAllRecipesWithComponents } from '../recipes/registry'

// Loading fallback component
const Loading = () => <div>Loading...</div>

// Wrapper component that provides endpoint, model, and pathname props to recipes
function RecipeWithProps({
    Component: RecipeComponent,
}: {
    Component: ComponentType<RecipeProps>
}) {
    const location = useLocation()
    const { selectedEndpoint } = useEndpointFromQuery()
    const { selectedModel } = useModelFromQuery(selectedEndpoint?.id || null)

    return (
        <RecipeComponent
            endpoint={selectedEndpoint}
            model={selectedModel}
            pathname={location.pathname}
        />
    )
}

// Component for rendering a single recipe route with Suspense boundary
export function RecipeRoute({
    recipe,
}: {
    recipe: ReturnType<typeof getAllRecipesWithComponents>[number]
}) {
    const RecipeComponent = recipe.component

    if (!RecipeComponent) {
        return <Text>Recipe component not found</Text>
    }

    return (
        <Route
            key={recipe.slug}
            path={recipe.slug}
            element={
                <Suspense fallback={<Loading />}>
                    <RecipeWithProps Component={RecipeComponent} />
                </Suspense>
            }
        />
    )
}
