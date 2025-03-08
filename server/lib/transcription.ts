import { exec, ExecException } from 'child_process';
import fs from 'fs';
import { promisify } from 'util';
import path from 'path';
import os from 'os';
import { randomUUID } from 'crypto';
import { OpenAI } from 'openai';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const execAsync = promisify(exec);

// Initialize OpenAI client with increased timeout
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  timeout: 60000, // 60 seconds timeout
  maxRetries: 3,  // Allow up to 3 retries
});

interface WhisperResult {
  text: string;
}

// Helper function to add delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Function for retrying API calls
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  initialDelay: number = 1000
): Promise<T> {
  let retries = 0;
  let currentDelay = initialDelay;

  while (true) {
    try {
      return await fn();
    } catch (error) {
      retries++;
      console.log(`API call failed, attempt ${retries}/${maxRetries}`);
      
      if (retries >= maxRetries) {
        console.error('Maximum retries reached, failing', error);
        throw error;
      }
      
      // Log the error for debugging
      console.log(`Retrying after ${currentDelay}ms due to error:`, error);
      
      // Wait before retrying
      await delay(currentDelay);
      
      // Exponential backoff
      currentDelay *= 2;
    }
  }
}

// Function to transcribe audio using OpenAI's Whisper API
export async function transcribeAudio(audioBase64: string): Promise<string> {
  let tempDir = '';
  
  try {
    // Create a temporary directory for processing
    tempDir = path.join(os.tmpdir(), randomUUID());
    fs.mkdirSync(tempDir, { recursive: true });
    
    console.log(`Created temporary directory: ${tempDir}`);
    
    // Get the project root directory
    const projectRoot = path.resolve(__dirname, '..', '..');
    console.log(`Project root: ${projectRoot}`);
    
    // Extract base64 data from data URL if needed
    let base64Data = audioBase64;
    let audioFormat = 'webm';
    
    if (audioBase64.startsWith('data:')) {
      // Get the MIME type and base64 data
      const matches = audioBase64.match(/^data:([^;]+);base64,(.+)$/);
      if (matches && matches.length > 2) {
        const mimeType = matches[1];
        base64Data = matches[2];
        console.log(`Detected MIME type: ${mimeType}`);
        
        // Determine the audio format from MIME type
        if (mimeType.includes('webm')) {
          audioFormat = 'webm';
        } else if (mimeType.includes('wav')) {
          audioFormat = 'wav';
        } else if (mimeType.includes('mp3')) {
          audioFormat = 'mp3';
        } else if (mimeType.includes('ogg')) {
          audioFormat = 'ogg';
        } else {
          console.log(`Unknown audio format from MIME type: ${mimeType}, defaulting to webm`);
        }
      } else {
        console.error('Invalid base64 data URL format');
        audioFormat = 'webm'; // Default to webm
      }
    }
    
    console.log(`Audio format detected: ${audioFormat}`);
    
    // Save the original audio file with proper extension
    const audioFilePath = path.join(tempDir, `audio.${audioFormat}`);
    const buffer = Buffer.from(base64Data, 'base64');
    fs.writeFileSync(audioFilePath, buffer);
    
    console.log(`Saved audio to: ${audioFilePath}`);
    console.log(`Audio file size: ${buffer.length} bytes`);
    
    // Check if the audio file exists and has content
    if (fs.existsSync(audioFilePath)) {
      const stats = fs.statSync(audioFilePath);
      console.log(`Audio file exists, size: ${stats.size} bytes`);
      
      if (stats.size === 0) {
        throw new Error('Audio file is empty (0 bytes)');
      }
    } else {
      console.error('Audio file does not exist after writing');
      throw new Error('Failed to save audio file');
    }
    
    // Transcribe using OpenAI's Whisper API
    console.log('Starting transcription with OpenAI Whisper API...');
    
    // Call the OpenAI API for transcription with retry mechanism
    try {
      // Wrap the API call in our retry function
      const transcription = await retryWithBackoff(
        async () => {
          // Create a fresh readable stream each time
          const audioFile = fs.createReadStream(audioFilePath);
          
          return await openai.audio.transcriptions.create({
            model: "whisper-1",  // This is the Whisper V2 large model
            file: audioFile,
            language: "en",      // Specify English language
          });
        }, 
        3,   // Max retries
        2000 // Initial delay of 2 seconds
      );
      
      console.log('Transcription completed successfully');
      console.log(`Transcription result: ${transcription.text}`);
      
      // Clean up temporary files
      try {
        fs.rmSync(tempDir, { recursive: true, force: true });
        console.log(`Cleaned up temporary directory: ${tempDir}`);
      } catch (cleanupError) {
        console.error(`Error cleaning up: ${(cleanupError as Error).message}`);
        // Continue despite cleanup error
      }
      
      return transcription.text;
    } catch (apiError) {
      // Check for specific API errors
      const error = apiError as any;
      
      if (error.code === 'ECONNRESET') {
        console.error('Connection reset by OpenAI API. This might be due to network issues or server timeout.');
      } else if (error.status === 401) {
        console.error('Authentication error: Invalid API key or unauthorized access.');
      } else if (error.status === 429) {
        console.error('Rate limit exceeded: Your account has hit rate limits with the OpenAI API.');
      } else if (error.status >= 500) {
        console.error('OpenAI server error: The API is experiencing issues on the server side.');
      }
      
      console.error('Error during OpenAI API call:', apiError);
      throw new Error(`OpenAI API transcription failed: ${(apiError as Error).message}`);
    }
    
  } catch (error) {
    console.error('Error during transcription:', error);
    
    // Attempt to clean up on error if tempDir was created
    if (tempDir && fs.existsSync(tempDir)) {
      try {
        fs.rmSync(tempDir, { recursive: true, force: true });
        console.log(`Cleaned up temporary directory on error: ${tempDir}`);
      } catch (cleanupError) {
        console.error(`Error cleaning up on failure: ${(cleanupError as Error).message}`);
      }
    }
    
    throw new Error(`Transcription failed: ${(error as Error).message}`);
  }
}