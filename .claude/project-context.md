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
- **UI:** Mantine v7 with custom theme (nebula/twilight colors)
- **Layout:** AppShell with collapsible sidebar, Header, Navbar
- **State Management:** URL query params (`?e=endpoint-id&m=model-name`) via custom hooks
- **Structure:**
  - `src/features/` - Recipe feature components (lazy loaded)
  - `src/components/` - Shared UI (Header, Navbar, Toolbar, SelectEndpoint, SelectModel, CodeToggle)
  - `src/lib/` - Custom hooks (useEndpointFromQuery, useModelFromQuery), types, theme, config
  - `src/App.tsx` - Manual `<Routes>` definitions with lazy loading

**Routes:**
- `/` - Recipe cards grid (dynamically generated from recipeMetadata)
- `/multiturn-chat` - Multi-turn chat recipe (placeholder, lazy loaded)
- `/image-captioning` - Image captioning recipe (placeholder, lazy loaded)
- `/:slug/code` - Dynamic code view route for any recipe

## Key Architectural Decisions

1. ✅ **Separate projects** not monorepo (frontend/ and backend/ at root)
2. ✅ **uv** for Python dependency management (fast, modern)
3. ✅ **Manual React Router v7** (explicit route definitions, no file-system routing, native lazy loading)
4. ✅ **Separate dev servers** (backend :8000, frontend :5173 with proxy)
5. ✅ **Plain React patterns** (useState, useEffect, fetch - no framework abstractions)
6. ✅ **URL query params for state** (no React Context - endpoint/model selection via ?e= and ?m=)
7. ✅ **Lazy loading with React Router v7** (using `lazy` prop, exports `Component` function)
8. ✅ **Single source of truth for recipes** (frontend owns metadata, backend advertises availability)

## Current Status

### ✅ Completed (Phase 1: Infrastructure)
- FastAPI backend scaffolded and running (uv, FastAPI, uvicorn)
- React SPA scaffolded and running (Vite, React 18, TypeScript)
- CORS and API proxy configured
- Example endpoints: `/api/health`, `/api/recipes`

### ✅ Completed (Phase 2: UI Shell)
- Mantine v7 installed and configured with custom theme
- Custom theme with nebula/twilight colors ported from monorepo
- AppShell layout with collapsible sidebar (mobile + desktop)
- Header component (burger menu, sidebar toggle, title, theme toggle)
- Navbar component with accordion sections (6 sections, 19 items)
- ThemeToggle component (light/dark mode)
- Chapters configuration (Foundations, Data/Tools, Planning, Context, Advanced, Appendix)
- Recipe metadata for 2 recipes (multiturn-chat, image-captioning)
- Placeholder recipe pages at `/multiturn-chat` and `/image-captioning`
- Routes consolidated to root level (no `/cookbook` prefix)
- Favicon added

### ✅ Completed (Phase 3: Query Params & Routing)
- Replaced CookbookProvider/useCookbook with URL query params
- Custom hooks: `useEndpointFromQuery()` and `useModelFromQuery(endpointId)`
- Backend routes: `/api/endpoints` and `/api/models` (stubbed)
- RecipeLayoutShell with nested routing (wraps all recipe pages)
- Toolbar component with title, CodeToggle, SelectEndpoint, SelectModel
- React Router v7 lazy loading with `lazy` prop
- Dynamic `:slug/code` route for recipe source view
- Prettier installed and configured

### ✅ Completed (Phase 4: Recipe Metadata Consolidation)
- Restructured `recipeMetadata.ts` with nested section → recipes structure
- Auto-numbering based on array position (1, 2, 3...)
- Display titles auto-generated ("1: Introduction", "2: Multi-Turn Chat", etc.)
- Helper functions: `isImplemented()`, `getRecipeBySlug()`, `buildNavigation()`, `getAllImplementedRecipes()`, `isRecipeImplemented()`
- `chapters.ts` now auto-derived from `recipeMetadata.ts` (single source of truth)
- Backend `/api/recipes` programmatically discovers available routes (returns array of slugs)
- Individual recipe routers: `multiturn_chat.py` and `image_captioning.py` (stubbed)
- CookbookIndex now shows dynamic grid of recipe cards
- Navbar uses shared `isRecipeImplemented()` helper
- No duplication between frontend and backend metadata

### 🔄 Next: Port Recipe UI Components

From `monorepo/packages/recipes/src/`:

**Recipes to port (UI only for now):**
1. **Multi-turn Chat** (`multiturn-chat/ui.tsx`)
   - Port to `frontend/src/features/multiturn-chat/MultiturnChat.tsx`
   - Replace placeholder component
   - May need shared utilities and types

2. **Image Captioning** (`image-captioning/ui.tsx`)
   - Port to `frontend/src/features/image-captioning/ImageCaptioning.tsx`
   - Replace placeholder component
   - May need Dropzone and NDJSON streaming utilities

**Shared code (port as needed):**
- Shared components from `monorepo/packages/recipes/src/components.tsx`
- Utilities from `monorepo/packages/recipes/src/utils.ts`
- Additional types from `monorepo/packages/recipes/src/types.ts`

**Backend API routes (later):**
- Port `api.ts` files to FastAPI routes when ready to wire up functionality

### Migration Pattern

For each recipe:
1. **Add to recipe metadata** - Add entry to `frontend/src/lib/recipeMetadata.ts` in appropriate section
2. **Create backend route** - Create `backend/src/recipes/[recipe_name].py` with APIRouter
3. **Include router** - Import and include router in `backend/src/main.py`
4. **Copy UI component** - Copy to `frontend/src/features/[recipe]/`
5. **Add route definition** - Add to `frontend/src/App.tsx` with lazy loading
6. **Test** - Index page, navigation, and recipe page all update automatically

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

- `frontend/src/lib/recipeMetadata.ts` - **SINGLE SOURCE OF TRUTH** for all recipe metadata
- `backend/src/recipes/[recipe_name].py` - Individual recipe API routers
- `backend/src/main.py` - Include recipe routers, programmatic route discovery
- `frontend/src/App.tsx` - Add new route definitions here
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

## Recipe Metadata Architecture

### Single Source of Truth (`recipeMetadata.ts`)

All recipe metadata lives in `frontend/src/lib/recipeMetadata.ts`:

```ts
export const recipes = {
  "Foundations": [
    { title: 'Introduction' },  // placeholder (no slug)
    { slug: 'multiturn-chat', title: 'Multi-Turn Chat', description: '...' },
    { title: 'Batch Safety Classification' },  // placeholder
    { slug: 'image-captioning', title: 'Streaming Image Captions', description: '...' }
  ],
  "Data, Tools & Reasoning": [...],
  // ... more sections
}
```

**Key features:**
- Nested `section → recipes[]` structure
- Placeholders have only `title` (dimmed in nav)
- Implemented recipes have `slug` + `description` (clickable in nav + shown as cards)
- Numbers auto-derived from array position (just reorder to renumber)
- Display format auto-generated ("1: Introduction", "2: Multi-Turn Chat")

**Helper functions:**
- `isImplemented(recipe)` - Type guard for checking if recipe has slug
- `getRecipeBySlug(slug)` - Lookup recipe by slug
- `buildNavigation()` - Generate nav with auto-numbering
- `getAllImplementedRecipes()` - Get all recipes with slugs
- `isRecipeImplemented(slug)` - Check if slug is implemented

**Frontend usage:**
- `CookbookIndex.tsx` uses `getAllImplementedRecipes()` for card grid
- `Navbar.tsx` uses `isRecipeImplemented()` to check if clickable
- `chapters.ts` auto-derives navigation from `buildNavigation()`

**Backend usage:**
- Backend `/api/recipes` programmatically discovers routes
- Returns array of slugs like `["multiturn-chat", "image-captioning"]`
- Frontend already has the metadata (title, description)
- No duplication needed

## Important Notes

- Uses **manual routing** not file-based routing (explicitly chosen)
- Avoid using loaders/actions patterns (plain React only)
- Backend routes should be prefixed with `/api`
- Keep recipe features self-contained in their own directories
- Frontend can call `/api/*` directly (proxy handles it)
- **Adding a recipe**: Just add to `recipeMetadata.ts` - everything else updates automatically

## Frontend Structure (Current)

```
frontend/src/
├── lib/
│   ├── theme.ts                # Custom Mantine theme (nebula/twilight)
│   ├── recipeMetadata.ts       # SINGLE SOURCE OF TRUTH for all recipe metadata
│   │                           # - Nested section → recipes structure
│   │                           # - Auto-numbering (1, 2, 3...)
│   │                           # - Helper functions: isImplemented, getRecipeBySlug,
│   │                           #   buildNavigation, getAllImplementedRecipes, isRecipeImplemented
│   ├── chapters.ts             # Auto-derived from recipeMetadata (legacy compatibility)
│   ├── types.ts                # Shared TypeScript types (Endpoint, Model)
│   ├── hooks.ts                # useEndpointFromQuery, useModelFromQuery
│   ├── api.ts                  # API client utilities
│   └── utils.ts                # (to be ported)
├── components/
│   ├── Header.tsx              # Top bar with menu + theme toggle
│   ├── Navbar.tsx              # Sidebar with accordion (uses isRecipeImplemented helper)
│   ├── Navbar.module.css       # Navbar styles
│   ├── ThemeToggle.tsx         # Light/dark mode toggle
│   ├── Toolbar.tsx             # Recipe toolbar with title + controls
│   ├── CodeToggle.tsx          # Toggle between demo and code view
│   ├── SelectEndpoint.tsx      # Endpoint selector (query params)
│   └── SelectModel.tsx         # Model selector (query params)
├── features/
│   ├── CookbookShell.tsx       # AppShell layout wrapper
│   ├── CookbookIndex.tsx       # Recipe cards grid (uses getAllImplementedRecipes)
│   ├── RecipeLayoutShell.tsx   # Nested layout for recipe pages
│   ├── RecipeCodeView.tsx      # Code view placeholder (lazy loaded)
│   ├── multiturn-chat/
│   │   └── MultiturnChatPlaceholder.tsx  # Exports Component (lazy loaded)
│   └── image-captioning/
│       └── ImageCaptioningPlaceholder.tsx  # Exports Component (lazy loaded)
└── App.tsx                     # Route definitions with lazy loading
```

## Next Steps

1. **Port multi-turn chat UI component** (simpler, good starting point)
   - Replace MultiturnChatPlaceholder with actual UI from monorepo
   - Port Vercel AI SDK dependencies (`ai`, `streamdown`)
   - Wire up to backend `/api/chat` endpoint

2. **Port image captioning UI component** (more complex with file uploads)
   - Replace ImageCaptioningPlaceholder with actual UI
   - Port NDJSON streaming utilities
   - Wire up to backend `/api/caption` endpoint

3. **Implement `/api/models` endpoint**
   - Proxy to LLM server's `/v1/models` endpoint
   - Use cached endpoint data with API keys

4. **Port shared utilities/types as needed**
   - Copy utils from `monorepo/packages/recipes/src/utils.ts`

## Important Implementation Notes

- **Recipe Metadata:** ALL recipe metadata (title, description, section, order) lives in `recipeMetadata.ts` - edit this file to add/reorder recipes
- **Auto-numbering:** Recipe numbers are derived from array position - just reorder to renumber
- **Lazy Loading:** Recipe components must export `Component` function (not default export) for React Router v7 lazy loading
- **Query Params:** Endpoint/model state managed via URL (`?e=endpoint-id&m=model-name`)
- **No React Context:** Use custom hooks (`useEndpointFromQuery`, `useModelFromQuery`) instead
- **Code Splitting:** React Router v7's `lazy` prop handles automatic code splitting
- **Formatting:** Run `npm run format` to format code with Prettier (4 spaces, no semis, single quotes)
- **Backend Route Discovery:** `/api/recipes` automatically discovers available recipes from registered FastAPI routes
