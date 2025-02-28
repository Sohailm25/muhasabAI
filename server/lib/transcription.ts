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

    // Use Whisper as a function with proper error handling
    console.log('Starting Whisper transcription...');
    try {
      const result = await Whisper(tempFilePath, {
        model: "base", 
        language: "en",
        temperature: 0,
        task: "transcribe" 
      });

      console.log('Raw transcription result:', result);

      // Extract text from the result
      let transcription = '';
      if (typeof result === 'string') {
        transcription = result;
      } else if (result && typeof result === 'object') {
        // Handle different result formats
        transcription = result.text || result.transcription || result.toString();
      }

      console.log('Processed transcription:', transcription);

      if (!transcription || transcription.trim().length === 0) {
        throw new Error('No speech detected in audio');
      }

      return transcription;
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