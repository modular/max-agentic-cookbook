import os
import uvicorn
from dotenv import load_dotenv
from max_mcp_agent import api


if __name__ == "__main__":
    load_dotenv()

    host = os.getenv("API_HOST", "0.0.0.0")
    port = int(os.getenv("API_PORT", 8000))

    uvicorn.run(api, host=host, port=port)
