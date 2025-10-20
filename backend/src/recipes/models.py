"""Models listing for cookbook."""

from fastapi import APIRouter, Query

router = APIRouter()


@router.get("/api/models")
async def get_models(endpointId: str | None = Query(None)):
    """
    Get list of available models for a given endpoint.

    Currently returns an empty list as a placeholder.

    TODO: This will eventually proxy the LLM server's /v1/models endpoint
    using the endpoint's baseUrl and apiKey from the cached endpoints.

    Args:
        endpointId: The endpoint ID to fetch models for

    Returns:
        List of models (currently empty)
    """
    # Placeholder: return empty list
    # In the future, this will:
    # 1. Get the endpoint from cache using endpointId
    # 2. Make a request to {baseUrl}/v1/models with the apiKey
    # 3. Transform and return the models list

    return []
