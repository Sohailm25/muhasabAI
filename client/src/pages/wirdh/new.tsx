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

export default function NewWirdhPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [date, setDate] = useState<Date>(new Date());
  const [practices, setPractices] = useState<WirdPractice[]>([]);
  const [recommendations, setRecommendations] = useState<WirdRecommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loadingRecommendations, setLoadingRecommendations] = useState(true);
  
  // Initialize form
  const form = useForm({
    defaultValues: {
      notes: "",
    },
  });
  
  // Fetch recommendations
  useEffect(() => {
    const fetchRecommendations = async () => {
      if (!user?.id) return;
      
      try {
        setLoadingRecommendations(true);
        const fetchedRecommendations = await wirdService.getRecommendations(user.id);
        setRecommendations(fetchedRecommendations);
      } catch (error) {
        console.error("Error fetching recommendations:", error);
        toast({
          title: "Failed to fetch recommendations",
          description: "Please try again later or add practices manually.",
          variant: "destructive",
        });
      } finally {
        setLoadingRecommendations(false);
      }
    };
    
    fetchRecommendations();
  }, [user, toast]);
  
  // Add a new empty practice
  const addPractice = () => {
    setPractices([
      ...practices,
      {
        id: uuidv4(),
        name: "",
        category: "Other",
        target: 1,
        completed: 0,
        unit: "times",
        isCompleted: false,
      },
    ]);
  };
  
  // Add a practice from recommendations
  const addRecommendedPractice = (recommendation: WirdRecommendation) => {
    setPractices([
      ...practices,
      {
        id: uuidv4(),
        name: recommendation.name,
        category: recommendation.category,
        target: recommendation.target,
        completed: 0,
        unit: recommendation.unit,
        isCompleted: false,
      },
    ]);
  };
  
  // Remove a practice
  const removePractice = (id: string) => {
    setPractices(practices.filter(practice => practice.id !== id));
  };
  
  // Update a practice
  const updatePractice = (id: string, updates: Partial<WirdPractice>) => {
    setPractices(
      practices.map(practice => (practice.id === id ? { ...practice, ...updates } : practice))
    );
  };
  
  // Submit form
  const onSubmit = async (formData: { notes: string }) => {
    if (!user?.id) {
      toast({
        title: "Authentication Required",
        description: "You must be logged in to save a wird.",
        variant: "destructive",
      });
      return;
    }
    
    if (practices.length === 0) {
      toast({
        title: "No Practices Added",
        description: "Please add at least one practice to your wird.",
        variant: "destructive",
      });
      return;
    }
    
    // Validate practices
    const invalidPractices = practices.filter(practice => !practice.name.trim());
    if (invalidPractices.length > 0) {
      toast({
        title: "Invalid Practices",
        description: "Please ensure all practices have a name.",
        variant: "destructive",
      });
      return;
    }
    
    setSubmitting(true);
    
    try {
      // Format data for API
      const wirdData: WirdFormData = {
        userId: user.id,
        date: date,
        practices: practices,
        notes: formData.notes,
      };
      
      // Create new wird
      const newWird = await wirdService.createWird(wirdData);
      
      toast({
        title: "Wird Created",
        description: "Your wird has been saved successfully.",
      });
      
      // Navigate to the detail page
      navigate(`/wirdh/${newWird.id}`);
    } catch (error) {
      console.error("Error creating wird:", error);
      toast({
        title: "Failed to Save Wird",
        description: "An error occurred while saving your wird. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };
  
  return (
    <Layout title="New Wirdh Entry">
      <div className="container py-8">
        <div className="flex items-center mb-6">
          <Button variant="outline" size="sm" onClick={() => navigate("/wirdh")} className="mr-2">
            <ArrowLeft className="h-4 w-4 mr-2" /> Back
          </Button>
          <h1 className="text-2xl font-bold">New Wirdh Entry</h1>
        </div>
        
        <div className="grid grid-cols-1 gap-6">
          {/* Date Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Date</CardTitle>
              <CardDescription>Select the date for this wird entry</CardDescription>
            </CardHeader>
            <CardContent>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={(newDate) => newDate && setDate(newDate)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </CardContent>
          </Card>
          
          {/* Practices */}
          <Card>
            <CardHeader>
              <CardTitle>Practices</CardTitle>
              <CardDescription>Add the practices you want to track</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {practices.map((practice, index) => (
                  <div key={practice.id} className="border rounded-md p-4 relative">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 right-2"
                      onClick={() => removePractice(practice.id!)}
                    >
                      <MinusCircle className="h-4 w-4 text-muted-foreground" />
                    </Button>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <FormLabel htmlFor={`practice-${index}-name`}>Practice Name</FormLabel>
                        <Input
                          id={`practice-${index}-name`}
                          value={practice.name}
                          onChange={(e) => updatePractice(practice.id!, { name: e.target.value })}
                          placeholder="e.g., Reading Quran"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <FormLabel htmlFor={`practice-${index}-category`}>Category</FormLabel>
                        <Select
                          value={practice.category}
                          onValueChange={(value) => updatePractice(practice.id!, { category: value })}
                        >
                          <SelectTrigger id={`practice-${index}-category`} className="mt-1">
                            <SelectValue placeholder="Select a category" />
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
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <FormLabel htmlFor={`practice-${index}-target`}>Target</FormLabel>
                        <div className="flex items-center mt-1">
                          <Input
                            id={`practice-${index}-target`}
                            type="number"
                            min="1"
                            value={practice.target}
                            onChange={(e) => 
                              updatePractice(practice.id!, { 
                                target: parseInt(e.target.value) || 1 
                              })
                            }
                            className="w-20 mr-2"
                          />
                          <Select
                            value={practice.unit}
                            onValueChange={(value) => updatePractice(practice.id!, { unit: value })}
                          >
                            <SelectTrigger id={`practice-${index}-unit`} className="flex-1">
                              <SelectValue placeholder="Unit" />
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
                  </div>
                ))}
                
                <Button onClick={addPractice} className="w-full">
                  <Plus className="h-4 w-4 mr-2" /> Add Practice
                </Button>
              </div>
            </CardContent>
          </Card>
          
          {/* Recommendations */}
          <Card>
            <CardHeader>
              <CardTitle>Recommended Practices</CardTitle>
              <CardDescription>Quick-add recommended practices</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingRecommendations ? (
                <div className="flex justify-center py-4">
                  <Spinner size="md" />
                </div>
              ) : recommendations.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {recommendations.map((recommendation) => (
                    <Button
                      key={`${recommendation.name}-${recommendation.category}`}
                      variant="outline"
                      className="justify-start h-auto py-3 px-4"
                      onClick={() => addRecommendedPractice(recommendation)}
                    >
                      <div className="text-left">
                        <div className="font-medium">{recommendation.name}</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {recommendation.target} {recommendation.unit} • {recommendation.category}
                        </div>
                      </div>
                    </Button>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-4">
                  No recommendations available. Use the form above to add practices manually.
                </p>
              )}
            </CardContent>
          </Card>
          
          {/* Notes */}
          <Card>
            <CardHeader>
              <CardTitle>Notes</CardTitle>
              <CardDescription>Add optional notes about your wird plan</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Textarea
                            placeholder="Add any notes or reflections about your wird plan..."
                            className="min-h-[120px]"
                            {...field}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" type="button" onClick={() => navigate("/wirdh")}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={submitting}>
                      {submitting ? (
                        <>
                          <Spinner className="mr-2" size="sm" /> Saving...
                        </>
                      ) : (
                        "Save Wird"
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
} 