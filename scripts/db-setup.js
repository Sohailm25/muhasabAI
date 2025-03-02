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
    
    // Import and use the initializer from the codebase
    const { initializeDatabase } = await import('../dist/server/db/index.js');
    
    // Initialize the database
    await initializeDatabase();
    
    console.log('\x1b[32m%s\x1b[0m', '✅ Database tables created successfully');
    
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