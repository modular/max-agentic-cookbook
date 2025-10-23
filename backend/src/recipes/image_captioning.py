"""Image captioning recipe API endpoint with NDJSON streaming."""

import asyncio
import json
import time
from typing import Any

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from openai import AsyncOpenAI
from pydantic import BaseModel

from .endpoints import get_cached_endpoint
from ..core.code_reader import read_source_file

router = APIRouter(prefix="/api/recipes", tags=["recipes"])


class ImageCaptionMessage(BaseModel):
    """Single image caption request within a batch."""
    imageId: str
    messages: list[dict[str, Any]]


class ImageCaptionRequest(BaseModel):
    """Request body for batch image captioning."""
    endpointId: str
    modelName: str
    batch: list[ImageCaptionMessage]


@router.post("/image-captioning")
async def image_captioning(request: ImageCaptionRequest):
    """
    Image captioning endpoint with NDJSON streaming support.

    Accepts multiple images and streams back captions as NDJSON.
    Each image is processed in parallel and results are streamed as they complete.

    Returns NDJSON stream with format:
    - Success: {"imageId": "...", "text": "...", "ttft": 123, "duration": 456}
    - Error: {"imageId": "...", "error": "..."}
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

    async def generate_ndjson():
        """Generate NDJSON stream for batch image captioning."""
        try:
            # Create AsyncOpenAI client
            client = AsyncOpenAI(base_url=base_url, api_key=api_key)

            # Process all images in parallel
            async def process_image(item: ImageCaptionMessage):
                """Process single image and return NDJSON result."""
                try:
                    start_time = time.time()
                    first_token_time = None
                    ttft = None
                    text_chunks = []

                    # Stream completion from OpenAI
                    stream = await client.chat.completions.create(
                        model=request.modelName,
                        messages=item.messages,
                        stream=True,
                    )

                    # Consume stream and track timing
                    async for chunk in stream:
                        # Capture TTFT (time to first token)
                        if ttft is None and chunk.choices:
                            first_token_time = time.time()
                            ttft = int((first_token_time - start_time) * 1000)

                        # Collect text chunks
                        if chunk.choices and chunk.choices[0].delta.content:
                            text_chunks.append(chunk.choices[0].delta.content)

                    # Calculate duration (first token to completion)
                    duration = None
                    if first_token_time:
                        duration = int((time.time() - first_token_time) * 1000)

                    # Combine text chunks
                    text = "".join(text_chunks)

                    # Return success result as NDJSON line
                    return json.dumps({
                        "imageId": item.imageId,
                        "text": text,
                        "ttft": ttft,
                        "duration": duration
                    }) + "\n"

                except Exception as error:
                    # Return error result as NDJSON line
                    error_message = str(error) if error else "Unknown error"
                    return json.dumps({
                        "imageId": item.imageId,
                        "error": error_message
                    }) + "\n"

            # Process all images in parallel and yield results as they complete
            tasks = [process_image(item) for item in request.batch]
            for coro in asyncio.as_completed(tasks):
                result = await coro
                yield result

        except Exception as error:
            # Yield final error if something goes wrong
            error_message = str(error) if error else "Unknown error"
            yield json.dumps({"error": error_message}) + "\n"

    return StreamingResponse(
        generate_ndjson(),
        media_type="application/x-ndjson"
    )


@router.get("/image-captioning/code")
async def get_image_captioning_code():
    """
    Get the source code for the image captioning recipe.

    Returns the Python source code of this file as JSON.
    """
    try:
        # Use __file__ to get the path to this source file
        code_data = read_source_file(__file__)
        return code_data
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error reading source code: {str(e)}"
        )
