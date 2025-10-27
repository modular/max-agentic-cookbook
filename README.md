# MAX Agentic Cookbook

A modern fullstack cookbook app showcasing AI recipes with Modular MAX and other AI services. Built with FastAPI (Python) and React (TypeScript) for maximum flexibility and performance.

> **📦 Looking for legacy recipes?** Older standalone recipes have been moved to the [`archive`](https://github.com/modular/max-agentic-cookbook/tree/archive) branch. These are provided as-is for historical reference only and are no longer maintained.

## Architecture

FastAPI backend + React SPA with separate projects for clean separation:

```
max-recipes/
├── backend/          # FastAPI Python API (port 8010)
├── frontend/         # Vite React TypeScript SPA (port 5173 local)
└── docs/             # Architecture, contributing, Docker guides
```

**Why this architecture?**

-   **Separate projects** - First-class ecosystems for AI and UI development
-   **No SSR needed** - Just plain React, copy-paste into any project

## Requirements

-   **Python** 3.11 or higher
-   **Node.js** 22.x or higher
-   **uv** - Fast Python package installer ([install here](https://github.com/astral-sh/uv))

## Quick Start

### Local Development

Run backend and frontend separately in two terminals, or run + debug with VS Code.

**Terminal 1 (Backend):**

```bash
cd backend
uv sync        # Install dependencies
uv run dev     # Start backend on port 8010
```

**Terminal 2 (Frontend):**

```bash
cd frontend
npm install      # Install dependencies
npm run dev      # Start frontend with hot reload
```

Visit `http://localhost:5173` to see the app.

### Docker with MAX (All-in-One)

Run the complete stack with MAX model serving + backend + frontend:

```bash
# Build
docker build -t max-cookbook .

# Run (NVIDIA GPU)
docker run --gpus all \
    -v ~/.cache/huggingface:/root/.cache/huggingface \
    -e "HF_TOKEN=your-huggingface-token" \
    -e "MAX_MODEL=mistral-community/pixtral-12b" \
    -p 8000:8000 -p 8010:8010 \
    max-cookbook

# Run (AMD GPU)
docker run \
    --group-add keep-groups \
    --device /dev/kfd --device /dev/dri \
    -v ~/.cache/huggingface:/root/.cache/huggingface \
    -e "HF_TOKEN=your-huggingface-token" \
    -e "MAX_MODEL=mistral-community/pixtral-12b" \
    -p 8000:8000 -p 8010:8010 \
    max-cookbook
```

Visit `http://localhost:8010` to see the app.

**Services:**

-   **Port 8000**: MAX LLM serving (OpenAI-compatible /v1 endpoints)
-   **Port 8010**: Web app (FastAPI backend + React frontend)

PM2 orchestrates startup: MAX → web app with automatic health checks and restarts.

## Configuration

### Backend Configuration (.env.local)

Create `backend/.env.local` to configure LLM endpoints:

```env
COOKBOOK_ENDPOINTS='[
  {
    "id": "max-local",
    "baseUrl": "http://localhost:8000/v1",
    "apiKey": "EMPTY"
  }
]'
```

See `backend/.sample.env` for template.

### Frontend Configuration

No config needed! Frontend auto-detects endpoints via backend API.

## Development

### Backend Structure

```
backend/
├── src/
│   ├── main.py                 # FastAPI entry point
│   ├── core/                   # Config, utilities
│   │   ├── endpoints.py        # Endpoint management
│   │   ├── models.py           # Model listing
│   │   └── code_reader.py      # Source code reader
│   └── recipes/                # Recipe routers
│       ├── multiturn_chat.py   # Multi-turn chat
│       └── image_captioning.py # Image captioning
└── pyproject.toml              # Python dependencies
```

### Frontend Structure

```
frontend/
├── src/
│   ├── recipes/                # Recipe components + registry.ts
│   │   ├── registry.ts         # Recipe metadata
│   │   ├── multiturn-chat/     # Multi-turn chat UI
│   │   └── image-captioning/   # Image captioning UI
│   ├── components/             # Shared UI (Header, Navbar, etc.)
│   ├── routing/                # Routing infrastructure
│   ├── lib/                    # Custom hooks, API, types
│   └── App.tsx                 # Entry point
└── package.json                # Frontend dependencies
```

### Adding a Recipe

1. Add entry to `frontend/src/recipes/registry.ts` with slug, title, description, and component
2. Create `backend/src/recipes/[recipe_name].py` with FastAPI router
3. Include router in `backend/src/main.py`
4. Add UI component to `frontend/src/recipes/[recipe-name]/ui.tsx`
5. Add `README.mdx` to `frontend/src/recipes/[recipe-name]/`
6. Routes auto-generate from registry

See [Contributing Guide](docs/contributing.md) for detailed instructions.

## API Endpoints

**Backend routes (port 8010):**

-   `GET /api/health` - Health check
-   `GET /api/recipes` - List available recipe slugs
-   `GET /api/endpoints` - List configured LLM endpoints
-   `GET /api/models?endpointId=xxx` - List models for endpoint
-   `POST /api/recipes/multiturn-chat` - Multi-turn chat endpoint
-   `POST /api/recipes/image-captioning` - Image captioning endpoint
-   `GET /api/recipes/{slug}/code` - Get recipe backend source code

**Frontend routes (port 5173 local, 8010 Docker):**

-   `/` - Recipe cards grid
-   `/:slug` - Recipe demo (interactive UI)
-   `/:slug/readme` - Recipe documentation
-   `/:slug/code` - Recipe source code view

## Technologies

**Backend:**

-   FastAPI - Modern Python web framework
-   uvicorn - ASGI server
-   uv - Fast Python package manager
-   openai - OpenAI Python client for LLM proxying

**Frontend:**

-   React 18 - UI library
-   TypeScript - Type safety
-   Vite - Build tool and dev server
-   React Router v7 - Client-side routing
-   Mantine v7 - UI component library
-   SWR - Lightweight data fetching with caching
-   Vercel AI SDK - Streaming chat UI (multi-turn chat recipe)

**Docker:**

-   PM2 - Process manager for orchestrating services
-   MAX - High-performance model serving with GPU support

## Documentation

-   [Architecture Guide](docs/architecture.md) - Design decisions, patterns, technology choices
-   [Contributing Guide](docs/contributing.md) - How to add recipes and contribute
-   [Docker Deployment Guide](docs/docker.md) - Container deployment with MAX
-   [Project Context](.claude/project-context.md) - Comprehensive architecture reference for LLMs

## License

Apache-2.0 WITH LLVM-exception

See [LICENSE](LICENSE) for details.
