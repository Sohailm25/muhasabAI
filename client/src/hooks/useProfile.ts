import { useState, useEffect, useCallback, useRef } from 'react';
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
import { API } from '../lib/api';

// Generate a random IV for encryption
function generateIv(): Uint8Array {
  return window.crypto.getRandomValues(new Uint8Array(12));
}

// Global initialization lock to prevent multiple profile creation attempts
const initializationLock = {
  isInitializing: false,
  promise: null as Promise<any> | null
};

// Main hook for managing user profiles with privacy
export function useProfile() {
  // State for public profile (non-sensitive data)
  const [publicProfile, setPublicProfile] = useState<PublicProfile | null>(null);
  
  // State for private profile (sensitive data, stored encrypted)
  const [privateProfile, setPrivateProfile] = useState<PrivateProfile | null>(null);
  
  // Loading and error states
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  // Track if this instance has attempted to load profiles
  const hasAttemptedLoad = useRef(false);
  
  // Get user ID from public profile
  const userId = publicProfile?.userId;
  
  // Check for authentication manually
  const isAuthenticated = !!localStorage.getItem('auth_token');
  
  // Function to load both profiles (public and private)
  async function loadProfiles() {
    // Don't attempt to load profiles if user isn't authenticated
    if (!isAuthenticated) {
      console.log('Not authenticated, skipping profile load');
      setIsLoading(false);
      hasAttemptedLoad.current = true;
      return;
    }
    
    // If already initializing elsewhere in the app, wait for that to complete
    if (initializationLock.isInitializing && initializationLock.promise) {
      try {
        await initializationLock.promise;
        // After the other initialization completes, check if we have a profile
        if (publicProfile) {
          return; // Profile is already loaded, no need to load again
        }
      } catch (err) {
        // Previous initialization failed, continue with our attempt
        console.error('Previous profile initialization failed:', err);
      }
    }

    // Create a promise to track this initialization
    let resolvePromise: (value: any) => void;
    let rejectPromise: (reason: any) => void;
    initializationLock.promise = new Promise((resolve, reject) => {
      resolvePromise = resolve;
      rejectPromise = reject;
    });
    
    initializationLock.isInitializing = true;
    
    try {
      setIsLoading(true);
      setError(null);
      
      // Fetch public profile from API
      try {
        const profile = await API.getUserProfile();
        setPublicProfile(profile);
        
        // If we have a user ID, load private profile
        if (profile?.userId) {
          await loadPrivateProfile(profile.userId);
        }
        
        // Resolve the initialization promise
        resolvePromise!(profile);
      } catch (err) {
        console.error('Error loading public profile:', err);
        // Check if this is an authentication error
        const errorMessage = err instanceof Error ? err.message : String(err);
        if (errorMessage.includes('Authentication') || errorMessage.includes('auth')) {
          // Do not set error state for auth issues - this is expected for unauthenticated users
          console.log('Authentication required for profile, user is likely not logged in');
        } else {
          // Set error for non-auth related issues
          setError(err instanceof Error ? err : new Error('Failed to load profile'));
        }
        rejectPromise!(err);
      }
      
      // Mark this instance as having attempted to load
      hasAttemptedLoad.current = true;
    } finally {
      setIsLoading(false);
      initializationLock.isInitializing = false;
    }
  }
  
  // Load private profile (encrypted data)
  const loadPrivateProfile = async (userId: string) => {
    try {
      // Get encryption key
      const key = await getEncryptionKey();
      
      // Get encrypted data from API
      const encryptedData = await API.getEncryptedProfileData(userId);
      
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
    // Only load profiles if user is authenticated and we haven't loaded yet
    if (isAuthenticated && !hasAttemptedLoad.current) {
      // Check if we're on a public page that doesn't need authentication
      const isPublicPage = 
        window.location.pathname === '/' || 
        window.location.pathname === '/login' || 
        window.location.pathname === '/register' ||
        window.location.pathname === '/about' ||
        window.location.pathname.startsWith('/public/');
      
      // Don't attempt profile loading on public pages even if token exists
      if (isPublicPage) {
        console.log('On public page, skipping profile load to avoid unnecessary requests');
        setIsLoading(false);
        hasAttemptedLoad.current = true;
        return;
      }
      
      // Only load on authenticated pages
      loadProfiles().catch(err => {
        console.error('Error loading profiles from API:', err);
        // If API profile loading fails, try to load from localStorage as fallback
        loadFromLocalStorage();
      });
    } else if (!isAuthenticated) {
      // Make sure to set loading to false if not authenticated
      setIsLoading(false);
      hasAttemptedLoad.current = false; // Reset the load flag when logged out
    }
  }, [isAuthenticated]);
  
  // Load profile data from localStorage as fallback when API fails
  const loadFromLocalStorage = () => {
    console.log('Attempting to load profile from localStorage as fallback');
    try {
      // Try to load personalization settings
      const allowPersonalization = localStorage.getItem('sahabai_personalization_enabled');
      const privatePrefsJson = localStorage.getItem('sahabai_private_preferences');
      
      let localPublicProfile = null;
      
      // Create minimal public profile with personalization settings if available
      if (allowPersonalization !== null) {
        localPublicProfile = {
          userId: userId || 'local-user',
          privacySettings: {
            allowPersonalization: allowPersonalization === 'true',
            localStorageOnly: true,
            enableSync: false
          },
          generalPreferences: {
            inputMethod: 'text',
            reflectionFrequency: 'daily',
            languagePreferences: 'english'
          },
          createdAt: new Date(),  // Use Date objects directly
          updatedAt: new Date(),  // Use Date objects directly
        } as PublicProfile;  // Type assertion to ensure compatibility
        
        // Set the public profile in state
        setPublicProfile(localPublicProfile);
        console.log('Set minimal public profile from localStorage');
      }
      
      // Load private profile from localStorage if available
      if (privatePrefsJson) {
        try {
          const localPrivatePrefs = JSON.parse(privatePrefsJson);
          
          // Create minimal private profile with stored preferences
          const localPrivateProfile = {
            ...getDefaultPrivateProfile(),
            ...localPrivatePrefs
          };
          
          // Set private profile in state
          setPrivateProfile(localPrivateProfile);
          console.log('Set private profile from localStorage');
        } catch (parseErr) {
          console.error('Error parsing private preferences from localStorage:', parseErr);
        }
      }
      
      setIsLoading(false);
      hasAttemptedLoad.current = true;
    } catch (err) {
      console.error('Error loading profile from localStorage:', err);
      setIsLoading(false);
      hasAttemptedLoad.current = true;
    }
  };
  
  // Update profile - handles both public and private updates
  const updateProfile = async (
    publicUpdates?: Partial<PublicProfile>,
    privateUpdates?: Partial<PrivateProfile>
  ): Promise<PublicProfile | null> => {
    // If profile initialization is in progress, wait for it to complete
    if (initializationLock.isInitializing && initializationLock.promise) {
      try {
        await initializationLock.promise;
        // After initialization completes, re-check our profile state
        if (!publicProfile && publicUpdates) {
          // The profile might have been loaded by another component
          const currentProfile = await API.getUserProfile().catch(() => null);
          if (currentProfile) {
            setPublicProfile(currentProfile as PublicProfile);
            
            // If we have private updates and now have a profile, handle those
            if (privateUpdates && currentProfile.userId) {
              await updatePrivateProfile(currentProfile.userId, privateUpdates);
            }
            
            return currentProfile as PublicProfile;
          }
        }
      } catch (err) {
        // Previous initialization failed, continue with our update
        console.error('Previous profile initialization failed:', err);
      }
    }
    
    // Set a local initialization lock if we're creating a profile
    let localLock = false;
    if (!publicProfile && publicUpdates && !initializationLock.isInitializing) {
      initializationLock.isInitializing = true;
      localLock = true;
    }
    
    try {
      setIsLoading(true);
      
      // If there are public updates, try to handle those first
      if (publicUpdates) {
        try {
          // Handle case where public profile doesn't exist yet
          if (!publicProfile && publicUpdates) {
            try {
              console.log('Checking if profile already exists...');
              const existingProfile = await API.getUserProfile() as PublicProfile;
              console.log('Profile already exists, using existing profile');
              setPublicProfile(existingProfile);
              
              // If we also have private updates, handle those
              if (privateUpdates && existingProfile.userId) {
                await updatePrivateProfile(existingProfile.userId, privateUpdates);
              }
              
              return existingProfile;
            } catch (fetchErr) {
              // If profile doesn't exist (401 or other error), proceed with creation
              console.log('No existing profile found, creating new profile');
              if (fetchErr instanceof Error && !fetchErr.message.includes('Authentication')) {
                throw fetchErr; // Re-throw if it's not an authentication error
              }
            }
            
            // Create new profile
            const newPublicProfile = await API.createUserProfile(publicUpdates) as PublicProfile;
            setPublicProfile(newPublicProfile);
            
            // If we also have private updates, handle those
            if (privateUpdates && newPublicProfile.userId) {
              await updatePrivateProfile(newPublicProfile.userId, privateUpdates);
            }
            
            return newPublicProfile;
          }
          
          // Update public profile
          if (publicProfile) {
            const updatedPublicProfile = await API.updateUserProfile({
              ...publicUpdates,
              userId: publicProfile.userId,
            }) as PublicProfile;
            setPublicProfile(updatedPublicProfile);
            
            // If we also have private updates, handle those
            if (privateUpdates && updatedPublicProfile.userId) {
              await updatePrivateProfile(updatedPublicProfile.userId, privateUpdates);
            }
            
            return updatedPublicProfile;
          }
        } catch (err) {
          console.error('Error updating public profile:', err);
          
          // Even if public profile update fails, still try to update private profile
          // This way we can at least save the private data
          if (privateUpdates && userId) {
            console.log('Public profile update failed, but still attempting private profile update');
            try {
              await updatePrivateProfile(userId, privateUpdates);
            } catch (privateErr) {
              console.error('Private profile update also failed:', privateErr);
            }
          }
          
          throw err;
        }
      }
      
      // If there are private updates and we have a user ID, update private profile
      if (privateUpdates && userId) {
        try {
          await updatePrivateProfile(userId, privateUpdates);
        } catch (err) {
          console.error('Error updating private profile:', err);
          
          // Store private profile locally even if server update fails
          try {
            const currentPrivate = privateProfile || getDefaultPrivateProfile();
            const updatedPrivateProfile = mergePrivateProfiles(currentPrivate, privateUpdates);
            setPrivateProfile(updatedPrivateProfile);
            
            console.log('Stored private profile locally after server update failed');
            
            // Don't throw error in this case, as we've managed to store locally
            // This improves user experience by not showing errors when we can recover
          } catch (localErr) {
            console.error('Failed to store private profile locally:', localErr);
            throw err; // Rethrow the original error if local storage also fails
          }
        }
      }
      
      return publicProfile;
    } catch (err) {
      console.error('Error updating profile:', err);
      setError(err instanceof Error ? err : new Error('Failed to update profile'));
      throw err;
    } finally {
      setIsLoading(false);
      // Release the lock if we set it
      if (localLock) {
        initializationLock.isInitializing = false;
      }
    }
  };
  
  /**
   * Special function to update only personalization settings while avoiding the
   * problematic profile update endpoint that's causing "Invalid wurde ID format" errors.
   * This function will:
   * 1. Store the personalization preferences locally 
   * 2. Update the private profile if possible
   * 3. Not attempt to update the public profile on the server
   */
  const updatePersonalizationSettings = async (
    allowPersonalization: boolean,
    privatePreferences?: Partial<PrivateProfile>
  ): Promise<boolean> => {
    try {
      console.log('Updating personalization settings locally:', { 
        allowPersonalization, 
        hasPrivatePrefs: !!privatePreferences 
      });
      
      // Update local state first to ensure immediate feedback
      if (publicProfile) {
        // Create a local copy with updated settings
        const updatedPublicProfile: PublicProfile = {
          ...publicProfile,
          privacySettings: {
            ...publicProfile.privacySettings,
            allowPersonalization,
          }
        };
        
        // Update local state with properly typed object
        setPublicProfile(updatedPublicProfile);
        
        // Store this update in localStorage for persistence
        try {
          localStorage.setItem('sahabai_personalization_enabled', allowPersonalization ? 'true' : 'false');
          // Also update the legacy key for backward compatibility
          localStorage.setItem('personalizationEnabled', allowPersonalization ? 'true' : 'false');
          console.log('Personalization preference saved to localStorage');
        } catch (storageErr) {
          console.error('Failed to save personalization preference to localStorage:', storageErr);
        }
      }
      
      // Try to update the public profile on the server
      try {
        if (publicProfile && publicProfile.userId) {
          console.log(`Attempting to update public profile for user: ${publicProfile.userId}`);
          
          // Only update the allowPersonalization setting
          const minimalUpdate = {
            userId: publicProfile.userId,
            privacySettings: {
              ...publicProfile.privacySettings,
              allowPersonalization
            }
          };
          
          await API.updateUserProfile(minimalUpdate);
          console.log('Public profile updated with personalization setting');
        }
      } catch (publicErr) {
        console.error('Failed to update public profile on server:', publicErr);
        // Continue with private profile update even if public update fails
      }
      
      // If we have private preferences and personalization is enabled, update those
      if (privatePreferences && allowPersonalization && userId) {
        try {
          console.log(`Updating private profile for user: ${userId}`);
          console.log('Private preferences data:', JSON.stringify(privatePreferences, null, 2));
          
          await updatePrivateProfile(userId, privatePreferences);
          console.log('Private personalization preferences saved successfully to server');
          
          // Also update local state
          if (privateProfile) {
            const mergedProfile = mergePrivateProfiles(privateProfile, privatePreferences);
            setPrivateProfile(mergedProfile);
            console.log('Private profile state updated with new preferences');
          } else {
            // No existing private profile, create one from scratch
            const defaultProfile = getDefaultPrivateProfile();
            const mergedProfile = mergePrivateProfiles(defaultProfile, privatePreferences);
            setPrivateProfile(mergedProfile);
            console.log('New private profile created from preferences');
          }
        } catch (privateErr) {
          console.error('Failed to save private personalization preferences to server:', privateErr);
          
          // Store locally as fallback
          if (privateProfile) {
            const mergedProfile = mergePrivateProfiles(
              privateProfile, 
              privatePreferences
            );
            setPrivateProfile(mergedProfile);
            
            // Also try to store in localStorage
            try {
              localStorage.setItem('sahabai_private_preferences', JSON.stringify(privatePreferences));
              console.log('Private preferences saved to localStorage as fallback');
            } catch (localStorageErr) {
              console.error('Failed to save to localStorage:', localStorageErr);
            }
          } else {
            // No existing private profile, create one from scratch
            const defaultProfile = getDefaultPrivateProfile();
            const mergedProfile = mergePrivateProfiles(defaultProfile, privatePreferences);
            setPrivateProfile(mergedProfile);
            
            // Also store in localStorage
            try {
              localStorage.setItem('sahabai_private_preferences', JSON.stringify(privatePreferences));
              console.log('New private preferences saved to localStorage');
            } catch (localStorageErr) {
              console.error('Failed to save to localStorage:', localStorageErr);
            }
          }
        }
      }
      
      return true;
    } catch (err) {
      console.error('Error updating personalization settings:', err);
      return false;
    }
  };
  
  // Helper to update private profile
  const updatePrivateProfile = async (userId: string, updates: Partial<PrivateProfile>) => {
    try {
      // Get the current private profile or create new one with required fields
      const currentPrivate = privateProfile || {
        // Required fields according to PrivateProfile type
        spiritualJourneyStage: '',
        primaryGoals: [],
        knowledgeLevel: '',
        lifeStage: '',
        communityConnection: '',
        culturalBackground: '',
        reflectionStyle: '',
        guidancePreferences: [],
        topicsOfInterest: [],
        // Optional fields with defaults
        dynamicAttributes: {
          topicsEngagedWith: {},
          preferredReferences: {},
          emotionalResponsiveness: {},
          languageComplexity: 1
        },
        observedPatterns: {
          recurringChallenges: [],
          strongEmotionalTopics: [],
          growthAreas: [],
          spiritualStrengths: [],
          avoidedTopics: []
        },
        recentInteractions: {
          lastTopics: [],
          lastActionItems: [],
          completedActionItems: []
        }
      };
      
      // Create a properly merged object that satisfies the PrivateProfile type
      const updatedPrivateProfile: PrivateProfile = {
        ...currentPrivate,
        ...updates,
        // Ensure nested objects are properly merged with type assertions
        dynamicAttributes: {
          ...currentPrivate.dynamicAttributes,
          ...(updates.dynamicAttributes || {})
        } as PrivateProfile['dynamicAttributes'],
        observedPatterns: {
          ...currentPrivate.observedPatterns,
          ...(updates.observedPatterns || {})
        } as PrivateProfile['observedPatterns'],
        recentInteractions: {
          ...currentPrivate.recentInteractions,
          ...(updates.recentInteractions || {})
        } as PrivateProfile['recentInteractions']
      };
      
      // Get encryption key
      const key = await getEncryptionKey();
      
      // Generate IV for encryption
      const iv = generateIv();
      
      // Encrypt data
      const encryptedData = await encryptData(
        JSON.stringify(updatedPrivateProfile),
        key,
        iv
      );
      
      // Save encrypted data to API
      await API.updateEncryptedProfileData(userId, {
        data: encryptedData,
        iv: Array.from(iv),
      });
      
      // Update local state with the properly typed object
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
      await API.deleteUserProfile();
      
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
  
  // Helper function to get a default private profile structure
  const getDefaultPrivateProfile = (): PrivateProfile => ({
    spiritualJourneyStage: '',
    primaryGoals: [],
    knowledgeLevel: '',
    lifeStage: '',
    communityConnection: '',
    culturalBackground: '',
    reflectionStyle: '',
    guidancePreferences: [],
    topicsOfInterest: [],
    dynamicAttributes: {
      topicsEngagedWith: {},
      preferredReferences: {},
      emotionalResponsiveness: {},
      languageComplexity: 1
    },
    observedPatterns: {
      recurringChallenges: [],
      strongEmotionalTopics: [],
      growthAreas: [],
      spiritualStrengths: [],
      avoidedTopics: []
    },
    recentInteractions: {
      lastTopics: [],
      lastActionItems: [],
      completedActionItems: []
    }
  });

  // Helper function to merge private profiles with type safety
  const mergePrivateProfiles = (
    currentProfile: PrivateProfile, 
    updates: Partial<PrivateProfile>
  ): PrivateProfile => ({
    ...currentProfile,
    ...updates,
    // Handle nested objects correctly with proper type assertions
    dynamicAttributes: {
      ...currentProfile.dynamicAttributes,
      ...((updates.dynamicAttributes || {}) as PrivateProfile['dynamicAttributes'])
    } as PrivateProfile['dynamicAttributes'],
    observedPatterns: {
      ...currentProfile.observedPatterns,
      ...((updates.observedPatterns || {}) as PrivateProfile['observedPatterns'])
    } as PrivateProfile['observedPatterns'],
    recentInteractions: {
      ...currentProfile.recentInteractions,
      ...((updates.recentInteractions || {}) as PrivateProfile['recentInteractions'])
    } as PrivateProfile['recentInteractions']
  });
  
  return {
    publicProfile,
    privateProfile,
    isLoading,
    error,
    updateProfile,
    resetProfile,
    getProfileForAI,
    refreshProfiles: loadProfiles,
    updatePersonalizationSettings,
  };
} 