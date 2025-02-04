#!/bin/bash

set -e  # Exit on any error

# Detect if NVIDIA GPUs are present
NUM_GPUS=$(which nvidia-smi >/dev/null 2>&1 && nvidia-smi -L | wc -l || echo "0")

# Set service name based on GPU availability
if [ "$NUM_GPUS" -gt 0 ]; then
    echo "Detected $NUM_GPUS GPU(s). Running with GPU support."
    docker compose --profile gpu up
else
    echo "No GPUs detected. Running on CPU only."
    docker compose --profile cpu up
fi
