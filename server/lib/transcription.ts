import { exec, ExecException } from 'child_process';
import fs from 'fs';
import { promisify } from 'util';
import path from 'path';
import os from 'os';
import { randomUUID } from 'crypto';

const execAsync = promisify(exec);

interface WhisperResult {
  text: string;
}

// Function to transcribe audio using local whisper (with a wrapper script)
export async function transcribeAudio(audioBase64: string): Promise<string> {
  try {
    // Create a temporary directory for processing
    const tempDir = path.join(os.tmpdir(), randomUUID());
    fs.mkdirSync(tempDir, { recursive: true });
    
    // Create a temporary file for the audio
    const tempFilePath = path.join(tempDir, 'audio.webm');
    const buffer = Buffer.from(audioBase64, 'base64');
    fs.writeFileSync(tempFilePath, buffer);
    
    console.log(`Transcribing audio file: ${tempFilePath}`);
    
    // Use the wrapper script (absolute path to project root + whisper-wrapper.sh)
    const projectRoot = path.resolve(__dirname, '..', '..');
    const whisperWrapperPath = path.join(projectRoot, 'whisper-wrapper.sh');
    
    // Make sure the wrapper script is executable
    await execAsync(`chmod +x ${whisperWrapperPath}`);
    
    // Run the transcription using the wrapper script
    const { stdout, stderr } = await execAsync(`${whisperWrapperPath} ${tempFilePath} --model base --language en --temperature 0 --task transcribe --output_dir ${tempDir}`);
    
    console.log('Transcription completed');
    console.log('stdout:', stdout);
    
    if (stderr) {
      console.error('stderr:', stderr);
    }
    
    // Read the transcription result
    const textFilePath = path.join(tempDir, 'audio.txt');
    const transcription = fs.readFileSync(textFilePath, 'utf8').trim();
    
    // Clean up temporary files
    fs.rmSync(tempDir, { recursive: true, force: true });
    
    return transcription;
  } catch (error) {
    console.error('Error during transcription:', error);
    throw new Error(`Transcription failed: ${(error as Error).message}`);
  }
}