import '@mantine/core/styles.css'
import '@/styles/globals.scss'

import type { Metadata } from 'next'
import { MantineProvider } from '@mantine/core'

import { theme } from '@/utils/theme'
import { CookbookProvider } from '@/context'
import { endpointsRoute } from '@/utils/constants'

export const metadata: Metadata = {
    title: 'Modular Agentic Cookbook',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en">
            <body>
                <MantineProvider defaultColorScheme="auto" theme={theme}>
                    <CookbookProvider endpointsRoute={endpointsRoute}>
                        {children}
                    </CookbookProvider>
                </MantineProvider>
            </body>
        </html>
    )
}
