import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AudioRecorder } from '..';
import { jest } from '@jest/globals';

// Mock the useAudioRecorder hook
jest.mock('../../../hooks/useAudioRecorder', () => ({
  useAudioRecorder: () => ({
    isRecording: false,
    isPaused: false,
    duration: 10,
    audioBlob: null,
    startRecording: jest.fn().mockResolvedValue(undefined),
    stopRecording: jest.fn().mockResolvedValue(undefined),
    pauseRecording: jest.fn(),
    resumeRecording: jest.fn(),
    resetRecording: jest.fn(),
  }),
}));

// Mock the useToast hook
jest.mock('../../../hooks/use-toast', () => ({
  useToast: () => ({
    toast: jest.fn(),
  }),
}));

describe('AudioRecorder Component', () => {
  const mockOnRecordingComplete = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders with the default variant', () => {
    render(<AudioRecorder onRecordingComplete={mockOnRecordingComplete} />);
    expect(screen.getByText('00:10')).toBeInTheDocument(); // Duration display
    expect(screen.getByRole('button')).toBeInTheDocument(); // Start recording button
  });
  
  test('renders with the simple variant', () => {
    render(<AudioRecorder onRecordingComplete={mockOnRecordingComplete} variant="simple" />);
    expect(screen.getByText('Tap to record your reflection')).toBeInTheDocument();
  });

  test('handles disabled state', () => {
    render(<AudioRecorder onRecordingComplete={mockOnRecordingComplete} disabled={true} />);
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
  });
});