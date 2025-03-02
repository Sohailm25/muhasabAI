/**
 * Profile debugging utilities
 * 
 * These utilities are designed to help developers understand and debug
 * the privacy-focused profile system during development. They provide
 * safe ways to inspect encrypted data and profile state.
 * 
 * IMPORTANT: These utilities should only be used in development environments.
 * They are not included in production builds.
 */

import { PublicProfile, PrivateProfile, EncryptedProfileData } from './types';
import { getEncryptionKey, decryptData } from './encryption';

interface ProfileDebugInfo {
  timestamp: string;
  publicProfile: PublicProfile | null;
  privateProfile: PrivateProfile | null;
  hasEncryptionKey: boolean;
  localStorageKeys: string[];
  syncEnabled: boolean;
}

/**
 * Get complete debug information about the current profile state
 * This is useful for understanding the current state of the profile system
 */
export async function getProfileDebugInfo(): Promise<ProfileDebugInfo> {
  // Check if we're in development mode
  if (process.env.NODE_ENV === 'production') {
    console.warn('Profile debug utilities should not be used in production');
    throw new Error('Debug utilities disabled in production');
  }
  
  try {
    // Get public profile from localStorage
    const publicProfileStr = localStorage.getItem('sahabai_public_profile');
    const publicProfile = publicProfileStr ? JSON.parse(publicProfileStr) : null;
    
    // Get private profile from localStorage
    const encryptedProfileStr = localStorage.getItem('sahabai_encrypted_profile');
    const encryptedProfile = encryptedProfileStr ? JSON.parse(encryptedProfileStr) : null;
    
    // Check if encryption key exists
    const encryptionKeyStr = localStorage.getItem('sahabai_encryption_key');
    const hasEncryptionKey = !!encryptionKeyStr;
    
    // Decrypt private profile if possible
    let privateProfile: PrivateProfile | null = null;
    if (encryptedProfile && encryptedProfile.data && encryptedProfile.iv && hasEncryptionKey) {
      try {
        const key = await getEncryptionKey();
        const iv = new Uint8Array(encryptedProfile.iv);
        const decryptedData = await decryptData(encryptedProfile.data, key, iv);
        privateProfile = JSON.parse(decryptedData);
      } catch (error) {
        console.error('Error decrypting profile:', error);
      }
    }
    
    // Get all localStorage keys related to the profile system
    const localStorageKeys = Object.keys(localStorage).filter(key => 
      key.startsWith('sahabai_')
    );
    
    // Check if sync is enabled
    const syncEnabled = publicProfile?.privacySettings?.enableSync || false;
    
    return {
      timestamp: new Date().toISOString(),
      publicProfile,
      privateProfile,
      hasEncryptionKey,
      localStorageKeys,
      syncEnabled
    };
  } catch (error) {
    console.error('Error getting profile debug info:', error);
    throw error;
  }
}

/**
 * Create a test profile for development purposes
 * This is useful for quickly testing profile-dependent features
 */
export async function createTestProfile(): Promise<void> {
  // Check if we're in development mode
  if (process.env.NODE_ENV === 'production') {
    console.warn('Profile debug utilities should not be used in production');
    throw new Error('Debug utilities disabled in production');
  }
  
  try {
    // Generate a test user ID
    const userId = `test-${Date.now()}`;
    
    // Create test public profile
    const publicProfile: PublicProfile = {
      userId,
      createdAt: new Date(),
      updatedAt: new Date(),
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
      usageStats: {
        reflectionCount: 5,
        lastActiveDate: new Date(),
        streakDays: 3
      }
    };
    
    // Save public profile to localStorage
    localStorage.setItem(
      'sahabai_public_profile',
      JSON.stringify(publicProfile)
    );
    
    // Create test private profile
    const privateProfile: PrivateProfile = {
      spiritualJourneyStage: 'exploring',
      primaryGoals: ['knowledge', 'practice'],
      knowledgeLevel: 'intermediate',
      lifeStage: 'adult',
      communityConnection: 'connected',
      culturalBackground: 'Example background',
      reflectionStyle: 'thoughtful',
      guidancePreferences: ['quranic', 'practical'],
      topicsOfInterest: ['prayer', 'fasting', 'character'],
      dynamicAttributes: {
        topicsEngagedWith: {
          'prayer': 3,
          'fasting': 2,
          'charity': 1
        },
        preferredReferences: {
          'quran': 5,
          'hadith': 3,
          'scholarly': 1
        },
        emotionalResponsiveness: {
          'joy': 3.5,
          'hope': 4.2,
          'gratitude': 4.8
        },
        languageComplexity: 6.5
      },
      observedPatterns: {
        recurringChallenges: ['time management', 'consistency'],
        strongEmotionalTopics: ['family', 'community'],
        growthAreas: ['patience', 'knowledge'],
        spiritualStrengths: ['gratitude', 'reflection'],
        avoidedTopics: []
      },
      recentInteractions: {
        lastTopics: ['prayer', 'dhikr', 'family'],
        lastActionItems: ['Increase prayer focus', 'Daily Quran reading'],
        completedActionItems: ['Begin morning dhikr practice']
      }
    };
    
    // Get or create encryption key
    const key = await getEncryptionKey();
    
    // Encrypt private profile
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const encryptedData = await encrypt(JSON.stringify(privateProfile), key, iv);
    
    // Save encrypted private profile to localStorage
    localStorage.setItem(
      'sahabai_encrypted_profile',
      JSON.stringify({
        data: encryptedData,
        iv: Array.from(iv)
      })
    );
    
    // Update timestamp
    localStorage.setItem(
      'sahabai_profile_updated_at',
      new Date().toISOString()
    );
    
    console.log('Test profile created successfully');
  } catch (error) {
    console.error('Error creating test profile:', error);
    throw error;
  }
}

/**
 * Clear all profile data from localStorage
 * This is useful for testing the onboarding flow
 */
export function clearProfileData(): void {
  // Check if we're in development mode
  if (process.env.NODE_ENV === 'production') {
    console.warn('Profile debug utilities should not be used in production');
    throw new Error('Debug utilities disabled in production');
  }
  
  try {
    // Get all localStorage keys related to the profile system
    const localStorageKeys = Object.keys(localStorage).filter(key => 
      key.startsWith('sahabai_')
    );
    
    // Remove all related keys
    localStorageKeys.forEach(key => {
      localStorage.removeItem(key);
    });
    
    console.log('Profile data cleared successfully');
  } catch (error) {
    console.error('Error clearing profile data:', error);
    throw error;
  }
}

// Helper function to encrypt data (duplicate of the one in encryption.ts for isolation)
async function encrypt(data: string, key: CryptoKey, iv: Uint8Array): Promise<string> {
  try {
    // Convert data to buffer
    const dataBuffer = new TextEncoder().encode(data);
    
    // Encrypt
    const encryptedBuffer = await window.crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      dataBuffer
    );
    
    // Convert to base64 for storage
    return arrayBufferToBase64(encryptedBuffer);
  } catch (error) {
    console.error('Error encrypting data:', error);
    throw new Error('Failed to encrypt data.');
  }
}

// Helper function: ArrayBuffer to Base64 (duplicate for isolation)
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  
  return btoa(binary);
} 