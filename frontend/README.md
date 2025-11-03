# Frontend

Modern React SPA for MAX Recipes. Type-safe, lightweight, and built for developer experience with hot module replacement and automatic code splitting.

## Quick Start

### Prerequisites

- Node.js 22.x or higher
- npm (comes with Node.js), although we recommend you use [pnpm](https://pnpm.io/installation) instead of npm

## Project Structure

```
frontend/
├── src/
│   ├── main.tsx                # Application entry point
│   ├── App.tsx                 # Route configuration
│   ├── recipes/                # Recipe components and data
│   │   ├── registry.ts         # Recipe metadata (pure data)
│   │   ├── components.ts       # React component mapping
│   │   ├── batch-text-classification/ # Example: Text Classification
│   │   ├── multiturn-chat/     # Example: Multi-turn chat recipe
│   │   └── image-captioning/   # Example: Image captioning recipe
│   ├── routing/                # Routing infrastructure
│   ├── components/             # Shared UI components
│   ├── features/               # Feature components (layout, views)
│   ├── lib/                    # Utilities, hooks, types, theme
│   └── scripts/                # Build scripts
├── package.json                # Dependencies and scripts
├── vite.config.ts              # Vite configuration
└── tsconfig.json               # TypeScript config
```

## Development Commands

### Run Dev Server

```bash
npm run dev
```

Starts Vite dev server with hot module reload (HMR) on http://localhost:5173

### Build for Production

```bash
npm run build
```

Outputs optimized static files to `dist/` with code splitting, minification, and source maps.

### Preview Production Build

```bash
npm run preview
```

### Format Code

```bash
npm run format
```

Runs Prettier on all TypeScript/JavaScript files.

### Testing

```bash
# Unit tests
npm test                  # Run unit tests in watch mode
npm run test:ui          # Run with interactive UI
npm run test:coverage    # Run with coverage report

# E2E tests
npm run test:e2e         # Run end-to-end tests
npm run test:e2e:ui      # Run with interactive UI (great for debugging)
npm run test:e2e:headed  # Run in headed mode (see the browser)
npm run test:e2e:debug   # Debug tests step-by-step

# First time only: Install Playwright browsers
npm run playwright:install
```

**Running in Linux containers (Docker, CI/CD):**

Playwright is configured for headless operation in containerized environments. Use `xvfb-run` if available:

```bash
# Run E2E tests in container
xvfb-run -a npm run test:e2e

# Or use standalone screenshot script
xvfb-run -a node capture-screenshots.cjs
```

For detailed testing documentation, including how to use Playwright in containers and how Claude can interact with your app for debugging, see **[TESTING.md](./TESTING.md)**.

## Documentation

- **[Testing Guide](./TESTING.md)** - How to test and debug with Claude using Playwright and Vitest
- **[Contributing Guide](../docs/contributing.md)** - How to add recipes, code standards, and patterns
- **[Project Context](../AGENTS.md)** - Architecture details and frontend patterns
