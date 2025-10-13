import type { MantineThemeOverride } from '@mantine/core'

export const theme: MantineThemeOverride = {
    primaryColor: 'nebula',
    colors: {
        nebula: [
            '#637bff',
            '#8799ff',
            '#b5c0f6',
            '#bcc6f7',
            '#c4cdf8',
            '#cbd3f9',
            '#d3d9fa',
            '#dadffb',
            '#e1e6fb',
            '#e9ecfc',
        ],
        twilight: [
            '#020c13',
            '#181c1f',
            '#262c30',
            '#353d42',
            '#676d71',
            '#9a9eaa',
            '#b3b8c2',
            '#d4dae4',
            '#e5e9ef',
            '#eef0f4',
        ],
    },
    primaryShade: 0,
    defaultRadius: 'xs',
    fontFamily:
        'Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, Apple Color Emoji, Segoe UI Emoji',
}

export const iconStroke = 1.2
export const headerHeight = 40
export const navbarWidth = 260

export const appShellContentHeight = `calc(100dvh - var(--app-shell-header-offset, ${headerHeight}px) - var(--app-shell-footer-offset, 0px) - (var(--app-shell-padding, var(--mantine-spacing-md)) * 2))`
