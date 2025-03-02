/**
 * In-memory storage fallback for the user profile system
 * Used when no database connection is available
 */
import { UserProfile, EncryptedProfileData } from './operations';
import { log } from '../vite';

// In-memory storage for profiles
const profiles: Record<string, UserProfile> = {};
const encryptedData: Record<string, EncryptedProfileData> = {};

/**
 * Get a user profile from memory
 */
export async function getUserProfileFromMemory(userId: string): Promise<UserProfile | null> {
  if (!userId) return null;
  
  const profile = profiles[userId];
  return profile || null;
}

/**
 * Save a user profile to memory
 */
export async function saveUserProfileToMemory(profile: UserProfile): Promise<UserProfile> {
  if (!profile.userId) {
    throw new Error('Profile must have a userId');
  }
  
  const now = new Date();
  
  // Set timestamps
  const updatedProfile = {
    ...profile,
    createdAt: profile.createdAt || now,
    updatedAt: now,
    version: (profile.version || 0) + 1
  };
  
  // Save to memory
  profiles[profile.userId] = updatedProfile;
  
  log(`Saved profile for user ${profile.userId} to memory storage`, 'database');
  
  return updatedProfile;
}

/**
 * Update a user profile in memory
 */
export async function updateUserProfileInMemory(userId: string, updates: Partial<UserProfile>): Promise<UserProfile> {
  if (!userId) {
    throw new Error('userId is required');
  }
  
  // Get existing profile
  const existingProfile = await getUserProfileFromMemory(userId);
  if (!existingProfile) {
    throw new Error(`Profile not found for userId: ${userId}`);
  }
  
  // Update the profile
  const updatedProfile = {
    ...existingProfile,
    ...updates,
    updatedAt: new Date(),
    version: (existingProfile.version || 0) + 1
  };
  
  // Save back to memory
  profiles[userId] = updatedProfile;
  
  log(`Updated profile for user ${userId} in memory storage`, 'database');
  
  return updatedProfile;
}

/**
 * Delete a user profile from memory
 */
export async function deleteUserProfileFromMemory(userId: string): Promise<boolean> {
  if (!userId) return false;
  
  // Check if profile exists
  if (!profiles[userId]) {
    return false;
  }
  
  // Delete profile
  delete profiles[userId];
  
  // Also delete any encrypted data
  if (encryptedData[userId]) {
    delete encryptedData[userId];
  }
  
  log(`Deleted profile for user ${userId} from memory storage`, 'database');
  
  return true;
}

/**
 * Get encrypted profile data from memory
 */
export async function getEncryptedProfileDataFromMemory(userId: string): Promise<EncryptedProfileData | null> {
  if (!userId) return null;
  
  const data = encryptedData[userId];
  return data || null;
}

/**
 * Save encrypted profile data to memory
 */
export async function saveEncryptedProfileDataToMemory(
  userId: string, 
  data: string, 
  iv: string
): Promise<EncryptedProfileData> {
  if (!userId) {
    throw new Error('userId is required');
  }
  
  const now = new Date();
  
  // Create or update encrypted data
  const encryptedProfile: EncryptedProfileData = {
    userId,
    data,
    iv,
    createdAt: encryptedData[userId]?.createdAt || now,
    updatedAt: now
  };
  
  // Save to memory
  encryptedData[userId] = encryptedProfile;
  
  log(`Saved encrypted data for user ${userId} to memory storage`, 'database');
  
  return encryptedProfile;
}

/**
 * Delete encrypted profile data from memory
 */
export async function deleteEncryptedProfileDataFromMemory(userId: string): Promise<boolean> {
  if (!userId) return false;
  
  // Check if data exists
  if (!encryptedData[userId]) {
    return false;
  }
  
  // Delete data
  delete encryptedData[userId];
  
  log(`Deleted encrypted data for user ${userId} from memory storage`, 'database');
  
  return true;
}

/**
 * Get all profiles in memory (for testing/debugging)
 */
export function getAllProfilesFromMemory(): UserProfile[] {
  return Object.values(profiles);
}

/**
 * Clear all data from memory (for testing/debugging)
 */
export function clearMemoryStorage(): void {
  // Clear profiles
  Object.keys(profiles).forEach(key => {
    delete profiles[key];
  });
  
  // Clear encrypted data
  Object.keys(encryptedData).forEach(key => {
    delete encryptedData[key];
  });
  
  log('Memory storage cleared', 'database');
} 