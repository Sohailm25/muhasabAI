import fs from 'fs';
import path from 'path';
import { Pool } from 'pg';
import { fileURLToPath } from 'url';

// Create __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Migration manager for handling database schema migrations
 */
export async function runMigrations(db: Pool) {
  console.log('[MIGRATION] Starting migration process');
  try {
    // Create migrations table if it doesn't exist
    console.log('[MIGRATION] Ensuring migrations table exists');
    await db.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        applied_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    
    // Get applied migrations
    console.log('[MIGRATION] Checking for previously applied migrations');
    const result = await db.query('SELECT name FROM migrations');
    const appliedMigrations = result.rows.map(row => row.name);
    console.log(`[MIGRATION] Found ${appliedMigrations.length} previously applied migrations`);
    
    // Get all migration files
    const migrationsDir = path.join(__dirname, 'migrations');
    
    // Create migrations directory if it doesn't exist
    if (!fs.existsSync(migrationsDir)) {
      console.log(`[MIGRATION] Creating migrations directory: ${migrationsDir}`);
      fs.mkdirSync(migrationsDir, { recursive: true });
    }
    
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.js') || file.endsWith('.ts'))
      .sort();
    
    console.log(`[MIGRATION] Found ${migrationFiles.length} migration files`);
    
    // Run pending migrations
    let appliedCount = 0;
    for (const file of migrationFiles) {
      if (!appliedMigrations.includes(file)) {
        console.log(`[MIGRATION] Running migration: ${file}`);
        
        try {
          // Import migration
          const migrationPath = path.join(migrationsDir, file);
          console.log(`[MIGRATION] Importing migration from: ${migrationPath}`);
          const migrationUrl = new URL(`file://${path.resolve(migrationPath)}`);
          const migration = await import(migrationUrl.href);
          
          // Run migration
          console.log(`[MIGRATION] Executing up() function for: ${file}`);
          await migration.up(db);
          
          // Record migration
          console.log(`[MIGRATION] Recording migration in database: ${file}`);
          await db.query('INSERT INTO migrations (name) VALUES ($1)', [file]);
          
          console.log(`[MIGRATION] Successfully completed migration: ${file}`);
          appliedCount++;
        } catch (migrationError) {
          console.error(`[MIGRATION] Error running migration ${file}:`, migrationError);
          throw migrationError;
        }
      } else {
        console.log(`[MIGRATION] Skipping already applied migration: ${file}`);
      }
    }
    
    console.log(`[MIGRATION] All migrations completed. Applied ${appliedCount} new migrations.`);
    return true;
  } catch (error) {
    console.error('[MIGRATION] Error running migrations:', error);
    throw error;
  }
}

/**
 * Validate database schema to ensure all required tables and columns exist
 */
export async function validateDatabaseSchema(db: Pool) {
  console.log('[SCHEMA] Starting database schema validation');
  try {
    // Check if user_profiles table exists
    console.log('[SCHEMA] Checking if user_profiles table exists');
    const tableResult = await db.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'user_profiles'
      )
    `);
    
    if (!tableResult.rows[0].exists) {
      console.error('[SCHEMA] user_profiles table does not exist');
      return false;
    }
    
    console.log('[SCHEMA] user_profiles table exists');
    
    // Check for required columns
    console.log('[SCHEMA] Checking for required columns in user_profiles table');
    const columnsResult = await db.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'user_profiles'
    `);
    
    const columns = columnsResult.rows.map(row => row.column_name);
    console.log('[SCHEMA] Found columns:', columns);
    
    const requiredColumns = ['user_id', 'preferences', 'sharing_preferences'];
    const missingColumns = requiredColumns.filter(col => !columns.includes(col));
    
    if (missingColumns.length > 0) {
      console.error(`[SCHEMA] Missing required columns in user_profiles table: ${missingColumns.join(', ')}`);
      return false;
    }
    
    // Check if version column exists
    const hasVersionColumn = columns.includes('version');
    console.log(`[SCHEMA] Version column exists: ${hasVersionColumn}`);
    
    console.log('[SCHEMA] Database schema validation successful');
    return true;
  } catch (error) {
    console.error('[SCHEMA] Error validating schema:', error);
    return false;
  }
} 