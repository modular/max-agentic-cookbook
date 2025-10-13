'use client'

import { ActionIcon, Tooltip, useMantineColorScheme } from '@mantine/core'
import { IconMoon, IconSun } from '@tabler/icons-react'

export function ThemeToggle({ stroke }: { stroke: number }): JSX.Element {
    const { setColorScheme, colorScheme } = useMantineColorScheme()

    function toggleColorScheme() {
        const result = colorScheme === 'dark' ? 'light' : 'dark'
        return setColorScheme(result)
    }

    const label = colorScheme === 'dark' ? 'Switch to light' : 'Switch to dark'

    return (
        <Tooltip label={label}>
            <ActionIcon
                onClick={toggleColorScheme}
                aria-label={label}
                variant="transparent"
            >
                {colorScheme === 'dark' ? (
                    <IconMoon stroke={stroke} />
                ) : (
                    <IconSun stroke={stroke} />
                )}
            </ActionIcon>
        </Tooltip>
    )
}
