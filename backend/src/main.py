"""FastAPI application entry point."""

from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.recipes import endpoints, models

# Load environment variables from .env.local
env_path = Path(__file__).parent.parent / ".env.local"
load_dotenv(dotenv_path=env_path)

app = FastAPI(
    title="MAX Recipes API",
    description="Backend API for MAX Recipes Cookbook",
    version="0.1.0",
)

# Configure CORS for local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",  # Vite dev server
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(endpoints.router)
app.include_router(models.router)


@app.get("/api/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "message": "MAX Recipes API is running",
        "version": "0.1.0",
    }


@app.get("/api/recipes")
async def list_recipes():
    """List available recipes."""
    return {
        "recipes": [
            {
                "id": "multiturn-chat",
                "name": "Multi-turn Chat",
                "description": "Streaming chat interface with conversation context",
            },
            {
                "id": "image-captioning",
                "name": "Image Captioning",
                "description": "Generate captions for uploaded images",
            },
        ]
    }
