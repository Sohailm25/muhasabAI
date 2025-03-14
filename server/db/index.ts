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
    console.log('[DB DEBUG] Invalid userId provided to getUserProfile:', userId);
    return null;
  }
  
  try {
    console.log(`[DB DEBUG] Getting user profile for userId: ${userId}`);
    console.log(`[DB DEBUG] Database mode: ${USE_DATABASE ? 'PostgreSQL' : 'In-Memory'}`);
    
    let profile = null;
    
    if (USE_DATABASE) {
      console.log(`[DB DEBUG] Using database storage`);
      profile = await pg.getUserProfile(userId);
    } else {
      console.log(`[DB DEBUG] Using in-memory storage`);
      profile = await memory.getUserProfileFromMemory(userId);
    }
    
    console.log(`[DB DEBUG] Profile lookup result: ${profile ? 'Found' : 'Not found'}`);
    
    if (profile) {
      console.log(`[DB DEBUG] Profile details: userId=${profile.userId}, preferences=${JSON.stringify(profile.preferences)}`);
    }
    
    return profile;
  } catch (error) {
    console.error(`[DB DEBUG] Error getting user profile: ${error instanceof Error ? error.message : String(error)}`);
    log(`Error getting user profile: ${error instanceof Error ? error.message : String(error)}`, 'error');
    return null;
  }
}

/**
 * Create a user profile
 */
export async function createUserProfile(profile: UserProfile): Promise<UserProfile> {
  if (!profile.userId || typeof profile.userId !== 'string') {
    console.error('[PROFILE CREATION] Invalid userId provided:', profile.userId);
    throw new Error('Invalid userId provided');
  }
  
  try {
    console.log(`[PROFILE CREATION] Starting profile creation for userId: ${profile.userId}`);
    console.log(`[PROFILE CREATION] Profile data:`, {
      userId: profile.userId,
      preferences: profile.preferences ? JSON.stringify(profile.preferences).substring(0, 100) + '...' : 'None',
      sharingPreferences: profile.sharingPreferences ? JSON.stringify(profile.sharingPreferences).substring(0, 100) + '...' : 'None'
    });
    
    console.log(`[PROFILE CREATION] Database mode: ${USE_DATABASE ? 'PostgreSQL' : 'In-Memory'}`);
    
    let createdProfile: UserProfile;
    
    if (USE_DATABASE) {
      console.log(`[PROFILE CREATION] Using database storage for profile creation`);
      createdProfile = await pg.createUserProfile(profile);
    } else {
      console.log(`[PROFILE CREATION] Using in-memory storage for profile creation`);
      createdProfile = await memory.saveUserProfileToMemory(profile);
    }
    
    console.log(`[PROFILE CREATION] Profile created successfully for userId: ${profile.userId}`);
    console.log(`[PROFILE CREATION] Created profile:`, {
      userId: createdProfile.userId,
      preferences: createdProfile.preferences ? JSON.stringify(createdProfile.preferences).substring(0, 100) + '...' : 'None',
      sharingPreferences: createdProfile.sharingPreferences ? JSON.stringify(createdProfile.sharingPreferences).substring(0, 100) + '...' : 'None'
    });
    
    return createdProfile;
  } catch (error) {
    console.error(`[PROFILE CREATION] Error creating user profile: ${error instanceof Error ? error.message : String(error)}`);
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
    console.log('[DB DEBUG] Invalid userId provided to getEncryptedProfileData:', userId);
    return null;
  }
  
  try {
    console.log(`[DB DEBUG] Getting encrypted profile data for userId: ${userId}`);
    console.log(`[DB DEBUG] Database mode: ${USE_DATABASE ? 'PostgreSQL' : 'In-Memory'}`);
    
    let encryptedData = null;
    
    if (USE_DATABASE) {
      console.log(`[DB DEBUG] Using database storage for encrypted data`);
      encryptedData = await pg.getEncryptedProfileData(userId);
    } else {
      console.log(`[DB DEBUG] Using in-memory storage for encrypted data`);
      encryptedData = await memory.getEncryptedProfileDataFromMemory(userId);
    }
    
    console.log(`[DB DEBUG] Encrypted data lookup result: ${encryptedData ? 'Found' : 'Not found'}`);
    
    if (encryptedData) {
      console.log(`[DB DEBUG] Encrypted data details: userId=${encryptedData.userId}, data length=${encryptedData.data ? encryptedData.data.length : 0}, iv present=${!!encryptedData.iv}`);
    }
    
    return encryptedData;
  } catch (error) {
    console.error(`[DB DEBUG] Error getting encrypted profile data: ${error instanceof Error ? error.message : String(error)}`);
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
    console.log('[DB DEBUG] Invalid userId provided to updateEncryptedProfileData:', userId);
    throw new Error('Invalid userId');
  }
  
  try {
    console.log(`[DB DEBUG] Updating encrypted profile data for userId: ${userId}`);
    console.log(`[DB DEBUG] Database mode: ${USE_DATABASE ? 'PostgreSQL' : 'In-Memory'}`);
    console.log(`[DB DEBUG] Encrypted data: data length=${encryptedData.data ? encryptedData.data.length : 0}, iv length=${encryptedData.iv ? encryptedData.iv.length : 0}`);
    
    let result = null;
    
    if (USE_DATABASE) {
      console.log(`[DB DEBUG] Using database storage for updating encrypted data`);
      result = await pg.updateEncryptedProfileData(userId, encryptedData);
    } else {
      console.log(`[DB DEBUG] Using in-memory storage for updating encrypted data`);
      result = await memory.saveEncryptedProfileDataToMemory(userId, encryptedData.data, encryptedData.iv);
    }
    
    console.log(`[DB DEBUG] Encrypted data update result: ${result ? 'Success' : 'Failed'}`);
    
    if (result) {
      console.log(`[DB DEBUG] Updated encrypted data details: userId=${result.userId}, data length=${result.data ? result.data.length : 0}, iv present=${!!result.iv}`);
    }
    
    return result;
  } catch (error) {
    console.error(`[DB DEBUG] Error updating encrypted profile data: ${error instanceof Error ? error.message : String(error)}`);
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

/**
 * Get the PostgreSQL connection pool or a mock in-memory pool if database is not configured
 */
export function getPool(): any {
  if (pg.pool) {
    return pg.pool;
  }
  
  // If no database connection exists, provide a mock pool for compatibility
  // This allows code that depends on the pool to run in in-memory mode
  log('Using mock database pool for in-memory storage mode', 'database');
  
  const mockPool = {
    query: async (text: string, params: any[] = []): Promise<any> => {
      // Log the query for debugging
      log(`[MOCK DB] SQL: ${text}`, 'database');
      if (params.length > 0) {
        log(`[MOCK DB] Params: ${JSON.stringify(params)}`, 'database');
      }
      
      // Return a mock response for different query types
      if (text.trim().toUpperCase().startsWith('SELECT')) {
        return { rows: [], rowCount: 0 };
      } else if (text.trim().toUpperCase().startsWith('INSERT')) {
        return { rows: [{ id: 'mock-id', user_id: params[0], preferences: params[1], sharing_preferences: params[2], version: 1, created_at: new Date(), updated_at: new Date() }], rowCount: 1 };
      } else if (text.trim().toUpperCase().startsWith('UPDATE')) {
        return { rows: [{ id: 'mock-id', user_id: params[0], preferences: params[1], sharing_preferences: params[2], version: 1, created_at: new Date(), updated_at: new Date() }], rowCount: 1 };
      } else if (text.trim().toUpperCase().startsWith('DELETE')) {
        return { rows: [], rowCount: 0 };
      } else {
        return { rows: [], rowCount: 0 };
      }
    },
    connect: async () => {
      return {
        query: async () => ({ rows: [] }),
        release: () => {}
      };
    },
    on: (event: string, callback: Function) => {}
  };
  
  return mockPool;
} 