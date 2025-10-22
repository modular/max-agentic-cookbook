/**
 * Root App component with React Router configuration
 */

import { Suspense } from 'react'
import { MantineProvider, Text } from '@mantine/core'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { theme } from './lib/theme'
import { CookbookShell } from './features/CookbookShell'
import { CookbookIndex } from './features/CookbookIndex'
import { RecipeLayoutShell } from './features/RecipeLayout'
import { lazyComponentExport, getAllRecipesWithComponents } from './recipes/registry'
import './App.css'

// Lazy load feature components
const RecipeReadmeView = lazyComponentExport(
    () => import('./features/RecipeReadmeView')
)
const RecipeCodeView = lazyComponentExport(() => import('./features/RecipeCodeView'))

// Loading fallback component
const Loading = () => <div>Loading...</div>

function App() {
    return (
        <MantineProvider theme={theme} defaultColorScheme="auto">
            <BrowserRouter>
                <Routes>
                    <Route path="/" element={<CookbookShell />}>
                        <Route index element={<CookbookIndex />} />
                        {/* Nested recipe layout wraps all recipe pages with lazy loading */}
                        <Route element={<RecipeLayoutShell />}>
                            {/* Dynamic routes for interactive recipe components */}
                            {getAllRecipesWithComponents().map((recipe) => {
                                const RecipeComponent = recipe.component
                                return (
                                    <Route
                                        key={recipe.slug}
                                        path={recipe.slug}
                                        element={
                                            RecipeComponent ? (
                                                <Suspense fallback={<Loading />}>
                                                    <RecipeComponent />
                                                </Suspense>
                                            ) : (
                                                <Text>Recipe component not found</Text>
                                            )
                                        }
                                    />
                                )
                            })}
                            {/* Dynamic routes for all recipes */}
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
                        </Route>
                    </Route>
                </Routes>
            </BrowserRouter>
        </MantineProvider>
    )
}

export default App
