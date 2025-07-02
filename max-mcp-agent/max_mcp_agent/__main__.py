import uvicorn
from env_config import EnvConfig
from max_mcp_agent import app


if __name__ == "__main__":
    env = EnvConfig()
    uvicorn.run(app, host=env.api_host, port=env.api_port)
