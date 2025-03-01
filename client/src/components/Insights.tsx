import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { LightbulbIcon } from "lucide-react";

export interface InsightsProps {
  insights: string[];
  onGenerate?: () => void;
  onChange?: (insights: string[]) => void;
  isGenerating?: boolean;
  canGenerate?: boolean;
}

// Helper function to split an insight into title and content
function splitInsight(item: string): { title: string; content: string } {
  // First try to find a common separator pattern
  const separators = [':', ' - ', '–', '—'];
  
  for (const separator of separators) {
    const index = item.indexOf(separator);
    if (index !== -1 && index < 50) {
      return {
        title: item.substring(0, index).trim(),
        content: item.substring(index + separator.length).trim()
      };
    }
  }
  
  // Look for the first period as an alternative separator
  const periodIndex = item.indexOf('.');
  if (periodIndex > 10 && periodIndex < 100) {
    return {
      title: item.substring(0, periodIndex + 1).trim(),
      content: item.substring(periodIndex + 1).trim()
    };
  }
  
  // If no clear title/content separation, treat the first sentence as title
  const firstSentenceEnd = item.search(/[.!?]\s/) + 1;
  if (firstSentenceEnd > 0 && firstSentenceEnd < item.length / 3) {
    return {
      title: item.substring(0, firstSentenceEnd).trim(),
      content: item.substring(firstSentenceEnd + 1).trim()
    };
  }
  
  // If all else fails, return whole string as content
  return {
    title: '',
    content: item
  };
}

export function Insights({ insights, onGenerate, onChange, isGenerating = false, canGenerate = false }: InsightsProps) {
  const hasInsights = insights && insights.length > 0;

  const handleGenerateClick = () => {
    if (onGenerate) {
      onGenerate();
    }
  };

  return (
    <Card className="h-full">
      <CardHeader className="px-4 py-3 md:px-6 md:py-4">
        <CardTitle className="flex items-center gap-2 text-base md:text-lg">
          <LightbulbIcon className="w-4 h-4 md:w-5 md:h-5" />
          Spiritual Insights
        </CardTitle>
        <CardDescription className="text-xs md:text-sm">
          Deeper reflections based on your conversation journey
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 px-4 md:px-6 py-2 md:py-3">
        {hasInsights ? (
          <ul className="space-y-4 md:space-y-6">
            {insights.map((item, index) => {
              const { title, content } = splitInsight(item);
              return (
                <li key={index} className="flex flex-col">
                  <div className="flex items-start gap-2">
                    <span className="text-primary font-medium text-sm md:text-base">{index + 1}.</span>
                    <div className="space-y-1 md:space-y-2">
                      {title && (
                        <p className="font-bold text-sm md:text-base">{title}</p>
                      )}
                      <p className="text-sm md:text-base">{content}</p>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="text-center py-6 md:py-8 text-muted-foreground text-sm md:text-base">
            {canGenerate ? (
              <p>Generate insights after answering at least 3 follow-up questions.</p>
            ) : (
              <p>Insights will be available after more exchanges.</p>
            )}
          </div>
        )}
      </CardContent>
      {onGenerate && canGenerate && (
        <CardFooter className="px-4 md:px-6 py-3 md:py-4">
          <Button 
            onClick={handleGenerateClick} 
            className="w-full text-sm md:text-base py-2"
            disabled={isGenerating || !canGenerate}
          >
            {isGenerating 
              ? "Generating..." 
              : hasInsights 
                ? "Regenerate Insights" 
                : "Generate Spiritual Insights"
            }
          </Button>
        </CardFooter>
      )}
    </Card>
  );
} 