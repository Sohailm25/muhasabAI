import { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation, useRoute } from 'wouter';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { 
  ArrowLeft, 
  Save, 
  PlusCircle, 
  Edit2, 
  X, 
  ChevronDown, 
  ChevronUp, 
  ArrowRight, 
  FileText,
  CheckCircle,
  Calendar
} from 'lucide-react';
import { API } from '@/lib/api';
import { IdentityFramework, FrameworkComponent } from '@shared/schema';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { SuggestionGroup } from '@/components/SuggestionButton';
import { fetchFrameworkGuidance, parseHabitSuggestion, parseTriggerSuggestion } from '@/services/frameworkService';
import { format } from 'date-fns';

// Define content types for each component
type IdentityContent = {
  statements: string[];
};

type VisionContent = {
  statements: string[];
};

type SystemsContent = {
  processes: string[];
};

type GoalsContent = {
  shortTerm: string;
  mediumTerm: string;
  longTerm: string;
  successCriteria: string;
};

type Habit = {
  description: string;
  minimumVersion: string;
  expandedVersion: string;
  reward: string;
  clearAnalysis?: {
    cue: boolean;
    lowFriction: boolean;
    expandable: boolean;
    adaptable: boolean;
    rewardLinked: boolean;
  };
};

type HabitsContent = {
  habits: Habit[];
};

type Trigger = {
  habitId: number;
  primaryTrigger: string;
  secondaryTrigger: string;
  environmentalSupports: string;
};

type TriggersContent = {
  triggers: Trigger[];
};

export default function FrameworkEditor() {
  const [match, params] = useRoute('/identity/:id');
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const [framework, setFramework] = useState<IdentityFramework | null>(null);
  const [components, setComponents] = useState<FrameworkComponent[]>([]);
  const [activeTab, setActiveTab] = useState("identity");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState('');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [showSummary, setShowSummary] = useState(false);
  
  // Add suggestion state
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  
  // Auto-save timer reference
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const hasUnsavedChanges = useRef(false);
  
  // Define the order of tabs for navigation
  const tabOrder = ["identity", "vision", "systems", "goals", "habits", "triggers"];
  
  // Identity component state
  const [identityStatements, setIdentityStatements] = useState<string[]>(['', '', '']);
  const [identitySuggestions, setIdentitySuggestions] = useState<string[][]>([[], [], []]);
  
  // Vision component state
  const [visionStatements, setVisionStatements] = useState<string[]>(['', '', '']);
  const [visionSuggestions, setVisionSuggestions] = useState<string[][]>([[], [], []]);
  
  // Systems component state
  const [systemsProcesses, setSystemsProcesses] = useState<string[]>(['', '', '']);
  const [systemsSuggestions, setSystemsSuggestions] = useState<string[][]>([[], [], []]);
  
  // Goals component state
  const [shortTermGoal, setShortTermGoal] = useState('');
  const [mediumTermGoal, setMediumTermGoal] = useState('');
  const [longTermGoal, setLongTermGoal] = useState('');
  const [successCriteria, setSuccessCriteria] = useState('');
  const [goalsSuggestions, setGoalsSuggestions] = useState<{
    shortTerm: string[];
    mediumTerm: string[];
    longTerm: string[];
    successCriteria: string[];
  }>({
    shortTerm: [],
    mediumTerm: [],
    longTerm: [],
    successCriteria: []
  });
  
  // Habits component state
  const [habits, setHabits] = useState<Habit[]>([
    {
      description: '',
      minimumVersion: '',
      expandedVersion: '',
      reward: ''
    }
  ]);
  const [habitsSuggestions, setHabitsSuggestions] = useState<Habit[]>([]);
  
  // Triggers component state
  const [triggers, setTriggers] = useState<Trigger[]>([
    {
      habitId: 0,
      primaryTrigger: '',
      secondaryTrigger: '',
      environmentalSupports: ''
    }
  ]);
  const [triggersSuggestions, setTriggersSuggestions] = useState<{
    primaryTrigger: string[];
    secondaryTrigger: string[];
    environmentalSupports: string[];
  }>({
    primaryTrigger: [],
    secondaryTrigger: [],
    environmentalSupports: []
  });
  
  // Suggestion cache to avoid unnecessary API calls
  const suggestionCache = useRef<Record<string, any>>({});
  
  // Add a ref to track if initial suggestions were loaded to prevent duplicate calls
  const initialSuggestionsLoaded = useRef(false);
  
  // Fetch framework data
  const { data: frameworkData, isLoading, error: queryError } = useQuery({
    queryKey: ['framework', params?.id],
    queryFn: async () => {
      if (!params?.id) throw new Error('Framework ID is required');
      
      try {
        const response = await API.get(`/api/identity-frameworks/${params.id}`);
        return response.framework;
      } catch (error) {
        console.error('Error fetching framework:', error);
        throw error;
      }
    },
    enabled: !!params?.id && !!user?.id,
  });
  
  // Handle successful data fetching
  useEffect(() => {
    if (frameworkData) {
      setFramework(frameworkData);
      setTitle(frameworkData.title);
      setComponents(frameworkData.components || []);
      initializeComponentStates(frameworkData.components || []);
    }
  }, [frameworkData]);
  
  // Handle query errors
  useEffect(() => {
    if (queryError) {
      toast({
        title: "Error",
        description: queryError instanceof Error ? queryError.message : "Failed to load framework",
        variant: "destructive"
      });
      navigate('/identity');
    }
  }, [queryError, toast, navigate]);
  
  // Update loading state based on query loading status
  useEffect(() => {
    // Set loading to false when data is loaded or when there's an error
    if (!isLoading && frameworkData) {
      setLoading(false);
    }
  }, [isLoading, frameworkData]);
  
  // Update title mutation
  const updateTitle = useMutation({
    mutationFn: async (title: string) => {
      if (!params?.id) throw new Error('Framework ID is required');
      
      try {
        // Use the new api.put method
        const response = await API.put(`/api/identity-frameworks/${params.id}`, { title });
        return response;
      } catch (error) {
        console.error('Error updating title:', error);
        throw error;
      }
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Framework title updated",
      });
      queryClient.invalidateQueries({ queryKey: ['framework', params?.id] });
      queryClient.invalidateQueries({ queryKey: ['identity-frameworks'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update title",
        variant: "destructive"
      });
    }
  });
  
  // Save component mutation
  const saveComponent = useMutation({
    mutationFn: async ({ componentType, content }: { componentType: string, content: any }) => {
      if (!params?.id) throw new Error('Framework ID is required');
      
      try {
        const response = await API.post(`/api/identity-frameworks/${params.id}/components`, { 
          componentType, 
          content 
        });
        return response;
      } catch (error) {
        console.error('Error saving component:', error);
        throw error;
      }
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Component saved successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['framework', params?.id] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save component",
        variant: "destructive"
      });
    }
  });
  
  const initializeComponentStates = (components: FrameworkComponent[]) => {
    // Initialize each component type with its data
    components.forEach(component => {
      switch (component.componentType) {
        case 'identity':
          const identityContent = component.content as IdentityContent;
          setIdentityStatements(identityContent.statements || ['', '', '']);
          break;
        
        case 'vision':
          const visionContent = component.content as VisionContent;
          setVisionStatements(visionContent.statements || ['', '', '']);
          break;
        
        case 'systems':
          const systemsContent = component.content as SystemsContent;
          setSystemsProcesses(systemsContent.processes || ['', '', '']);
          break;
        
        case 'goals':
          const goalsContent = component.content as GoalsContent;
          setShortTermGoal(goalsContent.shortTerm || '');
          setMediumTermGoal(goalsContent.mediumTerm || '');
          setLongTermGoal(goalsContent.longTerm || '');
          setSuccessCriteria(goalsContent.successCriteria || '');
          break;
        
        case 'habits':
          const habitsContent = component.content as HabitsContent;
          setHabits(habitsContent.habits?.length > 0 
            ? habitsContent.habits 
            : [{ description: '', minimumVersion: '', expandedVersion: '', reward: '' }]
          );
          break;
        
        case 'triggers':
          const triggersContent = component.content as TriggersContent;
          setTriggers(triggersContent.triggers?.length > 0 
            ? triggersContent.triggers 
            : [{ habitId: 0, primaryTrigger: '', secondaryTrigger: '', environmentalSupports: '' }]
          );
          break;
      }
    });
  };
  
  // Add auto-save functionality
  const autoSave = useCallback(() => {
    if (!hasUnsavedChanges.current) return;
    
    const currentTab = activeTab;
    
    switch(currentTab) {
      case 'identity':
        saveIdentity();
        break;
      case 'vision':
        saveVision();
        break;
      case 'systems':
        saveSystems();
        break;
      case 'goals':
        saveGoals();
        break;
      case 'habits':
        saveHabits();
        break;
      case 'triggers':
        saveTriggers();
        break;
    }
    
    hasUnsavedChanges.current = false;
  }, [activeTab]); // eslint-disable-line react-hooks/exhaustive-deps

  // Set up auto-save timer
  useEffect(() => {
    // Clear any existing timer
    if (autoSaveTimerRef.current) {
      clearInterval(autoSaveTimerRef.current);
    }
    
    // Set up new timer that runs every 30 seconds
    autoSaveTimerRef.current = setInterval(() => {
      autoSave();
    }, 30000); // 30 seconds
    
    // Cleanup on unmount
    return () => {
      if (autoSaveTimerRef.current) {
        clearInterval(autoSaveTimerRef.current);
      }
    };
  }, [autoSave]);

  // Mark changes as unsaved when content changes
  useEffect(() => {
    hasUnsavedChanges.current = true;
  }, [
    identityStatements, 
    visionStatements, 
    systemsProcesses, 
    shortTermGoal, mediumTermGoal, longTermGoal, successCriteria,
    habits,
    triggers
  ]);

  // Auto-save when changing tabs
  const handleTabChange = (value: string) => {
    // Save current tab before changing
    autoSave();
    
    // Change to new tab
    setActiveTab(value);
  };

  // Navigation functions
  const goToNextTab = () => {
    const currentIndex = tabOrder.indexOf(activeTab);
    if (currentIndex < tabOrder.length - 1) {
      // Auto-save current tab
      autoSave();
      setActiveTab(tabOrder[currentIndex + 1]);
    } else {
      // If we're on the last tab, show the summary
      setShowSummary(true);
    }
  };

  const goToPreviousTab = () => {
    const currentIndex = tabOrder.indexOf(activeTab);
    if (currentIndex > 0) {
      // Auto-save current tab
      autoSave();
      setActiveTab(tabOrder[currentIndex - 1]);
    }
  };
  
  const saveTitle = async () => {
    // Only save if there are changes
    if (!framework || framework.title === title) return;
    
    setSaving(true);
    try {
      await updateTitle.mutateAsync(title);
      setLastSaved(new Date());
    } catch (error) {
      console.error('Error saving title:', error);
    } finally {
      setSaving(false);
    }
  };
  
  const saveIdentity = async () => {
    setSaving(true);
    try {
      await saveComponent.mutateAsync({
        componentType: 'identity',
        content: { statements: identityStatements }
      });
      setLastSaved(new Date());
    } catch (error) {
      console.error('Error saving identity component:', error);
    } finally {
      setSaving(false);
    }
  };
  
  const saveVision = async () => {
    setSaving(true);
    try {
      await saveComponent.mutateAsync({
        componentType: 'vision', 
        content: {
          statements: visionStatements
        }
      });
      setLastSaved(new Date());
    } catch (error) {
      console.error('Error saving vision component:', error);
    } finally {
      setSaving(false);
    }
  };
  
  const saveSystems = async () => {
    setSaving(true);
    try {
      await saveComponent.mutateAsync({
        componentType: 'systems',
        content: {
          processes: systemsProcesses
        }
      });
      setLastSaved(new Date());
    } catch (error) {
      console.error('Error saving systems component:', error);
    } finally {
      setSaving(false);
    }
  };
  
  const saveGoals = async () => {
    setSaving(true);
    try {
      await saveComponent.mutateAsync({
        componentType: 'goals',
        content: {
          shortTerm: shortTermGoal,
          mediumTerm: mediumTermGoal,
          longTerm: longTermGoal,
          successCriteria: successCriteria
        }
      });
      setLastSaved(new Date());
    } catch (error) {
      console.error('Error saving goals component:', error);
    } finally {
      setSaving(false);
    }
  };
  
  const saveHabits = async () => {
    setSaving(true);
    try {
      const validHabits = habits.filter(h => h.description.trim() !== '');
      await saveComponent.mutateAsync({
        componentType: 'habits',
        content: {
          habits: validHabits
        }
      });
      setLastSaved(new Date());
    } catch (error) {
      console.error('Error saving habits component:', error);
    } finally {
      setSaving(false);
    }
  };
  
  const saveTriggers = async () => {
    setSaving(true);
    try {
      const validTriggers = triggers.filter(t => t.primaryTrigger.trim() !== '');
      await saveComponent.mutateAsync({
        componentType: 'triggers',
        content: {
          triggers: validTriggers
        }
      });
      setLastSaved(new Date());
    } catch (error) {
      console.error('Error saving triggers component:', error);
    } finally {
      setSaving(false);
    }
  };
  
  const addIdentityStatement = () => {
    setIdentityStatements([...identityStatements, '']);
  };
  
  const removeIdentityStatement = (index: number) => {
    const updated = [...identityStatements];
    updated.splice(index, 1);
    setIdentityStatements(updated);
  };
  
  const addVisionStatement = () => {
    setVisionStatements([...visionStatements, '']);
  };
  
  const removeVisionStatement = (index: number) => {
    const updated = [...visionStatements];
    updated.splice(index, 1);
    setVisionStatements(updated);
  };
  
  const addSystemsProcess = () => {
    setSystemsProcesses([...systemsProcesses, '']);
  };
  
  const removeSystemsProcess = (index: number) => {
    const updated = [...systemsProcesses];
    updated.splice(index, 1);
    setSystemsProcesses(updated);
  };
  
  const addHabit = () => {
    setHabits([...habits, {
      description: '',
      minimumVersion: '',
      expandedVersion: '',
      reward: ''
    }]);
  };
  
  const removeHabit = (index: number) => {
    const updated = [...habits];
    updated.splice(index, 1);
    setHabits(updated);
  };
  
  const addTrigger = () => {
    setTriggers([...triggers, {
      habitId: habits.length > 0 ? habits.length - 1 : 0,
      primaryTrigger: '',
      secondaryTrigger: '',
      environmentalSupports: ''
    }]);
  };
  
  const removeTrigger = (index: number) => {
    const updated = [...triggers];
    updated.splice(index, 1);
    setTriggers(updated);
  };
  
  const getProgressIndicator = () => {
    const totalSteps = 6; // identity, vision, systems, goals, habits, triggers
    const framework = frameworkData;
    
    if (!framework) return null;
    
    const completedComponentTypes = new Set((framework.components || []).map((c: {componentType: string}) => c.componentType));
    const completedSteps = completedComponentTypes.size;
    
    return (
      <div className="mt-4 mb-8">
        <div className="flex justify-between text-sm mb-1">
          <span>{completedSteps} of {totalSteps} components</span>
          <span>{framework.completionPercentage || 0}% complete</span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 h-2 rounded-full">
          <div 
            className="bg-primary h-2 rounded-full" 
            style={{ width: `${framework.completionPercentage || 0}%` }} 
          />
        </div>
      </div>
    );
  };
  
  // Function to fetch suggestions for a component
  const fetchSuggestions = useCallback(async (componentType: string, regenerate: boolean = false) => {
    if (!framework) return;
    
    // If we have cached suggestions and aren't regenerating, use those
    const cacheKey = `${framework.id}:${componentType}`;
    if (!regenerate && suggestionCache.current[cacheKey]) {
      console.log(`Using cached suggestions for ${componentType}`);
      
      // Apply cached suggestions based on component type
      applySuggestions(componentType, suggestionCache.current[cacheKey]);
      return;
    }
    
    console.log(`Fetching suggestions for ${componentType}`);
    setLoadingSuggestions(true);
    
    try {
      const guidance = await fetchFrameworkGuidance(
        framework.title,
        componentType,
        components,
        regenerate
      );
      
      // Cache the guidance
      suggestionCache.current[cacheKey] = guidance;
      
      // Apply suggestions based on component type
      applySuggestions(componentType, guidance);
    } catch (error) {
      console.error(`Error fetching suggestions for ${componentType}:`, error);
      toast({
        title: "Error",
        description: "Failed to load suggestions. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoadingSuggestions(false);
    }
  }, [framework, components, toast]);
  
  // Function to apply fetched suggestions to the correct state
  const applySuggestions = useCallback((componentType: string, guidance: any) => {
    if (!guidance) return;
    
    const { suggestions, examples } = guidance;
    
    switch (componentType) {
      case 'identity':
        // For identity, properly map suggestions to each specific field
        // Rather than spreading suggestions across fields, create specific field arrays
        const identityFields: string[][] = [[], [], []];
        
        // If we have at least 3 suggestions, use them for the 3 specific fields
        if (suggestions.length >= 3) {
          // First suggestion goes to "I am becoming..." field
          identityFields[0].push(suggestions[0]);
          // Second suggestion goes to "At my core, I value..." field
          identityFields[1].push(suggestions[1]);
          // Third suggestion goes to "My strengths..." field
          identityFields[2].push(suggestions[2]);
          
          // Add any remaining suggestions to appropriate fields
          suggestions.slice(3).forEach((sugg: string, i: number) => {
            identityFields[i % 3].push(sugg);
          });
        } else {
          // If we don't have enough suggestions, distribute what we have
          suggestions.forEach((sugg: string, i: number) => {
            identityFields[i % 3].push(sugg);
          });
        }
        
        // If we have examples, categorize them intelligently by examining their content
        examples.forEach((example: string) => {
          const lowerExample = example.toLowerCase();
          
          // Find the appropriate field based on keywords in the example
          if (lowerExample.includes("i am") || lowerExample.includes("becoming") || lowerExample.includes("person")) {
            identityFields[0].push(example);
          } else if (lowerExample.includes("value") || lowerExample.includes("core")) {
            identityFields[1].push(example);
          } else if (lowerExample.includes("strength") || lowerExample.includes("support")) {
            identityFields[2].push(example);
          } else {
            // If we can't categorize, add to a random field
            const fieldIndex = Math.floor(Math.random() * 3);
            identityFields[fieldIndex].push(example);
          }
        });
        
        setIdentitySuggestions(identityFields);
        break;
        
      case 'vision':
        // For vision, properly map suggestions to each specific field
        const visionFields: string[][] = [[], [], []];
        
        // If we have at least 3 suggestions, use them for the 3 specific fields
        if (suggestions.length >= 3) {
          // First suggestion goes to "This identity matters..." field
          visionFields[0].push(suggestions[0]);
          // Second suggestion goes to "When I embody..." field
          visionFields[1].push(suggestions[1]);
          // Third suggestion goes to "In five years..." field
          visionFields[2].push(suggestions[2]);
          
          // Add any remaining suggestions to appropriate fields
          suggestions.slice(3).forEach((sugg: string, i: number) => {
            visionFields[i % 3].push(sugg);
          });
        } else {
          // If we don't have enough suggestions, distribute what we have
          suggestions.forEach((sugg: string, i: number) => {
            visionFields[i % 3].push(sugg);
          });
        }
        
        // Categorize examples based on keywords
        examples.forEach((example: string) => {
          const lowerExample = example.toLowerCase();
          
          if (lowerExample.includes("matters") || lowerExample.includes("because")) {
            visionFields[0].push(example);
          } else if (lowerExample.includes("embody") || lowerExample.includes("impact") || lowerExample.includes("others")) {
            visionFields[1].push(example);
          } else if (lowerExample.includes("five years") || lowerExample.includes("future") || lowerExample.includes("would mean")) {
            visionFields[2].push(example);
          } else {
            // If we can't categorize, add to a random field
            const fieldIndex = Math.floor(Math.random() * 3);
            visionFields[fieldIndex].push(example);
          }
        });
        
        setVisionSuggestions(visionFields);
        break;
        
      case 'systems':
        // For systems, properly map suggestions to each specific field
        const systemsFields: string[][] = [[], [], []];
        
        // If we have at least 3 suggestions, use them for the 3 specific fields
        if (suggestions.length >= 3) {
          // First suggestion goes to "My daily/weekly process..." field
          systemsFields[0].push(suggestions[0]);
          // Second suggestion goes to "The principles..." field
          systemsFields[1].push(suggestions[1]);
          // Third suggestion goes to "I maintain balance..." field
          systemsFields[2].push(suggestions[2]);
          
          // Add any remaining suggestions to appropriate fields
          suggestions.slice(3).forEach((sugg: string, i: number) => {
            systemsFields[i % 3].push(sugg);
          });
        } else {
          // If we don't have enough suggestions, distribute what we have
          suggestions.forEach((sugg: string, i: number) => {
            systemsFields[i % 3].push(sugg);
          });
        }
        
        // Categorize examples based on keywords
        examples.forEach((example: string) => {
          const lowerExample = example.toLowerCase();
          
          if (lowerExample.includes("process") || lowerExample.includes("daily") || lowerExample.includes("weekly")) {
            systemsFields[0].push(example);
          } else if (lowerExample.includes("principle") || lowerExample.includes("approach") || lowerExample.includes("guide")) {
            systemsFields[1].push(example);
          } else if (lowerExample.includes("balance") || lowerExample.includes("maintain")) {
            systemsFields[2].push(example);
          } else {
            // If we can't categorize, add to a random field
            const fieldIndex = Math.floor(Math.random() * 3);
            systemsFields[fieldIndex].push(example);
          }
        });
        
        setSystemsSuggestions(systemsFields);
        break;
        
      case 'goals':
        // For goals, we have 4 different fields
        setGoalsSuggestions({
          shortTerm: suggestions.filter((s: string, i: number) => i % 4 === 0),
          mediumTerm: suggestions.filter((s: string, i: number) => i % 4 === 1),
          longTerm: suggestions.filter((s: string, i: number) => i % 4 === 2),
          successCriteria: suggestions.filter((s: string, i: number) => i % 4 === 3)
        });
        
        // Try to intelligently categorize examples
        const goalFields = {
          shortTerm: [] as string[],
          mediumTerm: [] as string[],
          longTerm: [] as string[],
          successCriteria: [] as string[]
        };
        
        examples.forEach((example: string) => {
          const lowerExample = example.toLowerCase();
          
          if (lowerExample.includes("short") || lowerExample.includes("month") || 
              lowerExample.match(/\b\d+\s*day/)) {
            goalFields.shortTerm.push(example);
          } else if (lowerExample.includes("medium") || lowerExample.includes("week") ||
                    (lowerExample.includes("month") && !lowerExample.includes("short"))) {
            goalFields.mediumTerm.push(example);
          } else if (lowerExample.includes("long") || lowerExample.includes("year")) {
            goalFields.longTerm.push(example);
          } else if (lowerExample.includes("success") || lowerExample.includes("know") || 
                    lowerExample.includes("achieved") || lowerExample.includes("criteria")) {
            goalFields.successCriteria.push(example);
          } else {
            // If we can't categorize, add based on length - longer goals usually take longer
            const wordCount = example.split(' ').length;
            if (wordCount < 8) goalFields.shortTerm.push(example);
            else if (wordCount < 12) goalFields.mediumTerm.push(example);
            else goalFields.longTerm.push(example);
          }
        });
        
        // Merge with existing suggestions
        setGoalsSuggestions({
          shortTerm: [...goalFields.shortTerm, ...goalsSuggestions.shortTerm.filter((item: string) => item !== '')],
          mediumTerm: [...goalFields.mediumTerm, ...goalsSuggestions.mediumTerm.filter((item: string) => item !== '')],
          longTerm: [...goalFields.longTerm, ...goalsSuggestions.longTerm.filter((item: string) => item !== '')],
          successCriteria: [...goalFields.successCriteria, ...goalsSuggestions.successCriteria.filter((item: string) => item !== '')]
        });
        break;
        
      case 'habits':
        // For habits, parse the examples into habit objects but be smarter about it
        // Extract full habit details from examples where possible
        const habitSugs = examples.map((example: string) => {
          const parsedHabit = parseHabitSuggestion(example);
          return parsedHabit.description ? parsedHabit : null;
        }).filter(Boolean) as Habit[];
        
        // Also add the suggestions as simple habit descriptions with sensible defaults
        const additionalHabits = suggestions.map((s: string) => ({
          description: s,
          minimumVersion: 'Start with 5 minutes',
          expandedVersion: 'Work up to 20 minutes',
          reward: 'Sense of spiritual progress'
        }));
        
        setHabitsSuggestions([...habitSugs, ...additionalHabits]);
        break;
        
      case 'triggers':
        // For triggers, parse the examples but organize them better
        const parsedTriggers = examples.map((example: string) => parseTriggerSuggestion(example));
        
        // Make sure we have valid parsed triggers
        const validTriggers = parsedTriggers.filter((t: { primaryTrigger: string }) => 
          t.primaryTrigger && t.primaryTrigger.trim() !== ''
        );
        
        // Create more organized and categorized suggestions
        const triggerSuggestionGroups = {
          primaryTrigger: [] as string[],
          secondaryTrigger: [] as string[],
          environmentalSupports: [] as string[]
        };
        
        // Add primary triggers from valid parsed triggers
        triggerSuggestionGroups.primaryTrigger = [
          ...suggestions,
          ...validTriggers.map((t: { primaryTrigger: string }) => t.primaryTrigger)
        ];
        
        // Add secondary triggers from valid parsed triggers
        triggerSuggestionGroups.secondaryTrigger = validTriggers
          .map((t: { secondaryTrigger: string }) => t.secondaryTrigger)
          .filter(Boolean);
        
        // Add environmental supports from valid parsed triggers
        triggerSuggestionGroups.environmentalSupports = validTriggers
          .map((t: { environmentalSupports: string }) => t.environmentalSupports)
          .filter(Boolean);
        
        setTriggersSuggestions(triggerSuggestionGroups);
        break;
    }
  }, []);
  
  // Load suggestions when active tab changes
  useEffect(() => {
    if (!framework || !framework.id) return;
    
    // Only fetch if we don't already have suggestions for this component
    if (activeTab) {
      const cacheKey = `${framework.id}:${activeTab}`;
      if (!suggestionCache.current[cacheKey] && !loadingSuggestions) {
        fetchSuggestions(activeTab);
      }
    }
  }, [activeTab, framework, fetchSuggestions, loadingSuggestions]);
  
  // Combined effect for initial and stored title suggestion preloading
  useEffect(() => {
    // Skip if we've already loaded initial suggestions or if we don't have a framework yet
    if (initialSuggestionsLoaded.current || !framework || !framework.id) return;
    
    const storedTitle = localStorage.getItem('lastFrameworkTitle');
    const shouldPreloadAll = storedTitle && storedTitle === framework.title;
    
    if (shouldPreloadAll) {
      console.log('Found stored framework title for suggestions:', storedTitle);
      localStorage.removeItem('lastFrameworkTitle');
      
      // Load identity first (immediate priority)
      fetchSuggestions('identity');
      
      // Queue the rest with increasing delays to avoid overwhelming the API
      const componentTypes = ['vision', 'systems', 'goals', 'habits', 'triggers'];
      componentTypes.forEach((type, index) => {
        setTimeout(() => {
          // Double-check that they haven't been loaded already
          const cacheKey = `${framework.id}:${type}`;
          if (!suggestionCache.current[cacheKey] && !loadingSuggestions) {
            fetchSuggestions(type);
          }
        }, (index + 1) * 2000); // 2s, 4s, 6s, 8s, 10s
      });
    } 
    // If no stored title but we have a framework and no components, just load the active tab
    else if (components.length === 0) {
      fetchSuggestions('identity');
    }
    
    // Mark that we've loaded initial suggestions
    initialSuggestionsLoaded.current = true;
  }, [framework, components, fetchSuggestions, loadingSuggestions]);
  
  // Create a new function for the summary view
  const renderSummary = () => {
    if (!showSummary) return null;
    
    const hasIdentity = identityStatements.some(s => s.trim() !== '');
    const hasVision = visionStatements.some(s => s.trim() !== '');
    const hasSystems = systemsProcesses.some(s => s.trim() !== '');
    const hasGoals = !!(shortTermGoal || mediumTermGoal || longTermGoal || successCriteria);
    const hasHabits = habits.some(h => h.description.trim() !== '');
    const hasTriggers = triggers.some(t => t.primaryTrigger.trim() !== '');

    // Function to generate a printable habit tracker PDF
    const generateHabitTracker = () => {
      toast({
        title: "Habit Tracker",
        description: "Generating habit tracker PDF...",
      });
      
      // Check if we have habits to track
      const validHabits = habits.filter(h => h.description.trim());
      if (!validHabits.length) {
        toast({
          title: "Error",
          description: "You need to define at least one habit to generate a tracker.",
          variant: "destructive"
        });
        return;
      }
      
      // In a production application, this would call a server-side API to generate
      // a PDF and return it for download, or use a client-side library like jsPDF.
      // For now, we'll simulate a download with a timeout.
      
      // Simulate PDF generation and download
      setTimeout(() => {
        try {
          // Create a dummy link element to trigger download
          const link = document.createElement('a');
          link.href = `data:text/plain;charset=utf-8,${encodeURIComponent(
            `# Habit Tracker for ${framework?.title || 'Identity Framework'}\n\n` +
            `Generated on: ${new Date().toLocaleDateString()}\n\n` +
            `## Identity\n${identityStatements.find(s => s.trim()) || 'Not defined yet'}\n\n` +
            `## Goals\n${shortTermGoal || mediumTermGoal || longTermGoal || 'Not defined yet'}\n\n` +
            `## Habits\n${validHabits.map(h => `- ${h.description}`).join('\n')}\n\n` +
            `This is a placeholder for the actual PDF tracker that would be generated in the complete implementation.`
          )}`;
          link.download = `${framework?.title || 'identity-framework'}-habit-tracker.txt`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          
          toast({
            title: "Success",
            description: "Habit tracker downloaded (text format)",
          });
        } catch (error) {
          console.error('Error simulating download:', error);
          toast({
            title: "Error",
            description: "Failed to generate habit tracker. Please try again.",
            variant: "destructive"
          });
        }
      }, 1500);
    };

    // Section to display a component with collapsible content
    const SummarySection = ({ 
      title, 
      hasContent, 
      onEdit,
      children 
    }: { 
      title: string; 
      hasContent: boolean; 
      onEdit: () => void;
      children: React.ReactNode 
    }) => {
      const [expanded, setExpanded] = useState(true);
      
      return (
        <Card className="mb-4">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <CardTitle>{title}</CardTitle>
              <div className="flex gap-2">
                <Button variant="ghost" size="icon" onClick={() => setExpanded(!expanded)}>
                  {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
                <Button variant="outline" size="sm" onClick={onEdit}>
                  <Edit2 className="h-4 w-4 mr-2" />
                  Edit
                </Button>
              </div>
            </div>
          </CardHeader>
          {expanded && (
            <CardContent>
              {hasContent ? children : (
                <div className="p-4 border rounded-md bg-muted/50 flex flex-col items-center justify-center text-center">
                  <p className="text-muted-foreground mb-2">No content added yet</p>
                  <Button variant="outline" size="sm" onClick={onEdit}>
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Add Content
                  </Button>
                </div>
              )}
            </CardContent>
          )}
        </Card>
      );
    };

    // Framework visualization component
    const FrameworkVisualization = () => {
      // Get summaries for each component
      const getIdentitySummary = () => {
        if (!identityStatements.some(s => s.trim())) return null;
        return identityStatements.find(s => s.trim()) || null;
      };
      
      const getVisionSummary = () => {
        if (!visionStatements.some(s => s.trim())) return null;
        return visionStatements.find(s => s.trim()) || null;
      };
      
      const getSystemsSummary = () => {
        if (!systemsProcesses.some(s => s.trim())) return null;
        return systemsProcesses.find(s => s.trim()) || null;
      };
      
      const getGoalsSummary = () => {
        if (!shortTermGoal && !mediumTermGoal && !longTermGoal) return null;
        return shortTermGoal || mediumTermGoal || longTermGoal;
      };
      
      const getHabitsSummary = () => {
        if (!habits.some(h => h.description.trim())) return null;
        const habitCount = habits.filter(h => h.description.trim()).length;
        return `${habitCount} habit${habitCount !== 1 ? 's' : ''} defined`;
      };
      
      const getTriggersSummary = () => {
        if (!triggers.some(t => t.primaryTrigger.trim())) return null;
        const triggerCount = triggers.filter(t => t.primaryTrigger.trim()).length;
        return `${triggerCount} trigger${triggerCount !== 1 ? 's' : ''} defined`;
      };
      
      const identitySummary = getIdentitySummary();
      const visionSummary = getVisionSummary();
      const systemsSummary = getSystemsSummary();
      const goalsSummary = getGoalsSummary();
      const habitsSummary = getHabitsSummary();
      const triggersSummary = getTriggersSummary();

      return (
        <div className="py-6 mb-8">
          <h3 className="text-lg font-semibold mb-4">Framework Connections</h3>
          <div className="relative bg-muted/50 p-8 rounded-lg flex flex-col items-center">
            <div className="grid grid-cols-3 gap-4 w-full max-w-4xl">
              {/* Identity - Top Left */}
              <div className="border rounded-md p-3 bg-primary/10 flex flex-col items-center text-center">
                <h4 className="font-semibold">Identity</h4>
                <p className="text-sm text-muted-foreground">Who I am becoming</p>
                {identitySummary && (
                  <p className="mt-2 text-sm line-clamp-2">{identitySummary}</p>
                )}
              </div>
              
              {/* Vision - Top Center */}
              <div className="border rounded-md p-3 bg-primary/10 flex flex-col items-center text-center">
                <h4 className="font-semibold">Vision</h4>
                <p className="text-sm text-muted-foreground">Why it matters</p>
                {visionSummary && (
                  <p className="mt-2 text-sm line-clamp-2">{visionSummary}</p>
                )}
              </div>
              
              {/* Systems - Top Right */}
              <div className="border rounded-md p-3 bg-primary/10 flex flex-col items-center text-center">
                <h4 className="font-semibold">Systems</h4>
                <p className="text-sm text-muted-foreground">How I operate</p>
                {systemsSummary && (
                  <p className="mt-2 text-sm line-clamp-2">{systemsSummary}</p>
                )}
              </div>
              
              {/* Connecting lines */}
              <div className="col-span-3 flex justify-center items-center py-4">
                <ArrowRight className="h-10 w-10 text-muted-foreground" />
              </div>
              
              {/* Goals - Bottom Left */}
              <div className="border rounded-md p-3 bg-secondary/10 flex flex-col items-center text-center">
                <h4 className="font-semibold">Goals</h4>
                <p className="text-sm text-muted-foreground">What I aim for</p>
                {goalsSummary && (
                  <p className="mt-2 text-sm line-clamp-2">{goalsSummary}</p>
                )}
              </div>
              
              {/* Habits - Bottom Center */}
              <div className="border rounded-md p-3 bg-secondary/10 flex flex-col items-center text-center">
                <h4 className="font-semibold">Habits</h4>
                <p className="text-sm text-muted-foreground">What I do repeatedly</p>
                {habitsSummary && (
                  <p className="mt-2 text-sm line-clamp-2">{habitsSummary}</p>
                )}
              </div>
              
              {/* Triggers - Bottom Right */}
              <div className="border rounded-md p-3 bg-secondary/10 flex flex-col items-center text-center">
                <h4 className="font-semibold">Triggers</h4>
                <p className="text-sm text-muted-foreground">When & where I act</p>
                {triggersSummary && (
                  <p className="mt-2 text-sm line-clamp-2">{triggersSummary}</p>
                )}
              </div>
            </div>
            
            <div className="mt-8 text-center">
              <p className="text-sm text-muted-foreground max-w-lg">
                Your identity framework for <strong>{framework?.title || 'spiritual growth'}</strong> connects who you are becoming with the actions you take daily.
                Each component builds on the previous ones to create a coherent system for transformation.
              </p>
            </div>
          </div>
        </div>
      );
    };

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Framework Summary</h2>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowSummary(false)}>
              <Edit2 className="h-4 w-4 mr-2" />
              Return to Editor
            </Button>
            <Button onClick={generateHabitTracker}>
              <FileText className="h-4 w-4 mr-2" />
              Generate Habit Tracker
            </Button>
          </div>
        </div>
        
        <FrameworkVisualization />
        
        <SummarySection 
          title="Identity (Who I Am / Want to Be)" 
          hasContent={hasIdentity}
          onEdit={() => {
            setShowSummary(false);
            setActiveTab("identity");
          }}
        >
          <ul className="space-y-2">
            {identityStatements.map((statement, index) => (
              statement.trim() && (
                <li key={`identity-${index}`} className="ml-6 list-disc">
                  {statement}
                </li>
              )
            ))}
          </ul>
        </SummarySection>
        
        <SummarySection 
          title="Vision (Why It Matters)" 
          hasContent={hasVision}
          onEdit={() => {
            setShowSummary(false);
            setActiveTab("vision");
          }}
        >
          <ul className="space-y-2">
            {visionStatements.map((statement, index) => (
              statement.trim() && (
                <li key={`vision-${index}`} className="ml-6 list-disc">
                  {statement}
                </li>
              )
            ))}
          </ul>
        </SummarySection>
        
        <SummarySection 
          title="Systems (How I Operate)" 
          hasContent={hasSystems}
          onEdit={() => {
            setShowSummary(false);
            setActiveTab("systems");
          }}
        >
          <ul className="space-y-2">
            {systemsProcesses.map((process, index) => (
              process.trim() && (
                <li key={`system-${index}`} className="ml-6 list-disc">
                  {process}
                </li>
              )
            ))}
          </ul>
        </SummarySection>
        
        <SummarySection 
          title="Goals (What I Am Aiming For)" 
          hasContent={hasGoals}
          onEdit={() => {
            setShowSummary(false);
            setActiveTab("goals");
          }}
        >
          {shortTermGoal && (
            <div className="mb-2">
              <p className="font-medium">Short-term (1-3 months):</p>
              <p>{shortTermGoal}</p>
            </div>
          )}
          
          {mediumTermGoal && (
            <div className="mb-2">
              <p className="font-medium">Medium-term (3-12 months):</p>
              <p>{mediumTermGoal}</p>
            </div>
          )}
          
          {longTermGoal && (
            <div className="mb-2">
              <p className="font-medium">Long-term (1+ years):</p>
              <p>{longTermGoal}</p>
            </div>
          )}
          
          {successCriteria && (
            <div className="mb-2">
              <p className="font-medium">Success criteria:</p>
              <p>{successCriteria}</p>
            </div>
          )}
        </SummarySection>
        
        <SummarySection 
          title="Habits (What I Repeatedly Do)" 
          hasContent={hasHabits}
          onEdit={() => {
            setShowSummary(false);
            setActiveTab("habits");
          }}
        >
          <div className="space-y-4">
            {habits.map((habit, index) => (
              habit.description.trim() && (
                <div key={`habit-${index}`} className="p-3 border rounded-md">
                  <p className="font-medium">{habit.description}</p>
                  {habit.minimumVersion && (
                    <p className="text-sm mt-1">
                      <span className="font-medium">Minimum:</span> {habit.minimumVersion}
                    </p>
                  )}
                  {habit.expandedVersion && (
                    <p className="text-sm mt-1">
                      <span className="font-medium">Expanded:</span> {habit.expandedVersion}
                    </p>
                  )}
                  {habit.reward && (
                    <p className="text-sm mt-1">
                      <span className="font-medium">Reward:</span> {habit.reward}
                    </p>
                  )}
                </div>
              )
            ))}
          </div>
        </SummarySection>
        
        <SummarySection 
          title="Triggers (When & Where I Act)" 
          hasContent={hasTriggers}
          onEdit={() => {
            setShowSummary(false);
            setActiveTab("triggers");
          }}
        >
          <div className="space-y-4">
            {triggers.map((trigger, index) => (
              trigger.primaryTrigger.trim() && (
                <div key={`trigger-${index}`} className="p-3 border rounded-md">
                  <div className="mb-2">
                    <p className="font-medium">For habit: {(habits[trigger.habitId]?.description || `Habit ${trigger.habitId + 1}`).substring(0, 40)}...</p>
                  </div>
                  <p className="text-sm">
                    <span className="font-medium">Primary trigger:</span> {trigger.primaryTrigger}
                  </p>
                  {trigger.secondaryTrigger && (
                    <p className="text-sm mt-1">
                      <span className="font-medium">Secondary trigger:</span> {trigger.secondaryTrigger}
                    </p>
                  )}
                  {trigger.environmentalSupports && (
                    <p className="text-sm mt-1">
                      <span className="font-medium">Environmental supports:</span> {trigger.environmentalSupports}
                    </p>
                  )}
                </div>
              )
            ))}
          </div>
        </SummarySection>
      </div>
    );
  };

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center mb-6">
            <Button variant="ghost" onClick={() => navigate('/identity')} className="mr-2">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <h1 className="text-3xl font-bold flex-1">Loading Framework...</h1>
          </div>
          
          <div className="grid gap-4">
            <div className="h-8 w-1/3 animate-pulse bg-muted rounded"></div>
            <div className="h-64 animate-pulse bg-muted rounded"></div>
            <div className="h-64 animate-pulse bg-muted rounded"></div>
          </div>
        </div>
      </Layout>
    );
  }
  
  return (
    <Layout>
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center mb-6">
          <Button variant="ghost" onClick={() => navigate('/identity')} className="mr-2">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-3xl font-bold flex-1">
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={saveTitle}
              className="text-3xl font-bold border-none focus-visible:ring-0 px-0 h-auto"
              placeholder="Untitled Framework"
            />
          </h1>
          {lastSaved && (
            <p className="text-sm text-muted-foreground mr-4">
              Last saved {lastSaved.toLocaleTimeString()}
            </p>
          )}
          <div className="flex items-center">
            <div className="flex items-center mr-4">
              <div className="bg-gray-200 dark:bg-gray-700 h-2 w-24 rounded-full">
                <div 
                  className="bg-primary h-2 rounded-full" 
                  style={{ width: `${framework?.completionPercentage || 0}%` }} 
                />
              </div>
              <span className="ml-2 text-sm text-muted-foreground">
                {framework?.completionPercentage || 0}%
              </span>
            </div>
          </div>
        </div>
        
        {showSummary ? (
          renderSummary()
        ) : (
          <>
            {getProgressIndicator()}
            
            <Tabs value={activeTab} onValueChange={handleTabChange}>
              <TabsList className="mb-4">
                <TabsTrigger value="identity">Identity</TabsTrigger>
                <TabsTrigger value="vision">Vision</TabsTrigger>
                <TabsTrigger value="systems">Systems</TabsTrigger>
                <TabsTrigger value="goals">Goals</TabsTrigger>
                <TabsTrigger value="habits">Habits</TabsTrigger>
                <TabsTrigger value="triggers">Triggers</TabsTrigger>
              </TabsList>
              
              <TabsContent value="identity">
                <Card>
                  <CardHeader>
                    <CardTitle>Identity (Who I Am / Want to Be)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {identityStatements.map((statement, index) => (
                        <div key={`identity-${index}`} className="flex items-start gap-2">
                          <div className="flex-1">
                            <Label htmlFor={`identity-${index}`} className="mb-2 block">
                              {index === 0 && 'I am (or am becoming) a _________ person.'}
                              {index === 1 && 'At my core, I value __________.'}
                              {index === 2 && 'My strengths that support this identity include __________.'}
                              {index > 2 && `Additional statement ${index + 1 - 3}`}
                            </Label>
                            
                            {/* Add suggestions */}
                            {identitySuggestions[index]?.length > 0 && (
                              <SuggestionGroup
                                suggestions={identitySuggestions[index]}
                                onSelect={(suggestion) => {
                                  const updated = [...identityStatements];
                                  updated[index] = suggestion;
                                  setIdentityStatements(updated);
                                }}
                                isLoading={loadingSuggestions && activeTab === 'identity'}
                                onRegenerate={() => fetchSuggestions('identity', true)}
                                showRegenerate={index === 0}
                                currentValue={statement}
                              />
                            )}
                            
                            <Textarea
                              id={`identity-${index}`}
                              value={statement}
                              onChange={(e) => {
                                const updated = [...identityStatements];
                                updated[index] = e.target.value;
                                setIdentityStatements(updated);
                              }}
                              placeholder="Enter your statement"
                              className="mb-2"
                            />
                          </div>
                          {index > 0 && (
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => removeIdentityStatement(index)}
                              className="mt-8"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                      
                      <Button
                        variant="outline"
                        type="button"
                        onClick={addIdentityStatement}
                        className="mt-2"
                      >
                        <PlusCircle className="h-4 w-4 mr-2" />
                        Add Another Statement
                      </Button>
                      
                      <div className="mt-6">
                        <Button
                          onClick={saveIdentity}
                          disabled={saving}
                          className="w-full"
                        >
                          <Save className="h-4 w-4 mr-2" />
                          Save Identity Component
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <div className="flex justify-between mt-6">
                  <Button
                    variant="outline"
                    onClick={goToPreviousTab}
                    disabled={tabOrder.indexOf(activeTab) === 0}
                  >
                    Previous
                  </Button>
                  <Button onClick={goToNextTab}>
                    Next: Vision
                  </Button>
                </div>
              </TabsContent>
              
              <TabsContent value="vision">
                <Card>
                  <CardHeader>
                    <CardTitle>Vision (Why It Matters)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {visionStatements.map((statement, index) => (
                        <div key={`vision-${index}`} className="flex items-start gap-2">
                          <div className="flex-1">
                            <Label htmlFor={`vision-${index}`} className="mb-2 block">
                              {index === 0 && 'This identity matters to me because __________.'}
                              {index === 1 && 'When I embody this identity, the impact on others is __________.'}
                              {index === 2 && 'In five years, living this identity would mean __________.'}
                              {index > 2 && `Additional statement ${index + 1 - 3}`}
                            </Label>
                            
                            {/* Add suggestions */}
                            {visionSuggestions[index]?.length > 0 && (
                              <SuggestionGroup
                                suggestions={visionSuggestions[index]}
                                onSelect={(suggestion) => {
                                  const updated = [...visionStatements];
                                  updated[index] = suggestion;
                                  setVisionStatements(updated);
                                }}
                                isLoading={loadingSuggestions && activeTab === 'vision'}
                                onRegenerate={() => fetchSuggestions('vision', true)}
                                showRegenerate={index === 0}
                                currentValue={statement}
                              />
                            )}
                            
                            <Textarea
                              id={`vision-${index}`}
                              value={statement}
                              onChange={(e) => {
                                const updated = [...visionStatements];
                                updated[index] = e.target.value;
                                setVisionStatements(updated);
                              }}
                              placeholder="Enter your statement"
                              className="mb-2"
                            />
                          </div>
                          {index > 0 && (
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => removeVisionStatement(index)}
                              className="mt-8"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                      
                      <Button
                        variant="outline"
                        type="button"
                        onClick={addVisionStatement}
                        className="mt-2"
                      >
                        <PlusCircle className="h-4 w-4 mr-2" />
                        Add Another Statement
                      </Button>
                      
                      <div className="mt-6">
                        <Button
                          onClick={saveVision}
                          disabled={saving}
                          className="w-full"
                        >
                          <Save className="h-4 w-4 mr-2" />
                          Save Vision Component
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <div className="flex justify-between mt-6">
                  <Button variant="outline" onClick={goToPreviousTab}>
                    Previous: Identity
                  </Button>
                  <Button onClick={goToNextTab}>
                    Next: Systems
                  </Button>
                </div>
              </TabsContent>
              
              <TabsContent value="systems">
                <Card>
                  <CardHeader>
                    <CardTitle>Systems (How I Operate)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {systemsProcesses.map((process, index) => (
                        <div key={`system-${index}`} className="flex items-start gap-2">
                          <div className="flex-1">
                            <Label htmlFor={`system-${index}`} className="mb-2 block">
                              {index === 0 && 'My daily/weekly process includes __________.'}
                              {index === 1 && 'The principles that guide my approach are __________.'}
                              {index === 2 && 'I maintain balance by __________.'}
                              {index > 2 && `Additional process ${index + 1 - 3}`}
                            </Label>
                            
                            {/* Add suggestions */}
                            {systemsSuggestions[index]?.length > 0 && (
                              <SuggestionGroup
                                suggestions={systemsSuggestions[index]}
                                onSelect={(suggestion) => {
                                  const updated = [...systemsProcesses];
                                  updated[index] = suggestion;
                                  setSystemsProcesses(updated);
                                }}
                                isLoading={loadingSuggestions && activeTab === 'systems'}
                                onRegenerate={() => fetchSuggestions('systems', true)}
                                showRegenerate={index === 0}
                                currentValue={process}
                              />
                            )}
                            
                            <Textarea
                              id={`system-${index}`}
                              value={process}
                              onChange={(e) => {
                                const updated = [...systemsProcesses];
                                updated[index] = e.target.value;
                                setSystemsProcesses(updated);
                              }}
                              placeholder="Enter your system process"
                              className="mb-2"
                            />
                          </div>
                          {index > 0 && (
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => removeSystemsProcess(index)}
                              className="mt-8"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                      
                      <Button
                        variant="outline"
                        type="button"
                        onClick={addSystemsProcess}
                        className="mt-2"
                      >
                        <PlusCircle className="h-4 w-4 mr-2" />
                        Add Another Process
                      </Button>
                      
                      <div className="mt-6">
                        <Button
                          onClick={saveSystems}
                          disabled={saving}
                          className="w-full"
                        >
                          <Save className="h-4 w-4 mr-2" />
                          Save Systems Component
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <div className="flex justify-between mt-6">
                  <Button variant="outline" onClick={goToPreviousTab}>
                    Previous: Vision
                  </Button>
                  <Button onClick={goToNextTab}>
                    Next: Goals
                  </Button>
                </div>
              </TabsContent>
              
              <TabsContent value="goals">
                <Card>
                  <CardHeader>
                    <CardTitle>Goals (What I Am Aiming For)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="short-term" className="mb-2 block">
                          Short-term (1-3 months)
                        </Label>
                        
                        {/* Short-term goal suggestions */}
                        {goalsSuggestions.shortTerm.length > 0 && (
                          <SuggestionGroup
                            suggestions={goalsSuggestions.shortTerm}
                            onSelect={(suggestion) => setShortTermGoal(suggestion)}
                            isLoading={loadingSuggestions && activeTab === 'goals'}
                            onRegenerate={() => fetchSuggestions('goals', true)}
                            showRegenerate={true}
                            currentValue={shortTermGoal}
                          />
                        )}
                        
                        <Textarea
                          id="short-term"
                          value={shortTermGoal}
                          onChange={(e) => setShortTermGoal(e.target.value)}
                          placeholder="Enter your short-term goal"
                          className="mb-4"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="medium-term" className="mb-2 block">
                          Medium-term (3-12 months)
                        </Label>
                        
                        {/* Medium-term goal suggestions */}
                        {goalsSuggestions.mediumTerm.length > 0 && (
                          <SuggestionGroup
                            suggestions={goalsSuggestions.mediumTerm}
                            onSelect={(suggestion) => setMediumTermGoal(suggestion)}
                            isLoading={loadingSuggestions && activeTab === 'goals'}
                            onRegenerate={() => fetchSuggestions('goals', true)}
                            showRegenerate={false}
                            currentValue={mediumTermGoal}
                          />
                        )}
                        
                        <Textarea
                          id="medium-term"
                          value={mediumTermGoal}
                          onChange={(e) => setMediumTermGoal(e.target.value)}
                          placeholder="Enter your medium-term goal"
                          className="mb-4"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="long-term" className="mb-2 block">
                          Long-term (1+ years)
                        </Label>
                        
                        {/* Long-term goal suggestions */}
                        {goalsSuggestions.longTerm.length > 0 && (
                          <SuggestionGroup
                            suggestions={goalsSuggestions.longTerm}
                            onSelect={(suggestion) => setLongTermGoal(suggestion)}
                            isLoading={loadingSuggestions && activeTab === 'goals'}
                            onRegenerate={() => fetchSuggestions('goals', true)}
                            showRegenerate={false}
                            currentValue={longTermGoal}
                          />
                        )}
                        
                        <Textarea
                          id="long-term"
                          value={longTermGoal}
                          onChange={(e) => setLongTermGoal(e.target.value)}
                          placeholder="Enter your long-term goal"
                          className="mb-4"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="success-criteria" className="mb-2 block">
                          I'll know I've succeeded when
                        </Label>
                        
                        {/* Success criteria suggestions */}
                        {goalsSuggestions.successCriteria.length > 0 && (
                          <SuggestionGroup
                            suggestions={goalsSuggestions.successCriteria}
                            onSelect={(suggestion) => setSuccessCriteria(suggestion)}
                            isLoading={loadingSuggestions && activeTab === 'goals'}
                            onRegenerate={() => fetchSuggestions('goals', true)}
                            showRegenerate={false}
                            currentValue={successCriteria}
                          />
                        )}
                        
                        <Textarea
                          id="success-criteria"
                          value={successCriteria}
                          onChange={(e) => setSuccessCriteria(e.target.value)}
                          placeholder="Define your success criteria"
                          className="mb-4"
                        />
                      </div>
                      
                      <div className="mt-6">
                        <Button
                          onClick={saveGoals}
                          disabled={saving}
                          className="w-full"
                        >
                          <Save className="h-4 w-4 mr-2" />
                          Save Goals Component
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <div className="flex justify-between mt-6">
                  <Button variant="outline" onClick={goToPreviousTab}>
                    Previous: Systems
                  </Button>
                  <Button onClick={goToNextTab}>
                    Next: Habits
                  </Button>
                </div>
              </TabsContent>
              
              <TabsContent value="habits">
                <Card>
                  <CardHeader>
                    <CardTitle>Habits (What I Repeatedly Do)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {/* Show habit suggestions at the top */}
                      {habitsSuggestions.length > 0 && (
                        <div className="mb-4 p-4 border rounded-lg">
                          <h3 className="text-sm font-medium mb-2">Suggested Habits:</h3>
                          <div className="space-y-3">
                            {habitsSuggestions.map((habit, i) => (
                              <div key={i} className="p-3 bg-muted rounded-md">
                                <p className="font-medium">{habit.description}</p>
                                {habit.minimumVersion && (
                                  <p className="text-sm text-muted-foreground mt-1">
                                    <span className="font-medium">Minimum:</span> {habit.minimumVersion}
                                  </p>
                                )}
                                {habit.expandedVersion && (
                                  <p className="text-sm text-muted-foreground mt-1">
                                    <span className="font-medium">Expanded:</span> {habit.expandedVersion}
                                  </p>
                                )}
                                {habit.reward && (
                                  <p className="text-sm text-muted-foreground mt-1">
                                    <span className="font-medium">Reward:</span> {habit.reward}
                                  </p>
                                )}
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="mt-2"
                                  onClick={() => {
                                    const updated = [...habits];
                                    updated.push({...habit});
                                    setHabits(updated);
                                  }}
                                >
                                  Use This Habit
                                </Button>
                              </div>
                            ))}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => fetchSuggestions('habits', true)}
                              disabled={loadingSuggestions}
                              className="mt-2"
                            >
                              {loadingSuggestions ? 'Generating...' : 'Generate More Habits'}
                            </Button>
                          </div>
                        </div>
                      )}
                      
                      {habits.map((habit, index) => (
                        <div key={`habit-${index}`} className="p-4 border rounded-lg">
                          <div className="flex justify-between items-center mb-4">
                            <h3 className="font-medium">Habit {index + 1}</h3>
                            {index > 0 && (
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => removeHabit(index)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                          
                          <div className="space-y-4">
                            <div>
                              <Label htmlFor={`habit-desc-${index}`} className="mb-2 block">
                                Habit description
                              </Label>
                              <Input
                                id={`habit-desc-${index}`}
                                value={habit.description}
                                onChange={(e) => {
                                  const updated = [...habits];
                                  updated[index].description = e.target.value;
                                  setHabits(updated);
                                }}
                                placeholder="e.g., Morning meditation"
                                className="mb-2"
                              />
                            </div>
                            
                            <div>
                              <Label htmlFor={`habit-min-${index}`} className="mb-2 block">
                                Minimum viable version
                              </Label>
                              <Input
                                id={`habit-min-${index}`}
                                value={habit.minimumVersion}
                                onChange={(e) => {
                                  const updated = [...habits];
                                  updated[index].minimumVersion = e.target.value;
                                  setHabits(updated);
                                }}
                                placeholder="e.g., 2 minutes breathing awareness"
                                className="mb-2"
                              />
                            </div>
                            
                            <div>
                              <Label htmlFor={`habit-exp-${index}`} className="mb-2 block">
                                Expanded version
                              </Label>
                              <Input
                                id={`habit-exp-${index}`}
                                value={habit.expandedVersion}
                                onChange={(e) => {
                                  const updated = [...habits];
                                  updated[index].expandedVersion = e.target.value;
                                  setHabits(updated);
                                }}
                                placeholder="e.g., 15 minutes full meditation practice"
                                className="mb-2"
                              />
                            </div>
                            
                            <div>
                              <Label htmlFor={`habit-reward-${index}`} className="mb-2 block">
                                The immediate reward is
                              </Label>
                              <Input
                                id={`habit-reward-${index}`}
                                value={habit.reward}
                                onChange={(e) => {
                                  const updated = [...habits];
                                  updated[index].reward = e.target.value;
                                  setHabits(updated);
                                }}
                                placeholder="e.g., Sense of calm and clarity to start the day"
                                className="mb-2"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                      
                      <Button
                        variant="outline"
                        type="button"
                        onClick={addHabit}
                        className="mt-2"
                      >
                        <PlusCircle className="h-4 w-4 mr-2" />
                        Add Another Habit
                      </Button>
                      
                      <div className="mt-6">
                        <Button
                          onClick={saveHabits}
                          disabled={saving}
                          className="w-full"
                        >
                          <Save className="h-4 w-4 mr-2" />
                          Save Habits Component
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <div className="flex justify-between mt-6">
                  <Button variant="outline" onClick={goToPreviousTab}>
                    Previous: Goals
                  </Button>
                  <Button onClick={goToNextTab}>
                    Next: Triggers
                  </Button>
                </div>
              </TabsContent>
              
              <TabsContent value="triggers">
                <Card>
                  <CardHeader>
                    <CardTitle>Triggers (When & Where I Act)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {habits.length === 0 ? (
                        <div className="text-center p-4 border rounded-lg">
                          <p className="text-muted-foreground mb-4">
                            Please define at least one habit before setting up triggers.
                          </p>
                          <Button onClick={() => setActiveTab("habits")}>
                            Go to Habits
                          </Button>
                        </div>
                      ) : (
                        <>
                          {triggers.map((trigger, index) => (
                            <div key={`trigger-${index}`} className="p-4 border rounded-lg">
                              <div className="flex justify-between items-center mb-4">
                                <h3 className="font-medium">Trigger {index + 1}</h3>
                                {index > 0 && (
                                  <Button 
                                    variant="ghost" 
                                    size="icon"
                                    onClick={() => removeTrigger(index)}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                              
                              <div className="space-y-4">
                                <div>
                                  <Label htmlFor={`trigger-habit-${index}`} className="mb-2 block">
                                    For which habit?
                                  </Label>
                                  <select
                                    id={`trigger-habit-${index}`}
                                    value={trigger.habitId}
                                    onChange={(e) => {
                                      const updated = [...triggers];
                                      updated[index].habitId = parseInt(e.target.value);
                                      setTriggers(updated);
                                    }}
                                    className="w-full p-2 border rounded-md dark:bg-gray-800"
                                  >
                                    {habits.map((habit, i) => (
                                      <option key={i} value={i}>
                                        {habit.description || `Habit ${i + 1}`}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                                
                                <div>
                                  <Label htmlFor={`trigger-primary-${index}`} className="mb-2 block">
                                    Primary trigger (When/Where)
                                  </Label>
                                  
                                  {/* Primary trigger suggestions */}
                                  {triggersSuggestions.primaryTrigger.length > 0 && (
                                    <SuggestionGroup
                                      suggestions={triggersSuggestions.primaryTrigger}
                                      onSelect={(suggestion) => {
                                        const updated = [...triggers];
                                        updated[index].primaryTrigger = suggestion;
                                        setTriggers(updated);
                                      }}
                                      isLoading={loadingSuggestions && activeTab === 'triggers'}
                                      onRegenerate={() => fetchSuggestions('triggers', true)}
                                      showRegenerate={index === 0}
                                      currentValue={trigger.primaryTrigger}
                                    />
                                  )}
                                  
                                  <Input
                                    id={`trigger-primary-${index}`}
                                    value={trigger.primaryTrigger}
                                    onChange={(e) => {
                                      const updated = [...triggers];
                                      updated[index].primaryTrigger = e.target.value;
                                      setTriggers(updated);
                                    }}
                                    placeholder="e.g., After morning prayer"
                                    className="mb-2"
                                  />
                                </div>
                                
                                <div>
                                  <Label htmlFor={`trigger-secondary-${index}`} className="mb-2 block">
                                    Secondary trigger (backup)
                                  </Label>
                                  
                                  {/* Secondary trigger suggestions */}
                                  {triggersSuggestions.secondaryTrigger.length > 0 && (
                                    <SuggestionGroup
                                      suggestions={triggersSuggestions.secondaryTrigger}
                                      onSelect={(suggestion) => {
                                        const updated = [...triggers];
                                        updated[index].secondaryTrigger = suggestion;
                                        setTriggers(updated);
                                      }}
                                      isLoading={loadingSuggestions && activeTab === 'triggers'}
                                      onRegenerate={undefined}
                                      showRegenerate={false}
                                      currentValue={trigger.secondaryTrigger}
                                    />
                                  )}
                                  
                                  <Input
                                    id={`trigger-secondary-${index}`}
                                    value={trigger.secondaryTrigger}
                                    onChange={(e) => {
                                      const updated = [...triggers];
                                      updated[index].secondaryTrigger = e.target.value;
                                      setTriggers(updated);
                                    }}
                                    placeholder="e.g., Before opening email"
                                    className="mb-2"
                                  />
                                </div>
                                
                                <div>
                                  <Label htmlFor={`trigger-env-${index}`} className="mb-2 block">
                                    Environmental Supports
                                  </Label>
                                  
                                  {/* Environmental supports suggestions */}
                                  {triggersSuggestions.environmentalSupports.length > 0 && (
                                    <SuggestionGroup
                                      suggestions={triggersSuggestions.environmentalSupports}
                                      onSelect={(suggestion) => {
                                        const updated = [...triggers];
                                        updated[index].environmentalSupports = suggestion;
                                        setTriggers(updated);
                                      }}
                                      isLoading={loadingSuggestions && activeTab === 'triggers'}
                                      onRegenerate={undefined}
                                      showRegenerate={false}
                                      currentValue={trigger.environmentalSupports}
                                    />
                                  )}
                                  
                                  <Input
                                    id={`trigger-env-${index}`}
                                    value={trigger.environmentalSupports}
                                    onChange={(e) => {
                                      const updated = [...triggers];
                                      updated[index].environmentalSupports = e.target.value;
                                      setTriggers(updated);
                                    }}
                                    placeholder="e.g., At home, in the office"
                                    className="mb-2"
                                  />
                                </div>
                              </div>
                            </div>
                          ))}
                        </>
                      )}
                      
                      <Button
                        variant="outline"
                        type="button"
                        onClick={addTrigger}
                        className="mt-2"
                      >
                        <PlusCircle className="h-4 w-4 mr-2" />
                        Add Another Trigger
                      </Button>
                      
                      <div className="mt-6">
                        <Button
                          onClick={saveTriggers}
                          disabled={saving}
                          className="w-full"
                        >
                          <Save className="h-4 w-4 mr-2" />
                          Save Triggers Component
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <div className="flex justify-between mt-6">
                  <Button variant="outline" onClick={goToPreviousTab}>
                    Previous: Habits
                  </Button>
                  <Button onClick={() => {
                    autoSave();
                    setShowSummary(true);
                  }}>
                    View Framework Summary
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </Layout>
  );
}