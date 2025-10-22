"""Multi-turn chat recipe API endpoint with SSE streaming."""

import json
import uuid
from typing import Any

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from openai import AsyncOpenAI
from pydantic import BaseModel

from .endpoints import get_cached_endpoint

router = APIRouter(prefix="/api/recipes", tags=["recipes"])


class UIMessagePart(BaseModel):
    """Part of a UI message (text, tool call, etc.)."""
    type: str
    text: str | None = None


class UIMessage(BaseModel):
    """UI message format from Vercel AI SDK."""
    id: str
    role: str
    parts: list[UIMessagePart]


class ChatRequest(BaseModel):
    """Request body for multi-turn chat."""
    endpointId: str
    modelName: str
    messages: list[UIMessage]


def convert_ui_messages_to_openai(messages: list[UIMessage]) -> list[dict[str, Any]]:
    """
    Convert UIMessage format to OpenAI format.

    UIMessage: { id, role, parts: [{ type, text }] }
    OpenAI: { role, content }
    """
    openai_messages = []

    for msg in messages:
        # Extract text content from parts
        text_parts = [part.text for part in msg.parts if part.type == "text" and part.text]
        content = " ".join(text_parts) if text_parts else ""

        openai_messages.append({
            "role": msg.role,
            "content": content
        })

    return openai_messages


@router.post("/multiturn-chat")
async def multiturn_chat(request: ChatRequest):
    """
    Multi-turn chat endpoint with SSE streaming.

    Streams chat completions using Server-Sent Events (SSE) format
    compatible with Vercel AI SDK's useChat hook.

    Protocol:
    - Header: x-vercel-ai-ui-message-stream: v1
    - Events: message-start, text-start, text-delta, text-end, finish, [DONE]
    """
    # Get endpoint configuration from cache
    endpoint = get_cached_endpoint(request.endpointId)
    if not endpoint:
        raise HTTPException(
            status_code=400,
            detail=f"Endpoint not found: {request.endpointId}"
        )

    base_url = endpoint.get("baseUrl")
    api_key = endpoint.get("apiKey")

    if not base_url or not api_key:
        raise HTTPException(
            status_code=500,
            detail="Invalid endpoint configuration: missing baseUrl or apiKey"
        )

    async def generate_sse_stream():
        """Generate SSE stream compatible with Vercel AI SDK."""
        try:
            # Create AsyncOpenAI client
            client = AsyncOpenAI(base_url=base_url, api_key=api_key)

            # Convert UIMessage format to OpenAI format
            openai_messages = convert_ui_messages_to_openai(request.messages)

            # Generate unique IDs for this response
            message_id = f"msg-{uuid.uuid4().hex[:8]}"
            text_id = f"text-{uuid.uuid4().hex[:8]}"

            # Send start event (message start)
            yield f'data: {json.dumps({"type": "start", "messageId": message_id})}\n\n'

            # Send text-start event
            yield f'data: {json.dumps({"type": "text-start", "id": text_id})}\n\n'

            # Stream completion from OpenAI
            stream = await client.chat.completions.create(
                model=request.modelName,
                messages=openai_messages,
                stream=True,
            )

            # Stream text deltas
            async for chunk in stream:
                if chunk.choices and chunk.choices[0].delta.content:
                    delta = chunk.choices[0].delta.content
                    yield f'data: {json.dumps({"type": "text-delta", "id": text_id, "delta": delta})}\n\n'

            # Send text-end event
            yield f'data: {json.dumps({"type": "text-end", "id": text_id})}\n\n'

            # Send finish event
            yield f'data: {json.dumps({"type": "finish"})}\n\n'

            # Send [DONE] marker
            yield f'data: [DONE]\n\n'

        except Exception as error:
            # Send error event
            error_message = str(error) if error else "Unknown error"
            yield f'data: {json.dumps({"type": "error", "error": error_message})}\n\n'

    return StreamingResponse(
        generate_sse_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Vercel-AI-UI-Message-Stream": "v1"
        }
    )
