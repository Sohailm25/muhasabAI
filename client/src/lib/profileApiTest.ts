/**
 * Profile API Testing Utilities
 * 
 * These utilities help developers test the profile API endpoints
 * in a development environment. They provide methods to directly
 * interact with the profile API without going through the normal
 * application flow.
 * 
 * IMPORTANT: This module should only be used for development and testing.
 */

import { PublicProfile, PrivateProfile } from './types';
import { getEncryptionKey, encryptData } from './encryption';

const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? '/api' 
  : 'http://localhost:3000/api';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Fetches all profiles from the API
 * For admin/development use only
 */
export async function fetchAllProfiles(): Promise<ApiResponse<PublicProfile[]>> {
  try {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('API test utilities are for development only');
    }
    
    const response = await fetch(`${API_BASE_URL}/profiles`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': 'dev-test-key' // Would be replaced with proper auth in production
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      return {
        success: false,
        error: errorData.message || `Error: ${response.status}`
      };
    }
    
    const data = await response.json();
    return {
      success: true,
      data: data.profiles
    };
  } catch (error) {
    console.error('Error fetching all profiles:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Creates a new profile via the API
 * Useful for testing profile creation flow
 */
export async function createProfileViaApi(
  userId: string,
  publicProfile: Partial<PublicProfile>,
  privateProfile: Partial<PrivateProfile>
): Promise<ApiResponse<{ profileId: string }>> {
  try {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('API test utilities are for development only');
    }
    
    // Ensure required fields are present
    const fullPublicProfile: PublicProfile = {
      userId,
      createdAt: new Date(),
      updatedAt: new Date(),
      generalPreferences: publicProfile.generalPreferences || {
        inputMethod: 'text',
        reflectionFrequency: 'daily',
        languagePreferences: 'english'
      },
      privacySettings: publicProfile.privacySettings || {
        localStorageOnly: true,
        allowPersonalization: true,
        enableSync: false
      },
      usageStats: publicProfile.usageStats || {
        reflectionCount: 0,
        lastActiveDate: new Date(),
        streakDays: 0
      },
      ...publicProfile
    };
    
    // Encrypt private profile if provided
    let encryptedProfileData = null;
    if (privateProfile && Object.keys(privateProfile).length > 0) {
      const key = await getEncryptionKey();
      const iv = window.crypto.getRandomValues(new Uint8Array(12));
      const encryptedData = await encryptData(
        JSON.stringify(privateProfile), 
        key, 
        iv
      );
      
      encryptedProfileData = {
        data: encryptedData,
        iv: Array.from(iv)
      };
    }
    
    // Create request payload
    const payload = {
      publicProfile: fullPublicProfile,
      encryptedProfileData
    };
    
    // Send request
    const response = await fetch(`${API_BASE_URL}/profiles`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': 'dev-test-key' // Would be replaced with proper auth in production
      },
      body: JSON.stringify(payload)
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      return {
        success: false,
        error: errorData.message || `Error: ${response.status}`
      };
    }
    
    const data = await response.json();
    return {
      success: true,
      data: { profileId: data.profileId }
    };
  } catch (error) {
    console.error('Error creating profile via API:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Fetches a specific profile by user ID
 */
export async function fetchProfileByUserId(userId: string): Promise<ApiResponse<PublicProfile>> {
  try {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('API test utilities are for development only');
    }
    
    const response = await fetch(`${API_BASE_URL}/profiles/user/${userId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': 'dev-test-key' // Would be replaced with proper auth in production
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      return {
        success: false,
        error: errorData.message || `Error: ${response.status}`
      };
    }
    
    const data = await response.json();
    return {
      success: true,
      data: data.profile
    };
  } catch (error) {
    console.error('Error fetching profile by user ID:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Updates a profile via the API
 */
export async function updateProfileViaApi(
  userId: string,
  publicProfileUpdates: Partial<PublicProfile>,
  privateProfileUpdates?: Partial<PrivateProfile>
): Promise<ApiResponse<{ success: boolean }>> {
  try {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('API test utilities are for development only');
    }
    
    // Prepare public profile updates
    const publicProfile = {
      ...publicProfileUpdates,
      userId,
      updatedAt: new Date()
    };
    
    // Encrypt private profile updates if provided
    let encryptedProfileData = null;
    if (privateProfileUpdates && Object.keys(privateProfileUpdates).length > 0) {
      // First get the current profile to merge with updates
      const currentProfileResponse = await fetchProfileByUserId(userId);
      if (!currentProfileResponse.success) {
        return {
          success: false,
          error: `Failed to fetch current profile: ${currentProfileResponse.error}`
        };
      }
      
      // Get the encrypted profile data - using userId instead of id
      const encryptedProfileResponse = await fetch(
        `${API_BASE_URL}/profiles/user/${userId}/encrypted`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': 'dev-test-key'
          }
        }
      );
      
      if (!encryptedProfileResponse.ok) {
        return {
          success: false,
          error: 'Failed to fetch encrypted profile data'
        };
      }
      
      // Prepare the updated encrypted profile data
      const key = await getEncryptionKey();
      const iv = window.crypto.getRandomValues(new Uint8Array(12));
      const encryptedData = await encryptData(
        JSON.stringify(privateProfileUpdates),
        key,
        iv
      );
      
      encryptedProfileData = {
        data: encryptedData,
        iv: Array.from(iv)
      };
    }
    
    // Create request payload
    const payload = {
      publicProfileUpdates: publicProfile,
      encryptedProfileUpdates: encryptedProfileData
    };
    
    // Send request
    const response = await fetch(`${API_BASE_URL}/profiles/user/${userId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': 'dev-test-key'
      },
      body: JSON.stringify(payload)
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      return {
        success: false,
        error: errorData.message || `Error: ${response.status}`
      };
    }
    
    const data = await response.json();
    return {
      success: true,
      data: { success: true }
    };
  } catch (error) {
    console.error('Error updating profile via API:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Deletes a profile via the API
 */
export async function deleteProfileViaApi(userId: string): Promise<ApiResponse<{ success: boolean }>> {
  try {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('API test utilities are for development only');
    }
    
    const response = await fetch(`${API_BASE_URL}/profiles/user/${userId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': 'dev-test-key'
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      return {
        success: false,
        error: errorData.message || `Error: ${response.status}`
      };
    }
    
    return {
      success: true,
      data: { success: true }
    };
  } catch (error) {
    console.error('Error deleting profile via API:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Runs a comprehensive test of the profile API
 * This tests all CRUD operations in sequence
 */
export async function runProfileApiTest(): Promise<{
  success: boolean,
  results: Record<string, boolean>,
  errors: Record<string, string | undefined>
}> {
  const results: Record<string, boolean> = {};
  const errors: Record<string, string | undefined> = {};
  
  try {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('API test utilities are for development only');
    }
    
    console.log('Beginning profile API test...');
    
    // Generate a test user ID
    const testUserId = `test-user-${Date.now()}`;
    console.log(`Using test user ID: ${testUserId}`);
    
    // 1. Create a profile
    console.log('1. Testing profile creation...');
    const createResult = await createProfileViaApi(
      testUserId,
      {
        generalPreferences: {
          inputMethod: 'text',
          reflectionFrequency: 'daily',
          languagePreferences: 'english'
        },
        privacySettings: {
          localStorageOnly: false,
          allowPersonalization: true,
          enableSync: true
        }
      },
      {
        spiritualJourneyStage: 'exploring',
        primaryGoals: ['knowledge', 'practice'],
        knowledgeLevel: 'beginner',
        topicsOfInterest: ['prayer', 'spirituality']
      }
    );
    
    results['createProfile'] = createResult.success;
    errors['createProfile'] = createResult.error;
    console.log(createResult.success ? '✓ Profile created successfully' : `✗ Profile creation failed: ${createResult.error}`);
    
    if (!createResult.success) {
      return {
        success: false,
        results,
        errors
      };
    }
    
    // 2. Fetch the profile
    console.log('2. Testing profile retrieval...');
    const fetchResult = await fetchProfileByUserId(testUserId);
    
    results['fetchProfile'] = fetchResult.success;
    errors['fetchProfile'] = fetchResult.error;
    console.log(fetchResult.success ? '✓ Profile fetched successfully' : `✗ Profile fetch failed: ${fetchResult.error}`);
    
    if (!fetchResult.success) {
      return {
        success: false,
        results,
        errors
      };
    }
    
    // 3. Update the profile
    console.log('3. Testing profile update...');
    const updateResult = await updateProfileViaApi(
      testUserId,
      {
        generalPreferences: {
          inputMethod: 'voice',
          reflectionFrequency: 'weekly',
          languagePreferences: 'english'
        }
      },
      {
        knowledgeLevel: 'intermediate',
        topicsOfInterest: ['prayer', 'spirituality', 'ethics']
      }
    );
    
    results['updateProfile'] = updateResult.success;
    errors['updateProfile'] = updateResult.error;
    console.log(updateResult.success ? '✓ Profile updated successfully' : `✗ Profile update failed: ${updateResult.error}`);
    
    // 4. Fetch all profiles (admin function)
    console.log('4. Testing retrieval of all profiles...');
    const fetchAllResult = await fetchAllProfiles();
    
    results['fetchAllProfiles'] = fetchAllResult.success;
    errors['fetchAllProfiles'] = fetchAllResult.error;
    console.log(fetchAllResult.success ? '✓ All profiles fetched successfully' : `✗ Fetching all profiles failed: ${fetchAllResult.error}`);
    
    // 5. Delete the profile
    console.log('5. Testing profile deletion...');
    const deleteResult = await deleteProfileViaApi(testUserId);
    
    results['deleteProfile'] = deleteResult.success;
    errors['deleteProfile'] = deleteResult.error;
    console.log(deleteResult.success ? '✓ Profile deleted successfully' : `✗ Profile deletion failed: ${deleteResult.error}`);
    
    // Check overall success
    const overallSuccess = Object.values(results).every(result => result === true);
    
    console.log('========== Profile API Test Results ==========');
    console.log(`Overall test ${overallSuccess ? 'PASSED' : 'FAILED'}`);
    Object.entries(results).forEach(([test, passed]) => {
      console.log(`${passed ? '✓' : '✗'} ${test} ${passed ? 'passed' : 'failed'}${!passed ? `: ${errors[test]}` : ''}`);
    });
    
    return {
      success: overallSuccess,
      results,
      errors
    };
  } catch (error) {
    console.error('Error running profile API test:', error);
    return {
      success: false,
      results,
      errors: {
        ...errors,
        overall: error instanceof Error ? error.message : 'Unknown error'
      }
    };
  }
} 