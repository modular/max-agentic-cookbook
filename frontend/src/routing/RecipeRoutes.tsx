/**
 * RecipeRoutes - Utility functions for rendering dynamic and static recipe routes
 */

import { Suspense, type ComponentType } from 'react'
import { Route, useLocation } from 'react-router-dom'
import { Text } from '@mantine/core'
import { getAllRecipesWithComponents, lazyComponentExport } from '../recipes/registry'
import { useEndpointFromQuery, useModelFromQuery } from '../lib/hooks'
import type { RecipeProps } from '../lib/types'

// Lazy load feature components
const RecipeReadmeView = lazyComponentExport(
    () => import('../features/RecipeReadmeView')
)
const RecipeCodeView = lazyComponentExport(() => import('../features/RecipeCodeView'))

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

// Utility function for rendering all dynamic recipe routes
export function getDynamicRecipeRoutes() {
    return getAllRecipesWithComponents().map((recipe) => {
        const RecipeComponent = recipe.component

        if (!RecipeComponent) {
            return (
                <Route
                    key={recipe.slug}
                    path={recipe.slug}
                    element={<Text>Recipe component not found</Text>}
                />
            )
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
    })
}

// Utility function for rendering static recipe routes (readme and code views)
export function getStaticRecipeRoutes() {
    return [
        <Route
            key="readme"
            path=":slug/readme"
            element={
                <Suspense fallback={<Loading />}>
                    <RecipeReadmeView />
                </Suspense>
            }
        />,
        <Route
            key="code"
            path=":slug/code"
            element={
                <Suspense fallback={<Loading />}>
                    <RecipeCodeView />
                </Suspense>
            }
        />
    ]
}
