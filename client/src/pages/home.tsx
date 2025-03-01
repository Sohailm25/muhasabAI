import { useState, useEffect } from "react";
import { ReflectionInput } from "@/components/ReflectionInput";
import { ConversationView } from "@/components/ConversationView";
import { ActionItems } from "@/components/ActionItems";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { LoadingAnimation } from "@/components/LoadingAnimation";
import type { Message } from "@shared/schema";

// Type for conversation data
interface ConversationData {
  id: number;
  messages: { role: "user" | "assistant"; content: string }[];
  questions: string[];
  actionItems: string[];
}

export default function Home() {
  const [conversationId, setConversationId] = useState<number | null>(null);
  const [messages, setMessages] = useState<{ role: "user" | "assistant"; content: string }[]>([]);
  const [questions, setQuestions] = useState<string[]>([]);
  const [actionItems, setActionItems] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  // Load session from localStorage
  useEffect(() => {
    try {
      const savedSession = localStorage.getItem("ramadanReflectionSession");
      if (savedSession) {
        const parsedSession = JSON.parse(savedSession);
        if (parsedSession.conversationId && parsedSession.messages) {
          setConversationId(parsedSession.conversationId);
          setMessages(parsedSession.messages);
          setQuestions(parsedSession.questions || []);
          setActionItems(parsedSession.actionItems || []);
          
          console.log("Loaded saved session:", parsedSession);
        }
      }
    } catch (error) {
      console.error("Error loading session:", error);
      // Clear local storage if corrupted
      localStorage.removeItem("ramadanReflectionSession");
      
      toast({
        title: "Session Error",
        description: "Could not load your previous session. Starting fresh.",
        variant: "destructive",
      });
    }
  }, []);

  // Save session to localStorage
  useEffect(() => {
    if (conversationId) {
      try {
        const sessionData = {
          conversationId,
          messages,
          questions,
          actionItems,
        };
        localStorage.setItem("ramadanReflectionSession", JSON.stringify(sessionData));
      } catch (error) {
        console.error("Error saving session:", error);
        toast({
          title: "Session Error",
          description: "Could not save session data.",
          variant: "destructive",
        });
      }
    }
  }, [conversationId, messages, questions, actionItems]);

  // Function to start a new reflection
  const startNewReflection = () => {
    // Clear local storage
    localStorage.removeItem("ramadanReflectionSession");
    
    // Reset state
    setConversationId(null);
    setMessages([]);
    setQuestions([]);
    setActionItems([]);
    
    toast({
      title: "New Reflection",
      description: "Started a new reflection session.",
    });
  };

  // Navigate to home page
  const goToHome = () => {
    setLocation("/");
  };

  const handleReflectionComplete = (data: any) => {
    console.log("Reflection complete:", data);
    setConversationId(data.conversation.id);
    setMessages(data.conversation.messages);
    
    // Extract questions from the assistant's message
    try {
      const assistantMessage = data.conversation.messages.find(
        (m: any) => m.role === "assistant"
      );
      
      if (assistantMessage) {
        try {
          const parsedQuestions = JSON.parse(assistantMessage.content);
          setQuestions(Array.isArray(parsedQuestions) ? parsedQuestions : []);
        } catch (error) {
          console.error("Error parsing questions:", error);
          setQuestions(data.questions || []);
        }
      } else {
        setQuestions(data.questions || []);
      }
    } catch (error) {
      console.error("Error extracting questions:", error);
      setQuestions(data.questions || []);
    }
    
    setActionItems(data.conversation.actionItems || []);
  };

  const handleResponse = (data: any) => {
    console.log("Response data:", data);
    setMessages(data.conversation.messages);
    
    // Extract questions from the last assistant message
    try {
      const assistantMessages = data.conversation.messages.filter(
        (m: any) => m.role === "assistant"
      );
      
      if (assistantMessages.length > 0) {
        const lastAssistantMessage = assistantMessages[assistantMessages.length - 1];
        
        try {
          const parsedQuestions = JSON.parse(lastAssistantMessage.content);
          if (Array.isArray(parsedQuestions)) {
            console.log("Setting questions to:", parsedQuestions);
            setQuestions(parsedQuestions);
          } else {
            console.warn("Assistant message is not an array of questions:", lastAssistantMessage.content);
            setQuestions(data.questions || []);
          }
        } catch (error) {
          console.error("Error parsing questions from:", lastAssistantMessage.content);
          console.error("Parse error:", error);
          setQuestions(data.questions || []);
        }
      } else {
        setQuestions(data.questions || []);
      }
    } catch (error) {
      console.error("Error extracting questions:", error);
      setQuestions(data.questions || []);
    }
    
    setActionItems(data.conversation.actionItems || []);
  };

  const handleGenerateActionItems = async () => {
    if (!conversationId) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(`/api/conversation/${conversationId}/action-items`, {
        method: "POST",
      });
      
      if (!response.ok) {
        throw new Error("Failed to generate action items");
      }
      
      const data = await response.json();
      setActionItems(data.actionItems);
      setMessages(data.conversation.messages);
      
      toast({
        title: "Action Items Generated",
        description: "Your personalized action items have been created.",
      });
    } catch (error) {
      console.error("Error generating action items:", error);
      toast({
        title: "Error",
        description: "Failed to generate action items. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {isLoading && <LoadingAnimation message="Generating action items..." />}
      
      <header className="fixed top-0 left-0 right-0 h-16 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container h-full flex items-center justify-between">
          <h1 
            className="text-xl font-semibold cursor-pointer hover:text-primary transition-colors" 
            onClick={goToHome}
          >
            Ramadan Reflections
          </h1>
          {conversationId && (
            <Button 
              variant="outline" 
              onClick={startNewReflection}
            >
              New Reflection
            </Button>
          )}
        </div>
      </header>

      <main className="container pt-20 pb-24">
        {conversationId ? (
          <div className="grid gap-6 md:grid-cols-[2fr,1fr]">
            <ConversationView
              conversationId={conversationId}
              messages={messages}
              questions={questions}
              onResponse={handleResponse}
            />
            <ActionItems
              items={actionItems}
              onGenerate={handleGenerateActionItems}
              isGenerating={isLoading}
            />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
            <div className="max-w-md text-center space-y-4">
              <h2 className="text-2xl font-semibold">Welcome to Your Reflection Space</h2>
              <p className="text-muted-foreground">
                Share your thoughts, feelings, or experiences during Ramadan.
                Whether through voice or text, take a moment to reflect on your
                spiritual journey.
              </p>
            </div>
            <ReflectionInput 
              onReflectionComplete={handleReflectionComplete} 
              isLoading={isLoading}
              setIsLoading={setIsLoading}
            />
          </div>
        )}
      </main>
    </div>
  );
}
