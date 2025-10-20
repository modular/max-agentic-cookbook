# MAX Recipes Backend

FastAPI backend for the MAX Recipes Cookbook.

## Setup

Install dependencies with uv:

```bash
uv sync
```

## Development

Run the development server with hot-reload:

```bash
uv run uvicorn src.main:app --reload --port 8000
```

The API will be available at `http://localhost:8000`

## API Endpoints

- `GET /api/health` - Health check endpoint
- `GET /api/recipes` - List available recipes

## API Documentation

Once running, visit:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`
