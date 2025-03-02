import { Layout } from "@/components/Layout";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription,
  CardFooter
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useProfile } from "@/hooks/useProfile";
import { useAuth } from "@/hooks/useAuth";
import { useState, useEffect } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Profile() {
  const { publicProfile, privateProfile, updateProfile, isLoading: profileLoading } = useProfile();
  const { user, logout } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Track if data was changed to show save button
  const [hasChanges, setHasChanges] = useState(false);
  
  // Local state for form values
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [preferences, setPreferences] = useState({
    inputMethod: 'text',
    reflectionFrequency: 'daily',
    languagePreferences: 'english'
  });
  const [privacySettings, setPrivacySettings] = useState({
    localStorageOnly: false,
    allowPersonalization: true,
    enableSync: false
  });
  
  // Personal context fields
  const [knowledgeLevel, setKnowledgeLevel] = useState("intermediate");
  const [spiritualJourneyStage, setSpiritualJourneyStage] = useState("exploring");
  const [lifeStage, setLifeStage] = useState("");
  const [communityConnection, setCommunityConnection] = useState("");
  const [culturalBackground, setCulturalBackground] = useState("");
  
  // Preferences fields
  const [reflectionStyle, setReflectionStyle] = useState("balanced");
  const [guidancePreferences, setGuidancePreferences] = useState<string[]>(["practical", "spiritual"]);
  const [topicsOfInterest, setTopicsOfInterest] = useState<string[]>([]);
  const [primaryGoals, setPrimaryGoals] = useState<string[]>([]);

  // List of available topics
  const availableTopics = [
    "Quran Studies",
    "Hadith Studies",
    "Islamic History",
    "Personal Development",
    "Family Life",
    "Community Building",
    "Prayer & Worship",
    "Spiritual Growth",
    "Ethics & Morality",
    "Contemporary Issues"
  ];

  // Available guidance preferences
  const availableGuidancePreferences = [
    "practical",
    "spiritual",
    "scholarly",
    "reflective",
    "action-oriented",
    "community-focused"
  ];

  // Available goals
  const availableGoals = [
    "Strengthen Faith",
    "Improve Prayer",
    "Learn Quran",
    "Build Community",
    "Family Development",
    "Personal Growth",
    "Islamic Education"
  ];

  // Initialize form with profile data when loaded
  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
    }
    
    if (publicProfile?.generalPreferences) {
      setPreferences({
        inputMethod: publicProfile.generalPreferences.inputMethod || 'text',
        reflectionFrequency: publicProfile.generalPreferences.reflectionFrequency || 'daily',
        languagePreferences: publicProfile.generalPreferences.languagePreferences || 'english'
      });
    }
    
    if (publicProfile?.privacySettings) {
      setPrivacySettings({
        localStorageOnly: publicProfile.privacySettings.localStorageOnly || false,
        allowPersonalization: publicProfile.privacySettings.allowPersonalization || true,
        enableSync: publicProfile.privacySettings.enableSync || false
      });
    }

    // Load private profile data
    if (privateProfile) {
      setKnowledgeLevel(privateProfile.knowledgeLevel || 'intermediate');
      setSpiritualJourneyStage(privateProfile.spiritualJourneyStage || 'exploring');
      setLifeStage(privateProfile.lifeStage || '');
      setCommunityConnection(privateProfile.communityConnection || '');
      setCulturalBackground(privateProfile.culturalBackground || '');
      setReflectionStyle(privateProfile.reflectionStyle || 'balanced');
      setGuidancePreferences(privateProfile.guidancePreferences || ['practical', 'spiritual']);
      setTopicsOfInterest(privateProfile.topicsOfInterest || []);
      setPrimaryGoals(privateProfile.primaryGoals || []);
    }
  }, [user, publicProfile, privateProfile]);

  // Handle checkbox change for topics
  const handleTopicChange = (topic: string, checked: boolean) => {
    setHasChanges(true);
    if (checked) {
      setTopicsOfInterest([...topicsOfInterest, topic]);
    } else {
      setTopicsOfInterest(topicsOfInterest.filter(t => t !== topic));
    }
  };

  // Handle checkbox change for goals
  const handleGoalChange = (goal: string, checked: boolean) => {
    setHasChanges(true);
    if (checked) {
      setPrimaryGoals([...primaryGoals, goal]);
    } else {
      setPrimaryGoals(primaryGoals.filter(g => g !== goal));
    }
  };

  // Handle checkbox change for guidance preferences
  const handleGuidanceChange = (preference: string, checked: boolean) => {
    setHasChanges(true);
    if (checked) {
      setGuidancePreferences([...guidancePreferences, preference]);
    } else {
      setGuidancePreferences(guidancePreferences.filter(p => p !== preference));
    }
  };

  // Save all preferences
  const handleSavePreferences = async () => {
    try {
      setIsSaving(true);
      setSuccess(null);
      setError(null);
      
      // Log to console for debugging
      console.log("Saving profile with the following data:", {
        publicUpdates: {
          generalPreferences: preferences,
          privacySettings: privacySettings
        },
        privateUpdates: {
          knowledgeLevel,
          spiritualJourneyStage,
          lifeStage,
          communityConnection,
          culturalBackground,
          reflectionStyle,
          guidancePreferences,
          topicsOfInterest,
          primaryGoals
        }
      });
      
      // Update both public and private profile
      await updateProfile(
        {
          // Public profile updates
          generalPreferences: preferences,
          privacySettings: privacySettings
        }, 
        {
          // Private profile updates
          knowledgeLevel,
          spiritualJourneyStage,
          lifeStage,
          communityConnection,
          culturalBackground,
          reflectionStyle,
          guidancePreferences,
          topicsOfInterest,
          primaryGoals
        }
      );
      
      console.log("Profile updated successfully");
      setSuccess("All preferences saved successfully");
      setHasChanges(false);
    } catch (err) {
      console.error("Error saving preferences:", err);
      setError("Failed to save preferences. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  // Handle logout
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  
  const handleLogout = async () => {
    try {
      // Set logging out state to true
      setIsLoggingOut(true);
      setError(null);
      
      // Call logout and wait for it to complete
      await logout();
      
      // Directly go to the login page, bypassing any protected routes
      // This prevents RequireAuth from adding a return_to parameter
      window.location.href = '/login';
      
    } catch (err) {
      console.error("Error logging out:", err);
      setIsLoggingOut(false);
      setError("Failed to log out. Please try again.");
    }
  };

  if (profileLoading) {
    return (
      <Layout title="Your Profile">
        <div className="flex items-center justify-center h-[calc(100vh-200px)]">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading profile...</span>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Your Profile">
      <div className="container max-w-4xl mx-auto py-8 px-4">
        <div className="flex flex-col space-y-8">
          <div>
            <h2 className="text-2xl font-semibold mb-2">Your Profile</h2>
            <p className="text-muted-foreground">
              Manage your account settings and preferences
            </p>
          </div>

          {success && (
            <Alert className="bg-green-50 border-green-200">
              <AlertDescription className="text-green-800">{success}</AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Tabs defaultValue="personal" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="personal">Personal Information</TabsTrigger>
              <TabsTrigger value="personalize">Personalization</TabsTrigger>
              <TabsTrigger value="preferences">Application Settings</TabsTrigger>
            </TabsList>
            
            <TabsContent value="personal">
              <Card>
                <CardHeader>
                  <CardTitle>Personal Information</CardTitle>
                  <CardDescription>
                    Your account details
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input 
                      id="name" 
                      placeholder="Your name" 
                      value={name}
                      disabled
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input 
                      id="email" 
                      type="email" 
                      placeholder="Your email" 
                      value={email}
                      disabled
                    />
                  </div>
                </CardContent>
                <CardFooter>
                  <Button 
                    variant="outline" 
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                  >
                    {isLoggingOut ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Signing out...
                      </>
                    ) : "Sign Out"}
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
            
            <TabsContent value="personalize">
              <Card>
                <CardHeader>
                  <CardTitle>Personalization Settings</CardTitle>
                  <CardDescription>
                    Customize how content is tailored to your needs
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="space-y-8">
                  {/* Basic Preferences */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Basic Preferences</h3>
                    <div className="space-y-2">
                      <Label htmlFor="allowPersonalization">Allow Personalization</Label>
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-muted-foreground">
                          Enable personalized content based on your preferences
                        </p>
                        <Switch 
                          id="allowPersonalization"
                          checked={privacySettings.allowPersonalization}
                          onCheckedChange={(checked) => {
                            setHasChanges(true);
                            setPrivacySettings({
                              ...privacySettings,
                              allowPersonalization: checked
                            });
                          }}
                        />
                      </div>
                    </div>
                  </div>
                  
                  {/* Knowledge Level */}
                  <div className="space-y-4 pt-4 border-t">
                    <h3 className="text-lg font-medium">Knowledge Level</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      How would you describe your level of Islamic knowledge?
                    </p>
                    <RadioGroup 
                      value={knowledgeLevel}
                      onValueChange={(value) => {
                        setHasChanges(true);
                        setKnowledgeLevel(value);
                      }}
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="beginner" id="level-beginner" />
                        <Label htmlFor="level-beginner">Beginner</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="intermediate" id="level-intermediate" />
                        <Label htmlFor="level-intermediate">Intermediate</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="advanced" id="level-advanced" />
                        <Label htmlFor="level-advanced">Advanced</Label>
                      </div>
                    </RadioGroup>
                  </div>
                  
                  {/* Spiritual Journey */}
                  <div className="space-y-4 pt-4 border-t">
                    <h3 className="text-lg font-medium">Spiritual Journey Stage</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Where would you place yourself in your spiritual journey?
                    </p>
                    <RadioGroup 
                      value={spiritualJourneyStage}
                      onValueChange={(value) => {
                        setHasChanges(true);
                        setSpiritualJourneyStage(value);
                      }}
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="exploring" id="journey-exploring" />
                        <Label htmlFor="journey-exploring">Exploring</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="practicing" id="journey-practicing" />
                        <Label htmlFor="journey-practicing">Practicing</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="deepening" id="journey-deepening" />
                        <Label htmlFor="journey-deepening">Deepening</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="guiding" id="journey-guiding" />
                        <Label htmlFor="journey-guiding">Guiding Others</Label>
                      </div>
                    </RadioGroup>
                  </div>
                  
                  {/* Personal Background */}
                  <div className="space-y-6 pt-4 border-t">
                    <h3 className="text-lg font-medium">Personal Background</h3>
                    <p className="text-sm text-muted-foreground">
                      This information helps us provide more relevant guidance.
                    </p>
                    
                    <div className="space-y-4">
                      <Label>Life Stage</Label>
                      <Select 
                        value={lifeStage} 
                        onValueChange={(value) => {
                          setHasChanges(true);
                          setLifeStage(value);
                        }}
                      >
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

                    <div className="space-y-4">
                      <Label>Community Connection</Label>
                      <Select 
                        value={communityConnection} 
                        onValueChange={(value) => {
                          setHasChanges(true);
                          setCommunityConnection(value);
                        }}
                      >
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

                    <div className="space-y-4">
                      <Label>Cultural Background</Label>
                      <Select 
                        value={culturalBackground} 
                        onValueChange={(value) => {
                          setHasChanges(true);
                          setCulturalBackground(value);
                        }}
                      >
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
                  
                  {/* Reflection Style */}
                  <div className="space-y-4 pt-4 border-t">
                    <h3 className="text-lg font-medium">Reflection Style</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      What style of reflection resonates with you the most?
                    </p>
                    <RadioGroup 
                      value={reflectionStyle}
                      onValueChange={(value) => {
                        setHasChanges(true);
                        setReflectionStyle(value);
                      }}
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="analytical" id="style-analytical" />
                        <Label htmlFor="style-analytical">Analytical</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="emotional" id="style-emotional" />
                        <Label htmlFor="style-emotional">Emotional</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="practical" id="style-practical" />
                        <Label htmlFor="style-practical">Practical</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="balanced" id="style-balanced" />
                        <Label htmlFor="style-balanced">Balanced</Label>
                      </div>
                    </RadioGroup>
                  </div>
                  
                  {/* Guidance Preferences */}
                  <div className="space-y-4 pt-4 border-t">
                    <h3 className="text-lg font-medium">Guidance Preferences</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      What types of guidance would you like to receive? Select all that apply.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {availableGuidancePreferences.map(preference => (
                        <div key={preference} className="flex items-center space-x-2">
                          <Checkbox 
                            id={`guidance-${preference}`}
                            checked={guidancePreferences.includes(preference)}
                            onCheckedChange={(checked) => 
                              handleGuidanceChange(preference, checked === true)
                            }
                          />
                          <Label htmlFor={`guidance-${preference}`}>
                            {preference.charAt(0).toUpperCase() + preference.slice(1).replace('-', ' ')}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Primary Goals */}
                  <div className="space-y-4 pt-4 border-t">
                    <h3 className="text-lg font-medium">Primary Goals</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      What are your main goals in your Islamic journey? Select all that apply.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {availableGoals.map(goal => (
                        <div key={goal} className="flex items-center space-x-2">
                          <Checkbox 
                            id={`goal-${goal}`}
                            checked={primaryGoals.includes(goal)}
                            onCheckedChange={(checked) => 
                              handleGoalChange(goal, checked === true)
                            }
                          />
                          <Label htmlFor={`goal-${goal}`}>{goal}</Label>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Topics of Interest */}
                  <div className="space-y-4 pt-4 border-t">
                    <h3 className="text-lg font-medium">Topics of Interest</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Which Islamic topics interest you the most? Select all that apply.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {availableTopics.map(topic => (
                        <div key={topic} className="flex items-center space-x-2">
                          <Checkbox 
                            id={`topic-${topic}`}
                            checked={topicsOfInterest.includes(topic)}
                            onCheckedChange={(checked) => 
                              handleTopicChange(topic, checked === true)
                            }
                          />
                          <Label htmlFor={`topic-${topic}`}>{topic}</Label>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
                
                <CardFooter className="flex justify-end">
                  {hasChanges && (
                    <Button 
                      onClick={handleSavePreferences}
                      disabled={isSaving}
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : "Save Changes"}
                    </Button>
                  )}
                </CardFooter>
              </Card>
            </TabsContent>
            
            <TabsContent value="preferences">
              <Card>
                <CardHeader>
                  <CardTitle>Application Preferences</CardTitle>
                  <CardDescription>
                    Customize your experience with MuhasabAI
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <Label>Input Method</Label>
                    <RadioGroup 
                      value={preferences.inputMethod}
                      onValueChange={(value) => {
                        setHasChanges(true);
                        setPreferences({
                          ...preferences,
                          inputMethod: value,
                        });
                      }}
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="text" id="input-text" />
                        <Label htmlFor="input-text">Text</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="voice" id="input-voice" />
                        <Label htmlFor="input-voice">Voice</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <div className="space-y-4">
                    <Label>Reflection Frequency</Label>
                    <RadioGroup 
                      value={preferences.reflectionFrequency}
                      onValueChange={(value) => {
                        setHasChanges(true);
                        setPreferences({
                          ...preferences,
                          reflectionFrequency: value,
                        });
                      }}
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="daily" id="freq-daily" />
                        <Label htmlFor="freq-daily">Daily</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="weekly" id="freq-weekly" />
                        <Label htmlFor="freq-weekly">Weekly</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="occasional" id="freq-occasional" />
                        <Label htmlFor="freq-occasional">When I need it</Label>
                      </div>
                    </RadioGroup>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="languagePreferences">Preferred Language</Label>
                    <select 
                      id="languagePreferences"
                      className="w-full p-2 border rounded-md"
                      value={preferences.languagePreferences}
                      onChange={(e) => {
                        setHasChanges(true);
                        setPreferences({
                          ...preferences,
                          languagePreferences: e.target.value,
                        });
                      }}
                    >
                      <option value="english">English</option>
                      <option value="arabic">Arabic</option>
                      <option value="urdu">Urdu</option>
                      <option value="french">French</option>
                      <option value="spanish">Spanish</option>
                    </select>
                  </div>
                  
                  <div className="space-y-6 pt-4">
                    <h3 className="font-medium">Privacy Settings</h3>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="localStorageOnly">Local Storage Only</Label>
                        <p className="text-sm text-muted-foreground">
                          Keep all your data on this device only
                        </p>
                      </div>
                      <Switch 
                        id="localStorageOnly" 
                        checked={privacySettings.localStorageOnly}
                        onCheckedChange={(checked) => {
                          setHasChanges(true);
                          setPrivacySettings({
                            ...privacySettings,
                            localStorageOnly: checked
                          });
                        }}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="enableSync">Enable Sync</Label>
                        <p className="text-sm text-muted-foreground">
                          Sync your profile across devices
                        </p>
                      </div>
                      <Switch 
                        id="enableSync"
                        checked={privacySettings.enableSync}
                        onCheckedChange={(checked) => {
                          setHasChanges(true);
                          setPrivacySettings({
                            ...privacySettings,
                            enableSync: checked
                          });
                        }}
                      />
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  {hasChanges && (
                    <Button 
                      onClick={handleSavePreferences}
                      disabled={isSaving}
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : "Save Changes"}
                    </Button>
                  )}
                </CardFooter>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </Layout>
  );
} 