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
  const { publicProfile, privateProfile, isLoading: profileLoading } = useProfile();

  // Initialize from localStorage on mount
  useEffect(() => {
    // Check both possible localStorage keys for backward compatibility
    const savedPref = localStorage.getItem('sahabai_personalization_enabled') || 
                      localStorage.getItem('personalizationEnabled');
    
    if (savedPref) {
      const isEnabled = savedPref === 'true';
      console.log('[PersonalizationProvider] Initializing from localStorage:', { isEnabled });
      setPersonalizationEnabled(isEnabled);
    } else if (publicProfile?.privacySettings?.allowPersonalization) {
      // If no localStorage value but profile has it enabled, use that
      console.log('[PersonalizationProvider] Initializing from profile:', { 
        allowPersonalization: publicProfile.privacySettings.allowPersonalization 
      });
      setPersonalizationEnabled(publicProfile.privacySettings.allowPersonalization);
    }
  }, [publicProfile]);

  // Update context when personalization is enabled and profile is available
  useEffect(() => {
    console.log('[PersonalizationProvider] Checking for context update:', { 
      personalizationEnabled, 
      hasPrivateProfile: !!privateProfile 
    });
    
    if (personalizationEnabled && privateProfile) {
      console.log('[PersonalizationProvider] Updating personalization context from profile');
      
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
      
      // Log what we're setting for debugging
      console.log('[PersonalizationProvider] Setting context with:', {
        knowledgeLevel: context.knowledgeLevel,
        topicsCount: context.topicsOfInterest?.length || 0,
        goalsCount: context.primaryGoals?.length || 0,
        spiritualJourney: context.spiritualJourneyStage,
      });
      
      setPersonalizationContext(context);
    } else if (personalizationEnabled) {
      // If personalization is enabled but no profile, try to load from localStorage
      console.log('[PersonalizationProvider] No private profile, checking localStorage fallback');
      
      try {
        // Try multiple localStorage keys for backward compatibility
        const localPrefs = localStorage.getItem('sahabai_private_preferences') || 
                          localStorage.getItem('personalPreferences') ||
                          localStorage.getItem(`encrypted_profile_${publicProfile?.userId}`);
        
        if (localPrefs) {
          console.log('[PersonalizationProvider] Found preferences in localStorage');
          
          let parsedPrefs;
          try {
            parsedPrefs = JSON.parse(localPrefs);
            
            // If this is an encrypted profile, extract the data
            if (parsedPrefs.data && parsedPrefs.iv) {
              console.log('[PersonalizationProvider] Found encrypted profile in localStorage, attempting to decrypt');
              // We can't decrypt here, so just use what we have
              parsedPrefs = {
                knowledgeLevel: 'intermediate',
                topicsOfInterest: ['general'],
                primaryGoals: ['spiritual_growth'],
                spiritualJourneyStage: 'practicing',
                reflectionStyle: 'balanced',
                guidancePreferences: ['practical', 'spiritual']
              };
            }
          } catch (parseError) {
            console.error('[PersonalizationProvider] Error parsing localStorage data:', parseError);
            parsedPrefs = null;
          }
          
          // Validate the parsed preferences
          if (parsedPrefs && typeof parsedPrefs === 'object') {
            console.log('[PersonalizationProvider] Setting context from localStorage with:', {
              knowledgeLevel: parsedPrefs.knowledgeLevel,
              topicsCount: parsedPrefs.topicsOfInterest?.length || 0,
              goalsCount: parsedPrefs.primaryGoals?.length || 0,
              spiritualJourney: parsedPrefs.spiritualJourneyStage,
            });
            
            setPersonalizationContext(parsedPrefs);
          } else {
            console.error('[PersonalizationProvider] Invalid preferences format in localStorage');
            setPersonalizationContext(null);
          }
        } else {
          console.log('[PersonalizationProvider] No preferences found in localStorage');
          setPersonalizationContext(null);
        }
      } catch (err) {
        console.error('[PersonalizationProvider] Error loading from localStorage:', err);
        setPersonalizationContext(null);
      }
    } else {
      console.log('[PersonalizationProvider] Personalization disabled, clearing context');
      setPersonalizationContext(null);
    }
  }, [personalizationEnabled, privateProfile, publicProfile?.userId]);

  // Toggle personalization and save to localStorage
  const togglePersonalization = () => {
    const newValue = !personalizationEnabled;
    console.log('[PersonalizationProvider] Toggling personalization:', { newValue });
    setPersonalizationEnabled(newValue);
    
    // Update both localStorage keys for consistency
    localStorage.setItem('personalizationEnabled', newValue.toString());
    localStorage.setItem('sahabai_personalization_enabled', newValue.toString());
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