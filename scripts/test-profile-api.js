#!/usr/bin/env node

/**
 * Test script for profile API endpoints
 * 
 * This script tests the basic functionality of the profile API endpoints
 * by creating, retrieving, updating, and deleting profile data.
 * 
 * Usage:
 *   node scripts/test-profile-api.js
 */

const fetch = require('node-fetch');
const { v4: uuidv4 } = require('uuid');

// Configuration
const API_URL = process.env.API_URL || 'http://localhost:5000/api';
const TEST_USER_ID = process.env.TEST_USER_ID || uuidv4();

// ANSI color codes for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

/**
 * Execute a test case
 */
async function executeTest(name, testFn) {
  try {
    console.log(`${colors.blue}Running test: ${name}${colors.reset}`);
    const result = await testFn();
    console.log(`${colors.green}✓ Test passed: ${name}${colors.reset}`);
    return { success: true, result };
  } catch (error) {
    console.error(`${colors.red}✗ Test failed: ${name}${colors.reset}`);
    console.error(`  ${colors.red}Error: ${error.message}${colors.reset}`);
    return { success: false, error };
  }
}

/**
 * Make an API request
 */
async function apiRequest(endpoint, method = 'GET', body = null) {
  const url = `${API_URL}${endpoint}`;
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }
  };
  
  if (body) {
    options.body = JSON.stringify(body);
  }
  
  console.log(`${colors.cyan}${method} ${url}${colors.reset}`);
  if (body) {
    console.log(`${colors.cyan}Body: ${JSON.stringify(body, null, 2)}${colors.reset}`);
  }
  
  const response = await fetch(url, options);
  const isJson = response.headers.get('content-type')?.includes('application/json');
  
  const data = isJson ? await response.json() : await response.text();
  
  console.log(`${colors.cyan}Status: ${response.status}${colors.reset}`);
  console.log(`${colors.cyan}Response: ${JSON.stringify(data, null, 2)}${colors.reset}`);
  
  if (!response.ok) {
    throw new Error(`API request failed with status ${response.status}: ${JSON.stringify(data)}`);
  }
  
  return { status: response.status, data };
}

/**
 * Test cases
 */
const tests = {
  // Create a new user profile
  createProfile: async () => {
    const profile = {
      userId: TEST_USER_ID,
      generalPreferences: {
        inputMethod: 'voice',
        reflectionFrequency: 'weekly',
        languagePreferences: 'english'
      },
      privacySettings: {
        localStorageOnly: false,
        allowPersonalization: true,
        enableSync: true
      },
      usageStats: {
        reflectionCount: 5,
        lastActiveDate: new Date(),
        streakDays: 3
      }
    };
    
    const result = await apiRequest('/profile', 'POST', profile);
    
    // Verify the result
    if (result.data.userId !== TEST_USER_ID) {
      throw new Error('Created profile has incorrect userId');
    }
    
    return result;
  },
  
  // Get the user profile
  getProfile: async () => {
    const result = await apiRequest(`/profile/${TEST_USER_ID}`);
    
    // Verify the result
    if (result.data.userId !== TEST_USER_ID) {
      throw new Error('Retrieved profile has incorrect userId');
    }
    
    return result;
  },
  
  // Update the user profile
  updateProfile: async () => {
    const updates = {
      userId: TEST_USER_ID,
      generalPreferences: {
        inputMethod: 'text',
        reflectionFrequency: 'daily',
        languagePreferences: 'english'
      },
      privacySettings: {
        localStorageOnly: true,
        allowPersonalization: false,
        enableSync: false
      }
    };
    
    const result = await apiRequest('/profile', 'PUT', updates);
    
    // Verify the result
    if (result.data.generalPreferences.inputMethod !== 'text') {
      throw new Error('Updated profile does not have the correct preferences');
    }
    
    return result;
  },
  
  // Save encrypted profile data
  saveEncryptedData: async () => {
    // Simulated encrypted data
    const encryptedData = {
      data: 'U2FtcGxlRW5jcnlwdGVkRGF0YQ==', // Base64 for "SampleEncryptedData"
      iv: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
    };
    
    const result = await apiRequest(`/profile/${TEST_USER_ID}/encrypted`, 'PUT', encryptedData);
    
    // Verify the result
    if (!result.data.success) {
      throw new Error('Failed to save encrypted data');
    }
    
    return result;
  },
  
  // Get encrypted profile data
  getEncryptedData: async () => {
    const result = await apiRequest(`/profile/${TEST_USER_ID}/encrypted`);
    
    // Verify the result
    if (!result.data.data || !result.data.iv) {
      throw new Error('Retrieved encrypted data is invalid');
    }
    
    return result;
  },
  
  // Delete encrypted profile data
  deleteEncryptedData: async () => {
    const result = await apiRequest(`/profile/${TEST_USER_ID}/encrypted`, 'DELETE');
    
    // For a 204 status (no content), the data will be empty
    if (result.status !== 204) {
      throw new Error('Expected 204 status code when deleting encrypted data');
    }
    
    return result;
  },
  
  // Delete user profile
  deleteProfile: async () => {
    const result = await apiRequest(`/profile?userId=${TEST_USER_ID}`, 'DELETE');
    
    // For a 204 status (no content), the data will be empty
    if (result.status !== 204) {
      throw new Error('Expected 204 status code when deleting profile');
    }
    
    return result;
  }
};

/**
 * Run all tests in sequence
 */
async function runTests() {
  console.log(`${colors.magenta}Starting Profile API Tests${colors.reset}`);
  console.log(`${colors.magenta}Test User ID: ${TEST_USER_ID}${colors.reset}`);
  console.log('');
  
  const results = {};
  let allPassed = true;
  
  // Create
  results.createProfile = await executeTest('Create Profile', tests.createProfile);
  allPassed = allPassed && results.createProfile.success;
  
  // If creation was successful, continue with other tests
  if (results.createProfile.success) {
    // Get
    results.getProfile = await executeTest('Get Profile', tests.getProfile);
    allPassed = allPassed && results.getProfile.success;
    
    // Update
    results.updateProfile = await executeTest('Update Profile', tests.updateProfile);
    allPassed = allPassed && results.updateProfile.success;
    
    // Encrypted data
    results.saveEncryptedData = await executeTest('Save Encrypted Data', tests.saveEncryptedData);
    allPassed = allPassed && results.saveEncryptedData.success;
    
    if (results.saveEncryptedData.success) {
      results.getEncryptedData = await executeTest('Get Encrypted Data', tests.getEncryptedData);
      allPassed = allPassed && results.getEncryptedData.success;
      
      results.deleteEncryptedData = await executeTest('Delete Encrypted Data', tests.deleteEncryptedData);
      allPassed = allPassed && results.deleteEncryptedData.success;
    }
    
    // Delete
    results.deleteProfile = await executeTest('Delete Profile', tests.deleteProfile);
    allPassed = allPassed && results.deleteProfile.success;
  }
  
  // Report summary
  console.log('');
  console.log(`${colors.magenta}Test Summary:${colors.reset}`);
  
  let passCount = 0;
  let failCount = 0;
  
  Object.entries(results).forEach(([name, result]) => {
    if (result.success) {
      console.log(`${colors.green}✓ ${name}${colors.reset}`);
      passCount++;
    } else {
      console.log(`${colors.red}✗ ${name}: ${result.error.message}${colors.reset}`);
      failCount++;
    }
  });
  
  console.log('');
  console.log(`${colors.magenta}Results: ${passCount} passed, ${failCount} failed${colors.reset}`);
  
  if (allPassed) {
    console.log(`${colors.green}All tests passed!${colors.reset}`);
    process.exit(0);
  } else {
    console.log(`${colors.red}Some tests failed.${colors.reset}`);
    process.exit(1);
  }
}

// Run the tests
runTests().catch(error => {
  console.error(`${colors.red}Error running tests: ${error.message}${colors.reset}`);
  process.exit(1);
}); 