import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import mdx from '@mdx-js/rollup'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    { enforce: 'pre', ...mdx() },
    react({ include: /\.(jsx|js|mdx|md|tsx|ts)$/ }),
  ],
  resolve: {
    alias: {
      '~/lib': path.resolve(__dirname, './src/lib'),
      '~/components': path.resolve(__dirname, './src/components'),
      '~/features': path.resolve(__dirname, './src/features'),
      '~/recipes': path.resolve(__dirname, './src/recipes'),
      '~/routing': path.resolve(__dirname, './src/routing'),
    },
  },
  build: {
    outDir: '../backend/static',
    emptyOutDir: true,
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8010',
        changeOrigin: true,
      },
    },
  },
})
