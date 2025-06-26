#!/usr/bin/env bash
set -euo pipefail

# 🚀 OnDeviceAI Production Build Script for iPhone 16 Pro
# Optimized for React Native 0.79.2 + New Architecture + TurboModules

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Project Configuration
PROJECT_NAME="OnDeviceAI"
SCHEME="OnDeviceAI"
WORKSPACE="ios/${PROJECT_NAME}.xcworkspace"
BUNDLE_ID="com.ondeviceai.app"
OUTPUT_DIR="build/production-iphone16-pro"
ARCHIVE_PATH="$OUTPUT_DIR/${PROJECT_NAME}.xcarchive"

echo -e "${PURPLE}🚀 OnDeviceAI Production Build for iPhone 16 Pro${NC}"
echo -e "${BLUE}📱 Target: iPhone 16 Pro (iOS 18.5)${NC}"
echo -e "${BLUE}🏗️  Architecture: New Architecture + TurboModules${NC}"
echo -e "${BLUE}📦 React Native: 0.79.2 + Expo SDK 53${NC}"
echo ""

# Verify we're on macOS
if [[ "$OSTYPE" != "darwin"* ]]; then
    echo -e "${RED}❌ This script must be run on macOS${NC}"
    exit 1
fi

# Check if we're in the correct directory
if [ ! -f "package.json" ] || [ ! -d "ios" ]; then
    echo -e "${RED}❌ Please run this script from the project root directory${NC}"
    exit 1
fi

# Verify project name in package.json
if ! grep -q '"name": "ondeviceai"' package.json; then
    echo -e "${YELLOW}⚠️  Warning: Project name might not match expected 'ondeviceai'${NC}"
fi

echo -e "${BLUE}🧹 Cleaning build environment...${NC}"

# Clean previous builds
rm -rf "$OUTPUT_DIR"
mkdir -p "$OUTPUT_DIR"

# Clean iOS build artifacts
cd ios
rm -rf build/
rm -rf ~/Library/Developer/Xcode/DerivedData/${PROJECT_NAME}-* 2>/dev/null || true
cd ..

echo -e "${BLUE}📦 Installing JavaScript dependencies...${NC}"

# Install dependencies using Bun (as configured in project)
if command -v bun &> /dev/null; then
    bun install
elif command -v yarn &> /dev/null; then
    yarn install
else
    npm install
fi

echo -e "${BLUE}⚙️  Generating TurboModule interfaces...${NC}"

# Regenerate Codegen for TurboModules
if command -v bunx &> /dev/null; then
    bunx react-native codegen
else
    npx react-native codegen
fi

# Verify Codegen output
if [ ! -d "build/generated/ios/OnDeviceAISpec" ]; then
    echo -e "${RED}❌ Codegen failed - TurboModule specs not generated${NC}"
    exit 1
fi

echo -e "${GREEN}✅ TurboModule interfaces generated successfully${NC}"

echo -e "${BLUE}🍎 Installing iOS dependencies...${NC}"

cd ios

# Install Ruby dependencies
if [ -f "Gemfile" ]; then
    bundle install
fi

# Install CocoaPods with New Architecture enabled
echo -e "${YELLOW}🔧 Installing Pods with New Architecture enabled...${NC}"
RCT_NEW_ARCH_ENABLED=1 bundle exec pod install --repo-update

cd ..

echo -e "${BLUE}🔍 Verifying build prerequisites...${NC}"

# Check if workspace exists
if [ ! -f "$WORKSPACE" ]; then
    echo -e "${RED}❌ Workspace not found: $WORKSPACE${NC}"
    exit 1
fi

# Check if Xcode can find the workspace
if ! xcodebuild -workspace "$WORKSPACE" -list &>/dev/null; then
    echo -e "${RED}❌ Invalid workspace configuration${NC}"
    exit 1
fi

echo -e "${BLUE}📱 Checking for connected iPhone 16 Pro...${NC}"

# List available devices
DEVICE_LIST=$(xcrun devicectl list devices 2>/dev/null || echo "")
if echo "$DEVICE_LIST" | grep -q "iPhone"; then
    echo -e "${GREEN}✅ iPhone device detected${NC}"
    DEVICE_DESTINATION='platform=iOS,name=iPhone 16 Pro'
else
    echo -e "${YELLOW}⚠️  No physical device detected, building for simulator${NC}"
    DEVICE_DESTINATION='platform=iOS Simulator,name=iPhone 16 Pro,OS=18.5'
fi

echo -e "${BLUE}🔨 Building OnDeviceAI for iPhone 16 Pro...${NC}"
echo -e "${YELLOW}📋 Build Configuration:${NC}"
echo -e "   Workspace: $WORKSPACE"
echo -e "   Scheme: $SCHEME"
echo -e "   Bundle ID: $BUNDLE_ID"
echo -e "   Destination: $DEVICE_DESTINATION"
echo -e "   Output: $OUTPUT_DIR"
echo ""

# Build the project
echo -e "${PURPLE}⏱️  Starting build process...${NC}"

xcodebuild \
  -workspace "$WORKSPACE" \
  -scheme "$SCHEME" \
  -configuration Release \
  -destination "$DEVICE_DESTINATION" \
  -derivedDataPath "$OUTPUT_DIR" \
  -archivePath "$ARCHIVE_PATH" \
  -allowProvisioningUpdates \
  DEVELOPMENT_TEAM="${DEVELOPMENT_TEAM:-}" \
  CODE_SIGN_IDENTITY="${CODE_SIGN_IDENTITY:-iPhone Developer}" \
  PRODUCT_BUNDLE_IDENTIFIER="$BUNDLE_ID" \
  clean archive

BUILD_EXIT_CODE=$?

echo ""
if [ $BUILD_EXIT_CODE -eq 0 ]; then
    echo -e "${GREEN}✅ Build completed successfully!${NC}"
    echo -e "${GREEN}🎉 OnDeviceAI is ready for iPhone 16 Pro${NC}"
    echo ""
    echo -e "${BLUE}📱 Build Artifacts:${NC}"
    echo -e "   Archive: $ARCHIVE_PATH"
    echo -e "   DerivedData: $OUTPUT_DIR"
    echo ""
    echo -e "${BLUE}🚀 Next Steps:${NC}"
    echo -e "   1. Connect your iPhone 16 Pro via USB"
    echo -e "   2. Open Xcode and select your archive"
    echo -e "   3. Choose 'Distribute App' for App Store or 'Export' for testing"
    echo -e "   4. Test TurboModule functionality with the included test suite"
    echo ""
    echo -e "${YELLOW}🧪 To test TurboModules:${NC}"
    echo -e "   - Launch the app on iPhone 16 Pro"
    echo -e "   - Navigate to the iPhone16ProTest tab"
    echo -e "   - Run the full test suite to verify native performance"
    echo ""
    echo -e "${GREEN}🎯 Expected Performance on iPhone 16 Pro:${NC}"
    echo -e "   - TurboModule initialization: < 5ms"
    echo -e "   - Speech recognition: Real-time with A18 Pro"
    echo -e "   - Text-to-speech: < 100ms response"
    echo -e "   - Calendar operations: < 50ms"
    echo ""
else
    echo -e "${RED}❌ Build failed with exit code $BUILD_EXIT_CODE${NC}"
    echo -e "${YELLOW}🔧 Troubleshooting tips:${NC}"
    echo -e "   1. Check Xcode is properly installed and updated"
    echo -e "   2. Verify your Apple Developer account is configured"
    echo -e "   3. Ensure iPhone 16 Pro is connected and trusted"
    echo -e "   4. Try cleaning: rm -rf ios/build/ && pod install"
    echo -e "   5. Check the full build log above for specific errors"
    exit $BUILD_EXIT_CODE
fi

# Verify TurboModule files are included
echo -e "${BLUE}🔍 Verifying TurboModule integration...${NC}"

TURBO_MODULE_FILES=(
    "build/generated/ios/OnDeviceAISpec/OnDeviceAISpec.h"
    "build/generated/ios/OnDeviceAISpec/OnDeviceAISpec-generated.mm"
    "ios/OnDeviceAI/Speech/RCTSpeechModule.h"
    "ios/OnDeviceAI/Speech/RCTSpeechModule.m"
)

for file in "${TURBO_MODULE_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}✅ $file${NC}"
    else
        echo -e "${YELLOW}⚠️  Missing: $file${NC}"
    fi
done

echo ""
echo -e "${PURPLE}🎉 OnDeviceAI Build Complete for iPhone 16 Pro!${NC}"
echo -e "${GREEN}Ready for deployment and testing with native TurboModule performance.${NC}"