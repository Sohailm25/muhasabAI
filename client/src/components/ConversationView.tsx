import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { LoadingAnimation } from "@/components/LoadingAnimation";
import type { Message } from "@shared/schema";

interface ConversationViewProps {
  conversationId: number;
  messages: Message[];
  questions: string[];
  onResponse: (response: any) => void;
}

export function ConversationView({
  conversationId,
  messages,
  questions,
  onResponse,
}: ConversationViewProps) {
  const [selectedQuestion, setSelectedQuestion] = useState<string | null>(null);
  const [response, setResponse] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmitResponse = async () => {
    if (!response.trim()) {
      toast({
        title: "Response required",
        description: "Please enter a response before submitting.",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    try {
      console.log(`Submitting response for conversation ${conversationId}`);
      
      // Try the /respond endpoint first, with fallback to /message
      let apiResponse;
      try {
        apiResponse = await apiRequest(
          "POST",
          `/api/conversation/${conversationId}/respond`,
          { content: response }
        );
      } catch (respondError) {
        console.warn("Error with /respond endpoint, trying /message endpoint:", respondError);
        // Try the /message endpoint as a fallback
        apiResponse = await apiRequest(
          "POST",
          `/api/conversation/${conversationId}/message`,
          { content: response }
        );
      }
      
      const data = await apiResponse.json();
      console.log("Response data:", data);
      
      // Extract questions from the response or use the ones provided directly
      let parsedQuestions = data.questions;
      if (!parsedQuestions || !Array.isArray(parsedQuestions) || parsedQuestions.length === 0) {
        // Try to extract questions from the assistant's message if data.questions is not available
        try {
          const assistantMessages = data.conversation.messages.filter(
            (m: any) => m.role === "assistant"
          );
          
          if (assistantMessages.length > 0) {
            const lastAssistantMessage = assistantMessages[assistantMessages.length - 1];
            parsedQuestions = JSON.parse(lastAssistantMessage.content);
          }
        } catch (parseError) {
          console.error("Error parsing questions from messages:", parseError);
          // Fall back to default questions if parsing fails
          parsedQuestions = [
            "How would you like to expand on your reflection?",
            "What aspects of your spiritual journey would you like to explore further?",
            "Is there anything specific from today that you'd like to reflect on more deeply?"
          ];
        }
      }
      
      // Ensure data has the expected format before passing to the parent
      const processedData = {
        conversation: data.conversation,
        questions: Array.isArray(parsedQuestions) ? parsedQuestions : [parsedQuestions].filter(Boolean)
      };
      
      onResponse(processedData);
      setSelectedQuestion(null);
      setResponse("");
      
      toast({
        title: "Response submitted",
        description: "Your response has been saved."
      });
    } catch (error) {
      console.error("Error submitting response:", error);
      toast({
        title: "Error",
        description: "Failed to submit response. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper function to render message content properly
  const renderMessageContent = (message: Message) => {
    if (message.role === "assistant") {
      try {
        // Try to parse as JSON (for questions)
        const parsed = JSON.parse(message.content);
        if (Array.isArray(parsed)) {
          return (
            <ul className="list-disc list-inside space-y-2">
              {parsed.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          );
        }
      } catch (e) {
        // If not JSON, render as text
        console.log("Not JSON content, rendering as text:", message.content);
      }
    }
    return <p>{message.content}</p>;
  };

  return (
    <>
      {isSubmitting && <LoadingAnimation message="Processing your response..." />}
      
      <div className="flex flex-col w-full h-full max-w-3xl mx-auto">
        <ScrollArea className="flex-1 p-4 rounded-md border">
          <div className="space-y-4 min-h-96">
            {messages.length > 0 ? (
              messages.map((message, i) => (
                <Card key={i} className={`${message.role === "assistant" ? "bg-muted" : "bg-card"}`}>
                  <CardContent className="p-4">
                    <div className="font-semibold text-sm mb-2">
                      {message.role === "user" ? "You" : "Reflection Guide"}:
                    </div>
                    <div className="text-sm">{renderMessageContent(message)}</div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <p className="text-center text-muted-foreground">No messages yet</p>
            )}
          </div>
        </ScrollArea>

        <div className="mt-4 space-y-4">
          {questions && questions.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Reflection Questions:</h3>
              <div className="grid gap-2">
                {questions.map((question, i) => (
                  <Button
                    key={i}
                    variant={selectedQuestion === question ? "default" : "outline"}
                    className="justify-start h-auto py-2 px-3 text-left font-normal"
                    onClick={() => {
                      setSelectedQuestion(question);
                    }}
                  >
                    {question}
                  </Button>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-col space-y-2">
            <textarea
              className="min-h-24 p-2 rounded-md border resize-none"
              placeholder="Type your response here..."
              value={response}
              onChange={(e) => setResponse(e.target.value)}
              disabled={isSubmitting}
            />
            <Button 
              onClick={handleSubmitResponse} 
              disabled={!response.trim() || isSubmitting}
            >
              {isSubmitting ? "Submitting..." : "Submit Response"}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}