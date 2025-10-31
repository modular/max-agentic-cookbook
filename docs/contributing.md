# Contributing Guide

Thanks for your interest in contributing! This guide covers the basics of adding recipes or improvements to the MAX Agentic Cookbook.

> **Note:** This is a new project and we're still figuring things out. We're not sure how many folks will contribute yet, so we're keeping the process lightweight and flexible. If something doesn't work or you have ideas to improve the workflow, let us know!

## Prerequisites

-   **Python** 3.11 or higher
-   **Node.js** 22.x or higher
-   **uv** - Fast Python package installer ([install here](https://github.com/astral-sh/uv))

## Development Workflow

### Fork & Clone

> Note: You'll need to fork the repo first. Direct push access is restricted.

1. **Fork** [github.com/modular/max-agentic-cookbook](https://github.com/modular/max-agentic-cookbook) on GitHub

2. **Clone your fork:**

    ```bash
    git clone https://github.com/YOUR_USERNAME/max-recipes.git
    cd max-recipes
    ```

3. **Add upstream:**

    ```bash
    git remote add upstream https://github.com/modular/max-agentic-cookbook.git
    ```

### Branches

1. **Create a branch in your fork:**

    ```bash
    git checkout -b feature/your-feature-name
    ```

2. **Make changes** and test locally with both dev servers running

3. **Format frontend code:**

    ```bash
    cd frontend
    npm run format
    ```

4. **Commit with clear messages:**

    ```bash
    git commit -m "Add RAG recipe"
    ```

5. **Push to your fork:**

    ```bash
    git push origin feature/your-feature-name
    ```

6. **Create PR** from your fork to upstream `main` branch

### Pull Requests

-   Use descriptive titles: `Add X` or `Fix Y`
-   Include what changed and why
-   Add screenshots for UI changes (optional)
-   Address review feedback by pushing to your branch

Maintainers will review and merge approved PRs.

### Syncing Your Fork

Keep your fork updated:

```bash
git fetch upstream
git checkout main
git rebase upstream/main
git push origin main
```

## Adding a Recipe

### Architecture Overview

The Cookbook uses a **FastAPI backend + React SPA** architecture with separate backend and frontend projects.

```plaintext
max-recipes/
├── backend/                # FastAPI + uv (Python 3.11+)
│   ├── src/
│   │   ├── main.py         # Entry point
│   │   ├── core/           # Config and utilities
│   │   └── recipes/        # Recipe routers
│   └── pyproject.toml      # Python dependencies
│
├── frontend/               # Vite + React + TypeScript SPA
│   ├── src/
│   │   ├── recipes/        # Recipe components + data
│   │   │   ├── registry.ts # Recipe metadata (pure data)
│   │   │   └── components.ts # React component mapping
│   │   ├── components/     # Shared UI components
│   │   ├── routing/        # Routing infrastructure
│   │   ├── lib/            # Custom hooks, API, types
│   │   └── App.tsx         # Entry point
│   └── package.json        # Frontend dependencies
│
└── docs/                   # Documentation
```

### Recipe Files

Recipes consist of multiple files in specific frontend and backend locations:

**Frontend files** (`frontend/src/recipes/[recipe-name]/`):

-   **`ui.tsx`** - React component (exports `Component` function)
-   **`README.mdx`** - Documentation (MDX format)

**Backend file** (`backend/src/recipes/[recipe_name].py`):

-   **`[recipe_name].py`** - FastAPI router with recipe logic

**Example recipes to reference:**

-   **SSE Streaming**: [`multiturn-chat`](../frontend/src/recipes/multiturn-chat/) (frontend) + [`multiturn_chat.py`](../backend/src/recipes/multiturn_chat.py) (backend)
-   **NDJSON Progressive Streaming**: [`image-captioning`](../frontend/src/recipes/image-captioning/) (frontend) + [`image_captioning.py`](../backend/src/recipes/image_captioning.py) (backend)
-   **Batch Processing**: [`batch-text-classification`](../frontend/src/recipes/batch-text-classification/) (frontend) + [`batch_text_classification.py`](../backend/src/recipes/batch_text_classification.py) (backend)

**Registration steps:**

1. **Add recipe data** to [`frontend/src/recipes/registry.ts`](../frontend/src/recipes/registry.ts):

    ```typescript
    {
        slug: 'my-recipe',
        title: 'My Recipe',
        tags: ['Technology', 'Pattern'],
        description: 'What this recipe does...'
    }
    ```

2. **Register components** in [`frontend/src/recipes/components.ts`](../frontend/src/recipes/components.ts):

    ```typescript
    // UI component
    export const recipeComponents = {
        'my-recipe': lazyComponentExport(() => import('./my-recipe/ui')),
        // ...
    }

    // README component
    export const readmeComponents = {
        'my-recipe': lazy(() => import('./my-recipe/README.mdx')),
        // ...
    }
    ```

3. **Create backend router** in [`backend/src/recipes/my_recipe.py`](../backend/src/recipes/)

4. **Include router** in [`backend/src/main.py`](../backend/src/main.py):
    ```python
    from .recipes import my_recipe
    app.include_router(my_recipe.router)
    ```

Routes auto-generate from registry - no manual route definitions needed!

**Recipe System Architecture:**

Recipes are registered in two files:

-   **`registry.ts`** - Pure data (slug, title, tags, description)
-   **`components.ts`** - React component mapping (UI and README components)

This separation keeps data structures independent from React, making the registry easier to work with and reducing coupling.

## Code Standards

### Frontend Code (TypeScript)

**Style Guidelines:**

-   Functional components with React hooks
-   4 spaces, no semicolons, single quotes (as defined in the Prettier config)

**Type Safety (Critical):**

Never use the `any` type in TypeScript code.

-   ❌ **Never use `any`** - bypasses type checking and defeats the purpose of TypeScript
-   ✅ **Use `unknown`** - for truly dynamic data that will be validated at runtime (e.g., `body: unknown` in fetch calls)
-   ✅ **Use proper interfaces** - define explicit interfaces like `RecipeProps` for component props
-   ✅ **Use generic types** - e.g., `ComponentType<RecipeProps>` instead of `ComponentType<any>`
-   ✅ **Use type guards** - `isImplemented(recipe)` for runtime type narrowing

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

**Shared Types:**

All shared types live in [`frontend/src/lib/types.ts`](../frontend/src/lib/types.ts) for consistency across the codebase.

**Key types defined:**

-   **Backend API types:** `Recipe`, `HealthCheckResponse`, `RecipesListResponse`
-   **LLM types:** `Endpoint`, `Model`
-   **Component props:** `RecipeProps`
-   **Recipe metadata types:** `RecipePlaceholder`, `RecipeImplemented`, `RecipeItem`, `RecipeMetadata`
-   **Navigation types:** `NavItem`, `NavSection`

**Path Aliases:**

The project uses TypeScript path aliases to simplify imports and avoid relative path hell. These aliases are configure in `vite.config.ts`.

```ts
// Before: relative imports
import { theme } from '../../../lib/theme'
import { Header } from '../../components/Header'

// After: path aliases
import { theme } from '~/lib/theme'
import { Header } from '~/components/Header'
```

#### Separating Pure Data from React Components

The project strictly separates data structures from React components to maintain clean architecture:

**✅ DO:**

-   Keep data structures in pure TypeScript files (no React imports)
-   Put React component mappings in separate files
-   Example: `registry.ts` (pure data) + `components.ts` (React components)

**❌ DON'T:**

-   Mix React imports with data definitions
-   Include component references in data structures
-   Use inline component definitions in configuration objects

**Example:**

```ts
// ✅ GOOD - registry.ts (pure data)
export const recipes = {
    Foundations: [
        {
            slug: 'multiturn-chat',
            title: 'Multi-Turn Chat',
            tags: ['SSE', 'Streaming'],
            description: '...',
        },
    ],
}

// ✅ GOOD - components.ts (React mapping)
import { lazy } from 'react'
export const recipeComponents = {
    'multiturn-chat': lazy(() => import('./multiturn-chat/ui')),
}

// ❌ BAD - mixing data with React
import { lazy } from 'react'
export const recipes = {
    Foundations: [
        {
            slug: 'multiturn-chat',
            component: lazy(() => import('./multiturn-chat/ui')), // ❌ React in data
        },
    ],
}
```

#### Type Reusability

Always define shared types in `lib/types.ts` rather than using adhoc inline objects or duplicating type definitions.

**✅ DO:**

-   Define interfaces in `lib/types.ts` for any type used in multiple places
-   Import and reuse types across components
-   Use type guards for runtime validation

**❌ DON'T:**

-   Define inline object types with hardcoded properties
-   Duplicate type definitions across files
-   Use anonymous types in function parameters

**Example:**

```ts
// ✅ GOOD - in lib/types.ts
export interface NavItem {
  number: number
  title: string
  tags?: string[]
  slug?: string
}

// ✅ GOOD - components import and use
import type { NavItem } from '~/lib/types'
function NavItem({ item }: { item: NavItem }) { ... }

// ❌ BAD - inline type duplication
function NavItem({ item }: { item: { title: string; number: number; slug?: string } }) { ... }
```

**Benefits:**

-   Single source of truth for data shapes
-   Changes propagate through type system automatically
-   Better IDE autocomplete and refactoring
-   Self-documenting code
-   Easier to add new fields (update once in types.ts)

**When to Create a New Type:**

-   Type is used in 2+ places
-   Type represents a domain concept (Recipe, Endpoint, etc.)
-   Type has validation logic or type guards
-   Type may evolve over time

**Key locations:**

-   Define shared types in [`frontend/src/lib/types.ts`](../frontend/src/lib/types.ts)
-   Use TypeScript path aliases (`~/lib`, `~/components`, etc.) for clean imports

### Backend Code (Python)

**Type Hints:**

Use modern Python type hints throughout:

```python
# ✅ GOOD - Modern type syntax
from pydantic import BaseModel

class ChatRequest(BaseModel):
    """Request model for chat endpoint."""
    endpoint_id: str
    model: str
    messages: list[dict[str, str]]
    temperature: float | None = None

async def process_chat(
    request: ChatRequest,
    endpoint: Endpoint
) -> StreamingResponse:
    """Process chat request with streaming response."""
    ...

# ❌ BAD - Missing or weak types
def process_chat(request, endpoint):
    ...
```

**Best Practices:**

-   Use Pydantic `BaseModel` for all request/response models
-   Modern union syntax: `str | None` instead of `Optional[str]`
-   Type all function parameters and return values
-   Include docstrings on Pydantic models explaining each field

**Async Patterns:**

Prefer async patterns for better concurrency and streaming:

```python
from openai import AsyncOpenAI

# ✅ GOOD - Async for streaming
client = AsyncOpenAI(base_url=endpoint.base_url, api_key=endpoint.api_key)
stream = await client.chat.completions.create(
    model=request.model,
    messages=messages,
    stream=True
)

async for chunk in stream:
    # Process streaming chunks
    ...

# Use async generators for streaming responses
async def generate_stream():
    """Generate streaming response data."""
    async for chunk in stream:
        yield format_chunk(chunk)
```

**When to use async:**

-   Streaming responses (always)
-   Multiple concurrent API calls
-   I/O-bound operations

**Streaming Patterns:**

Two main streaming formats:

1. **SSE (Server-Sent Events)** - For token-by-token streaming:

    ```python
    from fastapi.responses import StreamingResponse

    async def generate_sse():
        async for token in stream:
            yield f"data: {json.dumps({'delta': token})}\n\n"

    return StreamingResponse(
        generate_sse(),
        media_type="text/event-stream"
    )
    ```

2. **NDJSON (Newline-Delimited JSON)** - For progressive batch results:

    ```python
    async def generate_ndjson():
        for result in results:
            yield f"{json.dumps(result)}\n"

    return StreamingResponse(
        generate_ndjson(),
        media_type="application/x-ndjson"
    )
    ```

3. **Batch Response (Non-Streaming)** - For complete results all at once:

    ```python
    # Process all items in parallel using asyncio.gather()
    tasks = [process_item(item) for item in request.batch]
    results = await asyncio.gather(*tasks)

    # Return complete JSON array (not streaming)
    return results  # FastAPI serializes to JSON automatically
    ```

See [`multiturn_chat.py`](../backend/src/recipes/multiturn_chat.py) for SSE, [`image_captioning.py`](../backend/src/recipes/image_captioning.py) for NDJSON, and [`batch_text_classification.py`](../backend/src/recipes/batch_text_classification.py) for batch processing examples.

**Required Code Endpoint:**

Every recipe must provide a code viewing endpoint:

```python
from fastapi import APIRouter
from fastapi.responses import Response
from ..core.code_reader import read_source_file

router = APIRouter(prefix="/api/recipes", tags=["recipes"])

@router.get("/your-recipe/code", response_class=Response)
def get_recipe_code():
    """Return the source code for this recipe as plain text."""
    return Response(
        content=read_source_file(__file__),
        media_type="text/plain"
    )
```

**General Best Practices:**

-   Follow FastAPI best practices (dependency injection, error handling)
-   Use `HTTPException` for error responses with appropriate status codes
-   Retrieve endpoints securely via `get_cached_endpoint(endpoint_id)`
-   Never expose API keys to the frontend
-   Add educational inline comments explaining patterns for learning
-   Register your router in [`backend/src/main.py`](../backend/src/main.py)

**Documentation Standards:**

All recipe modules should include comprehensive documentation:

1. **Module Docstring** - Comprehensive overview at top of file explaining:

    - Purpose and use case
    - Key features (bulleted list)
    - Architecture and implementation details
    - Protocol/format specifications

2. **Section Comments** - Organize code with clear section headers:

    ```python
    # ============================================================================
    # Types and Models
    # ============================================================================
    ```

3. **Function Docstrings** - Document all public functions with purpose and parameters

4. **Inline Comments** - Explain complex logic and the "why" behind implementation choices

See [`multiturn_chat.py`](../backend/src/recipes/multiturn_chat.py) and [`image_captioning.py`](../backend/src/recipes/image_captioning.py) for examples.

## Key Patterns

### State Management

**Server State via Frontend (SWR):**

-   API data fetching with automatic caching and revalidation
-   See [`frontend/src/lib/hooks.ts`](../frontend/src/lib/hooks.ts) and [`frontend/src/lib/api.ts`](../frontend/src/lib/api.ts)

**Frontend Client State (URL Query Params):**

-   Endpoint/model selection via `?e=endpoint-id&m=model-name`
-   Shareable URLs, browser back/forward support
-   No React Context needed

### Streaming Responses

**Token streaming** via Server-Sent Events (SSE):

-   Used in multi-turn chat for real-time token delivery
-   See [`backend/src/recipes/multiturn_chat.py`](../backend/src/recipes/multiturn_chat.py)

**NDJSON streaming** for batch operations:

-   Used in image captioning for progressive updates
-   See [`backend/src/recipes/image_captioning.py`](../backend/src/recipes/image_captioning.py)

### Security Model

**API Key Protection:**

-   API keys stored in `backend/.env.local` (gitignored)
-   Loaded by [`backend/src/core/endpoints.py`](../backend/src/core/endpoints.py)
-   Never sent to client (only endpoint IDs exposed)
-   Backend proxies requests to LLM endpoints

**Request flow:**

1. Client sends endpoint ID (not credentials)
2. Backend validates endpoint ID exists
3. Backend looks up credentials from cache
4. Backend makes authenticated request to LLM
5. API key never leaves server

## Technology Choices

### Why FastAPI?

-   Modern Python web framework
-   Automatic request validation
-   Native async/await support for streaming
-   OpenAPI docs out of the box

### Why React SPA (not Next.js)?

-   Better AI ecosystem integration with Python
-   Want a Python backend (not Node.js)
-   Don't need SSR/SEO features

### Why SWR (not TanStack Query)?

-   Lightweight (~15KB vs ~40KB)
-   Simple API
-   Automatic caching and revalidation
-   Excellent for our use case

### Why Mantine UI?

-   Comprehensive component library
-   Built-in dark mode
-   Accessible by default
-   Minimal bundle size impact

### Why uv (not pip)?

-   Fast dependency resolution
-   Modern Python package manager
-   Better lockfile support
-   Compatible with standard Python packaging

## Getting Help

-   **Docker**: [docs/docker.md](./docker.md) - Container deployment
-   **Project Context**: [.claude/project-context.md](../.claude/project-context.md) - Comprehensive reference
-   **Issues**: [GitHub Issues](https://github.com/modular/max-recipes/issues)
-   **Forum**: [forum.modular.com](https://forum.modular.com/)

## License

By contributing, you agree that your contributions will be licensed under the Apache License 2.0 with LLVM Exception. See [LICENSE](../LICENSE) for details.

---

Thanks for contributing!
