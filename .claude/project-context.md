# MAX Recipes Project Context

## Overview

MAX Recipes is a fullstack cookbook application for AI recipes, demonstrating integrations with Modular MAX and other AI services. The project was recently migrated from a Next.js monorepo to a simpler FastAPI + React SPA architecture.

## Why the Migration?

**Previous architecture:** Next.js monorepo with `apps/cookbook/` and `packages/recipes/`

**Reasons for change:**
- Don't need SSR/SEO features of Next.js
- Want Python backend for better AI ecosystem integration (MAX, transformers, etc.)
- Simpler architecture without monorepo complexity
- Prefer plain React patterns over framework abstractions

## Current Architecture

```
max-recipes/
├── backend/              # FastAPI + uv (Python 3.11+)
├── frontend/             # Vite + React + TypeScript SPA
├── monorepo/             # OLD: Archived Next.js monorepo
└── archive/              # Legacy standalone recipes
```

### Backend (FastAPI + uv)
- **Tech:** FastAPI, uvicorn, uv for dependency management, python-dotenv
- **Port:** 8000
- **CORS:** Configured for localhost:5173
- **Env:** `.env.local` with COOKBOOK_ENDPOINTS JSON array
- **Structure:**
  - `src/main.py` - Entry point, loads .env.local, includes recipe routers
  - `src/recipes/endpoints.py` - Endpoint management with caching
  - `src/recipes/models.py` - Models listing (stubbed)
  - `src/recipes/multiturn_chat.py` - Multi-turn chat recipe router (stubbed)
  - `src/recipes/image_captioning.py` - Image captioning recipe router (stubbed)
  - `src/core/` - Config and utilities
- **Endpoints:**
  - `GET /api/health` - Health check
  - `GET /api/recipes` - List available recipe slugs (programmatically discovers registered routes)
  - `GET /api/endpoints` - List configured LLM endpoints (from .env.local)
  - `GET /api/models?endpointId=xxx` - List models for endpoint (stubbed)
  - `POST /api/recipes/multiturn-chat` - Multi-turn chat endpoint (stubbed)
  - `POST /api/recipes/image-captioning` - Image captioning endpoint (stubbed)

### Frontend (Vite + React)
- **Tech:** Vite, React 18, TypeScript, React Router v7, Mantine v7, Prettier
- **Port:** 5173
- **Routing:** Manual route definitions in `App.tsx` with React Router v7 `lazy` prop for code splitting
- **API:** Vite proxy to backend (no CORS issues)
- **UI:** Mantine v7 with custom theme (nebula/twilight colors), 70px header height
- **Layout:** AppShell with collapsible sidebar, responsive Header (endpoint/model selectors in header on desktop, in navbar drawer on mobile)
- **State Management:** URL query params (`?e=endpoint-id&m=model-name`) via custom hooks
- **Structure:**
  - `src/recipes/` - Recipe components (lazy loaded)
  - `src/components/` - Shared UI (Header, Navbar, Toolbar, SelectEndpoint, SelectModel, CodeToggle)
  - `src/lib/` - Custom hooks (useEndpointFromQuery, useModelFromQuery), types, theme, config
  - `src/App.tsx` - Manual `<Routes>` definitions with lazy loading

**Routes:**
- `/` - Recipe cards grid (dynamically generated from registry)
- `/:slug` - Recipe demo (auto-generated from registry, lazy loaded)
- `/:slug/readme` - Dynamic README route for any recipe
- `/:slug/code` - Dynamic code view route for any recipe

## Key Architectural Decisions

1. ✅ **Separate projects** not monorepo (frontend/ and backend/ at root)
2. ✅ **uv** for Python dependency management (fast, modern)
3. ✅ **React Router v7 with auto-generated routes** (routes generated from registry, no manual route definitions per recipe)
4. ✅ **Separate dev servers** (backend :8000, frontend :5173 with proxy)
5. ✅ **Plain React patterns** (useState, useEffect, fetch - no framework abstractions)
6. ✅ **URL query params for state** (no React Context - endpoint/model selection via ?e= and ?m=)
7. ✅ **Lazy loading with React Router v7** (exports `Component` function, generic `lazyComponentExport` helper)
8. ✅ **Single source of truth for recipes** (registry in recipes/ folder, backend advertises availability)

## Current Status

### ✅ Completed (Phase 1: Infrastructure)
- FastAPI backend scaffolded and running (uv, FastAPI, uvicorn)
- React SPA scaffolded and running (Vite, React 18, TypeScript)
- CORS and API proxy configured
- Example endpoints: `/api/health`, `/api/recipes`

### ✅ Completed (Phase 2: UI Shell & Responsive Header)
- Mantine v7 with custom theme (nebula/twilight colors)
- AppShell layout with collapsible sidebar (mobile + desktop)
- Header component (70px height, responsive layout):
  - Left: burger menu (mobile), sidebar toggle, title
  - Right: endpoint/model selectors (desktop only), theme toggle
- Navbar component with accordion sections + endpoint/model selectors at top (mobile only)
- Recipe metadata for 2 recipes (multiturn-chat, image-captioning)
- Placeholder recipe pages
- Routes consolidated to root level (no `/cookbook` prefix)

### ✅ Completed (Phase 3: Query Params & Routing)
- URL query params for endpoint/model selection via custom hooks
- Backend routes: `/api/endpoints` and `/api/models` (stubbed)
- RecipeLayoutShell with nested routing
- Toolbar component (simplified: recipe title + CodeToggle only)
- React Router v7 lazy loading with `lazy` prop
- Dynamic `:slug/code` route for recipe source view

### ✅ Completed (Phase 4: Recipe Registry & Auto-Generated Routes)
- Restructured recipe metadata into `registry.ts` (in recipes/ folder, co-located with recipe components)
- Auto-numbering based on array position (1, 2, 3...)
- Display titles auto-generated ("1: Introduction", "2: Multi-Turn Chat", etc.)
- Helper functions: `isImplemented()`, `getRecipeBySlug()`, `buildNavigation()`, `getAllImplementedRecipes()`, `getAllRecipesWithComponents()`, `isRecipeImplemented()`
- Recipe components registered directly in registry with optional `component` property
- Routes auto-generated in App.tsx from registry (no manual route definitions per recipe)
- `chapters.ts` now auto-derived from `registry.ts` (single source of truth)
- Backend `/api/recipes` programmatically discovers available routes (returns array of slugs)
- Individual recipe routers: `multiturn_chat.py` and `image_captioning.py` (stubbed)
- CookbookIndex shows dynamic grid of recipe cards
- Navbar uses shared `isRecipeImplemented()` helper
- No duplication between frontend and backend metadata

### 🔄 Next: Port Recipe UI Components

Port recipe components from `monorepo/packages/recipes/src/` to `frontend/src/recipes/[recipe-name]/`

**To port:**
- Multi-turn Chat UI (`multiturn-chat/ui.tsx`)
- Image Captioning UI (`image-captioning/ui.tsx`)
- Shared utilities and types as needed
- Backend API routes (`api.ts` files → FastAPI routes)

### Adding a New Recipe

1. Add entry to `frontend/src/recipes/registry.ts` (include `component` property for interactive UI)
2. Create `backend/src/recipes/[recipe_name].py` with APIRouter
3. Include router in `backend/src/main.py`
4. Add UI component to `frontend/src/recipes/[recipe-name]/`
5. Add `README.mdx` to `frontend/src/recipes/[recipe-name]/` for documentation
6. Add recipe slug to `readmeComponents` in `registry.ts`
7. Routes, index page, and navigation update automatically

**Routes created:**
- `/:slug` - Demo view (interactive UI, auto-generated if `component` in registry)
- `/:slug/readme` - README documentation (auto-available for all recipes)
- `/:slug/code` - Source code view (auto-available for all recipes)

## Development Workflow

### Start both servers:

**Terminal 1 (Backend):**
```bash
cd backend
uv run uvicorn src.main:app --reload --port 8000
```

**Terminal 2 (Frontend):**
```bash
cd frontend
npm run dev
```

Visit: `http://localhost:5173`

### Key Files to Know

- `frontend/src/recipes/registry.ts` - **SINGLE SOURCE OF TRUTH** for all recipe metadata
- `backend/src/recipes/[recipe_name].py` - Individual recipe API routers
- `backend/src/main.py` - Include recipe routers, programmatic route discovery
- `frontend/src/App.tsx` - Auto-generates routes from registry (no manual edits needed per recipe)
- `frontend/src/lib/api.ts` - Add new API client functions
- `frontend/src/lib/types.ts` - Add shared TypeScript types

## Dependencies

**Frontend (Installed):**
- ✅ `@mantine/core@^7` - UI component library
- ✅ `@mantine/hooks@^7` - React hooks
- ✅ `@mantine/dropzone@^7` - File upload
- ✅ `@tabler/icons-react` - Icons
- ✅ `react-router-dom@^7` - React Router v7 with lazy loading
- ✅ `prettier@^3` - Code formatter
- ✅ `postcss-preset-mantine` - Mantine PostCSS preset

**Frontend (To Add When Porting Recipes):**
- `ai` - Vercel AI SDK (for streaming)
- `streamdown` - Markdown streaming with syntax highlighting
- Other dependencies as needed

**Backend (Installed):**
- ✅ `python-dotenv` - Load .env.local for configuration

**Backend (To Add):**
- OpenAI client or similar for AI inference
- Other dependencies based on recipe needs

## Recipe Registry Architecture

### Single Source of Truth (`registry.ts`)

All recipe metadata lives in `frontend/src/recipes/registry.ts`:

```ts
export const recipes = {
  "Foundations": [
    { title: 'Introduction' },  // placeholder (no slug)
    {
      slug: 'multiturn-chat',
      title: 'Multi-Turn Chat',
      description: '...',
      component: lazyComponentExport(() => import('./multiturn-chat/MultiturnChatPlaceholder'))
    },
    { title: 'Batch Safety Classification' },  // placeholder
    {
      slug: 'image-captioning',
      title: 'Streaming Image Captions',
      description: '...',
      component: lazyComponentExport(() => import('./image-captioning/ImageCaptioningPlaceholder'))
    }
  ],
  "Data, Tools & Reasoning": [...],
  // ... more sections
}
```

**Key features:**
- Nested `section → recipes[]` structure
- Placeholders have only `title` (dimmed in nav)
- Implemented recipes have `slug` + `description` (clickable in nav + shown as cards)
- Optional `component` property for interactive recipe UI (routes auto-generated)
- Numbers auto-derived from array position (just reorder to renumber)
- Display format auto-generated ("1: Introduction", "2: Multi-Turn Chat")

**Helper functions:**
- `isImplemented(recipe)` - Type guard for checking if recipe has slug
- `getRecipeBySlug(slug)` - Lookup recipe by slug
- `buildNavigation()` - Generate nav with auto-numbering
- `getAllImplementedRecipes()` - Get all recipes with slugs
- `getAllRecipesWithComponents()` - Get recipes with interactive UI components
- `isRecipeImplemented(slug)` - Check if slug is implemented
- `lazyComponentExport()` - Helper for lazy loading components that export `Component`

**Frontend usage:**
- `App.tsx` uses `getAllRecipesWithComponents()` to auto-generate routes
- `CookbookIndex.tsx` uses `getAllImplementedRecipes()` for card grid
- `Navbar.tsx` uses `isRecipeImplemented()` to check if clickable
- `chapters.ts` auto-derives navigation from `buildNavigation()`

**Backend usage:**
- Backend `/api/recipes` programmatically discovers routes
- Returns array of slugs like `["multiturn-chat", "image-captioning"]`
- Frontend already has the metadata (title, description)
- No duplication needed

## Key Patterns

- **Auto-generated routing** - routes generated from registry, no manual definitions per recipe
- **Plain React patterns** - no loaders/actions, use hooks and fetch
- **Backend routes** prefixed with `/api`
- **Adding a recipe**: Update `registry.ts` with component property - routes update automatically

### Responsive Layout Pattern

The endpoint/model selectors appear in different locations based on screen size:

- **Desktop (≥sm)**: Selectors in Header (right side, `visibleFrom="sm"`)
- **Mobile (<sm)**: Selectors in Navbar drawer (top, `hiddenFrom="sm"`)

This ensures controls are always accessible while optimizing for each screen size.

## Frontend Structure

```
frontend/src/
├── recipes/
│   ├── registry.ts             # SINGLE SOURCE OF TRUTH for all recipe metadata
│   ├── multiturn-chat/         # Multi-turn chat recipe components
│   │   ├── README.mdx          # Recipe documentation
│   │   └── ...                 # Demo component
│   └── image-captioning/       # Image captioning recipe components
│       ├── README.mdx          # Recipe documentation
│       └── ...                 # Demo component
├── lib/
│   ├── chapters.ts             # Auto-derived from registry
│   ├── theme.ts                # Custom Mantine theme (70px header, nebula/twilight colors)
│   ├── types.ts                # Shared TypeScript types
│   ├── hooks.ts                # useEndpointFromQuery, useModelFromQuery
│   ├── api.ts                  # API client utilities
│   └── utils.ts                # Shared utilities
├── components/
│   ├── Header.tsx              # 70px header with responsive endpoint/model selectors
│   │                           # Desktop: selectors in header right side
│   │                           # Mobile: only theme toggle (selectors in navbar)
│   ├── Navbar.tsx              # Sidebar with accordion navigation
│   │                           # Mobile: endpoint/model selectors at top
│   ├── Toolbar.tsx             # Recipe page toolbar (title + ViewSelector)
│   ├── SelectEndpoint.tsx      # Endpoint selector dropdown
│   ├── SelectModel.tsx         # Model selector dropdown
│   ├── ViewSelector.tsx        # SegmentedControl for Readme | Demo | Code views
│   └── ThemeToggle.tsx         # Light/dark mode toggle
├── features/
│   ├── CookbookShell.tsx       # AppShell layout wrapper
│   ├── CookbookIndex.tsx       # Recipe cards grid
│   ├── RecipeLayoutShell.tsx   # Nested layout for recipe pages
│   ├── RecipeReadmeView.tsx    # README view (lazy loaded, renders MDX)
│   └── RecipeCodeView.tsx      # Code view (lazy loaded)
├── mdx.d.ts                    # TypeScript declarations for .mdx files
└── App.tsx                     # Auto-generates routes from registry
```

## Important Implementation Notes

- **Recipe Registry:** Single source of truth in `registry.ts` - edit to add/reorder recipes, routes auto-generate
- **Lazy Loading:** Recipe components export `Component` function, use `lazyComponentExport()` helper
- **Query Params:** Endpoint/model state in URL (`?e=endpoint-id&m=model-name`) via custom hooks
- **Responsive Layout:** Endpoint/model selectors in header (desktop) or navbar drawer (mobile)
- **Formatting:** 4 spaces, no semis, single quotes (run `npm run format`)

## Recipe Page Views (Readme | Demo | Code)

Each recipe has three views accessible via the ViewSelector segmented control:

### View Types
- **Readme** (`/:slug/readme`) - MDX documentation rendered by `RecipeReadmeView.tsx`
- **Demo** (`/:slug`) - Interactive recipe UI component
- **Code** (`/:slug/code`) - Source code view rendered by `RecipeCodeView.tsx`

### ViewSelector Component
- Uses Mantine's `SegmentedControl` with three options
- Lives in Toolbar, always visible on recipe pages
- Handles navigation between the three views using React Router

### RecipeLayoutShell Scrollable Layout Pattern

**Critical layout pattern** for recipe pages:

```tsx
<Flex direction="column" h={appShellContentHeight} style={{ overflow: 'hidden' }}>
  <Toolbar title={title} />
  <Box style={{ flex: 1, overflow: 'auto' }}>
    <Outlet />  {/* Child routes render here */}
  </Box>
</Flex>
```

**Key points:**
- Parent Flex has **fixed height** (`appShellContentHeight`) and `overflow: 'hidden'`
- Outlet wrapper (Box) has **`flex: 1`** (takes remaining space) and **`overflow: 'auto'`** (scrollable)
- This keeps the Toolbar fixed at top while content scrolls
- Without this pattern, content will be invisible/clipped!

### MDX Support

MDX files are rendered as React components using `@mdx-js/rollup`:

**Configuration** (`vite.config.ts`):
```ts
plugins: [
  { enforce: 'pre', ...mdx() },
  react({ include: /\.(jsx|js|mdx|md|tsx|ts)$/ })
]
```

**TypeScript declarations** (`src/mdx.d.ts`):
```ts
declare module '*.mdx' {
  import { ComponentType } from 'react'
  const Component: ComponentType
  export default Component
}
```

**Adding README to new recipe:**
1. Create `README.mdx` in recipe folder (e.g., `recipes/my-recipe/README.mdx`)
2. Add to `readmeComponents` in `registry.ts`
3. README will automatically be available at `/my-recipe/readme`
