import { 
  StartTranscriptionJobCommand,
  GetTranscriptionJobCommand,
  DeleteTranscriptionJobCommand,
  MediaFormat
} from '@aws-sdk/client-transcribe';
import { transcribeClient, isAudioFormatSupported, uploadToS3 } from './aws-config';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import os from 'os';

// Helper function to add delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Convert file extension to AWS MediaFormat
function getMediaFormat(fileExtension: string): MediaFormat {
  const format = fileExtension.toLowerCase();
  switch (format) {
    case 'mp3':
      return MediaFormat.MP3;
    case 'mp4':
      return MediaFormat.MP4;
    case 'wav':
    case 'x-wav':
    case 'wave':
      return MediaFormat.WAV;
    case 'flac':
      return MediaFormat.FLAC;
    case 'ogg':
    case 'x-ogg':
    case 'opus':
    case 'vorbis':
      return MediaFormat.OGG;
    case 'webm':
      return MediaFormat.WEBM;
    default:
      throw new Error(`Unsupported audio format: ${format}`);
  }
}

export class TranscriptionService {
  private readonly TEMP_DIR: string;

  constructor() {
    this.TEMP_DIR = path.join(os.tmpdir(), uuidv4());
    fs.mkdirSync(this.TEMP_DIR, { recursive: true });
  }

  private async cleanupTempDir(): Promise<void> {
    try {
      await fs.promises.rm(this.TEMP_DIR, { recursive: true, force: true });
      console.log('Cleaned up temporary directory:', this.TEMP_DIR);
    } catch (error) {
      console.error('Error cleaning up temp directory:', error);
    }
  }

  public async transcribeAudio(audioBuffer: Buffer, fileExtension: string): Promise<string> {
    console.log('Starting transcription process...');
    console.log(`Input audio format: ${fileExtension}`);
    console.log(`Audio buffer size: ${audioBuffer.length} bytes`);

    // Add audio buffer analysis
    let hasAudioContent = false;
    let maxValue = 0;
    for (let i = 0; i < audioBuffer.length; i++) {
      const value = Math.abs(audioBuffer[i]);
      maxValue = Math.max(maxValue, value);
      if (value > 10) { // Check if there's any significant audio data
        hasAudioContent = true;
      }
    }
    
    console.log('Audio analysis:', {
      maxAmplitude: maxValue,
      hasAudioContent,
      bufferLength: audioBuffer.length,
      averageValue: audioBuffer.reduce((sum, val) => sum + Math.abs(val), 0) / audioBuffer.length
    });

    if (!hasAudioContent) {
      throw new Error(
        'No audio signal detected. Please check:\n' +
        '1. Your microphone is properly connected and selected\n' +
        '2. Your microphone permissions are enabled\n' +
        '3. Your microphone is not muted in your system settings'
      );
    }

    if (audioBuffer.length < 1024) { // Less than 1KB
      throw new Error(
        'Audio file is too short. Please ensure:\n' +
        '1. You are recording for at least 1-2 seconds\n' +
        '2. Your microphone is capturing audio properly'
      );
    }

    if (!isAudioFormatSupported(fileExtension)) {
      throw new Error(`Unsupported audio format: ${fileExtension}`);
    }

    const jobName = `transcription-${uuidv4()}`;
    const s3Key = `audio-uploads/${jobName}.${fileExtension}`;

    try {
      // Upload audio file to S3
      console.log('Uploading audio file to S3...');
      const s3Uri = await uploadToS3(
        audioBuffer,
        s3Key,
        `audio/${fileExtension}`
      );
      console.log('Audio file uploaded to S3:', s3Uri);

      // Start transcription job
      const startCommand = new StartTranscriptionJobCommand({
        TranscriptionJobName: jobName,
        LanguageCode: 'en-US',
        MediaFormat: getMediaFormat(fileExtension),
        Media: {
          MediaFileUri: s3Uri
        },
        Settings: {
          ShowAlternatives: false
        }
      });

      console.log('Starting transcription job with config:', {
        jobName,
        format: getMediaFormat(fileExtension),
        uri: s3Uri,
        size: audioBuffer.length,
        hasAudioContent,
        maxAmplitude: maxValue
      });
      
      try {
        await transcribeClient.send(startCommand);
      } catch (error: any) {
        console.error('Error starting transcription job:', error);
        throw new Error(`Failed to start transcription: ${error.message}`);
      }

      // Poll for job completion
      let transcription = '';
      let attempts = 0;
      const maxAttempts = 30; // 5 minutes with 10-second intervals

      while (attempts < maxAttempts) {
        const getCommand = new GetTranscriptionJobCommand({
          TranscriptionJobName: jobName
        });

        console.log(`Checking transcription status (attempt ${attempts + 1}/${maxAttempts})...`);
        const response = await transcribeClient.send(getCommand);
        const status = response.TranscriptionJob?.TranscriptionJobStatus;
        console.log('Transcription job status:', status);

        if (status === 'COMPLETED' && response.TranscriptionJob?.Transcript?.TranscriptFileUri) {
          console.log('Transcription completed. Fetching results from:', response.TranscriptionJob.Transcript.TranscriptFileUri);
          try {
            // Fetch the transcript from the provided URI
            const transcriptResponse = await fetch(response.TranscriptionJob.Transcript.TranscriptFileUri);
            const transcriptData = await transcriptResponse.json();
            
            console.log('Full transcript data:', JSON.stringify(transcriptData, null, 2));
            console.log('Transcript results structure:', {
              hasResults: !!transcriptData.results,
              hasTranscripts: !!transcriptData.results?.transcripts,
              transcriptsLength: transcriptData.results?.transcripts?.length,
              firstTranscript: transcriptData.results?.transcripts?.[0]
            });

            if (!transcriptData.results?.transcripts?.[0]) {
              console.error('Invalid transcript data structure - missing transcripts array');
              throw new Error('Invalid transcript format received - missing transcripts');
            }

            const transcript = transcriptData.results.transcripts[0];
            console.log('Individual transcript object:', transcript);

            if (typeof transcript.transcript !== 'string') {
              console.error('Invalid transcript format - transcript is not a string:', transcript);
              throw new Error('Invalid transcript format received - transcript is not a string');
            }

            transcription = transcript.transcript;
            if (!transcription || transcription.trim().length === 0) {
              console.error('Empty transcript received');
              throw new Error(
                'No speech detected in the audio. Please ensure:\n' +
                '1. You are speaking clearly into the microphone\n' +
                '2. Your microphone volume is not muted\n' +
                '3. The recording is at least 1-2 seconds long'
              );
            }

            console.log('Transcription result received:', {
              length: transcription.length,
              preview: transcription.substring(0, 100) + '...',
              hasContent: transcription.trim().length > 0
            });
            return transcription;
          } catch (error: any) {
            console.error('Error fetching transcript:', error);
            throw new Error(`Failed to fetch transcript: ${error.message}`);
          }
        } else if (status === 'FAILED') {
          const error = response.TranscriptionJob?.FailureReason || 'Unknown error';
          console.error('Transcription job failed:', error);
          throw new Error(`Transcription job failed: ${error}`);
        }

        attempts++;
        if (attempts < maxAttempts) {
          console.log(`Waiting ${10} seconds before next check...`);
          await delay(10000); // Wait 10 seconds before next poll
        }
      }

      console.error('Transcription timed out after', attempts, 'attempts');
      throw new Error('Transcription timed out');
    } catch (error) {
      console.error('Error during transcription:', error);
      throw error;
    }
  }
}