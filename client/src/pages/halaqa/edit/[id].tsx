import { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { CalendarIcon, ArrowRight, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { Spinner } from "@/components/Spinner";
import { halaqaService } from "@/services/halaqaService";
import { Halaqa, HalaqaFormData } from "@/types";

// Define form schema for validation
const formSchema = z.object({
  title: z.string().min(3, { message: "Title must be at least 3 characters" }),
  speaker: z.string().optional(),
  date: z.date({ required_error: "Date is required" }),
  topic: z.string().min(3, { message: "Topic must be at least 3 characters" }),
  keyReflection: z.string().min(10, { message: "Reflection must be at least 10 characters" }),
  impact: z.string().min(10, { message: "Impact must be at least 10 characters" }),
});

export default function EditHalaqaPage() {
  const [, params] = useRoute<{ id: string }>("/halaqa/edit/:id");
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [activeTab, setActiveTab] = useState("basic");
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [halaqa, setHalaqa] = useState<Halaqa | null>(null);

  // Initialize the form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      speaker: "",
      date: new Date(),
      topic: "",
      keyReflection: "",
      impact: "",
    },
  });

  // Fetch the halaqa data to edit
  useEffect(() => {
    const fetchHalaqa = async () => {
      if (!params || !params.id) {
        setError("No halaqa ID provided");
        setLoading(false);
        return;
      }
      
      try {
        const halaqaData = await halaqaService.getHalaqa(params.id);
        setHalaqa(halaqaData);
        
        // Populate form with existing data
        form.reset({
          title: halaqaData.title,
          speaker: halaqaData.speaker || "",
          date: new Date(halaqaData.date),
          topic: halaqaData.topic,
          keyReflection: halaqaData.keyReflection,
          impact: halaqaData.impact,
        });
      } catch (error) {
        console.error("Error fetching halaqa:", error);
        setError("Failed to load halaqa data. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    
    fetchHalaqa();
  }, [params, form]);

  // Handle form submission
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!user?.id || !halaqa) {
      toast({ 
        title: "Error", 
        description: "You must be logged in to update a halaqa note", 
        variant: "destructive" 
      });
      return;
    }

    setSubmitting(true);
    
    try {
      // Prepare the data
      const halaqaData: HalaqaFormData = {
        ...values,
        userId: user.id,
      };
      
      // Submit to API
      const result = await halaqaService.updateHalaqa(halaqa.id, halaqaData);
      
      toast({
        title: "Success!",
        description: "Your halaqa note has been updated.",
      });
      
      // Navigate to view the updated halaqa
      navigate(`/halaqa/${result.id}`);
    } catch (error) {
      console.error("Error updating halaqa:", error);
      toast({
        title: "Error",
        description: "Failed to update your halaqa note. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Handle tab navigation
  const goToNextTab = () => {
    // Manually trigger validation for current tab fields
    if (activeTab === "basic") {
      form.trigger(["title", "speaker", "date", "topic"]).then((isValid) => {
        if (isValid) setActiveTab("reflection");
      });
    } else if (activeTab === "reflection") {
      form.trigger(["keyReflection", "impact"]).then((isValid) => {
        if (isValid) setActiveTab("review");
      });
    }
  };

  const goToPreviousTab = () => {
    if (activeTab === "reflection") {
      setActiveTab("basic");
    } else if (activeTab === "review") {
      setActiveTab("reflection");
    }
  };

  if (loading) {
    return (
      <Layout title="Loading...">
        <div className="container flex items-center justify-center min-h-[60vh]">
          <Spinner size="lg" />
        </div>
      </Layout>
    );
  }
  
  if (error || !halaqa) {
    return (
      <Layout title="Error">
        <div className="container py-8">
          <Card className="w-full">
            <CardHeader>
              <CardTitle>Error Loading Halaqa</CardTitle>
              <CardDescription>{error || "Failed to load halaqa data."}</CardDescription>
            </CardHeader>
            <CardFooter>
              <Button onClick={() => navigate("/halaqa")}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Halaqa List
              </Button>
            </CardFooter>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title={`Edit: ${halaqa.title}`}>
      <div className="container max-w-3xl py-8 px-4">
        <Card>
          <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between space-y-2 md:space-y-0">
            <div>
              <CardTitle>Edit Halaqa Note</CardTitle>
              <CardDescription>
                Update your notes about this lecture or class
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => navigate(`/halaqa/${halaqa.id}`)}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Cancel
            </Button>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="basic">Basic Info</TabsTrigger>
                <TabsTrigger value="reflection">Reflection</TabsTrigger>
                <TabsTrigger value="review">Review</TabsTrigger>
              </TabsList>
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-6">
                  {/* Basic Info Tab */}
                  <TabsContent value="basic">
                    <div className="space-y-4">
                      <FormField
                        control={form.control}
                        name="title"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Title</FormLabel>
                            <FormControl>
                              <Input placeholder="Title of the lecture or class" {...field} />
                            </FormControl>
                            <FormDescription>
                              Enter a descriptive title for the lecture or class
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="speaker"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Speaker (Optional)</FormLabel>
                            <FormControl>
                              <Input placeholder="Name of the speaker or teacher" {...field} />
                            </FormControl>
                            <FormDescription>
                              Enter the name of the speaker, imam, or teacher
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="date"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel>Date</FormLabel>
                            <Popover>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant={"outline"}
                                    className={cn(
                                      "w-full pl-3 text-left font-normal",
                                      !field.value && "text-muted-foreground"
                                    )}
                                  >
                                    {field.value ? (
                                      format(field.value, "PPP")
                                    ) : (
                                      <span>Pick a date</span>
                                    )}
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                  mode="single"
                                  selected={field.value}
                                  onSelect={field.onChange}
                                  disabled={(date) =>
                                    date > new Date() || date < new Date("1900-01-01")
                                  }
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                            <FormDescription>
                              When did you attend this lecture?
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="topic"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Topic</FormLabel>
                            <FormControl>
                              <Input placeholder="Main topic or category" {...field} />
                            </FormControl>
                            <FormDescription>
                              E.g., Tafsir, Fiqh, Seerah, Spirituality, etc.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="flex justify-end mt-6">
                        <Button type="button" onClick={goToNextTab}>
                          Next Step <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </TabsContent>
                  
                  {/* Reflection Tab */}
                  <TabsContent value="reflection">
                    <div className="space-y-4">
                      <FormField
                        control={form.control}
                        name="keyReflection"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Key Reflection</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="What were the main points or key insights you gained?" 
                                className="min-h-32"
                                {...field}
                              />
                            </FormControl>
                            <FormDescription>
                              Write your main takeaways from the lecture
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="impact"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Personal Impact</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="How did this lecture impact you personally? What change do you want to make based on what you learned?" 
                                className="min-h-32"
                                {...field}
                              />
                            </FormControl>
                            <FormDescription>
                              Reflect on how this knowledge can be applied in your life
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="flex justify-between mt-6">
                        <Button type="button" variant="outline" onClick={goToPreviousTab}>
                          Back
                        </Button>
                        <Button type="button" onClick={goToNextTab}>
                          Next Step <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </TabsContent>
                  
                  {/* Review Tab */}
                  <TabsContent value="review">
                    <div className="space-y-6">
                      <div className="space-y-1">
                        <h3 className="text-sm font-medium text-muted-foreground">Title</h3>
                        <p className="text-base">{form.watch("title")}</p>
                      </div>
                      
                      {form.watch("speaker") && (
                        <div className="space-y-1">
                          <h3 className="text-sm font-medium text-muted-foreground">Speaker</h3>
                          <p className="text-base">{form.watch("speaker")}</p>
                        </div>
                      )}
                      
                      <div className="space-y-1">
                        <h3 className="text-sm font-medium text-muted-foreground">Date</h3>
                        <p className="text-base">{form.watch("date") ? format(form.watch("date"), "PPP") : ""}</p>
                      </div>
                      
                      <div className="space-y-1">
                        <h3 className="text-sm font-medium text-muted-foreground">Topic</h3>
                        <p className="text-base">{form.watch("topic")}</p>
                      </div>
                      
                      <div className="space-y-1">
                        <h3 className="text-sm font-medium text-muted-foreground">Key Reflection</h3>
                        <p className="text-base whitespace-pre-line">{form.watch("keyReflection")}</p>
                      </div>
                      
                      <div className="space-y-1">
                        <h3 className="text-sm font-medium text-muted-foreground">Personal Impact</h3>
                        <p className="text-base whitespace-pre-line">{form.watch("impact")}</p>
                      </div>
                      
                      <div className="flex justify-between mt-6">
                        <Button type="button" variant="outline" onClick={goToPreviousTab}>
                          Back
                        </Button>
                        <Button type="submit" disabled={submitting}>
                          {submitting ? "Saving Changes..." : "Update Halaqa Note"}
                        </Button>
                      </div>
                    </div>
                  </TabsContent>
                </form>
              </Form>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
} 