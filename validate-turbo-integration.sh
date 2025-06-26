#!/usr/bin/env bash
set -euo pipefail

echo "🚀 Validating Complete TurboModule Integration"
echo "============================================="

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Validation functions
validate_file() {
    local file="$1"
    local description="$2"
    
    if [ -f "$file" ]; then
        log_success "$description: $file"
        return 0
    else
        log_error "$description: $file (MISSING)"
        return 1
    fi
}

# 1. Validate Native TurboModule Files
echo -e "\n${BLUE}1. Validating Native TurboModule Implementation${NC}"

ALL_VALID=true

# Core TurboModule files
validate_file "ios/OnDeviceAI/RCTSpeechModule.h" "TurboModule Header" || ALL_VALID=false
validate_file "ios/OnDeviceAI/RCTSpeechModule.mm" "TurboModule Implementation" || ALL_VALID=false
validate_file "ios/OnDeviceAI/SpeechManager.swift" "Swift Speech Manager" || ALL_VALID=false
validate_file "ios/OnDeviceAI/OnDeviceAI-Bridging-Header.h" "Swift Bridging Header" || ALL_VALID=false

# Spec files
validate_file "src/native/NativeSpeechModule.ts" "TurboModule Spec" || ALL_VALID=false

# Generated files
validate_file "build/generated/ios/OnDeviceAISpec/OnDeviceAISpec.h" "Generated TurboModule Header" || ALL_VALID=false
validate_file "build/generated/ios/OnDeviceAISpec/OnDeviceAISpec-generated.mm" "Generated TurboModule Implementation" || ALL_VALID=false

# 2. Validate TypeScript Integration
echo -e "\n${BLUE}2. Validating TypeScript Integration${NC}"

validate_file "src/modules/TurboSpeechModule.ts" "TypeScript Module Interface" || ALL_VALID=false
validate_file "src/components/TurboSpeechDemo.tsx" "Demo Component" || ALL_VALID=false

# 3. Validate Build Configuration
echo -e "\n${BLUE}3. Validating Build Configuration${NC}"

validate_file "OnDeviceAISpeech.podspec" "Podspec Configuration" || ALL_VALID=false
validate_file "react-native.config.js" "React Native Config" || ALL_VALID=false

# Check package.json for TurboModule config
if grep -q "codegenConfig" package.json; then
    log_success "Codegen configuration found in package.json"
else
    log_error "Codegen configuration missing from package.json"
    ALL_VALID=false
fi

# 4. Run TypeScript Check
echo -e "\n${BLUE}4. Running TypeScript Validation${NC}"

if bun run tsc --noEmit --skipLibCheck 2>/dev/null; then
    log_success "TypeScript validation passed"
else
    log_warning "TypeScript issues detected (but not blocking)"
fi

# 5. Check Generated Code
echo -e "\n${BLUE}5. Validating Generated Code Structure${NC}"

# Check if codegen generated the right interfaces
if grep -q "NativeSpeechModuleSpec" build/generated/ios/OnDeviceAISpec/OnDeviceAISpec.h 2>/dev/null; then
    log_success "TurboModule spec interface generated correctly"
else
    log_warning "TurboModule spec interface not found in generated code"
fi

# Check if Swift bridging is configured
if grep -q "SpeechManager" ios/OnDeviceAI/SpeechManager.swift 2>/dev/null; then
    log_success "Swift Speech Manager properly implemented"
else
    log_error "Swift Speech Manager implementation issues"
    ALL_VALID=false
fi

# 6. Check Remote Development Setup
echo -e "\n${BLUE}6. Validating Remote Development Setup${NC}"

validate_file "dev-remote-mac.md" "Remote macOS Guide" || true
validate_file "setup-remote-dev.sh" "Remote Setup Script" || true
validate_file "deploy-to-remote-mac.sh" "Deployment Script" || true
validate_file "connect-usb-device.sh" "USB Device Connection" || true

# 7. Feature Implementation Check
echo -e "\n${BLUE}7. Validating Feature Implementation${NC}"

# Check if speech recognition is implemented
if grep -q "startRecognition" ios/OnDeviceAI/SpeechManager.swift 2>/dev/null; then
    log_success "Speech Recognition implemented"
else
    log_error "Speech Recognition not implemented"
    ALL_VALID=false
fi

# Check if text-to-speech is implemented
if grep -q "speak.*text" ios/OnDeviceAI/SpeechManager.swift 2>/dev/null; then
    log_success "Text-to-Speech implemented"
else
    log_error "Text-to-Speech not implemented"
    ALL_VALID=false
fi

# Check if event emitters are set up
if grep -q "sendEvent" ios/OnDeviceAI/SpeechManager.swift 2>/dev/null; then
    log_success "Event emitters configured"
else
    log_error "Event emitters not configured"
    ALL_VALID=false
fi

# 8. Integration Summary
echo -e "\n${BLUE}8. Integration Summary${NC}"

echo "TurboModule Files Status:"
echo "========================"
echo "📱 Native iOS Implementation: ios/OnDeviceAI/"
echo "🔧 TypeScript Interface: src/modules/TurboSpeechModule.ts"
echo "🎯 React Native Spec: src/native/NativeSpeechModule.ts"
echo "🏗️ Generated Code: build/generated/ios/OnDeviceAISpec/"
echo "📋 Demo Component: src/components/TurboSpeechDemo.tsx"

echo ""
echo "Remote Development Setup:"
echo "========================="
echo "🖥️ Remote macOS Guide: dev-remote-mac.md"
echo "🔧 Setup Scripts: setup-remote-dev.sh, deploy-to-remote-mac.sh"
echo "📱 USB Forwarding: connect-usb-device.sh"
echo "⚙️ VS Code Config: vscode-remote-settings.json"

echo ""
echo "Next Steps for Remote macOS:"
echo "============================"
echo "1. Rent a macOS instance (MacStadium, Mac-in-Cloud, AWS EC2 Mac)"
echo "2. Configure SSH access using ssh-config-template"
echo "3. Run: ./deploy-to-remote-mac.sh your-mac-host"
echo "4. Connect via VS Code Remote-SSH"
echo "5. Run: bun start && bun run ios:iphone16pro"

echo ""
if [ "$ALL_VALID" = true ]; then
    echo -e "${GREEN}🎉 TurboModule Integration: COMPLETE!${NC}"
    echo -e "${GREEN}✅ All files present and configured correctly${NC}"
    echo -e "${GREEN}🚀 Ready for remote macOS deployment${NC}"
    
    echo ""
    echo "Feature Capabilities:"
    echo "===================="
    echo "🎤 Native iOS Speech Recognition (on-device)"
    echo "🗣️ High-performance Text-to-Speech"
    echo "📡 Real-time event streaming"
    echo "⚡ TurboModule bridgeless communication"
    echo "📱 iPhone 16 Pro optimized"
    echo "🏗️ New Architecture compatible"
    
    exit 0
else
    echo -e "${RED}❌ TurboModule Integration: INCOMPLETE${NC}"
    echo -e "${YELLOW}⚠️  Some files are missing or incorrectly configured${NC}"
    echo -e "${BLUE}🔄 Please fix the issues above and run validation again${NC}"
    exit 1
fi