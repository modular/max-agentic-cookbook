from fastapi import FastAPI, HTTPException
from fastmcp import Client as MCPClient
from openai import OpenAI

from .agent import (
    ChatMessage,
    ChatSession,
    discover_tools,
    send_message,
    call_tool,
)
from .models import CountRequest, CountResult

openai_client = OpenAI(base_url="http://127.0.0.1:8001/v1", api_key="EMPTY")
mcp_client = MCPClient("http://127.0.0.1:8002/mcp")
model = "meta-llama/Llama-3.2-1B-Instruct"

app = FastAPI()


@app.post("/count")
async def handle_count(request: CountRequest) -> CountResult:
    message = ChatMessage(role="user", content=request.query)
    try:
        async with mcp_client:
            session = ChatSession(
                openai_client=openai_client,
                mcp_client=mcp_client,
                model=model,
                messages=[message],
            )

            session = await discover_tools(session)
            session = await send_message(session)
            response_message = session.messages[-1]

            if response_message.tool_call is not None:
                session = await call_tool(session)
                response_message = session.messages[-1]

            return response_message.content

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
