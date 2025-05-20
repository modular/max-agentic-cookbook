import asyncio
from dataclasses import dataclass
import sys
from typing import Literal, Optional, Union

from fastmcp import Client as MCPClient
from openai import OpenAI
from openai.types import Function


@dataclass
class ChatMessage:
    role: Union[Literal["assistant", "user"]]
    content: Optional[str]
    tool_call: Optional[Function]


@dataclass
class ChatHistory:
    messages: list[ChatMessage]


@dataclass
class ChatSession:
    openai_client: OpenAI
    model: str
    tools: Optional[list[dict]]
    chat_history: Optional[ChatHistory]


async def discover_tools(mcp_client: MCPClient) -> list[dict]:
    try:
        mcp_tools = await mcp_client.list_tools()
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
        return tools
    except Exception as e:
        print(f"discover_tools failed - {e}")
        raise e


async def send_message(
    openai_client: OpenAI, model_name: str, query: str, tools: list[dict]
) -> str:
    try:
        messages = []
        messages.append({"role": "user", "content": query})
        response = openai_client.chat.completions.create(
            model=model_name,
            messages=messages,
            tools=tools,
        )

        if tool_calls := response.choices[0].message.tool_calls:
            print(f"query - tool called: {tool_calls}")

        return response.choices[0].message.content
    except Exception as e:
        print(f"query failed - {e}")
        raise e


async def main() -> None:
    openai_client = OpenAI(base_url="http://127.0.0.1:8000/v1", api_key="EMPTY")
    mcp_client = MCPClient("http://127.0.0.1:8001/mcp")

    model_name = "meta-llama/Llama-3.2-1B-Instruct"

    try:
        async with mcp_client:
            tools = await discover_tools(mcp_client)
            response = await send_message(
                openai_client, model_name, "How many R's are in starwberry?", tools
            )
            print(response)
    except:
        sys.exit(1)
    finally:
        sys.exit(0)


if __name__ == "__main__":
    asyncio.run(main())
