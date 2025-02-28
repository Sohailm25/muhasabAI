import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { CheckCircle } from "lucide-react";

interface ActionItemsProps {
  conversationId: number;
  actionItems?: string[];
  onGenerate: (items: string[]) => void;
}

export function ActionItems({
  conversationId,
  actionItems,
  onGenerate,
}: ActionItemsProps) {
  const { toast } = useToast();

  const handleGenerateActionItems = async () => {
    try {
      const response = await apiRequest(
        "POST",
        `/api/conversation/${conversationId}/action-items`
      );
      const data = await response.json();
      onGenerate(data.actionItems);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate action items. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Action Items</CardTitle>
      </CardHeader>
      <CardContent>
        {actionItems?.length ? (
          <ScrollArea className="h-[200px]">
            <ul className="space-y-4">
              {actionItems.map((item, i) => (
                <li key={i} className="flex gap-2">
                  <CheckCircle className="h-5 w-5 text-primary shrink-0" />
                  <p className="text-sm">{item}</p>
                </li>
              ))}
            </ul>
          </ScrollArea>
        ) : (
          <Button
            onClick={handleGenerateActionItems}
            className="w-full"
          >
            Generate Action Items
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
