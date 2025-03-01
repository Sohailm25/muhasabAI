#!/bin/bash

# Get the directory of this script
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Activate the virtual environment
source "$SCRIPT_DIR/whisper-venv/bin/activate"

# Run whisper with all arguments
python -m whisper "$@"

# Deactivate the virtual environment when done
deactivate 