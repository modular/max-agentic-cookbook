/** @type {import('next').NextConfig} */
const nextConfig = {
    experimental: {
        instrumentationHook: true,
    },
    transpilePackages: ['@modular/recipes'],
}

export default nextConfig
