import os
import requests

from dotenv import load_dotenv
from honcho.manager import Manager
from invoke.tasks import task
from invoke.context import Context
from tenacity import retry, stop_after_attempt, wait_fixed, retry_if_result

load_dotenv()

MAX_SERVE_HOST = os.getenv("MAX_SERVE_HOST", "0.0.0.0")
MAX_SERVE_PORT = int(os.getenv("MAX_SERVE_PORT", 8001))

MCP_HOST = os.getenv("MCP_HOST", "0.0.0.0")
MCP_PORT = int(os.getenv("MCP_PORT", 8002))

API_HOST = os.getenv("API_HOST", "0.0.0.0")
API_PORT = int(os.getenv("API_PORT", 8000))


@task
def app(c: Context):
    print("Freeing up ports before starting services...")
    clean(c)

    m = Manager()

    m.add_process("api", "invoke api", quiet=False)
    m.add_process("max", "invoke max", quiet=False)
    m.add_process("mcp", "invoke mcp", quiet=False)

    m.loop()

    print("Cleaning up ports before exiting...")
    clean(c)


@task
def mcp(_c: Context):
    import demo_mcp_server

    demo_mcp_server.mcp.run(
        transport="streamable-http",
        host=MCP_HOST,
        port=MCP_PORT,
        log_level="debug",
    )


@task
def max(c: Context):
    c.run(
        """max serve \
        --model-path=meta-llama/Llama-3.2-1B-Instruct \
		--weight-path=bartowski/Llama-3.2-1B-Instruct-GGUF/Llama-3.2-1B-Instruct-Q4_K_M.gguf"""
    )


@task
def api(c: Context):
    max_health_path = os.getenv("MAX_SERVE_HEALTH_PATH", "/v1/health")
    mcp_health_path = os.getenv("MCP_HEALTH_PATH", "/health")
    health_urls = [
        f"http://{MAX_SERVE_HOST}:{MAX_SERVE_PORT}{max_health_path}",
        f"http://{MCP_HOST}:{MCP_PORT}{mcp_health_path}",
    ]

    if not services_ready(*health_urls):
        print("One or more services did not start after multiple retries.", flush=True)
        return

    print("All services are available. Starting web app...", flush=True)
    c.run("python -m max_mcp_agent")


@task
def clean(c: Context, ports: str = f"{MAX_SERVE_PORT},{MCP_PORT},{API_PORT}"):
    if not ports:
        print("No ports specified. Use --ports to specify ports (comma-separated)")
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
