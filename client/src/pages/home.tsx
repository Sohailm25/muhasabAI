import { useState, useEffect } from "react";
import axios from "axios";
import { Layout } from "@/components/Layout";
import { LoadingAnimation } from "@/components/LoadingAnimation";
import { ConversationList } from "@/components/ConversationList";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { PlusCircle, BookOpen, Clock } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface UserSettings {
  id: string;
  userId: string;
  name: string | null;
  email: string | null;
  preferences: UserPreferences;
  timestamp: string;
}

interface UserPreferences {
  emailNotifications: boolean;
  darkMode: boolean;
  saveHistory: boolean;
  selectedMasjid?: any;
}

export default function Home() {
  const [isLoading, setIsLoading] = useState(false);
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [, setLocation] = useLocation();

  // Fetch user settings to get name for greeting
  useEffect(() => {
    async function loadUserSettings() {
      try {
        const response = await axios.get('/api/user/settings');
        setSettings(response.data);
      } catch (error) {
        console.error('Error loading user settings:', error);
      }
    }
    
    loadUserSettings();
  }, []);

  // Get first name from full name
  const firstName = settings?.name?.split(' ')[0] || 'Muslim';

  return (
    <Layout title="Islamic Reflection Space">
      {isLoading && <LoadingAnimation message="Loading..." />}
      
      <div className="container max-w-4xl mx-auto py-8 px-4">
        {/* Welcome Section with Call-to-Action */}
        <div className="mb-10 animate-slide-in">
          <div className="text-center max-w-xl mx-auto mb-8">
            <div className="mb-2">
              <h2 className="text-xl font-semibold text-primary/80">السلام عليكم</h2>
              <h1 className="text-3xl font-bold tracking-tight">Welcome, {firstName}</h1>
            </div>
            <p className="mt-3 text-muted-foreground">
              A private space to document your spiritual journey, gain insights, and track your growth on the path to Allah.
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg mx-auto">
            <Button 
              size="lg" 
              className="w-full py-6 h-auto flex flex-col items-center gap-2" 
              onClick={() => setLocation('/new')}
            >
              <PlusCircle className="h-6 w-6" />
              <div>
                <div className="font-semibold">New Reflection</div>
                <div className="text-xs font-normal">Share your thoughts and experiences</div>
              </div>
            </Button>
            
            <Button 
              variant="outline" 
              size="lg" 
              className="w-full py-6 h-auto flex flex-col items-center gap-2"
              onClick={() => setLocation('/halaqa')}
            >
              <BookOpen className="h-6 w-6" />
              <div>
                <div className="font-semibold">Halaqa Helper</div>
                <div className="text-xs font-normal">Track your Islamic learnings</div>
              </div>
            </Button>
          </div>
        </div>
        
        {/* Past Reflections */}
        <Card className="animate-slide-in transition-all" style={{ animationDelay: "100ms" }}>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              Your Reflections
            </CardTitle>
            <CardDescription>
              Continue your spiritual journey with previous reflections
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ConversationList />
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
