import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckSquare } from "lucide-react";

export interface ActionItemsProps {
  items: string[];
  onGenerate?: () => void;
  onChange?: (items: string[]) => void;
  isGenerating?: boolean;
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

export function ActionItems({ items, onGenerate, onChange, isGenerating = false }: ActionItemsProps) {
  const hasItems = items && items.length > 0;

  const handleGenerateClick = () => {
    if (onGenerate) {
      onGenerate();
    }
  };

  return (
    <Card className="h-full">
      <CardHeader className="px-4 py-3 md:px-6 md:py-4">
        <CardTitle className="flex items-center gap-2 text-base md:text-lg">
          <CheckSquare className="w-4 h-4 md:w-5 md:h-5" />
          Action Items
        </CardTitle>
        <CardDescription className="text-xs md:text-sm">
          Personalized recommendations based on your reflections
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 px-4 md:px-6 py-2 md:py-3">
        {hasItems ? (
          <ul className="space-y-4 md:space-y-6">
            {items.map((item, index) => {
              const { action, context } = splitActionItem(item);
              return (
                <li key={index} className="flex flex-col">
                  <div className="flex items-start gap-2">
                    <span className="text-primary font-medium text-sm md:text-base">{index + 1}.</span>
                    <div className="space-y-1 md:space-y-2">
                      <p className="font-bold text-sm md:text-base">{action}</p>
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
