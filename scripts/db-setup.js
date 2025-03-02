#!/usr/bin/env node

/**
 * Database setup script for security personalization feature
 * Run this script to initialize the database tables for the first time
 * 
 * Usage:
 *   node scripts/db-setup.js
 *   
 * Environment variables:
 *   DATABASE_URL: PostgreSQL connection string
 *   NODE_ENV: Environment (development, production, test)
 */

// Set USE_DATABASE to true for this script
process.env.USE_DATABASE = 'true';

// Import necessary modules
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import fs from 'fs';

// Get current file directory with ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();

// Database URL is required
const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('\x1b[31m%s\x1b[0m', '❌ Error: DATABASE_URL environment variable is required');
  process.exit(1);
}

// Determine environment
const NODE_ENV = process.env.NODE_ENV || 'development';
console.log('\x1b[36m%s\x1b[0m', `🔧 Setting up database for ${NODE_ENV} environment`);
console.log('\x1b[36m%s\x1b[0m', `🔧 Database URL: ${maskDatabaseUrl(DATABASE_URL)}`);

// Run the database setup
runDatabaseSetup()
  .then(() => {
    console.log('\x1b[32m%s\x1b[0m', '✅ Database setup completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\x1b[31m%s\x1b[0m', '❌ Database setup failed:');
    console.error(error);
    process.exit(1);
  });

async function runDatabaseSetup() {
  try {
    console.log('\x1b[36m%s\x1b[0m', '🛠️ Initializing database tables...');
    
    // Check if the dist directory exists
    const distPath = path.resolve(__dirname, '../dist');
    if (!fs.existsSync(distPath)) {
      console.error('\x1b[31m%s\x1b[0m', '❌ Error: dist directory not found. Please build the project first.');
      throw new Error('Build directory not found');
    }
    
    // Connection setup - direct PostgreSQL approach instead of using the imported module
    const { Pool } = await import('pg');
    const pool = new Pool({
      connectionString: DATABASE_URL,
      ssl: NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined
    });
    
    console.log('\x1b[36m%s\x1b[0m', '🔌 Connecting to PostgreSQL database...');
    const client = await pool.connect();
    console.log('\x1b[32m%s\x1b[0m', '✅ Connected to database');
    
    try {
      // Create tables directly
      console.log('\x1b[36m%s\x1b[0m', '📝 Creating or updating database tables...');
      
      // Start transaction
      await client.query('BEGIN');
      
      // Create user_profiles table
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
      
      // Create encrypted_profile_data table
      await client.query(`
        CREATE TABLE IF NOT EXISTS encrypted_profile_data (
          user_id TEXT PRIMARY KEY,
          encrypted_data TEXT NOT NULL,
          iv INTEGER[] NOT NULL,
          version INTEGER NOT NULL DEFAULT 1,
          created_at TIMESTAMP NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
          FOREIGN KEY (user_id) REFERENCES user_profiles(user_id) ON DELETE CASCADE
        )
      `);
      
      // Commit the transaction
      await client.query('COMMIT');
      console.log('\x1b[32m%s\x1b[0m', '✅ Database tables created successfully');
    } catch (error) {
      // Rollback the transaction on error
      await client.query('ROLLBACK');
      throw error;
    } finally {
      // Release the client
      client.release();
    }
    
    // Close the pool
    await pool.end();
    
    return true;
  } catch (error) {
    console.error('\x1b[31m%s\x1b[0m', '❌ Error creating database tables:');
    console.error(error);
    return Promise.reject(error);
  }
}

// Utility function to mask sensitive information in database URL for logging
function maskDatabaseUrl(url) {
  try {
    const maskedUrl = new URL(url);
    if (maskedUrl.password) {
      maskedUrl.password = '****';
    }
    return maskedUrl.toString();
  } catch (error) {
    return url.replace(/:[^:@/]+@/, ':****@');
  }
} 