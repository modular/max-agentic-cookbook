import '@mantine/core/styles.css'
import '@/styles/globals.css'

import type { Metadata } from 'next'
import { MantineProvider } from '@mantine/core'

import { theme } from '@/lib/theme'

export const metadata: Metadata = {
    title: 'Modular GenAI Cookbook',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en">
            <body>
                <MantineProvider defaultColorScheme="auto" theme={theme}>
                    {children}
                </MantineProvider>
            </body>
        </html>
    )
}
