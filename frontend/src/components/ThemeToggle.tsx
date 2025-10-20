import { useEffect, useState } from 'react'
import { ActionIcon, Tooltip, useMantineColorScheme } from '@mantine/core'
import { IconMoon, IconSun } from '@tabler/icons-react'

export function ThemeToggle({ stroke }: { stroke: number }) {
    const { setColorScheme, colorScheme } = useMantineColorScheme()
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    function toggleColorScheme() {
        const result = colorScheme === 'dark' ? 'light' : 'dark'
        return setColorScheme(result)
    }

    const resolvedScheme = mounted ? colorScheme : 'light'
    const label = resolvedScheme === 'dark' ? 'Switch to light' : 'Switch to dark'

    return (
        <Tooltip label={label}>
            <ActionIcon
                onClick={toggleColorScheme}
                aria-label={label}
                variant="transparent"
            >
                {resolvedScheme === 'dark' ? (
                    <IconMoon stroke={stroke} />
                ) : (
                    <IconSun stroke={stroke} />
                )}
            </ActionIcon>
        </Tooltip>
    )
}
