#!/bin/bash
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
