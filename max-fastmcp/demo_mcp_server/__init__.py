from fastapi import Request, Response
from fastmcp import FastMCP
from pydantic import BaseModel, Field
from typing import Annotated

mcp = FastMCP("Demo MCP Server")


class ToolResponse(BaseModel):
    character_found: str = Field(description="The character that was counted")
    in_string: str = Field(description="The string that was searched")
    num_times: int = Field(
        description="Number of times the character appears in the string"
    )


@mcp.tool()
def count_characters(
    character: Annotated[
        str, Field(description="Character to count the occurrences of")
    ],
    string: Annotated[
        str, Field(description="String within which to search for the character")
    ],
) -> ToolResponse:
    """Counts the occurrences of a character within a string"""
    count = string.lower().count(character.lower())

    return ToolResponse(character_found=character, in_string=string, num_times=count)


@mcp.custom_route("/health", methods=["GET"])
async def health_check(_request: Request) -> Response:
    return Response()


def main():
    host = os.getenv("MCP_HOST", "0.0.0.0")
    port = int(os.getenv("MCP_PORT", 8002))

    mcp.run(
        transport="streamable-http",
        host=host,
        port=port,
        log_level="debug",
    )


if __name__ == "__main__":
    import os
    from dotenv import load_dotenv

    load_dotenv()
    main()
