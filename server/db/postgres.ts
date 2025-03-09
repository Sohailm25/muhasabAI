/**
 * PostgreSQL implementation for user profile storage
 */
import pg from 'pg';
const { Pool } = pg;
import { UserProfile, EncryptedProfileData } from './operations';
import { log } from '../vite';

// PostgreSQL connection pool
let pool: pg.Pool | null = null;

try {
  console.log('[POSTGRES] Initializing PostgreSQL connection pool');
  console.log('[POSTGRES] Database URL configured:', process.env.DATABASE_URL ? 'Yes' : 'No');
  console.log('[POSTGRES] Environment:', process.env.NODE_ENV);
  
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  });
  
  console.log('[POSTGRES] PostgreSQL connection pool initialized successfully');
} catch (error) {
  console.error('[POSTGRES] Error initializing PostgreSQL connection pool:', error);
  pool = null;
}

// Connection event handlers
if (pool) {
  pool.on('connect', () => {
    console.log('[POSTGRES] Connected to PostgreSQL database');
    log('Connected to PostgreSQL database', 'database');
  });
  
  pool.on('error', (err) => {
    console.error('[POSTGRES] PostgreSQL connection error:', err);
    log(`PostgreSQL connection error: ${err.message}`, 'error');
  });
}

/**
 * Initialize the database
 */
export async function initializeDatabase(): Promise<void> {
  try {
    console.log('[POSTGRES] Starting database initialization');
    
    if (!pool) {
      console.error('[POSTGRES] PostgreSQL connection pool is not initialized');
      throw new Error('PostgreSQL connection pool is not initialized');
    }
    
    // Test connection
    console.log('[POSTGRES] Testing database connection');
    const client = await pool.connect();
    console.log('[POSTGRES] Database connection test successful');
    
    // Create tables if they don't exist
    console.log('[POSTGRES] Creating tables if they don\'t exist');
    
    // Create user_profiles table
    console.log('[POSTGRES] Creating user_profiles table');
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_profiles (
        user_id TEXT PRIMARY KEY,
        general_preferences JSONB NOT NULL DEFAULT '{}',
        privacy_settings JSONB NOT NULL DEFAULT '{}',
        version INTEGER NOT NULL DEFAULT 1,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      )
    `);
    console.log('[POSTGRES] user_profiles table created or already exists');
    
    // Create encrypted_profile_data table
    console.log('[POSTGRES] Creating encrypted_profile_data table');
    await client.query(`
      CREATE TABLE IF NOT EXISTS encrypted_profile_data (
        user_id TEXT PRIMARY KEY,
        data TEXT NOT NULL,
        iv TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      )
    `);
    console.log('[POSTGRES] encrypted_profile_data table created or already exists');
    
    // Create users table if it doesn't exist
    console.log('[POSTGRES] Creating users table');
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        password TEXT,
        google_id TEXT,
        is_first_login BOOLEAN NOT NULL DEFAULT TRUE,
        has_accepted_privacy_policy BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      )
    `);
    console.log('[POSTGRES] users table created or already exists');
    
    // Check if tables were created successfully
    console.log('[POSTGRES] Verifying tables exist');
    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    console.log('[POSTGRES] Tables in database:', tables.rows.map(row => row.table_name).join(', '));
    
    // Release client back to pool
    client.release();
    console.log('[POSTGRES] Database initialization complete');
  } catch (error) {
    console.error('[POSTGRES] Database initialization error:', error);
    throw error;
  }
}

/**
 * Get a user profile from the database
 */
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  if (!userId) {
    console.log('[POSTGRES DB] Invalid userId provided to getUserProfile');
    return null;
  }
  
  try {
    console.log(`[POSTGRES DB] Looking up profile for userId: ${userId}`);
    
    // Check if pool is initialized
    if (!pool) {
      console.error('[POSTGRES DB] Database pool is not initialized');
      return null;
    }
    
    console.log('[POSTGRES DB] Executing query: SELECT * FROM user_profiles WHERE user_id = $1');
    const result = await pool.query(
      'SELECT * FROM user_profiles WHERE user_id = $1',
      [userId]
    );
    
    console.log(`[POSTGRES DB] Query result rows: ${result.rows.length}`);
    
    if (result.rows.length === 0) {
      console.log(`[POSTGRES DB] No profile found for userId: ${userId}`);
      return null;
    }
    
    const row = result.rows[0];
    console.log(`[POSTGRES DB] Profile found for userId: ${userId}`);
    
    // Transform database row to UserProfile
    const profile = {
      userId: row.user_id,
      preferences: row.preferences || row.general_preferences,
      sharingPreferences: row.sharing_preferences || row.privacy_settings,
      version: row.version,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
    
    console.log(`[POSTGRES DB] Profile details: userId=${profile.userId}, preferences=${JSON.stringify(profile.preferences)}`);
    
    return profile;
  } catch (error) {
    console.error(`[POSTGRES DB] Error getting user profile from database: ${error instanceof Error ? error.message : String(error)}`);
    log(`Error getting user profile from database: ${error instanceof Error ? error.message : String(error)}`, 'error');
    throw error;
  }
}

/**
 * Create a user profile in the database
 */
export async function createUserProfile(profile: UserProfile): Promise<UserProfile> {
  try {
    console.log(`[POSTGRES DB] Creating profile for userId: ${profile.userId}`);
    
    // Check if pool is initialized
    if (!pool) {
      console.error('[POSTGRES DB] Database pool is not initialized');
      throw new Error('Database connection not available');
    }
    
    // Insert profile into database
    console.log('[POSTGRES DB] Executing INSERT query');
    const result = await pool.query(
      `INSERT INTO user_profiles(
        user_id, 
        general_preferences, 
        privacy_settings, 
        version, 
        created_at, 
        updated_at
      ) VALUES($1, $2, $3, $4, $5, $6) RETURNING *`,
      [
        profile.userId,
        JSON.stringify(profile.preferences || {}),
        JSON.stringify(profile.sharingPreferences || {}),
        profile.version || 1,
        profile.createdAt || new Date(),
        profile.updatedAt || new Date()
      ]
    );
    
    console.log(`[POSTGRES DB] Insert result rows: ${result.rows.length}`);
    
    if (result.rows.length === 0) {
      console.error('[POSTGRES DB] Failed to create profile - no rows returned');
      throw new Error('Failed to create profile');
    }
    
    const row = result.rows[0];
    console.log(`[POSTGRES DB] Profile created successfully for userId: ${profile.userId}`);
    
    // Transform database row to UserProfile
    const createdProfile: UserProfile = {
      userId: row.user_id,
      preferences: row.general_preferences,
      sharingPreferences: row.privacy_settings,
      version: row.version,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
    
    console.log(`[POSTGRES DB] Created profile details: userId=${createdProfile.userId}`);
    
    return createdProfile;
  } catch (error) {
    console.error(`[POSTGRES DB] Error creating user profile: ${error instanceof Error ? error.message : String(error)}`);
    log(`Error creating user profile: ${error instanceof Error ? error.message : String(error)}`, 'error');
    throw error;
  }
}

/**
 * Update a user profile in the database
 */
export async function updateUserProfile(userId: string, updates: Partial<UserProfile>): Promise<UserProfile> {
  try {
    console.log(`[POSTGRES DB] Updating profile for userId: ${userId}`);
    
    // Check if pool is initialized
    if (!pool) {
      console.error('[POSTGRES DB] Database pool is not initialized');
      throw new Error('Database connection not available');
    }
    
    // Build update query
    let updateFields: string[] = [];
    let queryParams: any[] = [userId];
    let paramIndex = 2;
    
    if (updates.preferences !== undefined) {
      updateFields.push(`general_preferences = $${paramIndex++}`);
      queryParams.push(JSON.stringify(updates.preferences));
    }
    
    if (updates.sharingPreferences !== undefined) {
      updateFields.push(`privacy_settings = $${paramIndex++}`);
      queryParams.push(JSON.stringify(updates.sharingPreferences));
    }
    
    if (updates.version !== undefined) {
      updateFields.push(`version = $${paramIndex++}`);
      queryParams.push(updates.version);
    }
    
    // Always update the updated_at timestamp
    updateFields.push(`updated_at = NOW()`);
    
    if (updateFields.length === 0) {
      console.log('[POSTGRES DB] No fields to update');
      // If no fields to update, just return the current profile
      const currentProfile = await getUserProfile(userId);
      if (!currentProfile) {
        throw new Error('Profile not found');
      }
      return currentProfile;
    }
    
    // Execute update query
    console.log(`[POSTGRES DB] Executing UPDATE query with fields: ${updateFields.join(', ')}`);
    const result = await pool.query(
      `UPDATE user_profiles 
       SET ${updateFields.join(', ')} 
       WHERE user_id = $1 
       RETURNING *`,
      queryParams
    );
    
    if (result.rows.length === 0) {
      console.error('[POSTGRES DB] Profile not found for update');
      throw new Error('Profile not found');
    }
    
    const row = result.rows[0];
    console.log(`[POSTGRES DB] Profile updated successfully for userId: ${userId}`);
    
    // Transform database row to UserProfile
    return {
      userId: row.user_id,
      preferences: row.general_preferences,
      sharingPreferences: row.privacy_settings,
      version: row.version,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  } catch (error) {
    console.error(`[POSTGRES DB] Error updating user profile: ${error instanceof Error ? error.message : String(error)}`);
    log(`Error updating user profile: ${error instanceof Error ? error.message : String(error)}`, 'error');
    throw error;
  }
}

/**
 * Delete a user profile from the database
 */
export async function deleteUserProfile(userId: string): Promise<boolean> {
  try {
    console.log(`[POSTGRES DB] Deleting profile for userId: ${userId}`);
    
    // Check if pool is initialized
    if (!pool) {
      console.error('[POSTGRES DB] Database pool is not initialized');
      throw new Error('Database connection not available');
    }
    
    // Delete profile from database
    console.log('[POSTGRES DB] Executing DELETE query');
    const result = await pool.query(
      'DELETE FROM user_profiles WHERE user_id = $1 RETURNING user_id',
      [userId]
    );
    
    const deleted = result.rows.length > 0;
    console.log(`[POSTGRES DB] Profile deletion result: ${deleted ? 'Successful' : 'Not found'}`);
    
    return deleted;
  } catch (error) {
    console.error(`[POSTGRES DB] Error deleting user profile: ${error instanceof Error ? error.message : String(error)}`);
    log(`Error deleting user profile: ${error instanceof Error ? error.message : String(error)}`, 'error');
    throw error;
  }
}

/**
 * Get encrypted profile data from the database
 */
export async function getEncryptedProfileData(userId: string): Promise<EncryptedProfileData | null> {
  try {
    console.log(`[POSTGRES DB] Getting encrypted profile data for userId: ${userId}`);
    
    // Check if pool is initialized
    if (!pool) {
      console.error('[POSTGRES DB] Database pool is not initialized');
      return null;
    }
    
    // Get encrypted data from database
    console.log('[POSTGRES DB] Executing SELECT query for encrypted data');
    const result = await pool.query(
      'SELECT * FROM encrypted_profile_data WHERE user_id = $1',
      [userId]
    );
    
    if (result.rows.length === 0) {
      console.log(`[POSTGRES DB] No encrypted data found for userId: ${userId}`);
      return null;
    }
    
    const row = result.rows[0];
    console.log(`[POSTGRES DB] Encrypted data found for userId: ${userId}`);
    
    // Transform database row to EncryptedProfileData
    return {
      userId: row.user_id,
      data: row.data,
      iv: row.iv,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  } catch (error) {
    console.error(`[POSTGRES DB] Error getting encrypted profile data: ${error instanceof Error ? error.message : String(error)}`);
    log(`Error getting encrypted profile data: ${error instanceof Error ? error.message : String(error)}`, 'error');
    throw error;
  }
}

/**
 * Update encrypted profile data in the database
 */
export async function updateEncryptedProfileData(
  userId: string, 
  encryptedData: { data: string; iv: string }
): Promise<EncryptedProfileData> {
  try {
    console.log(`[POSTGRES DB] Updating encrypted profile data for userId: ${userId}`);
    
    // Check if pool is initialized
    if (!pool) {
      console.error('[POSTGRES DB] Database pool is not initialized');
      throw new Error('Database connection not available');
    }
    
    // Check if encrypted data already exists
    console.log('[POSTGRES DB] Checking if encrypted data already exists');
    const existingData = await pool.query(
      'SELECT * FROM encrypted_profile_data WHERE user_id = $1',
      [userId]
    );
    
    let result;
    
    if (existingData.rows.length > 0) {
      // Update existing data
      console.log('[POSTGRES DB] Updating existing encrypted data');
      result = await pool.query(
        `UPDATE encrypted_profile_data 
         SET data = $2, iv = $3, updated_at = NOW() 
         WHERE user_id = $1 
         RETURNING *`,
        [userId, encryptedData.data, encryptedData.iv]
      );
    } else {
      // Insert new data
      console.log('[POSTGRES DB] Inserting new encrypted data');
      result = await pool.query(
        `INSERT INTO encrypted_profile_data(user_id, data, iv) 
         VALUES($1, $2, $3) 
         RETURNING *`,
        [userId, encryptedData.data, encryptedData.iv]
      );
    }
    
    if (result.rows.length === 0) {
      console.error('[POSTGRES DB] Failed to update/insert encrypted data');
      throw new Error('Failed to update encrypted profile data');
    }
    
    const row = result.rows[0];
    console.log(`[POSTGRES DB] Encrypted data updated successfully for userId: ${userId}`);
    
    // Transform database row to EncryptedProfileData
    return {
      userId: row.user_id,
      data: row.data,
      iv: row.iv,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  } catch (error) {
    console.error(`[POSTGRES DB] Error updating encrypted profile data: ${error instanceof Error ? error.message : String(error)}`);
    log(`Error updating encrypted profile data: ${error instanceof Error ? error.message : String(error)}`, 'error');
    throw error;
  }
}

/**
 * Delete encrypted profile data from the database
 */
export async function deleteEncryptedProfileData(userId: string): Promise<boolean> {
  try {
    console.log(`[POSTGRES DB] Deleting encrypted profile data for userId: ${userId}`);
    
    // Check if pool is initialized
    if (!pool) {
      console.error('[POSTGRES DB] Database pool is not initialized');
      throw new Error('Database connection not available');
    }
    
    // Delete encrypted data from database
    console.log('[POSTGRES DB] Executing DELETE query for encrypted data');
    const result = await pool.query(
      'DELETE FROM encrypted_profile_data WHERE user_id = $1 RETURNING user_id',
      [userId]
    );
    
    const deleted = result.rows.length > 0;
    console.log(`[POSTGRES DB] Encrypted data deletion result: ${deleted ? 'Successful' : 'Not found'}`);
    
    return deleted;
  } catch (error) {
    console.error(`[POSTGRES DB] Error deleting encrypted profile data: ${error instanceof Error ? error.message : String(error)}`);
    log(`Error deleting encrypted profile data: ${error instanceof Error ? error.message : String(error)}`, 'error');
    throw error;
  }
} 