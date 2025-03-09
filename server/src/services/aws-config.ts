import { TranscribeClient } from '@aws-sdk/client-transcribe';
import dotenv from 'dotenv';

dotenv.config();

// Validate required environment variables
const requiredEnvVars = [
  'AWS_ACCESS_KEY_ID',
  'AWS_SECRET_ACCESS_KEY',
  'AWS_REGION',
  'AWS_TRANSCRIBE_MAX_DURATION_MINUTES'
];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}

// AWS Configuration
export const awsConfig = {
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!
  }
};

// Create Transcribe client instance
export const transcribeClient = new TranscribeClient(awsConfig);

// Constants
export const MAX_AUDIO_DURATION_MINUTES = parseInt(process.env.AWS_TRANSCRIBE_MAX_DURATION_MINUTES!, 10);

// Supported audio formats
export const SUPPORTED_AUDIO_FORMATS = [
  'mp3',
  'mp4',
  'wav',
  'flac',
  'ogg',
  'webm',
  'm4a'
] as const;

export type SupportedAudioFormat = typeof SUPPORTED_AUDIO_FORMATS[number];

// Utility function to check if a file format is supported
export const isAudioFormatSupported = (format: string): format is SupportedAudioFormat => {
  return SUPPORTED_AUDIO_FORMATS.includes(format as SupportedAudioFormat);
}; 