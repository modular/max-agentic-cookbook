import asyncio
from contextlib import AsyncExitStack
from fastmcp import Client
from openai import OpenAI
from typing import Optional


class MAXClient:
    def __init__(
        self,
        max_model: str,
        max_url: str = "http://127.0.0.1:8000/v1",
        mcp_url: str = "http://127.0.0.1:8001/mcp",
    ):
        self.max_model = max_model
        self.max_url = max_url
        self.mcp_url = mcp_url
        self.context = AsyncExitStack()
        self.openai_client = OpenAI(base_url=max_url, api_key="EMPTY")
        self.mcp_client: Optional[Client] = None

    async def __aenter__(self) -> type:
        self.mcp_client = Client(self.mcp_url)
        await self.context.enter_async_context(self.mcp_client)
        return self

    async def __aexit__(
        self,
        _exc_type: any,
        _exc_val: any,
        _exc_tb: any,
    ):
        await self.context.aclose()

    async def process_basic_query(self, query: str) -> Optional[str]:
        try:
            messages = [{"role": "user", "content": query}]
            response = self.openai_client.chat.completions.create(
                model=self.max_model, messages=messages
            )
            return response.choices[0].message.content
        except:
            return None

    async def discover_tools(self) -> Optional[list[str]]:
        try:
            mcp_tools = await self.mcp_client.list_tools()
            return [f"{tool.name}: {tool.description}" for tool in mcp_tools]
        except:
            return None


async def main() -> None:
    async with MAXClient("SmolLM2-1.7B-Instruct") as client:
        tools = await client.discover_tools()
        print(tools)


if __name__ == "__main__":
    asyncio.run(main())
