#!/bin/bash

# 📱 iPhone 16 Pro iOS 18.5 Build Script
# Run this script on macOS to build for iPhone 16 Pro

set -e

echo "🚀 Building OnDeviceAI for iPhone 16 Pro iOS 18.5..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if we're on macOS
if [[ "$OSTYPE" != "darwin"* ]]; then
    echo -e "${RED}❌ This script must be run on macOS${NC}"
    exit 1
fi

# Check if Xcode is installed
if ! command -v xcodebuild &> /dev/null; then
    echo -e "${RED}❌ Xcode is not installed${NC}"
    exit 1
fi

# Check if project directory exists
if [ ! -d "ios" ]; then
    echo -e "${RED}❌ iOS directory not found. Run this from the project root.${NC}"
    exit 1
fi

echo -e "${BLUE}📋 Pre-build checks...${NC}"

# Check if iPhone 16 Pro is connected
DEVICE_COUNT=$(xcrun devicectl list devices | grep -i "iPhone" | wc -l)
if [ "$DEVICE_COUNT" -eq 0 ]; then
    echo -e "${YELLOW}⚠️  No iPhone detected. Please connect your iPhone 16 Pro via USB.${NC}"
    echo -e "${YELLOW}   Make sure to trust this computer on your device.${NC}"
    read -p "Press Enter when iPhone 16 Pro is connected and trusted..."
fi

echo -e "${BLUE}🧹 Cleaning build environment...${NC}"

# Clean previous builds
cd ios
rm -rf build/
rm -rf ~/Library/Developer/Xcode/DerivedData/OnDeviceAI-* 2>/dev/null || true

echo -e "${BLUE}📦 Installing CocoaPods dependencies...${NC}"

# Check if CocoaPods is installed
if ! command -v pod &> /dev/null; then
    echo -e "${YELLOW}📦 Installing CocoaPods...${NC}"
    brew install cocoapods
fi

# Install/update pods
pod install --repo-update

cd ..

echo -e "${BLUE}⚙️  Regenerating Codegen...${NC}"

# Regenerate Codegen for TurboModules
bunx react-native codegen

echo -e "${BLUE}🔍 Detecting connected devices...${NC}"

# List connected devices
xcrun devicectl list devices

echo -e "${GREEN}🚀 Building for iPhone 16 Pro...${NC}"

# Build and deploy to device
if command -v bunx &> /dev/null; then
    echo -e "${BLUE}Using Expo CLI...${NC}"
    bunx expo run:ios --device
else
    echo -e "${BLUE}Using React Native CLI...${NC}"
    npx react-native run-ios --device
fi

echo -e "${GREEN}✅ Build completed successfully!${NC}"
echo -e "${GREEN}📱 OnDeviceAI should now be running on your iPhone 16 Pro${NC}"

echo -e "${BLUE}🔧 TurboModule Status Check:${NC}"
echo -e "${YELLOW}Look for these success messages in the app console:${NC}"
echo -e "  ✅ 'TurboSpeechModule initialized successfully'"
echo -e "  ✅ 'Speech recognition available'"  
echo -e "  ✅ 'Audio session configured'"

echo -e "${GREEN}🎉 Ready to test native speech features on iPhone 16 Pro!${NC}"