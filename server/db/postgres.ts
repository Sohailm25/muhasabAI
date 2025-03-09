/**
 * PostgreSQL implementation for user profile storage
 */
import pg from 'pg';
const { Pool } = pg;
import { UserProfile, EncryptedProfileData } from './operations';
import { log } from '../vite';

// PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

// Connection event handlers
pool.on('connect', () => {
  log('Connected to PostgreSQL database', 'database');
});

pool.on('error', (err) => {
  log(`PostgreSQL pool error: ${err.message}`, 'error');
});

/**
 * Initialize database tables
 */
export async function initializeDatabase(): Promise<void> {
  const client = await pool.connect();
  
  try {
    // Start transaction
    await client.query('BEGIN');
    
    // Create user_profiles table if it doesn't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_profiles (
        user_id TEXT PRIMARY KEY,
        preferences JSONB NOT NULL DEFAULT '{}',
        sharing_preferences JSONB NOT NULL DEFAULT '{}',
        version INTEGER NOT NULL DEFAULT 1,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    
    // Create encrypted_profile_data table if it doesn't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS encrypted_profile_data (
        user_id TEXT PRIMARY KEY REFERENCES user_profiles(user_id) ON DELETE CASCADE,
        data TEXT NOT NULL,
        iv TEXT NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    
    // Create indexes
    await client.query('CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_encrypted_profile_data_user_id ON encrypted_profile_data(user_id)');
    
    // Add function for automatic updated_at timestamp
    await client.query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ language 'plpgsql';
    `);
    
    // Add triggers for updated_at
    await client.query(`
      DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
      CREATE TRIGGER update_user_profiles_updated_at
      BEFORE UPDATE ON user_profiles
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
    `);
    
    await client.query(`
      DROP TRIGGER IF EXISTS update_encrypted_profile_data_updated_at ON encrypted_profile_data;
      CREATE TRIGGER update_encrypted_profile_data_updated_at
      BEFORE UPDATE ON encrypted_profile_data
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
    `);
    
    // Commit transaction
    await client.query('COMMIT');
    
    log('PostgreSQL database tables initialized successfully', 'database');
  } catch (error) {
    // Rollback transaction on error
    await client.query('ROLLBACK');
    log(`Error initializing database: ${error instanceof Error ? error.message : String(error)}`, 'error');
    throw error;
  } finally {
    client.release();
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
      preferences: row.preferences,
      sharingPreferences: row.sharing_preferences,
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
 * Create a new user profile in the database
 */
export async function createUserProfile(profile: UserProfile): Promise<UserProfile> {
  if (!profile.userId) {
    throw new Error('Profile must have a userId');
  }
  
  const client = await pool.connect();
  
  try {
    // Start transaction
    await client.query('BEGIN');
    
    // Check if profile already exists
    const existingProfile = await client.query(
      'SELECT user_id FROM user_profiles WHERE user_id = $1',
      [profile.userId]
    );
    
    if (existingProfile.rows.length > 0) {
      throw new Error(`Profile already exists for userId: ${profile.userId}`);
    }
    
    // Insert new profile
    const result = await client.query(
      `INSERT INTO user_profiles 
        (user_id, preferences, sharing_preferences, version)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [
        profile.userId,
        profile.preferences || {},
        profile.sharingPreferences || {},
        profile.version || 1,
      ]
    );
    
    // Commit transaction
    await client.query('COMMIT');
    
    const row = result.rows[0];
    
    // Transform database row to UserProfile
    return {
      userId: row.user_id,
      preferences: row.preferences,
      sharingPreferences: row.sharing_preferences,
      version: row.version,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  } catch (error) {
    // Rollback transaction on error
    await client.query('ROLLBACK');
    log(`Error creating user profile in database: ${error instanceof Error ? error.message : String(error)}`, 'error');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Update a user profile in the database
 */
export async function updateUserProfile(userId: string, updates: Partial<UserProfile>): Promise<UserProfile> {
  if (!userId) {
    throw new Error('userId is required');
  }
  
  const client = await pool.connect();
  
  try {
    // Start transaction
    await client.query('BEGIN');
    
    // Get current profile for version check
    const currentProfile = await client.query(
      'SELECT version FROM user_profiles WHERE user_id = $1 FOR UPDATE',
      [userId]
    );
    
    if (currentProfile.rows.length === 0) {
      throw new Error(`Profile not found for userId: ${userId}`);
    }
    
    const currentVersion = currentProfile.rows[0].version;
    const newVersion = updates.version || currentVersion + 1;
    
    // Version conflict check - optional depending on your requirements
    if (updates.version && updates.version !== currentVersion && updates.version !== currentVersion + 1) {
      throw new Error(`Version conflict: Current version is ${currentVersion}, but update requested for version ${updates.version}`);
    }
    
    // Build update query dynamically based on provided fields
    let updateFields = [];
    let queryParams = [userId];
    let paramIndex = 2;
    
    if (updates.preferences !== undefined) {
      updateFields.push(`preferences = $${paramIndex++}`);
      queryParams.push(JSON.stringify(updates.preferences));
    }
    
    if (updates.sharingPreferences !== undefined) {
      updateFields.push(`sharing_preferences = $${paramIndex++}`);
      queryParams.push(JSON.stringify(updates.sharingPreferences));
    }
    
    // Always update version
    updateFields.push(`version = $${paramIndex++}`);
    queryParams.push(newVersion);
    
    if (updateFields.length === 0) {
      throw new Error('No fields to update');
    }
    
    // Execute update
    const result = await client.query(
      `UPDATE user_profiles 
       SET ${updateFields.join(', ')} 
       WHERE user_id = $1 
       RETURNING *`,
      queryParams
    );
    
    // Commit transaction
    await client.query('COMMIT');
    
    const row = result.rows[0];
    
    // Transform database row to UserProfile
    return {
      userId: row.user_id,
      preferences: row.preferences,
      sharingPreferences: row.sharing_preferences,
      version: row.version,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  } catch (error) {
    // Rollback transaction on error
    await client.query('ROLLBACK');
    log(`Error updating user profile in database: ${error instanceof Error ? error.message : String(error)}`, 'error');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Delete a user profile from the database
 */
export async function deleteUserProfile(userId: string): Promise<boolean> {
  if (!userId) return false;
  
  const client = await pool.connect();
  
  try {
    // Start transaction
    await client.query('BEGIN');
    
    // Delete profile (cascade will delete related encrypted data)
    const result = await client.query(
      'DELETE FROM user_profiles WHERE user_id = $1 RETURNING user_id',
      [userId]
    );
    
    // Commit transaction
    await client.query('COMMIT');
    
    return result.rows.length > 0;
  } catch (error) {
    // Rollback transaction on error
    await client.query('ROLLBACK');
    log(`Error deleting user profile from database: ${error instanceof Error ? error.message : String(error)}`, 'error');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Get encrypted profile data from the database
 */
export async function getEncryptedProfileData(userId: string): Promise<EncryptedProfileData | null> {
  if (!userId) return null;
  
  try {
    const result = await pool.query(
      'SELECT * FROM encrypted_profile_data WHERE user_id = $1',
      [userId]
    );
    
    if (result.rows.length === 0) {
      return null;
    }
    
    const row = result.rows[0];
    
    // Transform database row to EncryptedProfileData
    return {
      userId: row.user_id,
      data: row.data,
      iv: row.iv,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  } catch (error) {
    log(`Error getting encrypted profile data from database: ${error instanceof Error ? error.message : String(error)}`, 'error');
    throw error;
  }
}

/**
 * Update or create encrypted profile data in the database
 */
export async function updateEncryptedProfileData(
  userId: string, 
  encryptedData: { data: string; iv: string }
): Promise<EncryptedProfileData> {
  if (!userId) {
    throw new Error('userId is required');
  }
  
  if (!encryptedData || !encryptedData.data || !encryptedData.iv) {
    throw new Error('Encrypted data and IV are required');
  }
  
  const client = await pool.connect();
  
  try {
    // Start transaction
    await client.query('BEGIN');
    
    // Check if user profile exists
    const profileExists = await client.query(
      'SELECT user_id FROM user_profiles WHERE user_id = $1',
      [userId]
    );
    
    if (profileExists.rows.length === 0) {
      throw new Error(`User profile not found for userId: ${userId}`);
    }
    
    // Check if encrypted data already exists for this user
    const existingData = await client.query(
      'SELECT user_id FROM encrypted_profile_data WHERE user_id = $1',
      [userId]
    );
    
    let result;
    
    if (existingData.rows.length === 0) {
      // Insert new encrypted data
      result = await client.query(
        `INSERT INTO encrypted_profile_data 
          (user_id, data, iv) 
         VALUES ($1, $2, $3) 
         RETURNING *`,
        [userId, encryptedData.data, encryptedData.iv]
      );
    } else {
      // Update existing encrypted data
      result = await client.query(
        `UPDATE encrypted_profile_data 
         SET data = $2, iv = $3 
         WHERE user_id = $1 
         RETURNING *`,
        [userId, encryptedData.data, encryptedData.iv]
      );
    }
    
    // Commit transaction
    await client.query('COMMIT');
    
    const row = result.rows[0];
    
    // Transform database row to EncryptedProfileData
    return {
      userId: row.user_id,
      data: row.data,
      iv: row.iv,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  } catch (error) {
    // Rollback transaction on error
    await client.query('ROLLBACK');
    log(`Error updating encrypted profile data in database: ${error instanceof Error ? error.message : String(error)}`, 'error');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Delete encrypted profile data from the database
 */
export async function deleteEncryptedProfileData(userId: string): Promise<boolean> {
  if (!userId) return false;
  
  try {
    const result = await pool.query(
      'DELETE FROM encrypted_profile_data WHERE user_id = $1 RETURNING user_id',
      [userId]
    );
    
    return result.rows.length > 0;
  } catch (error) {
    log(`Error deleting encrypted profile data from database: ${error instanceof Error ? error.message : String(error)}`, 'error');
    throw error;
  }
} 