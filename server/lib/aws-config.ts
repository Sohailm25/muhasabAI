import { TranscribeClient } from '@aws-sdk/client-transcribe';
import { 
  S3Client, 
  PutObjectCommand,
  CreateBucketCommand,
  HeadBucketCommand,
  BucketLocationConstraint
} from '@aws-sdk/client-s3';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Validate required AWS environment variables
const requiredEnvVars = [
  'AWS_ACCESS_KEY_ID',
  'AWS_SECRET_ACCESS_KEY',
  'AWS_REGION',
  'AWS_S3_BUCKET'
];
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  throw new Error(`Missing required AWS environment variables: ${missingVars.join(', ')}`);
}

// Create AWS clients
const awsConfig = {
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!
  }
};

export const transcribeClient = new TranscribeClient(awsConfig);
export const s3Client = new S3Client(awsConfig);

// Helper function to check if audio format is supported
export function isAudioFormatSupported(format: string): boolean {
  const supportedFormats = [
    'mp3', 'mp4', 
    'wav', 'x-wav', 'wave',
    'flac',
    'ogg', 'x-ogg', 'opus', 'vorbis',
    'webm'
  ];
  return supportedFormats.includes(format.toLowerCase());
}

// Export constants
export const MAX_AUDIO_DURATION_MINUTES = parseInt(process.env.AWS_TRANSCRIBE_MAX_DURATION_MINUTES || '15', 10);
export const S3_BUCKET = process.env.AWS_S3_BUCKET!;

// Helper function to check if bucket exists
async function doesBucketExist(bucket: string): Promise<boolean> {
  try {
    await s3Client.send(new HeadBucketCommand({ Bucket: bucket }));
    return true;
  } catch (error: any) {
    if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
      return false;
    }
    throw error;
  }
}

// Helper function to create bucket if it doesn't exist
async function ensureBucketExists(bucket: string): Promise<void> {
  try {
    const exists = await doesBucketExist(bucket);
    if (!exists) {
      console.log(`Creating S3 bucket: ${bucket}`);
      const command = new CreateBucketCommand({
        Bucket: bucket,
        CreateBucketConfiguration: {
          LocationConstraint: process.env.AWS_REGION as BucketLocationConstraint
        }
      });
      await s3Client.send(command);
      console.log(`S3 bucket created successfully: ${bucket}`);
    } else {
      console.log(`S3 bucket already exists: ${bucket}`);
    }
  } catch (error) {
    console.error('Error ensuring bucket exists:', error);
    throw error;
  }
}

// Helper function to upload file to S3
export async function uploadToS3(fileBuffer: Buffer, key: string, contentType: string): Promise<string> {
  // Ensure bucket exists before uploading
  await ensureBucketExists(S3_BUCKET);

  const command = new PutObjectCommand({
    Bucket: S3_BUCKET,
    Key: key,
    Body: fileBuffer,
    ContentType: contentType
  });

  try {
    await s3Client.send(command);
    console.log(`File uploaded successfully to s3://${S3_BUCKET}/${key}`);
    return `s3://${S3_BUCKET}/${key}`;
  } catch (error) {
    console.error('Error uploading file to S3:', error);
    throw error;
  }
} 