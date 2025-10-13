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
    },
    transpilePackages: ['@modular/recipes'],
    webpack(config, { dev }) {
        if (dev) {
            // Avoid PackFile serialization warnings by keeping the cache in-memory during dev
            config.cache = { type: 'memory' }
        }
        return config
    },
}

export default nextConfig
