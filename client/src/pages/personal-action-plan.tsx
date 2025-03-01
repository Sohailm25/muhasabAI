import { useEffect, useState } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, CheckCircle, RefreshCw, ArrowRight } from "lucide-react";
import { useLocation } from "wouter";

interface ActionItem {
  id: string;
  text: string;
  context: string;
  conversationId: string;
  conversationTitle: string;
  timestamp: number;
  completed: boolean;
}

const PersonalActionPlan = () => {
  const [actionItems, setActionItems] = useState<ActionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [, navigate] = useLocation();

  useEffect(() => {
    // Load action items from localStorage
    const loadActionItems = () => {
      try {
        const savedItems = localStorage.getItem("personalActionPlan");
        if (savedItems) {
          setActionItems(JSON.parse(savedItems));
        }
      } catch (error) {
        console.error("Error loading action items:", error);
      } finally {
        setLoading(false);
      }
    };

    loadActionItems();
  }, []);

  const handleToggleComplete = (id: string) => {
    const updatedItems = actionItems.map((item) => 
      item.id === id ? { ...item, completed: !item.completed } : item
    );
    setActionItems(updatedItems);
    localStorage.setItem("personalActionPlan", JSON.stringify(updatedItems));
  };

  const handleRemoveItem = (id: string) => {
    const updatedItems = actionItems.filter((item) => item.id !== id);
    setActionItems(updatedItems);
    localStorage.setItem("personalActionPlan", JSON.stringify(updatedItems));
  };

  const handleNavigateToChat = (conversationId: string) => {
    navigate(`/chat/${conversationId}`);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString();
  };

  if (loading) {
    return (
      <Layout title="Personal Action Plan" showSidebar>
        <div className="flex items-center justify-center h-full">
          <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Personal Action Plan" showSidebar>
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-6 dark:text-white">Your Personal Action Plan</h1>
        
        {actionItems.length === 0 ? (
          <Card className="bg-white dark:bg-gray-800 shadow rounded-lg p-4">
            <CardContent className="pt-6">
              <p className="text-center text-gray-500 dark:text-gray-400">
                You haven't added any action items to your personal plan yet.
              </p>
              <p className="text-center text-gray-500 dark:text-gray-400 mt-2">
                Go to a chat and toggle items to add them here.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {actionItems.map((item) => (
              <Card key={item.id} className={`bg-white dark:bg-gray-800 shadow rounded-lg transition-all ${item.completed ? 'opacity-70' : ''}`}>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-center">
                    <Badge 
                      variant="outline" 
                      className="cursor-pointer"
                      onClick={() => handleNavigateToChat(item.conversationId)}
                    >
                      {item.conversationTitle || "Reflection"}
                      <ArrowRight className="ml-1 h-3 w-3" />
                    </Badge>
                    <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
                      <Clock className="h-3 w-3 mr-1" />
                      {formatDate(item.timestamp)}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-start gap-2">
                    <button 
                      onClick={() => handleToggleComplete(item.id)}
                      className="mt-1 flex-shrink-0"
                    >
                      <CheckCircle className={`h-5 w-5 ${item.completed ? 'text-green-500' : 'text-gray-300 dark:text-gray-600'}`} />
                    </button>
                    <div>
                      <p className={`font-medium dark:text-white ${item.completed ? 'line-through text-gray-500 dark:text-gray-400' : ''}`}>
                        {item.text}
                      </p>
                      {item.context && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                          {item.context}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex justify-end mt-2">
                    <button 
                      onClick={() => handleRemoveItem(item.id)}
                      className="text-xs text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                    >
                      Remove
                    </button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default PersonalActionPlan; 