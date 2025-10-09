import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

/** @type {import('next').NextConfig} */
const nextConfig = {
    experimental: {
        // Tell Next.js the monorepo root so it can watch workspace packages
        outputFileTracingRoot: path.join(__dirname, '../../'),
        // Enable Fast Refresh for external packages
        externalDir: true,
        turbo: {
            // Turbopack resolves workspace packages correctly by default
            resolveAlias: {
                '@modular/recipes': '../../packages/recipes',
            },
        },
    },
    transpilePackages: ['@modular/recipes'],
}

export default nextConfig
