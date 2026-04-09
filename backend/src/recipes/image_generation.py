"""
Image Generation with Text-to-Image Diffusion Models

This recipe demonstrates how to generate images from text prompts using
OpenAI-compatible endpoints with Modular MAX's FLUX.2 diffusion models.
Users provide a text description and optional generation parameters, and
receive a generated image with performance metrics.

Key features:
- Text-to-image generation: Create images from natural language descriptions
- Configurable parameters: Resolution, inference steps, guidance scale
- Performance metrics: Total generation duration tracking
- Negative prompts: Specify content to avoid in generated images
- OpenAI-compatible: Works with any endpoint supporting the images API

Architecture:
- FastAPI endpoint: Receives generation requests with prompt and parameters
- AsyncOpenAI client: Handles image generation via client.images.generate()
- MAX-specific parameters: Passed via extra_body for steps, guidance_scale
- Performance tracking: Measures total generation time in milliseconds

Request Format:
- endpointId: Which LLM endpoint to use
- modelName: Which model to use (e.g., "flux2-dev-fp4")
- prompt: Text description of the image to generate
- width/height: Output image dimensions (default 1024x1024)
- steps: Number of denoising iterations (default 28)
- guidance_scale: Prompt adherence strength (default 3.5)
- negative_prompt: Content to avoid in the generated image

Response Format:
- JSON object with base64-encoded image data and generation metrics
- Fields: image_b64, width, height, duration
"""

import time

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


class ImageGenerationRequest(BaseModel):
    """
    Request body for image generation.

    The frontend sends the endpoint ID, model name, a text prompt, and
    optional generation parameters. The backend looks up the actual API
    credentials from the endpoint ID and generates the image.
    """
    endpointId: str
    modelName: str
    prompt: str
    width: int = 1024
    height: int = 1024
    steps: int = 28
    guidance_scale: float = 3.5
    negative_prompt: str = ""


class ImageGenerationResult(BaseModel):
    """
    Result of generating an image from a text prompt.

    Contains the base64-encoded image data along with the dimensions
    and performance metrics (duration in milliseconds).
    """
    image_b64: str
    width: int
    height: int
    duration: int


# ============================================================================
# API Endpoints
# ============================================================================


@router.post("/image-generation")
async def image_generation(request: ImageGenerationRequest) -> ImageGenerationResult:
    """
    Image generation endpoint using OpenAI-compatible images API.

    Accepts a text prompt and generation parameters, then returns a
    base64-encoded image along with performance metrics.

    The endpoint uses client.images.generate() from the OpenAI SDK,
    which maps to the /v1/images/generations API. MAX-specific parameters
    like steps and guidance_scale are passed via extra_body.

    Args:
        request: ImageGenerationRequest with prompt and generation parameters

    Returns:
        ImageGenerationResult with base64 image data, dimensions, and duration

    Raises:
        HTTPException: If endpoint not found, invalid configuration, or
            upstream API failure
    """
    # Get endpoint configuration from cache. The endpoint ID comes from the
    # frontend and maps to a full endpoint configuration (baseUrl, apiKey)
    # stored in .env.local. This keeps API keys secure on the server side.
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

    # Build extra_body with MAX-specific generation parameters.
    # The OpenAI SDK's images.generate() doesn't natively support parameters
    # like steps and guidance_scale, so we pass them via extra_body which
    # forwards them in the request body to the MAX endpoint.
    extra_body: dict = {
        "steps": request.steps,
        "guidance_scale": request.guidance_scale,
    }
    if request.negative_prompt:
        extra_body["negative_prompt"] = request.negative_prompt

    try:
        # Start timing for duration measurement
        start_time = time.time()

        # Call the OpenAI-compatible images API. The response_format="b64_json"
        # tells the endpoint to return the image as base64-encoded data rather
        # than a URL. The size parameter uses "WxH" format.
        response = await client.images.generate(
            model=request.modelName,
            prompt=request.prompt,
            n=1,
            size=f"{request.width}x{request.height}",
            response_format="b64_json",
            extra_body=extra_body,
        )

        # Calculate total generation duration in milliseconds
        duration_ms = int((time.time() - start_time) * 1000)

        # Extract base64 image data from the response.
        # The images API returns a list of generated images; we take the first.
        if not response.data or not response.data[0].b64_json:
            raise HTTPException(
                status_code=502,
                detail="No image data in response from upstream endpoint"
            )

        image_b64 = response.data[0].b64_json

        return ImageGenerationResult(
            image_b64=image_b64,
            width=request.width,
            height=request.height,
            duration=duration_ms,
        )

    except HTTPException:
        # Re-raise our own HTTP exceptions (like the empty response check above)
        raise
    except Exception as error:
        # Catch upstream API errors (connection failures, rate limits, etc.)
        # and return a 502 to indicate the upstream service failed.
        raise HTTPException(
            status_code=502,
            detail=f"Image generation failed: {str(error)}"
        )


@router.get("/image-generation/code")
async def get_image_generation_code():
    """
    Get the source code for the image generation recipe.

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
