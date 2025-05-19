from fastmcp import FastMCP
from honcho.manager import Manager
from invoke import task, Context
from pydantic import Field
from typing import Annotated


@task
def max(c: Context):
    c.run("""max serve \
        --model-path=unsloth/phi-4-unsloth-bnb-4bit \
		--weight-path=bouthros/Phi_4_Medical_QA_GGUF/unsloth.Q4_K_M.gguf""")


@task
def mcp(_c: Context):
    mcp = FastMCP("Demo MCP Server")

    @mcp.tool()
    def count_characters(
        character: Annotated[
            str, Field(description="Character to count the occurrences of")
        ],
        string: Annotated[
            str, Field(description="String within which to search for the character")
        ],
    ) -> int:
        """Counts the occurrences of a character within a string"""
        return string.count(character)

    mcp.run(
        transport="streamable-http",
        host="127.0.0.1",
        port=8001,
        log_level="debug",
    )


@task
def ui(_c: Context):
    while True:
        pass


@task
def app(_c: Context):
    m = Manager()
    m.add_process("max", "invoke max", quiet=False)
    m.add_process("mcp", "invoke mcp", quiet=False)
    m.add_process("ui", "invoke ui", quiet=False)
    m.loop()
