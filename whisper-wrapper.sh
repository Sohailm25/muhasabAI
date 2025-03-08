#!/bin/bash

# Get the directory of this script
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Print debug information
echo "Script directory: $SCRIPT_DIR"
echo "Arguments received: $@"

# Add the directory containing the ffmpeg binary to PATH
export PATH="$SCRIPT_DIR:$PATH"
echo "Using FFmpeg at: $(which ffmpeg)"
ffmpeg -version | head -n 1

# Check if virtual environment exists
if [ ! -d "$SCRIPT_DIR/whisper-venv" ]; then
    echo "ERROR: Whisper virtual environment not found at $SCRIPT_DIR/whisper-venv"
    echo "Please run 'npm run install:whisper' to set up the environment."
    exit 1
fi

# Activate the virtual environment
source "$SCRIPT_DIR/whisper-venv/bin/activate"

# Check if whisper is installed
if ! python -c "import whisper" 2>/dev/null; then
    echo "ERROR: Whisper package not installed in the virtual environment."
    echo "Please run 'npm run install:whisper' to set up the environment."
    deactivate
    exit 1
fi

# Print more debug info
echo "Python executable: $(which python)"
echo "Whisper available: $(python -c "import whisper; print('Yes')" 2>/dev/null || echo 'No')"

# Run whisper with all arguments
echo "Running: python -m whisper $@"
python -m whisper "$@"
WHISPER_EXIT_CODE=$?

# Print result
if [ $WHISPER_EXIT_CODE -eq 0 ]; then
    echo "Whisper transcription completed successfully."
else
    echo "Whisper transcription failed with exit code $WHISPER_EXIT_CODE."
fi

# Deactivate the virtual environment when done
deactivate 

exit $WHISPER_EXIT_CODE 