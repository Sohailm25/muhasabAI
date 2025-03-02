import React, { useState } from 'react';
import { useProfile } from '../hooks/useProfile';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

/**
 * ProfileOnboarding guides the user through setting up their
 * profile for personalized reflections and insights.
 */
export function ProfileOnboarding({ onComplete }: { onComplete: () => void }) {
  const { updateProfile } = useProfile();
  const [step, setStep] = useState(1);
  const [activeTab, setActiveTab] = useState('personal');
  
  // Form state
  const [formData, setFormData] = useState({
    // Public profile
    generalPreferences: {
      inputMethod: 'text',
      reflectionFrequency: 'daily',
      languagePreferences: 'english'
    },
    privacySettings: {
      localStorageOnly: true,
      allowPersonalization: true,
      enableSync: false
    },
    
    // Private profile
    spiritualJourneyStage: 'beginning',
    primaryGoals: ['knowledge', 'practice'],
    knowledgeLevel: 'intermediate',
    lifeStage: 'adult',
    communityConnection: 'connected',
    culturalBackground: '',
    reflectionStyle: 'thoughtful',
    guidancePreferences: ['practical', 'quranic'],
    topicsOfInterest: []
  });
  
  // Handle form input changes
  const handleChange = (field: string, value: any) => {
    // Parse the nested field path
    const fieldPath = field.split('.');
    
    if (fieldPath.length === 1) {
      setFormData(prev => ({ ...prev, [field]: value }));
    } else if (fieldPath.length === 2) {
      const [parent, child] = fieldPath;
      setFormData(prev => ({
        ...prev,
        [parent]: { ...prev[parent as keyof typeof prev], [child]: value }
      }));
    }
  };
  
  // Handle array field updates (checkboxes, multi-select)
  const handleArrayChange = (field: string, value: string, checked: boolean) => {
    setFormData(prev => {
      const currentArray = prev[field as keyof typeof prev] as string[];
      let newArray;
      
      if (checked) {
        newArray = [...currentArray, value];
      } else {
        newArray = currentArray.filter(item => item !== value);
      }
      
      return { ...prev, [field]: newArray };
    });
  };
  
  // Save profile data
  const handleSubmit = async () => {
    try {
      // Create public profile
      await updateProfile({
        generalPreferences: formData.generalPreferences,
        privacySettings: formData.privacySettings
      }, {
        spiritualJourneyStage: formData.spiritualJourneyStage,
        primaryGoals: formData.primaryGoals,
        knowledgeLevel: formData.knowledgeLevel,
        lifeStage: formData.lifeStage,
        communityConnection: formData.communityConnection,
        culturalBackground: formData.culturalBackground,
        reflectionStyle: formData.reflectionStyle,
        guidancePreferences: formData.guidancePreferences,
        topicsOfInterest: formData.topicsOfInterest
      });
      
      // Call onComplete callback
      onComplete();
    } catch (error) {
      console.error('Error saving profile:', error);
      // Show error to user
    }
  };
  
  // Render based on step
  if (step === 1) {
    return (
      <Card className="w-full max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle>Welcome to SahabAI</CardTitle>
          <CardDescription>
            Let's set up your personal reflection companion
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="mb-6">
            SahabAI is designed to help you reflect on your spiritual journey.
            To provide personalized guidance, we need to understand a bit about you.
            The information you share is encrypted and remains private.
          </p>
          
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Privacy First</h3>
            <div className="flex items-start space-x-2">
              <Checkbox 
                id="privacy-local" 
                checked={formData.privacySettings.localStorageOnly}
                onCheckedChange={(checked) => 
                  handleChange('privacySettings.localStorageOnly', Boolean(checked))
                }
              />
              <div className="grid gap-1.5 leading-none">
                <Label htmlFor="privacy-local">Store my reflections locally only</Label>
                <p className="text-sm text-muted-foreground">
                  Your reflections will never leave your device
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-2">
              <Checkbox 
                id="privacy-personalize" 
                checked={formData.privacySettings.allowPersonalization}
                onCheckedChange={(checked) => 
                  handleChange('privacySettings.allowPersonalization', Boolean(checked))
                }
              />
              <div className="grid gap-1.5 leading-none">
                <Label htmlFor="privacy-personalize">Personalize guidance based on my reflections</Label>
                <p className="text-sm text-muted-foreground">
                  Allow the app to learn from your reflection patterns to provide better guidance
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-2">
              <Checkbox 
                id="privacy-sync" 
                checked={formData.privacySettings.enableSync}
                onCheckedChange={(checked) => 
                  handleChange('privacySettings.enableSync', Boolean(checked))
                }
              />
              <div className="grid gap-1.5 leading-none">
                <Label htmlFor="privacy-sync">Enable secure sync across devices</Label>
                <p className="text-sm text-muted-foreground">
                  Your encrypted profile can be synchronized between your devices
                </p>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="ghost">Skip for Now</Button>
          <Button onClick={() => setStep(2)}>Continue</Button>
        </CardFooter>
      </Card>
    );
  }
  
  if (step === 2) {
    return (
      <Card className="w-full max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle>Tell Us About Yourself</CardTitle>
          <CardDescription>
            Help us personalize your reflection experience
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-3 w-full mb-6">
              <TabsTrigger value="personal">Personal</TabsTrigger>
              <TabsTrigger value="spiritual">Spiritual</TabsTrigger>
              <TabsTrigger value="preferences">Preferences</TabsTrigger>
            </TabsList>
            
            <TabsContent value="personal" className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="life-stage">Life Stage</Label>
                <Select 
                  value={formData.lifeStage}
                  onValueChange={value => handleChange('lifeStage', value)}
                >
                  <SelectTrigger id="life-stage">
                    <SelectValue placeholder="Select your life stage" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="young-adult">Young Adult</SelectItem>
                    <SelectItem value="adult">Adult</SelectItem>
                    <SelectItem value="parent">Parent</SelectItem>
                    <SelectItem value="elder">Elder</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="cultural-background">Cultural Background (Optional)</Label>
                <Input 
                  id="cultural-background" 
                  placeholder="Your cultural context"
                  value={formData.culturalBackground}
                  onChange={e => handleChange('culturalBackground', e.target.value)}
                />
                <p className="text-sm text-muted-foreground">
                  This helps contextualize guidance to your cultural background
                </p>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="community-connection">Community Connection</Label>
                <RadioGroup 
                  value={formData.communityConnection}
                  onValueChange={value => handleChange('communityConnection', value)}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="isolated" id="isolated" />
                    <Label htmlFor="isolated">Isolated</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="somewhat-connected" id="somewhat-connected" />
                    <Label htmlFor="somewhat-connected">Somewhat Connected</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="connected" id="connected" />
                    <Label htmlFor="connected">Connected</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="very-connected" id="very-connected" />
                    <Label htmlFor="very-connected">Very Connected</Label>
                  </div>
                </RadioGroup>
              </div>
            </TabsContent>
            
            <TabsContent value="spiritual" className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="journey-stage">Spiritual Journey Stage</Label>
                <Select 
                  value={formData.spiritualJourneyStage}
                  onValueChange={value => handleChange('spiritualJourneyStage', value)}
                >
                  <SelectTrigger id="journey-stage">
                    <SelectValue placeholder="Select your journey stage" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginning">Beginning</SelectItem>
                    <SelectItem value="exploring">Exploring</SelectItem>
                    <SelectItem value="practicing">Practicing</SelectItem>
                    <SelectItem value="deepening">Deepening</SelectItem>
                    <SelectItem value="advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="knowledge-level">Knowledge Level</Label>
                <Select 
                  value={formData.knowledgeLevel}
                  onValueChange={value => handleChange('knowledgeLevel', value)}
                >
                  <SelectTrigger id="knowledge-level">
                    <SelectValue placeholder="Select your knowledge level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">Beginner</SelectItem>
                    <SelectItem value="intermediate">Intermediate</SelectItem>
                    <SelectItem value="advanced">Advanced</SelectItem>
                    <SelectItem value="scholar">Scholar</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid gap-2">
                <Label>Primary Spiritual Goals</Label>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="goal-knowledge" 
                      checked={formData.primaryGoals.includes('knowledge')}
                      onCheckedChange={(checked) => 
                        handleArrayChange('primaryGoals', 'knowledge', Boolean(checked))
                      }
                    />
                    <Label htmlFor="goal-knowledge">Knowledge</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="goal-practice" 
                      checked={formData.primaryGoals.includes('practice')}
                      onCheckedChange={(checked) => 
                        handleArrayChange('primaryGoals', 'practice', Boolean(checked))
                      }
                    />
                    <Label htmlFor="goal-practice">Practice</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="goal-community" 
                      checked={formData.primaryGoals.includes('community')}
                      onCheckedChange={(checked) => 
                        handleArrayChange('primaryGoals', 'community', Boolean(checked))
                      }
                    />
                    <Label htmlFor="goal-community">Community</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="goal-spiritual-growth" 
                      checked={formData.primaryGoals.includes('spiritual-growth')}
                      onCheckedChange={(checked) => 
                        handleArrayChange('primaryGoals', 'spiritual-growth', Boolean(checked))
                      }
                    />
                    <Label htmlFor="goal-spiritual-growth">Spiritual Growth</Label>
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="preferences" className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="reflection-style">Reflection Style</Label>
                <Select 
                  value={formData.reflectionStyle}
                  onValueChange={value => handleChange('reflectionStyle', value)}
                >
                  <SelectTrigger id="reflection-style">
                    <SelectValue placeholder="Select your reflection style" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="brief">Brief & Concise</SelectItem>
                    <SelectItem value="thoughtful">Thoughtful & Balanced</SelectItem>
                    <SelectItem value="detailed">Detailed & Analytical</SelectItem>
                    <SelectItem value="emotional">Emotional & Expressive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="input-method">Preferred Input Method</Label>
                <Select 
                  value={formData.generalPreferences.inputMethod}
                  onValueChange={value => handleChange('generalPreferences.inputMethod', value)}
                >
                  <SelectTrigger id="input-method">
                    <SelectValue placeholder="Select your input method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text">Text</SelectItem>
                    <SelectItem value="voice">Voice</SelectItem>
                    <SelectItem value="both">Both</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid gap-2">
                <Label>Guidance Preferences</Label>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="guidance-quranic" 
                      checked={formData.guidancePreferences.includes('quranic')}
                      onCheckedChange={(checked) => 
                        handleArrayChange('guidancePreferences', 'quranic', Boolean(checked))
                      }
                    />
                    <Label htmlFor="guidance-quranic">Quranic</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="guidance-hadith" 
                      checked={formData.guidancePreferences.includes('hadith')}
                      onCheckedChange={(checked) => 
                        handleArrayChange('guidancePreferences', 'hadith', Boolean(checked))
                      }
                    />
                    <Label htmlFor="guidance-hadith">Hadith-based</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="guidance-practical" 
                      checked={formData.guidancePreferences.includes('practical')}
                      onCheckedChange={(checked) => 
                        handleArrayChange('guidancePreferences', 'practical', Boolean(checked))
                      }
                    />
                    <Label htmlFor="guidance-practical">Practical</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="guidance-scholarly" 
                      checked={formData.guidancePreferences.includes('scholarly')}
                      onCheckedChange={(checked) => 
                        handleArrayChange('guidancePreferences', 'scholarly', Boolean(checked))
                      }
                    />
                    <Label htmlFor="guidance-scholarly">Scholarly</Label>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={() => setStep(1)}>Back</Button>
          <Button onClick={handleSubmit}>Complete Setup</Button>
        </CardFooter>
      </Card>
    );
  }
  
  return null;
} 