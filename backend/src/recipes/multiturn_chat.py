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

Protocol Details:
- Header: X-Vercel-AI-UI-Message-Stream: v1
- Format: SSE (text/event-stream with "data: {json}\n\n" lines)
- Events: Each event is a JSON object with a "type" field
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

    The Vercel AI SDK uses a parts-based message format that can represent
    multiple content types (text, tool calls, tool results). For this recipe,
    we only handle text parts.
    """
    type: str
    text: str | None = None


class UIMessage(BaseModel):
    """
    UI message format from Vercel AI SDK.

    The frontend useChat hook sends messages in this format, which differs
    from the OpenAI API format. We need to convert it before sending to
    OpenAI-compatible endpoints.
    """
    id: str
    role: str
    parts: list[UIMessagePart]


class ChatRequest(BaseModel):
    """
    Request body for multi-turn chat.

    The frontend sends the endpoint ID and model name along with the conversation
    history. The backend looks up the actual API credentials from the endpoint ID.
    """
    endpointId: str
    modelName: str
    messages: list[UIMessage]


# ============================================================================
# Helper Functions
# ============================================================================


def convert_ui_messages_to_openai(messages: list[UIMessage]) -> list[dict[str, Any]]:
    """
    Convert UIMessage format to OpenAI format.

    UIMessage: { id, role, parts: [{ type, text }] }
    OpenAI: { role, content }

    The Vercel AI SDK's message format uses a parts array to support multiple
    content types (text, images, tool calls). OpenAI's format is simpler with
    just role and content fields. We extract all text parts and combine them.
    """
    openai_messages = []

    for msg in messages:
        # Extract text content from parts. Filter to only "text" type parts
        # that actually have content, then join them with spaces.
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


@router.post("/multiturn-chat")
async def multiturn_chat(request: ChatRequest):
    """
    Multi-turn chat endpoint with SSE streaming.

    Streams chat completions using Server-Sent Events (SSE) format
    compatible with Vercel AI SDK's useChat hook.

    Protocol:
    - Header: X-Vercel-AI-UI-Message-Stream: v1
    - Events: start, text-start, text-delta, text-end, finish, [DONE]

    Each event is sent as "data: {json}\n\n" in SSE format. The frontend
    useChat hook parses these events and updates the UI in real-time as
    tokens stream in.
    """
    # Get endpoint configuration from cache. The endpoint ID comes from the frontend
    # and maps to a full endpoint configuration (baseUrl, apiKey) stored in .env.local.
    # This keeps API keys secure on the server side.
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
        """
        Generate SSE stream compatible with Vercel AI SDK.

        This async generator yields Server-Sent Events that the frontend's useChat
        hook understands. Each event is a JSON object prefixed with "data: " and
        followed by two newlines (SSE format).
        """
        try:
            # Create AsyncOpenAI client with the endpoint's baseUrl and apiKey.
            # AsyncOpenAI is preferred over sync OpenAI for better concurrency
            # and connection pooling in FastAPI.
            client = AsyncOpenAI(base_url=base_url, api_key=api_key)

            # Convert UIMessage format (from Vercel AI SDK) to OpenAI format.
            # This extracts text content from the parts-based message structure
            # and creates simple {role, content} objects.
            openai_messages = convert_ui_messages_to_openai(request.messages)

            # Generate unique IDs for this response. The Vercel AI SDK protocol
            # uses IDs to track message lifecycle and text segments.
            message_id = f"msg-{uuid.uuid4().hex[:8]}"
            text_id = f"text-{uuid.uuid4().hex[:8]}"

            # Send "start" event to signal message generation has begun.
            # The frontend uses this to create a new message placeholder.
            yield f'data: {json.dumps({"type": "start", "messageId": message_id})}\n\n'

            # Send "text-start" event to indicate text content is about to stream.
            # This event includes the text segment ID.
            yield f'data: {json.dumps({"type": "text-start", "id": text_id})}\n\n'

            # Create a streaming chat completion request. The stream=True parameter
            # tells OpenAI to return an async iterator of chunks rather than waiting
            # for the complete response.
            stream = await client.chat.completions.create(
                model=request.modelName,
                messages=openai_messages,
                stream=True,
            )

            # Stream text deltas as they arrive from the LLM. Each chunk contains
            # a small piece of the response (often a single token or word).
            async for chunk in stream:
                if chunk.choices and chunk.choices[0].delta.content:
                    delta = chunk.choices[0].delta.content
                    # Yield "text-delta" events with the incremental content.
                    # The frontend appends each delta to the message being displayed.
                    yield f'data: {json.dumps({"type": "text-delta", "id": text_id, "delta": delta})}\n\n'

            # Send "text-end" event to signal the text content is complete.
            yield f'data: {json.dumps({"type": "text-end", "id": text_id})}\n\n'

            # Send "finish" event to indicate the entire message is done.
            # The frontend uses this to finalize the message state.
            yield f'data: {json.dumps({"type": "finish"})}\n\n'

            # Send [DONE] marker to close the SSE stream.
            # This is a standard SSE convention to signal stream completion.
            yield f'data: [DONE]\n\n'

        except Exception as error:
            # If anything goes wrong during streaming, send an error event.
            # The frontend useChat hook will display this to the user.
            error_message = str(error) if error else "Unknown error"
            yield f'data: {json.dumps({"type": "error", "error": error_message})}\n\n'

    # Return a StreamingResponse that yields our SSE events.
    # The media_type "text/event-stream" tells the browser this is SSE.
    # The X-Vercel-AI-UI-Message-Stream header indicates protocol version.
    return StreamingResponse(
        generate_sse_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",  # Prevent proxies from caching the stream
            "Connection": "keep-alive",    # Keep connection open for streaming
            "X-Vercel-AI-UI-Message-Stream": "v1"  # Protocol version for useChat
        }
    )


@router.get("/multiturn-chat/code")
async def get_multiturn_chat_code():
    """
    Get the source code for the multiturn-chat recipe.

    Returns the Python source code of this file as plain text.
    This enables the frontend's "Code" view to display the backend implementation.
    """
    try:
        # Use __file__ to get the path to this source file, then read it.
        # This allows the frontend to display the actual backend code for
        # educational purposes.
        code_data = read_source_file(__file__)
        return Response(content=code_data, media_type="text/plain")
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error reading source code: {str(e)}"
        )