import pkg from 'pg';
const { Pool } = pkg;
import { drizzle } from "drizzle-orm/node-postgres";
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import { log } from "./vite";
import { 
  pgTable, 
  uuid, 
  timestamp, 
  text, 
  varchar,
  index,
  type AnyPgColumn,
  boolean,
  integer,
  json
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import * as path from 'path';

// Configure WebSocket for Neon serverless
neonConfig.webSocketConstructor = ws;

// Determine if we're using a database or in-memory storage
const usingDatabase = !!process.env.DATABASE_URL;

// Log the storage mode
log(`Database module initialized: ${usingDatabase ? 'Using database storage' : 'Using in-memory storage'}`, 'database');

// Only create the database connection if we have a DATABASE_URL
let pool: pkg.Pool | undefined = undefined;
let db: any = undefined;

// Test database connection
async function testConnection() {
  if (!pool) return false;
  
  try {
    const client = await pool.connect();
    const res = await client.query('SELECT NOW()');
    client.release();
    log('Database connection test successful', 'database');
    return true;
  } catch (error) {
    log(`Database connection test failed: ${error}`, 'database');
    return false;
  }
}

// Create a connection pool and database client only if DATABASE_URL is provided
if (usingDatabase && process.env.DATABASE_URL) {
  try {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 20, // Adjust connection pool size for Railway
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });
    
    // Add error handler to the pool
    pool.on('error', (err) => {
      log(`Unexpected database error: ${err}`, 'database');
      // Don't crash the app, just log the error
    });
    
    // Initialize Drizzle with the pool
    db = drizzle(pool);
    
    // Test connection
    testConnection()
      .then(isConnected => {
        if (isConnected) {
          log("Database connection established successfully", 'database');
        } else {
          log("Database connection test failed", 'database');
        }
      })
      .catch(err => {
        log(`Error testing database connection: ${err}`, 'database');
      });
      
  } catch (error) {
    log(`Failed to connect to database: ${error}`, 'database');
    log("Will use in-memory storage instead", 'database');
  }
}

// Add user_profiles table
export const user_profiles = pgTable('user_profiles', {
  user_id: uuid('user_id').primaryKey(),
  created_at: timestamp('created_at').notNull().defaultNow(),
  updated_at: timestamp('updated_at').notNull().defaultNow(),
  general_preferences: text('general_preferences').notNull().default('{}'),
  privacy_settings: text('privacy_settings').notNull().default('{}'),
  usage_stats: text('usage_stats').notNull().default('{}'),
  key_verification_hash: varchar('key_verification_hash', { length: 255 }),
});

// Add users table for authentication
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  password: varchar('password', { length: 255 }),
  google_id: varchar('google_id', { length: 255 }),
  is_first_login: boolean('is_first_login').notNull().default(true),
  created_at: timestamp('created_at').notNull().defaultNow(),
  updated_at: timestamp('updated_at').notNull().defaultNow(),
}, (table) => {
  return {
    emailIdx: index('email_idx').on(table.email),
  };
});

// Add tokens table for JWT token management
export const tokens = pgTable('tokens', {
  id: uuid('id').primaryKey().defaultRandom(),
  user_id: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  token: text('token').notNull(),
  created_at: timestamp('created_at').notNull().defaultNow(),
  expires_at: timestamp('expires_at').notNull(),
  is_revoked: boolean('is_revoked').notNull().default(false),
}, (table) => {
  return {
    tokenIdx: index('token_idx').on(table.token),
    userIdIdx: index('token_user_id_idx').on(table.user_id),
  };
});

// Add encrypted_profiles table with proper references
export const encrypted_profiles = pgTable('encrypted_profiles', {
  user_id: uuid('user_id')
    .primaryKey()
    .references(() => user_profiles.user_id, { onDelete: 'cascade' }),
  data: text('data').notNull(),
  iv: text('iv').notNull(),
  created_at: timestamp('created_at').notNull().defaultNow(),
  updated_at: timestamp('updated_at').notNull().defaultNow(),
});

// Add identity frameworks table
export const identity_frameworks = pgTable('identity_frameworks', {
  id: uuid('id').primaryKey().defaultRandom(),
  user_id: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 255 }).notNull(),
  created_at: timestamp('created_at').notNull().defaultNow(),
  updated_at: timestamp('updated_at').notNull().defaultNow(),
  completion_percentage: integer('completion_percentage').notNull().default(0),
}, (table) => {
  return {
    userIdIdx: index('framework_user_id_idx').on(table.user_id),
  };
});

// Add framework components table
export const framework_components = pgTable('framework_components', {
  id: uuid('id').primaryKey().defaultRandom(),
  framework_id: uuid('framework_id').notNull().references(() => identity_frameworks.id, { onDelete: 'cascade' }),
  component_type: varchar('component_type', { length: 50 }).notNull(), // 'identity', 'vision', 'systems', 'goals', 'habits', 'triggers'
  content: json('content').notNull().default({}),
  created_at: timestamp('created_at').notNull().defaultNow(),
  updated_at: timestamp('updated_at').notNull().defaultNow(),
}, (table) => {
  return {
    frameworkIdIdx: index('component_framework_id_idx').on(table.framework_id),
    componentTypeIdx: index('component_type_idx').on(table.component_type),
  };
});

// Add habit tracking table
export const habit_tracking = pgTable('habit_tracking', {
  id: uuid('id').primaryKey().defaultRandom(),
  component_id: uuid('component_id').notNull().references(() => framework_components.id, { onDelete: 'cascade' }),
  habit_index: integer('habit_index').notNull(), // Index of the habit in the habits array
  current_streak: integer('current_streak').notNull().default(0),
  longest_streak: integer('longest_streak').notNull().default(0),
  last_completed: timestamp('last_completed'),
  created_at: timestamp('created_at').notNull().defaultNow(),
  updated_at: timestamp('updated_at').notNull().defaultNow(),
}, (table) => {
  return {
    componentIdIdx: index('habit_component_id_idx').on(table.component_id),
  };
});

/**
 * Initialize the database for Railway deployment
 * This ensures all necessary tables are created on startup
 */
export async function initializeDatabase() {
  if (!usingDatabase || !db) {
    log("Skipping database initialization: No database connection", 'database');
    return false;
  }
  
  try {
    log("Starting database initialization...", 'database');
    
    // Simple approach - create tables if they don't exist
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS user_profiles (
        user_id UUID PRIMARY KEY,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
        general_preferences TEXT NOT NULL DEFAULT '{}',
        privacy_settings TEXT NOT NULL DEFAULT '{}',
        usage_stats TEXT NOT NULL DEFAULT '{}',
        key_verification_hash VARCHAR(255)
      );
      
      CREATE TABLE IF NOT EXISTS encrypted_profiles (
        user_id UUID PRIMARY KEY,
        data TEXT NOT NULL,
        iv TEXT NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
        FOREIGN KEY (user_id) REFERENCES user_profiles(user_id) ON DELETE CASCADE
      );
      
      CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);

      CREATE TABLE IF NOT EXISTS identity_frameworks (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL,
        title VARCHAR(255) NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
        completion_percentage INTEGER NOT NULL DEFAULT 0,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );
      
      CREATE INDEX IF NOT EXISTS framework_user_id_idx ON identity_frameworks(user_id);
      
      CREATE TABLE IF NOT EXISTS framework_components (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        framework_id UUID NOT NULL,
        component_type VARCHAR(50) NOT NULL,
        content JSONB NOT NULL DEFAULT '{}',
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
        FOREIGN KEY (framework_id) REFERENCES identity_frameworks(id) ON DELETE CASCADE
      );
      
      CREATE INDEX IF NOT EXISTS component_framework_id_idx ON framework_components(framework_id);
      CREATE INDEX IF NOT EXISTS component_type_idx ON framework_components(component_type);
      
      CREATE TABLE IF NOT EXISTS habit_tracking (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        component_id UUID NOT NULL,
        habit_index INTEGER NOT NULL,
        current_streak INTEGER NOT NULL DEFAULT 0,
        longest_streak INTEGER NOT NULL DEFAULT 0,
        last_completed TIMESTAMP,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
        FOREIGN KEY (component_id) REFERENCES framework_components(id) ON DELETE CASCADE
      );
      
      CREATE INDEX IF NOT EXISTS habit_component_id_idx ON habit_tracking(component_id);
    `);
    
    // For a more robust approach with migrations, use:
    // if (process.env.NODE_ENV === 'production') {
    //   const migrationsFolder = path.join(process.cwd(), 'drizzle');
    //   await migrate(db, { migrationsFolder });
    //   log("Migrations completed successfully", 'database');
    // }
    
    log("Database initialization complete", 'database');
    return true;
  } catch (error) {
    log(`Error initializing database: ${error}`, 'database');
    return false;
  }
}

export { db, testConnection };
