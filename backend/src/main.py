"""FastAPI application entry point."""

from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from src.core import endpoints, models
from src.recipes import image_captioning, multiturn_chat

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
app.include_router(multiturn_chat.router)
app.include_router(image_captioning.router)


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
    """
    List available recipes by discovering registered routes.

    Returns an array of recipe slugs based on routes matching /api/recipes/{slug}.
    Frontend owns the full metadata (title, description) for each recipe.
    """
    recipe_slugs = []

    # Inspect registered routes to find recipe endpoints
    for route in app.routes:
        if hasattr(route, "path"):
            path = route.path
            # Match routes like /api/recipes/multiturn-chat
            if path.startswith("/api/recipes/") and path != "/api/recipes":
                slug = path.replace("/api/recipes/", "")
                if slug not in recipe_slugs:
                    recipe_slugs.append(slug)

    return recipe_slugs


# Serve static files (frontend build output)
static_dir = Path(__file__).parent.parent / "static"
if static_dir.exists():
    app.mount("/", StaticFiles(directory=str(static_dir), html=True), name="static")
else:
    # Development mode: static files not built yet
    @app.get("/")
    async def dev_root():
        """Development mode placeholder."""
        return {
            "message": "Frontend not built. Run 'npm run build' in frontend directory.",
            "static_dir": str(static_dir),
        }
