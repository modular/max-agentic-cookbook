'use client'

import { MantineProvider, useMantineColorScheme } from '@mantine/core'
import { clientTheme } from '@/theme/clientTheme'
import { useEffect } from 'react'

interface ClientThemeProviderProps {
    children: React.ReactNode
}

function ColorSchemeWrapper() {
    const { colorScheme } = useMantineColorScheme()

    useEffect(() => {
        const body = document.body

        if (colorScheme === 'dark') {
            body.classList.add('darkMode')
        } else {
            body.classList.remove('darkMode')
        }
    }, [colorScheme])

    return null
}

export function ClientThemeProvider({ children }: ClientThemeProviderProps) {
    return (
        <MantineProvider
            defaultColorScheme="auto"
            theme={clientTheme(
                'Inter',
                'Roboto Mono,PT Mono,Courier New,Courier,monospace'
            )}
        >
            <ColorSchemeWrapper />
            {children}
        </MantineProvider>
    )
}
