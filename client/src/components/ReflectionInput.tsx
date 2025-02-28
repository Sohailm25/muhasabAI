import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Mic, Type } from "lucide-react";
import { AudioRecorder } from "./AudioRecorder";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface ReflectionInputProps {
  onReflectionComplete: (response: any) => void;
}

export function ReflectionInput({ onReflectionComplete }: ReflectionInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputType, setInputType] = useState<"text" | "audio" | null>(null);
  const [textContent, setTextContent] = useState("");
  const { toast } = useToast();

  const handleSubmit = async (content: string, type: "text" | "audio") => {
    try {
      const response = await apiRequest("POST", "/api/reflection", {
        content,
        type,
        transcription: type === "text" ? content : null,
      });
      
      const data = await response.json();
      onReflectionComplete(data);
      setIsOpen(false);
      setInputType(null);
      setTextContent("");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save reflection. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleAudioComplete = async (audioBlob: Blob) => {
    const base64 = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(audioBlob);
    });

    await handleSubmit(base64, "audio");
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          size="lg"
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg"
        >
          <Plus className="h-6 w-6" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        {!inputType ? (
          <div className="grid grid-cols-2 gap-4 p-4">
            <Button
              variant="outline"
              className="flex flex-col gap-2 h-32"
              onClick={() => setInputType("audio")}
            >
              <Mic className="h-8 w-8" />
              <span>Record Audio</span>
            </Button>
            <Button
              variant="outline"
              className="flex flex-col gap-2 h-32"
              onClick={() => setInputType("text")}
            >
              <Type className="h-8 w-8" />
              <span>Write Text</span>
            </Button>
          </div>
        ) : inputType === "audio" ? (
          <div className="p-6">
            <AudioRecorder onRecordingComplete={handleAudioComplete} />
          </div>
        ) : (
          <div className="p-4">
            <Textarea
              value={textContent}
              onChange={(e) => setTextContent(e.target.value)}
              placeholder="Share your reflection..."
              className="min-h-[200px]"
            />
            <Button
              className="mt-4 w-full"
              onClick={() => handleSubmit(textContent, "text")}
              disabled={!textContent.trim()}
            >
              Submit
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
