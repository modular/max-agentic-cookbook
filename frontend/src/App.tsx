/**
 * Root App component with React Router configuration
 */

import { lazy, Suspense } from 'react'
import { MantineProvider } from '@mantine/core'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { theme } from './lib/theme'
import { CookbookShell } from './features/CookbookShell'
import { CookbookIndex } from './features/CookbookIndex'
import { RecipeLayoutShell } from './features/RecipeLayout'
import './App.css'

// Lazy load recipe components
// Note: These components export { Component }, so we need to map it to default
const MultiturnChatPlaceholder = lazy(() =>
    import('./recipes/multiturn-chat/MultiturnChatPlaceholder').then(
        (module) => ({ default: module.Component })
    )
)
const ImageCaptioningPlaceholder = lazy(() =>
    import('./recipes/image-captioning/ImageCaptioningPlaceholder').then(
        (module) => ({ default: module.Component })
    )
)
const RecipeReadmeView = lazy(() =>
    import('./features/RecipeReadmeView').then((module) => ({
        default: module.Component,
    }))
)
const RecipeCodeView = lazy(() =>
    import('./features/RecipeCodeView').then((module) => ({
        default: module.Component,
    }))
)

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
                            <Route
                                path="multiturn-chat"
                                element={
                                    <Suspense fallback={<Loading />}>
                                        <MultiturnChatPlaceholder />
                                    </Suspense>
                                }
                            />
                            <Route
                                path="image-captioning"
                                element={
                                    <Suspense fallback={<Loading />}>
                                        <ImageCaptioningPlaceholder />
                                    </Suspense>
                                }
                            />
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
