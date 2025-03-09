import React, { useState, useCallback } from 'react';
import { AudioRecorder } from '../AudioRecorder/AudioRecorder';
import { TranscriptionLoading } from '../TranscriptionLoading/TranscriptionLoading';
import { TranscriptionService } from '../../services/transcriptionService';
import { toast } from 'react-hot-toast';

interface TranscriptionContainerProps {
  onTranscriptionComplete: (text: string) => void;
  maxDurationMinutes?: number;
}

export const TranscriptionContainer: React.FC<TranscriptionContainerProps> = ({
  onTranscriptionComplete,
  maxDurationMinutes = 15,
}) => {
  const [isTranscribing, setIsTranscribing] = useState(false);
  const transcriptionService = new TranscriptionService();

  const handleRecordingComplete = useCallback(async (audioBlob: Blob) => {
    try {
      setIsTranscribing(true);
      const transcribedText = await transcriptionService.transcribeAudio(audioBlob);
      onTranscriptionComplete(transcribedText);
      toast.success('Audio transcribed successfully!');
    } catch (error) {
      console.error('Transcription error:', error);
      toast.error(
        error instanceof Error 
          ? error.message 
          : 'Failed to transcribe audio. Please try again.'
      );
    } finally {
      setIsTranscribing(false);
    }
  }, [onTranscriptionComplete]);

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-semibold text-gray-800">Voice Input</h2>
          <p className="text-gray-600 mt-2">
            Record your voice and we'll convert it to text
          </p>
        </div>

        <AudioRecorder
          onRecordingComplete={handleRecordingComplete}
          maxDurationMinutes={maxDurationMinutes}
        />

        <div className="mt-4 text-center text-sm text-gray-500">
          <p>Maximum recording duration: {maxDurationMinutes} minutes</p>
          <p className="mt-1">Supported formats: MP3, WAV, WebM, and more</p>
        </div>
      </div>

      <TranscriptionLoading isVisible={isTranscribing} />
    </div>
  );
}; 