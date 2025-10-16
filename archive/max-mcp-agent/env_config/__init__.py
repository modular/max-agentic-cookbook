import os
from dotenv import load_dotenv


class EnvConfig:
    """Environment configuration manager."""

    def __init__(self):
        load_dotenv()

        self.max_serve_host = self._get_required_host_var("MAX_SERVE_HOST")
        self.mcp_host = self._get_required_host_var("MCP_HOST")
        self.api_host = self._get_required_host_var("API_HOST")

        self.max_serve_port = self._get_required_port_var("MAX_SERVE_PORT")
        self.mcp_port = self._get_required_port_var("MCP_PORT")
        self.api_port = self._get_required_port_var("API_PORT")

        self.model_name = (
            self._get_optional_env_var("MODEL_NAME")
            or "meta-llama/Llama-3.2-1B-Instruct"
        )
        self.model_weights = self._get_optional_env_var("MODEL_WEIGHTS")

        self.max_serve_health_path = (
            self._get_optional_env_var("MAX_SERVE_HEALTH_PATH") or "/v1/health"
        )
        self.mcp_health_path = (
            self._get_optional_env_var("MCP_HEALTH_PATH") or "/health"
        )

        self.max_serve_api_path = "/v1"
        self.mcp_api_path = "/mcp"
        self.max_serve_url = self._make_url(
            self.max_serve_host, self.max_serve_port, self.max_serve_api_path
        )
        self.mcp_url = self._make_url(self.mcp_host, self.mcp_port, self.mcp_api_path)

    def _get_required_host_var(self, name: str) -> str:
        """Get a required environment variable, raising an error if it's None."""
        value = os.getenv(name)
        if value is None:
            msg = f"Missing environment variable: {name}"
            msg += "\nHave you created a .env file yet? See README.md"
            raise ValueError(msg)
        return value

    def _get_required_port_var(self, name: str) -> int:
        """Get a required port environment variable and convert to int."""
        str_value = self._get_required_host_var(name)
        return int(str_value)

    def _get_optional_env_var(self, name: str) -> str | None:
        """Get an optional environment variable with a default value."""
        return os.getenv(name)

    def _make_url(self, host: str, port: int, path: str, protocol: str = "http") -> str:
        """Construct a URL from host, port, and path components."""
        return f"{protocol}://{host}:{port}{path}"


# Export the class for direct usage
__all__ = ["EnvConfig"]
