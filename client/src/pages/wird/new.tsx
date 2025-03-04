import { useState, useEffect } from "react";
import { useLocation, useRoute } from "wouter";
import { useForm } from "react-hook-form";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CalendarIcon, Trash2, Plus, ArrowLeft, MinusCircle } from "lucide-react";
import { format, isValid, parse, parseISO } from "date-fns";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { v4 as uuidv4 } from "uuid";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Spinner } from "@/components/Spinner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { wirdService } from "@/services/wirdService";
import { WirdFormData, WirdRecommendation, WirdPractice } from "@/types";

// Recommended practices categories and units
const categories = [
  "Quran",
  "Dhikr",
  "Dua",
  "Prayer",
  "Fasting",
  "Learning",
  "Charity",
  "Other"
];

const units = [
  "pages",
  "verses",
  "times",
  "minutes",
  "hours",
  "rakat",
  "days"
];

export default function NewWirdPage() {
  const [, params] = useRoute<{ date?: string }>("/wird/new");
  const [searchParams] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const [, navigate] = useLocation();
  
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [submitting, setSubmitting] = useState(false);
  const [practices, setPractices] = useState<WirdPractice[]>([]);
  const [recommendations, setRecommendations] = useState<WirdRecommendation[]>([]);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);
  
  // Parse date from URL if available
  useEffect(() => {
    const urlDate = new URLSearchParams(searchParams).get("date");
    if (urlDate) {
      const parsedDate = parseISO(urlDate);
      if (isValid(parsedDate)) {
        setSelectedDate(parsedDate);
      }
    }
  }, [searchParams]);
  
  // Load recommendations
  useEffect(() => {
    const fetchRecommendations = async () => {
      if (!user?.id) return;
      
      setLoadingRecommendations(true);
      try {
        const data = await wirdService.getRecommendations(user.id);
        setRecommendations(data);
      } catch (error) {
        console.error("Error loading recommendations:", error);
        toast({
          title: "Error",
          description: "Failed to load practice recommendations",
          variant: "destructive"
        });
      } finally {
        setLoadingRecommendations(false);
      }
    };
    
    fetchRecommendations();
  }, [user, toast]);
  
  // Form for notes
  const form = useForm({
    defaultValues: {
      notes: "",
    },
  });
  
  // Add a new practice
  const addPractice = () => {
    const newPractice: WirdPractice = {
      id: uuidv4(),
      name: "",
      category: "Other",
      target: 1,
      completed: 0,
      unit: "times",
      isCompleted: false,
    };
    
    setPractices([...practices, newPractice]);
  };
  
  // Add a recommended practice
  const addRecommendedPractice = (recommendation: WirdRecommendation) => {
    const newPractice: WirdPractice = {
      id: uuidv4(),
      name: recommendation.name,
      category: recommendation.category,
      target: recommendation.target,
      completed: 0,
      unit: recommendation.unit,
      isCompleted: false,
    };
    
    setPractices([...practices, newPractice]);
  };
  
  // Remove a practice
  const removePractice = (id: string) => {
    setPractices(practices.filter(practice => practice.id !== id));
  };
  
  // Update a practice
  const updatePractice = (id: string, updates: Partial<WirdPractice>) => {
    setPractices(practices.map(practice => 
      practice.id === id ? { ...practice, ...updates } : practice
    ));
  };
  
  // Handle form submission
  const onSubmit = async (formData: { notes: string }) => {
    if (!user?.id) {
      toast({
        title: "Error",
        description: "You must be logged in to create a wird entry",
        variant: "destructive",
      });
      return;
    }
    
    if (practices.length === 0) {
      toast({
        title: "Error",
        description: "Please add at least one practice",
        variant: "destructive",
      });
      return;
    }
    
    setSubmitting(true);
    
    try {
      // Validate practices data
      const validPractices = practices.map(practice => {
        // Ensure name is not empty
        if (!practice.name.trim()) {
          throw new Error("Practice name cannot be empty");
        }
        
        // Ensure target is positive
        if (practice.target <= 0) {
          throw new Error(`Target for '${practice.name}' must be greater than 0`);
        }
        
        // Ensure completed is non-negative and not greater than target
        if (practice.completed < 0) {
          throw new Error(`Completed amount for '${practice.name}' cannot be negative`);
        }
        
        if (practice.completed > practice.target) {
          throw new Error(`Completed amount for '${practice.name}' cannot exceed target`);
        }
        
        return {
          ...practice,
          // Update isCompleted based on completed value
          isCompleted: practice.completed >= practice.target,
        };
      });
      
      // Prepare form data
      const wirdData: WirdFormData = {
        userId: user.id,
        date: selectedDate,
        practices: validPractices,
        notes: formData.notes,
      };
      
      // Submit to API
      const result = await wirdService.createWird(wirdData);
      
      // Show success message
      toast({
        title: "Success",
        description: "Your wird entry has been saved",
      });
      
      // Navigate to the details page
      navigate(`/wird/${result.id}`);
    } catch (error) {
      console.error("Error submitting wird entry:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save wird entry",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };
  
  return (
    <Layout title="New Wird Entry">
      <div className="container max-w-3xl py-8 px-4">
        <Card>
          <CardHeader>
            <div className="flex items-center mb-2">
              <Button variant="ghost" size="sm" onClick={() => navigate("/wird")} className="mr-2">
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <CardTitle>New Wird Entry</CardTitle>
            </div>
            <CardDescription>
              Track your daily Islamic practices (wird/awrad)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Date Selector */}
              <div className="flex flex-col space-y-2">
                <label className="text-sm font-medium">Date</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !selectedDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={(date) => date && setSelectedDate(date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              {/* Practices */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">Your Practices</h3>
                  <Button variant="outline" size="sm" onClick={addPractice}>
                    <Plus className="mr-2 h-4 w-4" /> Add Practice
                  </Button>
                </div>
                
                {practices.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center border border-dashed rounded-lg">
                    <p className="text-muted-foreground mb-4">
                      No practices added yet. Add your own or choose from recommendations below.
                    </p>
                    <Button onClick={addPractice}>
                      <Plus className="mr-2 h-4 w-4" /> Add Practice
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {practices.map((practice, index) => (
                      <div key={practice.id} className="flex flex-col space-y-3 p-4 border rounded-lg">
                        <div className="flex justify-between">
                          <h4 className="font-medium">Practice {index + 1}</h4>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => removePractice(practice.id!)}
                            className="h-8 w-8 p-0"
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {/* Practice Name */}
                          <div className="space-y-1">
                            <label className="text-sm font-medium">Name</label>
                            <Input 
                              value={practice.name} 
                              onChange={(e) => updatePractice(practice.id!, { name: e.target.value })}
                              placeholder="e.g., Morning Adhkar"
                            />
                          </div>
                          
                          {/* Category */}
                          <div className="space-y-1">
                            <label className="text-sm font-medium">Category</label>
                            <Select 
                              value={practice.category}
                              onValueChange={(value) => updatePractice(practice.id!, { category: value })}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select category" />
                              </SelectTrigger>
                              <SelectContent>
                                {categories.map((category) => (
                                  <SelectItem key={category} value={category}>
                                    {category}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-3">
                          {/* Target */}
                          <div className="space-y-1">
                            <label className="text-sm font-medium">Target</label>
                            <Input 
                              type="number" 
                              min="1"
                              value={practice.target} 
                              onChange={(e) => updatePractice(practice.id!, { 
                                target: parseInt(e.target.value) || 1 
                              })}
                            />
                          </div>
                          
                          {/* Completed */}
                          <div className="space-y-1">
                            <label className="text-sm font-medium">Completed</label>
                            <Input 
                              type="number"
                              min="0"
                              max={practice.target}
                              value={practice.completed} 
                              onChange={(e) => {
                                const completed = parseInt(e.target.value) || 0;
                                updatePractice(practice.id!, { 
                                  completed,
                                  isCompleted: completed >= practice.target
                                });
                              }}
                            />
                          </div>
                          
                          {/* Unit */}
                          <div className="space-y-1">
                            <label className="text-sm font-medium">Unit</label>
                            <Select 
                              value={practice.unit}
                              onValueChange={(value) => updatePractice(practice.id!, { unit: value })}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select unit" />
                              </SelectTrigger>
                              <SelectContent>
                                {units.map((unit) => (
                                  <SelectItem key={unit} value={unit}>
                                    {unit}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              {/* Recommendations */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Recommended Practices</h3>
                
                {loadingRecommendations ? (
                  <div className="flex justify-center py-6">
                    <Spinner size="md" />
                  </div>
                ) : recommendations.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {recommendations.map((recommendation) => (
                      <div key={recommendation.name} className="border rounded-lg p-3 hover:border-primary transition-colors">
                        <div className="flex justify-between">
                          <h4 className="font-medium">{recommendation.name}</h4>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => addRecommendedPractice(recommendation)}
                            className="h-6 w-6 p-0"
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {recommendation.category} · {recommendation.target} {recommendation.unit}
                        </p>
                        <p className="text-sm mt-2">{recommendation.description}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No recommendations available.</p>
                )}
              </div>
              
              {/* Notes */}
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notes (Optional)</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Add any additional notes or reflections..." 
                            className="min-h-24"
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>
                          Add any thoughts or reflections about your practices today.
                        </FormDescription>
                      </FormItem>
                    )}
                  />
                  
                  <div className="flex justify-end space-x-3">
                    <Button 
                      variant="outline" 
                      type="button" 
                      onClick={() => navigate("/wird")}
                    >
                      Cancel
                    </Button>
                    
                    <Button type="submit" disabled={submitting || practices.length === 0}>
                      {submitting ? <Spinner size="sm" className="mr-2" /> : null}
                      Save Wird Entry
                    </Button>
                  </div>
                </form>
              </Form>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
} 