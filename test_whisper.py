import whisper
import sys
import os

print("Whisper test script")
print(f"Python version: {sys.version}")
print(f"Whisper version: {whisper.__version__}")
print(f"Working directory: {os.getcwd()}")
print("Available models:", whisper.available_models())
print("Whisper seems to be working correctly!")
