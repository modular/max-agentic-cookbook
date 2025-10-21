"""Multi-turn chat recipe API endpoint."""

from fastapi import APIRouter

router = APIRouter(prefix="/api/recipes", tags=["recipes"])


@router.post("/multiturn-chat")
async def multiturn_chat():
    """
    Multi-turn chat endpoint with streaming support.

    Accepts a list of messages and streams back the assistant's response.
    TODO: Implement actual chat logic with LLM integration.
    """
    return {
        "message": "Multi-turn chat endpoint - not yet implemented",
        "status": "stub",
    }
