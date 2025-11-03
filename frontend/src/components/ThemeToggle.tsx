import { ActionIcon, Tooltip, useMantineColorScheme } from '@mantine/core'
import { IconMoon, IconSun } from '@tabler/icons-react'

export function ThemeToggle({ stroke }: { stroke: number }) {
    const { setColorScheme, colorScheme } = useMantineColorScheme()

    function toggleColorScheme() {
        const result = colorScheme === 'dark' ? 'light' : 'dark'
        console.log('Theme:', colorScheme)
        return setColorScheme(result)
    }

    const label =
        colorScheme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'

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
