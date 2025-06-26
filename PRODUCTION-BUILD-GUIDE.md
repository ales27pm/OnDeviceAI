# 🚀 Production Build Guide - iPhone 16 Pro (iOS 18.5, RN 0.79+ New Architecture)

## 📱 **Project Overview**
- **App**: OnDeviceAI
- **Target**: iPhone 16 Pro iOS 18.5
- **Architecture**: React Native 0.79.2 with New Architecture
- **TurboModules**: Native Speech Recognition & Calendar integration
- **Bundle ID**: com.ondeviceai.app

---

## ✅ **Prerequisites**

### **macOS Development Environment**
- **macOS** 14+ (local or remote VM)
- **Xcode** 15.4+ with iOS 18.5 SDK
- **Homebrew** package manager
- **Ruby** 3.0+ with Bundler
- **CocoaPods** 1.15+
- **Node.js** 18+ & **Bun** (current project uses Bun)

### **Project Requirements**
- ✅ React Native 0.79.2 with New Architecture enabled
- ✅ TurboModules codegenConfig configured
- ✅ Expo SDK 53 integration
- ✅ Speech Recognition & Calendar TurboModules

---

## 🛠 **1. Install Development Toolchain**

```bash
# 1. Xcode Command Line Tools
xcode-select --install

# 2. Homebrew (if not installed)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# 3. Essential tools
brew install cocoapods node bun ruby
sudo gem install bundler

# 4. Verify installations
xcode-select -p
pod --version
bun --version
ruby --version
```

---

## 📂 **2. Project Setup**

```bash
# Clone OnDeviceAI project
git clone [your-repo-url]
cd ondeviceai

# Install JavaScript dependencies (using Bun as configured)
bun install

# Verify project structure
ls -la ios/  # Should see OnDeviceAI.xcodeproj and Podfile
```

---

## 🏗 **3. Configure iOS Build Environment**

### **Update Podfile for iPhone 16 Pro**
```ruby
# ios/Podfile
platform :ios, '15.1'  # Minimum for broad compatibility, supports iOS 18.5

require File.join(File.dirname(`node --print "require.resolve('expo/package.json')"`), "scripts/autolinking")
require File.join(File.dirname(`node --print "require.resolve('react-native/package.json')"`), "scripts/react_native_pods")

# Enable New Architecture for TurboModules
ENV['RCT_NEW_ARCH_ENABLED'] = '1'

target 'OnDeviceAI' do
  use_expo_modules!
  use_frameworks! :linkage => :static  # Required for TurboModules
  
  config = use_native_modules!
  
  use_react_native!(
    :path => config[:reactNativePath],
    :hermes_enabled => true,
    :app_path => "#{Pod::Config.instance.installation_root}/..",
    :privacy_file_aggregation_enabled => true,
  )

  post_install do |installer|
    react_native_post_install(
      installer,
      config[:reactNativePath],
      :mac_catalyst_enabled => false,
    )
    
    # iPhone 16 Pro optimizations
    installer.pods_project.targets.each do |target|
      target.build_configurations.each do |config|
        config.build_settings['IPHONEOS_DEPLOYMENT_TARGET'] = '15.1'
        config.build_settings['ENABLE_BITCODE'] = 'NO'
        config.build_settings['EXCLUDED_ARCHS[sdk=iphonesimulator*]'] = 'arm64' if ENV['CI'] == 'true'
      end
    end
  end
end
```

### **Install iOS Dependencies**
```bash
cd ios

# Install Ruby dependencies
bundle install

# Install CocoaPods with New Architecture
RCT_NEW_ARCH_ENABLED=1 bundle exec pod install --repo-update

cd ..
```

---

## 🔨 **4. Build Process**

### **Option A: Expo CLI (Recommended)**
```bash
# For connected iPhone 16 Pro
bunx expo run:ios --device

# For iPhone 16 Pro Simulator
bunx expo run:ios --simulator "iPhone 16 Pro"

# For specific iOS version
bunx expo run:ios --simulator "iPhone 16 Pro (18.5)"
```

### **Option B: React Native CLI**
```bash
# Device build
bunx react-native run-ios --device "iPhone 16 Pro"

# Simulator build
bunx react-native run-ios --simulator "iPhone 16 Pro"
```

### **Option C: Xcode Direct Build**
```bash
# Open workspace in Xcode
open ios/OnDeviceAI.xcworkspace

# Then build and run from Xcode interface
# Target: iPhone 16 Pro
# iOS Deployment Target: 15.1+
# Configuration: Debug/Release
```

---

## 🚀 **5. Production Build Script**

Create `build-production-iphone16-pro.sh`:

```bash
#!/usr/bin/env bash
set -euo pipefail

echo "🚀 OnDeviceAI Production Build for iPhone 16 Pro"

# Configuration
PROJECT_NAME="OnDeviceAI"
SCHEME="OnDeviceAI"
WORKSPACE="ios/${PROJECT_NAME}.xcworkspace"
OUTPUT_DIR="build/production"

# Clean previous builds
echo "🧹 Cleaning previous builds..."
rm -rf "$OUTPUT_DIR"
cd ios && rm -rf build/ && cd ..

# Install dependencies
echo "📦 Installing dependencies..."
bun install

# Regenerate Codegen for TurboModules
echo "⚙️ Generating TurboModule code..."
bunx react-native codegen

# Install iOS dependencies
echo "🍎 Installing iOS dependencies..."
cd ios
bundle install
RCT_NEW_ARCH_ENABLED=1 bundle exec pod install --repo-update
cd ..

# Build for iPhone 16 Pro
echo "🔨 Building for iPhone 16 Pro..."
xcodebuild \
  -workspace "$WORKSPACE" \
  -scheme "$SCHEME" \
  -configuration Release \
  -destination 'platform=iOS,name=iPhone 16 Pro' \
  -derivedDataPath "$OUTPUT_DIR" \
  -archivePath "$OUTPUT_DIR/${PROJECT_NAME}.xcarchive" \
  clean archive

echo "✅ Production build complete!"
echo "📱 Archive location: $OUTPUT_DIR/${PROJECT_NAME}.xcarchive"
```

Make executable:
```bash
chmod +x build-production-iphone16-pro.sh
```

---

## 🧪 **6. TurboModule Testing**

### **Verify TurboModule Integration**
```bash
# Run the app and check console for:
# ✅ "TurboSpeechModule initialized successfully"
# ✅ "Calendar module available"
# ✅ "Audio session configured"
```

### **Use iPhone16ProTester Component**
Add to your app for comprehensive testing:

```typescript
// In your main app or test screen
import iPhone16ProTester from './src/utils/iPhone16ProTester';

// Run comprehensive tests
useEffect(() => {
  iPhone16ProTester.runFullTestSuite().then(results => {
    console.log('iPhone 16 Pro Test Results:', results);
  });
}, []);
```

---

## 🔧 **7. Troubleshooting**

### **Common Issues & Solutions**

#### **Pod Install Fails**
```bash
cd ios
pod repo update
rm -rf Pods/ Podfile.lock
RCT_NEW_ARCH_ENABLED=1 bundle exec pod install
```

#### **TurboModule Not Found**
```bash
# Regenerate Codegen
bunx react-native codegen

# Verify generated files
ls build/generated/ios/OnDeviceAISpec/

# Clean and rebuild
cd ios && rm -rf build/ && pod install
```

#### **Build Fails on Xcode**
```bash
# Clean derived data
rm -rf ~/Library/Developer/Xcode/DerivedData/OnDeviceAI-*

# Reset simulators
xcrun simctl erase all

# Restart Xcode and Metro
```

#### **Device Not Recognized**
```bash
# List devices
xcrun devicectl list devices

# Reset device trust
# Settings > General > Transfer or Reset iPhone > Reset > Reset Location & Privacy
```

---

## 📊 **8. Performance Validation**

### **Expected Performance on iPhone 16 Pro**
- **TurboModule Init**: < 5ms
- **Speech Recognition**: Real-time with A18 Pro Neural Engine
- **Text-to-Speech**: < 100ms response time
- **Calendar Operations**: < 50ms

### **Testing Commands**
```javascript
// Test speech functionality
await TurboSpeechModule.speak("Testing iPhone 16 Pro performance");

// Test calendar integration
await CalendarModule.getTodaysEvents();

// Verify audio session
await TurboSpeechModule.configureAudioSession();
```

---

## 🏭 **9. CI/CD Integration**

### **GitHub Actions Example**
```yaml
name: Build iPhone 16 Pro
on: [push, pull_request]

jobs:
  build-ios:
    runs-on: macos-14
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
      
      - name: Install Bun
        run: curl -fsSL https://bun.sh/install | bash
      
      - name: Install dependencies
        run: bun install
      
      - name: Setup iOS
        run: |
          cd ios
          bundle install
          RCT_NEW_ARCH_ENABLED=1 bundle exec pod install
      
      - name: Build for iPhone 16 Pro
        run: ./build-production-iphone16-pro.sh
```

---

## ✅ **10. Final Checklist**

Before deploying to iPhone 16 Pro:

- [ ] New Architecture enabled (`RCT_NEW_ARCH_ENABLED=1`)
- [ ] TurboModules compiled and available
- [ ] Speech recognition permissions configured
- [ ] Calendar access permissions set
- [ ] Audio session properly configured
- [ ] App builds without errors
- [ ] All TurboModule tests pass
- [ ] Performance metrics are optimal

---

## 🎯 **Success Indicators**

Your build is successful when:
- ✅ App launches on iPhone 16 Pro
- ✅ Console shows: "✅ TurboSpeechModule initialized successfully"
- ✅ Speech recognition works with native performance
- ✅ Calendar integration functions properly
- ✅ Audio session configured without errors
- ✅ All permissions granted and working

---

## 📱 **Next Steps**

1. **Run the build script**: `./build-production-iphone16-pro.sh`
2. **Deploy to iPhone 16 Pro**: Connect device and run
3. **Test TurboModule features**: Use iPhone16ProTester
4. **Validate performance**: Check metrics and responsiveness
5. **Deploy to App Store**: Use Xcode Archive for distribution

Your OnDeviceAI app is now optimized for iPhone 16 Pro with native TurboModule performance! 🎉