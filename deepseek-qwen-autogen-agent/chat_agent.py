import os
import asyncio
import requests
from tenacity import retry, stop_after_attempt, wait_fixed, retry_if_exception_type, retry_if_result
from autogen_agentchat.agents import AssistantAgent
from autogen_ext.models.openai import OpenAIChatCompletionClient
from autogen_agentchat.messages import TextMessage
from autogen_core import CancellationToken
from rich.console import Console
from rich.panel import Panel
from rich.prompt import Prompt
from rich.markdown import Markdown

from utils import patch_openai_client_usage_tracking

patch_openai_client_usage_tracking()

LLM_SERVER_URL = os.getenv("LLM_SERVER_URL", "http://localhost:8010/v1")
LLM_API_KEY = os.getenv("LLM_API_KEY", "local")


def wait_for_healthy(base_url: str):
    @retry(
        stop=stop_after_attempt(20),
        wait=wait_fixed(60),
        retry=(
            retry_if_exception_type(requests.RequestException)
            | retry_if_result(lambda response: response.status_code != 200)
        ),
        before_sleep=lambda retry_state: print(
            f"Waiting for server at {base_url} to start (attempt {retry_state.attempt_number}/20)..."
        ),
    )
    def _check_health():
        return requests.get(f"{base_url}/health", timeout=5)

    return _check_health()

async def main() -> None:
    # Wait for server to be healthy before starting
    wait_for_healthy(LLM_SERVER_URL)

    console = Console()

    # Clear screen and add more visible welcome banner
    console.clear()
    console.print("\n" * 2)
    console.print(Panel.fit(
        "🤖 Welcome to the AI Chat!\n\n" +
        "[bold yellow]Type your message below[/bold yellow]\n" +
        "[dim]Type 'exit' to leave[/dim]",
        border_style="blue",
        padding=(1,2),
        title="[bold blue]AI Assistant[/bold blue]"
    ))

    client = OpenAIChatCompletionClient(
        model="deepseek-ai/DeepSeek-R1-Distill-Qwen-7B",
        base_url=LLM_SERVER_URL,
        api_key=LLM_API_KEY,
        model_info={
            "name": "deepseek-ai/DeepSeek-R1-Distill-Qwen-7B",
            "family": "deepseek",
            "pricing": {"prompt": 0.0, "completion": 0.0},
            "function_calling": False,
            "vision": False,
            "json_output": False,
        },
        temperature=0.7,
        max_tokens=4096,
    )

    assistant = AssistantAgent(
        name="assistant",
        model_client=client,
        system_message="You are a helpful assistant.",
    )

    conversation_history = []

    while True:
        user_input = Prompt.ask("\n[bold blue]You[/bold blue]")
        if user_input.strip().lower() == "exit":
            console.print("\n[bold red]Goodbye![/bold red]")
            break

        conversation_history.append(TextMessage(content=user_input, source="user"))
        with console.status("[bold green]AI is thinking...[/bold green]"):
            response = await assistant.on_messages(
                conversation_history,  # Pass entire history
                CancellationToken(),
            )

        conversation_history.append(response.chat_message)
        content = response.chat_message.content
        parts = content.split('</think>')
        if len(parts) > 1:
            thinking = parts[0].strip()
            final_answer = parts[1].strip()
        else:
            thinking = "No explicit thinking process shown"
            final_answer = content.strip()

        console.print(Panel(
            Markdown(thinking),
            border_style="yellow",
            title="[bold]💭 Thinking Process[/bold]",
            title_align="left"
        ))

        console.print(Panel(
            Markdown(final_answer),
            border_style="green",
            title="[bold]🤖 Response[/bold]",
            title_align="left"
        ))


if __name__ == "__main__":
    asyncio.run(main())
