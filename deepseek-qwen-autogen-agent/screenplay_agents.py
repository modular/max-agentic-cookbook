import os
import asyncio
import requests
from tenacity import retry, stop_after_attempt, wait_fixed, retry_if_exception_type, retry_if_result
from autogen_agentchat.agents import AssistantAgent
from autogen_ext.models.openai import OpenAIChatCompletionClient
from autogen_agentchat.messages import TextMessage
from autogen_agentchat.teams import RoundRobinGroupChat
from rich.console import Console
from rich.panel import Panel
from rich.prompt import Prompt
from rich.markdown import Markdown

from utils import patch_openai_client_usage_tracking

patch_openai_client_usage_tracking()

LLM_SERVER_URL = os.getenv("LLM_SERVER_URL", "http://localhost:8010/v1")
LLM_HEALTH_URL = os.getenv("LLM_HEALTH_URL", "http://localhost:8010/v1/health")
LLM_API_KEY = os.getenv("LLM_API_KEY", "local")

def wait_for_healthy(health_url: str):
    @retry(
        stop=stop_after_attempt(20),
        wait=wait_fixed(60),
        retry=(
            retry_if_exception_type(requests.RequestException)
            | retry_if_result(lambda response: response.status_code != 200)
        ),
        before_sleep=lambda retry_state: print(
            f"Waiting for server at {health_url} to start (attempt {retry_state.attempt_number}/20)..."
        ),
    )
    def _check_health():
        return requests.get(health_url, timeout=5)

    return _check_health()

async def main() -> None:
    # Wait for server to be healthy before starting
    wait_for_healthy(LLM_HEALTH_URL)

    console = Console()
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

    screenwriter = AssistantAgent(
        name="screenwriter",
        system_message="""You are an experienced screenwriter who creates engaging movie scenes and dialogue.
First think about the scene carefully. Consider:
- Setting and atmosphere
- Character development
- Plot progression
Then write a brief but vivid scene with clear stage directions and dialogue.""",
        model_client=client,
    )

    story_critic = AssistantAgent(
        name="story_critic",
        system_message="""You are a story development expert. Review the screenwriter's scene and think about:
- Plot coherence and dramatic tension
- Character motivations and arcs
- Theme development
Then provide:
1. An improved version of the scene
2. A list of specific improvements made and why they work better""",
        model_client=client,
    )

    dialogue_expert = AssistantAgent(
        name="dialogue_expert",
        system_message="""You are a dialogue specialist. Review both the original and improved scenes, then think about:
- Character voice authenticity
- Subtext and emotional depth
- Natural flow and rhythm
Then provide:
1. A final version with enhanced dialogue
2. A list of specific dialogue improvements made and their impact on the scene""",
        model_client=client,
    )

    agent_team = RoundRobinGroupChat(
        [screenwriter, story_critic, dialogue_expert],
        max_turns=3 # increase this number to allow more turns
    )

    console.print(Panel.fit("🎬 Welcome to the Collaborative Script Workshop!\n\nShare your movie idea or scenario, and our team will help develop it.\n(Type 'exit' to leave)",
                          border_style="blue",
                          title="Movie Development Team"))

    conversation_history = []

    while True:
        user_input = Prompt.ask("\n[bold blue]Your movie idea[/bold blue]")
        if user_input.strip().lower() == "exit":
            console.print("\n[bold red]End Scene! 🎬[/bold red]")
            break

        conversation_history.append(TextMessage(content=user_input, source="user"))

        with console.status("[bold green]Agents are developing your scene...[/bold green]"):
            try:
                stream = agent_team.run_stream(task=user_input)
                async for message in stream:
                    if hasattr(message, 'content') and hasattr(message, 'source'):
                        content = message.content
                        source = message.source

                        if source == "user":
                            continue

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
                            title=f"[bold]💭 {source} Thinking[/bold]",
                            title_align="left"
                        ))

                        console.print(Panel(
                            Markdown(final_answer),
                            border_style="green",
                            title=f"[bold]🎬 {source} Contribution[/bold]",
                            title_align="left"
                        ))

                        conversation_history.append(message)
            except Exception as e:
                console.print(f"[bold red]Error: {str(e)}[/bold red]")


if __name__ == "__main__":
    asyncio.run(main())
