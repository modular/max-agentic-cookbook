# MAX Recipes Backend

FastAPI backend for the MAX Recipes Cookbook, providing RESTful API endpoints for AI recipe execution with streaming support.

## Overview

Python-first backend built with FastAPI, designed for direct integration with AI services like Modular MAX, OpenAI-compatible endpoints, and Python AI ecosystem libraries. Supports both Server-Sent Events (SSE) and NDJSON streaming for real-time AI responses.

**Key Features:**
- **FastAPI** - Modern async Python web framework with automatic OpenAPI docs
- **Streaming support** - SSE and NDJSON for real-time token/result streaming
- **Recipe system** - Modular router-based architecture for AI recipes
- **Endpoint management** - Centralized configuration for multiple LLM endpoints
- **Code introspection** - Built-in source code viewing for recipes
- **Comprehensive docs** - Extensive docstrings in all recipe modules

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
│       ├── multiturn_chat.py   # Multi-turn chat with SSE streaming
│       └── image_captioning.py # Image captioning with NDJSON streaming
├── pyproject.toml              # Python dependencies (uv format)
├── .sample.env                 # Example environment configuration
└── .env.local                  # Your local configuration (gitignored)
```

## Setup

### Prerequisites
- Python 3.11 or higher
- [uv](https://github.com/astral-sh/uv) - Fast Python package installer

### Installation

1. **Install dependencies:**
   ```bash
   cd backend
   uv sync
   ```

2. **Configure endpoints:**

   Create `backend/.env.local` based on `.sample.env`:
   ```env
   COOKBOOK_ENDPOINTS='[
     {
       "id": "max-local",
       "baseUrl": "http://localhost:8000/v1",
       "apiKey": "EMPTY"
     },
     {
       "id": "openai",
       "baseUrl": "https://api.openai.com/v1",
       "apiKey": "sk-..."
     }
   ]'
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
- **Swagger UI**: http://localhost:8010/docs
- **ReDoc**: http://localhost:8010/redoc

## API Endpoints

### Core Endpoints

- `GET /api/health` - Health check endpoint
  ```json
  { "status": "ok" }
  ```

- `GET /api/recipes` - List available recipe slugs
  ```json
  ["multiturn-chat", "image-captioning"]
  ```

- `GET /api/endpoints` - List configured LLM endpoints (without API keys)
  ```json
  [
    {
      "id": "max-local",
      "baseUrl": "http://localhost:8000/v1"
    }
  ]
  ```

- `GET /api/models?endpointId={id}` - List models for an endpoint
  - Proxies OpenAI-compatible `/v1/models` endpoint
  - Returns array of model objects

### Recipe Endpoints

Each recipe provides two endpoints:

1. **Execution endpoint** - Runs the recipe (typically `POST`)
2. **Code endpoint** - Returns recipe source code (`GET /{recipe}/code`)

#### Multi-turn Chat (`/api/recipes/multiturn-chat`)

- `POST /api/recipes/multiturn-chat` - Streaming chat with SSE
  - **Input**: `{ endpointId, model, messages: UIMessage[] }`
  - **Output**: SSE stream (Vercel AI SDK protocol)
  - **Content-Type**: `text/event-stream`

- `GET /api/recipes/multiturn-chat/code` - Get recipe source
  - **Output**: Python source code as plain text

#### Image Captioning (`/api/recipes/image-captioning`)

- `POST /api/recipes/image-captioning` - Batch image captioning
  - **Input**: `{ endpointId, model, images: ImageInput[], systemPrompt }`
  - **Output**: NDJSON stream with progressive results
  - **Content-Type**: `application/x-ndjson`

- `GET /api/recipes/image-captioning/code` - Get recipe source
  - **Output**: Python source code as plain text

## Recipe Implementation Pattern

All recipes follow a consistent pattern with extensive documentation:

### 1. Module Docstring

Each recipe module begins with a comprehensive docstring explaining:
- Purpose and use case
- Key features
- Architecture and implementation details
- Protocol/format specifications

Example from `multiturn_chat.py`:
```python
"""
Multi-turn Chat with Token Streaming

This recipe demonstrates how to build a chat API that works with Modular MAX
or any OpenAI-compatible endpoint using Server-Sent Events (SSE) for real-time
token streaming. Messages stream token-by-token for fluid, real-time responses.

Key features:
- Token streaming: Response text streams progressively as it's generated
- SSE (Server-Sent Events): Industry-standard protocol for server-to-client streaming
- Vercel AI SDK compatible: Implements the protocol expected by useChat hook
- Multi-turn context: Full conversation history maintained across messages
- Async streaming: Uses AsyncOpenAI for efficient connection pooling

Architecture:
- FastAPI StreamingResponse: Async generator yields SSE-formatted events
- AsyncOpenAI client: Handles streaming from OpenAI-compatible endpoints
- UIMessage → OpenAI conversion: Transforms Vercel AI SDK format to OpenAI format
- Protocol events: start, text-start, text-delta, text-end, finish, [DONE]
"""
```

### 2. APIRouter Setup

```python
from fastapi import APIRouter
from fastapi.responses import Response
from ..core.code_reader import read_source_file

router = APIRouter(prefix="/api/recipes", tags=["recipes"])
```

### 3. Recipe Endpoint

Implement your recipe logic with appropriate streaming:

```python
@router.post("/recipe-name")
async def recipe_endpoint(request: RecipeRequest):
    # Your recipe implementation
    return StreamingResponse(
        stream_generator(),
        media_type="text/event-stream"  # or "application/x-ndjson"
    )
```

### 4. Code Endpoint

Every recipe must provide source code access:

```python
@router.get("/recipe-name/code", response_class=Response)
def get_recipe_code():
    """Return the source code for this recipe as plain text."""
    return Response(
        content=read_source_file(__file__),
        media_type="text/plain"
    )
```

### 5. Register in main.py

```python
from .recipes import multiturn_chat, image_captioning, your_recipe

app.include_router(multiturn_chat.router)
app.include_router(image_captioning.router)
app.include_router(your_recipe.router)
```

## Core Modules

### endpoints.py

Manages LLM endpoint configuration with caching:

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

**Features:**
- Loads from `COOKBOOK_ENDPOINTS` environment variable
- In-memory caching for fast lookups
- Never exposes API keys to client

### models.py

Proxies OpenAI-compatible `/v1/models` endpoint:

```python
GET /api/models?endpointId={id}
```

Returns available models for the specified endpoint.

### code_reader.py

Utility for reading recipe source code:

```python
from ..core.code_reader import read_source_file

source_code = read_source_file(__file__)
```

Returns the Python source code as a string, enabling the code viewer feature in the frontend.

## Documentation Standards

All recipe modules must include:

1. **Module docstring** - Comprehensive overview at top of file
2. **Section comments** - Organize code with clear section headers
   ```python
   # ============================================================================
   # Types and Models
   # ============================================================================
   ```
3. **Function docstrings** - Document all public functions
4. **Inline comments** - Explain complex logic

See `multiturn_chat.py` and `image_captioning.py` for examples.

## Testing

Test your recipe endpoints:

```bash
# Health check
curl http://localhost:8010/api/health

# List recipes
curl http://localhost:8010/api/recipes

# Get recipe code
curl http://localhost:8010/api/recipes/multiturn-chat/code
```

## Deployment

See the [Docker Deployment Guide](../docs/docker.md) for production deployment with MAX.

## Related Documentation

- [Project Context](../.claude/project-context.md) - Comprehensive architecture reference
- [Architecture Guide](../docs/architecture.md) - Design decisions and patterns
- [Contributing Guide](../docs/contributing.md) - How to add recipes
