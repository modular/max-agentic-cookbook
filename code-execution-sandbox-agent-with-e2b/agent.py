import os
from openai import OpenAI
from e2b_code_interpreter import Sandbox
from typing import List
from pydantic import BaseModel
from dotenv import load_dotenv

from rich.console import Console
from rich.panel import Panel
from rich.syntax import Syntax

load_dotenv()
console = Console()

LLM_SERVER_URL = os.getenv("LLM_SERVER_URL", "http://localhost:8010/v1")
LLM_API_KEY = os.getenv("LLM_API_KEY", "local")
LLM_MODEL = os.getenv("LLM_MODEL", "modularai/Llama-3.1-8B-Instruct-GGUF")

client = OpenAI(base_url=LLM_SERVER_URL, api_key=LLM_API_KEY)


class CodeBlock(BaseModel):
    type: str
    code: str


class CodeExecution(BaseModel):
    code_blocks: List[CodeBlock]


def execute_python(blocks: List[CodeBlock]) -> str:
    """Execute python code blocks in sequence and return the result."""
    try:
        with Sandbox() as sandbox:
            full_code = "\n\n".join(block.code for block in blocks)
            # Step 1: Show the code to be executed
            console.print(
                Panel(
                    Syntax(full_code, "python", theme="monokai"),
                    title="[bold blue]Step 1: Code[/bold blue]",
                    border_style="blue",
                )
            )

            execution = sandbox.run_code(full_code)
            output = (
                execution.logs.stdout
                if execution.logs and execution.logs.stdout
                else execution.text
            )
            output = "".join(output) if isinstance(output, list) else output

            # Step 2: Show the execution result
            console.print(
                Panel(
                    output or "No output",
                    title="[bold green]Step 2: Result[/bold green]",
                    border_style="green",
                )
            )
            return output
    except Exception as e:
        console.print(Panel(str(e), title="Error", border_style="red"))
        return str(e)


# Define structured tool for LLM
tools = [
    {
        "type": "function",
        "function": {
            "name": "execute_python",
            "description": "Execute python code blocks in sequence",
            "parameters": CodeExecution.model_json_schema(),
        },
    }
]


def main():
    console.print(
        Panel("Interactive Python Assistant (type 'exit' to quit)", border_style="cyan")
    )

    while True:
        query = console.input("[bold yellow]Your query:[/bold yellow] ")
        if query.lower() in ["exit", "quit"]:
            console.print("[cyan]Goodbye![/cyan]")
            break

        messages = [
            {
                "role": "system",
                "content": """You are a Python code execution assistant. Generate complete, executable code based on user queries.

Important rules:
1. Always include necessary imports at the top
2. Always include print statements to show results
3. Make sure the code is complete and can run independently
4. Test all variables are defined before use
""",
            },
            {"role": "user", "content": query},
        ]

        console.print("[cyan]Generating code...[/cyan]")
        try:
            response = client.beta.chat.completions.parse(
                model=LLM_MODEL, messages=messages, response_format=CodeExecution
            )

            code_blocks = response.choices[0].message.parsed.code_blocks
            result = execute_python(code_blocks)

            if result:
                explanation_messages = [
                    {
                        "role": "system",
                        "content": "You are a helpful assistant. Explain what the code did and its result clearly and concisely.",
                    },
                    {
                        "role": "user",
                        "content": f"Explain this code and its result:\n\nCode:\n```python\n{code_blocks[0].code}\n```\n\nResult:\n{result}",
                    },
                ]

                console.print("[cyan]Getting explanation...[/cyan]")
                final_response = client.chat.completions.create(
                    model=LLM_MODEL, messages=explanation_messages
                )

                explanation = final_response.choices[0].message.content.strip()
                console.print(
                    Panel(
                        explanation,
                        title="[bold purple]Step 3: Explanation[/bold purple]",
                        border_style="purple",
                    )
                )

        except Exception as e:
            console.print(Panel(f"Error: {str(e)}", border_style="red"))


if __name__ == "__main__":
    main()
