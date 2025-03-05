import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/Spinner";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { wirdService, WirdSuggestion } from "@/services/wirdService";
import { WirdEntry } from "@/types";
import { Calendar as CalendarIcon, Plus, ChevronLeft, ChevronRight, CheckCircle2, Circle, Star, Tag, Clock, Repeat } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { format, addDays, startOfDay, endOfDay, parseISO, isToday, isSameDay, subWeeks } from "date-fns";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ProgressBar } from "@/components/ProgressBar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function WirdPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [wirds, setWirds] = useState<WirdEntry[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedWird, setSelectedWird] = useState<WirdEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addedWirds, setAddedWirds] = useState<WirdSuggestion[]>([]);
  const [processingWird, setProcessingWird] = useState<string | null>(null); // Track which wird is being logged
  
  // Load saved wirds from localStorage
  useEffect(() => {
    try {
      // First load the ID list
      const savedAddedWirdIds = localStorage.getItem('addedWirds');
      if (savedAddedWirdIds) {
        const addedWirdIds = JSON.parse(savedAddedWirdIds) as string[];
        
        // Then load the actual wird suggestions
        const savedWirdSuggestions = localStorage.getItem('wirdSuggestions');
        if (savedWirdSuggestions) {
          const allSuggestions = JSON.parse(savedWirdSuggestions) as WirdSuggestion[];
          
          // Filter to only include saved ones
          const savedWirds = allSuggestions.filter(suggestion => 
            addedWirdIds.includes(suggestion.id)
          );
          
          setAddedWirds(savedWirds);
        }
      }
    } catch (e) {
      console.error('Error loading saved wirds from localStorage:', e);
    }
  }, []);
  
  // Fetch wird entries
  useEffect(() => {
    const fetchWirds = async () => {
      if (!user?.id) {
        setError("You must be logged in to view your wird entries");
        setLoading(false);
        return;
      }
      
      try {
        // Get wird entries for the last 30 days
        const today = new Date();
        const startDate = subWeeks(today, 4);
        const endDate = today;
        
        const userWirds = await wirdService.getWirdsByDateRange(user.id, startDate, endDate);
        setWirds(userWirds);
        
        // Check if there's a wird for the selected date
        const wirdForSelectedDate = userWirds.find(wird => 
          isSameDay(new Date(wird.date), selectedDate)
        );
        
        setSelectedWird(wirdForSelectedDate || null);
      } catch (error) {
        console.error("Error fetching wird entries:", error);
        setError("Failed to load wird entries. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    
    fetchWirds();
  }, [user, selectedDate]);
  
  // Handle date selection
  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
    }
  };
  
  // Calculate wird completion percentage
  const calculateCompletionPercentage = (wird: WirdEntry) => {
    if (!wird.practices || wird.practices.length === 0) {
      return 0;
    }
    
    const completedCount = wird.practices.filter(practice => practice.isCompleted).length;
    return Math.round((completedCount / wird.practices.length) * 100);
  };
  
  // Handle create new wird
  const handleCreateNew = () => {
    navigate("/wird/new");
  };
  
  // Handle viewing wird details
  const handleViewWird = (id: number) => {
    navigate(`/wird/${id}`);
  };
  
  // Generate dates for the date selector
  const generateDates = () => {
    const dates = [];
    const today = new Date();
    
    // Add 6 days before today and today (7 days total)
    for (let i = 6; i >= 0; i--) {
      const date = addDays(today, -i);
      dates.push(date);
    }
    
    return dates;
  };
  
  // Date helpers
  const dateLabels = {
    today: "Today",
    yesterday: "Yesterday"
  };
  
  const formatDateLabel = (date: Date) => {
    const now = new Date();
    
    if (isToday(date)) {
      return dateLabels.today;
    }
    
    if (isSameDay(date, addDays(now, -1))) {
      return dateLabels.yesterday;
    }
    
    return format(date, "EEE, MMM d");
  };
  
  // Handle logging a wird suggestion for today
  const handleLogWirdForToday = async (suggestion: WirdSuggestion) => {
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
      console.log("Sending wird suggestion:", preparedSuggestion);
      
      // === DIRECT API CALL INSTEAD OF USING SERVICE ===
      // This bypasses any potential issues in the wirdService implementation
      const today = new Date();
      const dateString = today.toISOString().split('T')[0];
      
      // Make direct fetch request to the API
      const response = await fetch('/api/wirds/add-suggestion', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          wirdSuggestion: preparedSuggestion,
          date: dateString
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("Error response:", errorData);
        throw new Error(errorData.error || `Server error: ${response.status}`);
      }
      
      const data = await response.json();
      console.log("API response:", data);
      
      if (!data.success) {
        throw new Error(data.error || "Failed to add to today's wird");
      }
      
      // Success! Now refresh the wird entries
      const startDate = subWeeks(today, 4);
      const endDate = today;
      
      const userWirds = await wirdService.getWirdsByDateRange(user.id, startDate, endDate);
      setWirds(userWirds);
      
      // Update selected wird if it's for today
      const wirdForToday = userWirds.find(wird => 
        isSameDay(new Date(wird.date), new Date())
      );
      
      if (isSameDay(selectedDate, new Date()) && wirdForToday) {
        setSelectedWird(wirdForToday);
      }
      
      toast({
        title: "Added to Today's Wird",
        description: `"${preparedSuggestion.name}" has been added to your Wird for today.`,
      });
    } catch (error) {
      console.error("Error logging wird for today:", error);
      
      let errorMessage = "Failed to add this practice to today's wird. Please try again.";
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setProcessingWird(null);
    }
  };
  
  // Handle updating a practice's completion status
  const handleUpdatePractice = async (wirdId: number, practice: any) => {
    try {
      // Create a temporary optimistic update
      const optimisticIsCompleted = !practice.isCompleted;
      const optimisticCompleted = optimisticIsCompleted ? practice.target : 0;

      // Update UI immediately (optimistic update)
      const optimisticWird = {
        ...selectedWird!,
        practices: selectedWird!.practices.map(p => 
          p.id === practice.id 
            ? { ...p, isCompleted: optimisticIsCompleted, completed: optimisticCompleted } 
            : p
        )
      };
      setSelectedWird(optimisticWird);
      
      // Toggle completion status for API call
      const isCompleted = !practice.isCompleted;
      const completed = isCompleted ? practice.target : 0;
      
      const updatedWird = await wirdService.updatePractice(
        wirdId,
        practice.id,
        { completed, isCompleted }
      );
      
      // Update the selected wird and the wirds list with server response
      setSelectedWird(updatedWird);
      setWirds(prevWirds => 
        prevWirds.map(wird => 
          wird.id === updatedWird.id ? updatedWird : wird
        )
      );
      
      toast({
        title: isCompleted ? "Practice Completed" : "Practice Uncompleted",
        description: `"${practice.name}" has been marked as ${isCompleted ? 'completed' : 'not completed'}.`,
        duration: 2000,
      });
    } catch (error) {
      console.error("Error updating practice:", error);
      
      // Revert the optimistic update if there's an error
      if (selectedWird) {
        const originalWird = wirds.find(w => w.id === selectedWird.id);
        if (originalWird) {
          setSelectedWird(originalWird);
        }
      }
      
      toast({
        title: "Error",
        description: "Failed to update practice. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  if (loading) {
    return (
      <Layout title="WirdhAI">
        <div className="container flex items-center justify-center min-h-[60vh]">
          <Spinner size="lg" />
        </div>
      </Layout>
    );
  }
  
  if (error && !user?.id) {
    return (
      <Layout title="WirdhAI">
        <div className="container py-8">
          <Card className="w-full">
            <CardHeader>
              <CardTitle>Authentication Required</CardTitle>
              <CardDescription>{error}</CardDescription>
            </CardHeader>
            <CardFooter>
              <Button onClick={() => navigate("/login")}>
                Login
              </Button>
            </CardFooter>
          </Card>
        </div>
      </Layout>
    );
  }
  
  return (
    <Layout title="WirdhAI">
      <div className="container py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">WirdhAI</h1>
          <Button onClick={() => navigate("/wird/new")}>
            <Plus className="mr-2 h-4 w-4" />
            New Wird Entry
          </Button>
        </div>
        
        {/* Helpful intro for new users */}
        <Card className="mb-6 bg-muted/50">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4 items-start">
              <div className="bg-primary/10 p-3 rounded-full">
                <Star className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-medium mb-1">Welcome to WirdhAI</h3>
                <p className="text-muted-foreground mb-2">
                  WirdhAI helps you track your daily spiritual practices and devotional activities. 
                  Use the "Daily Tracking" tab to log your wirds for today, and the "Saved Wirds" tab 
                  to quickly add practices you've saved from halaqa reflections.
                </p>
                <div className="text-sm text-muted-foreground flex gap-x-4 flex-wrap">
                  <span className="flex items-center">
                    <Plus className="mr-1 h-3 w-3" /> Add a new wird
                  </span>
                  <span className="flex items-center">
                    <CheckCircle2 className="mr-1 h-3 w-3" /> Mark practices as complete
                  </span>
                  <span className="flex items-center">
                    <CalendarIcon className="mr-1 h-3 w-3" /> Track daily progress
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Tabs defaultValue="daily-tracking" className="mb-8">
          <TabsList className="mb-4">
            <TabsTrigger value="daily-tracking">Daily Tracking</TabsTrigger>
            <TabsTrigger value="saved-wirds">Saved Wirds</TabsTrigger>
          </TabsList>
          
          <TabsContent value="daily-tracking">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1">
                <Card>
                  <CardHeader>
                    <CardTitle>Date Selection</CardTitle>
                    <CardDescription>Choose a date to view or track wird practices</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between items-center mb-4">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setSelectedDate(prev => addDays(prev, -1))}
                      >
                        <ChevronLeft className="h-4 w-4" />
                        Previous
                      </Button>
                      
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" size="sm">
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {format(selectedDate, "MMMM d, yyyy")}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={selectedDate}
                            onSelect={handleDateSelect}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setSelectedDate(prev => addDays(prev, 1))}
                      >
                        Next
                        <ChevronRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                    
                    <div className="space-y-2">
                      {wirds.length === 0 ? (
                        <div className="text-center p-4 text-muted-foreground text-sm">
                          <p>You haven't created any wird entries yet.</p>
                          <Button 
                            variant="link" 
                            size="sm" 
                            onClick={() => navigate("/wird/new")}
                            className="mt-2"
                          >
                            Create your first entry
                          </Button>
                        </div>
                      ) : (
                        wirds.map(wird => (
                          <Button
                            key={wird.id}
                            variant={isSameDay(new Date(wird.date), selectedDate) ? "default" : "outline"}
                            className="w-full justify-start"
                            onClick={() => setSelectedDate(new Date(wird.date))}
                          >
                            <div className="flex items-center w-full">
                              <div className="mr-2">
                                {isSameDay(new Date(wird.date), new Date()) ? (
                                  <div className="h-2 w-2 rounded-full bg-primary mr-1" />
                                ) : null}
                              </div>
                              <span>{format(new Date(wird.date), "MMMM d, yyyy")}</span>
                              <span className="ml-auto">
                                {`${calculateCompletionPercentage(wird)}%`}
                              </span>
                            </div>
                          </Button>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle>
                      {isToday(selectedDate) ? "Today's Wird" : `Wird for ${format(selectedDate, "MMMM d, yyyy")}`}
                    </CardTitle>
                    <CardDescription>
                      Track your daily spiritual practices
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {selectedWird ? (
                      <div className="space-y-4">
                        <ProgressBar
                          value={calculateCompletionPercentage(selectedWird)}
                          className="mb-6"
                        />
                        
                        {selectedWird.practices.map(practice => (
                          <div 
                            key={practice.id} 
                            className={cn(
                              "flex items-center justify-between p-4 border rounded-lg transition-all duration-200",
                              practice.isCompleted && "bg-primary/10 border-primary/30"
                            )}
                          >
                            <div>
                              <div className="font-medium">{practice.name}</div>
                              <div className="text-sm text-muted-foreground">{`${practice.target} ${practice.unit}`}</div>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <div className="text-sm font-medium">{`${practice.completed}/${practice.target}`}</div>
                              <Button
                                variant={practice.isCompleted ? "default" : "outline"}
                                size="sm"
                                disabled={!isToday(selectedDate)}
                                onClick={() => handleUpdatePractice(selectedWird.id, practice)}
                                className="min-w-[40px] transition-all"
                              >
                                {practice.isCompleted ? (
                                  <CheckCircle2 className="h-4 w-4" />
                                ) : (
                                  <Circle className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="py-8 text-center">
                        <p className="text-muted-foreground mb-4">No wird entry found for this date.</p>
                        
                        {isToday(selectedDate) && (
                          <div className="space-y-3">
                            <Button onClick={() => navigate("/wird/new")}>
                              <Plus className="mr-2 h-4 w-4" />
                              Create Entry for Today
                            </Button>
                            
                            {addedWirds.length > 0 && (
                              <div>
                                <p className="text-sm text-muted-foreground mt-4 mb-2">
                                  Or quickly add one of your saved practices:
                                </p>
                                <div className="flex flex-wrap gap-2 justify-center">
                                  {addedWirds.slice(0, 3).map(suggestion => (
                                    <Button 
                                      key={suggestion.id} 
                                      variant="outline" 
                                      size="sm"
                                      onClick={() => handleLogWirdForToday(suggestion)}
                                      disabled={processingWird === suggestion.id}
                                    >
                                      {processingWird === suggestion.id ? (
                                        <Spinner className="mr-2" size="sm" />
                                      ) : (
                                        <Plus className="mr-2 h-4 w-4" />
                                      )}
                                      {suggestion.title || suggestion.name}
                                    </Button>
                                  ))}
                                  {addedWirds.length > 3 && (
                                    <Button 
                                      variant="outline" 
                                      size="sm"
                                      onClick={() => document.querySelector('[value="saved-wirds"]')?.dispatchEvent(new MouseEvent('click'))}
                                    >
                                      <ChevronRight className="mr-2 h-4 w-4" />
                                      View All
                                    </Button>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="saved-wirds">
            <Card>
              <CardHeader>
                <CardTitle>Saved Spiritual Practices</CardTitle>
                <CardDescription>
                  Practices you've saved from halaqa reflections. Add them to today's wird for tracking.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {addedWirds.length === 0 ? (
                  <div className="py-8 text-center">
                    <div className="mx-auto bg-muted/50 rounded-full w-12 h-12 flex items-center justify-center mb-4">
                      <Star className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <p className="text-muted-foreground mb-4">You haven't saved any practices yet.</p>
                    <Button 
                      variant="outline" 
                      onClick={() => navigate("/halaqa")}
                    >
                      Browse Halaqa Entries
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {addedWirds.map((suggestion) => (
                      <Card key={suggestion.id} className={cn(
                        "overflow-hidden transition-all hover:shadow-md",
                        processingWird === suggestion.id && "border-primary"
                      )}>
                        <CardHeader className="bg-muted/50 pb-3">
                          <div className="flex justify-between items-center">
                            <CardTitle className="text-base flex items-center gap-2">
                              <Star className="h-4 w-4 text-primary" />
                              {suggestion.title || suggestion.name}
                            </CardTitle>
                            <Button
                              size="sm"
                              variant={processingWird === suggestion.id ? "secondary" : "default"}
                              onClick={() => handleLogWirdForToday(suggestion)}
                              disabled={processingWird === suggestion.id}
                              className="transition-all"
                            >
                              {processingWird === suggestion.id ? (
                                <>
                                  <Spinner className="mr-2" size="sm" />
                                  Adding...
                                </>
                              ) : (
                                <>
                                  <Plus className="mr-2 h-4 w-4" />
                                  Log for Today
                                </>
                              )}
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-3">
                          <p className="text-sm text-muted-foreground mb-3">
                            {suggestion.description}
                          </p>
                          <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted-foreground mt-3">
                            <div className="flex items-center">
                              <Tag className="mr-1 h-3 w-3" />
                              <span>{suggestion.type || suggestion.category}</span>
                            </div>
                            {suggestion.duration && (
                              <div className="flex items-center">
                                <Clock className="mr-1 h-3 w-3" />
                                <span>{suggestion.duration}</span>
                              </div>
                            )}
                            {suggestion.frequency && (
                              <div className="flex items-center">
                                <Repeat className="mr-1 h-3 w-3" />
                                <span>{suggestion.frequency}</span>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
} 