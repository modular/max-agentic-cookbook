/**
 * AppProviders - Wraps the entire app with necessary providers
 */

import { useEffect } from 'react'
import { MantineProvider, useMantineColorScheme } from '@mantine/core'
import { BrowserRouter } from 'react-router-dom'
import { theme } from '~/lib/theme'

function HighlightJsThemeLoader() {
    const { colorScheme } = useMantineColorScheme()

    useEffect(() => {
        // Function to load the appropriate theme
        const loadTheme = async () => {
            // Get or create the theme link element
            let themeLink = document.getElementById('hljs-theme') as HTMLLinkElement | null

            if (!themeLink) {
                themeLink = document.createElement('link')
                themeLink.id = 'hljs-theme'
                themeLink.rel = 'stylesheet'
                document.head.appendChild(themeLink)
            }

            // Import and set the appropriate theme CSS file
            try {
                if (colorScheme === 'dark') {
                    const module = await import('highlight.js/styles/base16/material-darker.css?url')
                    if (themeLink) themeLink.href = module.default
                } else {
                    const module = await import('highlight.js/styles/base16/papercolor-light.css?url')
                    if (themeLink) themeLink.href = module.default
                }
            } catch (error) {
                console.error('Failed to load highlight.js theme:', error)
            }
        }

        loadTheme()
    }, [colorScheme])

    return null
}

export function AppProviders({ children }: { children: React.ReactNode }) {
    return (
        <MantineProvider theme={theme} defaultColorScheme="auto">
            <HighlightJsThemeLoader />
            <BrowserRouter>{children}</BrowserRouter>
        </MantineProvider>
    )
}
