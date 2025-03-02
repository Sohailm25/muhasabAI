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

export default function Profile() {
  const { publicProfile, privateProfile, updateProfile, isLoading: profileLoading } = useProfile();
  const { user, logout } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
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
  const [knowledgeLevel, setKnowledgeLevel] = useState("intermediate");
  const [topicsOfInterest, setTopicsOfInterest] = useState<string[]>([]);

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
      setTopicsOfInterest(privateProfile.primaryGoals || []);
    }
  }, [user, publicProfile, privateProfile]);

  // Handle checkbox change for topics
  const handleTopicChange = (topic: string, checked: boolean) => {
    if (checked) {
      setTopicsOfInterest([...topicsOfInterest, topic]);
    } else {
      setTopicsOfInterest(topicsOfInterest.filter(t => t !== topic));
    }
  };

  // Save all preferences
  const handleSavePreferences = async () => {
    try {
      setIsSaving(true);
      setSuccess(null);
      setError(null);
      
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
          primaryGoals: topicsOfInterest
        }
      );
      
      setSuccess("All preferences saved successfully");
    } catch (err) {
      console.error("Error saving preferences:", err);
      setError("Failed to save preferences. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      await logout();
      window.location.href = '/';
    } catch (err) {
      console.error("Error logging out:", err);
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
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Islamic Knowledge & Interests</CardTitle>
              <CardDescription>
                Your level and topics of interest
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <Label>Knowledge Level</Label>
                <RadioGroup 
                  value={knowledgeLevel}
                  onValueChange={setKnowledgeLevel}
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

              <div className="space-y-4">
                <Label>Topics of Interest</Label>
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
            <CardFooter>
              <Button 
                onClick={handleSavePreferences}
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : "Save Preferences"}
              </Button>
            </CardFooter>
          </Card>

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
                  onValueChange={(value) => setPreferences({
                    ...preferences,
                    inputMethod: value,
                  })}
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
                  onValueChange={(value) => setPreferences({
                    ...preferences,
                    reflectionFrequency: value,
                  })}
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
                  onChange={(e) => setPreferences({
                    ...preferences,
                    languagePreferences: e.target.value,
                  })}
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
                    onCheckedChange={(checked) => setPrivacySettings({
                      ...privacySettings,
                      localStorageOnly: checked
                    })}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="allowPersonalization">Allow Personalization</Label>
                    <p className="text-sm text-muted-foreground">
                      Customize content based on your interactions
                    </p>
                  </div>
                  <Switch 
                    id="allowPersonalization"
                    checked={privacySettings.allowPersonalization}
                    onCheckedChange={(checked) => setPrivacySettings({
                      ...privacySettings,
                      allowPersonalization: checked
                    })}
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
                    onCheckedChange={(checked) => setPrivacySettings({
                      ...privacySettings,
                      enableSync: checked
                    })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-destructive/20">
            <CardHeader>
              <CardTitle className="text-destructive">Account Actions</CardTitle>
              <CardDescription>
                Sign out or manage your account
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex space-x-2">
                <Button variant="outline" onClick={handleLogout}>Sign Out</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
} 