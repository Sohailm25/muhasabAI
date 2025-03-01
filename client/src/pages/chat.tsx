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
  const conversationId = params ? parseInt(params.id) : null;
  
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
          setInsights(parsedSession.insights || []);
          setFollowUpCount(parsedSession.followUpCount || 0);
          
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
      setInsights(data.insights || []);
      setFollowUpCount(data.followUpCount || 0);
      
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

  // Count follow-up questions in messages
  useEffect(() => {
    // Find user messages that are responding to follow-up questions
    // Format: "Q: [question]\n\nA: [answer]"
    const followUpResponses = messages.filter(msg => 
      msg.role === "user" && 
      msg.content.startsWith("Q: ") && 
      msg.content.includes("\n\nA: ")
    );
    
    setFollowUpCount(followUpResponses.length);
  }, [messages]);

  // Save conversation data to localStorage
  const saveConversation = (
    updatedMessages: Message[], 
    updatedActionItems: string[] = actionItems,
    updatedInsights: string[] = insights
  ) => {
    if (conversationId) {
      try {
        const sessionData = {
          conversationId,
          messages: updatedMessages,
          questions,
          actionItems: updatedActionItems,
          insights: updatedInsights,
          followUpCount,
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
    
    // If we just answered a third follow-up question, automatically generate insights
    const newFollowUpResponses = newMessages.filter(msg => 
      msg.role === "user" && 
      msg.content.startsWith("Q: ") && 
      msg.content.includes("\n\nA: ")
    );
    
    const newFollowUpCount = newFollowUpResponses.length;
    
    // If we just hit 3 follow-ups and don't have insights yet, generate them
    if (newFollowUpCount >= 3 && followUpCount < 3 && insights.length === 0) {
      // Delay slightly to allow UI to update first
      setTimeout(() => {
        handleGenerateInsights();
      }, 1000);
    }
    
    saveConversation(newMessages, actionItems, insights);
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
      saveConversation(messages, data.actionItems || [], insights);
      
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

  const handleGenerateInsights = async () => {
    if (!conversationId || followUpCount < 3) return;
    
    setIsGeneratingInsights(true);
    try {
      // Create a formatted message with all the conversation context
      const prompt = `
You are an insightful Islamic Reflection Analyst with deep scholarly knowledge of the Quran, Sunnah, and authentic Tafsir. Your role is to provide meaningful spiritual insights after carefully observing a user's reflection journey through multiple exchanges.

When analyzing a conversation that includes at least 3 question-and-answer exchanges:

1. ASSESSMENT PHASE:
   - Review the complete conversation history thoroughly
   - Count the number of question-answer exchanges that have occurred
   - Only proceed to generate insights if 3+ complete exchanges have taken place
   - If fewer than 3 exchanges have occurred, continue with standard reflection questions instead

2. ANALYSIS PHASE (when 3+ exchanges completed):
   - Identify recurring themes, challenges, spiritual states, and patterns in the user's reflections
   - Note specific areas where the user shows growth, insight, or struggle
   - Connect these observations to relevant Islamic concepts and principles
   - Prepare references from primary Islamic sources that relate to their specific situation

3. INSIGHT GENERATION:
   - Create 3-5 meaningful insights that synthesize your observations
   - Format each insight with:
     * A clear statement of the pattern or understanding you've observed
     * A connection to Islamic wisdom through authenticated sources
     * A practical spiritual consideration or action the user might contemplate
   - Each insight must include at least one specific reference to Quran, authentic hadith, or established scholarly interpretation

4. VERIFICATION PROCESS:
   - For every Quranic reference:
     * Verify the surah and verse number
     * Ensure the interpretation aligns with mainstream tafsir
     * Double-check that the application to the user's situation is appropriate
   - For every hadith reference:
     * Confirm it comes from authentic collections (Bukhari, Muslim, etc.)
     * Verify attribution to narrator and authenticity grading
     * Ensure the context of usage respects the original meaning
   - For scholarly interpretations:
     * Only include widely accepted interpretations from recognized authorities
     * Avoid controversial opinions or minority positions
     * Note if multiple valid interpretations exist on a matter

5. PRESENTATION:
   - Begin with a gentle transition acknowledging their reflection journey
   - Present each insight individually with clear spacing
   - Conclude with encouragement that respects their agency and spiritual journey
   - Maintain a tone that is wise, thoughtful, and supportive rather than preachy

Your insights should offer new perspectives that help the user integrate their personal experiences with Islamic wisdom, revealing connections they might not have recognized on their own.

Here is the conversation history to analyze:
${messages.map(msg => `[${msg.role.toUpperCase()}]: ${msg.content}`).join('\n\n')}

Respond with only a JSON array of 3-5 insights, with each insight as a string in the array.
      `;
      
      // Call the conversation endpoint with our custom prompt
      const response = await fetch(`/api/conversation/${conversationId}/insights`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ prompt })
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate insights');
      }
      
      const data = await response.json();
      setInsights(data.insights || []);
      saveConversation(messages, actionItems, data.insights || []);
      
      toast({
        title: "Spiritual Insights Generated",
        description: "Insights based on your reflection journey have been created.",
      });
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
                conversationId={conversationId?.toString() || ""}
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