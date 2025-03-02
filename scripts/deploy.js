#!/usr/bin/env node

/**
 * Railway deployment script
 * This script is used by Railway to deploy the application
 * It handles database setup and application startup
 */

const { execSync } = require('child_process');
const path = require('path');

// Ensure we're in the project root
const projectRoot = path.resolve(__dirname, '..');
process.chdir(projectRoot);

console.log('\x1b[36m%s\x1b[0m', '🚂 Starting Railway deployment process...');

// Check for required environment variables
if (!process.env.DATABASE_URL) {
  console.error('\x1b[31m%s\x1b[0m', '❌ DATABASE_URL environment variable is required for deployment');
  process.exit(1);
}

// Verify NODE_ENV is set to production for Railway deployments
if (process.env.NODE_ENV !== 'production') {
  console.log('\x1b[33m%s\x1b[0m', '⚠️ NODE_ENV is not set to production. Setting to production for deployment.');
  process.env.NODE_ENV = 'production';
}

// Set USE_DATABASE to true for production
process.env.USE_DATABASE = 'true';

// Install dependencies if needed
try {
  console.log('\x1b[36m%s\x1b[0m', '📦 Checking for dependencies...');
  execSync('npm ci --production=false', { stdio: 'inherit' });
  console.log('\x1b[32m%s\x1b[0m', '✅ Dependencies installed');
} catch (error) {
  console.error('\x1b[31m%s\x1b[0m', '❌ Failed to install dependencies');
  console.error(error);
  process.exit(1);
}

// Build the project
try {
  console.log('\x1b[36m%s\x1b[0m', '🔨 Building project...');
  execSync('npm run build', { stdio: 'inherit' });
  console.log('\x1b[32m%s\x1b[0m', '✅ Build completed');
} catch (error) {
  console.error('\x1b[31m%s\x1b[0m', '❌ Build failed');
  console.error(error);
  process.exit(1);
}

// Initialize the database
try {
  console.log('\x1b[36m%s\x1b[0m', '🗄️ Setting up database...');
  execSync('node scripts/db-setup.js', { stdio: 'inherit' });
  console.log('\x1b[32m%s\x1b[0m', '✅ Database setup completed');
} catch (error) {
  console.error('\x1b[31m%s\x1b[0m', '❌ Database setup failed');
  console.error(error);
  process.exit(1);
}

// Start the application
try {
  console.log('\x1b[36m%s\x1b[0m', '🚀 Starting application...');
  
  // Check if this is a standalone deployment or a service managed by Railway
  if (process.env.RAILWAY_STATIC_URL) {
    console.log('\x1b[36m%s\x1b[0m', '🔗 Railway service detected, starting server');
    execSync('npm start', { stdio: 'inherit' });
  } else {
    console.log('\x1b[32m%s\x1b[0m', '✅ Application is ready to be started by Railway');
    process.exit(0);
  }
} catch (error) {
  console.error('\x1b[31m%s\x1b[0m', '❌ Failed to start application');
  console.error(error);
  process.exit(1);
} 