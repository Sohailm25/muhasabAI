import { useEffect, useState } from "react";
import { useRoute, useLocation } from "wouter";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/Spinner";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { wirdService } from "@/services/wirdService";
import { WirdEntry, WirdPractice } from "@/types";
import { ArrowLeft, Calendar, Pencil, CheckCircle2, Circle, XCircle, AlertCircle } from "lucide-react";
import { ProgressBar } from "@/components/ProgressBar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel 
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { cn } from "@/lib/utils";

// Define the form schema for updating practice
const practiceUpdateSchema = z.object({
  completed: z.number().min(0),
});

export default function WirdDetailPage() {
  const [, params] = useRoute<{ id: string }>("/wird/:id");
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [wird, setWird] = useState<WirdEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("practices");
  const [updateLoading, setUpdateLoading] = useState(false);
  
  // Dialog states
  const [showUpdateDialog, setShowUpdateDialog] = useState(false);
  const [currentPractice, setCurrentPractice] = useState<WirdPractice | null>(null);
  
  // Initialize the update form
  const updateForm = useForm<{ completed: number }>({
    resolver: zodResolver(practiceUpdateSchema),
    defaultValues: {
      completed: 0,
    },
  });
  
  // Fetch the wird data
  useEffect(() => {
    const fetchWird = async () => {
      if (!params || !params.id) {
        setError("No wird ID provided");
        setLoading(false);
        return;
      }
      
      try {
        const wirdId = parseInt(params.id);
        if (isNaN(wirdId)) {
          setError("Invalid wird ID format");
          setLoading(false);
          return;
        }
        
        const wirdData = await wirdService.getWird(wirdId);
        setWird(wirdData);
      } catch (error) {
        console.error("Error fetching wird:", error);
        setError("Failed to load wird data. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    
    fetchWird();
  }, [params]);
  
  // Calculate the overall completion percentage
  const calculateOverallCompletion = (practices: WirdPractice[]) => {
    if (!practices || practices.length === 0) {
      return 0;
    }
    
    const completedCount = practices.filter(practice => practice.isCompleted).length;
    return Math.round((completedCount / practices.length) * 100);
  };
  
  // Calculate the completion percentage for a single practice
  const calculatePracticeCompletion = (practice: WirdPractice) => {
    if (practice.target <= 0) {
      return 0;
    }
    
    const percentage = (practice.completed / practice.target) * 100;
    return Math.min(100, Math.round(percentage));
  };
  
  // Open update dialog for a practice
  const openUpdateDialog = (practice: WirdPractice) => {
    setCurrentPractice(practice);
    updateForm.reset({
      completed: practice.completed,
    });
    setShowUpdateDialog(true);
  };
  
  // Update a practice progress
  const handleUpdatePractice = async (values: { completed: number }) => {
    if (!wird || !currentPractice) return;
    
    setUpdateLoading(true);
    
    try {
      const isCompleted = values.completed >= currentPractice.target;
      
      const updatedWird = await wirdService.updatePractice(
        wird.id,
        currentPractice.id!,
        {
          completed: values.completed,
          isCompleted,
        }
      );
      
      setWird(updatedWird);
      setShowUpdateDialog(false);
      
      toast({
        title: "Success",
        description: `Progress updated for ${currentPractice.name}`,
      });
    } catch (error) {
      console.error("Error updating practice:", error);
      toast({
        title: "Error",
        description: "Failed to update practice. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUpdateLoading(false);
    }
  };
  
  // Group practices by category
  const groupPracticesByCategory = (practices: WirdPractice[]) => {
    const groupedPractices: Record<string, WirdPractice[]> = {};
    
    practices.forEach(practice => {
      if (!groupedPractices[practice.category]) {
        groupedPractices[practice.category] = [];
      }
      
      groupedPractices[practice.category].push(practice);
    });
    
    return groupedPractices;
  };
  
  if (loading) {
    return (
      <Layout title="Loading Wird...">
        <div className="container flex items-center justify-center min-h-[60vh]">
          <Spinner size="lg" />
        </div>
      </Layout>
    );
  }
  
  if (error || !wird) {
    return (
      <Layout title="Error">
        <div className="container py-8">
          <Card className="w-full">
            <CardHeader>
              <CardTitle>Error Loading Wird</CardTitle>
              <CardDescription>{error || "Failed to load wird data."}</CardDescription>
            </CardHeader>
            <CardFooter>
              <Button onClick={() => navigate("/wird")}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Wird Tracker
              </Button>
            </CardFooter>
          </Card>
        </div>
      </Layout>
    );
  }
  
  // Group practices by category
  const practicesByCategory = groupPracticesByCategory(wird.practices);
  
  // Overall completion
  const overallCompletion = calculateOverallCompletion(wird.practices);
  
  return (
    <Layout title={`Wird - ${format(new Date(wird.date), "MMMM d, yyyy")}`}>
      <div className="container py-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-2">
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={() => navigate("/wird")}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </Button>
            <h1 className="text-2xl font-bold">{format(new Date(wird.date), "EEEE, MMMM d, yyyy")}</h1>
          </div>
        </div>
        
        {/* Overview Card */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <Card className="md:col-span-3">
            <CardHeader>
              <CardTitle>Daily Practices</CardTitle>
              <CardDescription>
                {wird.practices.length} practices tracked | {overallCompletion}% completed
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <ProgressBar 
                  value={overallCompletion} 
                  className="h-2.5"
                />
                
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {Object.entries(practicesByCategory).map(([category, practices]) => (
                    <div key={category} className="text-center">
                      <Badge variant="outline" className="mb-2">
                        {category}
                      </Badge>
                      <p className="text-2xl font-bold">
                        {practices.filter(p => p.isCompleted).length}/{practices.length}
                      </p>
                      <p className="text-sm text-muted-foreground">Completed</p>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Created</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">{format(new Date(wird.createdAt), "PPP p")}</p>
              {wird.updatedAt > wird.createdAt && (
                <p className="text-xs text-muted-foreground mt-1">
                  Last updated: {format(new Date(wird.updatedAt), "PPP p")}
                </p>
              )}
            </CardContent>
          </Card>
        </div>
        
        {/* Tabs for Practices and Notes */}
        <Tabs defaultValue={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="practices">Practices</TabsTrigger>
            <TabsTrigger value="notes">Notes</TabsTrigger>
          </TabsList>
          
          <TabsContent value="practices">
            <div className="space-y-6">
              {Object.entries(practicesByCategory).map(([category, practices]) => (
                <div key={category}>
                  <h2 className="text-xl font-semibold mb-4">{category}</h2>
                  <div className="grid grid-cols-1 gap-4">
                    {practices.map((practice) => (
                      <Card key={practice.id} className="overflow-hidden">
                        <div className="flex flex-col sm:flex-row">
                          <div className="flex-1 p-4">
                            <div className="flex items-start justify-between">
                              <div>
                                <h3 className="font-medium">{practice.name}</h3>
                                <p className="text-sm text-muted-foreground">
                                  {practice.completed} / {practice.target} {practice.unit}
                                </p>
                              </div>
                              <div className="flex items-center space-x-2">
                                {practice.isCompleted ? (
                                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                                ) : (
                                  <Circle className="h-5 w-5 text-muted-foreground" />
                                )}
                              </div>
                            </div>
                            
                            <div className="mt-4">
                              <div className="flex justify-between mb-1 text-xs">
                                <span>Progress</span>
                                <span>{calculatePracticeCompletion(practice)}%</span>
                              </div>
                              <ProgressBar
                                value={calculatePracticeCompletion(practice)}
                                className="h-1.5"
                                colorClass={
                                  practice.isCompleted
                                    ? "bg-green-500"
                                    : calculatePracticeCompletion(practice) > 0
                                    ? "bg-primary"
                                    : "bg-muted"
                                }
                              />
                            </div>
                          </div>
                          
                          <div className="p-4 sm:p-2 flex sm:flex-col justify-end sm:justify-center sm:border-l">
                            <Button 
                              size="sm" 
                              variant="outline"
                              className="w-full"
                              onClick={() => openUpdateDialog(practice)}
                            >
                              <Pencil className="h-4 w-4 mr-2" />
                              Update
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="notes">
            <Card>
              <CardHeader>
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <CardContent>
                {wird.notes ? (
                  <p className="whitespace-pre-line">{wird.notes}</p>
                ) : (
                  <p className="text-muted-foreground">No notes were added for this day.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Update Practice Dialog */}
      <Dialog open={showUpdateDialog} onOpenChange={setShowUpdateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Progress</DialogTitle>
            <DialogDescription>
              {currentPractice && `Update your progress for ${currentPractice.name}`}
            </DialogDescription>
          </DialogHeader>
          
          {currentPractice && (
            <>
              <div className="flex items-center justify-between mb-4">
                <span className="font-medium">Target: {currentPractice.target} {currentPractice.unit}</span>
                <Badge variant={currentPractice.isCompleted ? "default" : "outline"}>
                  {currentPractice.isCompleted ? "Completed" : "In Progress"}
                </Badge>
              </div>
              
              <Form {...updateForm}>
                <form onSubmit={updateForm.handleSubmit(handleUpdatePractice)} className="space-y-4">
                  <FormField
                    control={updateForm.control}
                    name="completed"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Completed Amount</FormLabel>
                        <FormControl>
                          <div className="flex items-center space-x-2">
                            <Input 
                              type="number"
                              min="0"
                              max={currentPractice.target}
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                            />
                            <span>/ {currentPractice.target}</span>
                          </div>
                        </FormControl>
                        <FormDescription>
                          {field.value >= currentPractice.target ? (
                            <span className="text-green-500 flex items-center">
                              <CheckCircle2 className="h-4 w-4 mr-1" /> Target reached
                            </span>
                          ) : (
                            <span className="text-muted-foreground">
                              {currentPractice.target - field.value} more to reach your target
                            </span>
                          )}
                        </FormDescription>
                      </FormItem>
                    )}
                  />
                  
                  {/* Progress bar */}
                  <div className="mb-4">
                    <ProgressBar
                      value={(updateForm.watch("completed") / currentPractice.target) * 100}
                      className="h-2"
                      colorClass={
                        updateForm.watch("completed") >= currentPractice.target
                          ? "bg-green-500"
                          : "bg-primary"
                      }
                    />
                  </div>
                  
                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowUpdateDialog(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={updateLoading}>
                      {updateLoading ? <Spinner size="sm" className="mr-2" /> : null}
                      Save Progress
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </>
          )}
        </DialogContent>
      </Dialog>
    </Layout>
  );
} 