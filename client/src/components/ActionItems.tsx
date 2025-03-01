import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckSquare } from "lucide-react";

export interface ActionItemsProps {
  items: string[];
  onGenerate: () => void;
  isGenerating?: boolean;
}

export function ActionItems({ items, onGenerate, isGenerating = false }: ActionItemsProps) {
  const hasItems = items && items.length > 0;

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckSquare className="w-5 h-5" />
          Action Items
        </CardTitle>
        <CardDescription>
          Personalized recommendations based on your reflections
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1">
        {hasItems ? (
          <ul className="space-y-3">
            {items.map((item, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="text-primary font-medium">{index + 1}.</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <p>Generate action items based on your reflections.</p>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button 
          onClick={onGenerate} 
          className="w-full" 
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
    </Card>
  );
}
