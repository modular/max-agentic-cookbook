# MAX Recipes Project Context

## Overview

MAX Recipes is a fullstack cookbook application for AI recipes, demonstrating integrations with Modular MAX and other AI services. The project was recently migrated from a Next.js monorepo to a simpler FastAPI + React SPA architecture.

## Why the Migration?

**Previous architecture:** Next.js monorepo with `apps/cookbook/` and `packages/recipes/`

**Reasons for change:**
- Don't need SSR/SEO features of Next.js
- Want Python backend for better AI ecosystem integration (MAX, transformers, etc.)
- Simpler architecture without monorepo complexity
- Prefer React patterns with targeted best-in-class libraries over opinionated framework abstractions

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
  - `src/recipes/models.py` - Models listing (proxies /v1/models)
  - `src/recipes/multiturn_chat.py` - Multi-turn chat recipe router (stubbed)
  - `src/recipes/image_captioning.py` - Image captioning with NDJSON streaming (✅ implemented)
  - `src/core/` - Config and utilities
- **Endpoints:**
  - `GET /api/health` - Health check
  - `GET /api/recipes` - List available recipe slugs (programmatically discovers registered routes)
  - `GET /api/endpoints` - List configured LLM endpoints (from .env.local)
  - `GET /api/models?endpointId=xxx` - List models for endpoint (proxies OpenAI-compatible /v1/models)
  - `POST /api/recipes/multiturn-chat` - Multi-turn chat endpoint (stubbed)
  - `POST /api/recipes/image-captioning` - Image captioning with NDJSON streaming, parallel processing, performance metrics (✅ implemented)

### Frontend (Vite + React)
- **Tech:** Vite, React 18, TypeScript, React Router v7, Mantine v7, TanStack Query v5, Prettier
- **Port:** 5173
- **Routing:** Manual route definitions in `App.tsx` with React Router v7 `lazy` prop for code splitting
- **API:** Vite proxy to backend (no CORS issues)
- **UI:** Mantine v7 with custom theme (nebula/twilight colors), 70px header height
- **Layout:** AppShell with collapsible sidebar, responsive Header (endpoint/model selectors in header on desktop, in navbar drawer on mobile)
- **State Management:**
  - Server State: TanStack Query (API data fetching, caching, background refetching)
  - Client State: URL query params (`?e=endpoint-id&m=model-name`) via custom hooks
- **Structure:**
  - `src/recipes/` - Recipe components (lazy loaded)
  - `src/components/` - Shared UI (Header, Navbar, Toolbar, SelectEndpoint, SelectModel, CodeToggle)
  - `src/lib/` - Custom hooks with TanStack Query (useEndpointFromQuery, useModelFromQuery), query keys, types, theme, config
  - `src/App.tsx` - QueryClientProvider wrapper + auto-generated `<Routes>` definitions with lazy loading

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
5. ✅ **TanStack Query for server state** (API data fetching with automatic caching, background refetching, request deduplication)
6. ✅ **URL query params for client state** (no React Context - endpoint/model selection via ?e= and ?m=)
7. ✅ **Lazy loading with React Router v7** (exports `Component` function, generic `lazyComponentExport` helper)
8. ✅ **Single source of truth for recipes** (registry in recipes/ folder, backend advertises availability)

## Data Fetching Strategy

The frontend uses a **hybrid state management approach**:

### Server State (TanStack Query)
- All API calls use TanStack Query's `useQuery()` hook
- **Automatic caching** - API responses cached for 5 minutes (configurable)
- **Request deduplication** - Multiple components requesting same data share one request
- **Background refetching** - Data stays fresh automatically
- **Centralized query keys** in `lib/api.ts` for type safety and cache invalidation
- **React Query DevTools** included for debugging (toggle in bottom-left corner)

**Example:**
```ts
const { data: endpoints, isLoading, error } = useQuery({
  queryKey: queryKeys.endpoints,
  queryFn: fetchEndpoints,
})
```

### Client State (URL Query Params)
- User selections (endpoint, model) stored in URL query params
- Enables shareable URLs and browser back/forward
- Custom hooks (`useEndpointFromQuery`, `useModelFromQuery`) combine TanStack Query with URL param syncing
- Auto-selection logic: first endpoint/model selected by default

**Why this approach?**
- **Server state** (API data) needs caching, refetching, deduplication → TanStack Query
- **Client state** (user selections) needs persistence, shareability → URL query params
- Clean separation of concerns with minimal boilerplate

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
- Backend routes: `/api/endpoints` and `/api/models` (proxies OpenAI-compatible endpoints)
- TanStack Query v5 for server state management (automatic caching, background refetching, request deduplication)
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
- Individual recipe routers: `multiturn_chat.py` (stubbed) and `image_captioning.py` (✅ implemented)
- CookbookIndex shows dynamic grid of recipe cards
- Navbar uses shared `isRecipeImplemented()` helper
- No duplication between frontend and backend metadata

## Recipe Migration Plans

This section documents the detailed migration strategy for porting recipes from the Next.js monorepo to the FastAPI + React SPA architecture. Each recipe uses a targeted approach based on its complexity and requirements.

### Image Captioning Recipe ✅ Completed

**Architecture Decision:** Python OpenAI Client + FastAPI Streaming + Custom useNDJSON Hook

**Implementation Status:** Fully implemented and tested with NDJSON streaming, parallel processing, and performance metrics.

**Backend Implementation:**
- Use Python `openai` client (already installed) with FastAPI streaming response
- Implement NDJSON (newline-delimited JSON) streaming for progressive updates
- Support batch processing: parallel requests for multiple images
- Track performance metrics: TTFT (time to first token) and duration per image
- Route: `POST /api/recipes/image-captioning`

**Frontend Implementation:**
- Custom `useNDJSON<T>` hook for progressive NDJSON streaming (framework-agnostic, reusable)
- File upload with `@mantine/dropzone` component
- Image gallery with loading overlays and real-time caption updates
- Performance metrics display: TTFT and duration formatted with `pretty-ms`
- Component exports `Component` function for lazy loading via registry

**Key Features to Preserve:**
- Batch image captioning with parallel processing
- Progressive streaming (results appear as they complete)
- Performance metrics (TTFT and duration timing)
- NDJSON streaming format for progressive updates

**Dependencies:**
- Backend: `openai` (✅ installed), FastAPI streaming
- Frontend: `@tanstack/react-query` (✅ installed), `nanoid` (✅ installed), `pretty-ms` (✅ installed)
- No Vercel AI SDK needed - clean Python approach

**Why This Approach:**
- Frontend already has framework-agnostic NDJSON streaming (useNDJSON hook)
- Python OpenAI client handles streaming naturally with `for chunk in stream`
- TanStack Query perfect for mutations with loading/error states
- Fits our Python-first backend architecture
- Simple, clean, no unnecessary dependencies

---

### Multi-turn Chat Recipe ✅ Completed

**Architecture Decision:** Python SSE Streaming + Vercel AI SDK Frontend

**Implementation Status:** Fully implemented and tested with Python SSE streaming, token-by-token streaming, multi-turn conversation context, and auto-focus UX.

**Backend Implementation:**
- Python SSE (Server-Sent Events) streaming with FastAPI `StreamingResponse`
- Custom UIMessage → OpenAI format conversion
- AsyncOpenAI client for token streaming (already installed)
- Vercel AI SDK protocol compliance with correct event types:
  - `{"type": "start", "messageId": "..."}` (message start)
  - `{"type": "text-delta", "id": "...", "delta": "..."}` (streaming text)
  - `{"type": "finish"}` and `[DONE]` (completion)
- Route: `POST /api/recipes/multiturn-chat`

**Frontend Implementation:**
- Vercel AI SDK's `useChat` hook with `DefaultChatTransport`
- Flex layout pattern: messages area fills viewport, composer pinned at bottom
- Auto-focus on mount and after sending messages (excellent UX)
- Auto-scroll behavior with smart manual scroll detection
- Streamdown component for markdown rendering with syntax highlighting
- Component exports `Component` function for lazy loading via registry

**Key Features Implemented:**
- Token-by-token streaming for real-time response
- Multi-turn conversation with full message history maintained
- Auto-scroll behavior with smart manual scroll detection
- Markdown rendering with syntax-highlighted code blocks (Streamdown)
- Auto-focus input field on load and after sending

**Dependencies:**
- Backend: `openai` (AsyncOpenAI - ✅ already installed), FastAPI streaming
- Frontend: `ai` (✅ installed), `@ai-sdk/react` (✅ installed), `streamdown` (✅ installed)

**Why This Approach:**
- Successfully demonstrates Python SSE can work seamlessly with Vercel AI SDK frontend
- Clean separation: Python-first backend, React frontend with proven AI SDK
- `useChat` hook handles complex state: streaming, message history, error recovery
- No Node.js dependency needed - pure Python backend
- Streamdown handles markdown rendering with streaming updates
- SSE-based streaming is production-ready and standardized

---

### Migration Dependency Summary

**Frontend packages installed:**
- ✅ `ai` - Vercel AI SDK core (for multi-turn chat)
- ✅ `@ai-sdk/react` - React hooks (`useChat`) for Vercel AI SDK
- ✅ `streamdown` - Markdown streaming with syntax highlighting
- ✅ `nanoid` - Unique ID generation (used in image captioning)
- ✅ `pretty-ms` - Human-readable time formatting (used for performance metrics)

**Backend implementation:**
- ✅ Image captioning: Pure Python with `openai` client and NDJSON streaming
- ✅ Multi-turn chat: Pure Python SSE streaming compatible with Vercel AI SDK frontend

**Migration completed:**
1. ✅ **Image Captioning** - Pure Python with NDJSON streaming, parallel processing, performance metrics
2. ✅ **Multi-turn Chat** - Python SSE streaming with Vercel AI SDK frontend, token streaming, multi-turn context

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
- ✅ `@tanstack/react-query@^5` - Server state management with automatic caching, background refetching
- ✅ `@tanstack/react-query-devtools` - Development tools for debugging queries
- ✅ `nanoid` - Unique ID generation
- ✅ `pretty-ms` - Human-readable time formatting
- ✅ `prettier@^3` - Code formatter
- ✅ `postcss-preset-mantine` - Mantine PostCSS preset

**Frontend (To Add When Porting Recipes):**
- `ai` - Vercel AI SDK (for multi-turn chat streaming)
- `@ai-sdk/react` - React hooks for Vercel AI SDK
- `streamdown` - Markdown streaming with syntax highlighting
- Other dependencies as needed

**Backend (Installed):**
- ✅ `python-dotenv` - Load .env.local for configuration
- ✅ `openai` - OpenAI Python client for API proxying

**Backend (To Add):**
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
      component: lazyComponentExport(() => import('./image-captioning/ui'))
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
- **Server state via TanStack Query** - automatic caching, background refetch, request deduplication
- **Query keys centralized** in `api.ts` for type safety and cache invalidation
- **Client state via URL params** - shareable URLs, browser back/forward support
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
│   ├── hooks.ts                # useQuery-based hooks with URL param syncing (useEndpointFromQuery, useModelFromQuery)
│   ├── api.ts                  # Query functions, centralized query keys for TanStack Query
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
└── App.tsx                     # QueryClientProvider wrapper + auto-generates routes from registry
```

## Important Implementation Notes

- **Recipe Registry:** Single source of truth in `registry.ts` - edit to add/reorder recipes, routes auto-generate
- **Lazy Loading:** Recipe components export `Component` function, use `lazyComponentExport()` helper
- **Data Fetching:** TanStack Query for all API calls - see `api.ts` for query keys and query functions
- **State Management:** Server state (TanStack Query) + Client state (URL query params)
- **Query Params:** Endpoint/model state in URL (`?e=endpoint-id&m=model-name`) via custom hooks
- **Responsive Layout:** Endpoint/model selectors in header (desktop) or navbar drawer (mobile)
- **Formatting:** 4 spaces, no semis, single quotes (run `npm run format`)

## TypeScript Coding Standards

**Critical:** Never use the `any` type in TypeScript code. This project maintains strict type safety.

**Type Safety Guidelines:**
- ❌ **Never use `any`** - bypasses type checking and defeats the purpose of TypeScript
- ✅ **Use `unknown`** - for truly dynamic data that will be validated at runtime (e.g., `body: unknown` in fetch calls)
- ✅ **Use proper interfaces** - define explicit interfaces like `RecipeProps` for component props
- ✅ **Use generic types** - e.g., `ComponentType<RecipeProps>` instead of `ComponentType<any>`
- ✅ **Use type guards** - `isImplemented(recipe)` for runtime type narrowing

**Examples:**
```typescript
// ❌ BAD - bypasses type checking
function process(data: any) { ... }
const Component: ComponentType<any> = ...

// ✅ GOOD - maintains type safety
function process(data: unknown) { ... }  // Will validate before use
const Component: ComponentType<RecipeProps> = ...
interface RecipeProps {
  endpoint: Endpoint | null
  model: Model | null
  pathname: string
}
```

**Why This Matters:**
- Catches bugs at compile time instead of runtime
- Enables IDE autocomplete and refactoring
- Documents expected data shapes
- Makes code more maintainable

**Shared Types:**
All shared types live in `frontend/src/lib/types.ts` for consistency across the codebase.

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
