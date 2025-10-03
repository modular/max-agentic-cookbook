import type { Config } from 'tailwindcss'

const config: Config = {
    darkMode: 'class',
    content: [
        './app/**/*.{ts,tsx}',
        './pages/**/*.{ts,tsx}',
        './components/**/*.{ts,tsx}',
        './cookbook/**/*.{ts,tsx}',
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: [
                    'Inter',
                    'ui-sans-serif',
                    'system-ui',
                    '-apple-system',
                    'Segoe UI',
                    'Roboto',
                    'Helvetica',
                    'Arial',
                    'Apple Color Emoji',
                    'Segoe UI Emoji',
                ],
            },
        },
    },
    plugins: [],
}
export default config
