import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckSquare, PlusCircle, ClipboardList, CheckCircle, ArrowUpRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export interface ActionItemsProps {
  items: string[];
  onGenerate?: () => void;
  onChange?: (items: string[]) => void;
  isGenerating?: boolean;
  conversationId?: string;
  conversationTitle?: string;
}

interface PersonalActionItem {
  id: string;
  text: string;
  context: string;
  conversationId: string;
  conversationTitle: string;
  timestamp: number;
  completed: boolean;
}

// Helper function to generate a unique ID
function generateId(): string {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

// Helper function to split an action item into action and context
function splitActionItem(item: string): { action: string; context: string } {
  // Look for patterns like "...action. Context..." or common transition phrases
  const transitions = ['. This', '. The', '. In Islam', '. According', '. Based on', '. As'];
  
  for (const transition of transitions) {
    const index = item.indexOf(transition);
    if (index !== -1) {
      return {
        action: item.substring(0, index + 1), // Include the period
        context: item.substring(index + 1).trim()
      };
    }
  }
  
  // If no transition found, check for a period around the middle of the text
  const midPoint = Math.floor(item.length / 2);
  const firstHalf = item.substring(0, midPoint);
  const lastPeriodInFirstHalf = firstHalf.lastIndexOf('.');
  
  if (lastPeriodInFirstHalf !== -1 && lastPeriodInFirstHalf > item.length / 4) {
    return {
      action: item.substring(0, lastPeriodInFirstHalf + 1),
      context: item.substring(lastPeriodInFirstHalf + 1).trim()
    };
  }
  
  // If still no clear separation, return the whole string as action
  return {
    action: item,
    context: ''
  };
}

export function ActionItems({ items, onGenerate, onChange, isGenerating = false, conversationId = "", conversationTitle = "Reflection" }: ActionItemsProps) {
  const hasItems = items && items.length > 0;
  const [savedItems, setSavedItems] = useState<Record<string, boolean>>({});
  const { toast } = useToast();

  // On mount, load the saved state from localStorage
  useEffect(() => {
    if (!conversationId) return;
    
    try {
      const savedPlan = localStorage.getItem("personalActionPlan");
      if (savedPlan) {
        const planItems: PersonalActionItem[] = JSON.parse(savedPlan);
        
        // Create a map of saved items for this conversation
        const itemsMap: Record<string, boolean> = {};
        planItems.forEach(item => {
          if (item.conversationId === conversationId) {
            itemsMap[item.text] = true;
          }
        });
        
        setSavedItems(itemsMap);
      }
    } catch (error) {
      console.error("Error loading saved action items:", error);
    }
  }, [conversationId]);

  const handleGenerateClick = () => {
    if (onGenerate) {
      onGenerate();
    }
  };

  const toggleSaveToActionPlan = (item: string) => {
    const { action, context } = splitActionItem(item);
    
    try {
      // Get existing action plan
      const savedPlan = localStorage.getItem("personalActionPlan") || "[]";
      const planItems: PersonalActionItem[] = JSON.parse(savedPlan);
      
      // Check if item is already saved
      const isSaved = savedItems[item];
      
      if (isSaved) {
        // Remove item
        const updatedPlan = planItems.filter(planItem => 
          !(planItem.conversationId === conversationId && planItem.text === action)
        );
        localStorage.setItem("personalActionPlan", JSON.stringify(updatedPlan));
        toast({
          description: "Removed from your Personal Action Plan",
        });
      } else {
        // Add item
        const newItem: PersonalActionItem = {
          id: generateId(),
          text: action,
          context: context,
          conversationId,
          conversationTitle,
          timestamp: Date.now(),
          completed: false
        };
        
        planItems.push(newItem);
        localStorage.setItem("personalActionPlan", JSON.stringify(planItems));
        toast({
          description: "Added to your Personal Action Plan",
        });
      }
      
      // Update local state
      setSavedItems(prev => ({
        ...prev,
        [item]: !isSaved
      }));
      
    } catch (error) {
      console.error("Error updating action plan:", error);
      toast({
        variant: "destructive",
        description: "Failed to update your Personal Action Plan",
      });
    }
  };

  const handleViewActionPlan = () => {
    window.location.href = "/personal-action-plan";
  };

  return (
    <Card className="h-full">
      <CardHeader className="px-4 py-3 md:px-6 md:py-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base md:text-lg">
            <CheckSquare className="w-4 h-4 md:w-5 md:h-5" />
            Action Items
          </CardTitle>
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-xs flex items-center gap-1"
            onClick={handleViewActionPlan}
          >
            <ClipboardList className="h-4 w-4" />
            <span className="hidden md:inline">View Action Plan</span>
            <ArrowUpRight className="h-3 w-3" />
          </Button>
        </div>
        <CardDescription className="text-xs md:text-sm">
          Personalized recommendations based on your reflections
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 px-4 md:px-6 py-2 md:py-3">
        {hasItems ? (
          <ul className="space-y-4 md:space-y-6">
            {items.map((item, index) => {
              const { action, context } = splitActionItem(item);
              const isSaved = !!savedItems[item];
              
              return (
                <li key={index} className="flex flex-col">
                  <div className="flex items-start gap-2">
                    <span className="text-primary font-medium text-sm md:text-base">{index + 1}.</span>
                    <div className="space-y-1 md:space-y-2 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-bold text-sm md:text-base">{action}</p>
                        <Button
                          variant="ghost"
                          size="sm"
                          className={`p-1 flex-shrink-0 ${isSaved ? 'text-green-500 hover:text-green-600' : 'text-gray-400 hover:text-gray-500'}`}
                          onClick={() => toggleSaveToActionPlan(item)}
                          title={isSaved ? "Remove from Personal Action Plan" : "Add to Personal Action Plan"}
                        >
                          {isSaved ? (
                            <CheckCircle className="h-4 w-4" />
                          ) : (
                            <PlusCircle className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                      {context && (
                        <p className="text-muted-foreground text-xs md:text-sm">{context}</p>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="text-center py-6 md:py-8 text-muted-foreground text-sm md:text-base">
            <p>No action items available for this reflection.</p>
          </div>
        )}
      </CardContent>
      {onGenerate && (
        <CardFooter className="px-4 md:px-6 py-3 md:py-4">
          <Button 
            onClick={handleGenerateClick} 
            className="w-full text-sm md:text-base py-2"
            disabled={isGenerating}
          >
            {isGenerating 
              ? "Generating..." 
              : hasItems 
                ? "Regenerate Action Items" 
                : "Generate Action Items"
            }
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
