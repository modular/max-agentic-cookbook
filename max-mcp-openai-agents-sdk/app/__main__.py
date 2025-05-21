import asyncio
import sys

from . import ChatMessage, ChatSession, discover_tools, send_message, call_tool
from openai import OpenAI
from fastmcp import Client as MCPClient


async def main():
    initial_query = "How many L's are in Elliot?"

    session = ChatSession(
        openai_client=OpenAI(base_url="http://127.0.0.1:8001/v1", api_key="EMPTY"),
        mcp_client=MCPClient("http://127.0.0.1:8002/mcp"),
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
