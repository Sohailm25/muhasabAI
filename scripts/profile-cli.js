#!/usr/bin/env node

/**
 * Profile CLI Tool
 * 
 * A command-line tool for managing user profiles during development.
 * 
 * Usage:
 *   node profile-cli.js <command> [options]
 * 
 * Commands:
 *   list                  List all profiles in the database
 *   create                Create a new test profile
 *   get <userId>          Get a profile by user ID
 *   delete <userId>       Delete a profile by user ID
 *   test-api              Run a comprehensive test of the profile API
 *   reset-db              Reset the profile tables in the database
 * 
 * Options:
 *   --help, -h            Show this help message
 *   --format <format>     Output format (json, table) [default: table]
 *   --verbose, -v         Show verbose output
 */

const { program } = require('commander');
const fetch = require('node-fetch');
const chalk = require('chalk');
const Table = require('cli-table3');
const inquirer = require('inquirer');
const { Pool } = require('pg');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

// Configuration
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000/api';
const API_KEY = process.env.DEV_API_KEY || 'dev-test-key';
const DB_CONNECTION_STRING = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/sahabai';

// Initialize the command
program
  .name('profile-cli')
  .description('CLI tool for managing user profiles during development')
  .version('1.0.0');

// Setup database connection
let pool;
try {
  pool = new Pool({
    connectionString: DB_CONNECTION_STRING,
  });
} catch (error) {
  console.error(chalk.red('Error connecting to database:'), error.message);
  process.exit(1);
}

// Helper functions
async function makeRequest(method, endpoint, body = null) {
  try {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
      },
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || `API error: ${response.status}`);
    }

    return data;
  } catch (error) {
    console.error(chalk.red('API request failed:'), error.message);
    throw error;
  }
}

function formatDate(date) {
  if (!date) return 'N/A';
  return new Date(date).toLocaleString();
}

function printTable(data, headers) {
  const table = new Table({
    head: headers,
    style: { head: ['cyan'] }
  });

  data.forEach(row => {
    table.push(row);
  });

  console.log(table.toString());
}

// Commands

// List all profiles
program
  .command('list')
  .description('List all profiles in the database')
  .option('-f, --format <format>', 'Output format (json, table)', 'table')
  .action(async (options) => {
    try {
      console.log(chalk.blue('Fetching profiles...'));
      const data = await makeRequest('GET', '/profiles');
      
      if (options.format === 'json') {
        console.log(JSON.stringify(data, null, 2));
        return;
      }
      
      if (!data.profiles || data.profiles.length === 0) {
        console.log(chalk.yellow('No profiles found.'));
        return;
      }
      
      const tableData = data.profiles.map(profile => [
        profile.userId,
        formatDate(profile.createdAt),
        formatDate(profile.updatedAt),
        profile.privacySettings?.enableSync ? 'Yes' : 'No',
        profile.usageStats?.reflectionCount || 0
      ]);
      
      printTable(tableData, ['User ID', 'Created', 'Updated', 'Sync Enabled', 'Reflections']);
      console.log(chalk.green(`Total profiles: ${data.profiles.length}`));
    } catch (error) {
      console.error(chalk.red('Error:'), error.message);
    }
  });

// Get profile by user ID
program
  .command('get <userId>')
  .description('Get a profile by user ID')
  .option('-f, --format <format>', 'Output format (json, table)', 'table')
  .action(async (userId, options) => {
    try {
      console.log(chalk.blue(`Fetching profile for user: ${userId}`));
      const data = await makeRequest('GET', `/profiles/user/${userId}`);
      
      if (options.format === 'json') {
        console.log(JSON.stringify(data, null, 2));
        return;
      }
      
      if (!data.profile) {
        console.log(chalk.yellow('No profile found.'));
        return;
      }
      
      const profile = data.profile;
      
      console.log(chalk.green('Profile Details:'));
      console.log(chalk.bold('User ID:'), profile.userId);
      console.log(chalk.bold('Created:'), formatDate(profile.createdAt));
      console.log(chalk.bold('Updated:'), formatDate(profile.updatedAt));
      
      console.log('\n' + chalk.bold('General Preferences:'));
      for (const [key, value] of Object.entries(profile.generalPreferences || {})) {
        console.log(`  ${key}: ${value}`);
      }
      
      console.log('\n' + chalk.bold('Privacy Settings:'));
      for (const [key, value] of Object.entries(profile.privacySettings || {})) {
        console.log(`  ${key}: ${value}`);
      }
      
      console.log('\n' + chalk.bold('Usage Stats:'));
      for (const [key, value] of Object.entries(profile.usageStats || {})) {
        console.log(`  ${key}: ${typeof value === 'object' ? formatDate(value) : value}`);
      }
      
      // Try to fetch encrypted profile data
      try {
        const encryptedData = await makeRequest('GET', `/profiles/user/${userId}/encrypted`);
        console.log('\n' + chalk.bold('Encrypted Profile:'), 'Available (encrypted)');
        console.log(`  Data size: ${encryptedData.encryptedProfile?.data?.length || 0} characters`);
      } catch (error) {
        console.log('\n' + chalk.bold('Encrypted Profile:'), 'Not available');
      }
      
    } catch (error) {
      console.error(chalk.red('Error:'), error.message);
    }
  });

// Create a new test profile
program
  .command('create')
  .description('Create a new test profile')
  .option('--userId <userId>', 'User ID for the test profile', `test-${Date.now()}`)
  .action(async (options) => {
    try {
      console.log(chalk.blue('Creating test profile...'));
      
      const answers = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'enableSync',
          message: 'Enable sync across devices?',
          default: false
        },
        {
          type: 'list',
          name: 'reflectionFrequency',
          message: 'Reflection frequency:',
          choices: ['daily', 'weekly', 'monthly', 'occasional'],
          default: 'daily'
        },
        {
          type: 'list',
          name: 'inputMethod',
          message: 'Preferred input method:',
          choices: ['text', 'voice', 'both'],
          default: 'text'
        },
        {
          type: 'input',
          name: 'languagePreferences',
          message: 'Language preference:',
          default: 'english'
        }
      ]);
      
      const payload = {
        publicProfile: {
          userId: options.userId,
          createdAt: new Date(),
          updatedAt: new Date(),
          generalPreferences: {
            inputMethod: answers.inputMethod,
            reflectionFrequency: answers.reflectionFrequency,
            languagePreferences: answers.languagePreferences
          },
          privacySettings: {
            localStorageOnly: !answers.enableSync,
            allowPersonalization: true,
            enableSync: answers.enableSync
          },
          usageStats: {
            reflectionCount: 0,
            lastActiveDate: new Date(),
            streakDays: 0
          }
        },
        // In a real implementation, we'd encrypt this, but for testing we don't need to
        encryptedProfileData: {
          data: 'dummy-encrypted-data',
          iv: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
        }
      };
      
      const result = await makeRequest('POST', '/profiles', payload);
      
      if (result.profileId) {
        console.log(chalk.green('Profile created successfully!'));
        console.log(chalk.bold('User ID:'), options.userId);
        console.log(chalk.bold('Profile ID:'), result.profileId);
      } else {
        throw new Error('Profile creation failed.');
      }
    } catch (error) {
      console.error(chalk.red('Error:'), error.message);
    }
  });

// Delete a profile
program
  .command('delete <userId>')
  .description('Delete a profile by user ID')
  .action(async (userId) => {
    try {
      const answers = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'confirm',
          message: `Are you sure you want to delete the profile for user ${userId}?`,
          default: false
        }
      ]);
      
      if (!answers.confirm) {
        console.log(chalk.yellow('Operation canceled.'));
        return;
      }
      
      console.log(chalk.blue(`Deleting profile for user: ${userId}`));
      await makeRequest('DELETE', `/profiles/user/${userId}`);
      console.log(chalk.green('Profile deleted successfully!'));
    } catch (error) {
      console.error(chalk.red('Error:'), error.message);
    }
  });

// Test the API
program
  .command('test-api')
  .description('Run a comprehensive test of the profile API')
  .action(async () => {
    try {
      console.log(chalk.blue('Running profile API test...'));
      
      const testUserId = `test-${Date.now()}`;
      console.log(chalk.gray(`Using test user ID: ${testUserId}`));
      
      // 1. Create a profile
      console.log('\n1. Testing profile creation...');
      const createResult = await makeRequest('POST', '/profiles', {
        publicProfile: {
          userId: testUserId,
          createdAt: new Date(),
          updatedAt: new Date(),
          generalPreferences: {
            inputMethod: 'text',
            reflectionFrequency: 'daily',
            languagePreferences: 'english'
          },
          privacySettings: {
            localStorageOnly: false,
            allowPersonalization: true,
            enableSync: true
          },
          usageStats: {
            reflectionCount: 0,
            lastActiveDate: new Date(),
            streakDays: 0
          }
        },
        encryptedProfileData: {
          data: 'dummy-encrypted-data',
          iv: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
        }
      });
      
      console.log(chalk.green('✓ Profile created successfully'));
      
      // 2. Fetch the profile
      console.log('\n2. Testing profile retrieval...');
      const fetchResult = await makeRequest('GET', `/profiles/user/${testUserId}`);
      console.log(chalk.green('✓ Profile fetched successfully'));
      
      // 3. Update the profile
      console.log('\n3. Testing profile update...');
      const updateResult = await makeRequest('PATCH', `/profiles/user/${testUserId}`, {
        publicProfileUpdates: {
          generalPreferences: {
            inputMethod: 'voice',
            reflectionFrequency: 'weekly',
            languagePreferences: 'english'
          }
        }
      });
      console.log(chalk.green('✓ Profile updated successfully'));
      
      // 4. Fetch all profiles
      console.log('\n4. Testing retrieval of all profiles...');
      const fetchAllResult = await makeRequest('GET', '/profiles');
      console.log(chalk.green('✓ All profiles fetched successfully'));
      
      // 5. Delete the profile
      console.log('\n5. Testing profile deletion...');
      const deleteResult = await makeRequest('DELETE', `/profiles/user/${testUserId}`);
      console.log(chalk.green('✓ Profile deleted successfully'));
      
      console.log('\n' + chalk.green('All tests passed!'));
    } catch (error) {
      console.error(chalk.red('Error:'), error.message);
    }
  });

// Reset profile tables
program
  .command('reset-db')
  .description('Reset the profile tables in the database')
  .action(async () => {
    try {
      const answers = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'confirm',
          message: 'Are you sure you want to reset ALL profile data? This cannot be undone!',
          default: false
        },
        {
          type: 'confirm',
          name: 'doubleConfirm',
          message: 'REALLY reset ALL profile data? This will delete everything!',
          default: false,
          when: (answers) => answers.confirm
        }
      ]);
      
      if (!answers.confirm || !answers.doubleConfirm) {
        console.log(chalk.yellow('Operation canceled.'));
        return;
      }
      
      console.log(chalk.blue('Resetting profile tables...'));
      
      // Execute database reset
      await pool.query('TRUNCATE user_profiles CASCADE');
      await pool.query('TRUNCATE encrypted_profiles CASCADE');
      
      console.log(chalk.green('Profile tables reset successfully!'));
    } catch (error) {
      console.error(chalk.red('Error:'), error.message);
    } finally {
      pool.end();
    }
  });

// Help command
program
  .command('help')
  .description('Display help')
  .action(() => {
    program.outputHelp();
  });

// Parse arguments
program.parse(process.argv);

// If no arguments, show help
if (!process.argv.slice(2).length) {
  program.outputHelp();
} 