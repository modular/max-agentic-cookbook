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
- **Tech:** FastAPI, uvicorn, uv for dependency management
- **Port:** 8000
- **CORS:** Configured for localhost:5173
- **Structure:**
  - `src/main.py` - Entry point
  - `src/recipes/` - Recipe route modules (to be populated)
  - `src/core/` - Config and utilities
- **Endpoints:**
  - `GET /api/health` - Health check
  - `GET /api/recipes` - List available recipes

### Frontend (Vite + React)
- **Tech:** Vite, React 18, TypeScript, React Router
- **Port:** 5173
- **Routing:** Manual route definitions in `App.tsx` (NO file-based routing, NO loaders/actions)
- **API:** Vite proxy to backend (no CORS issues)
- **Structure:**
  - `src/features/` - Recipe feature components
  - `src/components/` - Shared UI components
  - `src/lib/` - API client, types, utilities
  - `src/App.tsx` - Manual `<Routes>` definitions

**Routes:**
- `/` - Home page
- `/cookbook` - Recipe index
- `/cookbook/:recipe` - Individual recipe pages

## Key Architectural Decisions

1. ✅ **Separate projects** not monorepo (frontend/ and backend/ at root)
2. ✅ **uv** for Python dependency management (fast, modern)
3. ✅ **Manual React Router** (explicit route definitions, no file-system routing)
4. ✅ **Separate dev servers** (backend :8000, frontend :5173 with proxy)
5. ✅ **Plain React patterns** (useState, useEffect, fetch - no framework abstractions)

## Current Status

### ✅ Completed
- FastAPI backend scaffolded and running
- React SPA scaffolded and running
- CORS and API proxy configured
- Example endpoints and components working
- Basic routing structure in place
- API client utilities created

### 🔄 To Be Migrated

From `monorepo/packages/recipes/src/`:

**Recipes to port:**
1. **Multi-turn Chat** (`multiturn-chat/`)
   - UI: `ui.tsx` → `frontend/src/features/multiturn-chat/`
   - API: `api.ts` → `backend/src/recipes/multiturn_chat.py`

2. **Image Captioning** (`image-captioning/`)
   - UI: `ui.tsx` → `frontend/src/features/image-captioning/`
   - API: `api.ts` → `backend/src/recipes/image_captioning.py`

**Shared code to migrate:**
- UI components from `monorepo/packages/recipes/src/components.tsx`
- Utilities from `monorepo/packages/recipes/src/utils.ts`
- Types from `monorepo/packages/recipes/src/types.ts`

### Migration Pattern

For each recipe:
1. Copy UI component to `frontend/src/features/[recipe]/`
2. Convert Next.js API route handler to FastAPI endpoint
3. Update imports (remove workspace protocol `@modular/recipes`)
4. Add route definition to `frontend/src/App.tsx`
5. Test integration

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

- `backend/src/main.py` - Add new FastAPI routes here or import from recipes/
- `frontend/src/App.tsx` - Add new route definitions here
- `frontend/src/lib/api.ts` - Add new API client functions
- `frontend/src/lib/types.ts` - Add shared TypeScript types

## Dependencies to Add (When Porting Recipes)

**Frontend:**
- `@mantine/core` - UI component library
- `@mantine/hooks` - React hooks
- `@mantine/dropzone` - File upload
- `@tabler/icons-react` - Icons
- `ai` - Vercel AI SDK (for streaming)
- `streamdown` - Markdown streaming

**Backend:**
- TBD based on recipe needs (OpenAI client, etc.)

## Important Notes

- Uses **manual routing** not file-based routing (explicitly chosen)
- Avoid using loaders/actions patterns (plain React only)
- Backend routes should be prefixed with `/api`
- Keep recipe features self-contained in their own directories
- Frontend can call `/api/*` directly (proxy handles it)

## Next Steps

1. Port multi-turn chat recipe (simpler, good starting point)
2. Set up Mantine UI and shared components
3. Port image captioning recipe (more complex with file uploads)
4. Add any additional recipes from monorepo as needed
