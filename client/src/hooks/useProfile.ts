import { useState, useEffect, useCallback } from 'react';
import { 
  PublicProfile,
  PrivateProfile,
  EncryptedProfileData
} from '../lib/types';
import { 
  encryptData, 
  decryptData, 
  getEncryptionKey 
} from '../lib/encryption';
import { api } from '../lib/api';

// Generate a random IV for encryption
function generateIv(): Uint8Array {
  return window.crypto.getRandomValues(new Uint8Array(12));
}

// Main hook for managing user profiles with privacy
export function useProfile() {
  // State for public profile (non-sensitive data)
  const [publicProfile, setPublicProfile] = useState<PublicProfile | null>(null);
  
  // State for private profile (sensitive data, stored encrypted)
  const [privateProfile, setPrivateProfile] = useState<PrivateProfile | null>(null);
  
  // Loading and error states
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  // Get user ID from public profile
  const userId = publicProfile?.userId;
  
  // Function to load both profiles (public and private)
  async function loadProfiles() {
    try {
      setIsLoading(true);
      setError(null);
      
      // Fetch public profile from API
      const profile = await api.getUserProfile();
      setPublicProfile(profile);
      
      // If we have a user ID, load private profile
      if (profile?.userId) {
        await loadPrivateProfile(profile.userId);
      }
      
    } catch (err) {
      console.error('Error loading profiles:', err);
      setError(err instanceof Error ? err : new Error('Failed to load profile'));
    } finally {
      setIsLoading(false);
    }
  }
  
  // Load private profile (encrypted data)
  const loadPrivateProfile = async (userId: string) => {
    try {
      // Get encryption key
      const key = await getEncryptionKey();
      
      // Get encrypted data from API
      const encryptedData = await api.getEncryptedProfileData(userId);
      
      // If no encrypted data, return
      if (!encryptedData.data || encryptedData.data.length === 0) {
        console.log('No encrypted profile data found');
        return;
      }
      
      // Convert IV array to Uint8Array
      const iv = new Uint8Array(encryptedData.iv);
      
      // Decrypt data
      const decryptedData = await decryptData(encryptedData.data, key, iv);
      
      // Parse decrypted data
      const privateProfileData = JSON.parse(decryptedData) as PrivateProfile;
      setPrivateProfile(privateProfileData);
      
    } catch (err) {
      console.error('Error loading private profile:', err);
      // Don't surface error to user for private data, just log it
      // This allows graceful degradation if private data can't be loaded
    }
  };
  
  // Load profiles on mount
  useEffect(() => {
    loadProfiles();
  }, []);
  
  // Update profile - handles both public and private updates
  const updateProfile = async (
    publicUpdates?: Partial<PublicProfile>,
    privateUpdates?: Partial<PrivateProfile>
  ) => {
    try {
      setIsLoading(true);
      
      // Handle case where public profile doesn't exist yet
      if (!publicProfile && publicUpdates) {
        // Create new profile
        const newPublicProfile = await api.createUserProfile(publicUpdates);
        setPublicProfile(newPublicProfile);
        
        // If we also have private updates, handle those
        if (privateUpdates && newPublicProfile.userId) {
          await updatePrivateProfile(newPublicProfile.userId, privateUpdates);
        }
        
        return newPublicProfile;
      }
      
      // Handle updates to existing profile
      if (publicUpdates && publicProfile) {
        // Update public profile
        const updatedPublicProfile = await api.updateUserProfile({
          ...publicUpdates,
          userId: publicProfile.userId,
        });
        setPublicProfile(updatedPublicProfile);
        
        // If we also have private updates, handle those
        if (privateUpdates && updatedPublicProfile.userId) {
          await updatePrivateProfile(updatedPublicProfile.userId, privateUpdates);
        }
        
        return updatedPublicProfile;
      }
      
      // If we only have private updates
      if (privateUpdates && userId) {
        await updatePrivateProfile(userId, privateUpdates);
      }
      
      return publicProfile;
    } catch (err) {
      console.error('Error updating profile:', err);
      setError(err instanceof Error ? err : new Error('Failed to update profile'));
      throw err;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Helper to update private profile
  const updatePrivateProfile = async (userId: string, updates: Partial<PrivateProfile>) => {
    try {
      // Get the current private profile or create new one
      const currentPrivate = privateProfile || {
        spiritualJourneyStage: '',
        primaryGoals: [],
        knowledgeLevel: '',
        lifeStage: '',
        communityConnection: '',
        culturalBackground: '',
        reflectionStyle: '',
        guidancePreferences: [],
        topicsOfInterest: [],
      };
      
      // Merge updates with current profile
      const updatedPrivateProfile = {
        ...currentPrivate,
        ...updates,
        // Handle nested updates
        dynamicAttributes: {
          ...currentPrivate.dynamicAttributes,
          ...updates.dynamicAttributes,
        },
        observedPatterns: {
          ...currentPrivate.observedPatterns,
          ...updates.observedPatterns,
        },
        recentInteractions: {
          ...currentPrivate.recentInteractions,
          ...updates.recentInteractions,
        },
      };
      
      // Get encryption key
      const key = await getEncryptionKey();
      
      // Generate IV for encryption
      const iv = generateIv();
      
      // Encrypt the private profile
      const encryptedData = await encryptData(
        JSON.stringify(updatedPrivateProfile),
        key,
        iv
      );
      
      // Save encrypted data to API
      await api.updateEncryptedProfileData(userId, {
        data: encryptedData,
        iv: Array.from(iv),
      });
      
      // Update local state
      setPrivateProfile(updatedPrivateProfile);
      
    } catch (err) {
      console.error('Error updating private profile:', err);
      throw err;
    }
  };
  
  // Reset profile (delete all data)
  const resetProfile = async () => {
    try {
      setIsLoading(true);
      
      if (!userId) {
        throw new Error('No user profile to reset');
      }
      
      // Delete profile from API
      await api.deleteUserProfile();
      
      // Clear local state
      setPublicProfile(null);
      setPrivateProfile(null);
      
      // Clear localStorage keys related to profiles
      localStorage.removeItem('sahabai_encryption_key');
      localStorage.removeItem('sahabai_public_profile');
      localStorage.removeItem('sahabai_encrypted_profile');
      
      return true;
    } catch (err) {
      console.error('Error resetting profile:', err);
      setError(err instanceof Error ? err : new Error('Failed to reset profile'));
      throw err;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Get profile data for AI context (respecting privacy settings)
  const getProfileForAI = useCallback(async () => {
    if (!publicProfile) {
      return {
        preferences: {
          language: 'english',
        },
      };
    }
    
    // Check if personalization is allowed
    const allowPersonalization = publicProfile.privacySettings.allowPersonalization;
    
    // If personalization is disabled, return minimal profile
    if (!allowPersonalization) {
      return {
        preferences: {
          language: publicProfile.generalPreferences.languagePreferences || 'english',
          inputMethod: publicProfile.generalPreferences.inputMethod,
          reflectionFrequency: publicProfile.generalPreferences.reflectionFrequency,
        },
      };
    }
    
    // If no private profile, return only public data
    if (!privateProfile) {
      return {
        preferences: {
          language: publicProfile.generalPreferences.languagePreferences || 'english',
          inputMethod: publicProfile.generalPreferences.inputMethod,
          reflectionFrequency: publicProfile.generalPreferences.reflectionFrequency,
        },
        engagementLevel: publicProfile.usageStats 
          ? {
              reflectionCount: publicProfile.usageStats.reflectionCount,
              streakDays: publicProfile.usageStats.streakDays,
            }
          : undefined,
      };
    }
    
    // Return full profile for AI, but sanitized
    return {
      preferences: {
        language: publicProfile.generalPreferences.languagePreferences || 'english',
        inputMethod: publicProfile.generalPreferences.inputMethod,
        reflectionFrequency: publicProfile.generalPreferences.reflectionFrequency,
      },
      
      spiritualContext: {
        journeyStage: privateProfile.spiritualJourneyStage,
        knowledgeLevel: privateProfile.knowledgeLevel,
        primaryGoals: privateProfile.primaryGoals,
        lifeStage: privateProfile.lifeStage,
        // Exclude potentially sensitive community and cultural data
      },
      
      reflectionPreferences: {
        style: privateProfile.reflectionStyle,
        guidanceTypes: privateProfile.guidancePreferences,
      },
      
      interests: privateProfile.topicsOfInterest,
      
      // Only include if they exist
      recentTopics: privateProfile.recentInteractions?.lastTopics,
      
      // Calculate engagement level from dynamic attributes
      engagementPatterns: privateProfile.dynamicAttributes
        ? {
            topEngagedTopics: getTopValues(privateProfile.dynamicAttributes.topicsEngagedWith, 3),
            preferredReferences: getTopValues(privateProfile.dynamicAttributes.preferredReferences, 2),
            languageLevel: Math.round(privateProfile.dynamicAttributes.languageComplexity || 5),
          }
        : undefined,
    };
  }, [publicProfile, privateProfile]);
  
  // Helper to get top values from a frequency map
  function getTopValues(map: Record<string, number> | undefined, count: number): string[] {
    if (!map) return [];
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .slice(0, count)
      .map(([key]) => key);
  }
  
  return {
    publicProfile,
    privateProfile,
    isLoading,
    error,
    updateProfile,
    resetProfile,
    getProfileForAI,
    refreshProfiles: loadProfiles,
  };
} 