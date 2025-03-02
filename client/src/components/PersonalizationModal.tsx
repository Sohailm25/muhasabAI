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

// Define steps in the personalization process
type Step = "intro" | "preferences" | "knowledge" | "topics" | "privacy" | "complete";

export function PersonalizationModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { updateProfile } = useProfile();
  const { user, isLoading: authLoading } = useAuth();
  const [currentStep, setCurrentStep] = useState<Step>("intro");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Personalization state
  const [enablePersonalization, setEnablePersonalization] = useState(true);
  const [knowledgeLevel, setKnowledgeLevel] = useState<string>("beginner");
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [spiritualJourney, setSpiritualJourney] = useState<string>("exploring");
  const [privacyRead, setPrivacyRead] = useState(false);
  
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

  // Handle topic selection
  const toggleTopic = (topic: string) => {
    setSelectedTopics((prev) =>
      prev.includes(topic)
        ? prev.filter((t) => t !== topic)
        : [...prev, topic]
    );
  };

  // Save all preferences and complete the setup
  const handleComplete = async () => {
    if (!user) return;
    
    setIsSubmitting(true);
    
    try {
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
          knowledgeLevel,
          topicsOfInterest: selectedTopics,
          spiritualJourneyStage: spiritualJourney,
          primaryGoals: [],
          reflectionStyle: "balanced",
          guidancePreferences: ["practical", "spiritual"],
        } : undefined
      );
      
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
        setCurrentStep("topics");
        break;
      case "topics":
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
      case "topics":
        setCurrentStep("knowledge");
        break;
      case "privacy":
        if (enablePersonalization) {
          setCurrentStep("topics");
        } else {
          setCurrentStep("preferences");
        }
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
            
            <div className="py-6 space-y-4">
              <p className="mb-4">
                This helps us provide explanations and references at the right level of detail.
              </p>
              
              <RadioGroup value={knowledgeLevel} onValueChange={setKnowledgeLevel}>
                <div className="space-y-3">
                  <div className="flex items-start space-x-3 space-y-0 rounded-md border p-3">
                    <RadioGroupItem value="beginner" id="beginner" />
                    <div className="space-y-1">
                      <Label htmlFor="beginner" className="font-medium">Beginner</Label>
                      <p className="text-sm text-muted-foreground">New to Islamic teachings or returning to practice</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3 space-y-0 rounded-md border p-3">
                    <RadioGroupItem value="intermediate" id="intermediate" />
                    <div className="space-y-1">
                      <Label htmlFor="intermediate" className="font-medium">Intermediate</Label>
                      <p className="text-sm text-muted-foreground">Familiar with basic concepts and practices</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3 space-y-0 rounded-md border p-3">
                    <RadioGroupItem value="advanced" id="advanced" />
                    <div className="space-y-1">
                      <Label htmlFor="advanced" className="font-medium">Advanced</Label>
                      <p className="text-sm text-muted-foreground">Deeply familiar with Islamic teachings and scholarly works</p>
                    </div>
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
              <Button variant="outline" onClick={goToPreviousStep}>
                Back
              </Button>
              <Button onClick={goToNextStep} disabled={selectedTopics.length === 0}>
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