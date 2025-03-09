import { useState, useCallback, useRef } from 'react';

interface AudioRecorderState {
  isRecording: boolean;
  isPaused: boolean;
  duration: number;
  audioBlob: Blob | null;
}

interface UseAudioRecorderReturn extends AudioRecorderState {
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<void>;
  pauseRecording: () => void;
  resumeRecording: () => void;
  resetRecording: () => void;
}

export const useAudioRecorder = (maxDurationMinutes: number = 15): UseAudioRecorderReturn => {
  const [state, setState] = useState<AudioRecorderState>({
    isRecording: false,
    isPaused: false,
    duration: 0,
    audioBlob: null,
  });

  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);
  const durationInterval = useRef<number | null>(null);
  const startTime = useRef<number>(0);

  const cleanup = useCallback(() => {
    if (durationInterval.current) {
      window.clearInterval(durationInterval.current);
      durationInterval.current = null;
    }
    
    if (mediaRecorder.current?.state !== 'inactive') {
      mediaRecorder.current?.stop();
    }
    
    audioChunks.current = [];
  }, []);

  const startRecording = useCallback(async () => {
    try {
      cleanup();
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder.current = new MediaRecorder(stream);
      
      mediaRecorder.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.current.push(event.data);
        }
      };

      mediaRecorder.current.onstop = () => {
        const audioBlob = new Blob(audioChunks.current, { type: 'audio/webm' });
        setState(prev => ({ ...prev, audioBlob, isRecording: false }));
        
        // Stop all audio tracks
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.current.start(1000); // Collect data every second
      startTime.current = Date.now();
      
      // Start duration timer
      durationInterval.current = window.setInterval(() => {
        const currentDuration = (Date.now() - startTime.current) / 1000;
        setState(prev => ({ ...prev, duration: currentDuration }));
        
        // Stop recording if max duration is reached
        if (currentDuration >= maxDurationMinutes * 60) {
          stopRecording();
        }
      }, 1000);

      setState(prev => ({ ...prev, isRecording: true, isPaused: false, audioBlob: null }));
    } catch (error) {
      console.error('Error starting recording:', error);
      throw new Error('Failed to start recording. Please check your microphone permissions.');
    }
  }, [maxDurationMinutes, cleanup]);

  const stopRecording = useCallback(async () => {
    if (mediaRecorder.current?.state !== 'inactive') {
      mediaRecorder.current?.stop();
      cleanup();
    }
  }, [cleanup]);

  const pauseRecording = useCallback(() => {
    if (mediaRecorder.current?.state === 'recording') {
      mediaRecorder.current.pause();
      setState(prev => ({ ...prev, isPaused: true }));
      
      if (durationInterval.current) {
        window.clearInterval(durationInterval.current);
      }
    }
  }, []);

  const resumeRecording = useCallback(() => {
    if (mediaRecorder.current?.state === 'paused') {
      mediaRecorder.current.resume();
      setState(prev => ({ ...prev, isPaused: false }));
      
      durationInterval.current = window.setInterval(() => {
        const currentDuration = (Date.now() - startTime.current) / 1000;
        setState(prev => ({ ...prev, duration: currentDuration }));
      }, 1000);
    }
  }, []);

  const resetRecording = useCallback(() => {
    cleanup();
    setState({
      isRecording: false,
      isPaused: false,
      duration: 0,
      audioBlob: null,
    });
  }, [cleanup]);

  return {
    ...state,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    resetRecording,
  };
}; 