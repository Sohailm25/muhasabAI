#!/bin/bash

# Ramadan Reflections - Whisper Installation Helper
echo "🔊 Ramadan Reflections - Whisper Installation Helper"
echo "======================================================"

# Check if Python is installed
if command -v python3 &>/dev/null; then
    echo "✅ Python 3 is installed"
else
    echo "❌ Python 3 is not installed"
    echo "Please install Python 3.8-3.11 from https://www.python.org/downloads/"
    exit 1
fi

# Check Python version
PYTHON_VERSION=$(python3 -c 'import sys; print(f"{sys.version_info.major}.{sys.version_info.minor}")')
echo "📋 Python version: $PYTHON_VERSION"

# Check if pip is installed
if command -v pip3 &>/dev/null; then
    echo "✅ pip is installed"
else
    echo "❌ pip is not installed"
    echo "Please install pip for Python 3"
    exit 1
fi

# Check if FFmpeg is installed
if command -v ffmpeg &>/dev/null; then
    echo "✅ FFmpeg is installed"
else
    echo "❌ FFmpeg is not installed"
    echo "FFmpeg is required for Whisper. Please install it first."
    
    # Detect OS and suggest installation method
    if [[ "$OSTYPE" == "darwin"* ]]; then
        echo "  For macOS: brew install ffmpeg"
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        echo "  For Ubuntu/Debian: sudo apt update && sudo apt install ffmpeg"
        echo "  For Arch Linux: sudo pacman -S ffmpeg"
    elif [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
        echo "  For Windows: choco install ffmpeg or scoop install ffmpeg"
    fi
    
    exit 1
fi

# Install or upgrade Whisper
echo "📦 Installing OpenAI Whisper..."
pip3 install -U openai-whisper

# Check if Whisper is now installed
if command -v whisper &>/dev/null; then
    echo "✅ OpenAI Whisper CLI has been installed successfully!"
    echo "    You can now use the voice recording feature in Ramadan Reflections"
else
    echo "⚠️ Whisper was installed but the CLI command is not in your PATH"
    echo "   You may need to add your Python bin directory to your PATH variable."
    
    # Get Python bin directory
    PYTHON_BIN_DIR=$(python3 -c 'import sys; import os; print(os.path.dirname(sys.executable))')
    echo "   Try adding this to your PATH: $PYTHON_BIN_DIR"
fi

echo "======================================================"
echo "🎉 Setup completed!" 