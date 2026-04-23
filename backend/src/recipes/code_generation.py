"""
Code Generation with Kimi K2.5 and DeepSeek V3

This recipe demonstrates streaming code generation via an OpenAI-compatible endpoint,
with a configurable system prompt as the primary lever for tuning model behavior.

Why Kimi K2.5 and DeepSeek V3 specifically:
- Kimi K2.5 uses a Mixture-of-Experts architecture trained with an agentic focus,
  making it well-suited for multi-step reasoning tasks like writing and editing code.
- DeepSeek V3 was trained on a large corpus of code across many languages, giving it
  strong code completion and generation capabilities out of the box.
Both models differ meaningfully from general-purpose chat models and are the right
starting point for code generation use cases.

Key features:
- System prompt configuration: Tune language, style, and context awareness
- Token streaming: Code appears progressively, token-by-token via SSE
- Vercel AI SDK compatible: Same SSE protocol as multiturn_chat
- OpenAI-compatible: Works with any endpoint at model.api.modular.com

Architecture:
- FastAPI StreamingResponse: Async generator yields SSE-formatted events
- AsyncOpenAI client: Handles streaming from the OpenAI-compatible endpoint
- System prompt injection: Prepended to the message list before the API call
- Protocol events: start, text-start, text-delta, text-end, finish, [DONE]
"""

import json
import uuid
from typing import Any

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse, Response
from openai import AsyncOpenAI
from pydantic import BaseModel

from ..core.endpoints import get_cached_endpoint
from ..core.code_reader import read_source_file

router = APIRouter(prefix="/api/recipes", tags=["recipes"])


# ============================================================================
# Types and Models
# ============================================================================


class UIMessagePart(BaseModel):
    """
    Part of a UI message (text, tool call, etc.).

    The Vercel AI SDK uses a parts-based message format. For this recipe,
    we only handle text parts.
    """
    type: str
    text: str | None = None


class UIMessage(BaseModel):
    """
    UI message format from Vercel AI SDK.

    The frontend useChat hook sends messages in this format, which we convert
    to OpenAI format before calling the endpoint.
    """
    id: str
    role: str
    parts: list[UIMessagePart]


class CodeGenRequest(BaseModel):
    """
    Request body for code generation.

    Includes a systemPrompt that is prepended to the message list, giving the
    developer direct control over the model's coding style and context awareness.
    """
    endpointId: str
    modelName: str
    systemPrompt: str
    messages: list[UIMessage]


# ============================================================================
# Helper Functions
# ============================================================================


def convert_ui_messages_to_openai(messages: list[UIMessage]) -> list[dict[str, Any]]:
    """
    Convert UIMessage format to OpenAI format.

    UIMessage: { id, role, parts: [{ type, text }] }
    OpenAI: { role, content }
    """
    openai_messages = []

    for msg in messages:
        text_parts = [part.text for part in msg.parts if part.type == "text" and part.text]
        content = " ".join(text_parts) if text_parts else ""

        openai_messages.append({
            "role": msg.role,
            "content": content
        })

    return openai_messages


# ============================================================================
# API Endpoints
# ============================================================================


@router.post("/code-generation")
async def code_generation(request: CodeGenRequest):
    """
    Code generation endpoint with SSE streaming.

    Prepends the system prompt to the conversation, then streams completions
    using the same Vercel AI SDK SSE protocol as multiturn-chat.

    Protocol:
    - Header: X-Vercel-AI-UI-Message-Stream: v1
    - Events: start, text-start, text-delta, text-end, finish, [DONE]
    """
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
        try:
            client = AsyncOpenAI(base_url=base_url, api_key=api_key)

            openai_messages = convert_ui_messages_to_openai(request.messages)

            # Prepend system prompt so the model knows the coding context
            # before it sees any user messages.
            messages_with_system = [
                {"role": "system", "content": request.systemPrompt},
                *openai_messages,
            ]

            message_id = f"msg-{uuid.uuid4().hex[:8]}"
            text_id = f"text-{uuid.uuid4().hex[:8]}"

            yield f'data: {json.dumps({"type": "start", "messageId": message_id})}\n\n'
            yield f'data: {json.dumps({"type": "text-start", "id": text_id})}\n\n'

            stream = await client.chat.completions.create(
                model=request.modelName,
                messages=messages_with_system,
                stream=True,
            )

            async for chunk in stream:
                if chunk.choices and chunk.choices[0].delta.content:
                    delta = chunk.choices[0].delta.content
                    yield f'data: {json.dumps({"type": "text-delta", "id": text_id, "delta": delta})}\n\n'

            yield f'data: {json.dumps({"type": "text-end", "id": text_id})}\n\n'
            yield f'data: {json.dumps({"type": "finish"})}\n\n'
            yield f'data: [DONE]\n\n'

        except Exception as error:
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


@router.get("/code-generation/code")
async def get_code_generation_code():
    """
    Get the source code for the code-generation recipe.

    Returns the Python source code of this file as plain text.
    """
    try:
        code_data = read_source_file(__file__)
        return Response(content=code_data, media_type="text/plain")
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error reading source code: {str(e)}"
        )
