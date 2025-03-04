import { useState } from "react";
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
  CardFooter,
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { ChevronLeft, ChevronRight, Check, CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { halaqaService } from "@/services/halaqaService";
import { HalaqaFormData } from "@/types";
import { Spinner } from "@/components/Spinner";

// Define form schema for the 3-section framework approach (removed application section)
const formSchema = z.object({
  title: z.string().optional(),
  speaker: z.string().optional(),
  date: z.date().optional().default(() => new Date()),
  topic: z.string().optional(),
  // First section: topic and speaker description
  descriptionSection: z.string().min(10, { 
    message: "Please provide at least one sentence describing the topic and speaker" 
  }),
  // Second section: insights and learnings
  insightsSection: z.string().min(10, { 
    message: "Please provide at least one sentence about what you learned" 
  }),
  // Third section: emotions and connection
  emotionsSection: z.string().min(10, { 
    message: "Please provide at least one sentence about how this made you feel or connected with you" 
  }),
});

export default function NewHalaqaPage() {
  const [activeSlide, setActiveSlide] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [processingEntry, setProcessingEntry] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  
  // Total slides is now 3 (after removing application section)
  const totalSlides = 2;

  // Initialize the form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      speaker: "",
      date: new Date(),
      topic: "",
      descriptionSection: "",
      insightsSection: "",
      emotionsSection: "",
    },
  });

  // Handle form submission
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!user?.id) {
      toast({ 
        title: "Error", 
        description: "You must be logged in to create a halaqa note", 
        variant: "destructive" 
      });
      return;
    }

    setSubmitting(true);
    setProcessingEntry(true);
    
    try {
      // Create default title if none provided
      const title = values.title || "Halaqa Reflection";
      const topic = values.topic || "Islamic Studies";
      
      // Prepare the data
      const halaqaData: HalaqaFormData = {
        userId: user.id,
        title: title,
        speaker: values.speaker || "",
        date: values.date || new Date(),
        topic: topic,
        // Store description and insights as keyReflection
        keyReflection: `${values.descriptionSection}\n\n${values.insightsSection}`,
        // Store emotional connection as impact
        impact: values.emotionsSection,
      };
      
      // Submit to API
      const result = await halaqaService.createHalaqa(halaqaData);
      
      // Now trigger the backend analysis process
      // This will generate action items and wird suggestions
      try {
        console.log("Triggering backend analysis for halaqa:", result.id);
        await halaqaService.analyzeHalaqaEntry(result.id);
      } catch (analysisError) {
        console.error("Error analyzing halaqa entry:", analysisError);
        // Don't block the user's flow if analysis fails - it can run later
      }
      
      toast({
        title: "Success!",
        description: "Your halaqa note has been saved and is being analyzed.",
      });
      
      // Navigate to view the newly created halaqa
      navigate(`/halaqa/${result.id}`);
    } catch (error) {
      console.error("Error creating halaqa:", error);
      toast({
        title: "Error",
        description: "Failed to save your halaqa note. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
      setProcessingEntry(false);
    }
  };

  // Navigation functions
  const nextSlide = async () => {
    // Validate current slide fields before proceeding
    let isValid = false;
    
    switch (activeSlide) {
      case 0:
        // Description slide
        isValid = await form.trigger("descriptionSection");
        break;
      case 1:
        // Insights slide
        isValid = await form.trigger("insightsSection");
        break;
      case 2:
        // Emotions slide
        isValid = await form.trigger("emotionsSection");
        break;
    }

    if (isValid && activeSlide < totalSlides) {
      setActiveSlide(activeSlide + 1);
    }
  };

  const prevSlide = () => {
    if (activeSlide > 0) {
      setActiveSlide(activeSlide - 1);
    }
  };

  // Submit on Enter key in the last input field of each slide if valid
  const handleKeyDown = async (e: React.KeyboardEvent, slideIndex: number) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      
      // Final slide - submit the form
      if (slideIndex === totalSlides) {
        const isValid = await form.trigger("emotionsSection");
        if (isValid) {
          form.handleSubmit(onSubmit)();
        }
      } else {
        // Other slides - advance to next slide
        nextSlide();
      }
    }
  };

  // Progress indicator
  const ProgressIndicator = () => (
    <div className="flex items-center justify-center space-x-2 mb-6">
      {[0, 1, 2].map((index) => (
        <div
          key={index}
          className={cn(
            "h-2 rounded-full transition-all duration-300",
            index <= activeSlide 
              ? "bg-primary w-8" 
              : "bg-muted w-4"
          )}
          onClick={() => {
            // Only allow navigating to slides we've already completed
            if (index <= activeSlide) {
              setActiveSlide(index);
            }
          }}
        />
      ))}
    </div>
  );

  return (
    <Layout title="New Halaqa Note">
      <div className="container max-w-xl py-8 px-4">
        <Card className="border-2 rounded-xl shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-center">Add New Halaqa</CardTitle>
          </CardHeader>
          
          <CardContent className="pt-0">
            <ProgressIndicator />
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                {/* Slide 0: Description Section */}
                <div className={cn(
                  "space-y-4 transition-all duration-300",
                  activeSlide === 0 ? "block" : "hidden"
                )}>
                  <FormField
                    control={form.control}
                    name="descriptionSection"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>What was discussed in this halaqa?</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Describe the topic and who presented it..." 
                            className="min-h-40"
                            {...field}
                            onKeyDown={(e) => handleKeyDown(e, 0)}
                          />
                        </FormControl>
                        <FormDescription>
                          Write at least one sentence describing the topic and speaker
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                {/* Slide 1: Insights Section */}
                <div className={cn(
                  "space-y-4 transition-all duration-300",
                  activeSlide === 1 ? "block" : "hidden"
                )}>                  
                  <FormField
                    control={form.control}
                    name="insightsSection"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>What did you learn?</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Share the insights and key learnings you gained..." 
                            className="min-h-40"
                            {...field}
                            onKeyDown={(e) => handleKeyDown(e, 1)}
                          />
                        </FormControl>
                        <FormDescription>
                          Write at least one sentence about what you learned
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                {/* Slide 2: Emotions Section + Optional Details */}
                <div className={cn(
                  "space-y-6 transition-all duration-300",
                  activeSlide === 2 ? "block" : "hidden"
                )}>                  
                  <FormField
                    control={form.control}
                    name="emotionsSection"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>How did this connect with you?</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Describe how this made you feel or resonated with you..." 
                            className="min-h-32"
                            {...field}
                            onKeyDown={(e) => handleKeyDown(e, 2)}
                          />
                        </FormControl>
                        <FormDescription>
                          Write at least one sentence about how it made you feel or connected with you
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {/* Optional Details */}
                  <div className="pt-4 border-t border-border">
                    <h3 className="text-sm font-medium mb-3">Optional Details</h3>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="title"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Title (Optional)</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Title of the lecture" 
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="topic"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Topic (Optional)</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="E.g., Tafsir, Fiqh, Seerah" 
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="grid gap-4 sm:grid-cols-2 mt-3">
                      <FormField
                        control={form.control}
                        name="speaker"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Speaker (Optional)</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Name of the speaker" 
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="date"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel>Date (Optional)</FormLabel>
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
                                      format(field.value, "PP")
                                    ) : (
                                      <span>Select date</span>
                                    )}
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                  mode="single"
                                  selected={field.value || undefined}
                                  onSelect={field.onChange}
                                  disabled={(date) =>
                                    date > new Date() || date < new Date("1900-01-01")
                                  }
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </div>
              </form>
            </Form>
          </CardContent>
          
          <CardFooter className="flex justify-between pt-2">
            {activeSlide > 0 ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={prevSlide}
              >
                <ChevronLeft className="mr-1 h-4 w-4" /> Back
              </Button>
            ) : (
              <div></div> // Empty div to maintain layout
            )}
            
            {activeSlide < totalSlides ? (
              <Button 
                type="button"
                size="sm"
                onClick={nextSlide}
              >
                Next <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            ) : (
              <Button
                type="button"
                size="sm"
                onClick={form.handleSubmit(onSubmit)}
                disabled={submitting}
              >
                {submitting ? (
                  <><Spinner className="mr-1 h-4 w-4" /> {processingEntry ? "Analyzing..." : "Saving..."}</>
                ) : (
                  <><Check className="mr-1 h-4 w-4" /> Save Halaqa</>
                )}
              </Button>
            )}
          </CardFooter>
        </Card>
      </div>
    </Layout>
  );
} 