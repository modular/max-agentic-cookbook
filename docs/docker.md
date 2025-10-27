# Docker Deployment Guide

This guide provides instructions for running the MAX Recipes cookbook in Docker with integrated MAX model serving.

## Overview

The Docker container bundles two services orchestrated by PM2:

-   **MAX model serving** - Serves models via OpenAI-compatible API on port 8000
-   **Web app** - FastAPI backend + React frontend on port 8010
-   **GPU support** - Works with both NVIDIA and AMD GPUs

See [`Dockerfile`](../Dockerfile) and [`ecosystem.config.js`](../ecosystem.config.js) for implementation details.

## Building the Container

### Basic Build

Build the container image:

```bash
docker build -t max-recipes .
```

### Build Arguments

Customize the build to reduce container size or select specific MAX versions:

#### MAX_GPU

Selects the base MAX image (default: `universal`):

| Value       | Image                     | Description                                         |
| ----------- | ------------------------- | --------------------------------------------------- |
| `universal` | `modular/max-full`        | Larger image supporting all GPU types (NVIDIA, AMD) |
| `nvidia`    | `modular/max-nvidia-full` | Smaller NVIDIA-specific image                       |
| `amd`       | `modular/max-amd`         | Smaller AMD-specific image                          |

#### MAX_TAG

Selects the MAX version (default: `latest`):

| Value     | Description                |
| --------- | -------------------------- |
| `latest`  | Latest stable release      |
| `nightly` | Nightly development builds |

### Build Examples

**AMD-specific container:**

```bash
docker build --build-arg MAX_GPU=amd -t max-recipes:amd .
```

**NVIDIA-specific container with nightly builds:**

```bash
docker build --build-arg MAX_GPU=nvidia --build-arg MAX_TAG=nightly -t max-recipes:nvidia-nightly .
```

## Running the Container

### NVIDIA GPU

```bash
docker run --gpus all \
    -v ~/.cache/huggingface:/root/.cache/huggingface \
    -e "HF_HUB_ENABLE_HF_TRANSFER=1" \
    -e "HF_TOKEN=your-huggingface-token" \
    -e "MAX_MODEL=mistral-community/pixtral-12b" \
    -p 8000:8000 \
    -p 8010:8010 \
    max-recipes
```

### AMD GPU

```bash
docker run \
    --group-add keep-groups \
    --device /dev/kfd \
    --device /dev/dri \
    -v ~/.cache/huggingface:/root/.cache/huggingface \
    -e "HF_HUB_ENABLE_HF_TRANSFER=1" \
    -e "HF_TOKEN=your-huggingface-token" \
    -e "MAX_MODEL=mistral-community/pixtral-12b" \
    -p 8000:8000 \
    -p 8010:8010 \
    max-recipes
```

## Configuration

### Environment Variables

| Variable                    | Required | Description                | Default |
| --------------------------- | -------- | -------------------------- | ------- |
| `MAX_MODEL`                 | Yes      | HuggingFace model to serve | -       |
| `HF_TOKEN`                  | Yes\*    | HuggingFace API token      | -       |
| `HF_HUB_ENABLE_HF_TRANSFER` | No       | Enable faster downloads    | `1`     |

\* Required for gated models or private repositories

### Port Mapping

| Port   | Service   | Description                                 |
| ------ | --------- | ------------------------------------------- |
| `8000` | MAX Serve | OpenAI-compatible LLM API endpoint          |
| `8010` | Web App   | FastAPI backend + React frontend            |

### Volume Mounts

**HuggingFace cache** (recommended):

```bash
-v ~/.cache/huggingface:/root/.cache/huggingface
```

Caches downloaded models between container restarts, significantly speeding up subsequent launches.

## Service Orchestration

PM2 manages service startup order (see [`ecosystem.config.js`](../ecosystem.config.js)):

1. **MAX serving** starts on port 8000
2. **Web app** waits for MAX health check, then starts on port 8010

All services restart automatically if they crash.

## Model Selection

The cookbook works with any model supported by MAX. Popular choices:

### Multimodal Models

-   `mistral-community/pixtral-12b`
-   `OpenGVLab/InternVL3-14B-Instruct`
-   `meta-llama/Llama-3.2-11B-Vision-Instruct`

### Text-Only Models

-   `google/gemma-3-27b-it`
-   `meta-llama/Llama-3.1-8B-Instruct`
-   `mistralai/Mistral-Small-24B-Instruct-2501`

See [MAX Builds](https://builds.modular.com/?category=models) for the full list of supported models.

## Accessing the Application

Once the container is running:

1. **Wait for startup** - Watch logs for both services to start (MAX → web app)
2. **Open the cookbook** - Navigate to [http://localhost:8010](http://localhost:8010)
3. **Select endpoint** - The cookbook auto-detects `http://localhost:8000` as available
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
    -p 8000:8000 -p 8010:8010 \
    max-recipes
```

### Running in Detached Mode

Run the container in the background:

```bash
docker run -d \
    --name max-recipes \
    --gpus all \
    -v ~/.cache/huggingface:/root/.cache/huggingface \
    -e "HF_TOKEN=your-token" \
    -e "MAX_MODEL=mistral-community/pixtral-12b" \
    -p 8000:8000 -p 8010:8010 \
    max-recipes
```

View logs:

```bash
docker logs -f max-recipes
```

Stop container:

```bash
docker stop max-recipes
```

### Multiple Models (External MAX Containers)

To serve multiple models, run separate MAX containers on different ports and configure via `.env.local`:

```bash
# Model 1 on port 8000
docker run -d --name max-model-1 --gpus all \
    -e "HF_TOKEN=your-token" \
    -e "MAX_MODEL=google/gemma-3-27b-it" \
    -p 8000:8000 \
    modular/max:latest

# Model 2 on port 8002
docker run -d --name max-model-2 --gpus all \
    -e "HF_TOKEN=your-token" \
    -e "MAX_MODEL=mistral-community/pixtral-12b" \
    -p 8002:8000 \
    modular/max:latest
```

Configure in `backend/.env.local`:

```env
COOKBOOK_ENDPOINTS='[
  {"id": "gemma", "baseUrl": "http://localhost:8000/v1", "apiKey": "EMPTY"},
  {"id": "pixtral", "baseUrl": "http://localhost:8002/v1", "apiKey": "EMPTY"}
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

-   Ensure sufficient memory allocation (8GB+ recommended)
-   Verify GPU is not in use by another process

**Check service logs:**

```bash
docker logs max-recipes
# Look for PM2 startup messages and any errors
```

### Model download fails

**Verify HuggingFace token:**

-   Check token has read access to the model
-   For gated models, ensure you've accepted the license agreement

**Check disk space:**

-   Models can be 10GB+ in size
-   Verify sufficient space in Docker volumes

### Web application won't load

**Check port conflicts:**

```bash
# Verify ports are not in use
lsof -i :8010
lsof -i :8000
```

**Check container logs:**

```bash
docker logs max-recipes
# Look for PM2 errors or service crashes
```

### Slow performance

**Optimize for your GPU:**

-   Use GPU-specific images (`--build-arg MAX_GPU=nvidia` or `MAX_GPU=amd`)
-   Adjust batch size and cache size via `MAX_ARGS`
-   Ensure GPU drivers are up to date

**Enable HuggingFace transfer acceleration:**

```bash
-e "HF_HUB_ENABLE_HF_TRANSFER=1"
```

## Security Considerations

-   **API keys**: Never commit `.env` files with real tokens
-   **Network exposure**: Consider using a reverse proxy for production
-   **GPU isolation**: Use Docker resource limits to prevent GPU exhaustion
-   **Model access**: Validate model licenses for your use case

## Next Steps

-   [Architecture Guide](./architecture.md) - Understand the cookbook structure
-   [Contributing Guide](./contributing.md) - Add your own recipes
-   [MAX Documentation](https://docs.modular.com/max/) - Learn more about MAX
-   [Project Context](../.claude/project-context.md) - Comprehensive reference
