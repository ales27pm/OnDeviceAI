#!/usr/bin/env bash
set -euo pipefail

# Deploy OnDeviceAI to Remote macOS Development Environment
# Usage: ./deploy-to-remote-mac.sh [host]

REMOTE_HOST="${1:-ondeviceai-mac}"
PROJECT_NAME="ondeviceai"
REMOTE_PATH="~/Development/$PROJECT_NAME"

echo "🚀 Deploying OnDeviceAI to Remote macOS: $REMOTE_HOST"
echo "=================================================="

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Test SSH connection
log_info "Testing SSH connection to $REMOTE_HOST..."
if ! ssh -o ConnectTimeout=10 "$REMOTE_HOST" "echo 'Connection successful'"; then
    echo "❌ Cannot connect to $REMOTE_HOST"
    echo "Please check your SSH config and ensure the host is accessible"
    exit 1
fi
log_success "SSH connection verified"

# Create remote directory
log_info "Creating remote project directory..."
ssh "$REMOTE_HOST" "mkdir -p ~/Development"

# Sync project files (excluding node_modules, build artifacts)
log_info "Syncing project files..."
rsync -avz --progress \
    --exclude 'node_modules' \
    --exclude 'ios/build' \
    --exclude 'ios/Pods' \
    --exclude 'ios/Podfile.lock' \
    --exclude 'android/build' \
    --exclude 'build' \
    --exclude '.expo' \
    --exclude '.git' \
    --exclude 'DerivedData' \
    ./ "$REMOTE_HOST:$REMOTE_PATH/"

log_success "Project files synced"

# Install dependencies on remote
log_info "Installing dependencies on remote Mac..."
ssh "$REMOTE_HOST" << 'EOF'
cd ~/Development/ondeviceai

# Install JavaScript dependencies
echo "📦 Installing Node dependencies..."
bun install

# Generate TurboModule interfaces
echo "🔧 Running codegen..."
bun run codegen

# Install iOS dependencies with New Architecture
echo "🍎 Installing iOS dependencies..."
cd ios
bundle install || gem install bundler && bundle install
RCT_NEW_ARCH_ENABLED=1 bundle exec pod install
cd ..

echo "✅ Dependencies installed successfully"
EOF

log_success "Dependencies installed on remote Mac"

# Test build
log_info "Testing build on remote Mac..."
ssh "$REMOTE_HOST" << 'EOF'
cd ~/Development/ondeviceai

# TypeScript check
echo "🔍 Running TypeScript validation..."
if bun run tsc --noEmit; then
    echo "✅ TypeScript validation passed"
else
    echo "⚠️  TypeScript issues detected (but continuing)"
fi

# Test iOS build (simulator)
echo "🏗️  Testing iOS build..."
if npx react-native run-ios --simulator "iPhone 16 Pro" --dry-run; then
    echo "✅ iOS build configuration valid"
else
    echo "❌ iOS build configuration issues detected"
fi
EOF

# Instructions
echo ""
echo "🎉 Deployment complete!"
echo "===================="
echo ""
echo "Next steps:"
echo "1. Connect to remote Mac via VS Code Remote-SSH:"
echo "   - Open VS Code"
echo "   - Ctrl+Shift+P → 'Remote-SSH: Connect to Host'"
echo "   - Select '$REMOTE_HOST'"
echo ""
echo "2. Open the project:"
echo "   - File → Open Folder → ~/Development/$PROJECT_NAME"
echo ""
echo "3. Start development:"
echo "   Terminal 1: bun start"
echo "   Terminal 2: bun run ios:iphone16pro"
echo ""
echo "4. For physical iPhone development:"
echo "   - Run: ./connect-usb-device.sh <busid>"
echo "   - Then on Mac: sudo usbip attach -r YOUR_LINUX_IP -b <busid>"
echo ""
echo "📱 Available iOS simulators:"
ssh "$REMOTE_HOST" "xcrun simctl list devices available | grep 'iPhone 16 Pro' || echo 'Install iPhone 16 Pro simulator in Xcode'"
echo ""
echo "🔗 VS Code Remote-SSH connection:"
echo "   ssh://$REMOTE_HOST/~/Development/$PROJECT_NAME"