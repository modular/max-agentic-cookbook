/**
 * AppProviders - Wraps the entire app with necessary providers
 */

import { MantineProvider } from '@mantine/core'
import { BrowserRouter } from 'react-router-dom'
import { theme } from '../lib/theme'

export function AppProviders({ children }: { children: React.ReactNode }) {
    return (
        <MantineProvider theme={theme} defaultColorScheme="auto">
            <BrowserRouter>{children}</BrowserRouter>
        </MantineProvider>
    )
}
