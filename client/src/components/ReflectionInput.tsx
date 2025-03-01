import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { AudioRecorder } from "@/components/AudioRecorder";
import { LoadingAnimation } from "@/components/LoadingAnimation";

export interface ReflectionInputProps {
  onReflectionComplete: (data: any) => void;
  isLoading?: boolean;
  setIsLoading?: React.Dispatch<React.SetStateAction<boolean>>;
}

export function ReflectionInput({ 
  onReflectionComplete,
  isLoading = false,
  setIsLoading
}: ReflectionInputProps) {
  const [text, setText] = useState("");
  const [activeTab, setActiveTab] = useState("text");
  const [localLoading, setLocalLoading] = useState(false);
  const { toast } = useToast();

  // Use either the provided loading state or the local one
  const loading = isLoading || localLoading;
  const updateLoading = setIsLoading || setLocalLoading;

  const handleTextSubmit = async () => {
    if (!text.trim()) {
      toast({
        title: "Missing content",
        description: "Please enter your reflection before submitting.",
        variant: "destructive",
      });
      return;
    }

    updateLoading(true);
    try {
      console.log("Submitting text reflection");
      const response = await apiRequest("POST", "/api/reflection", {
        content: text,
        type: "text",
      });

      const data = await response.json();
      onReflectionComplete(data);
      setText("");
      
      toast({
        title: "Reflection submitted",
        description: "Your reflection has been saved.",
      });
    } catch (error) {
      console.error("Error submitting reflection:", error);
      toast({
        title: "Error",
        description: "Failed to submit your reflection. Please try again.",
        variant: "destructive",
      });
    } finally {
      updateLoading(false);
    }
  };

  const handleAudioComplete = async (audioData: Blob) => {
    updateLoading(true);
    try {
      console.log("Submitting audio reflection");
      // Create a FormData object to send the audio
      const formData = new FormData();
      formData.append("audio", audioData);

      // Make the API request
      const response = await fetch("/api/reflection/audio", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to process audio");
      }

      const data = await response.json();
      onReflectionComplete(data);
      
      toast({
        title: "Audio reflection submitted",
        description: "Your audio reflection has been transcribed and saved.",
      });
    } catch (error) {
      console.error("Error submitting audio reflection:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to process your audio. Please try again.",
        variant: "destructive",
      });
    } finally {
      updateLoading(false);
    }
  };

  return (
    <>
      {loading && <LoadingAnimation message={activeTab === "voice" ? "Processing your audio..." : "Processing your reflection..."} />}
      
      <div className="w-full max-w-md">
        <Tabs
          defaultValue="text"
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="text" disabled={loading}>Text</TabsTrigger>
            <TabsTrigger value="voice" disabled={loading}>Voice</TabsTrigger>
          </TabsList>
          <TabsContent value="text" className="space-y-4 mt-4">
            <Textarea
              placeholder="Share your Ramadan reflections, thoughts, or experiences..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={6}
              disabled={loading}
              className="resize-none"
            />
            <Button 
              onClick={handleTextSubmit} 
              className="w-full" 
              disabled={!text.trim() || loading}
            >
              {loading ? "Processing..." : "Submit Reflection"}
            </Button>
          </TabsContent>
          <TabsContent value="voice" className="space-y-4 mt-4">
            <AudioRecorder 
              onRecordingComplete={handleAudioComplete} 
              disabled={loading}
            />
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
