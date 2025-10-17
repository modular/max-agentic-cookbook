# Docker Deployment Guide

This guide provides comprehensive instructions for running the Modular Agentic Cookbook in Docker, including MAX model serving.

## Overview

The Docker container bundles:
- **MAX model serving** - Serves models via OpenAI-compatible API on port 8000
- **Agentic Cookbook web app** - Next.js application on port 3000
- **GPU support** - Works with both NVIDIA and AMD GPUs

## Building the Container

### Basic Build

Build the universal container image that supports all GPU types:

```bash
docker build --ulimit nofile=65535:65535 -t max-cookbook:latest .
```

**Note:** The `--ulimit nofile=65535:65535` flag increases the file descriptor limit, which is required for Next.js builds to succeed.

### Build Arguments

Customize the build to reduce container size or select specific MAX versions:

#### MAX_GPU

Selects the base MAX image (default: `universal`):

| Value | Image | Description |
|-------|-------|-------------|
| `universal` | `modular/max-full` | Larger image supporting all GPU types (NVIDIA, AMD) |
| `nvidia` | `modular/max-nvidia-full` | Smaller NVIDIA-specific image |
| `amd` | `modular/max-amd` | Smaller AMD-specific image |

#### MAX_TAG

Selects the MAX version (default: `latest`):

| Value | Description |
|-------|-------------|
| `latest` | Latest stable release |
| `nightly` | Nightly development builds |
| `25.7.0` | Specific version number |

### Build Examples

**AMD-specific container:**
```bash
docker build \
  --build-arg MAX_GPU=amd \
  --ulimit nofile=65535:65535 \
  -t max-cookbook:amd .
```

**NVIDIA-specific container with nightly builds:**
```bash
docker build \
  --build-arg MAX_GPU=nvidia \
  --build-arg MAX_TAG=nightly \
  --ulimit nofile=65535:65535 \
  -t max-cookbook:nvidia-nightly .
```

## Running the Container

### NVIDIA GPU

```bash
docker run --gpus all \
    -v ~/.cache/huggingface:/root/.cache/huggingface \
    --env "HF_HUB_ENABLE_HF_TRANSFER=1" \
    --env "HF_TOKEN=your-huggingface-token" \
    --env "MAX_MODEL=mistral-community/pixtral-12b" \
    -p 8000:8000 \
    -p 3000:3000 \
    max-cookbook:latest
```

### AMD GPU

```bash
docker run \
    --group-add keep-groups \
    --rm \
    --device /dev/kfd \
    --device /dev/dri \
    -v ~/.cache/huggingface:/root/.cache/huggingface \
    --env "HF_HUB_ENABLE_HF_TRANSFER=1" \
    --env "HF_TOKEN=your-huggingface-token" \
    --env "MAX_MODEL=mistral-community/pixtral-12b" \
    -p 8000:8000 \
    -p 3000:3000 \
    max-cookbook:latest
```

## Configuration

### Environment Variables

| Variable | Required | Description | Default |
|----------|----------|-------------|---------|
| `MAX_MODEL` | Yes | HuggingFace model to serve | - |
| `HF_TOKEN` | Yes* | HuggingFace API token | - |
| `HF_HUB_ENABLE_HF_TRANSFER` | No | Enable faster downloads | `1` |
| `MAX_ARGS` | No | Additional MAX serve arguments | - |

\* Required for gated models or private repositories

### Port Mapping

| Port | Service | Description |
|------|---------|-------------|
| `8000` | MAX Serve | OpenAI-compatible API endpoint |
| `3000` | Web App | Agentic Cookbook interface |

### Volume Mounts

**HuggingFace cache** (recommended):
```bash
-v ~/.cache/huggingface:/root/.cache/huggingface
```

Caches downloaded models between container restarts, significantly speeding up subsequent launches.

## Model Selection

The cookbook works with any model supported by MAX. Popular choices:

### Multimodal Models
- `mistral-community/pixtral-12b` - Vision + text
- `meta-llama/Llama-3.2-11B-Vision-Instruct` - Vision + text

### Text-Only Models
- `google/gemma-3-27b-it` - Efficient instruction-tuned
- `meta-llama/Llama-3.1-8B-Instruct` - Balanced performance
- `mistralai/Mistral-7B-Instruct-v0.3` - Fast inference

See [MAX documentation](https://docs.modular.com/max/) for the full list of supported models.

## Accessing the Application

Once the container is running:

1. **Wait for startup** - Watch logs for "MAX server ready" and "Next.js started"
2. **Open the cookbook** - Navigate to [http://localhost:3000](http://localhost:3000)
3. **Select endpoint** - The cookbook will auto-detect `http://localhost:8000` as available
4. **Choose model** - Select from models detected at the MAX endpoint

## Advanced Configuration

### Custom MAX Arguments

Pass additional arguments to `max serve`:

```bash
docker run --gpus all \
    -v ~/.cache/huggingface:/root/.cache/huggingface \
    -e "HF_TOKEN=your-token" \
    -e "MAX_MODEL=mistral-community/pixtral-12b" \
    -e "MAX_ARGS=--max-batch-size 32 --max-cache-size 8192" \
    -p 8000:8000 -p 3000:3000 \
    max-cookbook:latest
```

### Running in Detached Mode

Run the container in the background:

```bash
docker run -d \
    --name max-cookbook \
    --gpus all \
    -v ~/.cache/huggingface:/root/.cache/huggingface \
    -e "HF_TOKEN=your-token" \
    -e "MAX_MODEL=mistral-community/pixtral-12b" \
    -p 8000:8000 -p 3000:3000 \
    max-cookbook:latest
```

View logs:
```bash
docker logs -f max-cookbook
```

Stop container:
```bash
docker stop max-cookbook
```

### Multiple Models

To serve multiple models, run separate MAX containers on different ports:

```bash
# Model 1 on port 8000
docker run -d --name max-model-1 --gpus all \
    -e "HF_TOKEN=your-token" \
    -e "MAX_MODEL=google/gemma-3-27b-it" \
    -p 8000:8000 \
    modular/max:latest

# Model 2 on port 8001
docker run -d --name max-model-2 --gpus all \
    -e "HF_TOKEN=your-token" \
    -e "MAX_MODEL=mistral-community/pixtral-12b" \
    -p 8001:8000 \
    modular/max:latest
```

Configure multiple endpoints in `.env.local`:
```env
COOKBOOK_ENDPOINTS='[
  {"id": "gemma", "baseUrl": "http://localhost:8000/v1", "apiKey": "EMPTY"},
  {"id": "pixtral", "baseUrl": "http://localhost:8001/v1", "apiKey": "EMPTY"}
]'
```

## Troubleshooting

### Container fails to start

**Check GPU access:**
```bash
# NVIDIA
docker run --rm --gpus all nvidia/cuda:12.0-base nvidia-smi

# AMD
docker run --rm --device /dev/kfd --device /dev/dri rocm/rocm-terminal rocm-smi
```

**Check Docker resource limits:**
- Ensure sufficient memory allocation (8GB+ recommended)
- Verify GPU is not in use by another process

### Model download fails

**Verify HuggingFace token:**
- Check token has read access to the model
- For gated models, ensure you've accepted the license agreement

**Check disk space:**
- Models can be 10GB+ in size
- Verify sufficient space in Docker volumes

### Web application won't load

**Check port conflicts:**
```bash
# Verify ports are not in use
lsof -i :3000
lsof -i :8000
```

**Check container logs:**
```bash
docker logs max-cookbook
```

### Slow performance

**Optimize for your GPU:**
- Use GPU-specific images (`MAX_GPU=nvidia` or `MAX_GPU=amd`)
- Adjust batch size and cache size via `MAX_ARGS`
- Ensure GPU drivers are up to date

**Enable HuggingFace transfer acceleration:**
```bash
--env "HF_HUB_ENABLE_HF_TRANSFER=1"
```

## Security Considerations

- **API keys**: Never commit `.env` files with real tokens
- **Network exposure**: Consider using a reverse proxy for production
- **GPU isolation**: Use Docker resource limits to prevent GPU exhaustion
- **Model access**: Validate model licenses for your use case

## Next Steps

- [Architecture Guide](./architecture.md) - Understand the cookbook structure
- [Contributing Guide](./contributing.md) - Add your own recipes
- [MAX Documentation](https://docs.modular.com/max/) - Learn more about MAX
