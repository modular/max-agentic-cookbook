import asyncio
import json
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
    role: Union[Literal["assistant", "user", "tool"]]
    content: Optional[str] = None
    tool_call_id: Optional[str] = None
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


async def call_tool(session: ChatSession) -> ChatSession:
    try:
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

    except Exception as e:
        print(f"call_tool failed - {e}")
        raise e


async def send_message(session: ChatSession) -> ChatSession:
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

            # TODO: Support more than one tool call
            if (tool := response.tool_calls[0].function) and (
                tool_call_id := response.tool_calls[0].id
            ):
                message.tool_call_id = tool_call_id
                arguments = json.loads(tool.arguments)
                message.tool_call = ToolCall(tool.name, arguments)

            session.messages.append(message)

        return session

    except Exception as e:
        print(f"send_message failed - {e}")
        raise e


async def main():
    initial_query = "How many L's are in Elliot?"

    session = ChatSession(
        openai_client=OpenAI(base_url="http://127.0.0.1:8000/v1", api_key="EMPTY"),
        mcp_client=MCPClient("http://127.0.0.1:8001/mcp"),
        model="meta-llama/Llama-3.2-1B-Instruct",
        messages=[ChatMessage(role="user", content=initial_query)],
    )

    try:
        async with session.mcp_client:
            # NOTE: For clarity, we are not implementing a full chat loop,
            #   so send_message only handles a single tool call,
            #   and we simply display the tool call result.

            print(initial_query)

            session = await discover_tools(session)
            session = await send_message(session)
            response = session.messages[-1]

            if response.tool_call is not None:
                session = await call_tool(session)
                response = session.messages[-1]

            print(response.content)

    except:
        sys.exit(1)

    finally:
        sys.exit(0)


if __name__ == "__main__":
    asyncio.run(main())
