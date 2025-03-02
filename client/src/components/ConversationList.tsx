import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { useLocation } from "wouter";
import { formatDistanceToNow } from "date-fns";
import { MessageCircle, PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Conversation {
  id: number;
  timestamp: string;
  firstMessage: string;
}

export function ConversationList() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [, setLocation] = useLocation();

  useEffect(() => {
    // Load saved conversations from localStorage
    const loadConversations = () => {
      try {
        const allKeys = Object.keys(localStorage);
        const conversationKeys = allKeys.filter(key => key.startsWith('ramadanReflection_'));
        
        const savedConversations: Conversation[] = [];
        
        conversationKeys.forEach(key => {
          try {
            const data = JSON.parse(localStorage.getItem(key) || '');
            
            // Extract the ID from the key (ramadanReflection_ID)
            const idMatch = key.match(/ramadanReflection_(\d+)/);
            const id = idMatch ? parseInt(idMatch[1]) : null;
            
            if (id === null) {
              console.warn(`Could not extract ID from key: ${key}`);
              return;
            }
            
            // Handle both old and new data formats
            if (data.original || (data.messages && data.messages.length > 0)) {
              // New format with original content
              const firstMessage = data.original || 
                                  (data.messages && data.messages.length > 0 ? 
                                    data.messages.find((m: any) => m.role === 'user')?.content : '');
              
              savedConversations.push({
                id: id,
                timestamp: data.timestamp || new Date().toISOString(),
                firstMessage: firstMessage ? 
                  (firstMessage.length > 100 ? 
                    firstMessage.substring(0, 100) + '...' : 
                    firstMessage) : 
                  'Reflection'
              });
            }
          } catch (err) {
            console.error(`Error parsing conversation data for key ${key}:`, err);
          }
        });
        
        // Sort by timestamp, newest first
        savedConversations.sort((a, b) => 
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
        
        setConversations(savedConversations);
      } catch (error) {
        console.error("Error loading conversations:", error);
        setConversations([]);
      }
    };
    
    loadConversations();
  }, []);

  const handleOpenConversation = (id: number) => {
    setLocation(`/chat/${id}`);
  };

  const handleNewReflection = () => {
    setLocation('/new');
  };

  if (conversations.length === 0) {
    return (
      <div className="text-center py-6">
        <div className="mb-4 p-4 bg-primary/10 rounded-full inline-block">
          <MessageCircle className="w-8 h-8 text-primary" />
        </div>
        <h3 className="text-lg font-medium mb-2">No reflections yet</h3>
        <p className="text-muted-foreground mb-5 max-w-md mx-auto">
          Start your reflection journey by creating your first entry. Document your thoughts and receive personalized insights.
        </p>
        <Button onClick={handleNewReflection} className="flex items-center gap-2">
          <PlusCircle className="h-4 w-4" />
          Start Your First Reflection
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {conversations.map((conversation) => (
        <Card 
          key={conversation.id} 
          className="cursor-pointer hover:bg-accent/50 transition-colors border-muted/60 hover:border-primary/50"
          onClick={() => handleOpenConversation(conversation.id)}
        >
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-primary/10 rounded-full shrink-0 mt-1">
                <MessageCircle className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="line-clamp-2 font-medium">{conversation.firstMessage}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {formatDistanceToNow(new Date(conversation.timestamp), { addSuffix: true })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
} 