#!/bin/bash

set -e  # Exit on any error

# Trap Ctrl+C and run cleanup
trap 'echo "Cleaning up..."; magic run clean; exit' INT

# Detect if NVIDIA GPUs are present
NUM_GPUS=$(which nvidia-smi >/dev/null 2>&1 && nvidia-smi -L | wc -l || echo "0")

# Run the docker-compose profile based on GPU availability
if [ "$NUM_GPUS" -gt 0 ]; then
    echo "Detected $NUM_GPUS GPU(s). Running with GPU support."
    docker-compose --profile gpu up -d && docker-compose --profile gpu logs -f
else
    echo "No GPUs detected. Running on CPU only."
    docker-compose --profile cpu up -d && docker-compose --profile cpu logs -f
fi
