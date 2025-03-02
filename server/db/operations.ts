import { eq } from 'drizzle-orm';
import { db, user_profiles, encrypted_profiles } from '../db';
import { log } from '../vite';

/**
 * Database operations for user profiles
 * These functions handle the persistence of user profiles and encrypted data
 * They use the Drizzle ORM for interacting with PostgreSQL
 */

/**
 * Types and interfaces for database operations
 */

/**
 * User profile data structure
 */
export interface UserProfile {
  userId: string;
  preferences: Record<string, any>;
  sharingPreferences: Record<string, any>;
  version?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Encrypted profile data structure
 */
export interface EncryptedProfileData {
  userId: string;
  data: string;
  iv: string;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Helper function to validate userId
 */
export function validateUserId(userId: unknown): string {
  if (typeof userId !== 'string' || !userId) {
    throw new Error('Invalid userId: must be a non-empty string');
  }
  return userId;
}

/**
 * Get a user profile from the database
 */
export async function getUserProfile(userId: unknown): Promise<UserProfile | null> {
  try {
    const validUserId = validateUserId(userId);
    
    if (!db) {
      throw new Error('Database connection not available');
    }

    const results = await db
      .select()
      .from(user_profiles)
      .where(eq(user_profiles.user_id, validUserId))
      .limit(1);

    if (results.length === 0) {
      return null;
    }

    const profile = results[0];
    return {
      userId: profile.user_id,
      preferences: JSON.parse(profile.general_preferences),
      sharingPreferences: JSON.parse(profile.privacy_settings),
      version: 1, // Add version tracking for future use
    };
  } catch (error) {
    log(`Error fetching user profile: ${error}`, 'database');
    throw new Error(`Failed to retrieve user profile: ${error}`);
  }
}

/**
 * Create a new user profile
 */
export async function createUserProfile(profile: UserProfile): Promise<UserProfile> {
  try {
    const validUserId = validateUserId(profile.userId);
    
    if (!db) {
      throw new Error('Database connection not available');
    }

    const now = new Date();
    
    // Prepare data for insertion
    const insertData = {
      user_id: validUserId,
      general_preferences: JSON.stringify(profile.preferences || {}),
      privacy_settings: JSON.stringify(profile.sharingPreferences || {}),
      created_at: now,
      updated_at: now,
    };

    // Insert into database
    await db.insert(user_profiles).values(insertData);
    
    // Return the created profile
    return {
      ...profile,
      userId: validUserId,
      createdAt: now,
      updatedAt: now,
      version: 1,
    };
  } catch (error) {
    log(`Error creating user profile: ${error}`, 'database');
    throw new Error(`Failed to create user profile: ${error}`);
  }
}

/**
 * Update an existing user profile
 */
export async function updateUserProfile(userId: unknown, updates: Partial<UserProfile>): Promise<UserProfile> {
  try {
    const validUserId = validateUserId(userId);
    
    if (!db) {
      throw new Error('Database connection not available');
    }

    // Get the current profile
    const currentProfile = await getUserProfile(validUserId);
    if (!currentProfile) {
      throw new Error(`Profile not found for userId: ${validUserId}`);
    }

    const now = new Date();
    
    // Prepare update data
    const updateData: any = {
      updated_at: now,
    };

    // Only add fields that are present in the updates
    if (updates.preferences) {
      updateData.general_preferences = JSON.stringify(updates.preferences);
    }
    
    if (updates.sharingPreferences) {
      updateData.privacy_settings = JSON.stringify(updates.sharingPreferences);
    }

    // Update the database
    await db
      .update(user_profiles)
      .set(updateData)
      .where(eq(user_profiles.user_id, validUserId));
    
    // Return the updated profile
    return {
      ...currentProfile,
      ...updates,
      userId: validUserId, // Ensure userId is the validated one
      updatedAt: now,
      version: (currentProfile.version || 0) + 1,
    };
  } catch (error) {
    log(`Error updating user profile: ${error}`, 'database');
    throw new Error(`Failed to update user profile: ${error}`);
  }
}

/**
 * Delete a user profile
 */
export async function deleteUserProfile(userId: unknown): Promise<boolean> {
  try {
    const validUserId = validateUserId(userId);
    
    if (!db) {
      throw new Error('Database connection not available');
    }

    // Delete the profile
    await db
      .delete(user_profiles)
      .where(eq(user_profiles.user_id, validUserId));
    
    return true;
  } catch (error) {
    log(`Error deleting user profile: ${error}`, 'database');
    throw new Error(`Failed to delete user profile: ${error}`);
  }
}

/**
 * Get encrypted profile data
 */
export async function getEncryptedProfileData(userId: unknown): Promise<EncryptedProfileData | null> {
  try {
    const validUserId = validateUserId(userId);
    
    if (!db) {
      throw new Error('Database connection not available');
    }

    const results = await db
      .select()
      .from(encrypted_profiles)
      .where(eq(encrypted_profiles.user_id, validUserId))
      .limit(1);

    if (results.length === 0) {
      return null;
    }

    const profile = results[0];
    return {
      userId: profile.user_id,
      data: profile.data,
      iv: profile.iv,
      createdAt: profile.created_at,
      updatedAt: profile.updated_at,
    };
  } catch (error) {
    log(`Error fetching encrypted profile data: ${error}`, 'database');
    throw new Error(`Failed to retrieve encrypted profile data: ${error}`);
  }
}

/**
 * Create or update encrypted profile data
 */
export async function updateEncryptedProfileData(
  userId: unknown, 
  encryptedData: { data: string; iv: string }
): Promise<boolean> {
  try {
    const validUserId = validateUserId(userId);
    
    if (!db) {
      throw new Error('Database connection not available');
    }

    const now = new Date();
    
    // Check if data exists
    const existingData = await getEncryptedProfileData(validUserId);
    
    if (existingData) {
      // Update existing data
      await db
        .update(encrypted_profiles)
        .set({
          data: encryptedData.data,
          iv: encryptedData.iv,
          updated_at: now,
        })
        .where(eq(encrypted_profiles.user_id, validUserId));
    } else {
      // Insert new data
      await db
        .insert(encrypted_profiles)
        .values({
          user_id: validUserId,
          data: encryptedData.data,
          iv: encryptedData.iv,
          created_at: now,
          updated_at: now,
        });
    }
    
    return true;
  } catch (error) {
    log(`Error updating encrypted profile data: ${error}`, 'database');
    throw new Error(`Failed to update encrypted profile data: ${error}`);
  }
}

/**
 * Delete encrypted profile data
 */
export async function deleteEncryptedProfileData(userId: unknown): Promise<boolean> {
  try {
    const validUserId = validateUserId(userId);
    
    if (!db) {
      throw new Error('Database connection not available');
    }

    // Delete the encrypted data
    await db
      .delete(encrypted_profiles)
      .where(eq(encrypted_profiles.user_id, validUserId));
    
    return true;
  } catch (error) {
    log(`Error deleting encrypted profile data: ${error}`, 'database');
    throw new Error(`Failed to delete encrypted profile data: ${error}`);
  }
} 