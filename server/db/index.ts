/**
 * Database adapter module that selects the appropriate storage implementation
 * based on environment configuration.
 */
import * as pg from './postgres';
import * as memory from './memory-storage';
import { log } from '../vite';
import { UserProfile, EncryptedProfileData } from './operations';

// Environment check for database availability
const USE_DATABASE = process.env.USE_DATABASE === 'true' || process.env.NODE_ENV === 'production';

// Log the database mode
log(`Database mode: ${USE_DATABASE ? 'PostgreSQL' : 'In-Memory Storage'}`, 'database');

// Define simplified in-memory data structures instead of using external DB libraries
// These export stubs are needed by the auth.ts module
export const db = {
  // This is just a stub to satisfy imports
};

export const users = {
  // These are just stubs
  email: {},
  id: {}
};

export const tokens = {
  // These are just stubs
  token: {},
  userId: {},
  isRevoked: {}
};

/**
 * Initialize the database connection and tables
 */
export async function initializeDatabase(): Promise<void> {
  if (USE_DATABASE) {
    try {
      await pg.initializeDatabase();
      log('PostgreSQL database initialized successfully', 'database');
    } catch (error) {
      log(`Failed to initialize PostgreSQL database: ${error instanceof Error ? error.message : String(error)}`, 'error');
      throw error;
    }
  } else {
    log('Using in-memory storage (no database connection)', 'database');
  }
}

/**
 * Get a user profile
 */
export async function getUserProfile(userId: unknown): Promise<UserProfile | null> {
  if (typeof userId !== 'string' || !userId) {
    return null;
  }
  
  try {
    if (USE_DATABASE) {
      return await pg.getUserProfile(userId);
    } else {
      return await memory.getUserProfileFromMemory(userId);
    }
  } catch (error) {
    log(`Error getting user profile: ${error instanceof Error ? error.message : String(error)}`, 'error');
    return null;
  }
}

/**
 * Create a new user profile
 */
export async function createUserProfile(profile: UserProfile): Promise<UserProfile> {
  try {
    if (USE_DATABASE) {
      return await pg.createUserProfile(profile);
    } else {
      return await memory.saveUserProfileToMemory(profile);
    }
  } catch (error) {
    log(`Error creating user profile: ${error instanceof Error ? error.message : String(error)}`, 'error');
    throw error;
  }
}

/**
 * Update a user profile
 */
export async function updateUserProfile(userId: unknown, updates: Partial<UserProfile>): Promise<UserProfile> {
  if (typeof userId !== 'string' || !userId) {
    throw new Error('Invalid userId');
  }
  
  try {
    if (USE_DATABASE) {
      return await pg.updateUserProfile(userId, updates);
    } else {
      return await memory.updateUserProfileInMemory(userId, updates);
    }
  } catch (error) {
    log(`Error updating user profile: ${error instanceof Error ? error.message : String(error)}`, 'error');
    throw error;
  }
}

/**
 * Delete a user profile
 */
export async function deleteUserProfile(userId: unknown): Promise<boolean> {
  if (typeof userId !== 'string' || !userId) {
    return false;
  }
  
  try {
    if (USE_DATABASE) {
      return await pg.deleteUserProfile(userId);
    } else {
      return await memory.deleteUserProfileFromMemory(userId);
    }
  } catch (error) {
    log(`Error deleting user profile: ${error instanceof Error ? error.message : String(error)}`, 'error');
    return false;
  }
}

/**
 * Get encrypted profile data
 */
export async function getEncryptedProfileData(userId: unknown): Promise<EncryptedProfileData | null> {
  if (typeof userId !== 'string' || !userId) {
    return null;
  }
  
  try {
    if (USE_DATABASE) {
      return await pg.getEncryptedProfileData(userId);
    } else {
      return await memory.getEncryptedProfileDataFromMemory(userId);
    }
  } catch (error) {
    log(`Error getting encrypted profile data: ${error instanceof Error ? error.message : String(error)}`, 'error');
    return null;
  }
}

/**
 * Update or create encrypted profile data
 */
export async function updateEncryptedProfileData(
  userId: unknown, 
  encryptedData: { data: string; iv: string }
): Promise<EncryptedProfileData> {
  if (typeof userId !== 'string' || !userId) {
    throw new Error('Invalid userId');
  }
  
  try {
    if (USE_DATABASE) {
      return await pg.updateEncryptedProfileData(userId, encryptedData);
    } else {
      return await memory.saveEncryptedProfileDataToMemory(userId, encryptedData.data, encryptedData.iv);
    }
  } catch (error) {
    log(`Error updating encrypted profile data: ${error instanceof Error ? error.message : String(error)}`, 'error');
    throw error;
  }
}

/**
 * Delete encrypted profile data
 */
export async function deleteEncryptedProfileData(userId: unknown): Promise<boolean> {
  if (typeof userId !== 'string' || !userId) {
    return false;
  }
  
  try {
    if (USE_DATABASE) {
      return await pg.deleteEncryptedProfileData(userId);
    } else {
      return await memory.deleteEncryptedProfileDataFromMemory(userId);
    }
  } catch (error) {
    log(`Error deleting encrypted profile data: ${error instanceof Error ? error.message : String(error)}`, 'error');
    return false;
  }
} 