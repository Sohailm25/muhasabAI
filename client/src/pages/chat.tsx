import { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { ConversationView } from "@/components/ConversationView";
import { ActionItems } from "@/components/ActionItems";
import { useToast } from "@/hooks/use-toast";
import { useLocation, useRoute } from "wouter";
import { LoadingAnimation } from "@/components/LoadingAnimation";
import type { Message } from "@shared/schema";

export default function Chat() {
  const [, params] = useRoute<{ id: string }>("/chat/:id");
  const conversationId = params ? parseInt(params.id) : null;
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [questions, setQuestions] = useState<string[]>([]);
  const [actionItems, setActionItems] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingItems, setIsGeneratingItems] = useState(false);
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  // Load conversation data from localStorage
  useEffect(() => {
    if (conversationId) {
      try {
        const savedSession = localStorage.getItem(`ramadanReflection_${conversationId}`);
        if (savedSession) {
          const parsedSession = JSON.parse(savedSession);
          
          // Ensure messages are properly formatted with the correct types
          const formattedMessages = parsedSession.messages?.map((msg: any) => ({
            role: msg.role || "user",
            content: msg.content || ""
          })) || [];
          
          setMessages(formattedMessages);
          setQuestions(parsedSession.questions || []);
          setActionItems(parsedSession.actionItems || []);
          
          console.log("Loaded saved conversation:", parsedSession);
        } else {
          // Try to fetch from server if not in localStorage
          fetchConversationFromServer(conversationId);
        }
      } catch (error) {
        console.error("Error loading conversation:", error);
        toast({
          title: "Error",
          description: "Could not load conversation data. Please try again.",
          variant: "destructive",
        });
      }
    }
  }, [conversationId, toast]);

  // Fetch conversation data from server (fallback if not in localStorage)
  const fetchConversationFromServer = async (id: number) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/conversation/${id}`);
      if (!response.ok) {
        throw new Error("Failed to fetch conversation");
      }
      
      const data = await response.json();
      setMessages(data.messages || []);
      setQuestions(data.questions || []);
      setActionItems(data.actionItems || []);
      
      console.log("Fetched conversation from server:", data);
    } catch (error) {
      console.error("Error fetching conversation:", error);
      toast({
        title: "Error",
        description: "Could not fetch conversation from server.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Save conversation data to localStorage
  const saveConversation = (updatedMessages: Message[], updatedActionItems: string[]) => {
    if (conversationId) {
      try {
        const sessionData = {
          conversationId,
          messages: updatedMessages,
          questions,
          actionItems: updatedActionItems,
          timestamp: new Date().toISOString()
        };
        localStorage.setItem(`ramadanReflection_${conversationId}`, JSON.stringify(sessionData));
      } catch (error) {
        console.error("Error saving session:", error);
        toast({
          title: "Session Error",
          description: "Could not save session data.",
          variant: "destructive",
        });
      }
    }
  };

  const handleNewMessage = (newMessages: Message[]) => {
    setMessages(newMessages);
    
    // Reset the selected question after it's been used
    setSelectedQuestion(null);
    
    saveConversation(newMessages, actionItems);
  };

  const handleActionItemsChange = (newActionItems: string[]) => {
    setActionItems(newActionItems);
    saveConversation(messages, newActionItems);
  };

  const handleSelectedQuestion = (question: string) => {
    // Instead of adding the question as a user message immediately,
    // just keep track of which question was selected
    setSelectedQuestion(question);
  };

  // Add a new state to track the selected question
  const [selectedQuestion, setSelectedQuestion] = useState<string | null>(null);

  const handleGenerateActionItems = async () => {
    if (!conversationId) return;
    
    setIsGeneratingItems(true);
    try {
      const response = await fetch(`/api/conversation/${conversationId}/action-items`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate action items');
      }
      
      const data = await response.json();
      setActionItems(data.actionItems || []);
      saveConversation(messages, data.actionItems || []);
      
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
      setIsGeneratingItems(false);
    }
  };

  // Get the user's first message for title
  const firstUserMessage = messages.find(msg => msg.role === "user");
  const chatTitle = firstUserMessage?.content || "Reflection";
  const displayTitle = chatTitle.length > 30 ? chatTitle.substring(0, 30) + "..." : chatTitle;

  return (
    <Layout title={displayTitle}>
      {isLoading && <LoadingAnimation message="Loading conversation..." />}
      
      <div className="container max-w-4xl mx-auto py-4 md:py-8 h-full px-3 md:px-4">
        {/* On mobile, stack action items below conversation (reverse order) for better UX */}
        <div className="grid grid-cols-1 md:grid-cols-[1fr,2fr] gap-4 md:gap-6 animate-slide-in">
          {/* Action Items (Left on desktop, Bottom on mobile) */}
          <div className="w-full order-2 md:order-1">
            <h2 className="text-lg font-semibold mb-2 md:hidden">Action Items</h2>
            <ActionItems 
              items={actionItems} 
              onChange={handleActionItemsChange}
              onGenerate={handleGenerateActionItems}
              isGenerating={isGeneratingItems}
            />
          </div>
          
          {/* Conversation View (Right on desktop, Top on mobile) */}
          <div className="w-full order-1 md:order-2 mb-4 md:mb-0">
            <ConversationView 
              conversationId={conversationId || undefined}
              messages={messages} 
              onNewMessage={handleNewMessage}
              questions={questions}
              onSelectedQuestion={handleSelectedQuestion}
              isFirstSubmission={messages.length <= 2}
              selectedQuestion={selectedQuestion}
            />
          </div>
        </div>
      </div>
    </Layout>
  );
} 