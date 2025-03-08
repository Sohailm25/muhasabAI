import { useState, useEffect } from 'react';
import { WirdEntry, WirdPractice } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from '@/components/ui/accordion';
import { 
  Menubar, 
  MenubarContent, 
  MenubarItem, 
  MenubarMenu, 
  MenubarTrigger 
} from '@/components/ui/menubar';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip';
import { Pencil, Save, X, Check, RefreshCw, HelpCircle } from 'lucide-react';
import { clearService, CLEARSuggestions } from '@/services/clearService';
import { Badge } from '@/components/ui/badge';
import { wirdService } from '@/services/wirdService';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';

interface WirdhCLEAREntryProps {
  wird: WirdEntry;
  practice: WirdPractice;
  onUpdate?: () => void;
}

export default function WirdhCLEAREntry({ wird, practice, onUpdate }: WirdhCLEAREntryProps) {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [suggestions, setSuggestions] = useState<CLEARSuggestions | null>(null);
  const [isFetchingSuggestions, setIsFetchingSuggestions] = useState(false);
  
  // Local state for CLEAR framework data
  const [clearData, setClearData] = useState({
    cue: practice.clearFramework?.cue || '',
    lowFriction: practice.clearFramework?.lowFriction || '',
    expandable: practice.clearFramework?.expandable || '',
    adaptable: practice.clearFramework?.adaptable || '',
    rewardLinked: practice.clearFramework?.rewardLinked || ''
  });

  // Function to handle changes in CLEAR framework fields
  const handleClearDataChange = (field: keyof typeof clearData, value: string) => {
    setClearData(prev => ({
      ...prev,
      [field]: value
    }));
    setHasChanges(true);
  };

  // Function to generate CLEAR suggestions
  const fetchSuggestions = async () => {
    setIsFetchingSuggestions(true);
    try {
      const newSuggestions = await clearService.getCLEARSuggestions(practice);
      setSuggestions(newSuggestions);
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch CLEAR suggestions',
        variant: 'destructive'
      });
    } finally {
      setIsFetchingSuggestions(false);
    }
  };

  // Function to apply a suggestion
  const applySuggestion = (field: keyof typeof clearData, suggestion: string) => {
    setClearData(prev => ({
      ...prev,
      [field]: suggestion
    }));
    setHasChanges(true);
  };

  // Function to save CLEAR framework data
  const saveChanges = async () => {
    setIsSaving(true);
    try {
      await clearService.updateCLEARFramework(wird.id, practice.id as string, clearData);
      setIsEditing(false);
      setHasChanges(false);
      
      toast({
        title: 'Changes saved',
        description: 'CLEAR framework updated successfully',
        variant: 'default'
      });
      
      if (onUpdate) {
        onUpdate();
      }
    } catch (error) {
      console.error('Error saving changes:', error);
      toast({
        title: 'Error',
        description: 'Failed to save changes',
        variant: 'destructive'
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Function to cancel editing and reset data
  const cancelEditing = () => {
    setClearData({
      cue: practice.clearFramework?.cue || '',
      lowFriction: practice.clearFramework?.lowFriction || '',
      expandable: practice.clearFramework?.expandable || '',
      adaptable: practice.clearFramework?.adaptable || '',
      rewardLinked: practice.clearFramework?.rewardLinked || ''
    });
    setIsEditing(false);
    setHasChanges(false);
  };

  // Fetch suggestions when first switching to edit mode
  useEffect(() => {
    if (isEditing && !suggestions) {
      fetchSuggestions();
    }
  }, [isEditing, suggestions]);

  // Selector component for suggestions
  const SuggestionSelector = ({ 
    title, 
    field, 
    suggestionList 
  }: { 
    title: string, 
    field: keyof typeof clearData, 
    suggestionList: string[] 
  }) => (
    <div className="mt-2">
      <h4 className="text-sm font-medium mb-2">Suggestions:</h4>
      <motion.div 
        className="flex flex-wrap gap-2 overflow-visible"
        layout
        transition={{
          type: "spring",
          stiffness: 500,
          damping: 30,
          mass: 0.5,
        }}
      >
        {suggestionList.map((suggestion, i) => {
          const isSelected = clearData[field] === suggestion;
          return (
            <motion.button
              key={i}
              onClick={() => applySuggestion(field, suggestion)}
              layout
              initial={false}
              animate={{
                backgroundColor: isSelected ? "#2a1711" : "rgba(39, 39, 42, 0.5)",
              }}
              whileHover={{
                backgroundColor: isSelected ? "#2a1711" : "rgba(39, 39, 42, 0.8)",
              }}
              whileTap={{
                backgroundColor: isSelected ? "#1f1209" : "rgba(39, 39, 42, 0.9)",
              }}
              transition={{
                type: "spring",
                stiffness: 500,
                damping: 30,
                mass: 0.5,
                backgroundColor: { duration: 0.1 },
              }}
              className={`
                inline-flex items-center px-3 py-1 rounded-full text-sm font-medium
                whitespace-nowrap overflow-hidden ring-1 ring-inset
                ${isSelected 
                  ? "text-orange-300 ring-[hsla(0,0%,100%,0.12)]" 
                  : "text-zinc-400 ring-[hsla(0,0%,100%,0.06)]"}
              `}
            >
              <motion.div 
                className="relative flex items-center"
                animate={{ 
                  width: isSelected ? "auto" : "100%",
                  paddingRight: isSelected ? "1.5rem" : "0",
                }}
                transition={{
                  ease: [0.175, 0.885, 0.32, 1.275],
                  duration: 0.3,
                }}
              >
                <span>{suggestion}</span>
                <AnimatePresence>
                  {isSelected && (
                    <motion.span
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      transition={{ 
                        type: "spring", 
                        stiffness: 500, 
                        damping: 30, 
                        mass: 0.5 
                      }}
                      className="absolute right-0"
                    >
                      <div className="w-4 h-4 rounded-full bg-orange-400 flex items-center justify-center">
                        <Check className="w-3 h-3 text-[#2a1711]" strokeWidth={1.5} />
                      </div>
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.div>
            </motion.button>
          );
        })}
      </motion.div>
    </div>
  );

  // Framework description details for tooltip
  const frameworkDescriptions = {
    cue: "A specific trigger that prompts you to perform the habit. Example: 'After Fajr, I will read one page of the Quran.'",
    lowFriction: "A way to make the habit so easy you can do it even on your worst day. Example: 'I will read at least one verse even when busy.'",
    expandable: "A way to easily scale up the habit when you have more time. Example: 'One verse minimum, but ideally one page or more.'",
    adaptable: "A way to move the habit around if needed. Example: 'I usually read after Fajr, but if I miss it, I'll read at night.'",
    rewardLinked: "A connection to an intrinsic or extrinsic reward. Example: 'Reading gives me a sense of peace and connection.'"
  };

  // Render the component
  return (
    <Accordion type="single" collapsible className="w-full">
      <AccordionItem value={practice.id || 'default-id'} className="border border-muted rounded-lg mb-4">
        <AccordionTrigger className="px-4 py-2 hover:no-underline">
          <div className="flex justify-between items-center w-full">
            <div className="flex items-center gap-2">
              <span className="font-medium">{practice.name}</span>
              <Badge variant="outline" className="ml-2">
                {practice.category}
              </Badge>
            </div>
            <div className="text-sm text-muted-foreground">
              {practice.completed} / {practice.target} {practice.unit}
            </div>
          </div>
        </AccordionTrigger>
        <AccordionContent className="p-4">
          {/* Display basic practice info */}
          <div className="mb-4">
            <h3 className="text-lg font-semibold">{practice.name}</h3>
            <p className="text-sm text-muted-foreground">
              Target: {practice.target} {practice.unit} | 
              Completed: {practice.completed} {practice.unit} | 
              Category: {practice.category}
            </p>
          </div>

          {/* CLEAR Framework Section */}
          <div className="border rounded-md p-4 bg-muted/30">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">CLEAR Framework</h3>
              {!isEditing ? (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setIsEditing(true)}
                >
                  <Pencil className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              ) : (
                <div>
                  {hasChanges && (
                    <Menubar className="border-none shadow-none bg-transparent h-auto p-0">
                      <MenubarMenu>
                        <MenubarTrigger asChild>
                          <Button size="sm" variant="default">
                            <Save className="h-4 w-4 mr-2" />
                            Save Changes
                          </Button>
                        </MenubarTrigger>
                        <MenubarContent>
                          <MenubarItem
                            onClick={saveChanges}
                            disabled={isSaving}
                            className="gap-2"
                          >
                            <Check className="h-4 w-4" />
                            Save
                          </MenubarItem>
                          <MenubarItem 
                            onClick={cancelEditing}
                            disabled={isSaving}
                            className="gap-2"
                          >
                            <X className="h-4 w-4" />
                            Discard
                          </MenubarItem>
                        </MenubarContent>
                      </MenubarMenu>
                    </Menubar>
                  )}
                </div>
              )}
            </div>

            {/* CLEAR Framework Content */}
            {Object.keys(frameworkDescriptions).map((key) => {
              const field = key as keyof typeof clearData;
              const title = field.charAt(0).toUpperCase() + field.slice(1);
              const displayValue = practice.clearFramework?.[field] || 'Not set';

              return (
                <div key={field} className="mb-6">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="text-md font-medium">{title}</h4>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-5 w-5 p-0">
                            <HelpCircle className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs">{frameworkDescriptions[field]}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>

                  {isEditing ? (
                    <div>
                      <Textarea
                        value={clearData[field]}
                        onChange={(e) => handleClearDataChange(field, e.target.value)}
                        placeholder={`Enter ${title}`}
                        className="w-full"
                      />

                      {/* Suggestions */}
                      {suggestions && (
                        <SuggestionSelector 
                          title={title} 
                          field={field} 
                          suggestionList={suggestions[field]} 
                        />
                      )}

                      {/* Loading state for suggestions */}
                      {isFetchingSuggestions && !suggestions && (
                        <div className="mt-2 text-sm text-muted-foreground italic flex items-center">
                          <RefreshCw className="h-3 w-3 mr-2 animate-spin" />
                          Generating suggestions...
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm">
                      {clearData[field] || (
                        <span className="text-muted-foreground italic">Not set</span>
                      )}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
} 