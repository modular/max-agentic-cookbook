"""Image captioning recipe API endpoint."""

from fastapi import APIRouter

router = APIRouter(prefix="/api/recipes", tags=["recipes"])


@router.post("/image-captioning")
async def image_captioning():
    """
    Image captioning endpoint with NDJSON streaming support.

    Accepts multiple images and streams back captions as NDJSON.
    TODO: Implement actual image captioning logic with vision model integration.
    """
    return {
        "message": "Image captioning endpoint - not yet implemented",
        "status": "stub",
    }
