"""
Image Captioning with NDJSON Streaming and Performance Metrics

This recipe demonstrates how to caption images using OpenAI-compatible endpoints
with progressive streaming updates for better UX. Results appear as they're ready,
along with performance metrics.

Key features:
- Batch captioning: Process multiple images in parallel for efficiency
- Progressive streaming: Results appear as they complete (NDJSON format)
- Performance metrics: TTFT (time to first token) and duration tracking
- Vision API support: Works with OpenAI-compatible vision models
- Async parallel processing: Uses asyncio.as_completed for optimal throughput

Architecture:
- FastAPI StreamingResponse: Yields NDJSON (newline-delimited JSON) lines
- AsyncOpenAI client: Handles streaming from OpenAI-compatible vision endpoints
- Parallel processing: Multiple images processed concurrently with asyncio
- Performance tracking: Measures TTFT and generation duration per image

NDJSON Format:
- Success: {"imageId": "...", "text": "...", "ttft": 123, "duration": 456}\n
- Error: {"imageId": "...", "error": "..."}\n
- Each line is a separate JSON object followed by a newline
"""

import asyncio
import json
import time
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


class ImageCaptionMessage(BaseModel):
    """
    Single image caption request within a batch.

    Each item contains an imageId for tracking and a messages array in OpenAI format.
    The messages typically include a system prompt and a user message with the image.
    """
    imageId: str
    messages: list[dict[str, Any]]


class ImageCaptionRequest(BaseModel):
    """
    Request body for batch image captioning.

    The frontend sends the endpoint ID and model name along with a batch array
    of images to caption. The backend looks up the actual API credentials from
    the endpoint ID and processes all images in parallel.
    """
    endpointId: str
    modelName: str
    batch: list[ImageCaptionMessage]


# ============================================================================
# API Endpoints
# ============================================================================


@router.post("/image-captioning")
async def image_captioning(request: ImageCaptionRequest):
    """
    Image captioning endpoint with NDJSON streaming support.

    Accepts multiple images and streams back captions as NDJSON.
    Each image is processed in parallel and results are streamed as they complete.

    Returns NDJSON stream with format:
    - Success: {"imageId": "...", "text": "...", "ttft": 123, "duration": 456}
    - Error: {"imageId": "...", "error": "..."}

    NDJSON (newline-delimited JSON) is a simple streaming format where each line
    is a separate JSON object. This allows the frontend to parse results as they
    arrive without waiting for the entire batch to complete.
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

    async def generate_ndjson():
        """
        Generate NDJSON stream for batch image captioning.

        This async generator yields NDJSON lines as each image caption completes.
        Using asyncio.as_completed allows results to stream in as soon as they're
        ready, rather than waiting for all captions to finish.
        """
        try:
            # Create AsyncOpenAI client with the endpoint's baseUrl and apiKey.
            # AsyncOpenAI is preferred over sync OpenAI for better concurrency
            # and connection pooling in FastAPI.
            client = AsyncOpenAI(base_url=base_url, api_key=api_key)

            # Process all images in parallel. Define the processing function inline
            # so it has access to the client and model name.
            async def process_image(item: ImageCaptionMessage):
                """
                Process single image and return NDJSON result.

                Tracks performance metrics:
                - TTFT (time to first token): Latency before first response token
                - Duration: Time from first token to completion
                """
                try:
                    # Start timing for TTFT measurement
                    start_time = time.time()
                    first_token_time = None
                    ttft = None
                    text_chunks = []

                    # Create a streaming chat completion request. The stream=True parameter
                    # tells OpenAI to return an async iterator of chunks rather than waiting
                    # for the complete response.
                    stream = await client.chat.completions.create(
                        model=request.modelName,
                        messages=item.messages,
                        stream=True,
                    )

                    # Consume stream and track timing. We collect all chunks and measure
                    # when the first token arrives (TTFT) and when generation completes.
                    async for chunk in stream:
                        # Capture TTFT (time to first token) on the first chunk.
                        # TTFT measures the latency before the model starts responding,
                        # which is important for perceived responsiveness.
                        if ttft is None and chunk.choices:
                            first_token_time = time.time()
                            ttft = int((first_token_time - start_time) * 1000)

                        # Collect text chunks. Vision models stream caption text just like
                        # regular chat completions.
                        if chunk.choices and chunk.choices[0].delta.content:
                            text_chunks.append(chunk.choices[0].delta.content)

                    # Calculate duration (time from first token to completion).
                    # This measures the generation speed after the model starts responding.
                    duration = None
                    if first_token_time:
                        duration = int((time.time() - first_token_time) * 1000)

                    # Combine all text chunks into the final caption
                    text = "".join(text_chunks)

                    # Return success result as NDJSON line. The newline at the end is
                    # crucial for NDJSON format - it allows the frontend to parse each
                    # line independently as it arrives.
                    return json.dumps({
                        "imageId": item.imageId,
                        "text": text,
                        "ttft": ttft,
                        "duration": duration
                    }) + "\n"

                except Exception as error:
                    # Return error result as NDJSON line. This allows individual image
                    # failures without breaking the entire batch.
                    error_message = str(error) if error else "Unknown error"
                    return json.dumps({
                        "imageId": item.imageId,
                        "error": error_message
                    }) + "\n"

            # Process all images in parallel and yield results as they complete.
            # asyncio.as_completed returns results in completion order (not submission order),
            # which gives the best perceived performance - users see results immediately
            # as each caption finishes, rather than waiting for the slowest one.
            tasks = [process_image(item) for item in request.batch]
            for coro in asyncio.as_completed(tasks):
                result = await coro
                yield result

        except Exception as error:
            # Yield final error if something goes wrong at the batch level.
            # Individual image errors are handled inside process_image.
            error_message = str(error) if error else "Unknown error"
            yield json.dumps({"error": error_message}) + "\n"

    # Return a StreamingResponse that yields our NDJSON lines.
    # The media_type "application/x-ndjson" indicates newline-delimited JSON.
    return StreamingResponse(
        generate_ndjson(),
        media_type="application/x-ndjson"
    )


@router.get("/image-captioning/code")
async def get_image_captioning_code():
    """
    Get the source code for the image captioning recipe.

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
