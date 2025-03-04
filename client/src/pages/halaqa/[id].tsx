import { useEffect, useState } from "react";
import { useRoute, useLocation } from "wouter";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/Spinner";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { halaqaService } from "@/services/halaqaService";
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
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showEditActionDialog, setShowEditActionDialog] = useState(false);
  const [currentActionItem, setCurrentActionItem] = useState<HalaqaActionItem | null>(null);
  const [addingToWird, setAddingToWird] = useState<string | null>(null); // To track which suggestion is being added
  const [editMode, setEditMode] = useState(false);
  
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
  
  useEffect(() => {
    if (params && params.id) {
      const halaqaId = parseInt(params.id, 10); // Parse with radix to ensure proper conversion
      if (!isNaN(halaqaId)) {
        fetchHalaqa(halaqaId);
      }
    }
  }, [params]);
  
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
  
  const fetchHalaqa = async (id: number) => {
    setLoading(true);
    try {
      const fetchedHalaqa = await halaqaService.getHalaqa(id);
      
      setHalaqa(fetchedHalaqa);
      
      // Auto-trigger analysis if no wird suggestions exist yet
      if (!fetchedHalaqa.wirdSuggestions || fetchedHalaqa.wirdSuggestions.length === 0) {
        handleAnalyzeHalaqa();
      } else {
        setWirdSuggestions(fetchedHalaqa.wirdSuggestions);
      }
      
    } catch (error) {
      console.error(`Error fetching halaqa ${id}:`, error);
      setError("Failed to load halaqa. Please try again.");
    } finally {
      setLoading(false);
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
    if (!halaqa || !user?.id) return;
    
    setAnalyzingHalaqa(true);
    try {
      const halaqaId = typeof halaqa.id === 'string' ? parseInt(halaqa.id) : halaqa.id;
      const result = await halaqaService.analyzeHalaqaEntry(halaqaId);
      setWirdSuggestions(result.wirdSuggestions);
      
      // Update the halaqa object with the wird suggestions
      setHalaqa({
        ...halaqa,
        wirdSuggestions: result.wirdSuggestions
      });
      
      toast({
        title: "Success!",
        description: "Wird suggestions have been generated for this halaqa.",
      });
    } catch (error) {
      console.error("Error analyzing halaqa:", error);
      toast({
        title: "Error",
        description: "Failed to generate Wird suggestions. Please try again.",
        variant: "destructive",
      });
    } finally {
      setAnalyzingHalaqa(false);
    }
  };
  
  // Add wird suggestion to wird plan
  const handleAddToWirdPlan = async (wirdSuggestion: WirdSuggestion) => {
    if (!user?.id || !halaqa) return;
    
    setAddingToWird(wirdSuggestion.id);
    try {
      // Temporarily comment out this functionality until we have a proper API endpoint
      // Normally we would have an API like:
      // await halaqaService.addToWirdPlan(user.id, wirdSuggestion.id);
      
      toast({
        title: "Success!",
        description: `Added "${wirdSuggestion.title}" to your Wird plan.`,
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
  
  // Toggle action item completion
  const toggleActionItemCompletion = async (actionItem: HalaqaActionItem) => {
    if (!halaqa) return;
    
    try {
      const updatedActionItem = { ...actionItem, completed: !actionItem.completed };
      const updatedHalaqa = await halaqaService.updateActionItem(halaqa.id, actionItem.id, updatedActionItem);
      setHalaqa(updatedHalaqa);
    } catch (error) {
      console.error("Error updating action item:", error);
      toast({
        title: "Error",
        description: "Failed to update action item. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  // Open edit action item dialog
  const openEditActionDialog = (actionItem: HalaqaActionItem) => {
    setCurrentActionItem(actionItem);
    actionItemForm.reset({
      description: actionItem.description,
      completed: actionItem.completed,
    });
    setShowEditActionDialog(true);
  };
  
  // Save action item changes
  const handleSaveActionItem = async (values: z.infer<typeof actionItemSchema>) => {
    if (!halaqa || !currentActionItem) return;
    
    try {
      const updatedActionItem = {
        ...currentActionItem,
        description: values.description,
        completed: values.completed,
      };
      
      const updatedHalaqa = await halaqaService.updateActionItem(halaqa.id, currentActionItem.id, updatedActionItem);
      setHalaqa(updatedHalaqa);
      setShowEditActionDialog(false);
      toast({
        title: "Success!",
        description: "Action item has been updated.",
      });
    } catch (error) {
      console.error("Error updating action item:", error);
      toast({
        title: "Error",
        description: "Failed to update action item. Please try again.",
        variant: "destructive",
      });
    }
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
  
  if (loading) {
    return (
      <Layout title="Loading Halaqa">
        <div className="container py-8 text-center">
          <Spinner size="lg" />
          <p className="mt-4 text-muted-foreground">Loading halaqa entry...</p>
        </div>
      </Layout>
    );
  }
  
  if (error || !halaqa) {
    return (
      <Layout title="Error">
        <div className="container py-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Error Loading Halaqa</h2>
          <p className="text-muted-foreground mb-6">{error || "Halaqa not found"}</p>
          <Button onClick={() => navigate("/halaqa")}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Halaqas
          </Button>
        </div>
      </Layout>
    );
  }
  
  return (
    <Layout title={halaqa.title || "Halaqa Details"}>
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
        
        {/* Wird Suggestions Section - At the top */}
        <Card className="mb-8">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>AI-Generated Insights</CardTitle>
                <CardDescription>
                  Spiritual practices suggested based on your halaqa reflections.
                </CardDescription>
              </div>
              
              <Button
                onClick={handleAnalyzeHalaqa}
                disabled={analyzingHalaqa}
                className="flex items-center"
              >
                {analyzingHalaqa ? <Spinner className="mr-2" size="sm" /> : <RotateCw className="mr-2 h-4 w-4" />}
                {analyzingHalaqa ? "Analyzing..." : "Generate Insights"}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {analyzingHalaqa ? (
              <div className="py-8 text-center text-muted-foreground">
                <Spinner className="mx-auto mb-4" />
                <p>AI generated suggestions will display here when ready...</p>
              </div>
            ) : (!halaqa.wirdSuggestions || halaqa.wirdSuggestions.length === 0) ? (
              <div className="py-8 text-center text-muted-foreground">
                <p>No Wird suggestions yet. Click "Generate Insights" to create personalized spiritual practices based on your reflection.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {halaqa.wirdSuggestions.map((suggestion) => (
                  <Card key={suggestion.id} className="overflow-hidden">
                    <CardHeader className="bg-muted/50 pb-3">
                      <div className="flex justify-between items-center">
                        <CardTitle className="text-base flex items-center gap-2">
                          <Star className="h-4 w-4 text-primary" />
                          {suggestion.title}
                        </CardTitle>
                        <Button
                          size="sm"
                          onClick={() => handleAddToWirdPlan(suggestion)}
                          disabled={addingToWird === suggestion.id}
                        >
                          {addingToWird === suggestion.id ? (
                            <>
                              <Spinner className="mr-2" size="sm" />
                              Adding...
                            </>
                          ) : (
                            <>
                              <Plus className="mr-2 h-4 w-4" />
                              Add to Wird
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
                          <span>{suggestion.type}</span>
                        </div>
                        <div className="flex items-center">
                          <Clock className="mr-1 h-3 w-3" />
                          <span>{suggestion.duration}</span>
                        </div>
                        <div className="flex items-center">
                          <Repeat className="mr-1 h-3 w-3" />
                          <span>{suggestion.frequency}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Halaqa Details Section */}
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
              <CardTitle>{halaqa.title || "Untitled Halaqa"}</CardTitle>
              <div className="flex flex-wrap gap-2 text-sm text-muted-foreground mt-2">
                {halaqa.date && (
                  <div className="flex items-center">
                    <Calendar className="mr-1 h-4 w-4" />
                    <span>{halaqa.date instanceof Date ? format(halaqa.date, 'MMMM d, yyyy') : format(new Date(halaqa.date), 'MMMM d, yyyy')}</span>
                  </div>
                )}
                
                {halaqa.speaker && (
                  <div className="flex items-center">
                    <User className="mr-1 h-4 w-4" />
                    <span>{halaqa.speaker}</span>
                  </div>
                )}
                
                {halaqa.topic && (
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
                  <p className="text-muted-foreground whitespace-pre-line">{halaqa.keyReflection}</p>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium mb-2">Impact</h3>
                  <p className="text-muted-foreground whitespace-pre-line">{halaqa.impact}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* Action Items Section */}
        <Card className="mb-8">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Action Items</CardTitle>
                <CardDescription>
                  Concrete steps to implement the insights from this halaqa.
                </CardDescription>
              </div>
              
              <Button
                onClick={handleGenerateActions}
                disabled={generatingActions}
                className="flex items-center"
              >
                {generatingActions ? <Spinner className="mr-2" size="sm" /> : <RotateCw className="mr-2 h-4 w-4" />}
                {generatingActions ? "Generating..." : "Generate Actions"}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {generatingActions ? (
              <div className="py-8 text-center text-muted-foreground">
                <Spinner className="mx-auto mb-4" />
                <p>Generating action items...</p>
              </div>
            ) : (!halaqa.actionItems || halaqa.actionItems.length === 0) ? (
              <div className="py-8 text-center text-muted-foreground">
                <p>No action items yet. Click "Generate Actions" to create some based on your reflection.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {halaqa.actionItems.map((item) => (
                  <div key={item.id} className="flex items-start gap-2 p-4 border rounded-lg">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className={`rounded-full h-6 w-6 ${item.completed ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'}`}
                      onClick={() => toggleActionItemCompletion(item)}
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                    
                    <div className="flex-1">
                      <p className={`${item.completed ? 'line-through text-muted-foreground' : ''}`}>
                        {item.description}
                      </p>
                    </div>
                    
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => openEditActionDialog(item)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Delete dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will delete your halaqa note. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteHalaqa}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Edit action item dialog */}
      <Dialog open={showEditActionDialog} onOpenChange={setShowEditActionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Action Item</DialogTitle>
            <DialogDescription>
              Make changes to your action item below.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...actionItemForm}>
            <form onSubmit={actionItemForm.handleSubmit(handleSaveActionItem)} className="space-y-6">
              <FormField
                control={actionItemForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="What action will you take?"
                        {...field}
                        rows={3}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={actionItemForm.control}
                name="completed"
                render={({ field }) => (
                  <FormItem className="flex items-center space-x-2 space-y-0">
                    <FormControl>
                      <Checkbox 
                        checked={field.value} 
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel className="cursor-pointer">Mark as completed</FormLabel>
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button type="submit">Save Changes</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </Layout>
  );
} 