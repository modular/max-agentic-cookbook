from fastmcp import Client as MCPClient
from openai import OpenAI
from pydantic import BaseModel
from typing import Literal, Optional


class CountRequest(BaseModel):
    query: str


class CountResult(BaseModel):
    char_found: str
    in_string: str
    num_times: int


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
