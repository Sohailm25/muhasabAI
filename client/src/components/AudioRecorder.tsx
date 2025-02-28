import { useEffect, useState } from "react";
import { useReactMediaRecorder } from "react-media-recorder";
import { Button } from "@/components/ui/button";
import { Mic, Square, Loader2 } from "lucide-react";

interface AudioRecorderProps {
  onRecordingComplete: (audioBlob: Blob) => void;
}

export function AudioRecorder({ onRecordingComplete }: AudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);

  const {
    status,
    startRecording,
    stopRecording,
    mediaBlobUrl,
    clearBlobUrl,
  } = useReactMediaRecorder({
    audio: true,
    onStop: (blobUrl: string, blob: Blob) => {
      onRecordingComplete(blob);
      clearBlobUrl();
    },
  });

  useEffect(() => {
    return () => {
      if (mediaBlobUrl) {
        clearBlobUrl();
      }
    };
  }, [mediaBlobUrl, clearBlobUrl]);

  const handleToggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
    setIsRecording(!isRecording);
  };

  return (
    <div className="flex items-center justify-center gap-4">
      <Button
        variant={isRecording ? "destructive" : "default"}
        size="icon"
        onClick={handleToggleRecording}
        disabled={status === "acquiring_media"}
      >
        {status === "acquiring_media" ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : isRecording ? (
          <Square className="h-4 w-4" />
        ) : (
          <Mic className="h-4 w-4" />
        )}
      </Button>
      {isRecording && (
        <span className="text-sm text-muted-foreground animate-pulse">
          Recording...
        </span>
      )}
    </div>
  );
}