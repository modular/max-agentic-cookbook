# Build a Continuous Chat App with MAX Serve and Llama3

TODO: copy from blog

A Gradio-based continuous chat interface for interacting with Llama 3 models using MAX Serve on GPU.
See the [blog](https://www.modular.com/blog/build-a-continuous-chat-interface-with-llama-3-and-max-serve) for more details.

## Requirements

- Supported GPU types: A100 (most optimized), A10G, L4 and L40
- Docker with [NVIDIA GPU support](https://docs.docker.com/config/containers/resource_constraints/#gpu)
- [NVIDIA drivers](https://www.nvidia.com/download/index.aspx) and [NVIDIA Container Toolkit](https://docs.nvidia.com/datacenter/cloud-native/container-toolkit/install-guide.html) installed
- Hugging Face account and [access token](https://huggingface.co/settings/tokens)
- Access to [meta-llama/Meta-Llama-3-8B](https://huggingface.co/meta-llama/Meta-Llama-3-8B) model on Hugging Face

## Environment Variables

### Required

```bash
export HUGGING_FACE_HUB_TOKEN=your_token_here
```

#### Optional

```bash
export MAX_CONTEXT_WINDOW=4096
export MAX_CACHE_BATCH_SIZE=1 # Memory dependent
export SYSTEM_PROMPT="You are a helpful AI assistant."
```

## Quick Start with Docker Compose

### Build and Run

1. Create and use a builder (only needed once)

    ```bash
    docker buildx create --use --name mybuilder
    ```

2. Build the UI image (only) for your platform

    ```bash
    # Intel, AMD
    docker buildx bake --load --set "ui.platform=linux/amd64"
    # OR for ARM such as Apple M-series
    docker buildx bake --load --set "ui.platform=linux/arm64"
    ```

    Note: For 24.6, the server runs on NVIDIA CUDA image

3.

- If you don't have access to the supported GPU type locally, you can instead follow our tutorials on deploying Llama 3 on GPU with MAX Serve to AWS, GCP or Azure or on Kubernetes to get a public endpoint and then run the UI component separately as follows:

    ```bash
    docker run -p 7860:7860 \
    -e "BASE_URL=http://PUBLIC_IP/v1" \
    -e "HUGGING_FACE_HUB_TOKEN=${HUGGING_FACE_HUB_TOKEN}" \
    llama3-chat-ui
    ```

- Or if you do have access to GPU locally simply run the services via docker-compose and wait for the UI to be available [http://localhost:7860](http://localhost:7860):

    ```bash
    docker compose up
    ```

### Clean up

1. Stop and remove all containers, networks, and volumes

    ```bash
    docker compose down -v
    ```

2. Remove all images related to this project

    ```bash
    docker rmi $(docker images -q modular/max-openai-api:24.6.0)
    docker rmi $(docker images -q llama3-chat-ui)
    ```

3. Remove the builder

    ```bash
    docker buildx rm mybuilder
    ```

## Development

Run the server on a GPU compatibe machine

```bash
docker run -d \
  --env "HUGGING_FACE_HUB_TOKEN=${HUGGING_FACE_HUB_TOKEN}" \
  --env "HF_HUB_ENABLE_HF_TRANSFER=1" \
  -v $HOME/.cache/huggingface:/root/.cache/huggingface \
  --gpus 1 \
  -p 8000:8000 \
  --ipc=host \
  modular/max-openai-api:24.6.0 \
  --huggingface-repo-id modularai/llama-3.1 \
  --max-cache-batch-size 1 \
  --max-length 4096
```

and the UI via `magic` CLI

```bash
magic run python ui.py
```

Note: Check the available UI options `magic run python ui.py --help`. If you change the `--max-cache-batch-size` in the serve
then make sure it matches the `--concurency-limit` in  `magic run python ui.py --concurrency-limit <number>` so that you can fully utilized
the MAX Serve handling concurrent streaming requests.

## Benchmarking the server

Please see our official [Benchmarking README](https://github.com/modularml/max/tree/main/pipelines/benchmarking).
