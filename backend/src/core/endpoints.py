"""Endpoints management for cookbook."""

import json
import os
from typing import Any

from fastapi import APIRouter, HTTPException

router = APIRouter()

# In-memory cache for endpoints with API keys
_endpoints_cache: list[dict[str, Any]] = []


def _parse_endpoints() -> list[dict[str, Any]]:
    """Parse COOKBOOK_ENDPOINTS from environment variable."""
    raw = os.getenv("COOKBOOK_ENDPOINTS")

    if not raw:
        raise HTTPException(
            status_code=500,
            detail="COOKBOOK_ENDPOINTS is not set in the environment"
        )

    try:
        parsed = json.loads(raw)
        if not isinstance(parsed, list):
            raise HTTPException(
                status_code=400,
                detail="COOKBOOK_ENDPOINTS must be a JSON array"
            )

        # Validate and deduplicate endpoints
        seen_ids = set()
        endpoints = []

        for e in parsed:
            endpoint_id = str(e.get("id", ""))

            if endpoint_id in seen_ids:
                raise HTTPException(
                    status_code=400,
                    detail=f"Duplicate endpoint ID found: {endpoint_id}"
                )

            seen_ids.add(endpoint_id)
            endpoints.append(e)

        return endpoints

    except json.JSONDecodeError as err:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid COOKBOOK_ENDPOINTS JSON: {err}"
        )


def _sanitize_endpoint(endpoint: dict[str, Any]) -> dict[str, str]:
    """Remove sensitive fields (apiKey) from endpoint for public API."""
    return {
        "id": str(endpoint.get("id", "")),
        "baseUrl": str(endpoint.get("baseUrl", "")),
        "hwMake": endpoint.get("hwMake"),
        "hwModel": endpoint.get("hwModel"),
    }


@router.get("/api/endpoints")
async def get_endpoints():
    """
    Get list of available endpoints.

    Reads from COOKBOOK_ENDPOINTS environment variable and caches
    the full endpoint data (with API keys) in memory for later use.
    Returns sanitized endpoint list without API keys.
    """
    global _endpoints_cache

    # Parse and cache endpoints (with API keys)
    _endpoints_cache = _parse_endpoints()

    # Return sanitized endpoints (without API keys)
    sanitized = [_sanitize_endpoint(e) for e in _endpoints_cache]
    return sanitized


def get_cached_endpoint(endpoint_id: str) -> dict[str, Any] | None:
    """
    Get cached endpoint with API key by ID.

    Used internally by other routes that need the API key
    for proxying requests to the LLM server.
    """
    return next((e for e in _endpoints_cache if e.get("id") == endpoint_id), None)
