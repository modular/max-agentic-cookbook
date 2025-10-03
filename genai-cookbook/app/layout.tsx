import '@mantine/core/styles.css'
import '@/styles/globals.css'

import type { Metadata } from 'next'
import { MantineProvider } from '@mantine/core'

import { theme } from '@/lib/theme'
import { CookbookProvider } from '@/hooks/CookbookProvider'

import recipeStore from '@/store/RecipeStore'

const recipes = recipeStore.getAll() ?? []

export const metadata: Metadata = {
    title: 'Modular GenAI Cookbook',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en">
            <body>
                <MantineProvider defaultColorScheme="auto" theme={theme}>
                    <CookbookProvider recipes={recipes}>{children}</CookbookProvider>
                </MantineProvider>
            </body>
        </html>
    )
}
