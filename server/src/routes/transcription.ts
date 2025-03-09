import { Router } from 'express';
import multer from 'multer';
import { TranscriptionService } from '../services/transcription';
import { isAudioFormatSupported } from '../services/aws-config';

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
    res.status(500).json({ 
      error: 'Failed to transcribe audio',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router; 