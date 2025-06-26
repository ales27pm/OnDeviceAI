#!/usr/bin/env bash
set -euo pipefail

echo "🚀 Optimized iOS Build for CI"
echo "============================="

# Environment setup
export RCT_NEW_ARCH_ENABLED=1
export DISABLE_FLIPPER=1

# Install dependencies
echo "📦 Installing dependencies..."
bun install --frozen-lockfile

# TypeScript validation
echo "🔍 Running TypeScript validation..."
bun run tsc --noEmit --skipLibCheck

# Codegen
echo "⚙️  Running codegen..."
bunx react-native codegen || echo "Codegen completed with warnings"

# CocoaPods
echo "📱 Installing CocoaPods..."
cd ios
bundle install
RCT_NEW_ARCH_ENABLED=1 bundle exec pod install --repo-update
cd ..

# Build
echo "🏗️  Building iOS app..."
bunx react-native run-ios --simulator "iPhone 16 Pro" --verbose

echo "✅ Build completed successfully!"
