import { TranscriptionService, TranscriptionError } from '../transcription';
import { transcribeClient } from '../aws-config';
import { mockClient } from 'aws-sdk-client-mock';
import {
  StartTranscriptionJobCommand,
  GetTranscriptionJobCommand,
  DeleteTranscriptionJobCommand,
} from '@aws-sdk/client-transcribe';
import fs from 'fs';
import path from 'path';

jest.mock('fs', () => ({
  promises: {
    writeFile: jest.fn(),
    unlink: jest.fn(),
  },
  existsSync: jest.fn(),
  mkdirSync: jest.fn(),
}));

const transcribeMock = mockClient(transcribeClient);

describe('TranscriptionService', () => {
  let service: TranscriptionService;
  const testAudioBuffer = Buffer.from('test audio content');
  const testFileExtension = 'mp3';

  beforeEach(() => {
    jest.clearAllMocks();
    transcribeMock.reset();
    
    // Mock filesystem operations
    (fs.existsSync as jest.Mock).mockReturnValue(true);
    (fs.promises.writeFile as jest.Mock).mockResolvedValue(undefined);
    (fs.promises.unlink as jest.Mock).mockResolvedValue(undefined);
  });

  beforeAll(() => {
    service = new TranscriptionService();
  });

  it('should successfully transcribe audio', async () => {
    const mockTranscript = { results: { transcripts: [{ transcript: 'Hello world' }] } };
    
    // Mock successful transcription job
    transcribeMock
      .on(StartTranscriptionJobCommand)
      .resolves({})
      .on(GetTranscriptionJobCommand)
      .resolves({
        TranscriptionJob: {
          TranscriptionJobStatus: 'COMPLETED',
          Transcript: {
            TranscriptFileUri: 'https://example.com/transcript.json'
          }
        }
      })
      .on(DeleteTranscriptionJobCommand)
      .resolves({});

    // Mock fetch for transcript
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockTranscript)
    });

    const result = await service.transcribeAudio(testAudioBuffer, testFileExtension);
    expect(result).toBe('Hello world');
  });

  it('should throw error for unsupported file format', async () => {
    await expect(service.transcribeAudio(testAudioBuffer, 'invalid'))
      .rejects
      .toThrow(TranscriptionError);
  });

  it('should handle transcription job failure', async () => {
    transcribeMock
      .on(StartTranscriptionJobCommand)
      .resolves({})
      .on(GetTranscriptionJobCommand)
      .resolves({
        TranscriptionJob: {
          TranscriptionJobStatus: 'FAILED',
          FailureReason: 'Test failure'
        }
      });

    await expect(service.transcribeAudio(testAudioBuffer, testFileExtension))
      .rejects
      .toThrow('Transcription job failed: Test failure');
  });

  it('should clean up temporary files after successful transcription', async () => {
    const mockTranscript = { results: { transcripts: [{ transcript: 'Hello world' }] } };
    
    transcribeMock
      .on(StartTranscriptionJobCommand)
      .resolves({})
      .on(GetTranscriptionJobCommand)
      .resolves({
        TranscriptionJob: {
          TranscriptionJobStatus: 'COMPLETED',
          Transcript: {
            TranscriptFileUri: 'https://example.com/transcript.json'
          }
        }
      })
      .on(DeleteTranscriptionJobCommand)
      .resolves({});

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockTranscript)
    });

    await service.transcribeAudio(testAudioBuffer, testFileExtension);
    expect(fs.promises.unlink).toHaveBeenCalled();
  });

  it('should clean up temporary files after failed transcription', async () => {
    transcribeMock
      .on(StartTranscriptionJobCommand)
      .rejects(new Error('AWS Error'));

    await expect(service.transcribeAudio(testAudioBuffer, testFileExtension))
      .rejects
      .toThrow();

    expect(fs.promises.unlink).toHaveBeenCalled();
  });
}); 