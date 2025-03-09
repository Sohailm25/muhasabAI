import { useState, useEffect } from "react";
import { useLocation } from "wouter"; // Replace Next.js router with wouter
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { AudioRecorder } from "@/components/AudioRecorder";
import { useReflectionService } from "@/services/reflectionService";

export interface ReflectionInputProps {
  onReflectionComplete: (data: any) => void;
  isLoading?: boolean;
  setIsLoading?: React.Dispatch<React.SetStateAction<boolean>>;
  redirectToChat?: boolean; // Add option to control redirect behavior
  onTabChange?: (tab: string) => void; // Add prop for tab change
}

export function ReflectionInput({ 
  onReflectionComplete,
  isLoading = false,
  setIsLoading,
  redirectToChat = true, // Default to true for backward compatibility
  onTabChange,
}: ReflectionInputProps) {
  const [text, setText] = useState("");
  const [activeTab, setActiveTab] = useState("text");
  const [localLoading, setLocalLoading] = useState(false);
  const { toast } = useToast();
  const [, setLocation] = useLocation(); // Use wouter's location setter
  
  // Get the personalized reflection service
  const { submitReflection, isPersonalizationEnabled } = useReflectionService();

  // Use a single loading state, preferring the external one if provided
  const loading = setIsLoading ? isLoading : localLoading;
  const updateLoading = setIsLoading || setLocalLoading;

  // Handle tab changes and notify parent component
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    if (onTabChange) {
      onTabChange(value);
    }
  };

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
      console.log(`Submitting ${isPersonalizationEnabled() ? "personalized" : "standard"} text reflection`);
      
      // Use our personalized reflection service
      const response = await submitReflection(text);
      console.log("API response:", response);
      
      // Handle the API response which could be in different formats
      let reflectionData;
      let reflectionId;
      
      // Handle both possible response formats
      if (response && response.reflection) {
        // New format with nested reflection object
        reflectionData = response.reflection;
        reflectionId = reflectionData.id;
      } else if (response && response.id) {
        // Direct format where response has the ID
        reflectionData = response;
        reflectionId = response.id;
      } else {
        console.error("Invalid response format:", response);
        throw new Error("Invalid response format from server");
      }
      
      // Pass the COMPLETE response to the parent component, not just reflectionData
      // This ensures that top-level fields like understanding and questions are available
      onReflectionComplete(response);
      setText("");
      
      toast({
        title: "Reflection submitted",
        description: `Your ${isPersonalizationEnabled() ? "personalized " : ""}reflection has been saved.`,
      });
      
      // Handle redirection to chat page if enabled
      if (redirectToChat && reflectionId) {
        console.log(`Redirecting to /chat/${reflectionId} in 1 second`);
        // Short delay to allow toast to be visible
        setTimeout(() => {
          setLocation(`/chat/${reflectionId}`);
        }, 1000);
      }
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

      // Get the auth token from localStorage
      const token = localStorage.getItem('auth_token');

      // Make the API request
      const response = await fetch("/api/reflection/audio", {
        method: "POST",
        headers: {
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to process audio");
      }

      const data = await response.json();
      console.log("Audio API response:", data);
      
      // Create reflection with transcribed text
      if (!data.transcription) {
        throw new Error("No transcription received from server");
      }

      // Create the reflection with the transcribed text
      const reflectionResponse = await fetch("/api/reflection", {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify({
          content: data.transcription,
          type: "text", // We store it as text since it's already transcribed
        })
      });

      if (!reflectionResponse.ok) {
        const errorData = await reflectionResponse.json();
        throw new Error(errorData.error || "Failed to save reflection");
      }

      const reflectionData = await reflectionResponse.json();
      
      // Pass the complete reflection data to the parent
      onReflectionComplete(reflectionData);
      
      toast({
        title: "Audio reflection submitted",
        description: "Your audio reflection has been transcribed and saved.",
      });
      
      // Handle redirection to chat page if enabled
      if (redirectToChat && reflectionData.id) {
        console.log(`Redirecting to /chat/${reflectionData.id} in 1 second`);
        // Short delay to allow toast to be visible
        setTimeout(() => {
          setLocation(`/chat/${reflectionData.id}`);
        }, 1000);
      }
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
      <div className="w-full max-w-md">
        <Tabs
          defaultValue="text"
          value={activeTab}
          onValueChange={handleTabChange}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="text" disabled={loading}>Text</TabsTrigger>
            <TabsTrigger value="voice" disabled={loading}>Voice</TabsTrigger>
          </TabsList>
          <TabsContent value="text" className="space-y-4 mt-4">
            <Textarea
              placeholder={isPersonalizationEnabled() 
                ? "Share your thoughts for a personalized Islamic reflection..."
                : "Share your Ramadan reflections, thoughts, or experiences..."}
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={6}
              disabled={loading}
              className="resize-none"
            />
            {isPersonalizationEnabled() && (
              <div className="text-xs text-muted-foreground italic">
                Your reflection will be personalized based on your preferences.
              </div>
            )}
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
