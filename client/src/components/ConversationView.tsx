import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { LoadingAnimation } from "@/components/LoadingAnimation";
import { MasjidLoadingAnimation } from "@/components/MasjidLoadingAnimation";
import type { Message } from "@shared/schema";
import { Textarea } from "@/components/ui/textarea";
import React from "react";

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

// Memoized Typing Animation component that prevents re-animations
const TypingAnimation = React.memo(({ 
  text, 
  onComplete, 
  skipAnimation = false,
  messageId = ''
}: { 
  text: string; 
  onComplete?: () => void;
  skipAnimation?: boolean;
  messageId?: string;
}) => {
  const [displayText, setDisplayText] = useState(skipAnimation ? text : '');
  const [isDone, setIsDone] = useState(skipAnimation);
  const hasAnimatedRef = useRef(skipAnimation);
  const isAnimatingRef = useRef(false);
  
  // Add a unique ID for this instance for better logging
  const animationId = useRef(`anim_${Math.floor(Math.random() * 1000)}`);
  
  useEffect(() => {
    console.log(`[${animationId.current}] TypingAnimation setup - skipAnimation: ${skipAnimation}, textLength: ${text.length}, hasAnimated: ${hasAnimatedRef.current}, messageId: ${messageId}`);
    
    // If we should skip animation or already animated once, show full text immediately
    if (skipAnimation || hasAnimatedRef.current) {
      if (!isDone) {
        console.log(`[${animationId.current}] Skipping animation, showing full text immediately`);
        setDisplayText(text);
        setIsDone(true);
        hasAnimatedRef.current = true;
        if (onComplete) onComplete();
      }
      return;
    }
    
    // Ensure we're not already animating
    if (isAnimatingRef.current) {
      console.log(`[${animationId.current}] Animation already in progress, not starting a new one`);
      return;
    }
    
    // Reset text if re-animating
    if (!skipAnimation && !hasAnimatedRef.current) {
      setDisplayText('');
    }
    
    // Mark that we're animating this text so we don't re-animate on re-renders
    hasAnimatedRef.current = true;
    isAnimatingRef.current = true;
    
    console.log(`[${animationId.current}] Starting animation with interval: 1ms`);
    let index = 0;
    const timer = setInterval(() => {
      if (index <= text.length) {
        setDisplayText(text.substring(0, index));
        index++;
        
        // Log progress occasionally to avoid flooding console
        if (index % 50 === 0 || index === text.length) {
          console.log(`[${animationId.current}] Animation progress: ${index}/${text.length}`);
        }
      } else {
        console.log(`[${animationId.current}] Animation complete`);
        clearInterval(timer);
        setIsDone(true);
        isAnimatingRef.current = false;
        if (onComplete) onComplete();
      }
    }, 1);
    
    return () => {
      console.log(`[${animationId.current}] Cleaning up animation timer`);
      clearInterval(timer);
      isAnimatingRef.current = false;
    };
  }, [text, onComplete, skipAnimation, isDone, messageId]);
  
  return (
    <p className="whitespace-pre-wrap">
      {displayText}
      {!isDone && <span className="animate-pulse">▌</span>}
    </p>
  );
}, (prevProps, nextProps) => {
  // Only re-render if these props change
  return prevProps.text === nextProps.text && 
         prevProps.skipAnimation === nextProps.skipAnimation &&
         prevProps.messageId === nextProps.messageId;
});

// Memoized Follow-up Questions component to prevent re-renders
const FollowUpQuestions = React.memo(({ 
  questions, 
  onQuestionSelect,
  isVisible = false
}: {
  questions: string[];
  onQuestionSelect: (q: string) => void;
  isVisible: boolean;
}) => {
  // If not visible yet, don't render anything
  if (!isVisible) return null;
  
  return (
    <div className="space-y-2 mt-4">
      {questions.map((q, i) => {
        // Apply different animations based on position
        const animationClass = 
          i === 0 ? "animate-staggered-fade-1" : 
          i === 1 ? "animate-staggered-fade-2" : 
          "animate-staggered-fade-3";
        
        return (
          <div
            key={`q-${i}-${q.substring(0, 10)}`}
            className={animationClass}
            style={{ opacity: 0 }} // Start invisible for animation
          >
            <Button
              variant="outline"
              className="w-full justify-start text-left transition-all duration-200 ease-in-out h-auto whitespace-normal py-3"
              onClick={() => onQuestionSelect(q)}
            >
              {q}
            </Button>
          </div>
        );
      })}
    </div>
  );
}, (prevProps, nextProps) => {
  // Only re-render if questions change or visibility changes
  return prevProps.isVisible === nextProps.isVisible && 
         prevProps.questions === nextProps.questions;
});

// Single message component to prevent re-renders of other messages
const MessageItem = React.memo(({ 
  message, 
  index, 
  shouldSkipAnimation,
  onQuestionSelect,
  messageAnimationCompleted,
  isInitialRender,
  conversationId
}: { 
  message: Message; 
  index: number;
  shouldSkipAnimation: (index: number) => boolean;
  onQuestionSelect: (q: string) => void;
  messageAnimationCompleted: (messageKey: string) => void;
  isInitialRender: boolean;
  conversationId?: number;
}) => {
  const [typingComplete, setTypingComplete] = useState(false);
  const messageKey = `${conversationId}-${index}`;
  
  // Determine if animation should be skipped
  const skipAnim = shouldSkipAnimation(index);
  
  // Function to handle when typing animation completes
  const handleTypingComplete = useCallback(() => {
    console.log(`Animation completed for message ${index}`);
    setTypingComplete(true);
    messageAnimationCompleted(messageKey);
  }, [index, messageKey, messageAnimationCompleted]);
  
  if (message.role === "assistant") {
    try {
      // Try to parse as JSON (for understanding + questions format)
      const data = JSON.parse(message.content);
      
      if (Array.isArray(data)) {
        // It's a simple array of questions
        return (
          <div className="space-y-2">
            <FollowUpQuestions 
              questions={data} 
              onQuestionSelect={onQuestionSelect}
              isVisible={true} 
            />
          </div>
        );
      } else if (data.understanding && data.questions) {
        // It's a structured response with understanding and questions
        return (
          <div className="space-y-4">
            <div className="understanding-text">
              <TypingAnimation 
                text={data.understanding} 
                onComplete={handleTypingComplete} 
                skipAnimation={skipAnim}
                messageId={messageKey}
              />
            </div>
            <FollowUpQuestions 
              questions={data.questions} 
              onQuestionSelect={onQuestionSelect}
              isVisible={typingComplete || skipAnim} 
            />
          </div>
        );
      }
    } catch (e) {
      // If not JSON, render as plain text with typing animation
      return (
        <TypingAnimation 
          text={message.content} 
          skipAnimation={skipAnim}
          messageId={messageKey}
          onComplete={() => messageAnimationCompleted(messageKey)}
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
}, (prevProps, nextProps) => {
  // Only re-render if message content changes or animation state changes
  return prevProps.message === nextProps.message && 
         prevProps.isInitialRender === nextProps.isInitialRender &&
         prevProps.shouldSkipAnimation(prevProps.index) === nextProps.shouldSkipAnimation(nextProps.index);
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
  // Use the prop value if provided, otherwise use local state
  const [localSelectedQuestion, setLocalSelectedQuestion] = useState<string | null>(null);
  // Use the prop value if provided, otherwise fall back to local state
  const selectedQuestion = propSelectedQuestion !== null ? propSelectedQuestion : localSelectedQuestion;
  
  const [response, setResponse] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showQuestions, setShowQuestions] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  const [lastMessageId, setLastMessageId] = useState<number | null>(null);
  const [isInitialRender, setIsInitialRender] = useState(true);
  
  // Use useRef for animation tracking to prevent re-renders
  const animatedMessageIdsRef = useRef(new Set<string>());
  const completedAnimationsRef = useRef(new Set<string>());
  const conversationIdRef = useRef<number | null>(conversationId || null);
  const messagesLengthRef = useRef<number>(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  
  // Stabilize initial render
  useEffect(() => {
    // Set initial render flag once on mount
    const timer = setTimeout(() => {
      setIsInitialRender(false);
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);
  
  // Reset states when conversation ID changes
  useEffect(() => {
    if (conversationId !== conversationIdRef.current) {
      // Reset states
      setInitialLoad(true);
      setIsInitialRender(true);
      setShowQuestions(false);
      setLastMessageId(null);
      setLocalSelectedQuestion(null);
      
      // Reset animation tracking
      animatedMessageIdsRef.current.clear();
      completedAnimationsRef.current.clear();
      
      // Update the ref
      conversationIdRef.current = conversationId || null;
      
      // Short delay to stabilize
      setTimeout(() => {
        setIsInitialRender(false);
      }, 100);
    }
  }, [conversationId]);

  // Handle initial load and new messages
  useEffect(() => {
    // Avoid processing if nothing has changed
    if (messages.length === messagesLengthRef.current && !initialLoad) {
      return;
    }
    
    messagesLengthRef.current = messages.length;
    
    if (messages.length > 0) {
      console.log(`Messages updated, count: ${messages.length}, lastMessageId: ${lastMessageId}, initialLoad: ${initialLoad}`);
      
      // Force animation for all messages on initial load
      if (initialLoad) {
        console.log('Initial load detected, resetting animation state to ensure proper animation');
        // Clear any existing tracking to force fresh animations
        animatedMessageIdsRef.current.clear();
        completedAnimationsRef.current.clear();
        
        // Reset lastMessageId to null to force animations
        setLastMessageId(null);
        
        // Update visibility of follow-up questions based on animation state
        setShowQuestions(false);
      }
    }
    
    // Mark as no longer initial load after a brief delay
    if (initialLoad) {
      const timer = setTimeout(() => {
        setInitialLoad(false);
      }, 300);
      
      return () => clearTimeout(timer);
    }
  }, [conversationId, messages, initialLoad, lastMessageId]);

  // Auto-scroll to bottom when messages change or when new questions appear
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, showQuestions, isSubmitting]);

  // Memoized and stable function to check if we should skip animation
  const shouldSkipAnimation = useCallback((index: number): boolean => {
    const messageKey = `${conversationId}-${index}`;
    
    // If we've already animated this message, skip animation
    if (animatedMessageIdsRef.current.has(messageKey)) {
      console.log(`Animation SKIP - Already animated message ${index}`);
      return true;
    }
    
    // If we're in initial load, don't skip animations
    if (initialLoad) {
      console.log(`Animation WILL RUN for message ${index} (initial load)`);
      animatedMessageIdsRef.current.add(messageKey);
      return false;
    }
    
    // For already existing messages before response submission, skip animation
    // Only animate messages that are newly added (index > lastMessageId)
    const shouldSkip = lastMessageId !== null && index <= lastMessageId;
    
    console.log(`Animation Check - Message ${index}, lastMessageId: ${lastMessageId}, shouldSkip: ${shouldSkip}`);
    
    // If we're actually animating (not skipping), add to the set of animated messages
    if (!shouldSkip) {
      console.log(`Animation WILL RUN for message ${index}`);
      animatedMessageIdsRef.current.add(messageKey);
    }
    
    return shouldSkip;
  }, [conversationId, lastMessageId, initialLoad]);
  
  // Stable function to handle when a message animation completes
  const handleMessageAnimationCompleted = useCallback((messageKey: string) => {
    completedAnimationsRef.current.add(messageKey);
    setShowQuestions(true);
  }, []);

  // Stable function to handle question selection
  const handleQuestionSelect = useCallback((question: string) => {
    // Update the local state
    setLocalSelectedQuestion(question);
    
    // Call the parent handler if provided
    if (onSelectedQuestion) {
      onSelectedQuestion(question);
    }
  }, [onSelectedQuestion]);

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
    console.log(`Before setting lastMessageId, current value: ${lastMessageId}, messages.length: ${messages.length}`);
    
    // Only update lastMessageId if we're actually submitting a new message
    if (!isSubmitting) {
      setLastMessageId(messages.length - 1);
      console.log(`After setting lastMessageId: ${messages.length - 1}`);
    }
    
    // Reset state for new response
    setInitialLoad(false);
    setShowQuestions(false);
    
    setIsSubmitting(true);
    
    try {
      // Rest of the submit function remains unchanged
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
        console.log(`Adding new assistant message: ${assistantMessage.content.substring(0, 30)}...`);
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
    } catch (error) {
      console.error("Error handling follow-up question:", error);
      toast({
        title: "Error",
        description: "Failed to process your question. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Memoize message list to avoid recreation on every render
  const messageElements = useMemo(() => {
    return messages.map((message, index) => (
      <div 
        key={`${conversationId}-${index}-${message.role}-${isInitialRender ? 'initial' : 'stable'}`}
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
            <MessageItem 
              message={message} 
              index={index}
              shouldSkipAnimation={shouldSkipAnimation}
              onQuestionSelect={handleQuestionSelect}
              messageAnimationCompleted={handleMessageAnimationCompleted}
              isInitialRender={isInitialRender}
              conversationId={conversationId}
            />
          </CardContent>
        </Card>
      </div>
    ));
  }, [
    messages, 
    conversationId, 
    shouldSkipAnimation, 
    handleQuestionSelect, 
    handleMessageAnimationCompleted,
    isInitialRender
  ]);

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
            {messageElements}

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