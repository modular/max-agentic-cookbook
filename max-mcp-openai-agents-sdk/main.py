import asyncio
from contextlib import AsyncExitStack
from typing import Optional

from fastmcp import Client
from openai import OpenAI


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
        self.context_mgr = AsyncExitStack()
        self.openai_client = OpenAI(base_url=max_url, api_key="EMPTY")
        self.mcp_client: Optional[Client] = None
        self.tools: Optional[list[dict]] = None

    async def __aenter__(self) -> type:
        try:
            self.mcp_client = Client(self.mcp_url)
            await self.context_mgr.enter_async_context(self.mcp_client)
            self.tools = await self.discover_tools()
            return self
        except Exception as e:
            print(e)

    async def __aexit__(
        self,
        _exc_type: any,
        _exc_val: any,
        _exc_tb: any,
    ):
        await self.context_mgr.aclose()

    async def query(self, query: str) -> Optional[str]:
        try:
            # messages = [
            #     {
            #         "role": "system",
            #         "content": """
            #         Ensure that you review the available tools,
            #         and use them whenever appropriate.""",
            #     }
            # ]
            messages = []
            messages.append({"role": "user", "content": query})
            response = self.openai_client.chat.completions.create(
                model=self.max_model,
                messages=messages,
                tools=self.tools,
            )

            if tool_calls := response.choices[0].message.tool_calls:
                print(f"query - tool called: {tool_calls}")

            return response.choices[0].message.content
        except Exception as e:
            print(f"query failed - {e}")
            return None

    async def discover_tools(self) -> Optional[list[dict]]:
        try:
            mcp_tools = await self.mcp_client.list_tools()
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
            return None


async def main() -> None:
    async with MAXClient("meta-llama/Llama-3.2-1B-Instruct") as client:
        response = await client.query("How many R's are in starwberry?")
        # response = await client.query("What tools are available to you?")
        print(response)


if __name__ == "__main__":
    asyncio.run(main())
