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

## Documentation

- **[Contributing Guide](../docs/contributing.md)** - How to add recipes, code standards, and patterns
- **[Project Context](../AGENTS.md)** - Architecture details and frontend patterns
