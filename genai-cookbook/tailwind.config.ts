import type { Config } from 'tailwindcss'
import tailwindTheme from './theme/tailwindTheme'

const config: Config = {
    content: [
        './app/**/*.{js,ts,jsx,tsx,mdx}',
        './components/**/*.{js,ts,jsx,tsx,mdx}',
        './lib/**/*.{js,ts,jsx,tsx,mdx}',
        './styles/**/*.{css,scss}',
    ],
    theme: tailwindTheme,
    plugins: [],
}
export default config
