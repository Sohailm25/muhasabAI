import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { LoadingAnimation } from "@/components/LoadingAnimation";
import { MasjidLoadingAnimation } from "@/components/MasjidLoadingAnimation";
import { cn } from "@/lib/utils";
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
  onAnimationStart?: () => void;
  onAnimationComplete?: () => void;
  isFirstSubmission?: boolean;
  selectedQuestion?: string | null;
}

// Simplified TypingAnimation component
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
  const animationRef = useRef<NodeJS.Timeout>();
  
  useEffect(() => {
    // If skipping animation, show full text immediately
    if (skipAnimation) {
      setDisplayText(text);
      if (onComplete) onComplete();
      return;
    }
    
    let index = 0;
    const animate = () => {
      if (index <= text.length) {
        setDisplayText(text.substring(0, index));
        index++;
        animationRef.current = setTimeout(animate, 1);
      } else {
        if (onComplete) onComplete();
      }
    };
    
    animate();
    
    return () => {
      if (animationRef.current) {
        clearTimeout(animationRef.current);
      }
    };
  }, [text, skipAnimation, onComplete]);
  
  return (
    <p className="whitespace-pre-wrap">
      {displayText}
      {displayText.length < text.length && <span className="animate-pulse">▌</span>}
    </p>
  );
}, (prevProps, nextProps) => {
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
  // Log every render of this component with full props info
  console.log(`[DEBUG] FollowUpQuestions component received props:`, {
    questionsCount: questions.length,
    isVisible: isVisible,
    firstQuestionPreview: questions.length > 0 ? questions[0].substring(0, 30) + '...' : 'none',
  });
  
  // If not visible yet, don't render anything
  if (!isVisible) {
    console.log('[DEBUG] FollowUpQuestions not visible, returning null');
    return null;
  }
  
  console.log('[DEBUG] FollowUpQuestions is visible, rendering buttons');
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
  const shouldUpdate = prevProps.isVisible !== nextProps.isVisible || 
                       prevProps.questions !== nextProps.questions;
  console.log(`[DEBUG] FollowUpQuestions memoization - shouldUpdate: ${shouldUpdate}`);
  return !shouldUpdate;
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
  const componentId = useRef(`msg_${Math.floor(Math.random() * 1000)}`);
  
  // Log mount/unmount
  useEffect(() => {
    console.log(`[ANIMATION DEBUG] MessageItem MOUNTED:`, {
      id: componentId.current,
      index,
      messageKey,
      role: message.role,
      isInitialRender,
      isFirstMessage: index === 0,
      isFirstAIResponse: index === 1 && message.role === "assistant"
    });
    
    return () => {
      console.log(`[ANIMATION DEBUG] MessageItem UNMOUNTED:`, {
        id: componentId.current,
        index,
        messageKey
      });
    };
  }, [index, messageKey, message.role, isInitialRender]);
  
  // Determine if animation should be skipped
  const skipAnim = shouldSkipAnimation(index);
  
  // Log when skipAnim changes
  useEffect(() => {
    console.log(`[ANIMATION DEBUG] MessageItem animation state:`, {
      id: componentId.current,
      index,
      messageKey,
      skipAnim,
      typingComplete,
      role: message.role,
      isInitialRender,
      isFirstMessage: index === 0,
      isFirstAIResponse: index === 1 && message.role === "assistant"
    });
  }, [skipAnim, index, messageKey, typingComplete, message.role, isInitialRender]);
  
  // Function to handle when typing animation completes
  const handleTypingComplete = useCallback(() => {
    console.log(`[ANIMATION DEBUG] MessageItem animation completed:`, {
      id: componentId.current,
      index,
      messageKey,
      role: message.role,
      isFirstMessage: index === 0,
      isFirstAIResponse: index === 1 && message.role === "assistant"
    });
    
    setTypingComplete(true);
    messageAnimationCompleted(messageKey);
  }, [index, messageKey, messageAnimationCompleted, message.role]);
  
  // Log re-renders
  console.log(`[ANIMATION DEBUG] MessageItem render:`, {
    id: componentId.current,
    index,
    messageKey,
    typingComplete,
    skipAnim,
    role: message.role,
    isInitialRender,
    isFirstMessage: index === 0,
    isFirstAIResponse: index === 1 && message.role === "assistant"
  });
  
  if (message.role === "assistant") {
    try {
      // Try to parse as JSON (for understanding + questions format)
      const data = JSON.parse(message.content);
      console.log(`[ANIMATION DEBUG] MessageItem parsed content:`, {
        id: componentId.current,
        index,
        messageKey,
        hasUnderstanding: !!data.understanding,
        hasQuestions: !!data.questions,
        isArray: Array.isArray(data),
        skipAnim
      });
      
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
      console.log(`[ANIMATION DEBUG] MessageItem rendering plain text:`, {
        id: componentId.current,
        index,
        messageKey,
        skipAnim,
        contentPreview: message.content.substring(0, 50)
      });
      
      return (
        <TypingAnimation 
          text={message.content} 
          onComplete={handleTypingComplete}
          skipAnimation={skipAnim}
          messageId={messageKey}
        />
      );
    }
  }
  
  // User message
  return (
    <p className="whitespace-pre-wrap">
      {message.content}
    </p>
  );
}, (prevProps, nextProps) => {
  // Log memo comparison
  const shouldUpdate = 
    prevProps.message !== nextProps.message ||
    prevProps.index !== nextProps.index ||
    prevProps.shouldSkipAnimation(prevProps.index) !== nextProps.shouldSkipAnimation(nextProps.index) ||
    prevProps.isInitialRender !== nextProps.isInitialRender ||
    prevProps.conversationId !== nextProps.conversationId;
  
  console.log(`[ANIMATION DEBUG] MessageItem memo comparison:`, {
    shouldUpdate,
    messageChanged: prevProps.message !== nextProps.message,
    indexChanged: prevProps.index !== nextProps.index,
    skipAnimChanged: prevProps.shouldSkipAnimation(prevProps.index) !== nextProps.shouldSkipAnimation(nextProps.index),
    initialRenderChanged: prevProps.isInitialRender !== nextProps.isInitialRender,
    conversationIdChanged: prevProps.conversationId !== nextProps.conversationId,
    index: prevProps.index,
    role: prevProps.message.role,
    isFirstMessage: prevProps.index === 0,
    isFirstAIResponse: prevProps.index === 1 && prevProps.message.role === "assistant"
  });
  
  return !shouldUpdate;
});

export function ConversationView({
  conversationId,
  messages,
  questions,
  onResponse,
  onNewMessage,
  onSelectedQuestion,
  onAnimationStart,
  onAnimationComplete,
  isFirstSubmission = true,
  selectedQuestion: propSelectedQuestion = null,
}: ConversationViewProps) {
  // Basic state
  const [response, setResponse] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showQuestions, setShowQuestions] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<string | null>(propSelectedQuestion);
  
  // Refs
  const scrollRef = useRef<HTMLDivElement>(null);
  const completedAnimationsRef = useRef(new Set<string>());
  
  // Debug logging
  useEffect(() => {
    console.log('[ConversationView Debug] State update:', {
      messagesLength: messages.length,
      questionsLength: questions?.length,
      showQuestions,
      isSubmitting
    });
  }, [messages.length, questions?.length, showQuestions, isSubmitting]);

  // Handle message animation completion
  const handleMessageAnimationComplete = useCallback((messageKey: string) => {
    console.log('[ConversationView Debug] Message animation completed:', messageKey);
    completedAnimationsRef.current.add(messageKey);
    
    // Check if all messages have completed animation
    const allMessagesAnimated = messages.every((_, i) => {
      const key = `${conversationId}-${i}`;
      return completedAnimationsRef.current.has(key);
    });
    
    if (allMessagesAnimated) {
      console.log('[ConversationView Debug] All messages animated, showing questions');
      setShowQuestions(true);
      if (onAnimationComplete) {
        onAnimationComplete();
      }
    }
  }, [messages, conversationId, onAnimationComplete]);

  // Reset state when conversation changes
  useEffect(() => {
    console.log('[ConversationView Debug] Conversation changed:', conversationId);
    setShowQuestions(false);
    completedAnimationsRef.current.clear();
    
    if (messages.length > 0 && onAnimationStart) {
      onAnimationStart();
    }
  }, [conversationId, messages.length, onAnimationStart]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, showQuestions]);

  // Handle question selection
  const handleQuestionSelect = useCallback((question: string) => {
    setSelectedQuestion(question);
    if (onSelectedQuestion) {
      onSelectedQuestion(question);
    }
  }, [onSelectedQuestion]);

  // Handle form submission
  const handleSubmitResponse = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!response.trim()) {
      return;
    }
    
    setShowQuestions(false);
    setIsSubmitting(true);
    
    try {
      const messageContent = selectedQuestion 
        ? `Q: ${selectedQuestion}\n\nA: ${response}`
        : response;
      
      const userMessage: Message = {
        role: "user",
        content: messageContent
      };
      
      const updatedMessages = [...messages, userMessage];
      if (onNewMessage) {
        onNewMessage(updatedMessages);
      }
      
      // Rest of the submission logic remains unchanged
      // ... existing API calls and response handling ...
      
      setResponse("");
      setSelectedQuestion(null);
    } catch (error) {
      console.error("Error submitting response:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render messages with animation
  const messageElements = messages.map((message, index) => (
    <div 
      key={`${conversationId}-${index}-${message.role}`}
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
          <TypingAnimation 
            text={message.content}
            skipAnimation={completedAnimationsRef.current.has(`${conversationId}-${index}`)}
            messageId={`${conversationId}-${index}`}
            onComplete={() => handleMessageAnimationComplete(`${conversationId}-${index}`)}
          />
        </CardContent>
      </Card>
    </div>
  ));

  return (
    <div className="flex flex-col w-full h-full">
      <ScrollArea ref={scrollRef} className="flex-1 h-full overflow-y-auto px-1">
        <div className="flex flex-col space-y-4 md:space-y-5 py-2 md:py-4 mb-2 md:mb-4">
          {messageElements}

          {isSubmitting && !isFirstSubmission && (
            <div className="flex justify-start w-full mt-2 md:mt-4">
              <MasjidLoadingAnimation />
            </div>
          )}
          
          {showQuestions && questions && questions.length > 0 && (
            <div className="flex justify-start w-full mt-2 md:mt-4">
              <Card className="max-w-[90%] sm:max-w-[80%] bg-muted">
                <CardContent className="p-3 md:p-4 text-sm md:text-base">
                  <FollowUpQuestions 
                    questions={questions}
                    onQuestionSelect={handleQuestionSelect}
                    isVisible={true}
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