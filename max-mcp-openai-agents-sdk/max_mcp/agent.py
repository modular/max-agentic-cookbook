import json
from typing import TypeAlias

from fastmcp import Client as MCPClient
from openai import OpenAI
from returns.result import Result, Success, Failure

from .models import ChatMessage, ChatSession, ToolCall


openai_client = OpenAI(base_url="http://127.0.0.1:8001/v1", api_key="EMPTY")
mcp_client = MCPClient("http://127.0.0.1:8002/mcp")
model = "meta-llama/Llama-3.2-1B-Instruct"

ChatSessionResult: TypeAlias = Result["ChatSession", str]

async def start_session(query: str) -> ChatSessionResult:
    try:
        message = ChatMessage(role="user", content=query)
        async with mcp_client:
            session = ChatSession(
                openai_client=openai_client,
                mcp_client=mcp_client,
                model=model,
                messages=[message],
            )
        return Success(session)
    except Exception as e:
        handle_failure(e, "Starting session")


async def discover_tools(session: ChatSession) -> ChatSessionResult:
    try:
        async with session.mcp_client:
            mcp_tools = await session.mcp_client.list_tools()
            tools = []

            for tool in mcp_tools:
                if (
                    (name := tool.name)
                    and (description := tool.description)
                    and (parameters := tool.inputSchema)
                ):
                    formatted_tool = {
                        "type": "function",
                        "function": {
                            "name": name,
                            "description": description,
                            "parameters": parameters,
                        },
                    }
                    tools.append(formatted_tool)

            session.tools = tools
            return Success(session)

    except Exception as e:
        handle_failure(e, "Discovering tools")


async def send_message(session: ChatSession) -> ChatSessionResult:
    try:
        messages = [
            {"role": m.role, "content": m.content, "tool_call_id": m.tool_call_id}
            for m in session.messages
        ]

        response = session.openai_client.chat.completions.create(
            model=session.model,
            messages=messages,
            tools=session.tools,
        )

        if response := response.choices[0].message:
            message = ChatMessage(role="assistant", content=response.content)

            if (
                response.tool_calls
                and (tool := response.tool_calls[0].function)
                and (tool_call_id := response.tool_calls[0].id)
            ):
                message.tool_call_id = tool_call_id
                arguments = json.loads(tool.arguments)
                message.tool_call = ToolCall(name=tool.name, arguments=arguments)

            session.messages.append(message)

        return Success(session)

    except Exception as e:
        handle_failure(e, "Sending message")


async def call_tool(session: ChatSession) -> ChatSessionResult:
    try:
        async with session.mcp_client:
            last_message = session.messages[-1]
            if (tool_call := last_message.tool_call) and (arguments := tool_call.arguments):
                result = await session.mcp_client.call_tool(tool_call.name, arguments)
                message = ChatMessage(
                    role="tool",
                    tool_call_id=last_message.tool_call_id,
                    content=result[0].text,
                )
                session.messages.append(message)
            return Success(session)

    except Exception as e:
        handle_failure(e, "Calling tool")
    

def handle_failure(exception: Exception, what_failed: str) -> Failure:
    message = f"{what_failed} failed: {exception}"
    print(message)
    return Failure(message)