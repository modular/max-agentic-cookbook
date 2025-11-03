"""
Text Classification with Parallel Processing

This recipe demonstrates how to classify multiple text items in parallel using
OpenAI-compatible endpoints. All items are processed concurrently for maximum
efficiency, and results are returned as a complete JSON array once all items
are processed.

Key features:
- Flexible JSONL schema: User specifies which field contains text to classify
- Custom prompts: Full control over classification instructions and format
- Parallel batch processing: Multiple items processed simultaneously with asyncio
- Performance metrics: Duration tracking for each classification
- Batch response: Complete JSON array returned (not streaming)

Architecture:
- FastAPI endpoint: Receives batch classification requests
- AsyncOpenAI client: Handles API calls to OpenAI-compatible endpoints
- Parallel processing: Uses asyncio.gather() for concurrent processing
- Performance tracking: Measures duration per item in milliseconds

Request Format:
- endpointId: Which LLM endpoint to use
- modelName: Which model to use (e.g., "llama-3.1-8b")
- systemPrompt: Classification instructions (full control over categories/format)
- textField: Which field in JSON contains the text to classify
- batch: Array of items with unique IDs and original JSON data

Response Format:
- JSON array of classification results
- Each result: itemId, originalText, classification, duration
- All items processed in parallel, response sent once all complete
"""

import asyncio
import time
from asyncio import Semaphore
from typing import Any

from fastapi import APIRouter, HTTPException
from fastapi.responses import Response
from openai import AsyncOpenAI
from pydantic import BaseModel

from ..core.endpoints import get_cached_endpoint
from ..core.code_reader import read_source_file

router = APIRouter(prefix="/api/recipes", tags=["recipes"])


# ============================================================================
# Types and Models
# ============================================================================


class TextItem(BaseModel):
    """
    Single item in a batch for text classification.

    Each item represents one text to classify. The itemId is used to track
    results back to the original input. The originalData contains the raw
    JSON from the JSONL file, allowing full context preservation.
    """
    itemId: str
    originalData: dict[str, Any]


class BatchClassificationRequest(BaseModel):
    """
    Request body for Text Classification.

    The frontend sends the endpoint ID and model name along with a batch array
    of items to classify. The backend looks up the actual API credentials from
    the endpoint ID and processes all items in parallel.
    """
    endpointId: str
    modelName: str
    systemPrompt: str
    textField: str
    batch: list[TextItem]


class ClassificationResult(BaseModel):
    """
    Result of classifying a single item.

    Contains the original text that was classified, the classification result
    from the LLM, and performance metrics (duration in milliseconds).
    """
    itemId: str
    originalText: str
    classification: str
    duration: int


# ============================================================================
# API Endpoints
# ============================================================================


@router.post("/batch-text-classification")
async def batch_text_classification(request: BatchClassificationRequest) -> list[ClassificationResult]:
    """
    Text Classification endpoint with parallel processing.

    Accepts multiple text items and classifies them all in parallel using
    a custom classification prompt. Results are returned as a complete JSON
    array once all items are processed.

    This approach (not streaming) provides:
    - Clear loading state on frontend (spinner while processing)
    - All results available at once for download/export
    - Simple implementation without streaming complexity
    - Can be extended to streaming later if needed

    Args:
        request: BatchClassificationRequest with batch items and prompt

    Returns:
        List of ClassificationResult objects with itemId, originalText,
        classification, and duration for each item

    Raises:
        HTTPException: If endpoint not found or invalid configuration
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

    # Create AsyncOpenAI client with the endpoint's baseUrl and apiKey.
    # AsyncOpenAI is preferred over sync OpenAI for better concurrency
    # and connection pooling in FastAPI.
    client = AsyncOpenAI(base_url=base_url, api_key=api_key)

    async def process_item(item: TextItem) -> ClassificationResult:
        """
        Process a single item for text classification.

        Extracts text from the specified field, sends it to the LLM with the
        custom prompt, and returns the classification result along with timing.

        Args:
            item: TextItem with unique ID and original JSON data

        Returns:
            ClassificationResult with itemId, text, classification, and duration
        """
        try:
            # Extract text from the item using the specified field name.
            # This pattern allows flexible JSONL schemas - the user specifies
            # which field contains the text to classify (e.g., "content", "text", "message")
            text = item.originalData.get(request.textField, "")

            # Validate that the field exists and contains a string.
            # Return graceful error result if field is missing or wrong type.
            if not text or not isinstance(text, str):
                raise ValueError(
                    f"Field '{request.textField}' not found or not a string in item {item.itemId}"
                )

            # Start timing for duration measurement
            start_time = time.time()

            # Build messages array with system prompt and user message.
            # The system prompt provides full control over classification:
            # - Categories to use
            # - Output format
            # - Reasoning required
            # - Any other instructions the user needs
            messages = [
                {"role": "system", "content": request.systemPrompt},
                {"role": "user", "content": text}
            ]

            # Create a chat completion request. Since we need the complete response
            # for batch processing, we don't use streaming here.
            response = await client.chat.completions.create(
                model=request.modelName,
                messages=messages,
                stream=False,
            )

            # Extract classification from response
            classification = response.choices[0].message.content or ""

            # Calculate duration in milliseconds for performance tracking.
            # This gives the frontend visibility into classification speed.
            duration_ms = int((time.time() - start_time) * 1000)

            # Return successful classification result
            return ClassificationResult(
                itemId=item.itemId,
                originalText=text,
                classification=classification,
                duration=duration_ms
            )

        except Exception as error:
            # Return error result for this item while allowing other items
            # to be processed. This prevents one failure from breaking the
            # entire batch, similar to how streaming NDJSON works but for
            # batch processing.
            error_message = str(error) if error else "Unknown error"
            return ClassificationResult(
                itemId=item.itemId,
                originalText="<error>",
                classification=error_message,
                duration=-1
            )

    # Process all items in parallel using asyncio.gather() with rate limiting.
    # This is the key difference from streaming approaches:
    # - gather() waits for ALL tasks to complete before returning
    # - Results are returned as a complete array (not progressive NDJSON)
    # - Frontend gets a loading spinner for the entire batch
    # - All data is available at once for download/export
    #
    # Rate limiting with semaphore prevents overwhelming the API:
    # - Max 10 concurrent requests to avoid rate limits
    # - Timeout of 300 seconds (5 minutes) for the entire batch
    # - If a request fails, other items continue processing
    semaphore = Semaphore(10)

    async def process_with_limit(item: TextItem) -> ClassificationResult:
        """Process item with concurrency limit to avoid rate limits."""
        async with semaphore:
            return await process_item(item)

    tasks = [process_with_limit(item) for item in request.batch]

    try:
        results = await asyncio.wait_for(
            asyncio.gather(*tasks, return_exceptions=False),
            timeout=300.0
        )
    except asyncio.TimeoutError:
        raise HTTPException(
            status_code=504,
            detail="Batch processing timed out after 5 minutes"
        )

    # Return complete JSON array. FastAPI automatically serializes the
    # ClassificationResult objects to JSON using Pydantic's serialization.
    return results


@router.get("/batch-text-classification/code")
async def get_batch_text_classification_code():
    """
    Get the source code for the batch-text-classification recipe.

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
