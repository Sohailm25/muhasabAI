#!/usr/bin/env node

/**
 * This script ensures that the build directory structure is correct
 * for Railway deployment. It creates the necessary directories and
 * a fallback index.html file if the client build is missing.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('Running build fix script for Railway deployment...');

// Define paths
const distPath = path.resolve(__dirname, 'dist');
const publicPath = path.resolve(distPath, 'public');

// Create dist directory if it doesn't exist
if (!fs.existsSync(distPath)) {
  console.log('Creating dist directory...');
  fs.mkdirSync(distPath, { recursive: true });
}

// Create public directory if it doesn't exist
if (!fs.existsSync(publicPath)) {
  console.log('Creating public directory...');
  fs.mkdirSync(publicPath, { recursive: true });
  
  // Check if index.html exists in public directory
  const indexPath = path.resolve(publicPath, 'index.html');
  if (!fs.existsSync(indexPath)) {
    console.log('Creating fallback index.html...');
    
    // Create a basic index.html file as fallback
    const fallbackHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <meta name="theme-color" content="#ffffff" />
  <title>MuhasabAI - Islamic Self-Reflection Tool</title>
  <meta name="description" content="An AI-powered tool for Islamic self-reflection and spiritual growth" />
  <style>
    body { 
      font-family: Arial, sans-serif; 
      padding: 2rem; 
      text-align: center;
      background-color: #f8f9fa;
      color: #333;
    }
    .container {
      max-width: 800px;
      margin: 0 auto;
      padding: 2rem;
      background-color: white;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    h1 {
      color: #4a5568;
    }
    .message { 
      margin: 2rem 0; 
      line-height: 1.6;
    }
    .info {
      color: #2b6cb0;
      font-weight: bold;
    }
    .error { 
      color: #e53e3e; 
      margin-top: 1rem;
    }
    .btn {
      display: inline-block;
      background-color: #4299e1;
      color: white;
      padding: 0.75rem 1.5rem;
      border-radius: 4px;
      text-decoration: none;
      margin-top: 1rem;
      font-weight: bold;
    }
    .btn:hover {
      background-color: #3182ce;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>MuhasabAI</h1>
    <div class="message">
      <p>Welcome to MuhasabAI, your Islamic self-reflection companion.</p>
      <p class="info">The application is running, but you're seeing this page because the client-side build was not found.</p>
      <p class="error">Please make sure to run a complete build with 'npm run build' before deploying.</p>
      <p>If you're seeing this in production, please contact the development team.</p>
      <a href="/" class="btn">Refresh Page</a>
    </div>
  </div>
</body>
</html>`;
    
    fs.writeFileSync(indexPath, fallbackHtml);
  }
}

console.log('Build fix script completed successfully.'); 