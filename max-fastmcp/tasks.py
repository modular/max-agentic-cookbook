import os
import requests

from honcho.manager import Manager
from invoke import task, Context
from tenacity import retry, stop_after_attempt, wait_fixed, retry_if_result

from max_mcp import mcp as mcp_server

from max.entrypoints import pipelines


MAX_PORT = 8001
MCP_PORT = 8002
WEB_PORT = 8000
HOST = "127.0.0.1"


@task
def app(c: Context):
    print("Freeing up ports before starting services...")
    clean(c, ports=f"{MAX_PORT},{MCP_PORT},{WEB_PORT}")

    m = Manager()

    m.add_process("web", "invoke web", quiet=False)
    m.add_process("max", "invoke max", quiet=False)
    m.add_process("mcp", "invoke mcp", quiet=False)

    m.loop()

    print("Cleaning up ports before exiting...")
    clean(c, ports=f"{MAX_PORT},{MCP_PORT}")


@task
def mcp(_c: Context):
    mcp_server.mcp.run(
        transport="streamable-http",
        host=HOST,
        port=MCP_PORT,
        log_level="debug",
    )


@task
def max(c: Context):
    os.environ["MAX_SERVE_HOST"] = HOST
    os.environ["MAX_SERVE_PORT"] = str(MAX_PORT)
    c.run(
        """max serve \
        --model-path=meta-llama/Llama-3.2-1B-Instruct \
		--weight-path=bartowski/Llama-3.2-1B-Instruct-GGUF/Llama-3.2-1B-Instruct-Q4_K_M.gguf"""
    )


@task
def web(c: Context):
    health_urls = [
        f"http://{HOST}:{MAX_PORT}/v1/health",
        f"http://{HOST}:{MCP_PORT}/health",
    ]

    if not services_ready(*health_urls):
        print("One or more services did not start after multiple retries.", flush=True)
        return

    print("All services are available. Starting web app...", flush=True)
    c.run("python -m max_mcp")


@task
def clean(c: Context, ports: str):
    if not ports:
        print(
            "No ports specified. Use --ports to specify ports to clean (comma-separated)"
        )
        return

    port_list = [int(p.strip()) for p in ports.split(",")]
    for port in port_list:
        c.run(
            f"lsof -ti :{port} | xargs kill -9 || true",
            warn=True,
            pty=False,
            in_stream=False,
        )


@retry(
    retry=retry_if_result(lambda ok: not ok),
    stop=stop_after_attempt(500),
    wait=wait_fixed(2),
)
def services_ready(*urls: str) -> bool:
    services_ready = True
    for url in urls:
        try:
            response = requests.get(url)
            response.raise_for_status()
            print(f"Service at {url} is ready", flush=True)
        except:
            print(f"Service at {url} is not ready, will check again...", flush=True)
            services_ready = False
            break
    return services_ready
