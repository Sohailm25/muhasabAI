#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('\n🔧 Fixing Claude model version in anthropic.ts\n');

const anthropicFilePath = path.join(__dirname, 'server', 'lib', 'anthropic.ts');

try {
  if (!fs.existsSync(anthropicFilePath)) {
    console.error(`❌ Could not find file: ${anthropicFilePath}`);
    process.exit(1);
  }

  let content = fs.readFileSync(anthropicFilePath, 'utf8');
  let updated = false;

  // Check for incorrect model version in comment
  if (content.includes('claude-3-sonnet-20240229')) {
    content = content.replace(
      'claude-3-sonnet-20240229', 
      'claude-3-7-sonnet-20250219'
    );
    updated = true;
    console.log('✅ Updated model version in comment');
  }

  // Check for incorrect model version in API call
  if (content.includes("model: 'claude-3-sonnet-20240229'")) {
    content = content.replace(
      "model: 'claude-3-sonnet-20240229'", 
      "model: 'claude-3-7-sonnet-20250219'"
    );
    updated = true;
    console.log('✅ Updated model version in API call');
  }

  if (updated) {
    fs.writeFileSync(anthropicFilePath, content);
    console.log(`✅ Successfully updated ${anthropicFilePath}`);
  } else {
    console.log('✅ No model version issues found in the file.');
  }
} catch (error) {
  console.error('❌ Error processing the file:', error);
  process.exit(1);
}

console.log('\n✅ Model version check completed!\n'); 