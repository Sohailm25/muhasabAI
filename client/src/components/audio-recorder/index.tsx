import React, { useState, useCallback } from 'react';
import { useAudioRecorder } from '../../hooks/useAudioRecorder';
import { formatDuration } from '../../utils/formatDuration';
import { Button } from '@/components/ui/button';
import { Mic, Square, Play, Trash, Pause } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

/**
 * Props for the AudioRecorder component
 */
export interface AudioRecorderProps {
  /** Callback function called when recording is complete with the audio blob */
  onRecordingComplete: (audioBlob: Blob) => Promise<void> | void;
  /** Maximum duration of recording in minutes */
  maxDurationMinutes?: number;
  /** Whether the control is disabled */
  disabled?: boolean;
  /** Custom class name for the container */
  className?: string;
  /** Style variant - 'default' or 'simple' */
  variant?: 'default' | 'simple';
}

/**
 * AudioRecorder component provides a user interface for recording audio
 * with controls for start, stop, pause, and resume recording.
 */
export function AudioRecorder({
  onRecordingComplete,
  maxDurationMinutes = 15,
  disabled = false,
  className = '',
  variant = 'default',
}: AudioRecorderProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();
  
  const {
    isRecording,
    isPaused,
    duration,
    audioBlob,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    resetRecording,
  } = useAudioRecorder(maxDurationMinutes);

  const handleStartRecording = async () => {
    try {
      await startRecording();
    } catch (error) {
      console.error('Failed to start recording:', error);
      toast({
        title: "Microphone Error",
        description: "Please ensure your microphone is connected and permissions are granted.",
        variant: "destructive",
      });
    }
  };

  const handleStopRecording = async () => {
    await stopRecording();
  };

  const handleSubmit = useCallback(async () => {
    if (!audioBlob) return;

    try {
      setIsProcessing(true);
      await onRecordingComplete(audioBlob);
      resetRecording();
    } catch (error) {
      console.error('Failed to process recording:', error);
      toast({
        title: "Error",
        description: "Failed to process your recording. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  }, [audioBlob, onRecordingComplete, resetRecording, toast]);

  // Simple variant, similar to the original AudioRecorder.tsx
  if (variant === 'simple') {
    return (
      <div className={`flex flex-col items-center gap-4 ${className}`}>
        {!audioBlob ? (
          <>
            <div className="text-center mb-2">
              {isRecording ? (
                <div className="text-red-500 font-medium">Recording: {formatDuration(duration)}</div>
              ) : (
                <div className="text-gray-500">Tap to record your reflection</div>
              )}
            </div>
            
            <div className="flex justify-center">
              {isRecording ? (
                <Button 
                  size="lg" 
                  variant="destructive" 
                  className="h-16 w-16 rounded-full" 
                  onClick={handleStopRecording}
                  disabled={disabled}
                >
                  <Square className="h-6 w-6" />
                </Button>
              ) : (
                <Button 
                  size="lg" 
                  className="h-16 w-16 rounded-full bg-red-500 hover:bg-red-600" 
                  onClick={handleStartRecording}
                  disabled={disabled}
                >
                  <Mic className="h-6 w-6" />
                </Button>
              )}
            </div>
          </>
        ) : (
          <>
            <div className="text-center mb-2">
              <div className="text-gray-700 font-medium">Recording: {formatDuration(duration)}</div>
            </div>
            
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                size="sm" 
                className="h-10 w-10 rounded-full p-0" 
                onClick={resetRecording}
                disabled={disabled || isProcessing}
              >
                <Trash className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="mt-4 w-full">
              <Button 
                className="w-full" 
                onClick={handleSubmit}
                disabled={disabled || isProcessing}
              >
                {isProcessing ? "Processing..." : "Submit Recording"}
              </Button>
            </div>
          </>
        )}
      </div>
    );
  }

  // Default variant with more features (pause/resume)
  return (
    <div className={`flex flex-col items-center space-y-4 ${className}`}>
      {/* Duration Display */}
      <div className="text-2xl font-mono">
        {formatDuration(duration)}
      </div>

      {/* Recording Controls */}
      <div className="flex items-center space-x-4">
        {!isRecording && !audioBlob && (
          <Button
            onClick={handleStartRecording}
            size="lg"
            className="h-16 w-16 rounded-full bg-red-500 hover:bg-red-600"
            disabled={disabled}
          >
            <Mic className="h-6 w-6" />
          </Button>
        )}

        {isRecording && (
          <>
            <Button
              onClick={isPaused ? resumeRecording : pauseRecording}
              variant="secondary"
              className="p-3 rounded-full"
              disabled={disabled}
            >
              {isPaused ? <Play className="h-5 w-5" /> : <Pause className="h-5 w-5" />}
            </Button>

            <Button
              onClick={handleStopRecording}
              variant="destructive"
              className="p-3 rounded-full"
              disabled={disabled}
            >
              <Square className="h-5 w-5" />
            </Button>
          </>
        )}

        {audioBlob && !isRecording && (
          <>
            <Button
              onClick={handleSubmit}
              disabled={disabled || isProcessing}
              className="px-4 py-2"
            >
              {isProcessing ? "Processing..." : "Submit Recording"}
            </Button>

            <Button
              onClick={resetRecording}
              variant="outline"
              className="p-2"
              disabled={disabled || isProcessing}
            >
              <Trash className="h-5 w-5" />
            </Button>
          </>
        )}
      </div>

      {/* Progress Bar */}
      {isRecording && (
        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-red-500 transition-all duration-200"
            style={{
              width: `${(duration / (maxDurationMinutes * 60)) * 100}%`
            }}
          />
        </div>
      )}
    </div>
  );
}