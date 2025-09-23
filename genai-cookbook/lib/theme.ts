import { createTheme, rem } from '@mantine/core'

export function baseTheme(fontFamily: string, fontFamilyMonospace: string) {
    return createTheme({
        autoContrast: true,
        fontFamily,
        fontFamilyMonospace,
        colors: {
            dark: [
                '#fff',
                '#B8B8B8',
                '#828282',
                '#696969',
                '#353d42',
                '#020c13',
                '#020c13',
                '#020c13',
                '#020c13',
                '#020c13',
            ],
            blue: [
                '#E6EBFF',
                '#CDD7FF',
                '#B5C0F6',
                '#B5C0F6',
                '#B5C0F6',
                '#B5C0F6',
                '#7584DE',
                '#6370BE',
                '#515D9E',
                '#414A80',
            ],
            red: [
                '#ff9c9c',
                '#fd6666',
                '#fc3937',
                '#fd1f1b',
                '#fd0f0c',
                '#e20101',
                '#ca0000',
                '#ca0000',
                '#b10000',
                '#b10000',
            ],
        },
        primaryColor: 'blue',
        defaultRadius: rem(2),
        cursorType: 'pointer',
        headings: {
            fontWeight: '400',
        },
        breakpoints: {
            xs: '36em',
            sm: '640px',
            md: '768px',
            lg: '1024px',
            xl: '1280px',
            xxl: '1400px',
        },
        lineHeights: {
            sm: '1.33',
            md: '1.4',
            lg: '1.5',
            xl: '1.66',
        },
        spacing: {
            xxs: rem(8),
            xs: rem(10),
            sm: rem(12),
            md: rem(16),
            lg: rem(20),
            xl: rem(32),
            xxl: rem(40),
            '3x': rem(64),
            '4x': rem(80),
            '5x': rem(120),
            '1': rem(4),
            '2': rem(8),
            '3': rem(12),
            '4': rem(16),
            '5': rem(20),
            '6': rem(24),
            '7': rem(28),
            '8': rem(32),
            '9': rem(36),
            '10': rem(40),
            '11': rem(44),
            '12': rem(48),
            '14': rem(56),
            '16': rem(64),
            '20': rem(80),
            '24': rem(96),
            '28': rem(112),
            '32': rem(128),
            '36': rem(144),
            '40': rem(160),
            '44': rem(176),
            '48': rem(192),
            '52': rem(208),
            '56': rem(224),
            '60': rem(240),
            '64': rem(256),
            '72': rem(288),
            '80': rem(320),
            '96': rem(384),
        },
    })
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
