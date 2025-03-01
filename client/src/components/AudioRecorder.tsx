import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Mic, Square, Play, Trash } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export interface AudioRecorderProps {
  onRecordingComplete: (audioBlob: Blob) => void;
  disabled?: boolean;
}

export function AudioRecorder({ onRecordingComplete, disabled = false }: AudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  const { toast } = useToast();

  useEffect(() => {
    // Clean up audio URL when component unmounts
    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  const startRecording = async () => {
    audioChunksRef.current = [];
    setRecordingTime(0);
    setAudioBlob(null);
    setAudioUrl(null);
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      mediaRecorderRef.current = new MediaRecorder(stream);
      
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        setAudioBlob(audioBlob);
        
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
        
        // Stop all tracks to release the microphone
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorderRef.current.start();
      setIsRecording(true);
      
      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      
    } catch (error) {
      console.error('Error accessing microphone:', error);
      toast({
        title: "Microphone Error",
        description: "Please ensure your microphone is connected and permissions are granted.",
        variant: "destructive",
      });
    }
  };
  
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      // Clear timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };
  
  const playAudio = () => {
    if (audioUrl) {
      if (!audioRef.current) {
        audioRef.current = new Audio(audioUrl);
        audioRef.current.addEventListener('ended', () => {
          setIsPlaying(false);
        });
      }
      
      audioRef.current.play();
      setIsPlaying(true);
    }
  };
  
  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
    }
  };
  
  const resetRecording = () => {
    setAudioBlob(null);
    setAudioUrl(null);
    setRecordingTime(0);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
      audioRef.current = null;
    }
    setIsPlaying(false);
  };
  
  const handleSubmit = () => {
    if (audioBlob) {
      onRecordingComplete(audioBlob);
      resetRecording();
    }
  };
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col items-center gap-4">
      {!audioBlob ? (
        <>
          <div className="text-center mb-2">
            {isRecording ? (
              <div className="text-red-500 font-medium">Recording: {formatTime(recordingTime)}</div>
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
                onClick={stopRecording}
                disabled={disabled}
              >
                <Square className="h-6 w-6" />
              </Button>
            ) : (
              <Button 
                size="lg" 
                className="h-16 w-16 rounded-full bg-red-500 hover:bg-red-600" 
                onClick={startRecording}
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
            <div className="text-gray-700 font-medium">Recording: {formatTime(recordingTime)}</div>
          </div>
          
          <div className="flex gap-3">
            {isPlaying ? (
              <Button 
                variant="outline" 
                size="sm" 
                className="h-10 w-10 rounded-full p-0" 
                onClick={stopAudio}
                disabled={disabled}
              >
                <Square className="h-4 w-4" />
              </Button>
            ) : (
              <Button 
                variant="outline" 
                size="sm" 
                className="h-10 w-10 rounded-full p-0" 
                onClick={playAudio}
                disabled={disabled}
              >
                <Play className="h-4 w-4" />
              </Button>
            )}
            
            <Button 
              variant="outline" 
              size="sm" 
              className="h-10 w-10 rounded-full p-0" 
              onClick={resetRecording}
              disabled={disabled}
            >
              <Trash className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="mt-4 w-full">
            <Button 
              className="w-full" 
              onClick={handleSubmit}
              disabled={disabled}
            >
              Submit Recording
            </Button>
          </div>
        </>
      )}
    </div>
  );
}