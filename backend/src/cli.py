"""Command-line interface for development server."""

import uvicorn


def dev() -> None:
    """Run development server with hot reload on port 8010."""
    uvicorn.run(
        "src.main:app",
        host="0.0.0.0",
        port=8010,
        reload=True,
        log_level="info",
    )
