# API Reference

This document describes the REST API endpoints provided by the MAX Recipes backend.

## Base URL

-   Local development: `http://localhost:8010`
-   Docker deployment: `http://localhost:8010`

All API routes are prefixed with `/api`.

## Core Endpoints

### Health Check

Check if the API is running.

**Endpoint:** `GET /api/health`

**Response:**

```json
{ "status": "ok" }
```

### List Recipes

Get a list of all available recipe slugs.

**Endpoint:** `GET /api/recipes`

**Response:**

```json
["multiturn-chat", "image-captioning"]
```

### List Endpoints

Get configured LLM endpoints (without API keys for security).

**Endpoint:** `GET /api/endpoints`

**Response:**

```json
[
    {
        "id": "max-local",
        "baseUrl": "http://localhost:8000/v1"
    }
]
```

**Note:** API keys are never sent to the client. The backend uses endpoint IDs to look up credentials server-side.

### List Models

Get available models for a specific endpoint.

**Endpoint:** `GET /api/models?endpointId={id}`

**Query Parameters:**

-   `endpointId` (required) - The endpoint ID to query

**Response:**

Proxies the OpenAI-compatible `/v1/models` endpoint and returns an array of model objects.

## Recipe Endpoints

Each recipe provides two endpoints:

1. **Execution endpoint** - Runs the recipe with streaming responses
2. **Code endpoint** - Returns recipe source code (`GET /api/recipes/{recipe}/code`)

### Available Recipes

For detailed API request/response formats, protocol specifications, and implementation details, see each recipe's documentation:

- **[Multi-turn Chat](../frontend/src/recipes/multiturn-chat/README.mdx)** - Streaming chat interface with Server-Sent Events (SSE)
- **[Image Captioning](../frontend/src/recipes/image-captioning/README.mdx)** - Batch image captioning with NDJSON streaming

## Error Handling

The API uses standard HTTP status codes:

-   `200` - Success
-   `404` - Endpoint or resource not found
-   `422` - Validation error (invalid request body)
-   `500` - Internal server error

Error responses include a detail message:

```json
{
    "detail": "Endpoint not found"
}
```

## Security Model

### API Key Protection

-   API keys are stored in `backend/.env.local` (gitignored)
-   Frontend sends only endpoint IDs, never credentials
-   Backend looks up credentials server-side using `get_cached_endpoint()`
-   API keys never leave the server

### Request Flow

1. Client sends endpoint ID (not credentials)
2. Backend validates endpoint ID exists
3. Backend looks up credentials from cache
4. Backend makes authenticated request to LLM
5. API key never exposed to client

## Related Documentation

-   [Backend README](../backend/README.md) - Backend setup and development
-   [Contributing Guide](./contributing.md) - How to add new recipe endpoints
-   [Project Context](../AGENTS.md) - Architecture details
