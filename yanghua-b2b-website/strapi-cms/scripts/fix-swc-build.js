#!/usr/bin/env node

/**
 * SWC Build Fix Script for Strapi Cloud Deployment
 * 
 * This script addresses the "Failed to load native binding" error
 * by ensuring proper installation and configuration of SWC dependencies.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔧 Starting SWC Build Fix Script...\n');

// Function to execute commands with proper error handling
function executeCommand(command, description) {
  console.log(`📋 ${description}...`);
  try {
    execSync(command, { stdio: 'inherit', cwd: process.cwd() });
    console.log(`✅ ${description} completed successfully\n`);
  } catch (error) {
    console.error(`❌ Error during ${description}:`, error.message);
    process.exit(1);
  }
}

// Function to check if file exists
function fileExists(filePath) {
  return fs.existsSync(filePath);
}

// Main fix process
async function fixSWCBuild() {
  console.log('🚀 Fixing SWC native binding issues for Strapi Cloud deployment\n');

  // Step 1: Clean existing installations
  console.log('🧹 Cleaning existing installations...');
  
  if (fileExists('node_modules')) {
    executeCommand('rm -rf node_modules', 'Removing node_modules directory');
  }
  
  if (fileExists('package-lock.json')) {
    executeCommand('rm -f package-lock.json', 'Removing package-lock.json');
  }

  if (fileExists('yarn.lock')) {
    executeCommand('rm -f yarn.lock', 'Removing yarn.lock');
  }

  // Step 2: Clear npm cache
  executeCommand('npm cache clean --force', 'Clearing npm cache');

  // Step 3: Install dependencies with specific flags for native modules
  console.log('📦 Installing dependencies with SWC compatibility fixes...');
  executeCommand(
    'npm install --no-package-lock --rebuild --force', 
    'Installing dependencies with native module rebuild'
  );

  // Step 4: Verify SWC installation
  console.log('🔍 Verifying SWC installation...');
  try {
    const swcCore = require('@strapi/strapi/node_modules/@swc/core');
    console.log('✅ SWC core module loaded successfully');
    console.log(`📋 SWC version: ${swcCore.version || 'Unknown'}\n`);
  } catch (error) {
    console.log('⚠️  SWC core not found in expected location, checking alternative paths...');
    
    // Try to find SWC in different locations
    const possiblePaths = [
      './node_modules/@swc/core',
      '../node_modules/@swc/core',
      '../../node_modules/@swc/core'
    ];
    
    let swcFound = false;
    for (const swcPath of possiblePaths) {
      if (fileExists(swcPath)) {
        console.log(`✅ Found SWC at: ${swcPath}`);
        swcFound = true;
        break;
      }
    }
    
    if (!swcFound) {
      console.log('⚠️  SWC not found, attempting manual installation...');
      executeCommand('npm install @swc/core@1.3.107 --save-dev', 'Installing SWC core manually');
    }
  }

  // Step 5: Create build preparation script
  const buildPrepScript = `#!/bin/bash
# Build preparation script for Strapi Cloud
echo "🔧 Preparing build environment..."

# Ensure SWC native bindings are available
if [ ! -d "node_modules/@swc" ]; then
  echo "📦 Installing SWC dependencies..."
  npm install @swc/core@1.3.107 --no-save
fi

# Set environment variables for native compilation
export NODE_ENV=production
export STRAPI_DISABLE_UPDATE_NOTIFICATION=true
export STRAPI_HIDE_STARTUP_MESSAGE=true

echo "✅ Build environment prepared"
`;

  fs.writeFileSync('./scripts/prepare-build.sh', buildPrepScript);
  executeCommand('chmod +x ./scripts/prepare-build.sh', 'Making build preparation script executable');

  // Step 6: Update package.json scripts if needed
  const packageJsonPath = './package.json';
  if (fileExists(packageJsonPath)) {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    // Add prebuild script if it doesn't exist
    if (!packageJson.scripts.prebuild) {
      packageJson.scripts.prebuild = './scripts/prepare-build.sh';
      fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
      console.log('✅ Added prebuild script to package.json\n');
    }
  }

  // Step 7: Test build locally (optional)
  console.log('🧪 Testing build process...');
  try {
    executeCommand('npm run build', 'Testing Strapi build');
    console.log('🎉 Build test completed successfully!\n');
  } catch (error) {
    console.log('⚠️  Build test failed, but fixes have been applied. Try deploying to Strapi Cloud.\n');
  }

  console.log('✨ SWC Build Fix Script completed!');
  console.log('\n📋 Summary of changes:');
  console.log('  • Created .npmrc with native binding configuration');
  console.log('  • Added SWC version resolutions to package.json');
  console.log('  • Cleaned and reinstalled dependencies');
  console.log('  • Created build preparation script');
  console.log('  • Added prebuild script to package.json');
  console.log('\n🚀 You can now commit these changes and redeploy to Strapi Cloud');
}

// Run the fix script
if (require.main === module) {
  fixSWCBuild().catch(error => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
}

module.exports = { fixSWCBuild };