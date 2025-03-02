import { useProfile } from "@/hooks/useProfile";
import { createPersonalizationContext } from "@/utils/personalizationUtils";
import { Profile, PrivacySettings } from "@/types/profile";

/**
 * Hook for accessing personalization features in the application.
 * Provides personalization context for AI prompts and other personalization-related utilities.
 */
export function usePersonalization() {
  const { publicProfile, privateProfile, isLoading } = useProfile();
  
  /**
   * Gets the personalization context object for API requests.
   * If personalization is disabled or not available, returns null.
   */
  const getPersonalizationContext = () => {
    if (isLoading) {
      console.log("Profile is still loading");
      return null;
    }
    
    if (!publicProfile) {
      console.log("Public profile is not available");
      return null;
    }
    
    // Debug profile state
    console.log("[DEBUG getPersonalizationContext] Public profile:", {
      userId: publicProfile.userId,
      allowPersonalization: publicProfile.privacySettings?.allowPersonalization,
    });
    
    // Check if personalization is enabled
    if (!publicProfile.privacySettings?.allowPersonalization) {
      console.log("[DEBUG getPersonalizationContext] Personalization is disabled");
      return null;
    }
    
    console.log("[DEBUG getPersonalizationContext] Private profile available:", !!privateProfile);
    if (privateProfile) {
      console.log("[DEBUG getPersonalizationContext] Private profile data:", {
        knowledgeLevel: privateProfile.knowledgeLevel,
        topicsCount: privateProfile.topicsOfInterest?.length || 0,
        goalsCount: privateProfile.primaryGoals?.length || 0,
        spiritualJourney: privateProfile.spiritualJourneyStage,
        reflectionStyle: privateProfile.reflectionStyle,
      });
      
      // Show the FULL private profile object for debugging
      console.log("[DEBUG getPersonalizationContext] FULL PRIVATE PROFILE:", JSON.stringify(privateProfile, null, 2));
      
      // IMPORTANT: Return the raw personalization data as an object for API requests
      // This is what the server expects, not the formatted string
      return {
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
    }
    
    // For detailed logging
    console.log("[DEBUG getPersonalizationContext] WARNING: No private profile data available");
    return null;
  };
  
  /**
   * Gets the formatted personalization context string for prompt enhancement.
   * This is for local prompt manipulation, not for API requests.
   */
  const getPersonalizationPromptContext = () => {
    if (!isPersonalizationEnabled() || !privateProfile) {
      return "";
    }
    
    // Create a profile object from public and private profiles
    const profile: Profile = {
      privacySettings: {
        // Ensure all required properties are present
        allowPersonalization: publicProfile!.privacySettings.allowPersonalization,
        localStorageOnly: publicProfile!.privacySettings.localStorageOnly,
        enableSync: publicProfile!.privacySettings.enableSync || false
      },
      privateProfile: privateProfile
    };
    
    const context = createPersonalizationContext(profile);
    
    // Detailed logging for debugging
    console.log("[DEBUG getPersonalizationPromptContext] Generated context length:", context.length);
    if (context.length > 0) {
      // Log first 100 chars of context for debugging
      console.log("[DEBUG getPersonalizationPromptContext] Context preview:", context.substring(0, 100) + "...");
    } else {
      console.log("[DEBUG getPersonalizationPromptContext] WARNING: Empty context string returned");
    }
    
    return context;
  };
  
  /**
   * Checks if personalization is enabled for the current user.
   */
  const isPersonalizationEnabled = () => {
    return !!publicProfile?.privacySettings?.allowPersonalization && !!privateProfile;
  };
  
  /**
   * Applies personalization context to a prompt.
   * @param basePrompt The original prompt to modify
   * @returns The modified prompt with personalization context
   */
  const personalizePrompt = (basePrompt: string): string => {
    const context = getPersonalizationPromptContext();
    
    if (!context) {
      console.log("No personalization context available");
      return basePrompt;
    }
    
    console.log("Adding personalization context to prompt");
    return `${context}\n\n${basePrompt}`;
  };
  
  return {
    getPersonalizationContext,
    getPersonalizationPromptContext,
    isPersonalizationEnabled,
    personalizePrompt,
    isLoading
  };
} 