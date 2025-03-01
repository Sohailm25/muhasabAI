import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { LoadingAnimation } from "@/components/LoadingAnimation";
import { MasjidLoadingAnimation } from "@/components/MasjidLoadingAnimation";
import type { Message } from "@shared/schema";
import { Textarea } from "@/components/ui/textarea";

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

// Fixed Typing Animation component that prevents re-animations
const TypingAnimation = ({ 
  text, 
  onComplete, 
  skipAnimation = false 
}: { 
  text: string; 
  onComplete?: () => void;
  skipAnimation?: boolean;
}) => {
  const [displayText, setDisplayText] = useState(skipAnimation ? text : '');
  const [isDone, setIsDone] = useState(skipAnimation);
  const hasAnimatedRef = useRef(skipAnimation);
  
  useEffect(() => {
    // If we should skip animation or already animated once, show full text immediately
    if (skipAnimation || hasAnimatedRef.current) {
      if (!isDone) {
        setDisplayText(text);
        setIsDone(true);
        hasAnimatedRef.current = true;
        if (onComplete) onComplete();
      }
      return;
    }
    
    // Mark that we're animating this text so we don't re-animate on re-renders
    hasAnimatedRef.current = true;
    
    let index = 0;
    const timer = setInterval(() => {
      if (index <= text.length) {
        setDisplayText(text.substring(0, index));
        index++;
      } else {
        clearInterval(timer);
        setIsDone(true);
        if (onComplete) onComplete();
      }
    }, 1);
    
    return () => clearInterval(timer);
  }, [text, onComplete, skipAnimation, isDone]);
  
  return (
    <p className="whitespace-pre-wrap">
      {displayText}
      {!isDone && <span className="animate-pulse">▌</span>}
    </p>
  );
};

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
  // Use the prop value if provided, otherwise use local state
  const [localSelectedQuestion, setLocalSelectedQuestion] = useState<string | null>(null);
  // Use the prop value if provided, otherwise fall back to local state
  const selectedQuestion = propSelectedQuestion !== null ? propSelectedQuestion : localSelectedQuestion;
  
  const [response, setResponse] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showQuestions, setShowQuestions] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  const [lastMessageId, setLastMessageId] = useState<number | null>(null);
  const [animatedMessageIds] = useState(() => new Set<string>());
  const conversationIdRef = useRef<number | null>(conversationId || null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  
  // Reset states when conversation ID changes
  useEffect(() => {
    if (conversationId !== conversationIdRef.current) {
      // Reset states
      setInitialLoad(true);
      setShowQuestions(false);
      setLastMessageId(null);
      setLocalSelectedQuestion(null);
      animatedMessageIds.clear();
      
      // Update the ref
      conversationIdRef.current = conversationId || null;
    }
  }, [conversationId, animatedMessageIds]);

  // Set initial load flag and show questions immediately for existing chats
  useEffect(() => {
    if (messages.length > 0) {
      setLastMessageId(messages.length - 1);
      setShowQuestions(true);
    }
    
    // Mark as no longer initial load after a brief delay
    const timer = setTimeout(() => {
      setInitialLoad(false);
    }, 300);
    
    return () => clearTimeout(timer);
  }, [conversationId, messages.length]);

  // Auto-scroll to bottom when messages change or when new questions appear
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, showQuestions, isSubmitting]);

  // Check if we should skip the animation for a message
  const shouldSkipAnimation = (index: number): boolean => {
    const messageKey = `${conversationId}-${index}`;
    
    // If we've already animated this message, skip animation
    if (animatedMessageIds.has(messageKey)) {
      return true;
    }
    
    // For already existing messages before response submission, skip animation
    // Only animate messages that are newly added (index > lastMessageId)
    // If lastMessageId is null, animate all messages
    const shouldSkip = lastMessageId !== null && index <= lastMessageId;
    
    // If we're actually animating (not skipping), add to the set of animated messages
    if (!shouldSkip) {
      animatedMessageIds.add(messageKey);
    }
    
    return shouldSkip;
  };

  const handleSubmitResponse = async (e: React.FormEvent) => {
    // Prevent default form submission behavior which causes page reload
    e.preventDefault();
    
    if (!response.trim()) {
      toast({
        title: "Response required",
        description: "Please enter a response before submitting.",
        variant: "destructive",
      });
      return;
    }
    
    // Save the current message count to identify new messages later
    setLastMessageId(messages.length - 1);
    // Ensure animations run for new responses
    setInitialLoad(false);
    
    setIsSubmitting(true);
    
    try {
      console.log(`Submitting response for conversation ${conversationId}`);
      
      // Include the selected question in the user's message if one was selected
      const messageContent = selectedQuestion 
        ? `Q: ${selectedQuestion}\n\nA: ${response}`
        : response;
        
      // Add user message to local messages first
      const userMessage: Message = {
        role: "user",
        content: messageContent
      };
      
      // Add user message to messages array
      const updatedMessages = [...messages, userMessage];
      if (onNewMessage) {
        onNewMessage(updatedMessages);
      }
      
      // Try the /respond endpoint first, with fallback to /message
      let apiResponse;
      try {
        apiResponse = await apiRequest(
          "POST",
          `/api/conversation/${conversationId}/respond`,
          { content: messageContent }
        );
      } catch (respondError) {
        console.warn("Error with /respond endpoint, trying /message endpoint:", respondError);
        // Try the /message endpoint as a fallback
        apiResponse = await apiRequest(
          "POST",
          `/api/conversation/${conversationId}/message`,
          { content: messageContent }
        );
      }
      
      const data = await apiResponse.json();
      console.log("Response data:", data);
      
      // Extract questions and understanding from the response
      let parsedQuestions = data.questions;
      let understanding = "";
      
      if (!parsedQuestions || !Array.isArray(parsedQuestions) || parsedQuestions.length === 0) {
        // Try to extract from assistant message
        try {
          const assistantMessages = data.conversation.messages.filter(
            (m: any) => m.role === "assistant"
          );
          
          if (assistantMessages.length > 0) {
            const lastAssistantMessage = assistantMessages[assistantMessages.length - 1];
            const parsedContent = JSON.parse(lastAssistantMessage.content);
            
            if (parsedContent.questions && Array.isArray(parsedContent.questions)) {
              parsedQuestions = parsedContent.questions;
            }
            
            if (parsedContent.understanding) {
              understanding = parsedContent.understanding;
            }
          }
        } catch (parseError) {
          console.error("Error parsing content from messages:", parseError);
          // Fall back to default questions if parsing fails
          parsedQuestions = [
            "How would you like to expand on your reflection?",
            "What aspects of your spiritual journey would you like to explore further?",
            "Is there anything specific from today that you'd like to reflect on more deeply?"
          ];
          understanding = "Thank you for sharing your thoughts.";
        }
      }
      
      // Get the assistant response message if available
      let assistantMessage = null;
      if (data.conversation && data.conversation.messages) {
        const assistantMessages = data.conversation.messages.filter(
          (m: any) => m.role === "assistant" && !updatedMessages.some(
            (existingMsg) => existingMsg.role === m.role && existingMsg.content === m.content
          )
        );
        
        if (assistantMessages.length > 0) {
          assistantMessage = assistantMessages[assistantMessages.length - 1];
        }
      }
      
      // Add assistant message to the chat if available
      if (assistantMessage) {
        const furtherUpdatedMessages = [...updatedMessages, assistantMessage];
        if (onNewMessage) {
          onNewMessage(furtherUpdatedMessages);
        }
      }
      
      // Reset selected question
      if (propSelectedQuestion === null) {
        setLocalSelectedQuestion(null);
      }
      
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
  const renderMessageContent = (message: Message, index: number) => {
    if (message.role === "assistant") {
      try {
        // Try to parse as JSON (for understanding + questions format)
        const data = JSON.parse(message.content);
        
        if (Array.isArray(data)) {
          // It's a simple array of questions
          return (
            <div className="space-y-2">
              {data.map((q, i) => (
                <div key={i} className="animate-fade-in-delay-1">
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left transition-all duration-200 ease-in-out h-auto whitespace-normal py-3"
                    onClick={() => handleQuestionSelect(q)}
                  >
                    {q}
                  </Button>
                </div>
              ))}
            </div>
          );
        } else if (data.understanding && data.questions) {
          // It's a structured response with understanding and questions
          // For newly added messages, we want to animate
          const skipAnim = shouldSkipAnimation(index);
          
          return (
            <div className="space-y-4">
              <div className="understanding-text">
                <TypingAnimation 
                  text={data.understanding} 
                  onComplete={() => setShowQuestions(true)} 
                  skipAnimation={skipAnim}
                />
              </div>
              {(showQuestions || skipAnim) && data.questions && data.questions.length > 0 && (
                <div className="space-y-2 mt-4">
                  {data.questions.map((q: string, i: number) => (
                    <div
                      key={i}
                      className={`animate-fade-in-delay-${i + 1}`}
                    >
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left transition-all duration-200 ease-in-out h-auto whitespace-normal py-3"
                        onClick={() => handleQuestionSelect(q)}
                      >
                        {q}
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        }
      } catch (e) {
        // If not JSON, render as plain text with typing animation
        return (
          <TypingAnimation 
            text={message.content} 
            skipAnimation={shouldSkipAnimation(index)}
          />
        );
      }
    }
    
    // For user messages with Q&A format
    if (message.role === "user" && message.content.startsWith('Q: ') && message.content.includes('\n\nA: ')) {
      const parts = message.content.split('\n\nA: ');
      const question = parts[0].substring(3); // Remove "Q: " prefix
      const answer = parts[1];
      
      return (
        <div className="space-y-2">
          <div className="p-2 bg-primary/5 rounded border-l-2 border-primary mb-2">
            <p className="text-xs text-muted-foreground font-medium">Question:</p>
            <p className="text-sm">{question}</p>
          </div>
          <p className="whitespace-pre-wrap">{answer}</p>
        </div>
      );
    }
    
    // Default rendering for simple text messages
    return <p className="whitespace-pre-wrap">{message.content}</p>;
  };

  const handleSubmitFollowupQuestion = async (questionText: string) => {
    if (!questionText.trim()) return;
    
    try {
      // Create new user message
      const userMessage: Message = {
        role: "user",
        content: questionText
      };
      
      // Add user message to the chat
      const updatedMessages = [...messages, userMessage];
      
      // If onNewMessage prop exists, use it, otherwise fall back to old behavior
      if (onNewMessage) {
        onNewMessage(updatedMessages);
      } else if (onResponse) {
        onResponse({
          conversation: {
            id: conversationId,
            messages: updatedMessages
          }
        });
      }
      
      // The rest of this function is simplified since it was just a placeholder
      // and the real implementation would depend on how follow-up questions are handled
    } catch (error) {
      console.error("Error handling follow-up question:", error);
      toast({
        title: "Error",
        description: "Failed to process your question. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleQuestionSelect = (question: string) => {
    // Update the local state
    setLocalSelectedQuestion(question);
    
    // Call the parent handler if provided
    if (onSelectedQuestion) {
      onSelectedQuestion(question);
    }
  };

  return (
    <>
      {/* Full screen loading animation ONLY for first-time submissions */}
      {isSubmitting && isFirstSubmission && <LoadingAnimation message="Processing your response..." />}
      
      {/* Container with improved slide-in animation - key based on conversationId for animation on change */}
      <div 
        key={`conversation-${conversationId}`} 
        className="flex flex-col w-full h-full max-w-3xl mx-auto animate-slide-in"
      >
        <ScrollArea ref={scrollRef} className="flex-1 h-full overflow-y-auto px-1">
          <div className="flex flex-col space-y-4 md:space-y-5 py-2 md:py-4 mb-2 md:mb-4">
            {messages.map((message, index) => (
              <div 
                key={index}
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <Card 
                  className={`max-w-[90%] sm:max-w-[80%] ${
                    message.role === "user" 
                      ? "bg-secondary/30" 
                      : "bg-muted"
                  }`}
                >
                  <CardContent className="p-3 md:p-4 text-sm md:text-base">
                    {renderMessageContent(message, index)}
                  </CardContent>
                </Card>
              </div>
            ))}

            {/* Masjid animation for ALL follow-up submissions */}
            {isSubmitting && !isFirstSubmission && (
              <div className="flex justify-start w-full mt-2 md:mt-4">
                <MasjidLoadingAnimation />
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
                // Submit on Enter but allow Shift+Enter for newlines
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault(); // Prevent default behavior (newline)
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
    </>
  );
}