/**
 * RecipeLayoutShell - Nested layout for recipe pages
 *
 * This component wraps all recipe pages and provides:
 * - Toolbar with recipe title, ViewSelector for switching views
 * - Flex layout with proper height and overflow handling
 * - Scrollable Outlet area for nested recipe routes (Readme/Demo/Code)
 *
 * Layout pattern:
 * - Parent Flex has fixed height and overflow: hidden
 * - Outlet wrapper has flex: 1 and overflow: auto for scrolling
 * - This allows content to scroll while keeping toolbar fixed
 *
 * Uses React Router v7 nested routes pattern:
 * <Route element={<RecipeLayoutShell />}>
 *   <Route path="multiturn-chat" element={...} />
 *   <Route path="image-captioning" element={...} />
 * </Route>
 */

import { Flex, Box } from '@mantine/core'
import { Outlet, useLocation } from 'react-router-dom'
import { Toolbar } from '~/components/Toolbar'
import { appShellContentHeight } from '~/lib/theme'
import { recipeMetadata } from '~/recipes/registry'

export function RecipeLayoutShell() {
    const location = useLocation()

    // Extract recipe slug from pathname
    // e.g., "/multiturn-chat" -> "multiturn-chat"
    // e.g., "/multiturn-chat/code" -> "multiturn-chat"
    // e.g., "/multiturn-chat/readme" -> "multiturn-chat"
    const slug = location.pathname.split('/')[1].replace(/\/(code|readme)$/, '')

    // Look up recipe metadata
    const recipe = recipeMetadata[slug]
    const title = recipe?.title ?? ''

    return (
        <Flex
            direction="column"
            gap="sm"
            style={{ overflow: 'hidden' }}
            h={appShellContentHeight}
        >
            <Toolbar title={title} />
            <Box style={{ flex: 1, overflow: 'auto' }}>
                <Outlet />
            </Box>
        </Flex>
    )
}
