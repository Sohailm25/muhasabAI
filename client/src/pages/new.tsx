import { useState } from "react";
import { Layout } from "@/components/Layout";
import { ReflectionInput } from "@/components/ReflectionInput";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { LoadingAnimation } from "@/components/LoadingAnimation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Edit, Lightbulb, BookOpen } from "lucide-react";

export default function NewReflection() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const handleReflectionComplete = (data: any) => {
    console.log("Reflection complete:", data);
    
    // Enhanced debugging - log all top-level keys in the response
    console.log("API response top-level keys:", Object.keys(data));
    
    // Specifically check for understanding and questions at the top level
    console.log("Understanding is present at top level:", !!data.understanding);
    console.log("Questions are present at top level:", !!data.questions && Array.isArray(data.questions));
    
    if (data.understanding) {
      console.log("Top-level understanding preview:", data.understanding.substring(0, 50) + "...");
    }
    
    if (data.questions && Array.isArray(data.questions)) {
      console.log("Top-level questions count:", data.questions.length);
      if (data.questions.length > 0) {
        console.log("First question:", data.questions[0]);
      }
    }
    
    // Handle the response from the API
    // We need to handle both old and new response formats
    try {
      let reflectionId;
      let reflectionData;
      
      // Check format of data
      if (data && data.id) {
        // Direct format
        reflectionId = data.id;
        reflectionData = data;
      } else if (data && data.reflection && data.reflection.id) {
        // Nested reflection format
        reflectionId = data.reflection.id;
        reflectionData = data.reflection;
      } else if (data && data.reflection) {
        // New format from API route without ID
        reflectionData = data.reflection;
        // Generate a random ID for localStorage if none exists
        reflectionId = Math.floor(Math.random() * 1000000);
      } else {
        throw new Error("Invalid response format");
      }
      
      // Ensure reflectionId is set
      if (!reflectionId) {
        reflectionId = Math.floor(Math.random() * 1000000);
      }
      
      // First, check if understanding and questions are at the top level of the response
      const understanding = data.understanding || "";
      const questions = data.questions || [];
      
      console.log("Direct from API response - understanding:", understanding ? understanding.substring(0, 50) + "..." : "None");
      console.log("Direct from API response - questions:", questions.length > 0 ? questions : "None");
      
      // Extract all needed data - now also checks for top-level understanding and questions
      const sessionData = {
        id: reflectionId,
        reflectionId: reflectionId,
        original: reflectionData.original || data.content || reflectionData.content || "",
        understanding: understanding || reflectionData.understanding || "",
        questions: questions.length > 0 ? questions : (reflectionData.questions || []),
        actionItems: reflectionData.actionItems || data.actionItems || [],
        insights: reflectionData.insights || data.insights || [],
        timestamp: reflectionData.timestamp || new Date().toISOString()
      };
      
      console.log("Saving reflection data to localStorage:", sessionData);
      // Log understanding and questions to verify they're being saved correctly
      console.log("Understanding:", sessionData.understanding ? sessionData.understanding.substring(0, 50) + "..." : "None");
      console.log("Questions:", sessionData.questions.length > 0 ? sessionData.questions : "None");
      
      localStorage.setItem(`ramadanReflection_${reflectionId}`, JSON.stringify(sessionData));
      
      // Navigate to the chat page for this reflection
      console.log(`Navigating to chat page: /chat/${reflectionId}`);
      setLocation(`/chat/${reflectionId}`);
    } catch (error) {
      console.error("Error processing reflection data:", error);
      toast({
        title: "Error",
        description: "Could not process reflection data properly.",
        variant: "destructive",
      });
    }
  };

  return (
    <Layout title="New Reflection">
      {isLoading && <LoadingAnimation message="Processing your reflection..." />}
      
      <div className="container max-w-4xl mx-auto py-8 px-4">
        <div className="grid grid-cols-1 md:grid-cols-[1fr,2fr] gap-6">
          {/* Guidance sidebar */}
          <div className="space-y-4 animate-slide-in">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Edit className="h-5 w-5 text-primary" />
                  Reflection Guide
                </CardTitle>
                <CardDescription>
                  Suggestions to help you reflect deeply
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-3 bg-primary/5 rounded-md border border-primary/10">
                  <h3 className="font-medium text-sm mb-2">Topics for reflection:</h3>
                  <ul className="space-y-2 text-sm text-muted-foreground list-disc list-inside">
                    <li>Your experience with prayers and worship today</li>
                    <li>Spiritual insights or challenges you've encountered</li>
                    <li>Quranic verses or hadith that resonated with you</li>
                    <li>Your relationship with Allah and how to improve it</li>
                    <li>Questions about Islamic teachings you'd like to explore</li>
                  </ul>
                </div>
                
                <div>
                  <h3 className="font-medium text-sm mb-2 flex items-center gap-1">
                    <Lightbulb className="h-4 w-4 text-primary" />
                    Tips for meaningful reflection:
                  </h3>
                  <ul className="space-y-2 text-sm text-muted-foreground list-disc list-inside">
                    <li>Be honest and authentic in your thoughts</li>
                    <li>Focus on your intentions and feelings</li>
                    <li>Consider how your actions align with Islamic values</li>
                    <li>Think about areas where you'd like to grow spiritually</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-medium text-sm mb-2 flex items-center gap-1">
                    <BookOpen className="h-4 w-4 text-primary" />
                    Islamic perspective:
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    "Whoever knows himself, knows his Lord." 
                    <span className="block mt-1 italic">- Traditional Islamic wisdom</span>
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Self-reflection (muhasabah) is highly encouraged in Islam as a means to spiritual growth and nearness to Allah.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Reflection input area */}
          <div className="flex flex-col items-center justify-start">
            <div className="w-full animate-fade-in">
              <h1 className="text-2xl font-bold mb-6 text-center">Share Your Reflection</h1>
              <ReflectionInput 
                onReflectionComplete={handleReflectionComplete} 
                isLoading={isLoading} 
                setIsLoading={setIsLoading}
                redirectToChat={false} // We'll handle redirection in this component
              />
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
} 