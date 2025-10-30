/**
 * routeUtils - Utility functions for rendering dynamic and static recipe routes
 */

import { Suspense } from 'react'
import { Route } from 'react-router-dom'
import { Text } from '@mantine/core'
import { getAllImplementedRecipes } from '~/recipes/registry'
import { getRecipeComponent, lazyComponentExport } from '~/recipes/components'
import { RecipeWithProps } from './RecipeWithProps'
import { Loading } from './Loading'

// Lazy load feature components
const RecipeReadmeView = lazyComponentExport(
    () => import('../features/RecipeReadmeView')
)
const RecipeCodeView = lazyComponentExport(() => import('../features/RecipeCodeView'))

// Utility function for rendering all dynamic recipe routes
export function lazyLoadDemoRoutes() {
    return getAllImplementedRecipes().map((recipe) => {
        const RecipeComponent = getRecipeComponent(recipe.slug)

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
export function lazyLoadDetailRoutes() {
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
        />,
    ]
}
