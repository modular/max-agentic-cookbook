import json
from typing import Optional

from fastmcp import Client as MCPClient
from openai import OpenAI

from .models import ChatMessage, ChatSession, ToolCall, CountResult


openai_client = OpenAI(base_url="http://127.0.0.1:8001/v1", api_key="EMPTY")
mcp_client = MCPClient("http://127.0.0.1:8002/mcp")
model = "meta-llama/Llama-3.2-1B-Instruct"


async def run(query: str) -> CountResult:
    try:
        session = await _start_session(query)
        session = await _discover_tools(session)
        session = await _send_message(session)
        session = await _call_tool(session)
        content = session.messages[-1].content
        result = CountResult.model_validate_json(content)
        return result
    except Exception as e:
        raise ValueError(e)


async def _start_session(query: str) -> Optional[ChatSession]:
    try:
        message = ChatMessage(role="user", content=query)
        async with mcp_client:
            session = ChatSession(
                openai_client=openai_client,
                mcp_client=mcp_client,
                model=model,
                messages=[message],
            )
        return session
    except:
        None


async def _discover_tools(session: ChatSession) -> Optional[ChatSession]:
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
            return session

    except:
        return None


async def _send_message(session: ChatSession) -> Optional[ChatSession]:
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

        return session

    except:
        return None


async def _call_tool(session: ChatSession) -> Optional[ChatSession]:
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
            return session

    except:
        return None
