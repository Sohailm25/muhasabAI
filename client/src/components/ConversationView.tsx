import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { MasjidLoadingAnimation } from "@/components/MasjidLoadingAnimation";
import React from "react";
import { Textarea } from "@/components/ui/textarea";

// Define Message type directly
export interface Message {
  role: "user" | "assistant";
  content: string;
}

interface ConversationViewProps {
  conversationId?: number;
  messages: Message[];
  questions: string[];
  onResponse?: (response: any) => void;
  onNewMessage?: (messages: Message[]) => void;
  onSelectedQuestion?: (question: string) => void;
  isFirstSubmission?: boolean;
  selectedQuestion?: string | null;
}

// Memoized Follow-up Questions component
const FollowUpQuestions = React.memo(({ 
  questions, 
  onQuestionSelect,
}: {
  questions: string[];
  onQuestionSelect: (q: string) => void;
}) => {
  console.log('[DEBUG] Rendering follow-up questions:', questions);
  
  return (
    <div className="space-y-2 mt-4">
      {questions.map((q, i) => (
        <div
          key={`q-${i}-${q.substring(0, 10)}`}
          className="animate-fade-in"
        >
          <Button
            variant="outline"
            className="w-full justify-start text-left transition-all duration-200 ease-in-out h-auto whitespace-normal py-3"
            onClick={() => onQuestionSelect(q)}
          >
            {q}
          </Button>
        </div>
      ))}
    </div>
  );
}, (prevProps, nextProps) => {
  // Only re-render if questions change
  return prevProps.questions === nextProps.questions;
});

// Message formatting utilities
const formatAssistantMessage = (content: string): string => {
  if (!content) return '';
  
  try {
    const contentObj = typeof content === 'object' ? content : JSON.parse(content);
    if (contentObj.understanding) {
      return contentObj.understanding;
    }
  } catch (e) {
    return content;
  }
  return content;
};

const formatQAMessage = (content: string) => {
  if (!content) return content;
  if (!content.startsWith('Q: ') || !content.includes('\n\nA: ')) return content;
  
  try {
    const [question, answer] = content.split('\n\nA: ');
    if (!question || !answer) return content;
    
    return (
      <div className="space-y-3">
        <div className="text-sm text-muted-foreground border-l-2 border-primary/30 pl-3">
          <span className="font-medium text-primary/70">Q:</span>
          {question.substring(2)}
        </div>
        <div>
          <span className="font-medium text-primary/70">A:</span>
          {answer}
        </div>
      </div>
    );
  } catch (e) {
    console.error('[ConversationView Debug] Error formatting Q&A:', e);
    return content;
  }
};

// Single message component
const MessageItem = React.memo(({ 
  message,
  role,
  content,
}: { 
  message: Message;
  role: "user" | "assistant";
  content: string;
}) => {
  const formattedContent = role === "user" 
    ? formatQAMessage(content)
    : formatAssistantMessage(content);
  
  return (
    <div className={`flex ${role === "user" ? "justify-end" : "justify-start"}`}>
      <Card 
        className={`max-w-[90%] sm:max-w-[80%] ${
          role === "user" 
            ? "bg-secondary/30" 
            : "bg-muted"
        } animate-fade-in`}
      >
        <CardContent className="p-3 md:p-4 text-sm md:text-base">
          <div className="whitespace-pre-wrap">
            {formattedContent}
          </div>
        </CardContent>
      </Card>
    </div>
  );
});

export function ConversationView({
  conversationId,
  messages,
  questions,
  onResponse,
  onNewMessage,
  onSelectedQuestion,
  isFirstSubmission = true,
  selectedQuestion: propSelectedQuestion = null,
}: ConversationViewProps) {
  // Basic state
  const [response, setResponse] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<string | null>(propSelectedQuestion);
  
  // Debug logging for questions
  useEffect(() => {
    console.log('[ConversationView Debug] Questions prop updated:', {
      hasQuestions: !!questions,
      questionCount: questions?.length,
      firstQuestion: questions?.[0]?.substring(0, 50),
    });
  }, [questions]);
  
  // Refs
  const scrollRef = useRef<HTMLDivElement>(null);
  
  // Hooks
  const { toast } = useToast();
  
  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, questions]);

  // Handle question selection
  const handleQuestionSelect = useCallback((question: string) => {
    console.log('[ConversationView Debug] Question selected:', question);
    setSelectedQuestion(question);
    if (onSelectedQuestion) {
      onSelectedQuestion(question);
    }
  }, [onSelectedQuestion]);

  // Handle form submission
  const handleSubmitResponse = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!response.trim()) {
      toast({
        title: "Response required",
        description: "Please enter a response before submitting.",
        variant: "destructive",
      });
      return;
    }
    
    if (!conversationId) {
      console.error("[ConversationView Debug] No conversation ID available");
      toast({
        title: "Error",
        description: "Unable to submit response - missing conversation ID.",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const messageContent = selectedQuestion 
        ? `Q: ${selectedQuestion}\n\nA: ${response}`
        : response;
      
      const userMessage: Message = {
        role: "user",
        content: messageContent
      };
      
      // Add user message to messages array
      const updatedMessages = [...messages, userMessage];
      if (onNewMessage) {
        onNewMessage(updatedMessages);
      }
      
      // Make API call to get LLM response
      let apiResponse;
      try {
        console.log(`[ConversationView Debug] Submitting response for conversation ${conversationId}`);
        apiResponse = await apiRequest(
          "POST",
          `/api/conversation/${conversationId}/respond`,
          { content: messageContent }
        );
      } catch (respondError) {
        console.error("[ConversationView Debug] Error with /respond endpoint:", respondError);
        throw new Error("Failed to get response from server");
      }
      
      const data = await apiResponse.json();
      console.log("[ConversationView Debug] Response data:", data);
      
      if (!data || (!data.conversation && !data.messages)) {
        console.error("[ConversationView Debug] Invalid response format:", data);
        throw new Error("Invalid response from server");
      }
      
      // Extract understanding and questions from the response
      const understanding = data.understanding || "";
      const newQuestions = data.questions || [];
      
      console.log('[ConversationView Debug] Extracted from response:', {
        hasUnderstanding: !!understanding,
        understandingPreview: understanding.substring(0, 50),
        hasQuestions: !!newQuestions.length,
        questionCount: newQuestions.length,
        firstQuestion: newQuestions[0]?.substring(0, 50)
      });
      
      // Create assistant message with parsed content
      let parsedUnderstanding = "";
      if (data.conversation?.messages) {
        // Get the last assistant message from the conversation
        const lastAssistantMessage = data.conversation.messages
          .filter((msg: Message) => msg.role === "assistant")
          .pop();
        
        if (lastAssistantMessage) {
          try {
            const parsedContent = JSON.parse(lastAssistantMessage.content);
            parsedUnderstanding = parsedContent.understanding || "";
          } catch (e) {
            console.error("[ConversationView Debug] Error parsing assistant message content:", e);
            parsedUnderstanding = lastAssistantMessage.content;
          }
        }
      }
      
      const assistantMessage: Message = {
        role: "assistant" as const,
        content: parsedUnderstanding || understanding || ""
      };
      
      // Update messages and questions
      const furtherUpdatedMessages = [...updatedMessages, assistantMessage];
      console.log(`[ConversationView Debug] Adding new assistant message:`, assistantMessage);
      console.log(`[ConversationView Debug] New questions:`, newQuestions);
      
      // Update parent component
      if (onResponse) {
        console.log('[ConversationView Debug] Calling onResponse with:', {
          messageCount: furtherUpdatedMessages.length,
          questionCount: newQuestions.length
        });
        
        onResponse({
          conversation: {
            id: conversationId,
            messages: furtherUpdatedMessages
          },
          questions: newQuestions,
          understanding: understanding
        });
      } else if (onNewMessage) {
        console.log('[ConversationView Debug] Calling onNewMessage with:', {
          messageCount: furtherUpdatedMessages.length
        });
        onNewMessage(furtherUpdatedMessages);
      }
      
      toast({
        title: "Response received",
        description: "Your message has been processed successfully.",
      });
      
      // Reset state
      setResponse("");
      setSelectedQuestion(null);
      
    } catch (error) {
      console.error("[ConversationView Debug] Error submitting response:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to submit response. Please try again.",
        variant: "destructive",
      });
      
      // Remove the user's message if we failed to get a response
      if (onNewMessage) {
        onNewMessage(messages);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col w-full h-full">
      <ScrollArea ref={scrollRef} className="flex-1 h-full overflow-y-auto px-1">
        <div className="flex flex-col space-y-4 md:space-y-5 py-2 md:py-4 mb-2 md:mb-4">
          {messages.map((message, index) => (
            <MessageItem
              key={`${conversationId}-${index}-${message.role}`}
              message={message}
              role={message.role}
              content={message.content}
            />
          ))}

          {isSubmitting && !isFirstSubmission && (
            <div className="flex justify-start w-full mt-2 md:mt-4">
              <MasjidLoadingAnimation />
            </div>
          )}
          
          {questions && questions.length > 0 && (
            <div className="flex justify-start w-full mt-2 md:mt-4">
              <Card className="max-w-[90%] sm:max-w-[80%] bg-muted animate-fade-in">
                <CardContent className="p-3 md:p-4 text-sm md:text-base">
                  <FollowUpQuestions 
                    questions={questions}
                    onQuestionSelect={handleQuestionSelect}
                  />
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </ScrollArea>
      
      <div className="mt-3 md:mt-4">
        {selectedQuestion && (
          <div className="p-2 md:p-3 bg-primary/10 rounded-md border border-primary/20 mb-2 md:mb-3 animate-fade-in text-sm md:text-base">
            <p className="text-xs md:text-sm font-medium">Responding to:</p>
            <p>{selectedQuestion}</p>
          </div>
        )}
        
        <form onSubmit={handleSubmitResponse} className="space-y-2">
          <Textarea 
            placeholder={selectedQuestion 
              ? "Type your response here..." 
              : "Type your message here..."}
            value={response} 
            onChange={(e) => setResponse(e.target.value)} 
            className="min-h-20 md:min-h-24 resize-none text-sm md:text-base"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                if (response.trim()) {
                  handleSubmitResponse(e);
                }
              }
            }}
          />
          
          <div className="flex justify-end">
            <Button type="submit" disabled={!response.trim()}>
              Send
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}