import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useProfile } from '../hooks/useProfile';

interface ProfileOnboardingProps {
  onComplete?: () => void;
}

export function ProfileOnboarding({ onComplete }: ProfileOnboardingProps) {
  const { updateProfile, error: profileError } = useProfile();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Profile data state
  const [basicPreferences, setBasicPreferences] = useState({
    inputMethod: 'text',
    reflectionFrequency: 'daily',
    languagePreferences: 'english',
  });
  
  const [privacyPreferences, setPrivacyPreferences] = useState({
    localStorageOnly: true,
    allowPersonalization: true,
    enableSync: false,
  });
  
  const [knowledgePreferences, setKnowledgePreferences] = useState({
    knowledgeLevel: 'intermediate',
    spiritualJourneyStage: 'exploring',
    primaryGoals: [] as string[],
  });
  
  // Handle next step
  const handleNextStep = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    } else {
      handleSubmit();
    }
  };
  
  // Handle previous step
  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };
  
  // Handle changes to basic preferences
  const handleBasicPreferenceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setBasicPreferences({
      ...basicPreferences,
      [name]: value,
    });
  };
  
  // Handle changes to privacy preferences
  const handlePrivacyToggle = (setting: string, value: boolean) => {
    setPrivacyPreferences({
      ...privacyPreferences,
      [setting]: value,
    });
  };
  
  // Handle changes to knowledge level
  const handleKnowledgeLevelChange = (value: string) => {
    setKnowledgePreferences({
      ...knowledgePreferences,
      knowledgeLevel: value,
    });
  };
  
  // Handle changes to spiritual journey stage
  const handleJourneyStageChange = (value: string) => {
    setKnowledgePreferences({
      ...knowledgePreferences,
      spiritualJourneyStage: value,
    });
  };
  
  // Handle changes to primary goals
  const handleGoalToggle = (goal: string, checked: boolean) => {
    if (checked) {
      // Create a new array with the goal added
      const updatedGoals = [...knowledgePreferences.primaryGoals, goal];
      setKnowledgePreferences({
        ...knowledgePreferences,
        primaryGoals: updatedGoals,
      });
    } else {
      // Filter out the goal
      const updatedGoals = knowledgePreferences.primaryGoals.filter(g => g !== goal);
      setKnowledgePreferences({
        ...knowledgePreferences,
        primaryGoals: updatedGoals,
      });
    }
  };
  
  // Submit the complete profile
  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      setError(null);
      
      // Create public profile
      const publicProfile = {
        generalPreferences: basicPreferences,
        privacySettings: privacyPreferences,
      };
      
      // Create private profile
      const privateProfile = {
        knowledgeLevel: knowledgePreferences.knowledgeLevel,
        spiritualJourneyStage: knowledgePreferences.spiritualJourneyStage,
        primaryGoals: knowledgePreferences.primaryGoals,
        // Initialize other private profile elements
        dynamicAttributes: {
          topicsEngagedWith: {},
          preferredReferences: {},
          emotionalResponsiveness: {},
          languageComplexity: 5
        },
        recentInteractions: {
          lastTopics: [],
          lastActionItems: [],
          completedActionItems: []
        }
      };
      
      // Update profile
      await updateProfile(publicProfile, privateProfile);
      
      // Call onComplete callback if provided
      if (onComplete) {
        onComplete();
      }
    } catch (err) {
      console.error('Error creating profile:', err);
      setError('Failed to create your profile. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Card className="w-full max-w-lg mx-auto">
      <CardHeader>
        <CardTitle>Create Your Profile</CardTitle>
        <CardDescription>
          Step {currentStep} of 3: {currentStep === 1 ? 'Basic Preferences' : 
            currentStep === 2 ? 'Privacy Settings' : 'Your Background'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {profileError && (
          <Alert variant="destructive">
            <AlertDescription>{profileError.message}</AlertDescription>
          </Alert>
        )}
        
        {/* Step 1: Basic Preferences */}
        {currentStep === 1 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="languagePreferences">Preferred Language</Label>
              <select 
                id="languagePreferences"
                name="languagePreferences"
                className="w-full p-2 border rounded-md"
                value={basicPreferences.languagePreferences}
                onChange={(e) => setBasicPreferences({
                  ...basicPreferences,
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
            
            <div className="space-y-2">
              <Label htmlFor="inputMethod">Preferred Input Method</Label>
              <RadioGroup 
                value={basicPreferences.inputMethod}
                onValueChange={(value) => setBasicPreferences({
                  ...basicPreferences,
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
            
            <div className="space-y-2">
              <Label htmlFor="reflectionFrequency">Reflection Frequency</Label>
              <RadioGroup 
                value={basicPreferences.reflectionFrequency}
                onValueChange={(value) => setBasicPreferences({
                  ...basicPreferences,
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
          </div>
        )}
        
        {/* Step 2: Privacy Settings */}
        {currentStep === 2 && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground mb-4">
              Your privacy is important to us. These settings control how your data is stored and used.
            </p>
            
            <div className="flex items-start space-x-2">
              <Checkbox 
                id="localStorageOnly"
                checked={privacyPreferences.localStorageOnly}
                onCheckedChange={(checked) => handlePrivacyToggle('localStorageOnly', checked === true)}
              />
              <div className="space-y-1">
                <Label htmlFor="localStorageOnly" className="font-medium">Store data on my device only</Label>
                <p className="text-sm text-muted-foreground">
                  Your reflections and personal data will never leave your device
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-2">
              <Checkbox 
                id="allowPersonalization"
                checked={privacyPreferences.allowPersonalization}
                onCheckedChange={(checked) => handlePrivacyToggle('allowPersonalization', checked === true)}
              />
              <div className="space-y-1">
                <Label htmlFor="allowPersonalization" className="font-medium">Allow personalization</Label>
                <p className="text-sm text-muted-foreground">
                  Improve your experience by learning from your interactions
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-2">
              <Checkbox 
                id="enableSync"
                checked={privacyPreferences.enableSync}
                onCheckedChange={(checked) => handlePrivacyToggle('enableSync', checked === true)}
                disabled={privacyPreferences.localStorageOnly}
              />
              <div className="space-y-1">
                <Label htmlFor="enableSync" className="font-medium">Sync across devices</Label>
                <p className="text-sm text-muted-foreground">
                  Securely sync your encrypted profile across your devices
                  {privacyPreferences.localStorageOnly && 
                    " (Disabled when 'Store data on my device only' is enabled)"}
                </p>
              </div>
            </div>
            
            <div className="pt-2 border-t">
              <p className="text-sm">
                Don't worry, you can change these settings at any time.
              </p>
            </div>
          </div>
        )}
        
        {/* Step 3: Knowledge Background */}
        {currentStep === 3 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Knowledge Level</Label>
              <RadioGroup 
                value={knowledgePreferences.knowledgeLevel}
                onValueChange={handleKnowledgeLevelChange}
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
            
            <div className="space-y-2">
              <Label>Spiritual Journey Stage</Label>
              <RadioGroup 
                value={knowledgePreferences.spiritualJourneyStage}
                onValueChange={handleJourneyStageChange}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="exploring" id="journey-exploring" />
                  <Label htmlFor="journey-exploring">Exploring and Learning</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="practicing" id="journey-practicing" />
                  <Label htmlFor="journey-practicing">Practicing Regularly</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="growing" id="journey-growing" />
                  <Label htmlFor="journey-growing">Growing and Deepening</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="guiding" id="journey-guiding" />
                  <Label htmlFor="journey-guiding">Guiding Others</Label>
                </div>
              </RadioGroup>
            </div>
            
            <div className="space-y-2">
              <Label>Primary Goals (Select all that apply)</Label>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="goal-learning" 
                    checked={knowledgePreferences.primaryGoals.includes('learning')}
                    onCheckedChange={(checked) => handleGoalToggle('learning', checked === true)}
                  />
                  <Label htmlFor="goal-learning">Learn more about faith</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="goal-quran" 
                    checked={knowledgePreferences.primaryGoals.includes('quran')}
                    onCheckedChange={(checked) => handleGoalToggle('quran', checked === true)}
                  />
                  <Label htmlFor="goal-quran">Understand Quran better</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="goal-habits" 
                    checked={knowledgePreferences.primaryGoals.includes('habits')}
                    onCheckedChange={(checked) => handleGoalToggle('habits', checked === true)}
                  />
                  <Label htmlFor="goal-habits">Develop better habits</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="goal-purpose" 
                    checked={knowledgePreferences.primaryGoals.includes('purpose')}
                    onCheckedChange={(checked) => handleGoalToggle('purpose', checked === true)}
                  />
                  <Label htmlFor="goal-purpose">Find purpose and meaning</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="goal-community" 
                    checked={knowledgePreferences.primaryGoals.includes('community')}
                    onCheckedChange={(checked) => handleGoalToggle('community', checked === true)}
                  />
                  <Label htmlFor="goal-community">Connect with community</Label>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div className="flex justify-between pt-4">
          <Button
            variant="outline"
            onClick={handlePrevStep}
            disabled={currentStep === 1 || isSubmitting}
          >
            Back
          </Button>
          
          <Button
            onClick={handleNextStep}
            disabled={isSubmitting}
          >
            {currentStep < 3 ? 'Next' : 'Complete Setup'}
            {isSubmitting && '...'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default ProfileOnboarding; 