# MAX Agentic Cookbook - Project Context

## Overview

MAX Agentic Cookbook is a fullstack cookbook application showcasing the agentic AI capabilities of Modular MAX as a complete LLM serving solution. Built with FastAPI (Python) backend + React (TypeScript) SPA frontend for maximum flexibility and performance.

**Key benefits:**

-   **Python-first backend** - Direct access to AI ecosystem (MAX, transformers, etc.)
-   **Type safety** - End-to-end TypeScript frontend, Python type hints backend
-   **Clean separation** - Independent frontend/backend projects (not a monorepo)
-   **Modern tooling** - React Router v7, SWR, Mantine v7, FastAPI, uv

## Architecture

```
max-recipes/
├── backend/              # FastAPI + uv (Python 3.11+)
├── frontend/             # Vite + React + TypeScript SPA
├── docs/                 # Architecture, contributing, Docker guides
├── Dockerfile            # Demo server (MAX + backend + frontend)
├── ecosystem.config.js   # PM2 config for running all services
└── .dockerignore         # Docker build exclusions
```

### Backend (FastAPI + uv)

**Tech:** FastAPI, uvicorn, uv for dependency management, python-dotenv, openai

**Ports:**

-   Local dev: 8010
-   Docker: 8010

**Configuration:**

-   `.env.local` with `COOKBOOK_ENDPOINTS` JSON array
-   CORS configured for localhost:5173 (dev only)
-   Serves frontend static files from `backend/static/` directory

**Structure:**

```
backend/
├── src/
│   ├── main.py                 # Entry point, loads .env.local, includes recipe routers
│   ├── core/                   # Config and utilities
│   │   ├── endpoints.py        # Endpoint management with caching
│   │   ├── models.py           # Models listing (proxies /v1/models)
│   │   └── code_reader.py      # Source code reading utility for /code endpoints
│   └── recipes/                # Recipe routers
│       ├── multiturn_chat.py   # Multi-turn chat recipe (SSE streaming)
│       └── image_captioning.py # Image captioning (NDJSON streaming)
└── pyproject.toml              # Python dependencies (uv)
```

**API Endpoints:**

-   `GET /api/health` - Health check
-   `GET /api/recipes` - List available recipe slugs (programmatically discovers registered routes)
-   `GET /api/endpoints` - List configured LLM endpoints (from .env.local)
-   `GET /api/models?endpointId=xxx` - List models for endpoint (proxies OpenAI-compatible /v1/models)
-   `POST /api/recipes/multiturn-chat` - Multi-turn chat endpoint (SSE streaming)
-   `GET /api/recipes/multiturn-chat/code` - Get multiturn-chat backend source as plain text
-   `POST /api/recipes/image-captioning` - Image captioning with NDJSON streaming
-   `GET /api/recipes/image-captioning/code` - Get image-captioning backend source as plain text
-   Frontend source: Static files at `/code/{recipe-name}/ui.tsx` (copied by build script)

**Core Modules:**

The backend provides reusable utilities in `src/core/` for recipe development:

-   **endpoints.py** - Endpoint configuration management with caching:

    ```python
    from ..core.endpoints import get_cached_endpoint

    endpoint = get_cached_endpoint(endpoint_id)
    if not endpoint:
        raise HTTPException(status_code=404, detail="Endpoint not found")

    client = AsyncOpenAI(
        base_url=endpoint.base_url,
        api_key=endpoint.api_key
    )
    ```

    -   Loads from `COOKBOOK_ENDPOINTS` environment variable
    -   In-memory caching for fast lookups
    -   Never exposes API keys to client

-   **models.py** - Proxies OpenAI-compatible `/v1/models` endpoint:

    ```python
    GET /api/models?endpointId={id}
    ```

    -   Returns available models for the specified endpoint

-   **code_reader.py** - Utility for reading recipe source code:

    ```python
    from ..core.code_reader import read_source_file

    source_code = read_source_file(__file__)
    ```

    -   Returns Python source code as a string
    -   Enables the code viewer feature in the frontend

See [API Reference](../docs/api.md) for complete endpoint documentation.

### Frontend (Vite + React)

**Tech:** Vite, React 18, TypeScript, React Router v7, Mantine v7, SWR, highlight.js, Prettier

**Ports:**

-   Local dev: 5173 (Vite dev server with proxy to backend)
-   Docker: 8010 (served as static files by FastAPI backend)

**Key Features:**

-   Auto-generated routes from registry using utility functions in `routing/`
-   Build output: `backend/static/` directory (served by FastAPI in production)
-   Vite proxy to backend port 8010 (no CORS issues in dev)
-   Mantine v7 with custom theme (nebula/twilight colors), 70px header height
-   AppShell with collapsible sidebar, responsive Header

**State Management:**

-   **Server State:** SWR (API data fetching, caching, automatic revalidation)
-   **Client State:** URL query params (`?e=endpoint-id&m=model-name`) via custom hooks

**Structure:**

```
frontend/
├── src/
│   ├── recipes/                # Recipe components + registry.ts
│   │   ├── registry.ts         # Pure data - recipe metadata only
│   │   ├── components.ts       # React component mapping (UI + README)
│   │   ├── multiturn-chat/     # Multi-turn chat recipe
│   │   │   ├── README.mdx      # Recipe documentation
│   │   │   └── ui.tsx          # Demo component (exports Component function)
│   │   └── image-captioning/   # Image captioning recipe
│   │       ├── README.mdx      # Recipe documentation
│   │       └── ui.tsx          # Demo component (exports Component function)
│   ├── routing/                # Routing infrastructure
│   │   ├── AppProviders.tsx    # Providers wrapper (Mantine, Router, HighlightJsThemeLoader)
│   │   ├── Loading.tsx         # Loading fallback for Suspense
│   │   ├── RecipeWithProps.tsx # Wrapper providing endpoint, model, pathname props
│   │   └── routeUtils.tsx      # Route generation utilities
│   ├── components/             # Shared UI components
│   │   ├── Header.tsx          # 70px header with responsive selectors
│   │   ├── Navbar.tsx          # Sidebar with accordion navigation
│   │   ├── Toolbar.tsx         # Recipe page toolbar (title + ViewSelector)
│   │   ├── SelectEndpoint.tsx  # Endpoint selector dropdown
│   │   ├── SelectModel.tsx     # Model selector dropdown
│   │   ├── ViewSelector.tsx    # SegmentedControl for Readme | Demo | Code
│   │   └── ThemeToggle.tsx     # Light/dark mode toggle
│   ├── features/               # Feature components
│   │   ├── CookbookShell.tsx       # AppShell layout wrapper
│   │   ├── CookbookIndex.tsx       # Recipe cards grid
│   │   ├── RecipeLayoutShell.tsx   # Nested layout for recipe pages
│   │   ├── RecipeReadmeView.tsx    # README view (MDX rendering)
│   │   └── RecipeCodeView.tsx      # Code view with syntax highlighting
│   ├── lib/                    # Custom hooks, API, types, theme
│   │   ├── chapters.ts         # Auto-derived from registry
│   │   ├── theme.ts            # Custom Mantine theme
│   │   ├── types.ts            # Shared TypeScript types
│   │   ├── hooks.ts            # useSWR-based hooks
│   │   ├── api.ts              # API fetch functions for SWR
│   │   └── utils.ts            # Shared utilities
│   ├── scripts/                # Build scripts
│   │   └── copy-recipe-code.js # Copies recipe source to public/code/
│   ├── mdx.d.ts                # TypeScript declarations for .mdx files
│   └── App.tsx                 # Routing entry point (uses routing/ utilities)
└── package.json                # Frontend dependencies
```

**Routes:**

-   `/` - Recipe cards grid (dynamically generated from registry)
-   `/:slug` - Recipe demo (auto-generated from registry, lazy loaded)
-   `/:slug/readme` - Dynamic README route for any recipe
-   `/:slug/code` - Dynamic code view route for any recipe

## Key Architectural Decisions

1. **Separate projects** not monorepo (frontend/ and backend/ at root)
2. **uv** for Python dependency management (fast, modern)
3. **React Router v7 with auto-generated routes** (routes generated from registry, no manual route definitions per recipe)
4. **Separate dev servers** (backend :8000, frontend :5173 with proxy)
5. **SWR for server state** (Lightweight API data fetching with automatic caching and revalidation)
6. **URL query params for client state** (no React Context - endpoint/model selection via ?e= and ?m=)
7. **Lazy loading with React Router v7** (exports `Component` function, generic `lazyComponentExport` helper)
8. **Single source of truth for recipes** (registry in recipes/ folder, backend advertises availability)

## Data Fetching Strategy

The frontend uses a **hybrid state management approach**:

### Server State (SWR)

-   All API calls use SWR's `useSWR()` hook
-   **Automatic caching** - API responses cached and deduplicated (default 2 second deduplication interval)
-   **Request deduplication** - Multiple components requesting same data share one request
-   **Automatic revalidation** - Data stays fresh with SWR's default revalidation strategies:
    -   Revalidates on window focus (shows fresh data when switching back to tab)
    -   Revalidates on network reconnect (recovers from network issues)
    -   Manual revalidation via `mutate()` when needed
-   **URL-based cache keys** - Simple, intuitive cache keys based on API endpoints
-   **Lightweight** - ~15KB bundle size (much smaller than alternatives)

**Example:**

```ts
const { data: endpoints, isLoading, error } = useSWR('/api/endpoints', fetchEndpoints)
```

### Client State (URL Query Params)

-   User selections (endpoint, model) stored in URL query params (`?e=endpoint-id&m=model-name`)
-   Enables shareable URLs and browser back/forward
-   Custom hooks (`useEndpointFromQuery`, `useModelFromQuery`) combine SWR with URL param syncing
-   Auto-selection logic: first endpoint/model selected by default
-   Implemented using React Router's `useSearchParams` hook

**Why this approach?**

-   **Server state** (API data) needs caching, revalidation, deduplication → SWR
-   **Client state** (user selections) needs persistence, shareability → URL query params
-   Clean separation of concerns with minimal boilerplate
-   Replaced TanStack Query for simplicity (simpler API, smaller bundle)

## Recipe System

### Recipe Registry (`registry.ts`)

**Pure data only** - no React dependencies in `frontend/src/recipes/registry.ts`:

```ts
export const recipes = {
  "Foundations": [
    { title: 'Text Classification' },  // placeholder (no slug)
    {
      slug: 'multiturn-chat',
      title: 'Multi-Turn Chat',
      tags: ['Vercel AI SDK', 'SSE'],
      description: 'Streaming chat interface with multi-turn conversation support...'
    },
    {
      slug: 'image-captioning',
      title: 'Image Captioning',
      tags: ['NDJSON', 'Async Coroutines'],
      description: 'Generate captions for multiple images with progressive NDJSON streaming...'
    }
  ],
  "Data, Tools & Reasoning": [...],
  // ... more sections
}
```

**Key features:**

-   Pure data structure - no React imports or component references
-   Nested `section → recipes[]` structure
-   Placeholders have only `title` (dimmed in nav)
-   Implemented recipes have `slug` + `tags` + `description` (clickable in nav + shown as cards)
-   `tags` array displays technology/pattern labels (e.g., 'SSE', 'NDJSON', 'Vercel AI SDK')
-   Numbers auto-derived from array position (just reorder to renumber)
-   Display format auto-generated ("1: Text Classification", "2: Image Captioning")
-   Component mapping is in separate `components.ts` file

**Helper functions:**

-   `isImplemented(recipe)` - Type guard for checking if recipe has slug
-   `getRecipeBySlug(slug)` - Lookup recipe by slug
-   `buildNavigation()` - Generate nav with auto-numbering
-   `getAllImplementedRecipes()` - Get all recipes with slugs
-   `isRecipeImplemented(slug)` - Check if slug is implemented

**Frontend usage:**

-   `App.tsx` combines data from registry with components from `components.ts`
-   `CookbookIndex.tsx` uses `getAllImplementedRecipes()` for card grid
-   `Navbar.tsx` uses `isRecipeImplemented()` to check if clickable
-   `chapters.ts` auto-derives navigation from `buildNavigation()`

**Backend usage:**

-   Backend `/api/recipes` programmatically discovers routes
-   Returns array of slugs like `["multiturn-chat", "image-captioning"]`
-   Frontend already has the metadata (title, description)
-   No duplication needed

### Recipe Component Mapping (`components.ts`)

**React component mapping** - separates components from pure data in `frontend/src/recipes/components.ts`:

**Exports:**

-   `recipeComponents` - Map of slug → lazy-loaded UI component
-   `readmeComponents` - Map of slug → lazy-loaded README MDX component
-   `getRecipeComponent(slug)` - Get UI component for a recipe
-   `getReadmeComponent(slug)` - Get README component for a recipe
-   `lazyComponentExport()` - Helper for lazy loading components that export `Component`

**Example:**

```ts
export const recipeComponents: Record<
    string,
    LazyExoticComponent<ComponentType<RecipeProps>>
> = {
    'multiturn-chat': lazyComponentExport(() => import('./multiturn-chat/ui')),
    'image-captioning': lazyComponentExport(() => import('./image-captioning/ui')),
}

export const readmeComponents: Record<string, LazyExoticComponent<ComponentType>> = {
    'multiturn-chat': lazy(() => import('./multiturn-chat/README.mdx')),
    'image-captioning': lazy(() => import('./image-captioning/README.mdx')),
}
```

**Usage:**

-   `routeUtils.tsx` imports component mapping and combines with registry data
-   `RecipeReadmeView.tsx` uses `getReadmeComponent()` to load READMEs
-   Keeps React concerns separate from pure data in registry

### Implemented Recipes

#### Multi-turn Chat Recipe

**Architecture:** Python SSE Streaming + Vercel AI SDK Frontend

**Backend Implementation:**

-   Python SSE (Server-Sent Events) streaming with FastAPI `StreamingResponse`
-   Custom UIMessage → OpenAI format conversion
-   AsyncOpenAI client for token streaming
-   Vercel AI SDK protocol compliance with correct event types:
    -   `{"type": "start", "messageId": "..."}` (message start)
    -   `{"type": "text-delta", "id": "...", "delta": "..."}` (streaming text)
    -   `{"type": "finish"}` and `[DONE]` (completion)
-   Route: `POST /api/recipes/multiturn-chat`
-   Code endpoint: `GET /api/recipes/multiturn-chat/code` (returns source as plain text)

**Frontend Implementation:**

-   Vercel AI SDK's `useChat` hook with `DefaultChatTransport`
-   Flex layout pattern: messages area fills viewport, composer pinned at bottom
-   Auto-focus on mount and after sending messages (excellent UX)
-   Auto-scroll behavior with smart manual scroll detection
-   Streamdown component for markdown rendering with syntax highlighting
-   Component exports `Component` function for lazy loading via registry
-   README.mdx with documentation

**Key Features:**

-   Token-by-token streaming for real-time response
-   Multi-turn conversation with full message history maintained
-   Auto-scroll behavior with smart manual scroll detection
-   Markdown rendering with syntax-highlighted code blocks (Streamdown)
-   Auto-focus input field on load and after sending

**Dependencies:**

-   Backend: `openai` (AsyncOpenAI), FastAPI streaming
-   Frontend: `ai`, `@ai-sdk/react`, `streamdown`

**Why This Approach:**

-   Demonstrates Python SSE can work seamlessly with Vercel AI SDK frontend
-   Clean separation: Python-first backend, React frontend with proven AI SDK
-   `useChat` hook handles complex state: streaming, message history, error recovery
-   No Node.js dependency needed - pure Python backend
-   SSE-based streaming is production-ready and standardized

#### Image Captioning Recipe

**Architecture:** Python OpenAI Client + FastAPI Streaming + Custom useNDJSON Hook

**Backend Implementation:**

-   Use Python `openai` client with FastAPI streaming response
-   Implement NDJSON (newline-delimited JSON) streaming for progressive updates
-   Support batch processing: parallel requests for multiple images
-   Track performance metrics: TTFT (time to first token) and duration per image
-   Route: `POST /api/recipes/image-captioning`
-   Code endpoint: `GET /api/recipes/image-captioning/code` (returns source as plain text)

**Frontend Implementation:**

-   Custom `useNDJSON<T>` hook for progressive NDJSON streaming (framework-agnostic, reusable)
-   File upload with `@mantine/dropzone` component
-   Image gallery with loading overlays and real-time caption updates
-   Performance metrics display: TTFT and duration formatted with `pretty-ms`
-   Component exports `Component` function for lazy loading via registry
-   README.mdx with documentation

**Key Features:**

-   Batch image captioning with parallel processing
-   Progressive streaming (results appear as they complete)
-   Performance metrics (TTFT and duration timing)
-   NDJSON streaming format for progressive updates

**Dependencies:**

-   Backend: `openai`, FastAPI streaming
-   Frontend: `nanoid`, `pretty-ms`, custom hooks
-   No Vercel AI SDK needed - clean Python approach

**Why This Approach:**

-   Frontend has framework-agnostic NDJSON streaming (useNDJSON hook)
-   Python OpenAI client handles streaming naturally with `for chunk in stream`
-   Custom hooks provide mutation state management (loading/error states)
-   Fits our Python-first backend architecture
-   Simple, clean, no unnecessary dependencies

#### Text Classification Recipe

**Architecture:** Python Parallel Batch Processing + React JSONL Upload UI

**Backend Implementation:**

-   Parallel batch processing using `asyncio.gather()` for all items at once
-   Rate limiting with semaphore: Max 10 concurrent requests to avoid API limits
-   Timeout protection: 5-minute timeout for entire batch processing
-   Flexible schema support: extract text from any JSON field specified by user
-   AsyncOpenAI client for API calls (non-streaming for batch completion)
-   Performance metrics: Track duration per item in milliseconds
-   Complete JSON array response (not streaming)
-   Route: `POST /api/recipes/batch-text-classification`
-   Code endpoint: `GET /api/recipes/batch-text-classification/code` (returns source as plain text)

**Frontend Implementation:**

-   Dropzone file upload component for `.jsonl` files with client-side parsing
-   File size validation: 10MB limit to prevent browser crashes
-   Preview table showing extracted text from configurable field (first 20 items with pagination)
-   Textarea for custom classification prompts with full user control
-   SWR mutation (`useSWRMutation`) for batch classification state management
-   Batch processing with loading spinner during API request
-   Results table with Original Text | Classification | Duration columns
-   Performance summary: total items, average/min/max duration
-   Download functionality to export results as JSONL with timestamp filename
-   Component exports `Component` function for lazy loading via registry
-   README.mdx with documentation and example use cases

**Key Features:**

-   Flexible JSONL schema support (user specifies which field contains text)
-   Custom prompts for maximum flexibility (sentiment, intent, toxicity, labels, etc.)
-   Parallel batch processing with rate limiting (max 10 concurrent requests)
-   File size validation (10MB limit) prevents large file crashes
-   Timeout protection (5-minute limit) prevents hanging requests
-   Performance metrics per item for analysis
-   Pagination for both preview and results tables (20 items per page)
-   Complete results available at once for downloading

**Dependencies:**

-   Backend: `openai` (AsyncOpenAI), `asyncio` (stdlib), FastAPI
-   Frontend: `swr` (useSWRMutation for state management), `nanoid` (ID generation), `@mantine/dropzone` (file upload)
-   No streaming SDK needed - pure batch response

**Why This Approach:**

-   Batch processing simpler than streaming for first version
-   Clear loading state with single spinner
-   All results available at once for download and analysis
-   Flexible schema allows supporting diverse JSONL formats (tweets, reviews, emails, etc.)
-   Custom prompts give users full control over classification logic
-   Parallel asyncio.gather() demonstrates efficient concurrent processing
-   Non-streaming approach makes pagination and data export straightforward
-   Can add progressive streaming later as enhancement

## Adding a New Recipe

1. Add entry to `frontend/src/recipes/registry.ts`:
    - Include `slug`, `title`, `tags`, `description` fields (pure data only)
    - Tags should identify key technologies/patterns (e.g., `['SSE', 'Streaming']`)
    - Do NOT add `component` property (that goes in components.ts)
2. Add component mapping to `frontend/src/recipes/components.ts`:
    - Add UI component: `'recipe-slug': lazyComponentExport(() => import('./recipe-name/ui'))`
    - Add README component: `'recipe-slug': lazy(() => import('./recipe-name/README.mdx'))`
3. Create `backend/src/recipes/[recipe_name].py` with APIRouter:
    - Add comprehensive module docstring explaining the recipe's purpose, features, and architecture
    - Import `code_reader`: `from ..core.code_reader import read_source_file`
    - Import Response: `from fastapi.responses import Response`
    - Add main recipe route (e.g., `POST /recipe-name`)
    - Add code route: `GET /recipe-name/code` that returns `Response(content=read_source_file(__file__), media_type="text/plain")`
4. Include router in `backend/src/main.py`
5. Add UI component to `frontend/src/recipes/[recipe-name]/ui.tsx`:
    - Export `Component` function that accepts `RecipeProps`
6. Add `README.mdx` to `frontend/src/recipes/[recipe-name]/` for documentation
7. Routes, index page, and navigation update automatically

**Routes created:**

-   `/:slug` - Demo view (interactive UI, auto-generated from components.ts)
-   `/:slug/readme` - README documentation (auto-available for all recipes)
-   `/:slug/code` - Source code view (auto-available for all recipes)

## Development Workflow

### Local Development (two servers)

**Terminal 1 (Backend):**

```bash
cd backend
uv run dev
```

**Terminal 2 (Frontend):**

```bash
cd frontend
npm run dev  # Runs vite + copy:code:watch (watches recipe source files)
```

Visit: `http://localhost:5173` (Vite dev server proxies /api requests to port 8010)

### Docker Demo Server (MAX + web app)

The Docker container runs two services together using PM2:

-   **Port 8000**: MAX LLM serving (/v1 endpoints)
-   **Port 8010**: FastAPI web app (serves /api endpoints + frontend static files)

**Build:**

```bash
docker build -t max-recipes .
# Or with specific GPU support:
docker build --build-arg MAX_GPU=nvidia -t max-recipes .
```

**Run:**

```bash
docker run -p 8000:8000 -p 8010:8010 max-recipes
# Or with custom model:
docker run -p 8000:8000 -p 8010:8010 \
  -e MAX_MODEL=google/gemma-3-27b-it \
  max-recipes
```

Visit: `http://localhost:8010`

**Service startup order (via ecosystem.config.js):**

1. MAX LLM serving starts on port 8000
2. Web app waits for MAX health check, then starts on port 8010 (serves API + frontend)

### Key Files to Know

-   `frontend/src/recipes/registry.ts` - Pure data - recipe metadata only (no React dependencies)
-   `frontend/src/recipes/components.ts` - React component mapping (UI + README lazy imports)
-   `backend/src/recipes/[recipe_name].py` - Individual recipe API routers
-   `backend/src/main.py` - Include recipe routers, programmatic route discovery
-   `frontend/src/App.tsx` - Auto-generates routes (combines registry data + component mapping)
-   `frontend/src/routing/AppProviders.tsx` - Mantine provider, Router wrapper
-   `frontend/src/routing/routeUtils.tsx` - Route generation utilities (imports from both registry + components)
-   `frontend/src/lib/api.ts` - API client functions
-   `frontend/src/lib/hooks.ts` - Custom hooks with SWR integration
-   `frontend/src/lib/types.ts` - Shared TypeScript types (Recipe, Endpoint, Model, NavItem, etc.)
-   `Dockerfile` - Demo server image (MAX + backend + frontend)
-   `ecosystem.config.js` - PM2 process manager config for all services
-   `.dockerignore` - Docker build exclusions

## Dependencies

**Frontend (Installed):**

-   ✅ `@mantine/core@^7` - UI component library
-   ✅ `@mantine/hooks@^7` - React hooks
-   ✅ `@mantine/dropzone@^7` - File upload
-   ✅ `@tabler/icons-react` - Icons
-   ✅ `react-router-dom@^7` - React Router v7 with lazy loading
-   ✅ `swr` - Lightweight server state management with automatic caching and revalidation (~15KB)
-   ✅ `ai` - Vercel AI SDK (for multi-turn chat streaming)
-   ✅ `@ai-sdk/react` - React hooks for Vercel AI SDK
-   ✅ `streamdown` - Markdown streaming with syntax highlighting
-   ✅ `nanoid` - Unique ID generation
-   ✅ `pretty-ms` - Human-readable time formatting
-   ✅ `prettier@^3` - Code formatter
-   ✅ `highlight.js` - Syntax highlighting for code blocks (with theme switching based on Mantine color scheme)
-   ✅ `chokidar` - File watching for copy script
-   ✅ `concurrently` - Run multiple npm scripts in parallel
-   ✅ `postcss-preset-mantine` - Mantine PostCSS preset
-   ✅ `@mdx-js/rollup` - MDX support for README views

**Backend (Installed):**

-   ✅ `python-dotenv` - Load .env.local for configuration
-   ✅ `openai` - OpenAI Python client for API proxying and streaming

## Key Patterns

### Auto-Generated Routing

Routes are generated from registry - no manual route definitions per recipe:

-   Update `registry.ts` with component property
-   Routes update automatically
-   Backend `/api/recipes` programmatically discovers routes

### Server State via SWR

-   Lightweight caching with automatic revalidation
-   Request deduplication
-   URL-based cache keys (API URLs directly as cache keys)

### Client State via URL Params

-   Shareable URLs with endpoint/model selection
-   Browser back/forward support
-   Custom hooks combine SWR with URL param syncing

### Backend Routes

All backend routes prefixed with `/api`:

-   `/api/health` - Health check
-   `/api/recipes` - List recipes
-   `/api/endpoints` - List endpoints
-   `/api/models` - List models
-   `/api/recipes/{slug}` - Recipe execution
-   `/api/recipes/{slug}/code` - Recipe source code

### Responsive Layout Pattern

The endpoint/model selectors appear in different locations based on screen size:

-   **Desktop (≥sm)**: Selectors in Header (right side, `visibleFrom="sm"`)
-   **Mobile (<sm)**: Selectors in Navbar drawer (top, `hiddenFrom="sm"`)

This ensures controls are always accessible while optimizing for each screen size.

### Recipe Page Views (Readme | Demo | Code)

Each recipe has three views accessible via the ViewSelector segmented control:

**View Types:**

-   **Readme** (`/:slug/readme`) - MDX documentation rendered by `RecipeReadmeView.tsx` (displays recipe description, then README content)
-   **Demo** (`/:slug`) - Interactive recipe UI component
-   **Code** (`/:slug/code`) - Source code view rendered by `RecipeCodeView.tsx`

**ViewSelector Component:**

-   Uses Mantine's `SegmentedControl` with three options
-   Lives in Toolbar, always visible on recipe pages
-   Handles navigation between the three views using React Router

**Code Availability:**

-   **Backend code**: API endpoint `GET /api/recipes/{slug}/code` returns Python source as plain text
-   **Frontend code**: Static files at `/code/{slug}/ui.tsx` (copied by `scripts/copy-recipe-code.js`)
-   **Syntax highlighting**: Implemented with highlight.js for both Code view and README MDX code blocks, theme switches based on Mantine color scheme (dark/light)

### RecipeLayoutShell Scrollable Layout Pattern

**Critical layout pattern** for recipe pages:

```tsx
<Flex direction="column" h={appShellContentHeight} style={{ overflow: 'hidden' }}>
    <Toolbar title={title} />
    <Box style={{ flex: 1, overflow: 'auto' }}>
        <Outlet /> {/* Child routes render here */}
    </Box>
</Flex>
```

**Key points:**

-   Parent Flex has **fixed height** (`appShellContentHeight`) and `overflow: 'hidden'`
-   Outlet wrapper (Box) has **`flex: 1`** (takes remaining space) and **`overflow: 'auto'`** (scrollable)
-   This keeps the Toolbar fixed at top while content scrolls
-   Without this pattern, content will be invisible/clipped!

### MDX Support

MDX files are rendered as React components using `@mdx-js/rollup`:

**Configuration** (`vite.config.ts`):

```ts
plugins: [{ enforce: 'pre', ...mdx() }, react({ include: /\.(jsx|js|mdx|md|tsx|ts)$/ })]
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
4. Code blocks in MDX are automatically syntax-highlighted with highlight.js (supports TypeScript, Python, JavaScript, JSON)

## Path Aliases

The project uses TypeScript path aliases to simplify imports and avoid relative path hell.

**Configuration** (`vite.config.ts`):

```ts
resolve: {
  alias: {
    '~/lib': path.resolve(__dirname, './src/lib'),
    '~/components': path.resolve(__dirname, './src/components'),
    '~/features': path.resolve(__dirname, './src/features'),
    '~/recipes': path.resolve(__dirname, './src/recipes'),
    '~/routing': path.resolve(__dirname, './src/routing'),
  },
}
```

**TypeScript** (`tsconfig.app.json`):

```json
{
    "compilerOptions": {
        "baseUrl": ".",
        "paths": {
            "~/lib/*": ["src/lib/*"],
            "~/components/*": ["src/components/*"],
            "~/features/*": ["src/features/*"],
            "~/recipes/*": ["src/recipes/*"],
            "~/routing/*": ["src/routing/*"]
        }
    }
}
```

**Usage:**

```ts
// Before: relative imports
import { theme } from '../../../lib/theme'
import { Header } from '../../components/Header'

// After: path aliases
import { theme } from '~/lib/theme'
import { Header } from '~/components/Header'
```

**Benefits:**

-   Clean, consistent imports across the entire codebase
-   No brittle relative paths (`../../../`)
-   Easier refactoring - imports don't break when moving files
-   Better IDE autocomplete and navigation

## Security Model

### API Key Protection

**Server-side storage:**

-   API keys in `.env.local` (gitignored)
-   Loaded by `backend/src/core/endpoints.py`
-   Never serialized or sent to client

**Request flow:**

1. Client sends endpoint ID (not credentials)
2. Backend validates endpoint ID exists
3. Backend looks up credentials from cache
4. Backend makes authenticated request to LLM
5. API key never leaves server

**Configuration Flow:**

1. Backend loads `COOKBOOK_ENDPOINTS` from `.env.local` on startup
2. Frontend fetches available endpoints via `GET /api/endpoints` (without API keys)
3. User selects endpoint/model (stored in URL query params)
4. Recipe sends request with endpoint ID
5. Backend looks up credentials and proxies request

## Performance

### Code Splitting

-   Recipe UI components lazy-loaded via React Router
-   Vite automatic code splitting
-   Shared dependencies bundled once

### Caching

-   Server-side: Endpoint configurations cached in memory
-   Client-side: SWR automatic caching with revalidation
-   Build-time: Vite pre-compresses static assets

### Streaming

-   **SSE (Server-Sent Events)**: Token streaming for multi-turn chat
-   **NDJSON**: Batch operations with progressive updates for image captioning
-   See `backend/src/recipes/multiturn_chat.py` and `backend/src/recipes/image_captioning.py`

## Important Implementation Notes

-   **Recipe Registry:** Single source of truth in `registry.ts` - edit to add/reorder recipes, routes auto-generate
-   **Lazy Loading:** Recipe components export `Component` function, use `lazyComponentExport()` helper
-   **Data Fetching:** SWR for all API calls - see `api.ts` for fetch functions
-   **State Management:** Server state (SWR) + Client state (URL query params)
-   **Query Params:** Endpoint/model state in URL (`?e=endpoint-id&m=model-name`) via custom hooks
-   **Responsive Layout:** Endpoint/model selectors in header (desktop) or navbar drawer (mobile)
-   **Formatting:** 4 spaces, no semis, single quotes (run `npm run format`)

## Related Documentation

-   [README.md](../README.md) - Quick start, setup instructions
-   [API Reference](../docs/api.md) - Complete endpoint specifications and request/response formats
-   [Contributing Guide](../docs/contributing.md) - How to add recipes, code standards, and development patterns
-   [Backend README](../backend/README.md) - Backend setup and development
-   [Frontend README](../frontend/README.md) - Frontend setup and development
-   [Docker Deployment Guide](../docs/docker.md) - Container deployment with MAX
