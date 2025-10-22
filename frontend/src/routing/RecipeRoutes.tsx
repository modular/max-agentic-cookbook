/**
 * RecipeRoutes - Components for rendering dynamic and static recipe routes
 */

import { Suspense } from 'react'
import { Route } from 'react-router-dom'
import { getAllRecipesWithComponents, lazyComponentExport } from '../recipes/registry'
import { RecipeRoute } from './RecipeRoute'

// Lazy load feature components
const RecipeReadmeView = lazyComponentExport(
    () => import('../features/RecipeReadmeView')
)
const RecipeCodeView = lazyComponentExport(() => import('../features/RecipeCodeView'))

// Loading fallback component
const Loading = () => <div>Loading...</div>

// Component for rendering all dynamic recipe routes
export function DynamicRecipeRoutes() {
    return (
        <>
            {getAllRecipesWithComponents().map((recipe) => (
                <RecipeRoute key={recipe.slug} recipe={recipe} />
            ))}
        </>
    )
}

// Component for rendering static recipe routes (readme and code views)
export function StaticRecipeRoutes() {
    return (
        <>
            <Route
                path=":slug/readme"
                element={
                    <Suspense fallback={<Loading />}>
                        <RecipeReadmeView />
                    </Suspense>
                }
            />
            <Route
                path=":slug/code"
                element={
                    <Suspense fallback={<Loading />}>
                        <RecipeCodeView />
                    </Suspense>
                }
            />
        </>
    )
}
