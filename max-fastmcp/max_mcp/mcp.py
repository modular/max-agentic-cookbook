from fastapi import Request, Response
from fastmcp import FastMCP
from pydantic import Field
from typing import Annotated

from .models import CountResult

mcp = FastMCP("Demo MCP Server")


@mcp.tool()
def count_characters(
    character: Annotated[
        str, Field(description="Character to count the occurrences of")
    ],
    string: Annotated[
        str, Field(description="String within which to search for the character")
    ],
) -> CountResult:
    """Counts the occurrences of a character within a string"""
    count = string.lower().count(character.lower())

    return CountResult(character_found=character, in_string=string, num_times=count)


@mcp.custom_route("/health", methods=["GET"])
async def health_check(_request: Request) -> Response:
    return Response()
