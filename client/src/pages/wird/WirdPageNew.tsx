import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/use-toast';
import { Layout } from '../../components/Layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Calendar } from '../../components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '../../components/ui/popover';
import { Progress } from '../../components/ui/progress';
import { CLEARFrameworkDialog } from '../../components/CLEARFrameworkDialog';
import { CLEARSummary } from '../../components/CLEARSummary';
import { CLEARVisualization } from '../../components/CLEARVisualization';
import { WirdEntryPopup, WirdEntry as WirdPopupEntry } from '../../components/WirdEntryPopup';
import { format, isToday, isSameDay, addDays, subWeeks } from 'date-fns';
import { Plus, CalendarIcon, ChevronLeft, ChevronRight, Star, ArrowRight, Settings, BarChart2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import { wirdService } from '../../services/wird-service';
import type { CLEARFrameworkData, WirdEntry, WirdPractice, WirdSuggestion } from '@shared/schema';

// Type guard to check if an object is a WirdPractice
function isWirdPractice(wird: WirdEntry | WirdPractice): wird is WirdPractice {
  return 'name' in wird && 'type' in wird && 'status' in wird;
}

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
  const [processingWird, setProcessingWird] = useState<string | null>(null);
  const [selectedWirdForPopup, setSelectedWirdForPopup] = useState<WirdPopupEntry | null>(null);
  const [isWirdPopupOpen, setIsWirdPopupOpen] = useState(false);
  const [isCLEARDialogOpen, setIsCLEARDialogOpen] = useState(false);
  const [isVisualizationOpen, setIsVisualizationOpen] = useState(false);

  // Load saved wirds from localStorage
  useEffect(() => {
    try {
      const savedAddedWirdIds = localStorage.getItem('addedWirds');
      if (savedAddedWirdIds) {
        const addedWirdIds = JSON.parse(savedAddedWirdIds) as string[];
        const savedWirdSuggestions = localStorage.getItem('wirdSuggestions');
        if (savedWirdSuggestions) {
          const allSuggestions = JSON.parse(savedWirdSuggestions) as WirdSuggestion[];
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
        const today = new Date();
        const startDate = subWeeks(today, 4);
        const endDate = today;
        
        const userWirds = await wirdService.getWirdsByDateRange(user.id, startDate, endDate);
        setWirds(userWirds);
        
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

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
    }
  };

  const handleWirdClick = (wird: WirdEntry | WirdPractice, date?: Date) => {
    if (isWirdPractice(wird)) {
      // If it's a practice, we need to create a popup entry from it
      const popupEntry: WirdPopupEntry = {
        id: wird.id,
        title: wird.name,
        type: wird.type,
        status: wird.status,
        count: wird.count,
        notes: wird.notes,
      };
      setSelectedWirdForPopup(popupEntry);
    } else {
      // If it's a wird entry, create a popup entry from the wird
      const popupEntry: WirdPopupEntry = {
        id: wird.id,
        title: wird.title,
        type: 'general',
        status: 'incomplete',
        notes: wird.notes,
      };
      setSelectedWirdForPopup(popupEntry);
    }
    setIsWirdPopupOpen(true);
  };

  const handleSaveWirdEntry = async (updatedEntry: WirdPopupEntry) => {
    try {
      if (!selectedWird) return;

      const updatedPractice: Partial<WirdPractice> = {
        status: updatedEntry.status,
        count: updatedEntry.count,
        notes: updatedEntry.notes,
      };

      const updated = await wirdService.updatePractice(
        selectedWird.id,
        updatedEntry.id,
        updatedPractice
      );
      
      setWirds(prevWirds => 
        prevWirds.map(wird => 
          wird.id === updated.id ? updated : wird
        )
      );
      
      if (selectedWird.id === updated.id) {
        setSelectedWird(updated);
      }
      
      toast({
        title: "Wird Updated",
        description: "Your wird entry has been updated successfully.",
      });
    } catch (error) {
      console.error("Error updating wird:", error);
      toast({
        title: "Error",
        description: "Failed to update wird entry. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleLogWirdForToday = async (suggestion: WirdSuggestion) => {
    if (!user?.id) {
      toast({
        title: "Authentication Required",
        description: "You must be logged in to track wirds.",
        variant: "destructive",
      });
      return;
    }

    setProcessingWird(suggestion.id);

    try {
      const today = new Date();
      const wirdForToday = wirds.find(wird => isSameDay(new Date(wird.date), today));

      if (wirdForToday) {
        // Add practice to existing wird
        const practice: WirdPractice = {
          id: suggestion.id,
          name: suggestion.name,
          type: (suggestion.type as 'general' | 'rakat' | 'dhikr') || 'general',
          status: 'incomplete',
          count: suggestion.target,
        };

        const updatedPractices = [...wirdForToday.practices, practice];
        const updated = await wirdService.updateWird(wirdForToday.id, {
          practices: updatedPractices,
        });

        setWirds(prevWirds =>
          prevWirds.map(wird =>
            wird.id === updated.id ? updated : wird
          )
        );

        if (isSameDay(selectedDate, today)) {
          setSelectedWird(updated);
        }
      } else {
        // Create new wird for today
        const newWird: Partial<WirdEntry> = {
          title: `Wird for ${format(today, 'MMM d, yyyy')}`,
          date: today,
          practices: [{
            id: suggestion.id,
            name: suggestion.name,
            type: (suggestion.type as 'general' | 'rakat' | 'dhikr') || 'general',
            status: 'incomplete',
            count: suggestion.target,
          }],
        };

        const created = await wirdService.createWird(newWird);
        setWirds(prevWirds => [...prevWirds, created]);

        if (isSameDay(selectedDate, today)) {
          setSelectedWird(created);
        }
      }

      toast({
        title: "Wird Added",
        description: `${suggestion.name} has been added to today's wird.`,
      });
    } catch (error) {
      console.error("Error logging wird:", error);
      toast({
        title: "Error",
        description: "Failed to log wird. Please try again.",
        variant: "destructive",
      });
    } finally {
      setProcessingWird(null);
    }
  };

  const handleOpenCLEARDialog = () => {
    if (!selectedWird) {
      toast({
        title: "No Wird Selected",
        description: "Please select a wird to analyze with the CLEAR framework.",
        variant: "destructive",
      });
      return;
    }
    setIsCLEARDialogOpen(true);
  };

  const handleSaveCLEARFramework = async (framework: CLEARFrameworkData) => {
    try {
      if (!selectedWird) return;

      const updated = await wirdService.updateCLEARFramework(selectedWird.id, framework);
      
      setWirds(prevWirds => 
        prevWirds.map(wird => 
          wird.id === updated.id ? updated : wird
        )
      );
      
      if (selectedWird.id === updated.id) {
        setSelectedWird(updated);
      }
      
      toast({
        title: "CLEAR Framework Updated",
        description: "Your CLEAR framework analysis has been saved successfully.",
      });
    } catch (error) {
      console.error("Error updating CLEAR framework:", error);
      toast({
        title: "Error",
        description: "Failed to update CLEAR framework. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <Layout title="Loading Wird...">
        <div className="container flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="WirdhAI">
      <div className="container py-8 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">WirdhAI</h1>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
              onClick={() => setIsVisualizationOpen(true)}
            >
              <BarChart2 className="h-4 w-4" />
              Analytics
            </Button>
            <Button onClick={() => navigate("/wird/new")}>
              <Plus className="mr-2 h-4 w-4" />
              New Wird Entry
            </Button>
          </div>
        </div>

        {/* CLEAR Framework */}
        <CLEARFrameworkDialog
          open={isCLEARDialogOpen}
          onClose={() => setIsCLEARDialogOpen(false)}
          onSave={handleSaveCLEARFramework}
          initialFramework={selectedWird?.clearFramework}
          wirdTitle={selectedWird?.title || ''}
        />

        {/* Date Selection */}
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
          </CardContent>
        </Card>

        {/* Saved Wirds */}
        <Card>
          <CardHeader>
            <CardTitle>Saved Wirds</CardTitle>
            <CardDescription>
              Click on a wird to view details or click "Log Entry" to add it to today's tracking
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {addedWirds.map((wird) => (
                <div 
                  key={wird.id}
                  className={cn(
                    "p-4 rounded-lg border cursor-pointer transition-all",
                    "hover:border-primary/50 hover:shadow-sm"
                  )}
                  onClick={() => handleWirdClick({
                    id: wird.id,
                    title: wird.name,
                    date: new Date(),
                    practices: [],
                    type: (wird.type as 'general' | 'rakat' | 'dhikr') || 'general',
                    status: 'incomplete',
                    count: wird.target,
                  } as WirdEntry)}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-medium">{wird.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {wird.category || "General"}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleLogWirdForToday(wird);
                      }}
                      disabled={!!processingWird}
                    >
                      {processingWird === wird.id ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      ) : (
                        "Log Entry"
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Daily Tracking */}
        <Card>
          <CardHeader>
            <CardTitle>
              {isToday(selectedDate) ? "Today's Tracking" : `Tracking for ${format(selectedDate, "MMMM d, yyyy")}`}
            </CardTitle>
            <CardDescription>
              {selectedWird 
                ? `${selectedWird.practices.length} practices tracked` 
                : "No wird entries for this date"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {selectedWird ? (
              <div className="space-y-4">
                {selectedWird.practices.map((practice: WirdPractice) => (
                  <div
                    key={practice.id}
                    className="flex items-center justify-between p-4 rounded-lg border"
                    onClick={() => handleWirdClick(practice)}
                  >
                    <div>
                      <h3 className="font-medium">{practice.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {practice.type} • {practice.status}
                      </p>
                    </div>
                    <Progress
                      value={practice.status === 'completed' ? 100 : 0}
                      className="w-[100px]"
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Star className="h-12 w-12 text-muted-foreground/20 mx-auto mb-4" />
                <p className="text-muted-foreground">No wird entries for this date.</p>
                {isToday(selectedDate) && (
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => navigate("/wird/new")}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create Entry
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Wird Entry Popup */}
        {selectedWirdForPopup && (
          <WirdEntryPopup
            open={isWirdPopupOpen}
            onClose={() => {
              setIsWirdPopupOpen(false);
              setSelectedWirdForPopup(null);
            }}
            onSave={handleSaveWirdEntry}
            wird={selectedWirdForPopup}
          />
        )}

        {/* Add Visualization Dialog */}
        <CLEARVisualization
          open={isVisualizationOpen}
          onClose={() => setIsVisualizationOpen(false)}
          wirds={wirds}
        />
      </div>
    </Layout>
  );
} 