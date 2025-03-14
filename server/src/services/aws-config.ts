import { TranscribeClient } from '@aws-sdk/client-transcribe';
import dotenv from 'dotenv';

dotenv.config();

// Flag to check if AWS services should be enabled
const isAwsEnabled = !!process.env.AWS_ACCESS_KEY_ID && 
                     !!process.env.AWS_SECRET_ACCESS_KEY && 
                     !!process.env.AWS_REGION;

// Check if we're in production environment
const isProduction = process.env.NODE_ENV === 'production';

// AWS variables that should be required in production
const requiredEnvVars = [
  'AWS_ACCESS_KEY_ID',
  'AWS_SECRET_ACCESS_KEY',
  'AWS_REGION',
  'AWS_TRANSCRIBE_MAX_DURATION_MINUTES'
];

// Only validate required environment variables in production
if (isProduction) {
  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      throw new Error(`Missing required environment variable: ${envVar}`);
    }
  }
}

// AWS Configuration
export const awsConfig = isAwsEnabled ? {
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!
  }
} : null;

// Create Transcribe client instance conditionally
export const transcribeClient = isAwsEnabled 
  ? new TranscribeClient(awsConfig!)
  : null as unknown as TranscribeClient; // Type assertion for compatibility

// Constants
export const MAX_AUDIO_DURATION_MINUTES = parseInt(process.env.AWS_TRANSCRIBE_MAX_DURATION_MINUTES || '30', 10);

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

// Utility function to check if AWS services are available
export const isAwsServicesAvailable = () => {
  if (!isAwsEnabled) {
    console.warn('AWS services are not configured. Some features will be unavailable.');
    return false;
  }
  return true;
} 