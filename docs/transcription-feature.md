# Audio Transcription Feature

## Overview
The audio transcription feature allows users to record audio and convert it to text using Amazon Transcribe. This document outlines the implementation details, setup requirements, and usage guidelines.

## Features
- Real-time audio recording with pause/resume functionality
- Support for multiple audio formats (MP3, WAV, WebM, etc.)
- Maximum recording duration limit (15 minutes by default)
- Dynamic loading screen with status updates
- Error handling and user feedback
- Automatic cleanup of temporary files

## Prerequisites
- AWS Account with access to Amazon Transcribe service
- AWS credentials with appropriate permissions
- Node.js and npm installed

## Environment Variables
```env
AWS_ACCESS_KEY_ID=your_access_key_here
AWS_SECRET_ACCESS_KEY=your_secret_key_here
AWS_REGION=your_region_here
AWS_TRANSCRIBE_MAX_DURATION_MINUTES=15
```

## Component Structure
```
client/
├── src/
│   ├── components/
│   │   ├── AudioRecorder/
│   │   │   ├── AudioRecorder.tsx
│   │   │   └── __tests__/
│   │   ├── TranscriptionContainer/
│   │   │   ├── TranscriptionContainer.tsx
│   │   │   └── __tests__/
│   │   └── TranscriptionLoading/
│   │       └── TranscriptionLoading.tsx
│   ├── services/
│   │   └── transcriptionService.ts
│   └── utils/
│       └── formatDuration.ts

server/
├── src/
│   ├── routes/
│   │   └── transcription.ts
│   └── services/
│       ├── aws-config.ts
│       ├── transcription.ts
│       └── __tests__/
```

## API Endpoints

### POST /api/transcribe
Transcribes an audio file to text.

**Request:**
- Method: POST
- Content-Type: multipart/form-data
- Body: Form data with 'audio' file

**Response:**
```json
{
  "text": "Transcribed text content"
}
```

**Error Response:**
```json
{
  "error": "Error message",
  "details": "Detailed error information"
}
```

## Usage Example
```typescript
import { TranscriptionContainer } from '@/components/TranscriptionContainer';

function MyComponent() {
  const handleTranscriptionComplete = (text: string) => {
    console.log('Transcribed text:', text);
  };

  return (
    <TranscriptionContainer
      onTranscriptionComplete={handleTranscriptionComplete}
      maxDurationMinutes={15}
    />
  );
}
```

## Testing
The feature includes comprehensive test coverage:
- Unit tests for services and utilities
- Component tests for UI elements
- Integration tests for the complete flow

Run tests using:
```bash
npm test
```

## Security Considerations
- AWS credentials are stored securely in environment variables
- Temporary files are automatically cleaned up
- File size limits prevent abuse
- Input validation for supported formats
- CORS configuration for API endpoints

## Error Handling
The feature includes robust error handling for:
- Unsupported audio formats
- Microphone permission denials
- Network failures
- AWS service errors
- File system errors

## Performance Optimization
- Streams audio data in chunks
- Cleans up resources automatically
- Uses memory storage for temporary files
- Implements proper cleanup mechanisms

## Limitations
- Maximum audio duration: 15 minutes
- Maximum file size: 50MB
- English language support only (currently)
- Requires microphone permissions
- Browser compatibility: Modern browsers only

## Future Improvements
1. Add support for additional languages
2. Implement real-time transcription
3. Add audio visualization
4. Support for longer recordings
5. Implement caching mechanism
6. Add progress tracking for transcription
7. Support for custom vocabularies
8. Implement batch processing 