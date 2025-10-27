# MAX Recipes Frontend

Modern React SPA frontend for the MAX Recipes Cookbook, built with Vite, TypeScript, and Mantine UI.

## Overview

Type-safe React frontend featuring auto-generated routing, lightweight state management with SWR, and a comprehensive recipe system with tags. Built for maximum developer experience with hot module replacement, automatic code splitting, and zero-config TypeScript.

**Key Features:**
- **React 18 + TypeScript** - Type-safe component development
- **Vite** - Lightning-fast dev server and optimized production builds
- **React Router v7** - File-based routing with lazy loading
- **Mantine v7** - Comprehensive UI component library with dark/light themes
- **SWR** - Lightweight data fetching with automatic caching and revalidation
- **Recipe Registry** - Single source of truth with tags system
- **MDX Support** - Built-in documentation rendering
- **Streaming Support** - SSE and NDJSON streaming with Vercel AI SDK

## Project Structure

```
frontend/
├── src/
│   ├── main.tsx                # Application entry point
│   ├── App.tsx                 # Route configuration
│   ├── recipes/                # Recipe components and registry
│   │   ├── registry.ts         # SINGLE SOURCE OF TRUTH for recipes
│   │   ├── multiturn-chat/     # Multi-turn chat recipe
│   │   │   ├── ui.tsx          # Interactive UI component
│   │   │   └── README.mdx      # Recipe documentation
│   │   └── image-captioning/   # Image captioning recipe
│   │       ├── ui.tsx          # Interactive UI component
│   │       └── README.mdx      # Recipe documentation
│   ├── routing/                # Routing infrastructure
│   │   ├── AppProviders.tsx    # Context providers wrapper
│   │   ├── Loading.tsx         # Loading fallback
│   │   ├── RecipeWithProps.tsx # Props injection for recipes
│   │   └── routeUtils.tsx      # Route generation utilities
│   ├── components/             # Shared UI components
│   │   ├── Header.tsx          # App header with selectors
│   │   ├── Navbar.tsx          # Sidebar navigation
│   │   ├── Toolbar.tsx         # Recipe toolbar
│   │   ├── ViewSelector.tsx    # Readme/Demo/Code switcher
│   │   ├── SelectEndpoint.tsx  # Endpoint selector
│   │   ├── SelectModel.tsx     # Model selector
│   │   └── ThemeToggle.tsx     # Dark/light mode toggle
│   ├── features/               # Feature components
│   │   ├── CookbookShell.tsx       # AppShell layout
│   │   ├── CookbookIndex.tsx       # Recipe cards grid
│   │   ├── RecipeLayoutShell.tsx   # Recipe page layout
│   │   ├── RecipeReadmeView.tsx    # README viewer
│   │   └── RecipeCodeView.tsx      # Code viewer
│   ├── lib/                    # Utilities and hooks
│   │   ├── api.ts              # API fetch functions
│   │   ├── hooks.ts            # Custom SWR hooks
│   │   ├── types.ts            # TypeScript type definitions
│   │   ├── theme.ts            # Mantine theme config
│   │   ├── chapters.ts         # Auto-derived navigation
│   │   └── utils.ts            # Shared utilities
│   ├── scripts/                # Build scripts
│   │   └── copy-recipe-code.js # Copy UI source to public/
│   └── mdx.d.ts                # MDX type declarations
├── package.json                # Dependencies and scripts
├── vite.config.ts              # Vite configuration
├── tsconfig.json               # TypeScript config
└── postcss.config.mjs          # PostCSS config (Mantine)
```

## Setup

### Prerequisites
- Node.js 22.x or higher
- npm (comes with Node.js)

### Installation

```bash
cd frontend
npm install
```

## Development

### Run Development Server

```bash
npm run dev
```

This starts:
- Vite dev server on `http://localhost:5173` with HMR
- Recipe code file watcher (copies source files to `public/code/`)

The dev server automatically proxies `/api/*` requests to the backend at `http://localhost:8000`.

### Build for Production

```bash
npm run build
```

Outputs optimized static files to `dist/` with:
- Code splitting per route
- Minified JavaScript and CSS
- Source maps for debugging
- Copied recipe source files

### Preview Production Build

```bash
npm run preview
```

Serves the production build locally with backend proxy support.

### Format Code

```bash
npm run format
```

Runs Prettier on all TypeScript/JavaScript files (4 spaces, no semicolons, single quotes).

## Recipe System

### Recipe Registry (`src/recipes/registry.ts`)

The **single source of truth** for all recipe metadata. All routes, navigation, and recipe cards auto-generate from this file.

#### Recipe Interface

```typescript
// Placeholder recipe (not implemented)
interface RecipePlaceholder {
    title: string
}

// Implemented recipe
export interface RecipeImplemented {
    title: string
    slug: string
    tags: string[]                    // NEW: Technology/pattern labels
    description: string
    component?: LazyExoticComponent   // Optional interactive UI
}
```

#### Example Registry

```typescript
export const recipes: RecipeMetadata = {
    "Foundations": [
        { title: 'Batch Text Classification' },  // Placeholder
        {
            slug: 'multiturn-chat',
            title: 'Multi-Turn Chat',
            tags: ['Vercel AI SDK', 'SSE'],       // Tags for tech stack
            description: 'Streaming chat interface with multi-turn conversation support...',
            component: lazyComponentExport(() => import('./multiturn-chat/ui'))
        },
        {
            slug: 'image-captioning',
            title: 'Streaming Image Captions',
            tags: ['NDJSON', 'Async Coroutines'],
            description: 'Generate captions for multiple images...',
            component: lazyComponentExport(() => import('./image-captioning/ui'))
        }
    ],
    "Data, Tools & Reasoning": [...]
}
```

#### Tags System

Tags identify the key technologies and patterns used in each recipe:

- **Display**: Shown in recipe cards and navigation
- **Format**: Array of strings (e.g., `['SSE', 'Streaming', 'Vercel AI SDK']`)
- **Purpose**: Help users quickly identify relevant recipes by technology
- **Rendering**: Sorted alphabetically and displayed as comma-separated text

### Helper Functions

```typescript
// Type guard for implemented recipes
isImplemented(recipe): recipe is RecipeImplemented

// Lookup recipe by slug
getRecipeBySlug(slug: string): RecipeImplemented | null

// Generate navigation with auto-numbering
buildNavigation(): NavSection[]

// Get all implemented recipes
getAllImplementedRecipes(): RecipeImplemented[]

// Get recipes with interactive components
getAllRecipesWithComponents(): RecipeImplemented[]

// Check if slug is implemented
isRecipeImplemented(slug: string): boolean

// Lazy load component with named export
lazyComponentExport(factory): LazyExoticComponent
```

### Adding a New Recipe

1. **Update registry** (`src/recipes/registry.ts`):
   ```typescript
   {
       slug: 'my-recipe',
       title: 'My Recipe',
       tags: ['Technology', 'Pattern'],
       description: 'What this recipe does...',
       component: lazyComponentExport(() => import('./my-recipe/ui'))
   }
   ```

2. **Create UI component** (`src/recipes/my-recipe/ui.tsx`):
   ```typescript
   import type { RecipeProps } from '../../lib/types'

   export function Component({ endpoint, model, pathname }: RecipeProps) {
       return <div>Your recipe UI</div>
   }
   ```

3. **Add README** (`src/recipes/my-recipe/README.mdx`):
   ```mdx
   # My Recipe

   Documentation content...
   ```

4. **Register README** in `registry.ts`:
   ```typescript
   export const readmeComponents = {
       'my-recipe': lazy(() => import('./my-recipe/README.mdx'))
   }
   ```

Routes auto-generate:
- `/my-recipe` - Interactive demo
- `/my-recipe/readme` - Documentation
- `/my-recipe/code` - Source code

## State Management

### Server State (SWR)

All API calls use SWR for automatic caching, revalidation, and deduplication:

```typescript
import useSWR from 'swr'
import { fetchEndpoints } from '../lib/api'

// Endpoints with auto-caching
const { data: endpoints, error, isLoading } = useSWR('/api/endpoints', fetchEndpoints)

// Models with query params
const { data: models } = useSWR(
    endpointId ? `/api/models?endpointId=${endpointId}` : null,
    () => fetchModels(endpointId!)
)
```

**Benefits:**
- Automatic request deduplication
- Cache revalidation on window focus
- Stale-while-revalidate pattern
- Small bundle size (~15KB)

### Client State (URL Query Params)

User selections stored in URL for shareability and browser history:

```typescript
// Query params: ?e=endpoint-id&m=model-name
const [searchParams, setSearchParams] = useSearchParams()

const endpointId = searchParams.get('e')
const modelName = searchParams.get('m')

// Update endpoint
setSearchParams((prev) => {
    prev.set('e', newEndpointId)
    return prev
})
```

**Custom Hooks:**
- `useEndpointFromQuery()` - Combines SWR endpoints with URL selection
- `useModelFromQuery()` - Combines SWR models with URL selection

## Component Architecture

### Layout Components

- **CookbookShell** - AppShell wrapper with header, navbar, and main content area
- **RecipeLayoutShell** - Nested layout for recipe pages (toolbar + scrollable content)
- **Header** - 70px header with responsive endpoint/model selectors
- **Navbar** - Collapsible sidebar with accordion navigation and tags

### Recipe Components

- **CookbookIndex** - Home page with recipe cards organized by section
- **RecipeReadmeView** - MDX documentation renderer with syntax highlighting
- **RecipeCodeView** - Source code viewer (backend + frontend tabs)

### Utility Components

- **ViewSelector** - Segmented control for Readme/Demo/Code views
- **SelectEndpoint** - Dropdown for LLM endpoint selection
- **SelectModel** - Dropdown for model selection (filtered by endpoint)
- **ThemeToggle** - Light/dark mode switcher

## Routing System

Routes auto-generate from the recipe registry using React Router v7:

```typescript
// Auto-generated routes
const router = createBrowserRouter([
    {
        path: '/',
        element: <CookbookShell />,
        children: [
            { index: true, element: <CookbookIndex /> },
            {
                path: ':slug',
                element: <RecipeLayoutShell />,
                children: [
                    { index: true, lazy: () => import('./recipes/[slug]/ui') },
                    { path: 'readme', element: <RecipeReadmeView /> },
                    { path: 'code', element: <RecipeCodeView /> }
                ]
            }
        ]
    }
])
```

**Key Features:**
- Lazy loading per recipe (code splitting)
- Nested layouts (shell → recipe layout → view)
- Auto-generated from registry (no manual route definitions)

## Key Patterns

### Lazy Loading with Named Exports

Recipe components export a named `Component` function instead of default export:

```typescript
// Recipe component
export function Component(props: RecipeProps) {
    return <div>Recipe UI</div>
}

// Registry
lazyComponentExport(() => import('./my-recipe/ui'))
// Converts: { Component } → { default: Component }
```

### Responsive Layout

Endpoint/model selectors appear in different locations by screen size:

- **Desktop (≥768px)**: Selectors in header (right side)
- **Mobile (<768px)**: Selectors in navbar drawer (top)

```typescript
// Header (desktop only)
<Group visibleFrom="sm">
    <SelectEndpoint />
    <SelectModel />
</Group>

// Navbar (mobile only)
<Stack hiddenFrom="sm">
    <SelectEndpoint />
    <SelectModel />
</Stack>
```

### Scrollable Recipe Layout

Recipe pages use a critical layout pattern for fixed toolbar + scrollable content:

```typescript
<Flex direction="column" h={appShellContentHeight} style={{ overflow: 'hidden' }}>
    <Toolbar title={title} />  {/* Fixed */}
    <Box style={{ flex: 1, overflow: 'auto' }}>  {/* Scrollable */}
        <Outlet />
    </Box>
</Flex>
```

### MDX Documentation

README files are MDX components with automatic syntax highlighting:

```typescript
// vite.config.ts
import mdx from '@mdx-js/rollup'

export default defineConfig({
    plugins: [
        { enforce: 'pre', ...mdx() },
        react({ include: /\.(jsx|js|mdx|md|tsx|ts)$/ })
    ]
})
```

Code blocks use highlight.js with theme switching based on Mantine color scheme.

### Type Safety

**Never use `any`** - this project maintains strict type safety:

```typescript
// ❌ BAD
const Component: ComponentType<any> = ...

// ✅ GOOD
const Component: ComponentType<RecipeProps> = ...

interface RecipeProps {
    endpoint: Endpoint | null
    model: Model | null
    pathname: string
}
```

All shared types live in `src/lib/types.ts`.

## Development Scripts

### Code Copying

The `copy-recipe-code.js` script runs automatically during dev:

```bash
npm run copy:code        # One-time copy
npm run copy:code:watch  # Watch mode (runs with npm run dev)
```

Copies recipe UI components from `src/recipes/*/ui.tsx` to `public/code/*/ui.tsx` for the code viewer.

### Available Scripts

```bash
npm run dev              # Dev server + file watcher
npm run build            # Production build
npm run preview          # Preview production build
npm run format           # Format code with Prettier
npm run copy:code        # Copy recipe source files
npm run copy:code:watch  # Watch and copy recipe source files
```

## Technologies

- **React 18** - UI library with concurrent features
- **TypeScript** - Type-safe development
- **Vite** - Build tool and dev server
- **React Router v7** - Client-side routing with lazy loading
- **Mantine v7** - UI component library with dark/light themes
- **SWR** - Lightweight data fetching with caching
- **Vercel AI SDK** - Streaming chat UI (`useChat` hook)
- **highlight.js** - Syntax highlighting for code blocks
- **MDX** - Markdown + JSX for documentation
- **Prettier** - Code formatting

## Related Documentation

- [Project Context](../.claude/project-context.md) - Comprehensive architecture reference
- [Architecture Guide](../docs/architecture.md) - Design decisions and patterns
- [Contributing Guide](../docs/contributing.md) - How to add recipes
