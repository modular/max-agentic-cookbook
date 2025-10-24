"""Models listing for cookbook."""

from fastapi import APIRouter, HTTPException, Query
from openai import OpenAI

from .endpoints import get_cached_endpoint

router = APIRouter()


@router.get("/api/models")
async def get_models(endpointId: str | None = Query(None)):
    """
    Get list of available models for a given endpoint.

    Proxies the OpenAI-compatible /v1/models endpoint using the endpoint's
    baseUrl and apiKey from the cached endpoints.

    Args:
        endpointId: The endpoint ID to fetch models for

    Returns:
        List of models with id and name fields
    """
    # Validate endpointId is provided
    if not endpointId:
        raise HTTPException(
            status_code=400,
            detail="Missing required query parameter: endpointId"
        )

    # Get endpoint config from cache
    endpoint = get_cached_endpoint(endpointId)
    if not endpoint:
        raise HTTPException(
            status_code=400,
            detail=f"Endpoint not found: {endpointId}"
        )

    # Extract baseUrl and apiKey from endpoint
    base_url = endpoint.get("baseUrl")
    api_key = endpoint.get("apiKey")

    if not base_url or not api_key:
        raise HTTPException(
            status_code=500,
            detail="Invalid endpoint configuration: missing baseUrl or apiKey"
        )

    try:
        # Create OpenAI client with endpoint's baseUrl and apiKey
        client = OpenAI(base_url=base_url, api_key=api_key)

        # Fetch models from the OpenAI-compatible endpoint
        response = client.models.list()

        # Transform to match frontend Model interface: { id: string, name: string }
        models = [
            {"id": model.id, "name": model.id}
            for model in response.data
        ]

        return models

    except Exception as err:
        # Log error and return 502 for upstream API failures
        error_message = f"Error fetching models from endpoint: {str(err)}"
        print(f"ERROR: {error_message}")
        raise HTTPException(
            status_code=502,
            detail=error_message
        )
