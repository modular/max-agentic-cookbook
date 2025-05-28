import json
import inspect
from typing import Union

from fastmcp import Client as MCPClient
from openai import OpenAI

from .models import ChatMessage, ChatSession, ToolCall, CountResult


MODEL_NAME = "meta-llama/Llama-3.2-1B-Instruct"


async def process_query(query: str) -> CountResult:
    openai_client = OpenAI(base_url="http://127.0.0.1:8001/v1", api_key="EMPTY")
    mcp_client = MCPClient("http://127.0.0.1:8002/mcp")

    try:
        async with mcp_client:
            session = await _init_session(query, openai_client, mcp_client)
            session = await _discover_tools(session)
            session = await _send_message(session)
            session = await _call_tool(session)

            if (session.messages is not None) and (
                content := session.messages[-1].content
            ):
                result = CountResult.model_validate_json(content)
                return result
            else:
                raise _exception("Unexpected message contents")

    except Exception as e:
        raise _exception(e)


async def _init_session(
    query: str, openai_client: OpenAI, mcp_client: MCPClient
) -> ChatSession:
    try:
        message = ChatMessage(role="user", content=query)
        session = ChatSession(
            openai_client=openai_client,
            mcp_client=mcp_client,
            model=MODEL_NAME,
            messages=[message],
        )
        return session

    except Exception as e:
        raise _exception(e)


async def _discover_tools(session: ChatSession) -> ChatSession:
    try:
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

    except Exception as e:
        raise _exception(e)


async def _send_message(session: ChatSession) -> ChatSession:
    if session.messages is None:
        raise _exception("Session contains no messages")

    messages = [
        {"role": m.role, "content": m.content, "tool_call_id": m.tool_call_id}
        for m in session.messages
    ]

    try:
        response = session.openai_client.chat.completions.create(
            model=session.model,
            messages=messages,  # type: ignore
            tools=session.tools,  # type: ignore
        )

    except Exception as e:
        raise _exception("OpenAI client:", e)

    try:
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

    except Exception as e:
        raise _exception("Processing response:", e)


async def _call_tool(session: ChatSession) -> ChatSession:
    if session.messages is None:
        raise _exception("Session contains no messages")

    try:
        last_message = session.messages[-1]
        if (tool_call := last_message.tool_call) and (arguments := tool_call.arguments):
            result = await session.mcp_client.call_tool(tool_call.name, arguments)
            message = ChatMessage(
                role="tool",
                tool_call_id=last_message.tool_call_id,
                content=result[0].text,  # type: ignore
            )
            session.messages.append(message)
            return session

    except Exception as e:
        raise _exception(e)

    return session


def _exception(*note: Union[str, Exception]) -> ValueError:
    frame = inspect.currentframe()
    header = "[max-fastmcp"
    header += f" {frame.f_back.f_code.co_name}]" if (frame and frame.f_back) else "]"
    components = [header]
    notes = " ".join(repr(n) for n in note if n is not None)
    components.append(notes)
    message = " ".join(components).strip()
    print(message)
    return ValueError(message)
