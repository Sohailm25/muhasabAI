import Whisper from 'node-whisper';
import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';

export async function transcribeAudio(audioBase64: string): Promise<string> {
  let tempFilePath: string | null = null;
  let tempDir: string | null = null;

  try {
    console.log('Starting audio transcription process...');

    // Remove the data URL prefix and create a buffer
    const base64Data = audioBase64.replace(/^data:audio\/\w+;base64,/, '');
    const audioBuffer = Buffer.from(base64Data, 'base64');

    // Create a temporary directory for all Whisper files
    tempDir = path.join(process.cwd(), 'temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    // Generate unique filename
    const fileId = randomUUID();
    tempFilePath = path.join(tempDir, `${fileId}.wav`);
    fs.writeFileSync(tempFilePath, audioBuffer);

    console.log('Temporary audio file created:', tempFilePath);

    // Use Whisper with correct parameters and working directory
    console.log('Starting Whisper transcription...');
    const result = await Whisper(tempFilePath, {
      modelName: "base",
      language: "en",
      temperature: 0,
      task: "transcribe",
      outputDir: tempDir // Specify output directory for Whisper
    });

    console.log('Raw transcription result:', result);

    // Handle the result which contains file references
    if (result && result.txt) {
      // Construct the correct path to the txt file
      const txtPath = path.join(tempDir, path.basename(result.txt.file));
      console.log('Looking for transcription file at:', txtPath);

      const transcription = await fs.promises.readFile(txtPath, 'utf-8');
      console.log('Processed transcription:', transcription);

      if (!transcription || transcription.trim().length === 0) {
        throw new Error('No speech detected in audio');
      }

      return transcription.trim();
    } else {
      console.error('Invalid result structure:', result);
      throw new Error('Invalid transcription result format');
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
    // Clean up temporary files
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