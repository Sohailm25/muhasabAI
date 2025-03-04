import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/Spinner";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { wirdService } from "@/services/wirdService";
import { WirdEntry } from "@/types";
import { Calendar as CalendarIcon, Plus, ChevronLeft, ChevronRight, CheckCircle2, Circle } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { format, addDays, startOfDay, endOfDay, parseISO, isToday, isSameDay, subWeeks } from "date-fns";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ProgressBar } from "@/components/ProgressBar";

export default function WirdPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [wirds, setWirds] = useState<WirdEntry[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedWird, setSelectedWird] = useState<WirdEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
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
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">WirdhAI</h1>
            <p className="text-muted-foreground mt-1">
              Track your daily Islamic practices and devotional activities
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="flex gap-2">
                  <CalendarIcon className="h-4 w-4" />
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
            
            <Button onClick={handleCreateNew}>
              <Plus className="mr-2 h-4 w-4" /> New Entry
            </Button>
          </div>
        </div>
        
        {/* Date Selector */}
        <div className="mb-6">
          <div className="flex overflow-x-auto py-2 space-x-2">
            {generateDates().map((date, index) => (
              <Button
                key={index}
                variant={isSameDay(date, selectedDate) ? "default" : "outline"}
                size="sm"
                className="whitespace-nowrap"
                onClick={() => setSelectedDate(date)}
              >
                <span className="flex flex-col items-center">
                  <span className="text-xs">{format(date, "EEE")}</span>
                  <span className="text-sm font-bold">{format(date, "d")}</span>
                </span>
              </Button>
            ))}
          </div>
        </div>
        
        {/* Current Date Wird */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">
              {formatDateLabel(selectedDate)}
            </h2>
            
            {!selectedWird && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => navigate(`/wird/new?date=${format(selectedDate, "yyyy-MM-dd")}`)}
              >
                <Plus className="mr-2 h-4 w-4" /> Add Practices
              </Button>
            )}
          </div>
          
          {selectedWird ? (
            <Card className="cursor-pointer hover:shadow-md transition-shadow"
                 onClick={() => handleViewWird(selectedWird.id)}>
              <CardHeader className="pb-3">
                <CardTitle>Daily Practices</CardTitle>
                <CardDescription>
                  {selectedWird.practices.length} practices | {calculateCompletionPercentage(selectedWird)}% completed
                </CardDescription>
              </CardHeader>
              <CardContent className="pb-3">
                <div className="space-y-4">
                  <ProgressBar 
                    value={calculateCompletionPercentage(selectedWird)} 
                    className="h-2" 
                  />
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {selectedWird.practices.slice(0, 4).map((practice) => (
                      <div key={practice.id} className="flex items-start space-x-2">
                        {practice.isCompleted ? (
                          <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                        ) : (
                          <Circle className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                        )}
                        <div className="flex-1">
                          <p className={`font-medium ${practice.isCompleted ? "text-primary" : ""}`}>
                            {practice.name}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {practice.completed} / {practice.target} {practice.unit}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {selectedWird.practices.length > 4 && (
                    <p className="text-sm text-muted-foreground">
                      +{selectedWird.practices.length - 4} more practices
                    </p>
                  )}
                </div>
              </CardContent>
              <CardFooter>
                <Button size="sm" onClick={() => handleViewWird(selectedWird.id)}>
                  View Details
                </Button>
              </CardFooter>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>No Practices Recorded</CardTitle>
                <CardDescription>
                  You haven't added any practices for {formatDateLabel(selectedDate)}.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Start tracking your daily wird (Islamic devotional practices) to maintain consistency in your worship.
                </p>
              </CardContent>
              <CardFooter>
                <Button 
                  onClick={() => navigate(`/wird/new?date=${format(selectedDate, "yyyy-MM-dd")}`)}
                >
                  <Plus className="mr-2 h-4 w-4" /> Add Practices
                </Button>
              </CardFooter>
            </Card>
          )}
        </div>
        
        {/* Recent Entries */}
        {wirds.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Recent Entries</h2>
              <Button variant="link" onClick={() => navigate('/wird/history')}>
                View All
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {wirds
                .filter(wird => !isSameDay(new Date(wird.date), selectedDate))
                .slice(0, 3)
                .map((wird) => (
                  <Card 
                    key={wird.id} 
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => handleViewWird(wird.id)}
                  >
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">{format(new Date(wird.date), "EEEE, MMMM d")}</CardTitle>
                      <CardDescription className="text-xs">
                        {wird.practices.length} practices | {calculateCompletionPercentage(wird)}% completed
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pb-3">
                      <ProgressBar 
                        value={calculateCompletionPercentage(wird)} 
                        className="h-2" 
                      />
                    </CardContent>
                  </Card>
                ))}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
} 