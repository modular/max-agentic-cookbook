/**
 * Root App component with React Router configuration
 */

import { Suspense, type ComponentType } from 'react'
import { MantineProvider, Text } from '@mantine/core'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { theme } from './lib/theme'
import { CookbookShell } from './features/CookbookShell'
import { CookbookIndex } from './features/CookbookIndex'
import { RecipeLayoutShell } from './features/RecipeLayout'
import { lazyComponentExport, getAllRecipesWithComponents } from './recipes/registry'
import { useEndpointFromQuery, useModelFromQuery } from './lib/hooks'
import type { RecipeProps } from './lib/types'
import './App.css'

// Create a client for React Query
const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 1000 * 60 * 5, // 5 minutes
            refetchOnWindowFocus: false,
        },
    },
})

// Lazy load feature components
const RecipeReadmeView = lazyComponentExport(
    () => import('./features/RecipeReadmeView')
)
const RecipeCodeView = lazyComponentExport(() => import('./features/RecipeCodeView'))

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

function App() {
    return (
        <QueryClientProvider client={queryClient}>
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
                                                        <RecipeWithProps
                                                            Component={RecipeComponent}
                                                        />
                                                    </Suspense>
                                                ) : (
                                                    <Text>
                                                        Recipe component not found
                                                    </Text>
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
            {/* <ReactQueryDevtools initialIsOpen={false} /> */}
        </QueryClientProvider>
    )
}

export default App
