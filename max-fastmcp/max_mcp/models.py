from fastmcp import Client as MCPClient
from openai import OpenAI
from pydantic import BaseModel, Field
from typing import Literal, Optional


class CountRequest(BaseModel):
    query: str


class CountResult(BaseModel):
    character_found: str = Field(description="The character that was counted")
    in_string: str = Field(description="The string that was searched")
    num_times: int = Field(
        description="Number of times the character appears in the string"
    )


class ToolCall(BaseModel):
    name: str
    arguments: Optional[dict] = None


class ChatMessage(BaseModel):
    role: Literal["assistant", "user", "tool"]
    content: Optional[str] = None
    tool_call_id: Optional[str] = None
    tool_call: Optional[ToolCall] = None


class ChatSession(BaseModel):
    openai_client: OpenAI
    mcp_client: MCPClient
    model: str
    messages: Optional[list[ChatMessage]] = None
    tools: Optional[list[dict]] = None

    class Config:
        arbitrary_types_allowed = True
