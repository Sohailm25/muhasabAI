import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import React, { useState } from 'react';
import { RefreshCw, Check, Plus } from 'lucide-react';

interface SuggestionButtonProps {
  suggestion: string;
  onClick: (suggestion: string) => void;
  isLoading?: boolean;
  variant?: 'default' | 'outline' | 'ghost';
  selected?: boolean;
}

export function SuggestionButton({ 
  suggestion, 
  onClick, 
  isLoading = false, 
  variant = 'outline',
  selected = false
}: SuggestionButtonProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isClicked, setIsClicked] = useState(false);
  
  const handleClick = () => {
    onClick(suggestion);
    
    // Animate the click with a brief flash
    setIsClicked(true);
    setTimeout(() => setIsClicked(false), 300);
  };
  
  return (
    <Button
      variant={selected ? 'default' : variant}
      size="sm"
      className={`
        mr-2 mb-2 text-left whitespace-normal h-auto py-2 px-3
        transition-all duration-200 ease-in-out
        ${isHovered ? 'shadow-md transform -translate-y-1' : ''}
        ${isClicked ? 'bg-primary text-primary-foreground' : ''}
        ${selected ? 'border-primary bg-primary/10' : ''}
      `}
      disabled={isLoading}
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {selected ? <Check className="h-3 w-3 mr-1 inline-block" /> : null}
      {suggestion}
    </Button>
  );
}

interface SuggestionGroupProps {
  suggestions: string[];
  onSelect: (suggestion: string) => void;
  isLoading?: boolean;
  onRegenerate?: () => void;
  showRegenerate?: boolean;
  title?: string;
  currentValue?: string;
}

export function SuggestionGroup({ 
  suggestions, 
  onSelect, 
  isLoading = false, 
  onRegenerate,
  showRegenerate = true,
  title = "Suggestions:",
  currentValue = ""
}: SuggestionGroupProps) {
  const { toast } = useToast();
  const [animateIn, setAnimateIn] = useState(false);
  
  // Check if a suggestion matches the current value
  const isSuggestionSelected = (suggestion: string) => {
    return currentValue.trim() === suggestion.trim();
  };
  
  // Add entrance animation effect
  React.useEffect(() => {
    if (suggestions.length > 0 && !isLoading) {
      setAnimateIn(true);
    }
  }, [suggestions, isLoading]);
  
  const handleRegenerate = () => {
    if (onRegenerate) {
      // Reset animation to allow entrance effect after regeneration
      setAnimateIn(false);
      onRegenerate();
    } else {
      toast({
        title: "Regeneration not available",
        description: "Cannot regenerate suggestions at this time",
        variant: "destructive"
      });
    }
  };
  
  if (suggestions.length === 0 && !isLoading) {
    return null;
  }
  
  return (
    <div className={`mb-4 bg-muted/40 p-2 rounded-md border border-muted transition-all duration-300 ${animateIn ? 'opacity-100' : 'opacity-0'}`}>
      <div className="flex items-center mb-2 justify-between">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        {showRegenerate && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleRegenerate}
            disabled={isLoading}
            className="h-7 px-2 ml-auto hover:bg-muted"
          >
            <RefreshCw className={`h-3 w-3 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
            {isLoading ? 'Generating...' : 'Refresh'}
          </Button>
        )}
      </div>
      
      <div className="flex flex-wrap">
        {suggestions.map((suggestion, i) => (
          <SuggestionButton 
            key={i} 
            suggestion={suggestion} 
            onClick={onSelect} 
            isLoading={isLoading}
            selected={isSuggestionSelected(suggestion)}
          />
        ))}
        {suggestions.length === 0 && isLoading && (
          <div className="animate-pulse space-y-2 w-full">
            <div className="h-8 w-32 bg-muted rounded mr-2 mb-2"></div>
            <div className="h-8 w-48 bg-muted rounded mr-2 mb-2"></div>
            <div className="h-8 w-40 bg-muted rounded mr-2 mb-2"></div>
          </div>
        )}
      </div>
    </div>
  );
}

export default SuggestionButton; 