import React, { useState, useEffect } from 'react';
import { ProfileIntegration } from '../components/ProfileIntegration';
import { ProfileOnboarding } from '../components/ProfileOnboarding';
import { ProfileLearner } from '../components/ProfileLearner';
import { PrivacySettings } from '../components/PrivacySettings';
import { KeyTransfer } from '../components/KeyTransfer';
import { useProfile } from '../hooks/useProfile';
import { getPersonalizedResponse } from '../lib/privateApiClient';

/**
 * This is an example of how to integrate the privacy-focused profile system
 * into your SahabAI application. This demonstrates:
 * 
 * 1. Setting up the profile integration at the app level
 * 2. Handling onboarding for new users
 * 3. Using profile data for personalization
 * 4. Learning from user interactions
 * 5. Providing privacy controls to users
 */

// Root application wrapper
export function AppWithProfiles() {
  // In a real app, you would get this from auth
  const userId = 'user-123'; // Or null if not logged in
  
  return (
    <ProfileIntegration userId={userId}>
      <MainApplication />
    </ProfileIntegration>
  );
}

// Main application with profile-aware functionality
function MainApplication() {
  const { publicProfile, privateProfile, isLoading } = useProfile();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [activeView, setActiveView] = useState('reflections');
  
  // Check if user needs onboarding
  useEffect(() => {
    if (!isLoading && !publicProfile) {
      setShowOnboarding(true);
    }
  }, [isLoading, publicProfile]);
  
  // Handle onboarding completion
  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
    setActiveView('reflections');
  };
  
  // If still in onboarding, show the onboarding flow
  if (showOnboarding) {
    return <ProfileOnboarding onComplete={handleOnboardingComplete} />;
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <header className="mb-8">
        <h1 className="text-2xl font-bold mb-4">SahabAI</h1>
        <nav className="flex space-x-4">
          <button 
            onClick={() => setActiveView('reflections')}
            className={`px-4 py-2 rounded ${activeView === 'reflections' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}
          >
            Reflections
          </button>
          <button 
            onClick={() => setActiveView('privacy')}
            className={`px-4 py-2 rounded ${activeView === 'privacy' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}
          >
            Privacy Settings
          </button>
          <button 
            onClick={() => setActiveView('key-transfer')}
            className={`px-4 py-2 rounded ${activeView === 'key-transfer' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}
          >
            Key Management
          </button>
        </nav>
      </header>
      
      <main>
        {activeView === 'reflections' && <ReflectionView />}
        {activeView === 'privacy' && <PrivacySettings />}
        {activeView === 'key-transfer' && <KeyTransfer />}
      </main>
    </div>
  );
}

// Example reflection component using personalization
function ReflectionView() {
  const { getProfileForAI } = useProfile();
  const [reflection, setReflection] = useState('');
  const [response, setResponse] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Submit a reflection and get personalized response
  const handleSubmitReflection = async () => {
    if (!reflection.trim()) return;
    
    try {
      setIsSubmitting(true);
      
      // Get profile context for personalization
      const profileContext = await getProfileForAI();
      
      // Get conversation history (simplified example)
      const conversationHistory: any[] = [];
      
      // Get personalized response from AI
      const aiResponse = await getPersonalizedResponse(
        reflection,
        profileContext,
        conversationHistory
      );
      
      setResponse(aiResponse);
    } catch (error) {
      console.error('Error getting personalized response:', error);
      // Show error to user
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Daily Reflection</h2>
      
      <div>
        <textarea
          value={reflection}
          onChange={(e) => setReflection(e.target.value)}
          placeholder="Share your reflection here..."
          className="w-full h-32 p-3 border rounded-md"
        />
        
        <button
          onClick={handleSubmitReflection}
          disabled={isSubmitting || !reflection.trim()}
          className="mt-2 px-4 py-2 bg-primary text-primary-foreground rounded-md disabled:opacity-50"
        >
          {isSubmitting ? 'Submitting...' : 'Submit Reflection'}
        </button>
      </div>
      
      {response && (
        <div className="bg-muted p-4 rounded-md">
          <h3 className="font-medium mb-2">Response</h3>
          <p className="mb-4">{response.understanding}</p>
          
          <h4 className="font-medium mb-2">Reflection Questions</h4>
          <ul className="list-disc pl-5 space-y-2">
            {response.questions.map((question: string, i: number) => (
              <li key={i}>{question}</li>
            ))}
          </ul>
          
          {/* This component silently learns from the interaction */}
          <ProfileLearner
            userReflection={reflection}
            aiResponse={response}
          />
        </div>
      )}
    </div>
  );
}

// Usage in your application
export default function IntegrationExample() {
  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Profile System Integration Example</h1>
      <p className="mb-8 text-muted-foreground">
        This example demonstrates how to integrate the privacy-focused profile system
        into your SahabAI application. Check the code for implementation details.
      </p>
      
      <div className="border rounded-lg p-4">
        <AppWithProfiles />
      </div>
    </div>
  );
} 