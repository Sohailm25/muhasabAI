import { Router } from 'express';
import multer from 'multer';
import { TranscriptionService, TranscriptionError } from '../services/transcription';
import { isAudioFormatSupported, isAwsServicesAvailable } from '../services/aws-config';

const router = Router();
const transcriptionService = new TranscriptionService();

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max file size
  },
  fileFilter: (req, file, cb) => {
    // Extract file extension from mimetype
    const fileType = file.mimetype.split('/')[1];
    if (isAudioFormatSupported(fileType)) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file type: ${fileType}`));
    }
  },
});

// Transcription endpoint
router.post('/transcribe', upload.single('audio'), async (req, res) => {
  try {
    // First check if AWS services are available
    if (!isAwsServicesAvailable()) {
      return res.status(503).json({ 
        error: 'Transcription service unavailable',
        details: 'AWS transcription services are not configured. Please check server configuration.'
      });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No audio file provided' });
    }

    const fileType = req.file.mimetype.split('/')[1];
    const transcribedText = await transcriptionService.transcribeAudio(
      req.file.buffer,
      fileType
    );

    res.json({ text: transcribedText });
  } catch (error) {
    console.error('Transcription error:', error);
    
    // Handle specific transcription errors
    if (error instanceof TranscriptionError) {
      return res.status(422).json({ 
        error: 'Transcription failed',
        details: error.message
      });
    }
    
    res.status(500).json({ 
      error: 'Failed to transcribe audio',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router; 