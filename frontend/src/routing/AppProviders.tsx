/**
 * AppProviders - Wraps the entire app with necessary providers
 */

import { MantineProvider } from '@mantine/core'
import { BrowserRouter } from 'react-router-dom'
import { SWRConfig } from 'swr'
import { theme } from '../lib/theme'

export function AppProviders({ children }: { children: React.ReactNode }) {
    return (
        <SWRConfig
            value={{
                dedupingInterval: 5000, // 5 seconds - prevents duplicate requests
                revalidateOnFocus: false, // Equivalent to TanStack's refetchOnWindowFocus: false
                revalidateOnReconnect: true, // Smart: refetch when user comes back online
            }}
        >
            <MantineProvider theme={theme} defaultColorScheme="auto">
                <BrowserRouter>{children}</BrowserRouter>
            </MantineProvider>
        </SWRConfig>
    )
}
