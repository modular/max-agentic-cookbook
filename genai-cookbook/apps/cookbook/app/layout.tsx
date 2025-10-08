import '@mantine/core/styles.css'
import '@/styles/globals.css'

import type { Metadata } from 'next'
import { MantineProvider } from '@mantine/core'

import { theme } from '@/lib/theme'
import { CookbookProvider } from '@/context'
import { endpointsRoute } from '@/lib/constants'

export const metadata: Metadata = {
    title: 'Modular GenAI Cookbook',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en">
            <body>
                <MantineProvider defaultColorScheme="auto" theme={theme}>
                    <CookbookProvider endpointsRoute={endpointsRoute}>{children}</CookbookProvider>
                </MantineProvider>
            </body>
        </html>
    )
}
