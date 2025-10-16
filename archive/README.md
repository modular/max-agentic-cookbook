# Archive - Legacy MAX Recipes

> **⚠️ This folder contains legacy content that is no longer actively maintained.**
>
> These recipes are provided "as-is" for historical reference only and may not work with current versions of MAX or its dependencies.

## About This Archive

This archive contains standalone MAX recipes that were part of the original `max-recipes` repository structure. As of October 2025, the repository has been restructured to focus on the **[Modular Agentic Cookbook](../README.md)**, a unified collection of modern fullstack web applications built to work with MAX or any other serving solution with an OpenAI-compatible API.

The recipes in this archive represent earlier explorations and examples that have been superseded by the comprehensive, well-documented cookbook approach.

## Archived Content

### AI Agents

- **[ai-weather-agent](./ai-weather-agent/)** - Intelligent weather agent with multi-stage LLM pipeline, semantic caching, and real-time updates
- **[autodoc-repo-chat-agent](./autodoc-repo-chat-agent/)** - AI-powered documentation generator with repository understanding
- **[code-execution-sandbox-agent-with-e2b](./code-execution-sandbox-agent-with-e2b/)** - Secure code execution agent with sandboxed environment and safety checks
- **[deepseek-qwen-autogen-agent](./deepseek-qwen-autogen-agent/)** - Multi-agent system using DeepSeek and Qwen models with AutoGen
- **[max-mcp-agent](./max-mcp-agent/)** - Model Context Protocol (MCP) integration agent

### MAX Serve Integrations

- **[max-serve-anythingllm](./max-serve-anythingllm/)** - Integration with AnythingLLM platform
- **[max-serve-continuous-chat](./max-serve-continuous-chat/)** - Continuous conversation interface with MAX Serve
- **[max-serve-multimodal-structured-output](./max-serve-multimodal-structured-output/)** - Structured output generation from multimodal inputs
- **[max-serve-open-webui](./max-serve-open-webui/)** - Open WebUI integration with MAX Serve
- **[max-serve-openai-embeddings](./max-serve-openai-embeddings/)** - OpenAI-compatible embeddings endpoint
- **[max-serve-openai-function-calling](./max-serve-openai-function-calling/)** - OpenAI-compatible function calling

### RAG & Multimodal

- **[multimodal-rag-with-colpali-llamavision-reranker](./multimodal-rag-with-colpali-llamavision-reranker/)** - Advanced RAG system with ColPali embedding, Llama3.2-Vision, Qdrant, and reranker

### Mojo & Custom Operations

- **[custom-ops-ai-applications](./custom-ops-ai-applications/)** - Top-K token sampler and Flash Attention as fused custom ops on GPU
- **[custom-ops-introduction](./custom-ops-introduction/)** - Introduction to building custom operations
- **[custom-ops-matrix-multiplication](./custom-ops-matrix-multiplication/)** - Matrix multiplication custom operation example
- **[gpu-functions-mojo](./gpu-functions-mojo/)** - Writing thread-parallel GPU functions using MAX Driver API
- **[mojo-operation-template](./mojo-operation-template/)** - Template for creating Mojo operations

### Infrastructure

- **[max-offline-inference](./max-offline-inference/)** - Offline inference setup examples

### Development Tools

- **[scripts](./scripts/)** - Legacy validation and testing scripts
  - `run_tests.py` - Test runner for multiple recipe directories
  - `validate_metadata.py` - Metadata validation for recipe manifests

## Why These Were Archived

1. **Inconsistent structure** - Each recipe had its own setup, dependencies, and patterns
2. **Maintenance burden** - Keeping numerous standalone projects up-to-date with MAX releases
3. **User experience** - Difficult to compare approaches or reuse code across recipes
4. **Modern approach** - The Agentic Cookbook provides a unified, well-documented framework

## What to Use Instead

For modern, actively maintained examples and recipes, please see:

- **[Modular Agentic Cookbook](../README.md)** - The main repository documentation
- **[Cookbook Recipes](../packages/recipes/)** - Current recipe implementations
- **[MAX Documentation](https://docs.modular.com/max/)** - Official Modular Platform documentation
- **[MAX Builds](https://builds.modular.com/)** - GenAI models optimized for use with MAX

## Compatibility Notes

⚠️ **Important:** These archived recipes may have compatibility issues:

- Dependencies may be outdated or deprecated
- API signatures may have changed in newer MAX versions
- Python package versions may conflict with current requirements
- GPU drivers and runtime requirements may differ
- Some integrations may no longer be supported

## Using Archived Content

If you choose to explore or use content from this archive:

1. Check the specific recipe's README for its original requirements
2. Be prepared to update dependencies and fix compatibility issues
3. Refer to the [MAX documentation](https://docs.modular.com/max/) for current API usage
4. Consider adapting the concepts to the modern Agentic Cookbook structure instead

## Contributing

We are no longer accepting contributions or updates to archived recipes. If you have improvements or new ideas:

- **For new recipes**: Consider contributing to the [Agentic Cookbook](../packages/recipes/)
- **For issues**: Check if the functionality exists in the current cookbook
- **For questions**: Visit the [Modular Forum](https://forum.modular.com/) or [Discord](https://discord.gg/modular)

## Support

Since these recipes are no longer maintained:

- ❌ No bug fixes or updates will be provided
- ❌ No compatibility testing with new MAX releases
- ❌ No technical support available
- ✅ Historical reference and educational purposes only

For supported examples and active development, please use the [Modular Agentic Cookbook](../README.md).
