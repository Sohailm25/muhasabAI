import React, { useCallback, useState } from 'react';
import { useAudioRecorder } from '../../hooks/useAudioRecorder';
import { formatDuration } from '../../utils/formatDuration';
import { FaMicrophone, FaStop, FaPause, FaPlay, FaTrash } from 'react-icons/fa';
import { ImSpinner8 } from 'react-icons/im';

/**
 * Props for the AudioRecorder component
 */
interface AudioRecorderProps {
  /** Callback function called when recording is complete with the audio blob */
  onRecordingComplete: (audioBlob: Blob) => Promise<void>;
  /** Maximum duration of recording in minutes */
  maxDurationMinutes?: number;
}

/**
 * AudioRecorder component provides a user interface for recording audio
 * with controls for start, stop, pause, and resume recording.
 *
 * @component
 * @example
 * ```tsx
 * const handleRecordingComplete = async (audioBlob: Blob) => {
 *   // Process the recorded audio
 * };
 *
 * return (
 *   <AudioRecorder
 *     onRecordingComplete={handleRecordingComplete}
 *     maxDurationMinutes={15}
 *   />
 * );
 * ```
 */
export const AudioRecorder: React.FC<AudioRecorderProps> = ({
  onRecordingComplete,
  maxDurationMinutes = 15,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
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
      // You might want to show a user-friendly error message here
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
      // You might want to show a user-friendly error message here
    } finally {
      setIsProcessing(false);
    }
  }, [audioBlob, onRecordingComplete, resetRecording]);

  return (
    <div className="flex flex-col items-center space-y-4 p-4 bg-white rounded-lg shadow-md">
      {/* Duration Display */}
      <div className="text-2xl font-mono">
        {formatDuration(duration)}
      </div>

      {/* Recording Controls */}
      <div className="flex items-center space-x-4">
        {!isRecording && !audioBlob && (
          <button
            onClick={handleStartRecording}
            className="p-4 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
            title="Start Recording"
          >
            <FaMicrophone className="w-6 h-6" />
          </button>
        )}

        {isRecording && (
          <>
            <button
              onClick={isPaused ? resumeRecording : pauseRecording}
              className="p-4 bg-yellow-500 text-white rounded-full hover:bg-yellow-600 transition-colors"
              title={isPaused ? "Resume Recording" : "Pause Recording"}
            >
              {isPaused ? <FaPlay className="w-6 h-6" /> : <FaPause className="w-6 h-6" />}
            </button>

            <button
              onClick={handleStopRecording}
              className="p-4 bg-gray-500 text-white rounded-full hover:bg-gray-600 transition-colors"
              title="Stop Recording"
            >
              <FaStop className="w-6 h-6" />
            </button>
          </>
        )}

        {audioBlob && !isRecording && (
          <>
            <button
              onClick={handleSubmit}
              disabled={isProcessing}
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:bg-blue-300 flex items-center space-x-2"
            >
              {isProcessing ? (
                <>
                  <ImSpinner8 className="w-5 h-5 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <span>Submit Recording</span>
              )}
            </button>

            <button
              onClick={resetRecording}
              className="p-2 text-red-500 hover:text-red-600 transition-colors"
              title="Delete Recording"
            >
              <FaTrash className="w-5 h-5" />
            </button>
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
}; 