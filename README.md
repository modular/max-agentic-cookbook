# MAX Recipes

A modern fullstack cookbook application for AI recipes using FastAPI (Python) and React (TypeScript).

## Architecture

This project uses a clean separation between frontend and backend:

```
max-recipes/
├── backend/          # FastAPI Python API
├── frontend/         # Vite React TypeScript SPA
├── monorepo/         # Previous Next.js monorepo (archived)
└── archive/          # Legacy standalone recipes
```

## Requirements

- **Python** 3.11 or higher
- **Node.js** 22.x or higher
- **uv** - Fast Python package installer ([install here](https://github.com/astral-sh/uv))

## Quick Start

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   uv sync
   ```

3. Start the development server:
   ```bash
   uv run uvicorn src.main:app --reload --port 8000
   ```

The API will be available at `http://localhost:8000`

API documentation:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

The app will be available at `http://localhost:5173`

### Running Both Servers

Open two terminal windows:

**Terminal 1 (Backend):**
```bash
cd backend && uv run uvicorn src.main:app --reload --port 8000
```

**Terminal 2 (Frontend):**
```bash
cd frontend && npm run dev
```

The frontend automatically proxies API requests to the backend during development.

## Development

### Backend Structure

```
backend/
├── src/
│   ├── main.py           # FastAPI app entry point
│   ├── recipes/          # Recipe route modules
│   └── core/             # Config and utilities
└── pyproject.toml        # Python dependencies
```

### Frontend Structure

```
frontend/
├── src/
│   ├── features/         # Recipe feature components
│   ├── components/       # Shared UI components
│   ├── lib/              # Utils, types, API client
│   ├── App.tsx           # Root component with routes
│   └── main.tsx          # Entry point
└── vite.config.ts        # Vite configuration
```

## API Endpoints

- `GET /api/health` - Health check
- `GET /api/recipes` - List available recipes

## Technologies

**Backend:**
- FastAPI - Modern Python web framework
- uvicorn - ASGI server
- uv - Fast Python package manager

**Frontend:**
- React 18 - UI library
- TypeScript - Type safety
- Vite - Build tool and dev server
- React Router - Client-side routing

## Contributing

See the individual README files in `backend/` and `frontend/` for more details.

## License

Apache-2.0 WITH LLVM-exception
