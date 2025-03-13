import { Pool } from 'pg';
import { convertPgError, NotFoundError, DatabaseError } from '../utils/errors';
import { log } from '../vite';

// In-memory storage for profiles when database is not available
const inMemoryProfiles = new Map<string, any>();

/**
 * User profile repository
 * Handles database operations for user profiles with robust error handling
 */
export class ProfileRepository {
  private db: Pool;
  private isInMemoryMode: boolean;
  
  constructor(db: Pool) {
    this.db = db;
    // Detect if we're using a mock pool (in-memory mode)
    this.isInMemoryMode = !(db as any)._connected;
    if (this.isInMemoryMode) {
      log('[PROFILE_REPO] Operating in in-memory mode', 'database');
    }
  }
  
  /**
   * Get user profile by user ID
   */
  async getUserProfileById(userId: string) {
    console.log(`[PROFILE_REPO] Getting profile for userId: ${userId}`);
    
    try {
      if (this.isInMemoryMode) {
        // Check in-memory storage
        if (inMemoryProfiles.has(userId)) {
          console.log(`[PROFILE_REPO] Found in-memory profile for userId: ${userId}`);
          return inMemoryProfiles.get(userId);
        } else {
          console.log(`[PROFILE_REPO] No in-memory profile found for userId: ${userId}`);
          throw new NotFoundError('User profile');
        }
      }
      
      const result = await this.db.query(`
        SELECT * FROM user_profiles WHERE user_id = $1
      `, [userId]);
      
      if (result.rows.length === 0) {
        console.log(`[PROFILE_REPO] No profile found for userId: ${userId}`);
        throw new NotFoundError('User profile');
      }
      
      console.log(`[PROFILE_REPO] Found profile for userId: ${userId}`);
      return result.rows[0];
    } catch (error) {
      console.error(`[PROFILE_REPO] Error getting profile for userId: ${userId}`, error);
      
      if (error instanceof NotFoundError) {
        throw error;
      }
      
      throw convertPgError(error);
    }
  }
  
  /**
   * Create user profile with fallback for missing version column
   */
  async createUserProfile(profile: any) {
    console.log(`[PROFILE_REPO] Creating profile for userId: ${profile.userId}`);
    
    try {
      if (this.isInMemoryMode) {
        // Store in in-memory storage
        const newProfile = {
          id: Math.random().toString(36).substring(2, 15),
          user_id: profile.userId,
          preferences: profile.preferences || {},
          sharing_preferences: profile.sharingPreferences || {},
          version: 1,
          created_at: new Date(),
          updated_at: new Date()
        };
        
        inMemoryProfiles.set(profile.userId, newProfile);
        console.log(`[PROFILE_REPO] In-memory profile created for userId: ${profile.userId}`);
        return newProfile;
      }
      
      // First try with version column
      console.log('[PROFILE_REPO] Attempting to create profile with version column');
      const result = await this.db.query(`
        INSERT INTO user_profiles (
          user_id, 
          preferences, 
          sharing_preferences, 
          version
        )
        VALUES ($1, $2, $3, $4)
        RETURNING *
      `, [
        profile.userId,
        JSON.stringify(profile.preferences || {}),
        JSON.stringify(profile.sharingPreferences || {}),
        1
      ]);
      
      console.log(`[PROFILE_REPO] Profile created successfully for userId: ${profile.userId}`);
      return result.rows[0];
    } catch (error) {
      // If version column doesn't exist, try without it
      if ((error as any).code === '42703' && (error as any).message.includes('column "version"')) {
        console.warn('[PROFILE_REPO] Version column not found, falling back to insert without version');
        
        try {
          const fallbackResult = await this.db.query(`
            INSERT INTO user_profiles (
              user_id, 
              preferences, 
              sharing_preferences
            )
            VALUES ($1, $2, $3)
            RETURNING *
          `, [
            profile.userId,
            JSON.stringify(profile.preferences || {}),
            JSON.stringify(profile.sharingPreferences || {})
          ]);
          
          console.log(`[PROFILE_REPO] Profile created successfully (fallback) for userId: ${profile.userId}`);
          return fallbackResult.rows[0];
        } catch (fallbackError) {
          console.error(`[PROFILE_REPO] Error in fallback profile creation for userId: ${profile.userId}`, fallbackError);
          throw convertPgError(fallbackError);
        }
      }
      
      console.error(`[PROFILE_REPO] Error creating profile for userId: ${profile.userId}`, error);
      throw convertPgError(error);
    }
  }
  
  /**
   * Update user profile with fallback for missing version column
   */
  async updateUserProfile(profile: any) {
    console.log(`[PROFILE_REPO] Updating profile for userId: ${profile.userId}`);
    
    try {
      // First check if profile exists
      await this.getUserProfileById(profile.userId);
      
      if (this.isInMemoryMode) {
        // Update in-memory storage
        const existingProfile = inMemoryProfiles.get(profile.userId);
        const updatedProfile = {
          ...existingProfile,
          preferences: profile.preferences || existingProfile.preferences,
          sharing_preferences: profile.sharingPreferences || existingProfile.sharing_preferences,
          version: (existingProfile.version || 0) + 1,
          updated_at: new Date()
        };
        
        inMemoryProfiles.set(profile.userId, updatedProfile);
        console.log(`[PROFILE_REPO] In-memory profile updated for userId: ${profile.userId}`);
        return updatedProfile;
      }
      
      // Try update with version column
      console.log('[PROFILE_REPO] Attempting to update profile with version column');
      try {
        const result = await this.db.query(`
          UPDATE user_profiles
          SET 
            preferences = $2,
            sharing_preferences = $3,
            version = version + 1
          WHERE user_id = $1
          RETURNING *
        `, [
          profile.userId,
          JSON.stringify(profile.preferences || {}),
          JSON.stringify(profile.sharingPreferences || {})
        ]);
        
        console.log(`[PROFILE_REPO] Profile updated successfully for userId: ${profile.userId}`);
        return result.rows[0];
      } catch (error) {
        // If version column doesn't exist, try without it
        if ((error as any).code === '42703' && (error as any).message.includes('column "version"')) {
          console.warn('[PROFILE_REPO] Version column not found, falling back to update without version');
          
          const fallbackResult = await this.db.query(`
            UPDATE user_profiles
            SET 
              preferences = $2,
              sharing_preferences = $3
            WHERE user_id = $1
            RETURNING *
          `, [
            profile.userId,
            JSON.stringify(profile.preferences || {}),
            JSON.stringify(profile.sharingPreferences || {})
          ]);
          
          console.log(`[PROFILE_REPO] Profile updated successfully (fallback) for userId: ${profile.userId}`);
          return fallbackResult.rows[0];
        }
        
        throw error;
      }
    } catch (error) {
      console.error(`[PROFILE_REPO] Error updating profile for userId: ${profile.userId}`, error);
      
      if (error instanceof NotFoundError) {
        // If profile doesn't exist, create it
        console.log(`[PROFILE_REPO] Profile not found for update, creating new profile for userId: ${profile.userId}`);
        return this.createUserProfile(profile);
      }
      
      throw convertPgError(error);
    }
  }
  
  /**
   * Create or update user profile
   * Single endpoint that handles both creation and updates
   */
  async createOrUpdateUserProfile(profile: any) {
    console.log(`[PROFILE_REPO] Creating or updating profile for userId: ${profile.userId}`);
    
    try {
      // Check if profile exists
      try {
        await this.getUserProfileById(profile.userId);
        // If it exists, update it
        return this.updateUserProfile(profile);
      } catch (error) {
        // If it doesn't exist, create it
        if (error instanceof NotFoundError) {
          return this.createUserProfile(profile);
        }
        throw error;
      }
    } catch (error) {
      console.error(`[PROFILE_REPO] Error in createOrUpdateUserProfile for userId: ${profile.userId}`, error);
      
      if (error instanceof NotFoundError) {
        return this.createUserProfile(profile);
      }
      
      throw error;
    }
  }
  
  /**
   * Delete user profile
   */
  async deleteUserProfile(userId: string) {
    console.log(`[PROFILE_REPO] Deleting profile for userId: ${userId}`);
    
    try {
      if (this.isInMemoryMode) {
        // Delete from in-memory storage
        if (inMemoryProfiles.has(userId)) {
          const profile = inMemoryProfiles.get(userId);
          inMemoryProfiles.delete(userId);
          console.log(`[PROFILE_REPO] In-memory profile deleted for userId: ${userId}`);
          return profile;
        } else {
          console.log(`[PROFILE_REPO] No in-memory profile found to delete for userId: ${userId}`);
          throw new NotFoundError('User profile');
        }
      }
      
      const result = await this.db.query(`
        DELETE FROM user_profiles
        WHERE user_id = $1
        RETURNING *
      `, [userId]);
      
      if (result.rows.length === 0) {
        console.log(`[PROFILE_REPO] No profile found to delete for userId: ${userId}`);
        throw new NotFoundError('User profile');
      }
      
      console.log(`[PROFILE_REPO] Profile deleted successfully for userId: ${userId}`);
      return result.rows[0];
    } catch (error) {
      console.error(`[PROFILE_REPO] Error deleting profile for userId: ${userId}`, error);
      
      if (error instanceof NotFoundError) {
        throw error;
      }
      
      throw convertPgError(error);
    }
  }
} 