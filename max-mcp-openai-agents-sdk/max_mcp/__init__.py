from fastapi import FastAPI, HTTPException
from returns.result import Success, Failure

from .agent import (
    start_session,
    discover_tools,
    send_message,
    call_tool,
)
from .models import CountRequest, CountResult


app = FastAPI()


@app.post("/count")
async def count_api(request: CountRequest) -> CountResult:
    match await start_session(request.query):
        case Success(value):
            session = value
        case Failure(error):
            raise HTTPException(status_code=400, detail=error)

    match await discover_tools(session):
        case Success(value):
            session = value
        case Failure(error):
            raise HTTPException(status_code=400, detail=error)

    match await send_message(session):
        case Success(value):
            session = value
        case Failure(error):
            raise HTTPException(status_code=400, detail=error)

    match await call_tool(session):
        case Success(value):
            session = value
        case Failure(error):
            raise HTTPException(status_code=400, detail=error)

    try:
        last_message = session.messages[-1]
        response = CountResult.model_validate_json(last_message.content)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"/count failed: {e}")

    return response
