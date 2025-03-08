import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarCheck, PlusCircle, ClipboardList, CheckCircle, ArrowUpRight, Star, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Spinner } from "@/components/Spinner";
import { WirdSuggestion, wirdService } from "@/services/wirdService";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export interface WirdhSuggestionsProps {
  suggestions: WirdSuggestion[];
  onGenerate?: () => void;
  onChange?: (suggestions: WirdSuggestion[]) => void;
  isGenerating?: boolean;
  conversationId?: string;
  conversationTitle?: string;
}

export function WirdhSuggestions({ 
  suggestions, 
  onGenerate, 
  onChange, 
  isGenerating = false, 
  conversationId = "", 
  conversationTitle = "Reflection" 
}: WirdhSuggestionsProps) {
  const hasSuggestions = suggestions && suggestions.length > 0;
  const [savedSuggestions, setSavedSuggestions] = useState<Record<string, boolean>>({});
  const [processingWird, setProcessingWird] = useState<string | null>(null);
  const [savedWirdIds, setSavedWirdIds] = useState<Record<string, number>>({});
  const { toast } = useToast();
  const { user } = useAuth();

  // On mount, load the saved state from localStorage
  useEffect(() => {
    try {
      // Load saved wirds IDs from localStorage
      const savedAddedWirdIds = localStorage.getItem('addedWirds');
      if (savedAddedWirdIds) {
        const addedWirdIds = JSON.parse(savedAddedWirdIds) as string[];
        
        // Create a map of saved suggestions
        const suggestionsMap: Record<string, boolean> = {};
        addedWirdIds.forEach(id => {
          suggestionsMap[id] = true;
        });
        
        setSavedSuggestions(suggestionsMap);
      }
      
      // Load saved wird entry IDs from localStorage
      const savedWirdEntryIds = localStorage.getItem('wirdEntryIds');
      if (savedWirdEntryIds) {
        setSavedWirdIds(JSON.parse(savedWirdEntryIds));
      }
    } catch (error) {
      console.error("Error loading saved wirdh suggestions:", error);
    }
  }, []);

  const handleGenerateClick = () => {
    if (onGenerate) {
      onGenerate();
    }
  };

  const handleAddToWirdhPlan = async (suggestion: WirdSuggestion) => {
    if (!user?.id) {
      toast({
        title: "Error",
        description: "You must be logged in to add practices.",
        variant: "destructive",
      });
      return;
    }
    
    // Ensure the suggestion has required fields before sending
    if (!suggestion.id) {
      toast({
        title: "Error",
        description: "Invalid wird suggestion (missing ID).",
        variant: "destructive",
      });
      return;
    }
    
    // Ensure suggestion has a name property
    const preparedSuggestion = {
      ...suggestion,
      // If name is missing but title exists, use title as name
      name: suggestion.name || suggestion.title || "Spiritual Practice",
      // Ensure category is set
      category: suggestion.category || suggestion.type || "General",
      // Ensure target is set
      target: suggestion.target || 1,
    };
    
    setProcessingWird(suggestion.id);
    
    try {
      // Add to wirdh plan
      const result = await wirdService.addToWirdPlan(
        user.id,
        preparedSuggestion,
        undefined, // Use current date
        conversationId ? 'reflection' : undefined, // sourceType
        conversationId ? parseInt(conversationId) : undefined // sourceId
      );
      
      // Update saved suggestions in localStorage
      try {
        // First load the ID list
        const savedAddedWirdIds = localStorage.getItem('addedWirds') || '[]';
        const addedWirdIds = JSON.parse(savedAddedWirdIds) as string[];
        
        // Add new suggestion ID if not already in list
        if (!addedWirdIds.includes(suggestion.id)) {
          addedWirdIds.push(suggestion.id);
          localStorage.setItem('addedWirds', JSON.stringify(addedWirdIds));
        }
        
        // Save the wird entry ID for this suggestion
        if (result && result.id) {
          // Load or initialize the wird entry IDs map
          const savedWirdEntryIds = localStorage.getItem('wirdEntryIds') || '{}';
          const wirdEntryIds = JSON.parse(savedWirdEntryIds) as Record<string, number>;
          
          // Add the new mapping
          wirdEntryIds[suggestion.id] = result.id;
          localStorage.setItem('wirdEntryIds', JSON.stringify(wirdEntryIds));
          
          // Update state
          setSavedWirdIds(wirdEntryIds);
        }
        
        // Update state
        setSavedSuggestions(prev => ({
          ...prev,
          [suggestion.id]: true
        }));
      } catch (e) {
        console.error('Error updating saved wirds in localStorage:', e);
      }
      
      toast({
        title: "Added to Today's Wirdh",
        description: `"${preparedSuggestion.name}" has been added to your Wirdh for today.`,
      });
    } catch (error) {
      console.error("Error adding wirdh suggestion to plan:", error);
      toast({
        title: "Error",
        description: "Failed to add to your Wirdh plan. Please try again.",
        variant: "destructive",
      });
    } finally {
      setProcessingWird(null);
    }
  };

  const handleRemoveFromWirdhPlan = async (suggestion: WirdSuggestion) => {
    if (!user?.id) {
      toast({
        title: "Error",
        description: "You must be logged in to remove practices.",
        variant: "destructive",
      });
      return;
    }
    
    // Ensure the suggestion has required fields
    if (!suggestion.id) {
      toast({
        title: "Error",
        description: "Invalid wird suggestion (missing ID).",
        variant: "destructive",
      });
      return;
    }
    
    // Get the wird entry ID for this suggestion
    const wirdId = savedWirdIds[suggestion.id];
    if (!wirdId) {
      toast({
        title: "Error",
        description: "Could not find the associated Wirdh entry.",
        variant: "destructive",
      });
      return;
    }
    
    setProcessingWird(suggestion.id);
    
    try {
      // Remove from wirdh plan
      await wirdService.removePractice(
        user.id,
        wirdId,
        suggestion.id
      );
      
      // Update saved suggestions in localStorage
      try {
        // First load the ID list
        const savedAddedWirdIds = localStorage.getItem('addedWirds') || '[]';
        const addedWirdIds = JSON.parse(savedAddedWirdIds) as string[];
        
        // Remove suggestion ID from list
        const updatedIds = addedWirdIds.filter(id => id !== suggestion.id);
        localStorage.setItem('addedWirds', JSON.stringify(updatedIds));
        
        // Remove the wird entry ID for this suggestion
        const savedWirdEntryIds = localStorage.getItem('wirdEntryIds') || '{}';
        const wirdEntryIds = JSON.parse(savedWirdEntryIds) as Record<string, number>;
        
        // Remove the mapping
        delete wirdEntryIds[suggestion.id];
        localStorage.setItem('wirdEntryIds', JSON.stringify(wirdEntryIds));
        
        // Update state
        setSavedWirdIds(wirdEntryIds);
        setSavedSuggestions(prev => {
          const updated = { ...prev };
          delete updated[suggestion.id];
          return updated;
        });
      } catch (e) {
        console.error('Error updating saved wirds in localStorage:', e);
      }
      
      toast({
        title: "Removed from Today's Wirdh",
        description: `"${suggestion.name || suggestion.title}" has been removed from your Wirdh for today.`,
      });
    } catch (error) {
      console.error("Error removing wirdh suggestion from plan:", error);
      toast({
        title: "Error",
        description: "Failed to remove from your Wirdh plan. Please try again.",
        variant: "destructive",
      });
    } finally {
      setProcessingWird(null);
    }
  };

  const handleViewWirdhPlan = () => {
    window.location.href = "/wirdh";
  };

  return (
    <Card className="h-full">
      <CardHeader className="px-4 py-3 md:px-6 md:py-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base md:text-lg">
            <CalendarCheck className="w-4 h-4 md:w-5 md:h-5" />
            Wirdh Suggestions
          </CardTitle>
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-xs flex items-center gap-1"
            onClick={handleViewWirdhPlan}
          >
            <ClipboardList className="h-4 w-4" />
            <span className="hidden md:inline">View Wirdh Plan</span>
            <ArrowUpRight className="h-3 w-3" />
          </Button>
        </div>
        <CardDescription className="text-xs md:text-sm">
          Spiritual practices based on your reflections
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 px-4 md:px-6 py-2 md:py-3">
        {hasSuggestions ? (
          <div className="space-y-4 md:space-y-6">
            {suggestions.map((suggestion, index) => {
              const isSaved = !!savedSuggestions[suggestion.id];
              const isProcessing = processingWird === suggestion.id;
              
              return (
                <div key={suggestion.id} className={cn(
                  "p-3 rounded-lg border border-border",
                  isProcessing ? "bg-muted/50 border-primary" : "bg-card",
                  isSaved ? "border-green-500/30" : ""
                )}>
                  <div className="flex items-start gap-2">
                    <Star className="h-4 w-4 mt-1 text-amber-500 flex-shrink-0" />
                    <div className="space-y-1 md:space-y-2 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-bold text-sm md:text-base">
                            {suggestion.title || suggestion.name}
                          </p>
                          {suggestion.description && (
                            <p className="text-muted-foreground text-xs md:text-sm">{suggestion.description}</p>
                          )}
                          <div className="flex flex-wrap gap-2 mt-2">
                            {suggestion.target && suggestion.unit && (
                              <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-1 text-xs">
                                <span>{suggestion.target} {suggestion.unit}</span>
                              </span>
                            )}
                            {suggestion.duration && (
                              <span className="inline-flex items-center rounded-full bg-amber-500/10 px-2 py-1 text-xs">
                                <span>{suggestion.duration}</span>
                              </span>
                            )}
                            {suggestion.frequency && (
                              <span className="inline-flex items-center rounded-full bg-blue-500/10 px-2 py-1 text-xs">
                                <span>{suggestion.frequency}</span>
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex-shrink-0">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                {isSaved ? (
                                  <div className="flex gap-2">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="text-green-500 hover:text-green-600"
                                      disabled={true}
                                    >
                                      <CheckCircle className="h-4 w-4" />
                                      <span className="ml-1">Added</span>
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="text-red-500 hover:text-red-600 hover:bg-red-100"
                                      onClick={() => handleRemoveFromWirdhPlan(suggestion)}
                                      disabled={isProcessing}
                                    >
                                      {isProcessing ? (
                                        <Spinner className="h-4 w-4" />
                                      ) : (
                                        <Trash2 className="h-4 w-4" />
                                      )}
                                    </Button>
                                  </div>
                                ) : (
                                  <Button
                                    variant="secondary"
                                    size="sm"
                                    className="flex-shrink-0"
                                    onClick={() => handleAddToWirdhPlan(suggestion)}
                                    disabled={isProcessing}
                                  >
                                    {isProcessing ? (
                                      <Spinner className="h-4 w-4" />
                                    ) : (
                                      <PlusCircle className="h-4 w-4" />
                                    )}
                                    <span className="ml-1">Add</span>
                                  </Button>
                                )}
                              </TooltipTrigger>
                              <TooltipContent>
                                {isSaved ? "Remove from your Wirdh Plan" : "Add to your Wirdh Plan"}
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-6 md:py-8 text-muted-foreground text-sm md:text-base">
            <p>No Wirdh suggestions available for this reflection.</p>
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
              : hasSuggestions 
                ? "Regenerate Wirdh Suggestions" 
                : "Generate Wirdh Suggestions"
            }
          </Button>
        </CardFooter>
      )}
    </Card>
  );
} 