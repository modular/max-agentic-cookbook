from fastapi import FastAPI, HTTPException

from .agent import run
from .models import CountRequest, CountResult


api = FastAPI()


@api.post("/api/count")
async def handle_count(request: CountRequest) -> CountResult:
    try:
        query = request.query
        result = await run(query)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=e)
    except:
        raise HTTPException(status_code=500)
