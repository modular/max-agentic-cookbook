import requests

from honcho.manager import Manager
from invoke.tasks import task
from invoke.context import Context
from tenacity import retry, stop_after_attempt, wait_fixed, retry_if_result

from env_config import EnvConfig

# Create environment configuration instance
env = EnvConfig()


@task
def app(c: Context):
    """Start all services (MAX, MCP, and API) using honcho process manager."""
    print("Freeing up ports before starting services...")
    clean(c)

    m = Manager()

    m.add_process("api", "invoke api", quiet=False)
    m.add_process("max", "invoke max", quiet=False)
    m.add_process("mcp", "invoke mcp", quiet=False)

    try:
        m.loop()
    except KeyboardInterrupt:
        print("\nShutting down services...")
    finally:
        print("Cleaning up ports before exiting...")
        clean(c)


@task
def mcp(_c: Context):
    """Start the MCP (Model Context Protocol) server."""
    import demo_mcp_server

    demo_mcp_server.mcp.run(
        transport="streamable-http",
        host=env.mcp_host,
        port=env.mcp_port,
        log_level="debug",
    )


@task
def max(c: Context):
    """Start the MAX model serving component."""
    cmd = f"max serve --model-path={env.model_name}"
    if env.model_weights is not None:
        cmd += f" --weight-path={env.model_weights}"

    c.run(cmd)


@task
def api(c: Context):
    """Start the web app after ensuring all services are ready."""
    health_urls = [
        f"http://{env.max_serve_host}:{env.max_serve_port}{env.max_serve_health_path}",
        f"http://{env.mcp_host}:{env.mcp_port}{env.mcp_health_path}",
    ]

    if not services_ready(*health_urls):
        print("One or more services did not start after multiple retries.", flush=True)
        return

    print("All services are available. Starting web app...", flush=True)
    c.run("python -m max_mcp_agent")


@task
def clean(
    c: Context, ports: str = f"{env.max_serve_port},{env.mcp_port},{env.api_port}"
):
    """Kill processes using the specified ports."""
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
    """Check if all services are ready by making health check requests."""
    services_ready = True
    for url in urls:
        try:
            response = requests.get(url, timeout=5)
            response.raise_for_status()
            print(f"Service at {url} is ready", flush=True)
        except Exception as e:
            print(f"Service at {url} is not ready: {e}", flush=True)
            services_ready = False
            break
    return services_ready
