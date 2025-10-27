# Architecture Guide

This guide explains the design decisions and patterns used throughout the MAX Agentic Cookbook.

## Overview

The MAX Agentic Cookbook uses a **FastAPI backend + React SPA** architecture with separate frontend and backend projects.

**Key benefits:**

-   **Python-first backend** - Direct access to AI ecosystem (MAX, transformers, etc.)
-   **Type safety** - End-to-end TypeScript for frontend, Python type hints for backend
-   **Hot module reloading** - Fast development iteration
-   **Separation of concerns** - Clear boundaries between UI, API, and business logic

## Directory Structure

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
│   │   ├── recipes/        # Recipe components + registry.ts
│   │   ├── components/     # Shared UI components
│   │   ├── routing/        # Routing infrastructure
│   │   ├── lib/            # Custom hooks, API, types
│   │   └── App.tsx         # Entry point
│   └── package.json        # Frontend dependencies
│
└── docs/                   # Documentation
```

See [`frontend/src/recipes/registry.ts`](../frontend/src/recipes/registry.ts) for recipe metadata and [`.claude/project-context.md`](../.claude/project-context.md) for detailed architecture docs.

## Core Concepts

### 1. Separate Projects

The cookbook uses **separate frontend and backend** projects with distinct dependency management:

-   **Backend**: `uv` for Python dependencies (fast, modern)
-   **Frontend**: `npm` for JavaScript dependencies

**Why separate projects?**

-   First-class ecosystems for AI and UI developers
-   Clear deployment boundaries
-   Independent scaling of frontend and backend

### 2. Recipe System

Recipes consist of multiple files across frontend and backend:

**Frontend:**

-   **`ui.tsx`** - React component (see [`frontend/src/recipes/multiturn-chat/ui.tsx`](../frontend/src/recipes/multiturn-chat/ui.tsx))
-   **`README.mdx`** - Documentation (see [`frontend/src/recipes/multiturn-chat/README.mdx`](../frontend/src/recipes/multiturn-chat/README.mdx))
-   **`registry.ts`** - Single source of truth for all recipe metadata

**Backend:**

-   **`[recipe_name].py`** - FastAPI router with recipe logic (see [`backend/src/recipes/multiturn_chat.py`](../backend/src/recipes/multiturn_chat.py))

**Recipe registration:**

-   Recipes registered in [`frontend/src/recipes/registry.ts`](../frontend/src/recipes/registry.ts)
-   Frontend routes auto-generated from registry
-   Backend programmatically discovers routes

### 3. React Router v7 with Auto-Generated Routes

The frontend uses React Router v7 with routes auto-generated from the registry:

-   Lazy loading with `Component` export pattern
-   Dynamic routes for demo, readme, and code views
-   See [`frontend/src/App.tsx`](../frontend/src/App.tsx) and [`frontend/src/routing/routeUtils.tsx`](../frontend/src/routing/routeUtils.tsx)

**Key routes:**

-   `/:slug` - Recipe demo (interactive UI)
-   `/:slug/readme` - Documentation view
-   `/:slug/code` - Source code view

### 4. State Management

**Server State (SWR):**

-   API data fetching with automatic caching and revalidation
-   See [`frontend/src/lib/hooks.ts`](../frontend/src/lib/hooks.ts) and [`frontend/src/lib/api.ts`](../frontend/src/lib/api.ts)

**Client State (URL Query Params):**

-   Endpoint/model selection via `?e=endpoint-id&m=model-name`
-   Shareable URLs, browser back/forward support
-   No React Context needed

### 5. Secure Credential Management

API keys stored in backend `.env.local` file:

-   Loaded by [`backend/src/core/endpoints.py`](../backend/src/core/endpoints.py)
-   Never sent to client (only endpoint IDs exposed)
-   Backend proxies requests to LLM endpoints

**Flow:**

1. Client sends `endpointId` to backend
2. Backend looks up credentials from `.env.local`
3. Backend makes authenticated request to LLM
4. API keys never leave server

## Data Flow

### Recipe Execution

1. **User interaction** - User enters input in recipe UI
2. **API request** - Frontend sends `POST /api/recipes/[recipe-name]` with endpoint ID
3. **Credential lookup** - Backend retrieves credentials from `.env.local`
4. **LLM request** - Backend calls LLM endpoint with credentials
5. **Streaming response** - Backend streams response back to frontend
6. **UI update** - Frontend renders streaming response

**Security:** API keys never sent to client. See [`backend/src/core/endpoints.py`](../backend/src/core/endpoints.py).

### Configuration Flow

1. Backend loads `COOKBOOK_ENDPOINTS` from `.env.local` on startup
2. Frontend fetches available endpoints via `GET /api/endpoints` (without API keys)
3. User selects endpoint/model (stored in URL query params)
4. Recipe sends request with endpoint ID
5. Backend looks up credentials and proxies request

## Security Model

### API Key Protection

**Server-side storage:**

-   API keys in `.env.local` (gitignored, see `.env.local.sample`)
-   Loaded by [`backend/src/core/endpoints.py`](../backend/src/core/endpoints.py)
-   Never serialized or sent to client

**Request flow:**

1. Client sends endpoint ID (not credentials)
2. Backend validates endpoint ID exists
3. Backend looks up credentials from cache
4. Backend makes authenticated request to LLM
5. API key never leaves server

### Input Validation

-   **TypeScript** - Frontend type safety (see [`frontend/src/lib/types.ts`](../frontend/src/lib/types.ts))
-   **Python type hints** - Backend type safety
-   **Request validation** - FastAPI automatic request validation
-   **Error boundaries** - React error boundaries for graceful UI errors

## Technology Choices

### Why FastAPI?

-   Modern Python web framework
-   Automatic request validation
-   Native async/await support for streaming
-   OpenAPI docs out of the box

### Why React SPA (not Next.js)?

-   Better AI ecosystem integration with Python
-   Want Python backend (not Node.js)
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

-   Token streaming via Server-Sent Events (SSE)
-   NDJSON streaming for batch operations
-   See [`backend/src/recipes/multiturn_chat.py`](../backend/src/recipes/multiturn_chat.py) and [`backend/src/recipes/image_captioning.py`](../backend/src/recipes/image_captioning.py)

## Related Documentation

-   [Docker Deployment Guide](./docker.md) - Container deployment with MAX
-   [Contributing Guide](./contributing.md) - How to add recipes, code standards
-   [Main README](../README.md) - Quick start, setup instructions
-   [Project Context](../.claude/project-context.md) - Comprehensive architecture reference
