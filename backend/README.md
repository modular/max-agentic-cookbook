# Backend

FastAPI backend for MAX Recipes. Provides RESTful API endpoints for AI recipe execution with streaming support.

## Quick Start

### Prerequisites

-   Python 3.11 or higher
-   We recommend [uv](https://github.com/astral-sh/uv) for managing Python environments

### Installation

```bash
cd backend
uv sync
```

### Configuration

Create `backend/.env.local` based on `.sample.env`:

```env
COOKBOOK_ENDPOINTS='[
  {
    "id": "max-local",
    "baseUrl": "http://localhost:8000/v1",
    "apiKey": "EMPTY"
  }
]'
```

## Project Structure

```
backend/
├── src/
│   ├── main.py                 # FastAPI app entry point, router registration
│   ├── core/                   # Core utilities and services
│   │   ├── endpoints.py        # Endpoint configuration management
│   │   ├── models.py           # Model listing proxy
│   │   └── code_reader.py      # Source code reading utility
│   └── recipes/                # Recipe API routers
│       ├── batch_text_classification.py # Batch classification with parallel processing
│       ├── multiturn_chat.py   # Multi-turn chat with SSE streaming
│       └── image_captioning.py # Image captioning with NDJSON streaming
├── pyproject.toml              # Python dependencies (uv format)
├── .sample.env                 # Example environment configuration
└── .env.local                  # Your local configuration (gitignored)
```

## Development

### Run Development Server

Start the server with hot-reload:

```bash
uv run dev
```

The API will be available at `http://localhost:8010`

### API Documentation

Once running, explore the interactive API docs:

-   **Swagger UI**: http://localhost:8010/docs
-   **ReDoc**: http://localhost:8010/redoc

### Testing

Test your endpoints:

```bash
# Health check
curl http://localhost:8010/api/health

# List recipes
curl http://localhost:8010/api/recipes

# Get recipe code
curl http://localhost:8010/api/recipes/multiturn-chat/code

# Text Classification (requires endpoint configured in .env.local)
curl -X POST http://localhost:8010/api/recipes/batch-text-classification \
  -H "Content-Type: application/json" \
  -d '{
    "endpointId": "max-local",
    "modelName": "llama-3.1-8b",
    "systemPrompt": "Classify as positive or negative",
    "textField": "text",
    "batch": [
      {"itemId": "1", "originalData": {"text": "This is great!"}}
    ]
  }'
```

## Documentation

-   **[API Reference](../docs/api.md)** - Complete endpoint specifications and request/response formats
-   **[Contributing Guide](../docs/contributing.md)** - How to add recipes, code standards, and patterns
-   **[Project Context](../AGENTS.md)** - Architecture details and core modules documentation
-   **[Docker Deployment](../docs/docker.md)** - Container deployment with MAX
