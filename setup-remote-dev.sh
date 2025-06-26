#!/usr/bin/env bash
set -euo pipefail

echo "🍎 Setting up Remote macOS Development Environment for OnDeviceAI"
echo "=================================================================="

echo "🔹 Installing Xcode CLI Tools…"
xcode-select --install || true

echo "🔹 Installing Homebrew…"
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)" || true

echo "🔹 Adding Homebrew to PATH…"
echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zprofile
eval "$(/opt/homebrew/bin/brew shellenv)"

echo "🔹 Installing CocoaPods & Bundler…"
brew install cocoapods
sudo gem install bundler

echo "🔹 Installing Node & Bun…"
brew install node
curl -fsSL https://bun.sh/install | bash

echo "🔹 Installing additional iOS development tools…"
brew install ideviceinstaller
brew install ios-deploy
brew install xcbeautify

echo "🔹 Setting up React Native environment…"
# Add bun to PATH
echo 'export PATH="$HOME/.bun/bin:$PATH"' >> ~/.zprofile
export PATH="$HOME/.bun/bin:$PATH"

echo "🔹 Installing global React Native CLI…"
npm install -g @react-native-community/cli

echo "🔹 Configuring Git (if needed)…"
if ! git config user.name > /dev/null 2>&1; then
    echo "Please configure Git:"
    echo "git config --global user.name 'Your Name'"
    echo "git config --global user.email 'your.email@example.com'"
fi

echo "🔹 Setting up iOS Simulator…"
# Ensure iOS Simulator is available
sudo xcode-select -s /Applications/Xcode.app/Contents/Developer

echo "🔹 Creating workspace directory…"
mkdir -p ~/Development
cd ~/Development

echo "✅ Remote macOS development environment ready!"
echo ""
echo "Next steps:"
echo "1. Clone your project: git clone <repo-url>"
echo "2. cd into project directory"
echo "3. Run: bun install"
echo "4. Run: cd ios && RCT_NEW_ARCH_ENABLED=1 bundle exec pod install"
echo "5. Run: bun run ios:iphone16pro"
echo ""
echo "🎯 For OnDeviceAI TurboModules:"
echo "- Run: bun run codegen"
echo "- Run: ./build-production-iphone16-pro.sh"
echo ""
echo "📱 Available simulators:"
xcrun simctl list devices available | grep "iPhone 16 Pro" || echo "Install iPhone 16 Pro simulator in Xcode"