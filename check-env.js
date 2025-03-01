#!/usr/bin/env node

// Import dotenv at the top
import 'dotenv/config';

console.log('\n=== Environment Variables Check ===\n');

// Check if ANTHROPIC_API_KEY exists
if (process.env.ANTHROPIC_API_KEY) {
  const key = process.env.ANTHROPIC_API_KEY;
  const maskedKey = `${key.substring(0, 10)}...${key.substring(key.length - 4)}`;
  console.log('✅ ANTHROPIC_API_KEY is set');
  console.log(`   Value: ${maskedKey} (showing first 10 and last 4 characters for security)`);
  
  // Check if it starts with the expected prefix
  if (key.startsWith('sk-ant-')) {
    console.log('✅ ANTHROPIC_API_KEY has the correct format (starts with sk-ant-)');
  } else {
    console.log('❌ ANTHROPIC_API_KEY does not have the expected format');
    console.log('   It should start with "sk-ant-"');
  }
} else {
  console.log('❌ ANTHROPIC_API_KEY is NOT set in the environment variables');
}

// Check DATABASE_URL
if (process.env.DATABASE_URL) {
  console.log('✅ DATABASE_URL is set');
} else {
  console.log('ℹ️ DATABASE_URL is not set (this is fine for local development with in-memory storage)');
}

// Check NODE_ENV
if (process.env.NODE_ENV) {
  console.log(`✅ NODE_ENV is set to "${process.env.NODE_ENV}"`);
} else {
  console.log('ℹ️ NODE_ENV is not set (will default to development)');
}

console.log('\n=== End of Check ===\n'); 