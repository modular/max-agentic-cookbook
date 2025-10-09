import type { MantineThemeOverride } from '@mantine/core'

export const theme: MantineThemeOverride = {
    primaryColor: 'indigo',
    defaultRadius: 'xs',
    fontFamily:
        'Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, Apple Color Emoji, Segoe UI Emoji',
}

export const iconStroke = 1.2
export const headerHeight = 40
export const navbarWidth = 260

export const appShellContentHeight = `calc(100dvh - var(--app-shell-header-offset, ${headerHeight}px) - var(--app-shell-footer-offset, 0px) - (var(--app-shell-padding, var(--mantine-spacing-md)) * 2))`
