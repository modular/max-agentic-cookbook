/**
 * AppProviders - Wraps the entire app with necessary providers
 */

import { MantineProvider } from '@mantine/core'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { BrowserRouter, useSearchParams } from 'react-router-dom'
import { theme } from '../lib/theme'

// Create a client for React Query
const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 1000 * 60 * 5, // 5 minutes
            refetchOnWindowFocus: false,
        },
    },
})

// Component that conditionally renders DevTools based on 'd' query parameter
function DevToolsWrapper() {
    const [searchParams] = useSearchParams()
    const showDevTools = searchParams.has('d')

    return showDevTools ? <ReactQueryDevtools initialIsOpen={false} /> : null
}

export function AppProviders({ children }: { children: React.ReactNode }) {
    return (
        <QueryClientProvider client={queryClient}>
            <MantineProvider theme={theme} defaultColorScheme="auto">
                <BrowserRouter>
                    {children}
                    <DevToolsWrapper />
                </BrowserRouter>
            </MantineProvider>
        </QueryClientProvider>
    )
}
