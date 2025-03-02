import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { InlineLoading } from "./InlineLoading";
import { useProfile } from "@/hooks/useProfile";
import { useAuth } from "@/hooks/useAuth";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Define steps in the personalization process
type Step = 
  | "intro" 
  | "preferences" 
  | "knowledge" 
  | "spiritual-journey" 
  | "life-stage" 
  | "community" 
  | "culture" 
  | "reflection-style" 
  | "topics" 
  | "goals" 
  | "guidance" 
  | "privacy" 
  | "complete";

export function PersonalizationModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { updateProfile } = useProfile();
  const { user, isLoading: authLoading } = useAuth();
  const [currentStep, setCurrentStep] = useState<Step>("intro");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Personalization state
  const [enablePersonalization, setEnablePersonalization] = useState(true);
  const [knowledgeLevel, setKnowledgeLevel] = useState<string>("beginner");
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [primaryGoals, setPrimaryGoals] = useState<string[]>([]);
  const [spiritualJourney, setSpiritualJourney] = useState<string>("exploring");
  const [lifeStage, setLifeStage] = useState<string>("");
  const [communityConnection, setCommunityConnection] = useState<string>("");
  const [culturalBackground, setCulturalBackground] = useState<string>("");
  const [reflectionStyle, setReflectionStyle] = useState<string>("balanced");
  const [guidancePreferences, setGuidancePreferences] = useState<string[]>(["practical", "spiritual"]);
  const [privacyRead, setPrivacyRead] = useState(false);
  
  // Track whether a field was skipped
  const [skippedFields, setSkippedFields] = useState<string[]>([]);

  // Handle skip option for a field
  const skipCurrentField = () => {
    setSkippedFields([...skippedFields, currentStep]);
    goToNextStep();
  };
  
  const topics = [
    { id: "quran", label: "Quran Study" },
    { id: "hadith", label: "Hadith" },
    { id: "fiqh", label: "Islamic Jurisprudence (Fiqh)" },
    { id: "aqeedah", label: "Theology (Aqeedah)" },
    { id: "history", label: "Islamic History" },
    { id: "spirituality", label: "Spirituality & Purification" },
    { id: "dua", label: "Prayers & Supplications" },
    { id: "daily_practice", label: "Daily Islamic Practice" },
    { id: "community", label: "Community & Family" },
  ];
  
  const goals = [
    { id: "strengthen_faith", label: "Strengthen Faith" },
    { id: "improve_prayer", label: "Improve Prayer" },
    { id: "learn_quran", label: "Learn Quran" },
    { id: "build_community", label: "Build Community" },
    { id: "family_development", label: "Family Development" },
    { id: "personal_growth", label: "Personal Growth" },
    { id: "islamic_education", label: "Islamic Education" },
  ];
  
  const guidanceOptions = [
    { id: "practical", label: "Practical" },
    { id: "spiritual", label: "Spiritual" },
    { id: "scholarly", label: "Scholarly" },
    { id: "reflective", label: "Reflective" },
    { id: "action-oriented", label: "Action-Oriented" },
    { id: "community-focused", label: "Community-Focused" },
  ];

  // Handle topic selection
  const toggleTopic = (topic: string) => {
    setSelectedTopics((prev) =>
      prev.includes(topic)
        ? prev.filter((t) => t !== topic)
        : [...prev, topic]
    );
  };
  
  // Handle goal selection
  const toggleGoal = (goal: string) => {
    setPrimaryGoals((prev) =>
      prev.includes(goal)
        ? prev.filter((g) => g !== goal)
        : [...prev, goal]
    );
  };
  
  // Handle guidance preference selection
  const toggleGuidance = (guidance: string) => {
    setGuidancePreferences((prev) =>
      prev.includes(guidance)
        ? prev.filter((g) => g !== guidance)
        : [...prev, guidance]
    );
  };

  // Save all preferences and complete the setup
  const handleComplete = async () => {
    if (!user) return;
    
    setIsSubmitting(true);
    
    try {
      console.log("Saving personalization data with the following values:", {
        privacySettings: {
          allowPersonalization: enablePersonalization,
          localStorageOnly: true,
          enableSync: false,
        },
        privateProfile: {
          knowledgeLevel,
          topicsOfInterest: selectedTopics,
          primaryGoals,
          spiritualJourneyStage: spiritualJourney,
          lifeStage,
          communityConnection,
          culturalBackground,
          reflectionStyle,
          guidancePreferences,
        }
      });
      
      // Update public profile
      await updateProfile(
        {
          privacySettings: {
            allowPersonalization: enablePersonalization,
            localStorageOnly: true, // Default to local storage for privacy
            enableSync: false,
          },
        },
        enablePersonalization ? {
          // Only update private profile if personalization is enabled
          knowledgeLevel: skippedFields.includes("knowledge") ? "" : knowledgeLevel,
          topicsOfInterest: skippedFields.includes("topics") ? [] : selectedTopics,
          spiritualJourneyStage: skippedFields.includes("spiritual-journey") ? "" : spiritualJourney,
          primaryGoals: skippedFields.includes("goals") ? [] : primaryGoals,
          lifeStage: skippedFields.includes("life-stage") ? "" : lifeStage,
          communityConnection: skippedFields.includes("community") ? "" : communityConnection,
          culturalBackground: skippedFields.includes("culture") ? "" : culturalBackground,
          reflectionStyle: skippedFields.includes("reflection-style") ? "" : reflectionStyle,
          guidancePreferences: skippedFields.includes("guidance") ? [] : guidancePreferences,
        } : undefined
      );
      
      console.log("Personalization data saved successfully");
      
      // Mark user as no longer first login
      // This would normally update the user in the database
      
      // Close the modal
      onClose();
    } catch (error) {
      console.error("Error saving personalization preferences:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Navigate to next step
  const goToNextStep = () => {
    switch (currentStep) {
      case "intro":
        setCurrentStep("preferences");
        break;
      case "preferences":
        if (enablePersonalization) {
          setCurrentStep("knowledge");
        } else {
          setCurrentStep("privacy");
        }
        break;
      case "knowledge":
        setCurrentStep("spiritual-journey");
        break;
      case "spiritual-journey":
        setCurrentStep("life-stage");
        break;
      case "life-stage":
        setCurrentStep("community");
        break;
      case "community":
        setCurrentStep("culture");
        break;
      case "culture":
        setCurrentStep("reflection-style");
        break;
      case "reflection-style":
        setCurrentStep("topics");
        break;
      case "topics":
        setCurrentStep("goals");
        break;
      case "goals":
        setCurrentStep("guidance");
        break;
      case "guidance":
        setCurrentStep("privacy");
        break;
      case "privacy":
        setCurrentStep("complete");
        break;
      case "complete":
        handleComplete();
        break;
    }
  };

  // Navigate to previous step
  const goToPreviousStep = () => {
    switch (currentStep) {
      case "preferences":
        setCurrentStep("intro");
        break;
      case "knowledge":
        setCurrentStep("preferences");
        break;
      case "spiritual-journey":
        setCurrentStep("knowledge");
        break;
      case "life-stage":
        setCurrentStep("spiritual-journey");
        break;
      case "community":
        setCurrentStep("life-stage");
        break;
      case "culture":
        setCurrentStep("community");
        break;
      case "reflection-style":
        setCurrentStep("culture");
        break;
      case "topics":
        setCurrentStep("reflection-style");
        break;
      case "goals":
        setCurrentStep("topics");
        break;
      case "guidance":
        setCurrentStep("goals");
        break;
      case "privacy":
        setCurrentStep(enablePersonalization ? "guidance" : "preferences");
        break;
      case "complete":
        setCurrentStep("privacy");
        break;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        {/* Intro Step */}
        {currentStep === "intro" && (
          <>
            <DialogHeader>
              <DialogTitle className="text-2xl">Welcome to MuhasabAI</DialogTitle>
              <DialogDescription className="text-lg pt-2">
                Let's personalize your experience to make it more beneficial for your spiritual journey.
              </DialogDescription>
            </DialogHeader>
            
            <div className="py-6 space-y-4">
              <p>
                MuhasabAI can provide personalized Islamic reflections based on your knowledge level, 
                interests, and spiritual journey. This helps make the guidance more relevant to you.
              </p>
              <p>
                In the next few steps, we'll ask some questions to better understand your needs.
                Your privacy is our priority - all sensitive information is encrypted and stored only on your device.
              </p>
              <p className="font-medium">
                This will only take a minute, and you can change your preferences anytime.
              </p>
            </div>
            
            <DialogFooter>
              <Button onClick={goToNextStep}>Get Started</Button>
            </DialogFooter>
          </>
        )}

        {/* Personalization Opt-in Step */}
        {currentStep === "preferences" && (
          <>
            <DialogHeader>
              <DialogTitle>Personalization Preferences</DialogTitle>
              <DialogDescription>
                Choose whether you'd like personalized content based on your profile
              </DialogDescription>
            </DialogHeader>
            
            <div className="py-6 space-y-6">
              <RadioGroup value={enablePersonalization ? "yes" : "no"} onValueChange={(v) => setEnablePersonalization(v === "yes")}>
                <div className="flex items-start space-x-3 space-y-0 rounded-md border p-4">
                  <RadioGroupItem value="yes" id="opt-in" />
                  <div className="space-y-1.5 leading-snug">
                    <Label htmlFor="opt-in" className="font-medium text-base">
                      Enable personalization
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Get reflections and guidance tailored to your knowledge level, interests and spiritual journey.
                      Your information is encrypted and stored on your device.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3 space-y-0 rounded-md border p-4">
                  <RadioGroupItem value="no" id="opt-out" />
                  <div className="space-y-1.5 leading-snug">
                    <Label htmlFor="opt-out" className="font-medium text-base">
                      Skip personalization
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Receive general Islamic reflections without personalization.
                      No personal information will be collected or stored.
                    </p>
                  </div>
                </div>
              </RadioGroup>
            </div>
            
            <DialogFooter className="flex justify-between flex-row">
              <Button variant="outline" onClick={goToPreviousStep}>
                Back
              </Button>
              <Button onClick={goToNextStep}>
                Continue
              </Button>
            </DialogFooter>
          </>
        )}

        {/* Knowledge Level Step */}
        {currentStep === "knowledge" && (
          <>
            <DialogHeader>
              <DialogTitle>Islamic Knowledge Level</DialogTitle>
              <DialogDescription>
                Help us understand your level of Islamic knowledge
              </DialogDescription>
            </DialogHeader>
            
            <div className="py-6">
              <RadioGroup value={knowledgeLevel} onValueChange={setKnowledgeLevel}>
                <div className="flex flex-col gap-3">
                  <div className="flex items-start space-x-3 space-y-0 rounded-md border p-3">
                    <RadioGroupItem value="beginner" id="beginner" />
                    <div className="space-y-1">
                      <Label htmlFor="beginner" className="font-medium">
                        Beginner
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        I'm new to Islamic studies or still learning the basics
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3 space-y-0 rounded-md border p-3">
                    <RadioGroupItem value="intermediate" id="intermediate" />
                    <div className="space-y-1">
                      <Label htmlFor="intermediate" className="font-medium">
                        Intermediate
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        I have a good understanding of core Islamic concepts
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3 space-y-0 rounded-md border p-3">
                    <RadioGroupItem value="advanced" id="advanced" />
                    <div className="space-y-1">
                      <Label htmlFor="advanced" className="font-medium">
                        Advanced
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        I have deep knowledge of Islamic teachings and scholarship
                      </p>
                    </div>
                  </div>
                </div>
              </RadioGroup>
            </div>
            
            <DialogFooter className="flex justify-between flex-row">
              <div className="flex gap-2">
                <Button variant="outline" onClick={goToPreviousStep}>
                  Back
                </Button>
                <Button variant="ghost" onClick={skipCurrentField}>
                  Skip
                </Button>
              </div>
              <Button onClick={goToNextStep}>
                Continue
              </Button>
            </DialogFooter>
          </>
        )}

        {/* Spiritual Journey Step */}
        {currentStep === "spiritual-journey" && (
          <>
            <DialogHeader>
              <DialogTitle>Spiritual Journey</DialogTitle>
              <DialogDescription>
                Help us understand your spiritual journey
              </DialogDescription>
            </DialogHeader>
            
            <div className="py-6 space-y-6">
              <div className="space-y-4">
                <Label>Spiritual Journey Stage</Label>
                <RadioGroup value={spiritualJourney} onValueChange={setSpiritualJourney}>
                  <div className="flex flex-col gap-3">
                    <div className="flex items-start space-x-3 space-y-0 rounded-md border p-3">
                      <RadioGroupItem value="exploring" id="exploring" />
                      <div className="space-y-1">
                        <Label htmlFor="exploring" className="font-medium">
                          Exploring
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          I'm learning about Islam and exploring its teachings
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3 space-y-0 rounded-md border p-3">
                      <RadioGroupItem value="practicing" id="practicing" />
                      <div className="space-y-1">
                        <Label htmlFor="practicing" className="font-medium">
                          Practicing
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          I'm actively working to implement Islam in my daily life
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3 space-y-0 rounded-md border p-3">
                      <RadioGroupItem value="deepening" id="deepening" />
                      <div className="space-y-1">
                        <Label htmlFor="deepening" className="font-medium">
                          Deepening
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          I'm working to deepen my spiritual connection and understanding
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3 space-y-0 rounded-md border p-3">
                      <RadioGroupItem value="guiding" id="guiding" />
                      <div className="space-y-1">
                        <Label htmlFor="guiding" className="font-medium">
                          Guiding Others
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          I'm at a stage where I help guide others in their journey
                        </p>
                      </div>
                    </div>
                  </div>
                </RadioGroup>
              </div>
            </div>
            
            <DialogFooter className="flex justify-between flex-row">
              <div className="flex gap-2">
                <Button variant="outline" onClick={goToPreviousStep}>
                  Back
                </Button>
                <Button variant="ghost" onClick={skipCurrentField}>
                  Skip
                </Button>
              </div>
              <Button onClick={goToNextStep}>
                Continue
              </Button>
            </DialogFooter>
          </>
        )}

        {/* Life Stage Step */}
        {currentStep === "life-stage" && (
          <>
            <DialogHeader>
              <DialogTitle>Life Stage</DialogTitle>
              <DialogDescription>
                Help us understand your life stage
              </DialogDescription>
            </DialogHeader>
            
            <div className="py-6 space-y-6">
              <div className="space-y-4">
                <Label>Life Stage</Label>
                <Select value={lifeStage} onValueChange={setLifeStage}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your life stage" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="student">Student</SelectItem>
                    <SelectItem value="young-adult">Young Adult</SelectItem>
                    <SelectItem value="parent">Parent</SelectItem>
                    <SelectItem value="mid-career">Mid-Career</SelectItem>
                    <SelectItem value="elder">Elder</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <DialogFooter className="flex justify-between flex-row">
              <div className="flex gap-2">
                <Button variant="outline" onClick={goToPreviousStep}>
                  Back
                </Button>
                <Button variant="ghost" onClick={skipCurrentField}>
                  Skip
                </Button>
              </div>
              <Button onClick={goToNextStep}>
                Continue
              </Button>
            </DialogFooter>
          </>
        )}

        {/* Community Connection Step */}
        {currentStep === "community" && (
          <>
            <DialogHeader>
              <DialogTitle>Community Connection</DialogTitle>
              <DialogDescription>
                Help us understand your community connection
              </DialogDescription>
            </DialogHeader>
            
            <div className="py-6 space-y-6">
              <div className="space-y-4">
                <Label>Community Connection</Label>
                <Select value={communityConnection} onValueChange={setCommunityConnection}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your community connection" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="isolated">Isolated/Minimal</SelectItem>
                    <SelectItem value="occasional">Occasional Attendance</SelectItem>
                    <SelectItem value="regular">Regular Participation</SelectItem>
                    <SelectItem value="active">Active Member</SelectItem>
                    <SelectItem value="leader">Community Leader</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <DialogFooter className="flex justify-between flex-row">
              <div className="flex gap-2">
                <Button variant="outline" onClick={goToPreviousStep}>
                  Back
                </Button>
                <Button variant="ghost" onClick={skipCurrentField}>
                  Skip
                </Button>
              </div>
              <Button onClick={goToNextStep}>
                Continue
              </Button>
            </DialogFooter>
          </>
        )}

        {/* Cultural Background Step */}
        {currentStep === "culture" && (
          <>
            <DialogHeader>
              <DialogTitle>Cultural Background</DialogTitle>
              <DialogDescription>
                Help us understand your cultural background
              </DialogDescription>
            </DialogHeader>
            
            <div className="py-6 space-y-6">
              <div className="space-y-4">
                <Label>Cultural Background</Label>
                <Select value={culturalBackground} onValueChange={setCulturalBackground}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your cultural background" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="south-asian">South Asian</SelectItem>
                    <SelectItem value="middle-eastern">Middle Eastern</SelectItem>
                    <SelectItem value="african">African</SelectItem>
                    <SelectItem value="southeast-asian">Southeast Asian</SelectItem>
                    <SelectItem value="western">Western</SelectItem>
                    <SelectItem value="convert">Convert</SelectItem>
                    <SelectItem value="mixed">Mixed Background</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <DialogFooter className="flex justify-between flex-row">
              <div className="flex gap-2">
                <Button variant="outline" onClick={goToPreviousStep}>
                  Back
                </Button>
                <Button variant="ghost" onClick={skipCurrentField}>
                  Skip
                </Button>
              </div>
              <Button onClick={goToNextStep}>
                Continue
              </Button>
            </DialogFooter>
          </>
        )}

        {/* Reflection Style Step */}
        {currentStep === "reflection-style" && (
          <>
            <DialogHeader>
              <DialogTitle>Reflection Style</DialogTitle>
              <DialogDescription>
                Help us understand your preferred reflection style
              </DialogDescription>
            </DialogHeader>
            
            <div className="py-6 space-y-6">
              <div className="space-y-4">
                <Label>Reflection Style</Label>
                <RadioGroup value={reflectionStyle} onValueChange={setReflectionStyle}>
                  <div className="flex flex-col gap-3">
                    <div className="flex items-start space-x-3 space-y-0 rounded-md border p-3">
                      <RadioGroupItem value="analytical" id="analytical" />
                      <div className="space-y-1">
                        <Label htmlFor="analytical" className="font-medium">
                          Analytical
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          I prefer logical and structured thinking
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3 space-y-0 rounded-md border p-3">
                      <RadioGroupItem value="emotional" id="emotional" />
                      <div className="space-y-1">
                        <Label htmlFor="emotional" className="font-medium">
                          Emotional
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          I connect through feelings and emotions
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3 space-y-0 rounded-md border p-3">
                      <RadioGroupItem value="practical" id="practical" />
                      <div className="space-y-1">
                        <Label htmlFor="practical" className="font-medium">
                          Practical
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          I focus on real-world applications
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3 space-y-0 rounded-md border p-3">
                      <RadioGroupItem value="balanced" id="balanced" />
                      <div className="space-y-1">
                        <Label htmlFor="balanced" className="font-medium">
                          Balanced
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          I appreciate a mix of different approaches
                        </p>
                      </div>
                    </div>
                  </div>
                </RadioGroup>
              </div>
            </div>
            
            <DialogFooter className="flex justify-between flex-row">
              <div className="flex gap-2">
                <Button variant="outline" onClick={goToPreviousStep}>
                  Back
                </Button>
                <Button variant="ghost" onClick={skipCurrentField}>
                  Skip
                </Button>
              </div>
              <Button onClick={goToNextStep}>
                Continue
              </Button>
            </DialogFooter>
          </>
        )}

        {/* Topics of Interest Step */}
        {currentStep === "topics" && (
          <>
            <DialogHeader>
              <DialogTitle>Topics of Interest</DialogTitle>
              <DialogDescription>
                Select topics you'd like to focus on in your reflections
              </DialogDescription>
            </DialogHeader>
            
            <div className="py-6">
              <p className="mb-4">
                Choose any topics that interest you. We'll prioritize these in your reflections.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {topics.map((topic) => (
                  <div 
                    key={topic.id}
                    className="flex items-center space-x-2 rounded-md border p-3"
                  >
                    <Checkbox 
                      id={topic.id} 
                      checked={selectedTopics.includes(topic.id)}
                      onCheckedChange={() => toggleTopic(topic.id)}
                    />
                    <Label htmlFor={topic.id} className="font-medium cursor-pointer">
                      {topic.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
            
            <DialogFooter className="flex justify-between flex-row">
              <div className="flex gap-2">
                <Button variant="outline" onClick={goToPreviousStep}>
                  Back
                </Button>
                <Button variant="ghost" onClick={skipCurrentField}>
                  Skip
                </Button>
              </div>
              <Button onClick={goToNextStep} disabled={selectedTopics.length === 0 && !skippedFields.includes("topics")}>
                Continue
              </Button>
            </DialogFooter>
          </>
        )}

        {/* Goals Step */}
        {currentStep === "goals" && (
          <>
            <DialogHeader>
              <DialogTitle>Primary Goals</DialogTitle>
              <DialogDescription>
                Select your primary goals for your spiritual journey
              </DialogDescription>
            </DialogHeader>
            
            <div className="py-6">
              <p className="mb-4">
                These goals will help us tailor your reflections to your needs.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {goals.map((goal) => (
                  <div 
                    key={goal.id}
                    className="flex items-center space-x-2 rounded-md border p-3"
                  >
                    <Checkbox 
                      id={goal.id} 
                      checked={primaryGoals.includes(goal.id)}
                      onCheckedChange={() => toggleGoal(goal.id)}
                    />
                    <Label htmlFor={goal.id} className="font-medium cursor-pointer">
                      {goal.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
            
            <DialogFooter className="flex justify-between flex-row">
              <div className="flex gap-2">
                <Button variant="outline" onClick={goToPreviousStep}>
                  Back
                </Button>
                <Button variant="ghost" onClick={skipCurrentField}>
                  Skip
                </Button>
              </div>
              <Button onClick={goToNextStep} disabled={primaryGoals.length === 0 && !skippedFields.includes("goals")}>
                Continue
              </Button>
            </DialogFooter>
          </>
        )}

        {/* Guidance Preferences Step */}
        {currentStep === "guidance" && (
          <>
            <DialogHeader>
              <DialogTitle>Guidance Preferences</DialogTitle>
              <DialogDescription>
                Select the types of guidance you'd like to receive
              </DialogDescription>
            </DialogHeader>
            
            <div className="py-6">
              <p className="mb-4">
                Choose the types of guidance that resonate with you.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {guidanceOptions.map((guidance) => (
                  <div 
                    key={guidance.id}
                    className="flex items-center space-x-2 rounded-md border p-3"
                  >
                    <Checkbox 
                      id={guidance.id} 
                      checked={guidancePreferences.includes(guidance.id)}
                      onCheckedChange={() => toggleGuidance(guidance.id)}
                    />
                    <Label htmlFor={guidance.id} className="font-medium cursor-pointer">
                      {guidance.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
            
            <DialogFooter className="flex justify-between flex-row">
              <div className="flex gap-2">
                <Button variant="outline" onClick={goToPreviousStep}>
                  Back
                </Button>
                <Button variant="ghost" onClick={skipCurrentField}>
                  Skip
                </Button>
              </div>
              <Button onClick={goToNextStep} disabled={guidancePreferences.length === 0 && !skippedFields.includes("guidance")}>
                Continue
              </Button>
            </DialogFooter>
          </>
        )}

        {/* Privacy Confirmation Step */}
        {currentStep === "privacy" && (
          <>
            <DialogHeader>
              <DialogTitle>Privacy Policy</DialogTitle>
              <DialogDescription>
                Review how we handle your data
              </DialogDescription>
            </DialogHeader>
            
            <div className="py-6 space-y-4">
              <div className="max-h-[400px] overflow-y-auto border rounded-md p-4 text-sm">
                <h2 className="text-xl font-bold mb-3">MuhasabAI Privacy Policy</h2>
                
                <h3 className="text-lg font-bold mt-4 mb-2">Introduction</h3>
                <p className="mb-3">
                  MuhasabAI is committed to protecting your privacy and ensuring the security of your personal information. 
                  This Privacy Policy explains how we collect, use, store, and protect your data when you use our application, 
                  with a particular focus on our personalization system.
                </p>
                
                <h3 className="text-lg font-bold mt-4 mb-2">Our Commitment to Privacy</h3>
                <p className="mb-3">
                  We've designed MuhasabAI with privacy as a foundational principle. Our application implements:
                </p>
                <ol className="list-decimal pl-6 mb-3 space-y-1">
                  <li><strong>End-to-end encryption</strong> for sensitive personal data</li>
                  <li><strong>Local-only storage options</strong> that keep your data on your device</li>
                  <li><strong>Granular privacy controls</strong> that give you full control over what is shared</li>
                  <li><strong>Minimized data collection</strong> to only process what's necessary for the service</li>
                </ol>
                
                <h3 className="text-lg font-bold mt-4 mb-2">Information We Collect</h3>
                
                <h4 className="font-bold mt-3 mb-2">Public Profile Information</h4>
                <p className="mb-2">
                  The following information may be stored on our servers:
                </p>
                <ul className="list-disc pl-6 mb-3 space-y-1">
                  <li>User ID (randomly generated, not tied to personal identifiers)</li>
                  <li>General preferences (input method, reflection frequency, language)</li>
                  <li>Privacy settings</li>
                  <li>Non-sensitive usage statistics (number of reflections, streak days)</li>
                  <li>Account creation and update timestamps</li>
                </ul>
                <p className="mb-3">This information helps us provide basic functionality and improve our service.</p>
                
                <h4 className="font-bold mt-3 mb-2">Private Profile Information</h4>
                <p className="mb-2">
                  The following sensitive information is <strong>always encrypted on your device before transmission</strong>:
                </p>
                <ul className="list-disc pl-6 mb-3 space-y-1">
                  <li>Spiritual journey information</li>
                  <li>Personal goals and interests</li>
                  <li>Knowledge level and life stage</li>
                  <li>Cultural and community background</li>
                  <li>Reflection preferences</li>
                  <li>Topics of interest</li>
                  <li>Interaction history</li>
                </ul>
                <p className="mb-3">
                  The encryption key for this data <strong>never leaves your device</strong> unless you explicitly export it for backup or multi-device use.
                </p>
                
                <h3 className="text-lg font-bold mt-4 mb-2">How We Use Your Information</h3>
                
                <h4 className="font-bold mt-3 mb-2">Personalization</h4>
                <p className="mb-2">MuhasabAI uses your information to:</p>
                <ul className="list-disc pl-6 mb-3 space-y-1">
                  <li>Personalize Islamic reflections to your spiritual journey</li>
                  <li>Adapt content to match your knowledge level and interests</li>
                  <li>Remember context from previous interactions</li>
                  <li>Improve suggestions based on your engagement patterns</li>
                </ul>
                
                <h4 className="font-bold mt-3 mb-2">Improvement of Services</h4>
                <p className="mb-2">We use aggregated, anonymized data to:</p>
                <ul className="list-disc pl-6 mb-3 space-y-1">
                  <li>Identify common patterns of usage</li>
                  <li>Improve our AI responses and features</li>
                  <li>Fix technical issues</li>
                  <li>Develop new features</li>
                </ul>
                
                <h3 className="text-lg font-bold mt-4 mb-2">Data Storage and Security</h3>
                
                <h4 className="font-bold mt-3 mb-2">End-to-End Encryption</h4>
                <p className="mb-2">
                  All sensitive personal information is encrypted using AES-256 encryption before leaving your device. The encryption key is:
                </p>
                <ul className="list-disc pl-6 mb-3 space-y-1">
                  <li>Generated and stored locally on your device</li>
                  <li>Never transmitted to our servers</li>
                  <li>Required to decrypt your private information</li>
                </ul>
                
                <h4 className="font-bold mt-3 mb-2">Storage Options</h4>
                <p className="mb-2">You can choose between:</p>
                <ul className="list-disc pl-6 mb-3 space-y-1">
                  <li><strong>Local storage only</strong>: All data stays on your device and is never sent to our servers</li>
                  <li><strong>Encrypted cloud storage</strong>: Encrypted data is stored on our servers but can only be decrypted with your key</li>
                  <li><strong>Multi-device sync</strong>: Securely transfer your profile between devices using our key export feature</li>
                </ul>
                
                <h3 className="text-lg font-bold mt-4 mb-2">Your Privacy Controls</h3>
                <p className="mb-2">MuhasabAI gives you comprehensive control over your data:</p>
                
                <h4 className="font-bold mt-3 mb-2">Privacy Settings</h4>
                <ul className="list-disc pl-6 mb-3 space-y-1">
                  <li><strong>Local storage only</strong>: Opt out of server storage completely</li>
                  <li><strong>Personalization controls</strong>: Choose what aspects of your profile can be used for personalization</li>
                  <li><strong>Sync settings</strong>: Enable or disable profile synchronization across devices</li>
                </ul>
                
                <h4 className="font-bold mt-3 mb-2">Data Management</h4>
                <ul className="list-disc pl-6 mb-3 space-y-1">
                  <li><strong>Export</strong>: Download a copy of all your data</li>
                  <li><strong>Delete</strong>: Permanently remove your profile and data from our servers</li>
                  <li><strong>Reset</strong>: Start fresh with a new profile</li>
                  <li><strong>Key backup</strong>: Securely back up your encryption key for recovery</li>
                </ul>
                
                <h3 className="text-lg font-bold mt-4 mb-2">Contact Us</h3>
                <p className="mb-2">
                  If you have any questions about this Privacy Policy, please contact us at:
                </p>
                <ul className="list-disc pl-6 mb-3 space-y-1">
                  <li>Email: privacy@muhasabai.com</li>
                </ul>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="privacy-confirm" 
                  checked={privacyRead}
                  onCheckedChange={(checked) => setPrivacyRead(!!checked)}
                />
                <Label htmlFor="privacy-confirm">
                  I have read and understood the privacy policy
                </Label>
              </div>
            </div>
            
            <DialogFooter className="flex justify-between flex-row">
              <Button variant="outline" onClick={goToPreviousStep}>
                Back
              </Button>
              <Button onClick={goToNextStep} disabled={!privacyRead}>
                Continue
              </Button>
            </DialogFooter>
          </>
        )}

        {/* Complete Step */}
        {currentStep === "complete" && (
          <>
            <DialogHeader>
              <DialogTitle>Setup Complete!</DialogTitle>
              <DialogDescription>
                Your preferences have been saved
              </DialogDescription>
            </DialogHeader>
            
            <div className="py-6 space-y-4">
              <p>
                Thank you for personalizing your MuhasabAI experience. You're all set to begin
                your journey with reflections that are tailored to your needs.
              </p>
              
              <div className="bg-primary/10 border border-primary/30 rounded-md p-4">
                <h3 className="font-medium text-primary mb-2">Your preferences:</h3>
                <ul className="space-y-1 text-sm">
                  <li>
                    <span className="font-medium">Personalization:</span>{" "}
                    {enablePersonalization ? "Enabled" : "Disabled"}
                  </li>
                  {enablePersonalization && (
                    <>
                      <li>
                        <span className="font-medium">Knowledge level:</span>{" "}
                        {knowledgeLevel.charAt(0).toUpperCase() + knowledgeLevel.slice(1)}
                      </li>
                      <li>
                        <span className="font-medium">Topics of interest:</span>{" "}
                        {selectedTopics.length > 0
                          ? selectedTopics
                              .map(
                                (topicId) =>
                                  topics.find((t) => t.id === topicId)?.label
                              )
                              .join(", ")
                          : "None selected"}
                      </li>
                    </>
                  )}
                </ul>
              </div>
              
              <p>
                You can update these preferences at any time from your profile settings.
              </p>
            </div>
            
            <DialogFooter>
              <Button onClick={handleComplete} disabled={isSubmitting}>
                {isSubmitting ? <InlineLoading size="sm" /> : "Get Started"}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
} 