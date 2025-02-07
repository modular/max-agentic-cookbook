#!/bin/bash

NUM_GPUS=$(nvidia-smi -L 2>/dev/null | wc -l || echo "0")

if [ "$NUM_GPUS" -gt 0 ] && nvidia-smi >/dev/null 2>&1; then
    PROFILE="gpu"
    echo "Detected $NUM_GPUS GPU(s). Using GPU profile."
else
    PROFILE="cpu"
    echo "No GPUs detected. Using CPU profile."
fi

case "$1" in
"app")
    echo "Starting the app on $PROFILE ..."
    docker compose --profile $PROFILE up
    ;;
"clean")
    echo "Cleaning up containers with $PROFILE ..."
    docker compose --profile $PROFILE down
    docker rmi $(docker images -q modular/max-openai-api:${MAX_OPENAI_API_VERSION:-latest})
    docker rmi $(docker images -q llama3-chat-ui:latest)
    ;;
*)
    echo "Usage: $0 {app|clean}"
    echo "  app   - Start the application"
    echo "  clean - Stop and remove containers"
    exit 1
    ;;
esac
