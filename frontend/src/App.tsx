/**
 * Root App component with React Router configuration
 */

import { MantineProvider } from '@mantine/core'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { theme } from './lib/theme'
import { CookbookShell } from './features/CookbookShell'
import { CookbookIndex } from './features/CookbookIndex'
import { RecipeLayoutShell } from './features/RecipeLayout'
import './App.css'

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
                                lazy={() =>
                                    import(
                                        './features/multiturn-chat/MultiturnChatPlaceholder'
                                    )
                                }
                            />
                            <Route
                                path="image-captioning"
                                lazy={() =>
                                    import(
                                        './features/image-captioning/ImageCaptioningPlaceholder'
                                    )
                                }
                            />
                            {/* Dynamic code view route - matches any recipe's /code path */}
                            <Route
                                path=":slug/code"
                                lazy={() => import('./features/RecipeCodeView')}
                            />
                        </Route>
                    </Route>
                </Routes>
            </BrowserRouter>
        </MantineProvider>
    )
}

export default App
