import { Pool } from 'pg';

/**
 * Migration to add version column to user_profiles table
 */
export async function up(db: Pool) {
  console.log('[MIGRATION:001] Adding version column to user_profiles table');
  
  try {
    // First check if the column already exists
    const columnCheck = await db.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'user_profiles' AND column_name = 'version'
      )
    `);
    
    if (columnCheck.rows[0].exists) {
      console.log('[MIGRATION:001] Version column already exists, skipping');
      return;
    }
    
    // Add the version column
    console.log('[MIGRATION:001] Adding version column');
    await db.query(`
      ALTER TABLE user_profiles 
      ADD COLUMN version INTEGER DEFAULT 1
    `);
    
    console.log('[MIGRATION:001] Version column added successfully');
  } catch (error) {
    console.error('[MIGRATION:001] Error adding version column:', error);
    throw error;
  }
}

/**
 * Rollback migration
 */
export async function down(db: Pool) {
  console.log('[MIGRATION:001] Rolling back: removing version column from user_profiles table');
  
  try {
    await db.query(`
      ALTER TABLE user_profiles 
      DROP COLUMN IF EXISTS version
    `);
    
    console.log('[MIGRATION:001] Version column removed successfully');
  } catch (error) {
    console.error('[MIGRATION:001] Error removing version column:', error);
    throw error;
  }
} 