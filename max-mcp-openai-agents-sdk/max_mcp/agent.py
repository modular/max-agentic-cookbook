import json
from .models import ChatMessage, ChatSession, ToolCall


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
            if (
                response.tool_calls
                and (tool := response.tool_calls[0].function)
                and (tool_call_id := response.tool_calls[0].id)
            ):
                message.tool_call_id = tool_call_id
                arguments = json.loads(tool.arguments)
                message.tool_call = ToolCall(name=tool.name, arguments=arguments)

            session.messages.append(message)

        return session

    except Exception as e:
        print(f"send_message failed - {e}")
        raise e
