import '@mantine/core/styles.css'
import '@/styles/globals.scss'

import type { Metadata } from 'next'
import { Inter, Roboto_Mono } from 'next/font/google'
import { ClientThemeProvider } from '@/hooks/ClientThemeProvider'

const inter = Inter({
    subsets: ['latin'],
    variable: '--inter',
})

const robotoMono = Roboto_Mono({
    subsets: ['latin'],
    variable: '--roboto',
})

export const metadata: Metadata = {
    title: 'Modular GenAI Cookbook',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en" className={`${inter.variable} ${robotoMono.variable}`}>
            <body>
                <ClientThemeProvider>{children}</ClientThemeProvider>
            </body>
        </html>
    )
}
