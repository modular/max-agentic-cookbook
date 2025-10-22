/**
 * Root App component with React Router configuration
 */

import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { CookbookShell } from './features/CookbookShell'
import { CookbookIndex } from './features/CookbookIndex'
import { RecipeLayoutShell } from './features/RecipeLayout'
import { AppProviders } from './routing/AppProviders'
import { DynamicRecipeRoutes, StaticRecipeRoutes } from './routing/RecipeRoutes'
import './App.css'

function App() {
    return (
        <AppProviders>
            <BrowserRouter>
                <Routes>
                    <Route path="/" element={<CookbookShell />}>
                        <Route index element={<CookbookIndex />} />
                        {/* Nested recipe layout wraps all recipe pages with lazy loading */}
                        <Route element={<RecipeLayoutShell />}>
                            {/* Dynamic routes for interactive recipe components */}
                            <DynamicRecipeRoutes />
                            {/* Static routes for all recipes */}
                            <StaticRecipeRoutes />
                        </Route>
                    </Route>
                </Routes>
            </BrowserRouter>
        </AppProviders>
    )
}

export default App
