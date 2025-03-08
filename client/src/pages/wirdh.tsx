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
import { 
  Calendar as CalendarIcon, 
  Plus, 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle2, 
  Circle, 
  Star, 
  Tag, 
  Clock, 
  Repeat,
  ArrowRight,
  Link,
  BookOpen
} from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { 
  format, 
  addDays, 
  startOfDay, 
  endOfDay, 
  parseISO, 
  isToday, 
  isSameDay, 
  subWeeks,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth
} from "date-fns";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ProgressBar } from "@/components/ProgressBar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export default function WirdhPage() {
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
  const [calendarView, setCalendarView] = useState<'day' | 'week' | 'month'>('day');
  const [weekDates, setWeekDates] = useState<Date[]>([]);
  
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
  
  // Generate week dates when selected date changes
  useEffect(() => {
    const start = startOfWeek(selectedDate);
    const end = endOfWeek(selectedDate);
    const days = eachDayOfInterval({ start, end });
    setWeekDates(days);
  }, [selectedDate]);
  
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
  
  // Calculate completion percentage for a wird entry
  const calculateCompletionPercentage = (wird: WirdEntry) => {
    if (!wird.practices || wird.practices.length === 0) return 0;
    
    const completedPractices = wird.practices.filter(practice => practice.isCompleted).length;
    return Math.round((completedPractices / wird.practices.length) * 100);
  };
  
  // Navigate to create new wird page
  const handleCreateNew = () => {
    navigate("/wirdh/new");
  };
  
  // Navigate to wird detail page
  const handleViewWird = (id: number) => {
    navigate(`/wirdh/${id}`);
  };
  
  // Format date for display
  const formatDateLabel = (date: Date) => {
    if (isToday(date)) {
      return "Today";
    }
    return format(date, "EEEE, MMMM d");
  };
  
  // Handle logging a wird suggestion for today
  const handleLogWirdForToday = async (suggestion: WirdSuggestion) => {
    if (!user?.id) {
      toast({
        title: "Authentication Required",
        description: "You must be logged in to track wirds.",
        variant: "destructive",
      });
      return;
    }
    
    // Set processing state
    setProcessingWird(suggestion.id);
    
    try {
      // Check if there's already a wird for today
      const today = new Date();
      let todayWird = wirds.find(wird => isSameDay(new Date(wird.date), today));
      
      if (todayWird) {
        // Add this practice to today's wird if it doesn't already exist
        const practiceExists = todayWird.practices.some(
          practice => practice.name.toLowerCase() === suggestion.name.toLowerCase()
        );
        
        if (practiceExists) {
          toast({
            title: "Practice Already Added",
            description: `"${suggestion.name}" is already in today's wird.`,
            duration: 3000,
          });
          return;
        }
        
        // Add the new practice
        const newPractice = {
          id: crypto.randomUUID(),
          name: suggestion.name,
          category: suggestion.category || "Other",
          target: suggestion.target || 1,
          completed: 0,
          unit: suggestion.unit || "times",
          isCompleted: false
        };
        
        // Update the wird with the new practice
        const updatedWird = await wirdService.updateWird(todayWird.id, {
          userId: user.id,
          date: today,
          practices: [...todayWird.practices, newPractice]
        });
        
        // Update state
        setWirds(prevWirds => 
          prevWirds.map(wird => wird.id === updatedWird.id ? updatedWird : wird)
        );
        
        if (isSameDay(selectedDate, today)) {
          setSelectedWird(updatedWird);
        }
        
        toast({
          title: "Practice Added",
          description: `"${suggestion.name}" has been added to today's wird.`,
          duration: 3000,
        });
      } else {
        // Create a new wird for today with this practice
        const newPractice = {
          id: crypto.randomUUID(),
          name: suggestion.name,
          category: suggestion.category || "Other",
          target: suggestion.target || 1,
          completed: 0,
          unit: suggestion.unit || "times",
          isCompleted: false
        };
        
        const newWird = await wirdService.createWird({
          userId: user.id,
          date: today,
          practices: [newPractice],
          notes: ""
        });
        
        // Update state
        setWirds(prevWirds => [...prevWirds, newWird]);
        
        if (isSameDay(selectedDate, today)) {
          setSelectedWird(newWird);
        }
        
        toast({
          title: "New Wird Created",
          description: `Created a new wird for today with "${suggestion.name}".`,
          duration: 3000,
        });
      }
    } catch (error) {
      console.error("Error logging wird:", error);
      
      let errorMessage = "Failed to log wird. Please try again.";
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
          <Button onClick={handleCreateNew}>
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
                    {/* Improved date selection with view options */}
                    <div className="mb-4">
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
                            <Button variant="outline" className="min-w-[180px] justify-center">
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {format(selectedDate, "MMMM d, yyyy")}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="center">
                            <Calendar
                              mode="single"
                              selected={selectedDate}
                              onSelect={handleDateSelect}
                              initialFocus
                              className="rounded-md border"
                              modifiers={{
                                hasWird: wirds.map(wird => new Date(wird.date))
                              }}
                              modifiersClassNames={{
                                hasWird: "bg-primary/20 font-bold"
                              }}
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
                      
                      {/* Week view for quick navigation */}
                      <div className="grid grid-cols-7 gap-1 mt-4">
                        {weekDates.map((date, index) => {
                          const hasWird = wirds.some(wird => isSameDay(new Date(wird.date), date));
                          const isSelected = isSameDay(date, selectedDate);
                          
                          return (
                            <Button
                              key={index}
                              variant={isSelected ? "default" : "outline"}
                              size="sm"
                              className={cn(
                                "h-10 p-0 flex flex-col items-center justify-center",
                                hasWird && !isSelected && "bg-primary/10 border-primary/30",
                                !isSameMonth(date, selectedDate) && "text-muted-foreground opacity-50"
                              )}
                              onClick={() => setSelectedDate(date)}
                            >
                              <span className="text-[10px] font-medium">{format(date, "EEE")}</span>
                              <span className="text-sm">{format(date, "d")}</span>
                            </Button>
                          );
                        })}
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      {wirds.length === 0 ? (
                        <div className="text-center p-4 text-muted-foreground text-sm">
                          <p>You haven't created any wird entries yet.</p>
                        </div>
                      ) : (
                        <div className="text-sm text-muted-foreground">
                          <p>Select a date to view or edit wird entries.</p>
                          <p className="mt-1">
                            {wirds.length} wird {wirds.length === 1 ? 'entry' : 'entries'} in the last 30 days.
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle>{formatDateLabel(selectedDate)}</CardTitle>
                    <CardDescription>
                      {selectedWird 
                        ? `${selectedWird.practices.length} practices tracked` 
                        : "No wird entry for this date"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {selectedWird ? (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <span className="text-sm font-medium">Completion</span>
                            <ProgressBar 
                              value={calculateCompletionPercentage(selectedWird)} 
                              className="w-32 h-2 mt-1" 
                            />
                          </div>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleViewWird(selectedWird.id)}
                          >
                            View Details
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </Button>
                        </div>
                        
                        <div className="space-y-3">
                          {selectedWird.practices.map((practice) => (
                            <div 
                              key={practice.id} 
                              className={cn(
                                "flex items-center justify-between p-3 rounded-md border",
                                practice.isCompleted ? "bg-primary/5 border-primary/20" : "bg-card"
                              )}
                            >
                              <div className="flex items-center gap-3">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className={cn(
                                    "h-8 w-8 rounded-full",
                                    practice.isCompleted && "text-primary"
                                  )}
                                  onClick={() => handleUpdatePractice(selectedWird.id, practice)}
                                >
                                  {practice.isCompleted ? (
                                    <CheckCircle2 className="h-5 w-5" />
                                  ) : (
                                    <Circle className="h-5 w-5" />
                                  )}
                                </Button>
                                <div>
                                  <div className="font-medium">{practice.name}</div>
                                  <div className="text-xs text-muted-foreground">
                                    {practice.target} {practice.unit}
                                    {practice.category && (
                                      <Badge variant="outline" className="ml-2 text-[10px] py-0 h-4">
                                        {practice.category}
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              </div>
                              
                              {practice.isCompleted && (
                                <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                                  Completed
                                </Badge>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : isToday(selectedDate) ? (
                      <div className="text-center py-6">
                        <div className="mb-4">
                          <div className="bg-muted inline-flex p-3 rounded-full">
                            <Plus className="h-6 w-6 text-muted-foreground" />
                          </div>
                          <h3 className="mt-2 font-medium">No wird entry for today</h3>
                          <p className="text-sm text-muted-foreground mt-1">
                            Start tracking your spiritual practices for today
                          </p>
                        </div>
                        <Button onClick={handleCreateNew}>
                          Create New Wird Entry
                        </Button>
                      </div>
                    ) : (
                      <div className="text-center py-6">
                        <div className="mb-4">
                          <div className="bg-muted inline-flex p-3 rounded-full">
                            <CalendarIcon className="h-6 w-6 text-muted-foreground" />
                          </div>
                          <h3 className="mt-2 font-medium">No wird entry for this date</h3>
                          <p className="text-sm text-muted-foreground mt-1">
                            You haven't tracked any practices for {format(selectedDate, "MMMM d, yyyy")}
                          </p>
                        </div>
                        <Button onClick={handleCreateNew}>
                          Create New Wird Entry
                        </Button>
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
                <CardTitle>Saved Wirds</CardTitle>
                <CardDescription>
                  Quickly add saved wird practices to today's tracking
                </CardDescription>
              </CardHeader>
              <CardContent>
                {addedWirds.length > 0 ? (
                  <div className="space-y-3">
                    {addedWirds.map((wird) => (
                      <div 
                        key={wird.id}
                        className="flex items-center justify-between p-3 rounded-md border"
                      >
                        <div>
                          <div className="font-medium flex items-center">
                            {wird.name}
                            {wird.type === 'reflection' && (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-6 w-6 ml-1">
                                      <Link className="h-3 w-3" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>From reflection</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}
                            {wird.type === 'halaqa' && (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-6 w-6 ml-1">
                                      <Link className="h-3 w-3" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>From halaqa</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground flex items-center gap-2">
                            <span>{wird.target} {wird.unit || 'times'}</span>
                            {wird.category && (
                              <Badge variant="outline" className="text-[10px] py-0 h-4">
                                {wird.category}
                              </Badge>
                            )}
                            {wird.frequency && (
                              <span className="flex items-center">
                                <Repeat className="h-3 w-3 mr-1" />
                                {wird.frequency}
                              </span>
                            )}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => handleLogWirdForToday(wird)}
                          disabled={!!processingWird}
                          className="min-w-[100px]"
                        >
                          {processingWird === wird.id ? (
                            <Spinner size="sm" className="mr-2" />
                          ) : (
                            <Plus className="h-4 w-4 mr-2" />
                          )}
                          Add Today
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <div className="mb-4">
                      <div className="bg-muted inline-flex p-3 rounded-full">
                        <BookOpen className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <h3 className="mt-2 font-medium">No saved wirds yet</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Saved wirds from reflections and halaqa entries will appear here
                      </p>
                    </div>
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