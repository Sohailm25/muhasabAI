import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
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
  const { toast } = useToast();

  const handleSubmitResponse = async () => {
    try {
      const apiResponse = await apiRequest(
        "POST",
        `/api/conversation/${conversationId}/respond`,
        { content: response }
      );
      const data = await apiResponse.json();
      onResponse(data);
      setSelectedQuestion(null);
      setResponse("");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit response. Please try again.",
        variant: "destructive",
      });
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
        // If it's JSON but not an array, stringify it nicely
        return <pre>{JSON.stringify(parsed, null, 2)}</pre>;
      } catch (e) {
        // Not JSON, just render as text
        return <p>{message.content}</p>;
      }
    }
    // User messages always render as plain text
    return <p>{message.content}</p>;
  };

  return (
    <div className="flex flex-col h-full gap-4">
      <ScrollArea className="flex-1 px-4">
        {messages.map((message, i) => (
          <Card
            key={i}
            className={`mb-4 ${
              message.role === "assistant" ? "bg-muted" : "bg-primary"
            }`}
          >
            <CardContent className="p-4">
              <div
                className={
                  message.role === "assistant"
                    ? "text-foreground"
                    : "text-primary-foreground"
                }
              >
                {renderMessageContent(message)}
              </div>
            </CardContent>
          </Card>
        ))}
      </ScrollArea>

      <div className="p-4 border-t">
        {selectedQuestion ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">{selectedQuestion}</p>
            <textarea
              value={response}
              onChange={(e) => setResponse(e.target.value)}
              className="w-full min-h-[100px] p-2 border rounded"
              placeholder="Type your response..."
            />
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setSelectedQuestion(null)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmitResponse}
                disabled={!response.trim()}
              >
                Submit
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-2">
            {questions.map((question, i) => (
              <Button
                key={i}
                variant="outline"
                className="justify-start text-left"
                onClick={() => {
                  setSelectedQuestion(question);
                }}
              >
                {question}
              </Button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}