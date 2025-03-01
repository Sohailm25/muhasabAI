#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

// Get __dirname equivalent in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create require function for importing JSON
const require = createRequire(import.meta.url);

console.log('\n🔍 Ramadan Reflections - Testing Setup\n');

// Check if .env exists and load it
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  console.log('✅ .env file found');
  dotenv.config();
} else {
  console.log('❌ .env file not found. Please run setup.js first.');
  process.exit(1);
}

// Check Anthropic API key
if (process.env.ANTHROPIC_API_KEY && process.env.ANTHROPIC_API_KEY !== 'your_anthropic_api_key_here') {
  console.log('✅ Anthropic API key found');
} else {
  console.log('❌ Anthropic API key not found in .env file');
}

// Check Node.js version
try {
  const nodeVersion = process.version;
  console.log(`✅ Node.js version: ${nodeVersion}`);
  
  // Check if Node version is >= 18
  const versionNumber = parseInt(nodeVersion.slice(1).split('.')[0], 10);
  if (versionNumber < 18) {
    console.log('⚠️ Warning: Node.js version 18 or higher is recommended');
  }
} catch (error) {
  console.error('❌ Could not determine Node.js version', error);
}

// Check for required directories
const requiredDirs = ['client', 'server', 'shared'];
let allDirsExist = true;
requiredDirs.forEach(dir => {
  if (fs.existsSync(path.join(__dirname, dir))) {
    console.log(`✅ ${dir} directory found`);
  } else {
    console.log(`❌ ${dir} directory not found`);
    allDirsExist = false;
  }
});

// Check package.json
try {
  const packageJson = require('./package.json');
  console.log('✅ package.json found');
  
  // Check for essential dependencies
  const requiredDeps = [
    '@anthropic-ai/sdk', 
    'express', 
    'react', 
    'drizzle-orm',
    'node-whisper'
  ];
  
  let missingDeps = [];
  requiredDeps.forEach(dep => {
    if (!packageJson.dependencies[dep]) {
      missingDeps.push(dep);
    }
  });
  
  if (missingDeps.length > 0) {
    console.log(`❌ Missing dependencies: ${missingDeps.join(', ')}`);
  } else {
    console.log('✅ All essential dependencies found');
  }
  
} catch (error) {
  console.error('❌ Could not read package.json', error);
}

// Check for FFmpeg installation
try {
  console.log('\nChecking for required external dependencies:');
  
  // Try different common paths for FFmpeg on macOS
  try {
    execSync('ffmpeg -version', { stdio: 'ignore' });
    console.log('✅ FFmpeg is installed');
  } catch (error) {
    // Try with Homebrew path on Apple Silicon Macs
    try {
      execSync('/opt/homebrew/bin/ffmpeg -version', { stdio: 'ignore' });
      console.log('✅ FFmpeg is installed (Homebrew on Apple Silicon)');
    } catch (error) {
      // Try with Homebrew path on Intel Macs
      try {
        execSync('/usr/local/bin/ffmpeg -version', { stdio: 'ignore' });
        console.log('✅ FFmpeg is installed (Homebrew on Intel Mac)');
      } catch (error) {
        console.log('❌ FFmpeg is not installed. This is required for audio transcription.');
        console.log('   Please install FFmpeg from https://ffmpeg.org/ or using your package manager.');
      }
    }
  }
} catch (error) {
  console.log('❌ Error checking for FFmpeg:', error);
}

// Check for Whisper CLI installation
try {
  execSync('whisper --help', { stdio: 'ignore' });
  console.log('✅ OpenAI Whisper CLI is installed');
} catch (error) {
  // CLI not found, check for Python module
  try {
    execSync('python3 -m whisper --help', { stdio: 'ignore' });
    console.log('✅ OpenAI Whisper Python module is installed');
  } catch (pythonModuleError) {
    console.log('❌ OpenAI Whisper is not installed. This is required for audio transcription.');
    console.log('   Please install it using: pip install -U openai-whisper');
    console.log('   For more information: https://github.com/openai/whisper');
  }
}

// Final status
console.log('\n📊 Setup Check Summary');
console.log('=====================================');

if (
  fs.existsSync(envPath) && 
  process.env.ANTHROPIC_API_KEY && 
  process.env.ANTHROPIC_API_KEY !== 'your_anthropic_api_key_here' && 
  allDirsExist
) {
  console.log('✅ Your setup appears to be correct!');
  console.log('\nTo start the development server:');
  console.log('  npm run dev');
} else {
  console.log('⚠️ Some issues were detected with your setup.');
  console.log('Please refer to the README.md file to resolve them.');
}

console.log('\n'); 