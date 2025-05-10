#!/bin/bash

# Check if a file argument was provided
if [ $# -lt 1 ]; then
    echo "Usage: $0 <mojo_file_path>"
    echo "Example: $0 main.mojo"
    exit 1
fi

echo "Installing required dependencies for rocprofile..."
python3 -m venv .venv
source .venv/bin/activate
python3 -m pip install -r /opt/rocm/libexec/rocprofiler-compute/requirements.txt

# Get the mojo file path from the argument
MOJO_FILE="$1"

# Extract the base name without extension to use as binary name
BINARY_NAME=$(basename "$MOJO_FILE" .mojo)

mojo build "$MOJO_FILE"
rocprof-compute profile -n "$BINARY_NAME" -- "./${BINARY_NAME}"
rocprof-compute analyze -q -p "workloads/${BINARY_NAME}/MI300X_A1" > "${BINARY_NAME}.log"

echo
echo "--------------------------------------------------------------------"
echo "Profile written, open in text editor to view: ./${BINARY_NAME}.log"
