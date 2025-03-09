import { useState, useEffect, useRef, useCallback } from "react";
import { Layout } from "@/components/Layout";
import { ConversationView, Message } from "@/components/ConversationView";
import { ActionItems } from "@/components/ActionItems";
import { Insights } from "@/components/Insights";
import { useToast } from "@/hooks/use-toast";
import { useLocation, useRoute, useParams } from "wouter";
import { LoadingAnimation } from "@/components/LoadingAnimation";
import { useAuth } from "@/hooks/useAuth";
import { wirdService } from "@/services/wirdService";
import { Button } from "@/components/ui/button";
import { CalendarCheck } from "lucide-react";
import { WirdhSuggestions } from "@/components/WirdhSuggestions";
import { WirdSuggestion } from "@/services/wirdService";
import { cn } from "@/lib/utils";

export default function Chat() {
  // Simplify loading states to a single source of truth
  const [loading, setLoading] = useState(true);
  const { id } = useParams();
  const reflectionId = id ? parseInt(id) : null;
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  
  // Core data state
  const [messages, setMessages] = useState<Message[]>([]);
  const [questions, setQuestions] = useState<string[]>([]);
  const [actionItems, setActionItems] = useState<string[]>([]);
  const [insights, setInsights] = useState<string[]>([]);
  const [wirdSuggestions, setWirdSuggestions] = useState<WirdSuggestion[]>([]);
  
  // UI state
  const [isGeneratingItems, setIsGeneratingItems] = useState(false);
  const [isGeneratingInsights, setIsGeneratingInsights] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<string | null>(null);
  const [followUpCount, setFollowUpCount] = useState(0);
  const hasDynamicContent = useRef(false);

  // Track if insights can be generated (3+ follow-up questions answered)
  const canGenerateInsights = followUpCount >= 3;

  // Load reflection data from localStorage
  useEffect(() => {
    if (reflectionId) {
      console.log(`[Chat Debug] Loading reflection data for ID: ${reflectionId}`);
      setLoading(true);
      
      try {
        const savedSession = localStorage.getItem(`ramadanReflection_${reflectionId}`);
        
        if (savedSession) {
          const parsedSession = JSON.parse(savedSession);
          console.log("[Chat Debug] Loaded session data:", parsedSession);
          
          // Define empty arrays for missing data to avoid undefined errors
          const emptyArray: any[] = [];
          
          // Set messages
          if (parsedSession.messages) {
            console.log(`[Chat Debug] Setting ${parsedSession.messages.length} messages from localStorage`);
            setMessages(parsedSession.messages);
          } else {
            // Convert original and understanding to message format
            const initialMessages: Message[] = [
              { role: "user", content: parsedSession.original || "" }
            ];
            
            if (parsedSession.understanding) {
              initialMessages.push({ role: "assistant", content: parsedSession.understanding });
            }
            
            console.log(`[Chat Debug] Converted to ${initialMessages.length} messages`);
            setMessages(initialMessages);
          }
          
          // Set other data
          setQuestions(parsedSession.questions || emptyArray);
          setActionItems(parsedSession.actionItems || emptyArray);
          setInsights(parsedSession.insights || emptyArray);
          
          // Count existing follow-ups
          countFollowUps();
        } else {
          // If not in localStorage, try to fetch from server
          console.log("[Chat Debug] No data in localStorage, trying server fetch");
          fetchReflectionFromServer(reflectionId);
        }
      } catch (error) {
        console.error("Error loading session:", error);
        toast({
          title: "Error",
          description: "Could not load the saved session.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    }
  }, [reflectionId]);

  // Fetch reflection data from server (fallback if not in localStorage)
  const fetchReflectionFromServer = async (id: number) => {
    console.log(`Starting server fetch for reflection ${id}, setting loading=true`);
    setLoading(true);
    try {
      // First try the new reflection endpoint
      const response = await fetch(`/api/reflection/${id}`);
      
      if (!response.ok) {
        // If that fails, try the old conversation endpoint
        console.log(`New reflection endpoint failed, trying conversation endpoint for ${id}`);
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
      console.log(`Server fetch complete for reflection ${id}, setting loading=false`);
      setLoading(false);
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
    updatedInsights: string[] = insights,
    updatedWirdSuggestions: WirdSuggestion[] = wirdSuggestions
  ) => {
    if (!reflectionId) return;
    
    try {
      // Get existing session data if any
      let sessionData = localStorage.getItem(`reflection_${reflectionId}`);
      let existingData = sessionData ? JSON.parse(sessionData) : {};
      
      // Update with new values
      const updatedData = {
        ...existingData,
        id: reflectionId,
        reflectionId,
        messages: updatedMessages,
        actionItems: updatedActionItems,
        insights: updatedInsights,
        wirdSuggestions: updatedWirdSuggestions,
        lastUpdated: new Date().toISOString()
      };
      
      localStorage.setItem(`reflection_${reflectionId}`, JSON.stringify(updatedData));
      console.log("Saved session to localStorage");
    } catch (error) {
      console.error("Error saving reflection data to localStorage:", error);
    }
  };

  // Handle new messages being added to the conversation
  const handleNewMessage = (newMessages: Message[]) => {
    console.log("Updating messages:", newMessages);
    setMessages(newMessages);
    
    // Save the conversation to localStorage
    saveConversation(newMessages);
    
    // Count follow-up responses from the user
    const followUpResponses = newMessages.filter(
      msg => 
        msg.role === "user" && 
        msg.content.startsWith("Q: ") && 
        msg.content.includes("\n\nA: ")
    );
    
    setFollowUpCount(followUpResponses.length);
    
    // Auto-generate insights after 2-3 follow-up messages if insights haven't been generated yet
    if (followUpResponses.length >= 2 && insights.length === 0 && !isGeneratingInsights) {
      console.log("Auto-generating insights after 2 follow-up messages");
      // Add a small delay to ensure UI updates first
      setTimeout(() => {
        handleGenerateInsights();
      }, 1000);
    }
  };

  const handleActionItemsChange = (newActionItems: string[]) => {
    setActionItems(newActionItems);
    saveConversation(messages, newActionItems, insights, wirdSuggestions);
  };

  const handleInsightsChange = (newInsights: string[]) => {
    setInsights(newInsights);
    saveConversation(messages, actionItems, newInsights, wirdSuggestions);
  };

  const handleSelectedQuestion = (question: string) => {
    // Instead of adding the question as a user message immediately,
    // just keep track of which question was selected
    setSelectedQuestion(question);
  };

  const handleWirdSuggestionsChange = (newSuggestions: WirdSuggestion[]) => {
    setWirdSuggestions(newSuggestions);
    saveConversation(messages, actionItems, insights, newSuggestions);
  };

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
        saveConversation(messages, newActionItems, insights, wirdSuggestions);
        
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
      
      // Get the authentication token
      const token = localStorage.getItem('auth_token');
      if (!token) {
        console.error("No authentication token found");
        throw new Error("Authentication required");
      }
      
      // Convert messages to a string representation for the API
      const conversationText = messages.map(msg => 
        `${msg.role === 'user' ? 'User' : 'AI'}: ${msg.content}`
      ).join('\n\n');
      
      console.log("Sending insights generation request with auth token");
      
      const response = await fetch("/api/generate/insights", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          conversation: conversationText,
          personalizationContext
        }),
      });
      
      if (!response.ok) {
        console.error(`API error: ${response.status} - ${response.statusText}`);
        throw new Error(`Failed to generate insights: ${response.status}`);
      }
      
      const data = await response.json();
      console.log("Generated insights:", data);
      
      if (data.insights && Array.isArray(data.insights)) {
        const newInsights = data.insights;
        setInsights(newInsights);
        
        // Save to localStorage
        saveConversation(messages, actionItems, newInsights, wirdSuggestions);
        
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

  const handleGenerateWirdSuggestions = async () => {
    if (!reflectionId || !user?.id) return;
    
    setIsGeneratingItems(true); // Reuse the loading state
    console.log("Starting wirdh suggestion generation with messages:", messages.length);
    
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
            console.log("Using personalization for wird suggestions");
          }
        }
      } catch (error) {
        console.error("Error getting personalization context:", error);
      }
      
      // Convert messages to a string representation for the API
      // Include the full conversation context
      const conversationText = messages.map(msg => 
        `${msg.role === 'user' ? 'User' : 'AI'}: ${msg.content}`
      ).join('\n\n');
      
      console.log("Prepared conversation context for wird suggestions:", 
        conversationText.length > 100 ? 
        `${conversationText.substring(0, 100)}... (${conversationText.length} chars total)` : 
        conversationText);
      
      // Generate fallback suggestions if API call fails
      const generateFallbackSuggestions = () => {
        console.log("Using fallback wird suggestions");
        const fallbackSuggestions = [
          {
            id: `wird-${Date.now()}-1`,
            name: "Daily Quran Reading",
            title: "Daily Quran Reading",
            category: "Quran",
            type: "Quran",
            target: 5,
            unit: "pages",
            description: "Read portions of the Quran daily to strengthen your connection with Allah's words",
            duration: "15-20 minutes",
            frequency: "daily"
          },
          {
            id: `wird-${Date.now()}-2`,
            name: "Morning and Evening Adhkar",
            title: "Morning and Evening Adhkar",
            category: "Dhikr",
            type: "Dhikr",
            target: 1,
            unit: "times",
            description: "Recite the morning and evening remembrances to protect yourself and gain blessings",
            duration: "10 minutes",
            frequency: "twice daily"
          }
        ];
        return fallbackSuggestions;
      };
      
      try {
        // Try to call the API to generate wird suggestions
        console.log("Calling API to generate wird suggestions");
        const response = await fetch("/api/generate/wird-suggestions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            conversation: conversationText,
            messages: messages, // Send full messages array for better context
            personalizationContext
          }),
        });
        
        if (!response.ok) {
          console.error(`API error: ${response.status} - ${response.statusText}`);
          throw new Error("Failed to generate wird suggestions");
        }
        
        const data = await response.json();
        console.log("Generated wird suggestions:", data);
        
        if (data.wirdSuggestions && Array.isArray(data.wirdSuggestions)) {
          // First, store the suggestions in localStorage for the WirdhAI page
          storeWirdSuggestionsInLocalStorage(data.wirdSuggestions);
          
          // Add them to the user's wird plan with a backlink to this reflection
          // Choose the first suggestion to automatically add as an example
          if (data.wirdSuggestions.length > 0) {
            const suggestion = data.wirdSuggestions[0];
            await wirdService.addToWirdPlan(
              user.id,
              suggestion,
              undefined, // Use current date
              'reflection', // sourceType
              reflectionId // sourceId
            );
          }
          
          toast({
            title: "Wird Suggestions Generated",
            description: "Spiritual practices have been suggested based on your reflection.",
          });
        } else {
          throw new Error("Invalid response format");
        }
      } catch (error) {
        console.error("API endpoint for wird suggestions not available, using fallback:", error);
        
        // Use fallback suggestions if API call fails
        const fallbackSuggestions = generateFallbackSuggestions();
        storeWirdSuggestionsInLocalStorage(fallbackSuggestions);
        
        // Add the first fallback suggestion to the user's wird plan
        await wirdService.addToWirdPlan(
          user.id,
          fallbackSuggestions[0],
          undefined, // Use current date
          'reflection', // sourceType
          reflectionId // sourceId
        );
        
        toast({
          title: "Wird Suggestions Generated",
          description: "Spiritual practices have been suggested based on your reflection.",
        });
      }
    } catch (error) {
      console.error("Error generating wird suggestions:", error);
      toast({
        title: "Error",
        description: "Failed to generate wird suggestions. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingItems(false);
    }
  };
  
  // Store Wird suggestions in localStorage
  const storeWirdSuggestionsInLocalStorage = (suggestions: WirdSuggestion[]) => {
    try {
      // Store in chat-specific state
      setWirdSuggestions(suggestions);
      
      // Save to this reflection session
      saveConversation(messages, actionItems, insights, suggestions);
      
      // Also store in global wirdSuggestions for the WirdhAI page
      const existingSuggestions = localStorage.getItem('wirdSuggestions');
      let allSuggestions = suggestions;
      
      if (existingSuggestions) {
        const parsed = JSON.parse(existingSuggestions);
        // Combine with new suggestions, avoiding duplicates by id
        const existingIds = new Set(parsed.map((s: any) => s.id));
        const uniqueNewSuggestions = suggestions.filter(s => !existingIds.has(s.id));
        allSuggestions = [...parsed, ...uniqueNewSuggestions];
      }
      
      // Save to localStorage
      localStorage.setItem('wirdSuggestions', JSON.stringify(allSuggestions));
    } catch (error) {
      console.error("Error storing wird suggestions in localStorage:", error);
    }
  };

  // Get the user's first message for title
  const firstUserMessage = messages.find(msg => msg.role === "user");
  const chatTitle = firstUserMessage?.content || "Reflection";
  const displayTitle = chatTitle.length > 30 ? chatTitle.substring(0, 30) + "..." : chatTitle;

  // Handle animation events
  const handleAnimationStart = useCallback(() => {
    console.log('[Chat Debug] Animation starting');
  }, []);

  const handleAnimationComplete = useCallback(() => {
    console.log('[Chat Debug] Animation completed');
  }, []);

  return (
    <Layout title={displayTitle}>
      {loading ? (
        <LoadingAnimation message="Loading conversation..." fullScreen={true} />
      ) : (
        <div className="container max-w-[95%] mx-auto py-4 md:py-8 h-full px-3 md:px-4">
          <div className="grid grid-cols-1 md:grid-cols-[1.2fr,2.5fr] gap-6 md:gap-8 animate-slide-in">
            {/* Left column */}
            <div className="w-full order-2 md:order-1 space-y-6 md:space-y-8">
              {/* Wirdh Suggestions Card */}
              <div className="bg-card rounded-lg shadow-sm p-4">
                <h2 className="text-lg font-semibold mb-4">Spiritual Practices</h2>
                <WirdhSuggestions 
                  suggestions={wirdSuggestions} 
                  onChange={handleWirdSuggestionsChange}
                  onGenerate={handleGenerateWirdSuggestions}
                  isGenerating={isGeneratingItems}
                  conversationId={reflectionId?.toString() || ""}
                  conversationTitle={displayTitle}
                />
              </div>
              
              {/* Spiritual Insights Card */}
              <div className="bg-card rounded-lg shadow-sm p-4">
                <h2 className="text-lg font-semibold mb-4">Spiritual Insights</h2>
                <Insights 
                  insights={insights} 
                  onChange={handleInsightsChange}
                  onGenerate={handleGenerateInsights}
                  isGenerating={isGeneratingInsights}
                  canGenerate={canGenerateInsights}
                />
              </div>
            </div>
            
            {/* Right column - Conversation */}
            <div className="w-full order-1 md:order-2 mb-6 md:mb-0">
              <div className="bg-card rounded-lg shadow-sm p-4">
                <ConversationView 
                  conversationId={reflectionId || undefined}
                  messages={messages} 
                  onNewMessage={handleNewMessage}
                  questions={questions}
                  onSelectedQuestion={handleSelectedQuestion}
                  isFirstSubmission={messages.length <= 2}
                  selectedQuestion={selectedQuestion}
                  onAnimationStart={handleAnimationStart}
                  onAnimationComplete={handleAnimationComplete}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
} 