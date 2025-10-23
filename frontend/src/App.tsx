/**
 * Root App component with React Router configuration
 */

import { Routes, Route } from 'react-router-dom'
import { CookbookShell } from './features/CookbookShell'
import { CookbookIndex } from './features/CookbookIndex'
import { RecipeLayoutShell } from './features/RecipeLayout'
import { AppProviders } from './routing/AppProviders'
import { getDynamicRecipeRoutes, getStaticRecipeRoutes } from './routing/RecipeRoutes'
import './App.css'

function App() {
    return (
        <AppProviders>
            <Routes>
                <Route path="/" element={<CookbookShell />}>
                    <Route index element={<CookbookIndex />} />
                    {/* Nested recipe layout wraps all recipe pages with lazy loading */}
                    <Route element={<RecipeLayoutShell />}>
                        {/* Dynamic routes for interactive recipe components */}
                        {getDynamicRecipeRoutes()}
                        {/* Static routes for recipe readmes + code */}
                        {getStaticRecipeRoutes()}
                    </Route>
                </Route>
            </Routes>
        </AppProviders>
    )
}

export default App
