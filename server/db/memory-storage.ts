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
  if (!userId) {
    console.log('[MEMORY DB] Invalid userId provided to getUserProfileFromMemory');
    return null;
  }
  
  console.log(`[MEMORY DB] Looking up profile for userId: ${userId}`);
  console.log(`[MEMORY DB] In-memory profiles count: ${Object.keys(profiles).length}`);
  
  // Log a few profile IDs from the store for debugging
  const profileIds = Object.keys(profiles).slice(0, 5);
  console.log(`[MEMORY DB] Sample profile IDs in memory: ${profileIds.join(', ') || 'none'}`);
  
  const profile = profiles[userId];
  console.log(`[MEMORY DB] Profile lookup result: ${profile ? 'Found' : 'Not found'}`);
  
  if (profile) {
    console.log(`[MEMORY DB] Profile details: userId=${profile.userId}, preferences=${JSON.stringify(profile.preferences)}`);
  }
  
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
  if (!userId) {
    console.log('[MEMORY DB] Invalid userId provided to getEncryptedProfileDataFromMemory');
    return null;
  }
  
  console.log(`[MEMORY DB] Looking up encrypted data for userId: ${userId}`);
  console.log(`[MEMORY DB] In-memory encrypted data count: ${Object.keys(encryptedData).length}`);
  
  // Log a few encrypted data IDs from the store for debugging
  const encryptedDataIds = Object.keys(encryptedData).slice(0, 5);
  console.log(`[MEMORY DB] Sample encrypted data IDs in memory: ${encryptedDataIds.join(', ') || 'none'}`);
  
  const data = encryptedData[userId];
  console.log(`[MEMORY DB] Encrypted data lookup result: ${data ? 'Found' : 'Not found'}`);
  
  if (data) {
    console.log(`[MEMORY DB] Encrypted data details: userId=${data.userId}, data length=${data.data ? data.data.length : 0}, iv present=${!!data.iv}`);
  }
  
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
    console.log('[MEMORY DB] Invalid userId provided to saveEncryptedProfileDataToMemory');
    throw new Error('userId is required');
  }
  
  console.log(`[MEMORY DB] Saving encrypted data for userId: ${userId}`);
  console.log(`[MEMORY DB] Data length: ${data ? data.length : 0}, IV length: ${iv ? iv.length : 0}`);
  
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
  
  console.log(`[MEMORY DB] Saved encrypted data for userId: ${userId}`);
  console.log(`[MEMORY DB] Updated in-memory encrypted data count: ${Object.keys(encryptedData).length}`);
  
  log(`Saved encrypted profile data for user ${userId} to memory storage`, 'database');
  
  return encryptedProfile;
}

/**
 * Delete encrypted profile data from memory
 */
export async function deleteEncryptedProfileDataFromMemory(userId: string): Promise<boolean> {
  if (!userId) {
    console.log('[MEMORY DB] Invalid userId provided to deleteEncryptedProfileDataFromMemory');
    return false;
  }
  
  console.log(`[MEMORY DB] Deleting encrypted data for userId: ${userId}`);
  
  // Check if data exists
  if (!encryptedData[userId]) {
    console.log(`[MEMORY DB] No encrypted data found for userId: ${userId}`);
    return false;
  }
  
  // Delete data
  delete encryptedData[userId];
  
  console.log(`[MEMORY DB] Deleted encrypted data for userId: ${userId}`);
  console.log(`[MEMORY DB] Updated in-memory encrypted data count: ${Object.keys(encryptedData).length}`);
  
  log(`Deleted encrypted profile data for user ${userId} from memory storage`, 'database');
  
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