"""
Code Generation with Kimi K2.5 and DeepSeek V3

This recipe demonstrates an agentic code generation loop via an OpenAI-compatible
endpoint. The model has access to two tools — read_file and run_code — enabling it
to read source files for context and execute the code it writes. This mirrors the
behavior of coding agents like opencode.

Why Kimi K2.5 and DeepSeek V3 specifically:
- Kimi K2.5 uses a Mixture-of-Experts architecture trained with an agentic focus,
  making it well-suited for multi-step reasoning tasks like writing and editing code.
- DeepSeek V3 was trained on a large corpus of code across many languages, giving it
  strong code completion and generation capabilities out of the box.
Both models differ meaningfully from general-purpose chat models and are the right
starting point for code generation use cases.

Key features:
- Agentic loop: model can call tools across multiple turns before finishing
- read_file: reads source files relative to CWD (path traversal protected)
- run_code: executes Python snippets via subprocess with a 10s timeout
- Custom SSE events: tool-call and tool-result events surface tool use to the frontend
- System prompt configuration: tune language, style, and context awareness

Architecture:
- Agentic loop: repeats model call until finish_reason == "stop"
- Tool call accumulation: chunks are collected then dispatched once complete
- Custom SSE events: text-delta, tool-call, tool-result, finish, error
"""

import json
import os
import subprocess
import tempfile
import uuid
from pathlib import Path
from typing import Any

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse, Response
from openai import AsyncOpenAI
from pydantic import BaseModel

from ..core.endpoints import get_cached_endpoint
from ..core.code_reader import read_source_file

router = APIRouter(prefix="/api/recipes", tags=["recipes"])


# ============================================================================
# Tool definitions
# ============================================================================

TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "read_file",
            "description": (
                "Read a file from the local filesystem. "
                "Path must be relative and within the current working directory."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "path": {"type": "string", "description": "Relative file path"}
                },
                "required": ["path"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "run_code",
            "description": "Execute a Python code snippet. Returns stdout and stderr.",
            "parameters": {
                "type": "object",
                "properties": {
                    "code": {"type": "string", "description": "Python code to execute"}
                },
                "required": ["code"],
            },
        },
    },
]


# ============================================================================
# Tool implementations
# ============================================================================

def execute_read_file(path: str) -> str:
    """
    Read a file relative to CWD. Rejects paths that escape CWD.
    Returns file contents or a descriptive error string.
    """
    try:
        cwd = Path.cwd().resolve()
        target = (cwd / path).resolve()
        if not str(target).startswith(str(cwd)):
            return f"Error: path '{path}' is outside the working directory."
        if not target.exists():
            return f"Error: file '{path}' does not exist."
        if not target.is_file():
            return f"Error: '{path}' is not a file."
        return target.read_text(encoding="utf-8", errors="replace")
    except Exception as e:
        return f"Error reading file: {e}"


def execute_run_code(code: str) -> str:
    """
    Execute Python code in a temp directory with a 10-second timeout.
    Returns combined stdout and stderr, truncated to 4000 characters.
    """
    try:
        with tempfile.TemporaryDirectory() as tmp_dir:
            script = Path(tmp_dir) / "script.py"
            script.write_text(code, encoding="utf-8")
            result = subprocess.run(
                ["python3", str(script)],
                capture_output=True,
                text=True,
                timeout=10,
                cwd=tmp_dir,
            )
            output = result.stdout + result.stderr
            if len(output) > 4000:
                output = output[:4000] + "\n... (truncated)"
            return output or "(no output)"
    except subprocess.TimeoutExpired:
        return "Error: execution timed out after 10 seconds."
    except Exception as e:
        return f"Error running code: {e}"


def dispatch_tool(name: str, args: dict[str, Any]) -> str:
    if name == "read_file":
        return execute_read_file(args.get("path", ""))
    if name == "run_code":
        return execute_run_code(args.get("code", ""))
    return f"Error: unknown tool '{name}'"


# ============================================================================
# Types and Models
# ============================================================================

class UIMessagePart(BaseModel):
    type: str
    text: str | None = None


class UIMessage(BaseModel):
    id: str
    role: str
    parts: list[UIMessagePart]


class CodeGenRequest(BaseModel):
    """
    Request body for code generation.

    Includes a systemPrompt prepended to the message list, giving the
    developer direct control over the model's coding style and context awareness.
    """
    endpointId: str
    modelName: str
    systemPrompt: str
    messages: list[UIMessage]


# ============================================================================
# Helper Functions
# ============================================================================

def convert_ui_messages_to_openai(messages: list[UIMessage]) -> list[dict[str, Any]]:
    openai_messages = []
    for msg in messages:
        text_parts = [part.text for part in msg.parts if part.type == "text" and part.text]
        content = " ".join(text_parts) if text_parts else ""
        openai_messages.append({"role": msg.role, "content": content})
    return openai_messages


# ============================================================================
# API Endpoints
# ============================================================================

@router.post("/code-generation")
async def code_generation(request: CodeGenRequest):
    """
    Agentic code generation endpoint with SSE streaming.

    Runs a tool-calling loop: the model may call read_file or run_code before
    producing its final response. Each tool call and result is emitted as a
    custom SSE event so the frontend can surface it distinctly.

    Custom SSE event types (in addition to the standard text-delta / finish):
    - tool-call:   {"type": "tool-call", "toolCallId", "toolName", "args"}
    - tool-result: {"type": "tool-result", "toolCallId", "toolName", "result"}
    """
    endpoint = get_cached_endpoint(request.endpointId)
    if not endpoint:
        raise HTTPException(status_code=400, detail=f"Endpoint not found: {request.endpointId}")

    base_url = endpoint.get("baseUrl")
    api_key = endpoint.get("apiKey")

    if not base_url or not api_key:
        raise HTTPException(status_code=500, detail="Invalid endpoint configuration: missing baseUrl or apiKey")

    async def generate_sse_stream():
        try:
            client = AsyncOpenAI(base_url=base_url, api_key=api_key)

            messages: list[dict[str, Any]] = [
                {"role": "system", "content": request.systemPrompt},
                *convert_ui_messages_to_openai(request.messages),
            ]

            message_id = f"msg-{uuid.uuid4().hex[:8]}"
            text_id = f"text-{uuid.uuid4().hex[:8]}"

            yield f'data: {json.dumps({"type": "start", "messageId": message_id})}\n\n'
            yield f'data: {json.dumps({"type": "text-start", "id": text_id})}\n\n'

            # Agentic loop: repeat until the model stops calling tools.
            while True:
                stream = await client.chat.completions.create(
                    model=request.modelName,
                    messages=messages,
                    tools=TOOLS,
                    stream=True,
                )

                # Accumulate the full assistant turn as we stream it.
                finish_reason = None
                assistant_content = ""
                # tool_calls_acc: {index: {id, name, arguments_str}}
                tool_calls_acc: dict[int, dict[str, Any]] = {}

                async for chunk in stream:
                    choice = chunk.choices[0] if chunk.choices else None
                    if not choice:
                        continue

                    finish_reason = choice.finish_reason or finish_reason
                    delta = choice.delta

                    # Stream text tokens as they arrive.
                    if delta.content:
                        assistant_content += delta.content
                        yield f'data: {json.dumps({"type": "text-delta", "id": text_id, "delta": delta.content})}\n\n'

                    # Accumulate tool call chunks (arguments arrive piecemeal).
                    if delta.tool_calls:
                        for tc in delta.tool_calls:
                            idx = tc.index
                            if idx not in tool_calls_acc:
                                tool_calls_acc[idx] = {"id": "", "name": "", "arguments": ""}
                            if tc.id:
                                tool_calls_acc[idx]["id"] = tc.id
                            if tc.function and tc.function.name:
                                tool_calls_acc[idx]["name"] = tc.function.name
                            if tc.function and tc.function.arguments:
                                tool_calls_acc[idx]["arguments"] += tc.function.arguments

                if finish_reason == "tool_calls":
                    # Append the assistant turn (with tool_calls) to the conversation.
                    openai_tool_calls = [
                        {
                            "id": tc["id"],
                            "type": "function",
                            "function": {"name": tc["name"], "arguments": tc["arguments"]},
                        }
                        for tc in tool_calls_acc.values()
                    ]
                    messages.append({
                        "role": "assistant",
                        "content": assistant_content or None,
                        "tool_calls": openai_tool_calls,
                    })

                    # Execute each tool and feed results back.
                    for tc in tool_calls_acc.values():
                        try:
                            args = json.loads(tc["arguments"])
                        except json.JSONDecodeError:
                            args = {}

                        yield f'data: {json.dumps({"type": "tool-call", "toolCallId": tc["id"], "toolName": tc["name"], "args": args})}\n\n'

                        result = dispatch_tool(tc["name"], args)

                        yield f'data: {json.dumps({"type": "tool-result", "toolCallId": tc["id"], "toolName": tc["name"], "result": result})}\n\n'

                        messages.append({
                            "role": "tool",
                            "tool_call_id": tc["id"],
                            "content": result,
                        })

                    # Continue the loop so the model can respond with tool results in context.
                    continue

                # finish_reason == "stop" (or anything else): done.
                break

            yield f'data: {json.dumps({"type": "text-end", "id": text_id})}\n\n'
            yield f'data: {json.dumps({"type": "finish"})}\n\n'
            yield f'data: [DONE]\n\n'

        except Exception as error:
            error_message = str(error) if error else "Unknown error"
            yield f'data: {json.dumps({"type": "error", "error": error_message})}\n\n'

    return StreamingResponse(
        generate_sse_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Vercel-AI-UI-Message-Stream": "v1",
        },
    )


@router.get("/code-generation/code")
async def get_code_generation_code():
    """Get the source code for the code-generation recipe as plain text."""
    try:
        code_data = read_source_file(__file__)
        return Response(content=code_data, media_type="text/plain")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error reading source code: {str(e)}")
