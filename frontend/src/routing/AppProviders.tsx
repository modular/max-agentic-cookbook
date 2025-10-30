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
        // Get or create the theme link element
        let themeLink = document.getElementById('hljs-theme') as HTMLLinkElement | null

        if (!themeLink) {
            themeLink = document.createElement('link')
            themeLink.id = 'hljs-theme'
            themeLink.rel = 'stylesheet'
            document.head.appendChild(themeLink)
        }

        // Import the appropriate theme CSS file as a URL
        if (colorScheme === 'dark') {
            import('highlight.js/styles/base16/material-darker.css?url').then((module) => {
                if (themeLink) themeLink.href = module.default
            })
        } else {
            import('highlight.js/styles/base16/papercolor-light.css?url').then((module) => {
                if (themeLink) themeLink.href = module.default
            })
        }
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
