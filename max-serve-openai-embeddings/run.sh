#!/bin/bash

NUM_GPUS=$(nvidia-smi -L 2>/dev/null | wc -l || echo "0")

if [ "$NUM_GPUS" -gt 0 ] && nvidia-smi >/dev/null 2>&1; then
    export PROFILE="gpu"
    echo "Detected $NUM_GPUS GPU(s). Using GPU profile."
else
    export PROFILE="cpu"
    echo "No GPUs detected. Using CPU profile."
fi

case "$1" in
"app")
    echo "Starting the app on $PROFILE ..."
    docker compose --profile $PROFILE up --abort-on-container-exit
    ;;
"stop")
    echo "Stopping containers with $PROFILE ..."
    docker compose --profile $PROFILE down
    ;;
"clean")
    echo "Cleaning up containers with $PROFILE ..."
    docker compose --profile $PROFILE down -v

    if docker images -q "modular/max-openai-api:${MAX_OPENAI_API_VERSION:-nightly}" >/dev/null; then
        docker rmi -f "modular/max-openai-api:${MAX_OPENAI_API_VERSION:-nightly}"
    fi

    if docker images -q "max-serve-openai-embeddings-embeddings" >/dev/null; then
        docker rmi -f "max-serve-openai-embeddings-embeddings"
    fi
    ;;
*)
    echo "Usage: $0 {app|stop|clean}"
    echo "  app   - Start the application"
    echo "  stop  - Stop containers without removing images"
    echo "  clean - Stop and remove containers and images"
    exit 1
    ;;
esac
