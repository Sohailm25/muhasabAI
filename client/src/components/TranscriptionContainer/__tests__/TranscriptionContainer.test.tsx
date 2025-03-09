/// <reference types="jest" />
import '@testing-library/jest-dom';
import React from 'react';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import { TranscriptionContainer } from '../TranscriptionContainer';
import { TranscriptionService } from '../../../services/transcriptionService';
import { toast } from 'react-hot-toast';

// Mock dependencies
jest.mock('react-hot-toast', () => ({
  success: jest.fn(),
  error: jest.fn(),
}));

jest.mock('../../../services/transcriptionService');

// Mock MediaRecorder setup (same as AudioRecorder.test.tsx)
const mockMediaRecorder = {
  start: jest.fn(),
  stop: jest.fn(),
  pause: jest.fn(),
  resume: jest.fn(),
  ondataavailable: jest.fn(),
  onstop: jest.fn(),
  state: 'inactive',
};

const mockGetUserMedia = jest.fn();
Object.defineProperty(window.navigator, 'mediaDevices', {
  value: { getUserMedia: mockGetUserMedia },
});

(global as any).MediaRecorder = jest.fn(() => mockMediaRecorder);

describe('TranscriptionContainer', () => {
  const mockOnTranscriptionComplete = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetUserMedia.mockResolvedValue({
      getTracks: () => [{ stop: jest.fn() }],
    });
  });

  it('renders the component with initial state', () => {
    render(
      <TranscriptionContainer onTranscriptionComplete={mockOnTranscriptionComplete} />
    );

    expect(screen.getByText('Voice Input')).toBeInTheDocument();
    expect(screen.getByTitle('Start Recording')).toBeInTheDocument();
  });

  it('handles successful transcription flow', async () => {
    const mockTranscribedText = 'Hello, this is a test transcription';
    (TranscriptionService.prototype.transcribeAudio as jest.Mock).mockResolvedValue(
      mockTranscribedText
    );

    render(
      <TranscriptionContainer onTranscriptionComplete={mockOnTranscriptionComplete} />
    );

    // Start recording
    await act(async () => {
      fireEvent.click(screen.getByTitle('Start Recording'));
    });

    // Stop recording
    await act(async () => {
      fireEvent.click(screen.getByTitle('Stop Recording'));
      const dataEvent = new Event('dataavailable');
      Object.defineProperty(dataEvent, 'data', { value: new Blob() });
      mockMediaRecorder.ondataavailable(dataEvent);
      mockMediaRecorder.onstop();
    });

    // Submit recording
    await act(async () => {
      fireEvent.click(screen.getByText('Submit Recording'));
    });

    await waitFor(() => {
      expect(mockOnTranscriptionComplete).toHaveBeenCalledWith(mockTranscribedText);
      expect(toast.success).toHaveBeenCalledWith('Audio transcribed successfully!');
    });
  });

  it('handles transcription failure', async () => {
    const errorMessage = 'Failed to transcribe audio';
    (TranscriptionService.prototype.transcribeAudio as jest.Mock).mockRejectedValue(
      new Error(errorMessage)
    );

    render(
      <TranscriptionContainer onTranscriptionComplete={mockOnTranscriptionComplete} />
    );

    // Start and stop recording
    await act(async () => {
      fireEvent.click(screen.getByTitle('Start Recording'));
    });

    await act(async () => {
      fireEvent.click(screen.getByTitle('Stop Recording'));
      const dataEvent = new Event('dataavailable');
      Object.defineProperty(dataEvent, 'data', { value: new Blob() });
      mockMediaRecorder.ondataavailable(dataEvent);
      mockMediaRecorder.onstop();
    });

    // Submit recording
    await act(async () => {
      fireEvent.click(screen.getByText('Submit Recording'));
    });

    await waitFor(() => {
      expect(mockOnTranscriptionComplete).not.toHaveBeenCalled();
      expect(toast.error).toHaveBeenCalledWith(errorMessage);
    });
  });

  it('shows loading screen during transcription', async () => {
    (TranscriptionService.prototype.transcribeAudio as jest.Mock).mockImplementation(
      () => new Promise(resolve => setTimeout(resolve, 100))
    );

    render(
      <TranscriptionContainer onTranscriptionComplete={mockOnTranscriptionComplete} />
    );

    // Start and stop recording
    await act(async () => {
      fireEvent.click(screen.getByTitle('Start Recording'));
    });

    await act(async () => {
      fireEvent.click(screen.getByTitle('Stop Recording'));
      const dataEvent = new Event('dataavailable');
      Object.defineProperty(dataEvent, 'data', { value: new Blob() });
      mockMediaRecorder.ondataavailable(dataEvent);
      mockMediaRecorder.onstop();
    });

    // Submit recording
    await act(async () => {
      fireEvent.click(screen.getByText('Submit Recording'));
    });

    expect(screen.getByText('Converting your voice to text...')).toBeInTheDocument();
  });
}); 