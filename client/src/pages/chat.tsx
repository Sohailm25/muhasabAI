import { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { ConversationView } from "@/components/ConversationView";
import { ActionItems } from "@/components/ActionItems";
import { Insights } from "@/components/Insights";
import { useToast } from "@/hooks/use-toast";
import { useLocation, useRoute } from "wouter";
import { LoadingAnimation } from "@/components/LoadingAnimation";
import type { Message } from "@shared/schema";

export default function Chat() {
  const [, params] = useRoute<{ id: string }>("/chat/:id");
  const reflectionId = params ? parseInt(params.id) : null;
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [questions, setQuestions] = useState<string[]>([]);
  const [actionItems, setActionItems] = useState<string[]>([]);
  const [insights, setInsights] = useState<string[]>([]);
  const [followUpCount, setFollowUpCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingItems, setIsGeneratingItems] = useState(false);
  const [isGeneratingInsights, setIsGeneratingInsights] = useState(false);
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  // Track if insights can be generated (3+ follow-up questions answered)
  const canGenerateInsights = followUpCount >= 3;

  // Load reflection data from localStorage
  useEffect(() => {
    if (reflectionId) {
      try {
        console.log(`Loading reflection data for ID: ${reflectionId}`);
        const savedSession = localStorage.getItem(`ramadanReflection_${reflectionId}`);
        
        if (savedSession) {
          const parsedSession = JSON.parse(savedSession);
          console.log("Loaded session data:", parsedSession);
          
          // Define empty arrays for missing data to avoid undefined errors
          const emptyArray: any[] = [];
          
          // Check if we have direct API response data
          if (parsedSession.understanding || parsedSession.questions?.length > 0) {
            console.log("Found direct API response data:");
            console.log("- Understanding:", parsedSession.understanding ? "Yes" : "No");
            console.log("- Questions:", parsedSession.questions?.length || 0);
          }
          
          // First, check for new format with understanding and original content
          if (parsedSession.understanding && parsedSession.original) {
            console.log("Using new reflection format with understanding and original");
            // Convert to message format for ConversationView
            const initialMessages: Message[] = [
              { role: "user", content: parsedSession.original || "" },
              { role: "assistant", content: parsedSession.understanding || "" }
            ];
            
            setMessages(initialMessages);
            setQuestions(parsedSession.questions || emptyArray);
            setActionItems(parsedSession.actionItems || emptyArray);
            setInsights(parsedSession.insights || emptyArray);
            
            // Log the extracted questions to verify they're loaded correctly
            console.log("Loaded questions:", parsedSession.questions || emptyArray);
          } 
          // Then check for old format with messages array
          else if (parsedSession.messages && parsedSession.messages.length > 0) {
            console.log("Using old conversation format with messages array");
            // Old format - ensure messages are properly formatted with the correct types
            const formattedMessages = parsedSession.messages?.map((msg: any) => ({
              role: msg.role || "user",
              content: msg.content || ""
            }));
            
            setMessages(formattedMessages || []);
            setQuestions(parsedSession.questions || emptyArray);
            setActionItems(parsedSession.actionItems || emptyArray);
            setInsights(parsedSession.insights || emptyArray);
          }
          // Finally check if we have individual message fields but not in an array
          else if (parsedSession.original) {
            console.log("Using extracted individual fields");
            // Construct messages from individual fields
            const initialMessages: Message[] = [
              { role: "user", content: parsedSession.original || "" }
            ];
            
            // Add assistant message if we have an understanding
            if (parsedSession.understanding) {
              initialMessages.push({ role: "assistant", content: parsedSession.understanding });
              console.log("Added assistant understanding message:", parsedSession.understanding);
            } else {
              console.warn("No understanding found in session data");
            }
            
            setMessages(initialMessages);
            
            // Make sure to extract questions if they exist
            if (parsedSession.questions && parsedSession.questions.length > 0) {
              console.log("Found questions in session data:", parsedSession.questions);
              setQuestions(parsedSession.questions);
            } else {
              console.warn("No questions found in session data");
              setQuestions(emptyArray);
            }
            
            setActionItems(parsedSession.actionItems || emptyArray);
            setInsights(parsedSession.insights || emptyArray);
          }
          
          // Count existing follow-up questions
          countFollowUps();
        } else {
          // If not in localStorage, try to fetch from server
          console.log("No data in localStorage, trying server fetch");
          fetchReflectionFromServer(reflectionId);
        }
      } catch (error) {
        console.error("Error loading session:", error);
        toast({
          title: "Error",
          description: "Could not load the saved session.",
          variant: "destructive",
        });
      }
    }
  }, [reflectionId]); // Only run when reflectionId changes

  // Fetch reflection data from server (fallback if not in localStorage)
  const fetchReflectionFromServer = async (id: number) => {
    setIsLoading(true);
    try {
      // First try the new reflection endpoint
      const response = await fetch(`/api/reflection/${id}`);
      
      if (!response.ok) {
        // If that fails, try the old conversation endpoint
        const oldResponse = await fetch(`/api/conversation/${id}`);
        
        if (!oldResponse.ok) {
          throw new Error("Failed to fetch reflection data");
        }
        
        const data = await oldResponse.json();
        setMessages(data.messages || []);
        setQuestions(data.questions || []);
        setActionItems(data.actionItems || []);
        setInsights(data.insights || []);
        
        console.log("Fetched conversation from server:", data);
      } else {
        // Handle new reflection data format
        const data = await response.json();
        
        // Convert to message format
        const initialMessages: Message[] = [
          { role: "user", content: data.original || "" },
          { role: "assistant", content: data.understanding || "" }
        ];
        
        setMessages(initialMessages);
        setQuestions(data.questions || []);
        setActionItems(data.actionItems || []);
        setInsights(data.insights || []);
        
        console.log("Fetched reflection from server:", data);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      toast({
        title: "Error",
        description: "Could not fetch data from server.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Count follow-up questions in messages
  const countFollowUps = () => {
    // Find user messages that are responding to follow-up questions
    // Format: "Q: [question]\n\nA: [answer]"
    const followUpResponses = messages.filter(msg => 
      msg.role === "user" && 
      msg.content.startsWith("Q: ") && 
      msg.content.includes("\n\nA: ")
    );
    
    setFollowUpCount(followUpResponses.length);
  };
  
  // When messages change, recount follow-ups
  useEffect(() => {
    countFollowUps();
  }, [messages]);

  // Save the conversation data to localStorage
  const saveConversation = (
    updatedMessages: Message[], 
    updatedActionItems: string[] = actionItems,
    updatedInsights: string[] = insights
  ) => {
    if (!reflectionId) return;
    
    try {
      const sessionData = {
        reflectionId: reflectionId,
        messages: updatedMessages,
        questions: questions,
        actionItems: updatedActionItems,
        insights: updatedInsights,
        timestamp: new Date().toISOString()
      };
      
      localStorage.setItem(`ramadanReflection_${reflectionId}`, JSON.stringify(sessionData));
      console.log("Saved session to localStorage");
    } catch (error) {
      console.error("Error saving session:", error);
      toast({
        title: "Session Error",
        description: "Could not save session data.",
        variant: "destructive",
      });
    }
  };

  // Handle new messages being added to the conversation
  const handleNewMessage = (newMessages: Message[]) => {
    console.log("Updating messages:", newMessages);
    setMessages(newMessages);
    saveConversation(newMessages);
    
    // Update follow-up count based on new messages
    const followUpResponses = newMessages.filter(msg => 
      msg.role === "user" && 
      msg.content.startsWith("Q: ") && 
      msg.content.includes("\n\nA: ")
    );
    
    setFollowUpCount(followUpResponses.length);
  };

  const handleActionItemsChange = (newActionItems: string[]) => {
    setActionItems(newActionItems);
    saveConversation(messages, newActionItems, insights);
  };

  const handleInsightsChange = (newInsights: string[]) => {
    setInsights(newInsights);
    saveConversation(messages, actionItems, newInsights);
  };

  const handleSelectedQuestion = (question: string) => {
    // Instead of adding the question as a user message immediately,
    // just keep track of which question was selected
    setSelectedQuestion(question);
  };

  // Add a new state to track the selected question
  const [selectedQuestion, setSelectedQuestion] = useState<string | null>(null);

  const handleGenerateActionItems = async () => {
    if (!reflectionId) return;
    
    setIsGeneratingItems(true);
    try {
      // Get personalization context if available
      let personalizationContext = null;
      try {
        // Try to get personalization context from localStorage
        const profileData = localStorage.getItem('userProfile');
        if (profileData) {
          const parsedProfile = JSON.parse(profileData);
          // Check if personalization is enabled
          if (parsedProfile.privacySettings?.allowPersonalization) {
            personalizationContext = parsedProfile.privateProfile || null;
            console.log("Using personalization for action items");
          }
        }
      } catch (error) {
        console.error("Error getting personalization context:", error);
      }
      
      // Convert messages to a string representation for the API
      const conversationText = messages.map(msg => 
        `${msg.role === 'user' ? 'User' : 'AI'}: ${msg.content}`
      ).join('\n\n');
      
      const response = await fetch("/api/generate/action-items", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          conversation: conversationText,
          personalizationContext
        }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to generate action items");
      }
      
      const data = await response.json();
      console.log("Generated action items:", data);
      
      if (data.actionItems && Array.isArray(data.actionItems)) {
        const newActionItems = data.actionItems;
        setActionItems(newActionItems);
        
        // Save to localStorage
        saveConversation(messages, newActionItems, insights);
        
        toast({
          title: "Action Items Generated",
          description: "Your personalized action plan has been created.",
        });
      } else {
        throw new Error("Invalid response format");
      }
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

  const handleGenerateInsights = async () => {
    if (!reflectionId) return;
    
    setIsGeneratingInsights(true);
    try {
      // Get personalization context if available
      let personalizationContext = null;
      try {
        // Try to get personalization context from localStorage
        const profileData = localStorage.getItem('userProfile');
        if (profileData) {
          const parsedProfile = JSON.parse(profileData);
          // Check if personalization is enabled
          if (parsedProfile.privacySettings?.allowPersonalization) {
            personalizationContext = parsedProfile.privateProfile || null;
            console.log("Using personalization for insights");
          }
        }
      } catch (error) {
        console.error("Error getting personalization context:", error);
      }
      
      // Convert messages to a string representation for the API
      const conversationText = messages.map(msg => 
        `${msg.role === 'user' ? 'User' : 'AI'}: ${msg.content}`
      ).join('\n\n');
      
      const response = await fetch("/api/generate/insights", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          conversation: conversationText,
          personalizationContext
        }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to generate insights");
      }
      
      const data = await response.json();
      console.log("Generated insights:", data);
      
      if (data.insights && Array.isArray(data.insights)) {
        const newInsights = data.insights;
        setInsights(newInsights);
        
        // Save to localStorage
        saveConversation(messages, actionItems, newInsights);
        
        toast({
          title: "Insights Generated",
          description: "Your personalized spiritual insights have been created.",
        });
      } else {
        throw new Error("Invalid response format");
      }
    } catch (error) {
      console.error("Error generating insights:", error);
      toast({
        title: "Error",
        description: "Failed to generate insights. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingInsights(false);
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
          {/* Action Items and Insights Column (Left on desktop, Bottom on mobile) */}
          <div className="w-full order-2 md:order-1 space-y-4 md:space-y-6">
            {/* Action Items Card */}
            <div>
              <h2 className="text-lg font-semibold mb-2 md:hidden">Action Items</h2>
              <ActionItems 
                items={actionItems} 
                onChange={handleActionItemsChange}
                onGenerate={handleGenerateActionItems}
                isGenerating={isGeneratingItems}
                conversationId={reflectionId?.toString() || ""}
                conversationTitle={displayTitle}
              />
            </div>
            
            {/* Spiritual Insights Card */}
            <div>
              <h2 className="text-lg font-semibold mb-2 md:hidden">Spiritual Insights</h2>
              <Insights 
                insights={insights} 
                onChange={handleInsightsChange}
                onGenerate={handleGenerateInsights}
                isGenerating={isGeneratingInsights}
                canGenerate={canGenerateInsights}
              />
            </div>
          </div>
          
          {/* Conversation View (Right on desktop, Top on mobile) */}
          <div className="w-full order-1 md:order-2 mb-4 md:mb-0">
            <ConversationView 
              conversationId={reflectionId || undefined}
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