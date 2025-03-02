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

// Require necessary modules
const path = require('path');
const { execSync } = require('child_process');

// Check for required environment variables
if (!process.env.DATABASE_URL) {
  console.error('\x1b[31m%s\x1b[0m', '[ERROR] DATABASE_URL environment variable is required');
  console.log('\x1b[33m%s\x1b[0m', 'Example: DATABASE_URL=postgres://username:password@localhost:5432/database_name');
  process.exit(1);
}

console.log('\x1b[36m%s\x1b[0m', '[INFO] Starting database setup...');
console.log('\x1b[36m%s\x1b[0m', `[INFO] Database URL: ${maskDatabaseUrl(process.env.DATABASE_URL)}`);
console.log('\x1b[36m%s\x1b[0m', `[INFO] Environment: ${process.env.NODE_ENV || 'development'}`);

// Build TypeScript files first to ensure we have the latest changes
try {
  console.log('\x1b[36m%s\x1b[0m', '[INFO] Building TypeScript files...');
  execSync('npx tsc --project tsconfig.server.json', { stdio: 'inherit' });
  console.log('\x1b[32m%s\x1b[0m', '[SUCCESS] TypeScript build completed');
} catch (error) {
  console.error('\x1b[31m%s\x1b[0m', '[ERROR] Failed to build TypeScript files');
  console.error(error);
  process.exit(1);
}

// Run the initialization script
async function runDatabaseSetup() {
  try {
    // Import the database initialization function
    // This needs to be imported after TypeScript compilation
    const { initializeDatabase } = require('../dist/server/db');
    
    console.log('\x1b[36m%s\x1b[0m', '[INFO] Running database initialization...');
    
    // Initialize the database
    await initializeDatabase();
    
    console.log('\x1b[32m%s\x1b[0m', '[SUCCESS] Database setup completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('\x1b[31m%s\x1b[0m', '[ERROR] Database setup failed:');
    console.error(error);
    process.exit(1);
  }
}

// Helper function to mask connection string for logging
function maskDatabaseUrl(url) {
  try {
    const maskedUrl = new URL(url);
    
    // Mask username and password if present
    if (maskedUrl.username) {
      maskedUrl.username = '****';
    }
    
    if (maskedUrl.password) {
      maskedUrl.password = '****';
    }
    
    return maskedUrl.toString();
  } catch (error) {
    // If URL parsing fails, do basic masking
    return url.replace(/\/\/([^:@]+)(:[^@]+)?@/, '//****:****@');
  }
}

// Run the setup
runDatabaseSetup(); 