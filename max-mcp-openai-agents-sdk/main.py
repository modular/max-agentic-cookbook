import asyncio
import sys
from dataclasses import dataclass
from typing import Literal, Optional, Union

from fastmcp import Client as MCPClient
from openai import OpenAI


@dataclass
class ToolCall:
    name: str
    arguments: Optional[dict]


@dataclass
class ChatMessage:
    role: Union[Literal["assistant", "user"]]
    content: Optional[str] = None
    tool_call: Optional[ToolCall] = None


@dataclass
class ChatSession:
    openai_client: OpenAI
    mcp_client: MCPClient
    model: str
    messages: list[ChatMessage]
    tools: Optional[list[dict]] = None


async def discover_tools(session: ChatSession) -> ChatSession:
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
        print(f"discover_tools failed - {e}")
        raise e


async def send_message(session: ChatSession) -> ChatSession:
    try:
        messages = [{"role": m.role, "content": m.content} for m in session.messages]

        response = session.openai_client.chat.completions.create(
            model=session.model,
            messages=messages,
            tools=session.tools,
        )

        if response := response.choices[0].message:
            message = ChatMessage("assistant", response.content)

            # NOTE: This only handles a single tool call in the response
            if tool := response.tool_calls[0].function:
                message.tool_call = ToolCall(tool.name, tool.arguments)

            session.messages.append(message)

        return session

    except Exception as e:
        print(f"send_message failed - {e}")
        raise e


async def main() -> None:
    initial_query = "How many R's are in starwberry?"

    session = ChatSession(
        openai_client=OpenAI(base_url="http://127.0.0.1:8000/v1", api_key="EMPTY"),
        mcp_client=MCPClient("http://127.0.0.1:8001/mcp"),
        model="meta-llama/Llama-3.2-1B-Instruct",
        messages=[ChatMessage(role="user", content=initial_query)],
    )

    try:
        async with session.mcp_client:
            session = await discover_tools(session)
            session = await send_message(session)
            last_message = session.messages.pop()
            print(last_message)
    except:
        sys.exit(1)
    finally:
        sys.exit(0)


if __name__ == "__main__":
    asyncio.run(main())
