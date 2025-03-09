/// <reference types="jest" />
import '@testing-library/jest-dom';
import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { AudioRecorder } from '../AudioRecorder';

// Mock MediaRecorder
const mockMediaRecorder = {
  start: jest.fn(),
  stop: jest.fn(),
  pause: jest.fn(),
  resume: jest.fn(),
  ondataavailable: jest.fn(),
  onstop: jest.fn(),
  state: 'inactive',
};

// Mock getUserMedia
const mockGetUserMedia = jest.fn();
Object.defineProperty(window.navigator, 'mediaDevices', {
  value: {
    getUserMedia: mockGetUserMedia,
  },
});

// Mock MediaRecorder constructor
(global as any).MediaRecorder = jest.fn(() => mockMediaRecorder);

describe('AudioRecorder', () => {
  const mockOnRecordingComplete = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetUserMedia.mockResolvedValue({
      getTracks: () => [{ stop: jest.fn() }],
    });
  });

  it('renders start recording button initially', () => {
    render(<AudioRecorder onRecordingComplete={mockOnRecordingComplete} />);
    expect(screen.getByTitle('Start Recording')).toBeInTheDocument();
  });

  it('shows recording controls when recording starts', async () => {
    render(<AudioRecorder onRecordingComplete={mockOnRecordingComplete} />);
    
    const startButton = screen.getByTitle('Start Recording');
    await act(async () => {
      fireEvent.click(startButton);
    });

    expect(screen.getByTitle('Pause Recording')).toBeInTheDocument();
    expect(screen.getByTitle('Stop Recording')).toBeInTheDocument();
  });

  it('shows pause/resume button when recording is paused/resumed', async () => {
    render(<AudioRecorder onRecordingComplete={mockOnRecordingComplete} />);
    
    // Start recording
    await act(async () => {
      fireEvent.click(screen.getByTitle('Start Recording'));
    });

    // Pause recording
    const pauseButton = screen.getByTitle('Pause Recording');
    await act(async () => {
      fireEvent.click(pauseButton);
    });

    expect(screen.getByTitle('Resume Recording')).toBeInTheDocument();

    // Resume recording
    const resumeButton = screen.getByTitle('Resume Recording');
    await act(async () => {
      fireEvent.click(resumeButton);
    });

    expect(screen.getByTitle('Pause Recording')).toBeInTheDocument();
  });

  it('shows submit button after stopping recording', async () => {
    render(<AudioRecorder onRecordingComplete={mockOnRecordingComplete} />);
    
    // Start recording
    await act(async () => {
      fireEvent.click(screen.getByTitle('Start Recording'));
    });

    // Stop recording
    await act(async () => {
      fireEvent.click(screen.getByTitle('Stop Recording'));
      // Simulate ondataavailable and onstop events
      const dataEvent = new Event('dataavailable');
      Object.defineProperty(dataEvent, 'data', { value: new Blob() });
      mockMediaRecorder.ondataavailable(dataEvent);
      mockMediaRecorder.onstop();
    });

    expect(screen.getByText('Submit Recording')).toBeInTheDocument();
  });

  it('handles microphone permission denial', async () => {
    mockGetUserMedia.mockRejectedValue(new Error('Permission denied'));
    
    render(<AudioRecorder onRecordingComplete={mockOnRecordingComplete} />);
    
    await act(async () => {
      fireEvent.click(screen.getByTitle('Start Recording'));
    });

    // The start button should still be visible after permission denial
    expect(screen.getByTitle('Start Recording')).toBeInTheDocument();
  });

  it('shows progress bar during recording', async () => {
    render(<AudioRecorder onRecordingComplete={mockOnRecordingComplete} />);
    
    await act(async () => {
      fireEvent.click(screen.getByTitle('Start Recording'));
    });

    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toBeInTheDocument();
  });
}); 