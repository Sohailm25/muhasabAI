import { useEffect, useState, useRef, useLayoutEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/Spinner";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { halaqaService } from "@/services/halaqaService";
import { wirdService } from "@/services/wirdService";
import { Halaqa, HalaqaActionItem, WirdSuggestion } from "@/types";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Pencil, BookOpen, Calendar, User, Tag, ArrowLeft, RotateCw, Check, Trash2, Plus, Star, Clock, Repeat } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel,
  FormMessage
} from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Badge } from "@/components/ui/badge";
import { usePersonalization } from "@/hooks/usePersonalization";
import { HalaqaService } from "@/services/halaqaService";

export default function HalaqaDetailPage() {
  const [, params] = useRoute<{ id: string }>("/halaqa/:id");
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [halaqa, setHalaqa] = useState<Halaqa | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generatingActions, setGeneratingActions] = useState(false);
  const [analyzingHalaqa, setAnalyzingHalaqa] = useState(false);
  const [wirdSuggestions, setWirdSuggestions] = useState<WirdSuggestion[] | null>(null);
  const [personalizedInsights, setPersonalizedInsights] = useState<{id: string; title: string; content: string;}[] | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [addingToWird, setAddingToWird] = useState<string | null>(null); // To track which suggestion is being added
  const [addedWirds, setAddedWirds] = useState<string[]>([]); // Track IDs of suggestions added to wird
  const [editMode, setEditMode] = useState(false);
  
  // Set up refs for timeout and loading tracking
  const isMounted = useRef(true);
  const loadingTimeoutRef = useRef<number | null>(null);
  const currentlyLoadingId = useRef<number | null>(null);
  
  // Add a ref to track if analysis has been attempted
  const hasAttemptedAnalysis = useRef(false);
  
  // Reset attempted analysis flag when halaqa ID changes
  useEffect(() => {
    if (params?.id) {
      hasAttemptedAnalysis.current = false;
    }
  }, [params?.id]);
  
  // Reset mounted state when component mounts (use layout effect to run BEFORE render)
  useLayoutEffect(() => {
    console.log('Component mounted, setting isMounted to true');
    isMounted.current = true;
    
    // Clean up on unmount
    return () => {
      console.log('Component unmounting, setting isMounted to false');
      isMounted.current = false;
      // Clear any pending timeouts
      if (loadingTimeoutRef.current) {
        window.clearTimeout(loadingTimeoutRef.current);
        loadingTimeoutRef.current = null;
      }
    };
  }, []);
  
  // Attempt to load already added wirds from localStorage when component mounts
  useEffect(() => {
    try {
      const savedAddedWirds = localStorage.getItem('addedWirds');
      if (savedAddedWirds) {
        setAddedWirds(JSON.parse(savedAddedWirds));
      }
    } catch (e) {
      console.error('Error loading added wirds from localStorage:', e);
    }
  }, []);
  
  // Load halaqa when the route params change
  useEffect(() => {
    if (!params || !params.id) {
      console.log("No params or ID found");
      return;
    }
    
    const halaqaId = parseInt(params.id, 10);
    if (isNaN(halaqaId)) {
      console.error(`Invalid halaqa ID: ${params.id}`);
      setError("Invalid halaqa ID");
      setLoading(false);
      return;
    }
    
    // Prevent refetching if we already have this halaqa loaded
    if (halaqa && halaqa.id === halaqaId) {
      console.log(`Halaqa ${halaqaId} already loaded, skipping fetch`);
      return;
    }
    
    // Prevent refetching if we're already loading this ID
    if (loading && currentlyLoadingId.current === halaqaId) {
      console.log(`Already loading halaqa ${halaqaId}, skipping useEffect fetch`);
      return;
    }
    
    console.log(`Route parameters detected, loading halaqa ID: ${halaqaId}`);
    fetchHalaqa(halaqaId);
    
    // Use a cleanup function to handle navigation away
    return () => {
      // If we're navigating away, we can cancel ongoing fetches
      if (currentlyLoadingId.current === halaqaId) {
        console.log(`Navigating away from halaqa ${halaqaId}, cleaning up`);
        if (loadingTimeoutRef.current) {
          window.clearTimeout(loadingTimeoutRef.current);
          loadingTimeoutRef.current = null;
        }
      }
    };
  }, [params, halaqa?.id]); // Only run when params or halaqa.id changes
  
  // Auto-analyze halaqa to generate Wird suggestions when it loads
  useEffect(() => {
    if (halaqa && !analyzingHalaqa && user?.id && !hasAttemptedAnalysis.current) {
      // Check if we need to analyze based on missing wird suggestions
      const needsAnalysis = !halaqa.wirdSuggestions || halaqa.wirdSuggestions.length === 0;
      
      if (needsAnalysis) {
        console.log("Auto-analyzing halaqa to generate insights and wird suggestions");
        hasAttemptedAnalysis.current = true; // Mark as attempted regardless of outcome
        handleAnalyzeHalaqa();
      } else {
        // If we already have wird suggestions, just update the state
        console.log("Halaqa already has wird suggestions, updating state");
        if (halaqa.wirdSuggestions) {
          setWirdSuggestions(halaqa.wirdSuggestions);
          
          // If we don't have personalized insights yet, initialize with fallback insights
          if (!personalizedInsights || personalizedInsights.length === 0) {
            setPersonalizedInsights(getFallbackInsights());
          }
          
          hasAttemptedAnalysis.current = true;
        }
      }
    }
  }, [halaqa?.id, user?.id]); // Include user?.id to prevent analysis before user is loaded
  
  // Action item schema for the edit form
  const actionItemSchema = z.object({
    description: z.string().min(1, "Description is required"),
    completed: z.boolean().default(false),
  });
  
  // Form for editing action items
  const actionItemForm = useForm<z.infer<typeof actionItemSchema>>({
    resolver: zodResolver(actionItemSchema),
    defaultValues: {
      description: "",
      completed: false
    }
  });
  
  // Form for editing halaqa details
  const editHalaqaSchema = z.object({
    title: z.string().optional(),
    speaker: z.string().optional(),
    date: z.date().optional(),
    topic: z.string().min(1, "Topic is required"),
    keyReflection: z.string().min(10, "Key reflection should be at least 10 characters"),
    impact: z.string().min(10, "Impact should be at least 10 characters"),
  });
  
  const editHalaqaForm = useForm<z.infer<typeof editHalaqaSchema>>({
    resolver: zodResolver(editHalaqaSchema),
    defaultValues: {
      title: "",
      speaker: "",
      date: new Date(),
      topic: "",
      keyReflection: "",
      impact: "",
    }
  });
  
  // Sync wird suggestions from halaqa whenever halaqa changes
  useEffect(() => {
    if (halaqa && halaqa.wirdSuggestions && halaqa.wirdSuggestions.length > 0) {
      // Only update if different (to avoid render loops)
      if (JSON.stringify(wirdSuggestions) !== JSON.stringify(halaqa.wirdSuggestions)) {
        setWirdSuggestions(halaqa.wirdSuggestions);
      }
    }
  }, [halaqa]);
  
  // Initialize edit form when halaqa data is loaded or edit mode is enabled
  useEffect(() => {
    if (halaqa && editMode) {
      editHalaqaForm.reset({
        title: halaqa.title || "",
        speaker: halaqa.speaker || "",
        date: halaqa.date instanceof Date ? halaqa.date : new Date(halaqa.date),
        topic: halaqa.topic || "",
        keyReflection: halaqa.keyReflection || "",
        impact: halaqa.impact || "",
      });
    }
  }, [halaqa, editMode]);
  
  // Add personalization hook
  const personalization = usePersonalization();
  
  // Fetch halaqa data
  const fetchHalaqa = async (id: number) => {
    // Don't start a new fetch if we're already fetching this ID
    if (loading && currentlyLoadingId.current === id) {
      console.log(`Already loading halaqa ${id}, skipping fetchHalaqa call`);
      return;
    }
    
    // Clear any existing timeout
    if (loadingTimeoutRef.current) {
      window.clearTimeout(loadingTimeoutRef.current);
      loadingTimeoutRef.current = null;
    }
    
    console.log(`Fetching halaqa ${id}...`);
    setLoading(true);
    setError(null);
    currentlyLoadingId.current = id;
    
    // Set a safety timeout to ensure loading state doesn't get stuck
    loadingTimeoutRef.current = window.setTimeout(() => {
      console.log(`Safety timeout triggered for halaqa ${id}, resetting loading state`);
      setLoading(false);
      currentlyLoadingId.current = null;
    }, 10000); // 10 second timeout
    
    try {
      console.log(`Making API call to fetch halaqa ${id}`);
      const fetchedHalaqa = await halaqaService.getHalaqa(id);
      console.log(`Successfully fetched halaqa ${id}:`, fetchedHalaqa);
      
      // Always attempt to update the state
      console.log(`Updating halaqa state for ID ${id}`);
      setHalaqa(fetchedHalaqa);
      
      // Set wird suggestions if they exist
      if (fetchedHalaqa.wirdSuggestions && fetchedHalaqa.wirdSuggestions.length > 0) {
        console.log(`Setting wird suggestions for halaqa ${id}:`, fetchedHalaqa.wirdSuggestions);
        setWirdSuggestions(fetchedHalaqa.wirdSuggestions);
      }
      
    } catch (error) {
      console.error(`Error fetching halaqa ${id}:`, error);
      setError("Failed to load halaqa. Please try again.");
      setHalaqa(null);
    } finally {
      // Clear the timeout
      if (loadingTimeoutRef.current) {
        window.clearTimeout(loadingTimeoutRef.current);
        loadingTimeoutRef.current = null;
      }
      
      console.log(`Finished loading attempt for halaqa ${id}, setting loading state to false`);
      setLoading(false);
      currentlyLoadingId.current = null;
    }
  };
  
  // Generate action items
  const handleGenerateActions = async () => {
    if (!halaqa || !user?.id) return;
    
    setGeneratingActions(true);
    try {
      const updatedHalaqa = await halaqaService.generateActionItems(halaqa.id);
      setHalaqa(updatedHalaqa);
      toast({
        title: "Success!",
        description: "Action items have been generated for this halaqa.",
      });
    } catch (error) {
      console.error("Error generating action items:", error);
      toast({
        title: "Error",
        description: "Failed to generate action items. Please try again.",
        variant: "destructive",
      });
    } finally {
      setGeneratingActions(false);
    }
  };
  
  // Analyze halaqa to generate Wird suggestions
  const handleAnalyzeHalaqa = async () => {
    // Multiple safeguards against infinite loops and unnecessary API calls
    if (analyzingHalaqa || !halaqa || !user?.id) return;
    
    // Make sure we mark analysis as attempted
    hasAttemptedAnalysis.current = true;
    
    // Don't analyze if we already have suggestions
    if (halaqa.wirdSuggestions && halaqa.wirdSuggestions.length > 0) {
      // Just update our state to match what's in the halaqa object
      setWirdSuggestions(halaqa.wirdSuggestions);
      
      // Only show notification to user when triggered manually (not during auto-analysis)
      // We can determine this by checking if we came from the main auto-analysis effect
      // which sets hasAttemptedAnalysis.current
      if (!hasAttemptedAnalysis.current) {
        toast({
          title: "Already analyzed",
          description: "This halaqa has already been analyzed and suggestions generated.",
        });
      }
      hasAttemptedAnalysis.current = true;
      return;
    }
    
    // Flag to prevent multiple simultaneous calls
    setAnalyzingHalaqa(true);
    let retryCount = 0;
    const MAX_RETRIES = 2;
    
    try {
      // Get personalization context if available
      let personalizationContext = null;
      
      try {
        // Check if personalization is enabled and available
        if (personalization && personalization.isPersonalizationEnabled && personalization.isPersonalizationEnabled()) {
          console.log("[HalaqaAnalysis] Personalization is enabled, getting context");
          personalizationContext = personalization.getPersonalizationContext();
          
          if (personalizationContext) {
            console.log("[HalaqaAnalysis] Using personalization data for analysis:", {
              knowledgeLevel: personalizationContext.knowledgeLevel,
              topicsCount: personalizationContext.topicsOfInterest?.length || 0,
              goalsCount: personalizationContext.primaryGoals?.length || 0,
            });
          } else {
            console.log("[HalaqaAnalysis] Personalization is enabled but no data available");
          }
        } else {
          console.log("[HalaqaAnalysis] Personalization is not enabled");
        }
      } catch (personalizationError) {
        console.error("[HalaqaAnalysis] Error getting personalization data:", personalizationError);
      }
      
      // Analyze the halaqa
      while (retryCount <= MAX_RETRIES) {
        try {
          const halaqaService = new HalaqaService();
          
          // Create an abort controller to cancel the request if needed
          const abortController = new AbortController();
          const timeoutId = setTimeout(() => abortController.abort(), 60000); // 60 second timeout
          
          // Call the API with personalization context if available
          const result = await halaqaService.analyzeHalaqaEntry(
            halaqa.id, 
            { 
              signal: abortController.signal,
              personalizationContext
            }
          );
          
          // Clear the timeout
          clearTimeout(timeoutId);
          
          // Update state with the results
          if (result.wirdSuggestions && result.wirdSuggestions.length > 0) {
            setWirdSuggestions(result.wirdSuggestions as any);
            
            // Show success message
            toast({
              title: "Analysis complete",
              description: "Wird suggestions have been generated based on your halaqa reflection.",
            });
            
            // Update the halaqa object with the new suggestions
            setHalaqa({
              ...halaqa,
              wirdSuggestions: result.wirdSuggestions as any
            } as any);
          } else {
            // Show error message
            toast({
              title: "Analysis incomplete",
              description: "Unable to generate wird suggestions. Please try again later.",
              variant: "destructive"
            });
          }
          
          // Break out of the retry loop
          break;
        } catch (error) {
          retryCount++;
          console.error(`[handleAnalyzeHalaqa] Error analyzing halaqa (attempt ${retryCount}/${MAX_RETRIES}):`, error);
          
          if (retryCount > MAX_RETRIES) {
            // Show error message
            toast({
              title: "Analysis failed",
              description: "Unable to analyze halaqa. Please try again later.",
              variant: "destructive"
            });
            break;
          }
          
          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    } catch (error) {
      console.error("[handleAnalyzeHalaqa] Unexpected error:", error);
      
      // Show error message
      toast({
        title: "Analysis failed",
        description: "An unexpected error occurred. Please try again later.",
        variant: "destructive"
      });
    } finally {
      setAnalyzingHalaqa(false);
    }
  };
  
  // Add/remove wird suggestion to/from wird plan
  const handleAddToWirdPlan = async (wirdSuggestion: WirdSuggestion) => {
    if (!user?.id || !halaqa) return;
    
    const isAlreadyAdded = addedWirds.includes(wirdSuggestion.id);
    
    // If already added, remove it
    if (isAlreadyAdded) {
      setAddingToWird(wirdSuggestion.id);
      try {
        // Here you would call your API to remove the wird from the user's plan
        // For now, we'll just update the local state
        // await wirdService.removeFromWirdPlan(user.id, wirdSuggestion.id);
        
        // Update local state
        const newAddedWirds = addedWirds.filter(id => id !== wirdSuggestion.id);
        setAddedWirds(newAddedWirds);
        
        // Save to localStorage
        localStorage.setItem('addedWirds', JSON.stringify(newAddedWirds));
        
        // Store the wird suggestions for reference in the WirdhAI page
        storeWirdSuggestionsInLocalStorage(halaqa.wirdSuggestions || []);
        
        toast({
          title: "Removed",
          description: `Removed "${wirdSuggestion.title}" from your Wird plan.`,
        });
      } catch (error) {
        console.error("Error removing wird suggestion from plan:", error);
        toast({
          title: "Error",
          description: "Failed to remove Wird suggestion from your plan. Please try again.",
          variant: "destructive",
        });
      } finally {
        setAddingToWird(null);
      }
    } else {
      // Add it to the plan
      setAddingToWird(wirdSuggestion.id);
      try {
        // Call wirdService to add the suggestion to the plan with backlink to halaqa
        await wirdService.addToWirdPlan(
          user.id, 
          wirdSuggestion, 
          undefined, // use default date (today)
          'halaqa',  // source type
          halaqa.id  // source id
        );
        
        // Update local state
        const newAddedWirds = [...addedWirds, wirdSuggestion.id];
        setAddedWirds(newAddedWirds);
        
        // Save to localStorage
        localStorage.setItem('addedWirds', JSON.stringify(newAddedWirds));
        
        // Store the wird suggestions for reference in the WirdhAI page
        storeWirdSuggestionsInLocalStorage(halaqa.wirdSuggestions || []);
        
        toast({
          title: "Success!",
          description: `Added "${wirdSuggestion.title}" to your Wird plan. You can find it in the WirdhAI section.`,
        });
      } catch (error) {
        console.error("Error adding wird suggestion to plan:", error);
        toast({
          title: "Error",
          description: "Failed to add Wird suggestion to your plan. Please try again.",
          variant: "destructive",
        });
      } finally {
        setAddingToWird(null);
      }
    }
  };
  
  // Store wird suggestions in localStorage for the WirdhAI page to access
  const storeWirdSuggestionsInLocalStorage = (suggestions: WirdSuggestion[]) => {
    try {
      localStorage.setItem('wirdSuggestions', JSON.stringify(suggestions));
    } catch (e) {
      console.error('Error storing wird suggestions in localStorage:', e);
    }
  };
  
  // Delete halaqa
  const handleDeleteHalaqa = async () => {
    if (!halaqa) return;
    
    try {
      await halaqaService.archiveHalaqa(halaqa.id);
      toast({
        title: "Success!",
        description: "Halaqa note has been deleted.",
      });
      navigate("/halaqa");
    } catch (error) {
      console.error("Error deleting halaqa:", error);
      toast({
        title: "Error",
        description: "Failed to delete halaqa note. Please try again.",
        variant: "destructive",
      });
    } finally {
      setShowDeleteDialog(false);
    }
  };
  
  // Get added wird suggestions to display in the added wirds section
  const getAddedWirdSuggestions = () => {
    if (!halaqa?.wirdSuggestions) return [];
    return halaqa.wirdSuggestions.filter(suggestion => 
      addedWirds.includes(suggestion.id)
    );
  };

  // Navigate to WirdhAI page
  const goToWirdhAI = () => {
    navigate("/wird");
  };
  
  // Add a robust debugger component to help with troubleshooting
  const DebugInfo = () => {
    if (process.env.NODE_ENV === 'production') return null;
    
    return (
      <div className="bg-slate-100 p-4 rounded-md mt-8 text-xs font-mono">
        <h4 className="font-bold mb-2">Debug Info</h4>
        <div>Loading: {loading ? 'true' : 'false'}</div>
        <div>Error: {error || 'none'}</div>
        <div>Halaqa ID: {params?.id || 'none'}</div>
        <div>Currently Loading ID: {currentlyLoadingId.current || 'none'}</div>
        <div>Halaqa Loaded: {halaqa ? 'yes' : 'no'}</div>
        {halaqa && (
          <div className="mt-2">
            <div>Title: {halaqa.title}</div>
            <div>Action Items: {halaqa.actionItems?.length || 0}</div>
            <div>Wird Suggestions: {halaqa.wirdSuggestions?.length || 0}</div>
          </div>
        )}
      </div>
    );
  };

  // Save halaqa edits
  const handleSaveHalaqaEdit = async (values: z.infer<typeof editHalaqaSchema>) => {
    if (!halaqa) return;
    
    try {
      // Create a properly typed HalaqaFormData object
      const updateData = {
        title: values.title || '',
        speaker: values.speaker || '',
        date: values.date || new Date(),
        topic: values.topic,
        keyReflection: values.keyReflection,
        impact: values.impact,
        userId: halaqa.userId,
      };
      
      const updatedHalaqa = await halaqaService.updateHalaqa(halaqa.id, updateData);
      
      setHalaqa(updatedHalaqa);
      setEditMode(false);
      
      toast({
        title: "Success!",
        description: "Halaqa details have been updated.",
      });
    } catch (error) {
      console.error("Error updating halaqa:", error);
      toast({
        title: "Error",
        description: "Failed to update halaqa details. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  // Get personalized insights for this halaqa content
  const getPersonalizedInsights = () => {
    if (!personalizedInsights || personalizedInsights.length === 0) {
      return (
        <div className="mt-6">
          <h3 className="text-lg font-semibold">Personalized Insights</h3>
          <p className="text-muted-foreground mt-2">
            No personalized insights available yet. Click "Analyze with AI" to generate insights.
          </p>
        </div>
      );
    }

    return (
      <div className="mt-6 space-y-6">
        <h3 className="text-xl font-semibold">Personalized Insights</h3>
        <p className="text-sm text-muted-foreground italic">
          These insights are generated specifically from your reflection content, connecting your words with Islamic principles.
        </p>
        
        {personalizedInsights.map((insight) => (
          <div key={insight.id} className="p-4 border rounded-lg bg-slate-50 dark:bg-slate-900">
            <h4 className="text-lg font-medium mb-2">{insight.title}</h4>
            <div className="prose dark:prose-invert max-w-none">
              {insight.content.split('\n\n').map((paragraph, idx) => (
                <p key={idx} className={paragraph.includes('"') ? "italic bg-slate-100 dark:bg-slate-800 p-2 rounded border-l-4 border-primary my-2" : ""}>
                  {paragraph}
                </p>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Fallback for personalized insights when server-generated ones aren't available
  const getFallbackInsights = () => {
    if (!halaqa) return [];
    
    // Safe access to halaqa properties with fallbacks
    const topic = halaqa.topic || 'Islamic Studies';
    const title = halaqa.title || 'Halaqa Reflection';
    const keyReflection = halaqa.keyReflection || '';
    const impact = halaqa.impact || '';
    
    return [
      {
        id: "insight-1",
        title: "Connection to Core Beliefs",
        content: `Your reflection on "${topic}" deeply connects to fundamental Islamic principles of patience, growth, and trust in Allah's plan. 
        
The key reflection you shared: "${keyReflection.substring(0, 100)}${keyReflection.length > 100 ? '...' : ''}" reveals your thoughtful contemplation on matters of faith and spiritual development.

This aligns with the Quranic guidance in Surah Al-Imran (3:190-191) where Allah invites us to reflect on His creation as a means of deepening our faith. Your personal journey in understanding ${topic} represents this essential practice of contemplation (tafakkur) that has been emphasized throughout Islamic tradition.

Consider finding a consistent community space where you can share and develop these reflections with like-minded individuals. Regular attendance at community gatherings can help nurture these reflections further through shared learning and discussion.`
      },
      {
        id: "insight-2",
        title: "Practical Application",
        content: `Based on your reflection about ${topic} and specifically how you noted that "${impact.substring(0, 80)}${impact.length > 80 ? '...' : ''}", consider incorporating the following practices into your daily routine:

1. **Structured Daily Dhikr**: Allocate 10-15 minutes specifically focused on gratitude and awareness, perhaps after Fajr or Maghrib prayer. The Prophet Muhammad ﷺ emphasized consistency in spiritual practices, saying, "The most beloved of deeds to Allah are those that are consistent, even if they are small."

2. **Knowledge Application**: Take one concept from ${title} each day and consciously apply it in your interactions. For example, if patience was discussed, intentionally practice patience in challenging situations throughout your day.

3. **Reflection Journal**: Document how these teachings are transforming your perspective over time. This complements your goal of developing consistent spiritual practices and creates a valuable record of your growth.

Tracking your spiritual journey through regular journaling can help you recognize patterns and measure your progress over time. This is particularly valuable when reviewing past challenges and recognizing how your response has evolved through implementing these teachings.`
      }
    ];
  };

  // Wird suggestions section
  const getWirdSuggestionsSection = () => {
    if (!halaqa || !wirdSuggestions || wirdSuggestions.length === 0) {
      return (
        <div className="mt-8">
          <h3 className="text-lg font-semibold">Personalized Spiritual Practice Suggestions</h3>
          <p className="text-muted-foreground mt-2">
            No suggestions available yet. Click "Analyze with AI" to generate personalized spiritual practices.
          </p>
        </div>
      );
    }

    return (
      <div className="mt-8">
        <h3 className="text-xl font-semibold">Personalized Spiritual Practice Suggestions</h3>
        <p className="text-sm text-muted-foreground italic mb-4">
          These practices are tailored based on your specific reflection, connecting to the themes and concepts you mentioned.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          {wirdSuggestions.map((suggestion) => (
            <div 
              key={suggestion.id} 
              className={`p-4 border rounded-lg shadow-sm ${
                addedWirds.includes(suggestion.id) ? 'bg-primary/10 border-primary' : 'bg-card'
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <h4 className="text-lg font-medium">{suggestion.title}</h4>
                <Badge variant="outline" className="bg-primary/10">
                  {suggestion.type}
                </Badge>
              </div>
              
              <p className="mb-3 text-sm">{suggestion.description}</p>
              
              <div className="flex items-center justify-between text-xs text-muted-foreground mt-2">
                <div className="flex gap-3">
                  <span className="inline-flex items-center">
                    <Clock className="w-3 h-3 mr-1" /> {suggestion.duration}
                  </span>
                  <span className="inline-flex items-center">
                    <Calendar className="w-3 h-3 mr-1" /> {suggestion.frequency}
                  </span>
                </div>
                {addedWirds.includes(suggestion.id) ? (
                  <Button 
                    size="sm" 
                    variant="outline"
                    className="h-8"
                    onClick={() => {
                      toast({
                        title: "Already in your Wird Plan",
                        description: "This suggestion has already been added to your personal Wird Plan"
                      });
                    }}
                  >
                    <span className="flex items-center">
                      <Check className="w-3 h-3 mr-1" /> Added to Plan
                    </span>
                  </Button>
                ) : (
                  <Button 
                    size="sm" 
                    variant="default"
                    className="h-8"
                    onClick={() => handleAddToWirdPlan(suggestion)}
                  >
                    <span className="flex items-center">
                      <Plus className="w-3 h-3 mr-1" /> Add to Wird Plan
                    </span>
                  </Button>
                )}
              </div>
              
              {suggestion.benefit && (
                <div className="mt-3 pt-3 border-t text-sm">
                  <p className="font-medium text-xs text-muted-foreground">Benefit</p>
                  <p className="mt-1">{suggestion.benefit}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Use a robust error display
  if (error) {
    return (
      <Layout title="Error">
        <div className="container py-8">
          <div className="bg-red-50 border border-red-200 rounded-md p-6 mb-6">
            <h2 className="text-2xl font-bold mb-4 text-red-700">Error Loading Halaqa</h2>
            <p className="text-red-600 mb-6">{error}</p>
            <Button onClick={() => {
              setError(null);
              if (params?.id) {
                const halaqaId = parseInt(params.id, 10);
                if (!isNaN(halaqaId)) {
                  fetchHalaqa(halaqaId);
                }
              } else {
                navigate("/halaqa");
              }
            }}>
              Try Again
            </Button>
            <Button variant="outline" className="ml-4" onClick={() => navigate("/halaqa")}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Halaqas
            </Button>
          </div>
          <DebugInfo />
        </div>
      </Layout>
    );
  }
  
  if (loading) {
    return (
      <Layout title="Loading Halaqa">
        <div className="container py-8">
          <div className="text-center mb-8">
            <Spinner size="lg" />
            <p className="mt-4 text-muted-foreground">Loading halaqa entry...</p>
            <p className="text-sm text-muted-foreground mt-2">Loading ID: {params?.id}</p>
          </div>
          <DebugInfo />
        </div>
      </Layout>
    );
  }
  
  // If no halaqa data yet, but not in loading state (something went wrong)
  if (!halaqa && !loading) {
    return (
      <Layout title="Halaqa Not Found">
        <div className="container py-8">
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-6 mb-6">
            <h2 className="text-2xl font-bold mb-4 text-yellow-700">Halaqa Not Found</h2>
            <p className="text-yellow-600 mb-6">Unable to load the requested halaqa. It may have been deleted or you may not have access.</p>
            <Button onClick={() => {
              if (params?.id) {
                const halaqaId = parseInt(params.id, 10);
                if (!isNaN(halaqaId)) {
                  fetchHalaqa(halaqaId);
                }
              } else {
                navigate("/halaqa");
              }
            }}>
              Try Again
            </Button>
            <Button variant="outline" className="ml-4" onClick={() => navigate("/halaqa")}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Halaqas
            </Button>
          </div>
          <DebugInfo />
        </div>
      </Layout>
    );
  }
  
  return (
    <Layout title={halaqa?.title || "Halaqa Details"}>
      <div className="container py-8 px-4">
        <div className="flex justify-between items-center mb-6">
          <Button variant="outline" size="sm" onClick={() => navigate("/halaqa")}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
          
          <div className="flex space-x-2">
            {editMode ? (
              <>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setEditMode(false)}
                >
                  Cancel
                </Button>
                <Button 
                  size="sm" 
                  onClick={editHalaqaForm.handleSubmit(handleSaveHalaqaEdit)}
                >
                  Save Changes
                </Button>
              </>
            ) : (
              <>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setEditMode(true)}
                >
                  <Pencil className="mr-2 h-4 w-4" /> Edit
                </Button>
                <Button 
                  variant="destructive" 
                  size="sm" 
                  onClick={() => setShowDeleteDialog(true)}
                >
                  <Trash2 className="mr-2 h-4 w-4" /> Delete
                </Button>
              </>
            )}
          </div>
        </div>
        
        {/* Halaqa Details Section - First, so users can quickly see their reflection */}
        {editMode ? (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Edit Halaqa Details</CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...editHalaqaForm}>
                <form className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={editHalaqaForm.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Title (Optional)</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={editHalaqaForm.control}
                      name="speaker"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Speaker (Optional)</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={editHalaqaForm.control}
                      name="topic"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Topic</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={editHalaqaForm.control}
                      name="date"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Date</FormLabel>
                          <FormControl>
                            <Input 
                              type="date" 
                              value={field.value instanceof Date ? field.value.toISOString().split('T')[0] : ''} 
                              onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : new Date())}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={editHalaqaForm.control}
                    name="keyReflection"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Key Reflection</FormLabel>
                        <FormControl>
                          <Textarea 
                            {...field} 
                            rows={4}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={editHalaqaForm.control}
                    name="impact"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Impact</FormLabel>
                        <FormControl>
                          <Textarea 
                            {...field} 
                            rows={4}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </form>
              </Form>
            </CardContent>
          </Card>
        ) : (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>{halaqa?.title || "Untitled Halaqa"}</CardTitle>
              <div className="flex flex-wrap gap-2 text-sm text-muted-foreground mt-2">
                {halaqa?.date && (
                  <div className="flex items-center">
                    <Calendar className="mr-1 h-4 w-4" />
                    <span>{halaqa.date instanceof Date ? format(halaqa.date, 'MMMM d, yyyy') : format(new Date(halaqa.date), 'MMMM d, yyyy')}</span>
                  </div>
                )}
                
                {halaqa?.speaker && (
                  <div className="flex items-center">
                    <User className="mr-1 h-4 w-4" />
                    <span>{halaqa.speaker}</span>
                  </div>
                )}
                
                {halaqa?.topic && (
                  <div className="flex items-center">
                    <Tag className="mr-1 h-4 w-4" />
                    <span>{halaqa.topic}</span>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-2">Key Reflection</h3>
                  <p className="text-muted-foreground whitespace-pre-line">{halaqa?.keyReflection}</p>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium mb-2">Impact</h3>
                  <p className="text-muted-foreground whitespace-pre-line">{halaqa?.impact}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* Personalized Insights Section - Second, to provide deeper context on the reflection */}
        <Card className="mb-8">
          <CardHeader className="pb-3">
            <CardTitle>Personalized Insights</CardTitle>
            <CardDescription>
              Insights based on your halaqa reflection and personal context.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {analyzingHalaqa ? (
              <div className="py-8 text-center text-muted-foreground">
                <Spinner className="mx-auto mb-4" />
                <p>Generating personalized insights based on your reflection...</p>
              </div>
            ) : (
              <div className="space-y-4">
                {(personalizedInsights && personalizedInsights.length > 0) ? (
                  // Display server-generated insights
                  personalizedInsights.map((insight) => (
                    <Card key={insight.id} className="border-primary/20">
                      <CardHeader className="pb-3">
                        <div className="flex justify-between items-center">
                          <CardTitle className="text-base flex items-center gap-2">
                            <Star className="h-4 w-4 text-primary" />
                            {insight.title}
                          </CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-3">
                        <p className="text-sm text-muted-foreground whitespace-pre-line">
                          {insight.content}
                        </p>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  // Display fallback insights if no server-generated insights
                  getFallbackInsights().map((insight) => (
                    <Card key={insight.id} className="border-primary/20">
                      <CardHeader className="pb-3">
                        <div className="flex justify-between items-center">
                          <CardTitle className="text-base flex items-center gap-2">
                            <Star className="h-4 w-4 text-primary" />
                            {insight.title}
                          </CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-3">
                        <p className="text-sm text-muted-foreground whitespace-pre-line">
                          {insight.content}
                        </p>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Wird Suggestions Section - Last, to provide actionable next steps */}
        <Card className="mb-8">
          <CardHeader className="pb-3">
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Spiritual Practices & Insights</CardTitle>
                <CardDescription>
                  Personalized spiritual practices based on your halaqa reflections.
                </CardDescription>
              </div>
              {(halaqa?.wirdSuggestions && halaqa.wirdSuggestions.length > 0 && addedWirds.length > 0) && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={goToWirdhAI}
                >
                  <BookOpen className="mr-2 h-4 w-4" />
                  View in WirdhAI
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {analyzingHalaqa ? (
              <div className="py-8 text-center text-muted-foreground">
                <Spinner className="mx-auto mb-4" />
                <p>Generating personalized spiritual practices based on your reflection...</p>
              </div>
            ) : (!halaqa?.wirdSuggestions || halaqa.wirdSuggestions.length === 0) ? (
              <div className="py-8 text-center text-muted-foreground">
                <p>Personalized spiritual practices will appear here shortly.</p>
                <div className="mt-4">
                  <Spinner size="sm" className="mx-auto" />
                </div>
              </div>
            ) : (
              getWirdSuggestionsSection()
            )}
          </CardContent>
        </Card>
        
        {/* Add debug info at the bottom in development */}
        {process.env.NODE_ENV !== 'production' && (
          <DebugInfo />
        )}
      </div>
      
      {/* Delete dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this halaqa entry. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteHalaqa}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
} 