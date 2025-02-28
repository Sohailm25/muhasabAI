import { useState, useEffect } from "react";
import { ReflectionInput } from "@/components/ReflectionInput";
import { ConversationView } from "@/components/ConversationView";
import { ActionItems } from "@/components/ActionItems";
import { useToast } from "@/hooks/use-toast";
import type { Message } from "@shared/schema";

// Type for conversation data
interface ConversationData {
  id: number;
  messages: Message[];
  actionItems: string[];
  reflectionId: number | null;
  timestamp: string;
}

export default function Home() {
  const [conversationId, setConversationId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [questions, setQuestions] = useState<string[]>([]);
  const [actionItems, setActionItems] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { toast } = useToast();

  // Try to load previous session from localStorage
  useEffect(() => {
    try {
      const savedSession = localStorage.getItem("ramadanReflectionSession");
      if (savedSession) {
        const session = JSON.parse(savedSession);
        setConversationId(session.conversationId);
        setMessages(session.messages);
        setQuestions(session.questions);
        setActionItems(session.actionItems || []);
      }
    } catch (error) {
      console.error("Error loading saved session:", error);
      // Clear potentially corrupted data
      localStorage.removeItem("ramadanReflectionSession");
    }
  }, []);

  // Save session to localStorage when it changes
  useEffect(() => {
    if (conversationId) {
      const session = {
        conversationId,
        messages,
        questions,
        actionItems
      };
      localStorage.setItem("ramadanReflectionSession", JSON.stringify(session));
    }
  }, [conversationId, messages, questions, actionItems]);

  const handleReflectionComplete = (data: any) => {
    try {
      setConversationId(data.conversation.id);
      setMessages(data.conversation.messages);
      setQuestions(data.questions);
      
      // Show success message
      toast({
        title: "Reflection saved",
        description: "Your reflection has been saved and processed successfully.",
      });
    } catch (error) {
      console.error("Error handling reflection completion:", error);
      toast({
        title: "Error",
        description: "Something went wrong while processing your reflection.",
        variant: "destructive"
      });
    }
  };

  const handleResponse = (data: any) => {
    try {
      setMessages(data.conversation.messages);
      setQuestions(data.questions);
    } catch (error) {
      console.error("Error handling conversation response:", error);
      toast({
        title: "Error",
        description: "Something went wrong while processing your response.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="fixed top-0 left-0 right-0 h-16 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container h-full flex items-center">
          <h1 className="text-xl font-semibold">Ramadan Reflections</h1>
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
              conversationId={conversationId}
              actionItems={actionItems}
              onGenerate={setActionItems}
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
            <ReflectionInput onReflectionComplete={handleReflectionComplete} />
          </div>
        )}
      </main>
    </div>
  );
}
