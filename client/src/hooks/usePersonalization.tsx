import React, { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { useProfile } from './useProfile'; // Import profile hook

// Define the PrivateProfile interface here since we're having import issues
interface PrivateProfile {
  knowledgeLevel?: string;
  topicsOfInterest?: string[];
  primaryGoals?: string[];
  spiritualJourneyStage?: string;
  lifeStage?: string;
  communityConnection?: string;
  culturalBackground?: string;
  reflectionStyle?: string;
  guidancePreferences?: string[];
}

// Define the context state shape
interface PersonalizationContextState {
  personalizationEnabled: boolean;
  personalizationContext: Partial<PrivateProfile> | null;
  togglePersonalization: () => void;
  getPersonalizationContext: () => Partial<PrivateProfile> | null;
  isPersonalizationEnabled: () => boolean;
  personalizePrompt: (basePrompt: string) => string;
  isLoading: boolean;
}

// Create context with default values
const PersonalizationContext = createContext<PersonalizationContextState>({
  personalizationEnabled: false,
  personalizationContext: null,
  togglePersonalization: () => {},
  getPersonalizationContext: () => null,
  isPersonalizationEnabled: () => false,
  personalizePrompt: (basePrompt: string) => basePrompt,
  isLoading: false,
});

// Provider component that wraps app
export const PersonalizationProvider = ({ children }: { children: ReactNode }) => {
  const [personalizationEnabled, setPersonalizationEnabled] = useState(false);
  const [personalizationContext, setPersonalizationContext] = useState<Partial<PrivateProfile> | null>(null);
  const { privateProfile, isLoading: profileLoading } = useProfile();

  // Initialize from localStorage on mount
  useEffect(() => {
    const savedPref = localStorage.getItem('personalizationEnabled');
    if (savedPref) {
      const isEnabled = savedPref === 'true';
      setPersonalizationEnabled(isEnabled);
    }
  }, []);

  // Update context when personalization is enabled and profile is available
  useEffect(() => {
    if (personalizationEnabled && privateProfile) {
      const context: Partial<PrivateProfile> = {
        knowledgeLevel: privateProfile.knowledgeLevel,
        topicsOfInterest: privateProfile.topicsOfInterest,
        primaryGoals: privateProfile.primaryGoals,
        spiritualJourneyStage: privateProfile.spiritualJourneyStage,
        lifeStage: privateProfile.lifeStage,
        communityConnection: privateProfile.communityConnection,
        culturalBackground: privateProfile.culturalBackground,
        reflectionStyle: privateProfile.reflectionStyle,
        guidancePreferences: privateProfile.guidancePreferences,
      };
      setPersonalizationContext(context);
    } else {
      setPersonalizationContext(null);
    }
  }, [personalizationEnabled, privateProfile]);

  // Toggle personalization and save to localStorage
  const togglePersonalization = () => {
    const newValue = !personalizationEnabled;
    setPersonalizationEnabled(newValue);
    localStorage.setItem('personalizationEnabled', newValue.toString());
  };

  // Function to get personalization context - safely
  const getPersonalizationContext = () => {
    return personalizationContext;
  };

  // Function to check if personalization is enabled
  const isPersonalizationEnabled = () => {
    return personalizationEnabled && !!personalizationContext;
  };
  
  // Function to personalize a prompt with user preferences
  const personalizePrompt = (basePrompt: string): string => {
    if (!isPersonalizationEnabled() || !personalizationContext) {
      return basePrompt;
    }
    
    try {
      // Create a string representation of the personalization context
      const contextString = Object.entries(personalizationContext)
        .filter(([_, value]) => value !== undefined && value !== null)
        .map(([key, value]) => {
          if (Array.isArray(value)) {
            return `${key}: ${value.join(', ')}`;
          }
          return `${key}: ${value}`;
        })
        .join('\n');
      
      // Add the personalization context to the prompt
      return `${basePrompt}\n\nUser Personalization:\n${contextString}`;
    } catch (error) {
      console.error('Error personalizing prompt:', error);
      return basePrompt; // Fallback to the base prompt on error
    }
  };

  return (
    <PersonalizationContext.Provider 
      value={{ 
        personalizationEnabled, 
        personalizationContext, 
        togglePersonalization,
        getPersonalizationContext,
        isPersonalizationEnabled,
        personalizePrompt,
        isLoading: profileLoading,
      }}
    >
      {children}
    </PersonalizationContext.Provider>
  );
};

// Create hook for accessing the context
export function usePersonalization() {
  const context = useContext(PersonalizationContext);
  if (context === undefined) {
    throw new Error('usePersonalization must be used within a PersonalizationProvider');
  }
  return context;
} 