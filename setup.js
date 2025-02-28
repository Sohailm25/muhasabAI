#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('\n🌙 Ramadan Reflections - Setup Assistant\n');

// Check if .env exists
const envPath = path.join(__dirname, '.env');
if (!fs.existsSync(envPath)) {
  console.log('Creating .env file from template...');
  fs.copyFileSync(path.join(__dirname, '.env.example'), envPath);
} else {
  console.log('.env file already exists.');
}

// Prompt for Anthropic API key
rl.question('\nDo you have an Anthropic API key? (y/n): ', (hasKey) => {
  if (hasKey.toLowerCase() === 'y') {
    rl.question('Enter your Anthropic API key: ', (apiKey) => {
      if (apiKey) {
        const envContent = fs.readFileSync(envPath, 'utf8')
          .replace('ANTHROPIC_API_KEY=your_anthropic_api_key_here', `ANTHROPIC_API_KEY=${apiKey}`);
        
        fs.writeFileSync(envPath, envContent);
        console.log('API key saved to .env file.');
      }
      
      continueSetup();
    });
  } else {
    console.log('\n⚠️ You will need an Anthropic API key to use the Claude features.');
    console.log('Get one at: https://console.anthropic.com/');
    continueSetup();
  }
});

function continueSetup() {
  rl.question('\nWould you like to install dependencies now? (y/n): ', (installDeps) => {
    if (installDeps.toLowerCase() === 'y') {
      console.log('\nInstalling dependencies...');
      try {
        execSync('npm install', { stdio: 'inherit' });
        console.log('Dependencies installed successfully.');
      } catch (error) {
        console.error('Error installing dependencies:', error);
      }
    }
    
    console.log('\n✅ Setup completed!');
    console.log('\nTo start the development server:');
    console.log('  npm run dev');
    console.log('\nFor more information, see the README.md file.');
    
    rl.close();
  });
} 