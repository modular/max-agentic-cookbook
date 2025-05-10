#!/bin/bash

# Check if a file path was provided
if [ $# -ne 1 ]; then
    echo "Usage: magic run debug_amd file_path.mojo"
    exit 1
fi

# Get the input file path
FILE_NAME="$1"

# Extract the binary name without extension
BINARY_NAME=$(basename "$FILE_NAME" .mojo)

# Build the mojo file with debug information
mojo build --debug-level=line-tables "$FILE_NAME"

# Run rocgdb with the binary
rocgdb "./${BINARY_NAME}"
