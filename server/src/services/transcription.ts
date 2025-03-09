import { 
  StartTranscriptionJobCommand,
  GetTranscriptionJobCommand,
  DeleteTranscriptionJobCommand
} from '@aws-sdk/client-transcribe';
import { transcribeClient, MAX_AUDIO_DURATION_MINUTES, isAudioFormatSupported } from './aws-config';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';

/**
 * Custom error class for transcription-related errors
 */
export class TranscriptionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TranscriptionError';
  }
}

/**
 * Interface for transcription job results
 */
export interface TranscriptionResult {
  text: string;
  jobName: string;
}

/**
 * Service for handling audio transcription using Amazon Transcribe
 * @class TranscriptionService
 */
export class TranscriptionService {
  private readonly TEMP_DIR = path.join(process.cwd(), 'temp');

  /**
   * Creates an instance of TranscriptionService.
   * Ensures temporary directory exists for file processing.
   */
  constructor() {
    // Ensure temp directory exists
    if (!fs.existsSync(this.TEMP_DIR)) {
      fs.mkdirSync(this.TEMP_DIR, { recursive: true });
    }
  }

  /**
   * Cleans up temporary files after processing
   * @private
   * @param {string} filePath - Path to the temporary file
   * @returns {Promise<void>}
   */
  private async cleanupTempFile(filePath: string): Promise<void> {
    try {
      if (fs.existsSync(filePath)) {
        await fs.promises.unlink(filePath);
      }
    } catch (error) {
      console.error('Error cleaning up temp file:', error);
    }
  }

  /**
   * Preprocesses transcribed text to improve readability
   * @private
   * @param {string} text - Raw transcribed text
   * @returns {string} Processed text with improved formatting
   */
  private preprocessTranscribedText(text: string): string {
    // Remove speaker labels
    text = text.replace(/\[.*?\]:\s*/g, '');
    
    // Normalize whitespace
    text = text.replace(/\s+/g, ' ').trim();
    
    // Ensure proper sentence capitalization
    text = text.replace(/(?<=^|[.!?])\s+([a-z])/g, (match, letter) => ` ${letter.toUpperCase()}`);
    
    return text;
  }

  /**
   * Transcribes audio data to text using Amazon Transcribe
   * @param {Buffer} audioBuffer - Audio data buffer
   * @param {string} fileExtension - Audio file extension (e.g., 'mp3', 'wav')
   * @returns {Promise<string>} Transcribed text
   * @throws {TranscriptionError} If transcription fails or format is unsupported
   */
  public async transcribeAudio(audioBuffer: Buffer, fileExtension: string): Promise<string> {
    if (!isAudioFormatSupported(fileExtension)) {
      throw new TranscriptionError(`Unsupported audio format: ${fileExtension}`);
    }

    const jobName = `transcription-${uuidv4()}`;
    const tempFilePath = path.join(this.TEMP_DIR, `${jobName}.${fileExtension}`);

    try {
      // Save audio buffer to temp file
      await fs.promises.writeFile(tempFilePath, audioBuffer);

      // Start transcription job
      const startCommand = new StartTranscriptionJobCommand({
        TranscriptionJobName: jobName,
        LanguageCode: 'en-US',
        MediaFormat: fileExtension,
        Media: {
          MediaFileUri: `file://${tempFilePath}`
        },
        Settings: {
          ShowSpeakerLabels: false,
          MaxSpeakerLabels: 2,
        }
      });

      await transcribeClient.send(startCommand);

      // Poll for job completion
      let transcriptionResult: string | null = null;
      while (!transcriptionResult) {
        const getCommand = new GetTranscriptionJobCommand({
          TranscriptionJobName: jobName
        });

        const response = await transcribeClient.send(getCommand);
        const job = response.TranscriptionJob;

        if (job?.TranscriptionJobStatus === 'COMPLETED') {
          if (job.Transcript?.TranscriptFileUri) {
            // Fetch and process transcript
            const response = await fetch(job.Transcript.TranscriptFileUri);
            const data = await response.json();
            transcriptionResult = this.preprocessTranscribedText(data.results.transcripts[0].transcript);
          }
        } else if (job?.TranscriptionJobStatus === 'FAILED') {
          throw new TranscriptionError(`Transcription job failed: ${job.FailureReason}`);
        }

        // Wait before polling again
        await new Promise(resolve => setTimeout(resolve, 5000));
      }

      // Cleanup
      await this.cleanupTempFile(tempFilePath);
      
      // Delete transcription job
      const deleteCommand = new DeleteTranscriptionJobCommand({
        TranscriptionJobName: jobName
      });
      await transcribeClient.send(deleteCommand);

      return transcriptionResult;

    } catch (error) {
      await this.cleanupTempFile(tempFilePath);
      throw new TranscriptionError(`Transcription failed: ${(error as Error).message}`);
    }
  }
} 