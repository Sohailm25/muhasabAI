#!/bin/bash

# Get the directory of this script
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Ramadan Reflections - Whisper Installation Helper
echo "🔊 Ramadan Reflections - Whisper Installation Helper"
echo "======================================================"

# Check if Python is installed
if command -v python3 &>/dev/null; then
    echo "✅ Python 3 is installed"
    PYTHON=python3
elif command -v python &>/dev/null; then
    echo "✅ Python is installed"
    PYTHON=python
else
    echo "❌ Python 3 is not installed"
    echo "Please install Python 3.8-3.11 from https://www.python.org/downloads/"
    exit 1
fi

# Check Python version
PYTHON_VERSION=$($PYTHON -c 'import sys; print(f"{sys.version_info.major}.{sys.version_info.minor}")')
echo "📋 Python version: $PYTHON_VERSION"

# Check if pip is installed
if command -v pip3 &>/dev/null; then
    PIP=pip3
elif command -v pip &>/dev/null; then
    PIP=pip
else
    echo "❌ pip is not installed"
    echo "Please install pip for Python 3"
    exit 1
fi

echo "✅ Using pip: $PIP"

# Notify about using local FFmpeg
echo "✅ Using local FFmpeg from the project directory"

# Create virtual environment if it doesn't exist
VENV_DIR="$SCRIPT_DIR/whisper-venv"
if [ ! -d "$VENV_DIR" ]; then
    echo "📦 Creating virtual environment at $VENV_DIR..."
    $PYTHON -m venv "$VENV_DIR"
    if [ $? -ne 0 ]; then
        echo "❌ Failed to create virtual environment. Please install the venv module for Python."
        exit 1
    fi
else
    echo "✅ Virtual environment already exists at $VENV_DIR"
fi

# Activate virtual environment
echo "📦 Activating virtual environment..."
source "$VENV_DIR/bin/activate"

# Install or upgrade Whisper
echo "📦 Installing OpenAI Whisper in virtual environment..."
$PIP install -U openai-whisper

# Check if Whisper is now installed in the virtual environment
if $PYTHON -c "import whisper" &>/dev/null; then
    echo "✅ OpenAI Whisper has been installed successfully in the virtual environment!"
    echo "    You can now use the voice recording feature in Ramadan Reflections"
else
    echo "❌ Whisper installation failed"
    echo "   Please check the error messages above"
    deactivate
    exit 1
fi

# Create test file
echo "📝 Creating test transcription file..."
TEST_FILE="$SCRIPT_DIR/test_whisper.py"
cat > "$TEST_FILE" << 'EOF'
import whisper
import sys
import os

print("Whisper test script")
print(f"Python version: {sys.version}")
print(f"Whisper version: {whisper.__version__}")
print(f"Working directory: {os.getcwd()}")
print("Available models:", whisper.available_models())
print("Whisper seems to be working correctly!")
EOF

# Run test
echo "🧪 Testing whisper installation..."
$PYTHON "$TEST_FILE"
if [ $? -ne 0 ]; then
    echo "❌ Whisper test failed"
    deactivate
    exit 1
else
    echo "✅ Whisper test passed"
fi

# Deactivate virtual environment
deactivate

echo "======================================================"
echo "🎉 Setup completed!"
echo "    You can now use the whisper-wrapper.sh script to transcribe audio files." 