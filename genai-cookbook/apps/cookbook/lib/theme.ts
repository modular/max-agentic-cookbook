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

export const centerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'space-between',
    overflow: 'hidden',
}

/**
 * Utility to derive a height based on the App Shell content area with an extra offset.
 * Pass a number (pixels) or a CSS length string (e.g., '2rem').
 */
export function appShellContentHeightWithOffset(offset?: number | string) {
    if (!offset || offset === 0) return appShellContentHeight
    const asCss = typeof offset === 'number' ? `${offset}px` : offset
    return `calc(${appShellContentHeight} - ${asCss})`
}
