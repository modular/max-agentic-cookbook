import os

from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware

from .agent import process_query
from .models import CountRequest, CountResult


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify exact origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.post("/api/count")
async def handle_count(request: CountRequest) -> CountResult:
    try:
        query = request.query
        result = await process_query(query)
        return result

    except ValueError as e:
        raise HTTPException(status_code=400, detail=e)

    except:
        raise HTTPException(status_code=500)


static_path = os.path.join(os.path.dirname(__file__), "static")
app.mount("/", StaticFiles(directory=static_path, html=True), name="static")
