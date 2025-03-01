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
    
    if (data.conversation && data.conversation.id) {
      // Save the conversation data to localStorage with timestamp
      try {
        const sessionData = {
          conversationId: data.conversation.id,
          messages: data.conversation.messages,
          questions: data.questions || [],
          actionItems: data.conversation.actionItems || [],
          timestamp: new Date().toISOString()
        };
        localStorage.setItem(`ramadanReflection_${data.conversation.id}`, JSON.stringify(sessionData));
      } catch (error) {
        console.error("Error saving session:", error);
        toast({
          title: "Session Error",
          description: "Could not save session data.",
          variant: "destructive",
        });
      }
      
      // Navigate to the chat page for this conversation
      setLocation(`/chat/${data.conversation.id}`);
    } else {
      toast({
        title: "Error",
        description: "Could not create conversation.",
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
                    Helpful prompts:
                  </h3>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <p>"Today I felt closest to Allah when..."</p>
                    <p>"A challenge I'm facing in my spiritual journey is..."</p>
                    <p>"One Islamic teaching I'd like to understand better is..."</p>
                    <p>"I'm grateful to Allah for..."</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <BookOpen className="h-4 w-4 text-primary" />
                  Benefits of Regular Reflection
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                <ul className="space-y-1 list-disc list-inside">
                  <li>Strengthens your connection with Allah</li>
                  <li>Provides clarity and focus in your spiritual journey</li>
                  <li>Helps identify areas for personal growth</li>
                  <li>Creates a record of your spiritual development</li>
                </ul>
              </CardContent>
            </Card>
          </div>
          
          {/* Reflection input area */}
          <div className="animate-slide-in" style={{ animationDelay: "100ms" }}>
            <Card>
              <CardHeader>
                <CardTitle>Begin Your Reflection</CardTitle>
                <CardDescription>
                  Take a moment to reflect on your spiritual journey
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ReflectionInput 
                  onReflectionComplete={handleReflectionComplete} 
                  isLoading={isLoading}
                  setIsLoading={setIsLoading}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
} 