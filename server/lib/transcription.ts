import Whisper from 'node-whisper';
import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';

export async function transcribeAudio(audioBase64: string): Promise<string> {
  let tempFilePath: string | null = null;

  try {
    console.log('Starting audio transcription process...');

    // Remove the data URL prefix and create a buffer
    const base64Data = audioBase64.replace(/^data:audio\/\w+;base64,/, '');
    const audioBuffer = Buffer.from(base64Data, 'base64');

    // Create a temporary WAV file
    const tempDir = path.join(process.cwd(), 'temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    tempFilePath = path.join(tempDir, `${randomUUID()}.wav`);
    fs.writeFileSync(tempFilePath, audioBuffer);

    console.log('Temporary audio file created:', tempFilePath);

    // Use Whisper with correct parameters
    console.log('Starting Whisper transcription...');
    try {
      const result = await Whisper(tempFilePath, {
        modelName: "base", // Changed from model to modelName
        language: "en",
        temperature: 0,
        task: "transcribe" 
      });

      console.log('Raw transcription result:', result);

      // Handle the result which contains file references
      if (result && result.txt && typeof result.txt.getContent === 'function') {
        const transcription = await result.txt.getContent();
        console.log('Processed transcription:', transcription);

        if (!transcription || transcription.trim().length === 0) {
          throw new Error('No speech detected in audio');
        }

        return transcription.trim();
      } else {
        console.error('Invalid result structure:', result);
        throw new Error('Invalid transcription result format');
      }

    } catch (whisperError) {
      console.error('Whisper transcription error:', whisperError);
      throw new Error(`Transcription failed: ${whisperError.message}`);
    }
  } catch (error) {
    console.error('Detailed transcription error:', error);
    if (error instanceof Error) {
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    throw new Error('Failed to transcribe audio: ' + (error instanceof Error ? error.message : 'Unknown error'));
  } finally {
    // Clean up temporary file
    if (tempFilePath && fs.existsSync(tempFilePath)) {
      try {
        fs.unlinkSync(tempFilePath);
        console.log('Temporary audio file cleaned up');
      } catch (cleanupError) {
        console.error('Error cleaning up temporary file:', cleanupError);
      }
    }
  }
}