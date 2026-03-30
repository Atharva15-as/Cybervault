#!/bin/bash

# ============================================
# 🔐 Secure File Storage - Setup Script
# ============================================
# This script sets up the system for local development

echo "🔐 Secure File Storage System - Setup"
echo "======================================"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed"
    echo "   Download from: https://nodejs.org/"
    exit 1
fi

echo "✓ Node.js version: $(node --version)"
echo "✓ NPM version: $(npm --version)"
echo ""

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ NPM is not installed"
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo "✓ Dependencies installed"
echo ""

# Create directories if they don't exist
echo "📁 Creating directories..."
mkdir -p uploads
mkdir -p metadata
mkdir -p public

echo "✓ Directories created"
echo ""

# Check if server.js exists
if [ ! -f "server.js" ]; then
    echo "❌ server.js not found in current directory"
    exit 1
fi

echo "✅ Setup complete!"
echo ""
echo "🚀 To start the server, run:"
echo "   npm start"
echo ""
echo "   Then open: http://localhost:3000"
echo ""
echo "📝 For development with auto-reload:"
echo "   npm run dev"
echo ""
echo "📚 For more information, read:"
echo "   - README.md (Features & Usage)"
echo "   - ARCHITECTURE.md (Technical Details)"
echo ""
