'use client'

import { ActionIcon, Tooltip, useMantineColorScheme } from '@mantine/core'
import { IconMoon, IconSun } from '@tabler/icons-react'
import { useEffect, useState } from 'react'

const STORAGE_KEY = 'color-scheme'

export function ThemeToggle({ stroke }: { stroke: number }): JSX.Element {
    const { colorScheme, setColorScheme } = useMantineColorScheme()
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    useEffect(() => {
        const root = document.documentElement
        if (colorScheme === 'dark') {
            root.classList.add('dark')
        } else {
            root.classList.remove('dark')
        }

        try {
            localStorage.setItem(STORAGE_KEY, colorScheme)
        } catch {}
    }, [colorScheme])

    const toggle = (): void => {
        setColorScheme(colorScheme === 'dark' ? 'light' : 'dark')
    }

    const label = colorScheme === 'dark' ? 'Switch to light' : 'Switch to dark'

    if (!mounted) {
        return (
            <ActionIcon aria-label="Toggle theme">
                <span style={{ opacity: 0 }}>&nbsp;</span>
            </ActionIcon>
        )
    }

    return (
        <Tooltip label={label}>
            <ActionIcon onClick={toggle} aria-label={label} variant="transparent">
                {colorScheme === 'dark' ? (
                    <IconMoon stroke={stroke} />
                ) : (
                    <IconSun stroke={stroke} />
                )}
            </ActionIcon>
        </Tooltip>
    )
}
