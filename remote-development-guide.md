# Complete Remote macOS Development Guide for OnDeviceAI

This guide provides a comprehensive solution for developing our React Native TurboModule app on a remote macOS environment while working from Linux/Windows.

## 🎯 Overview

Our OnDeviceAI project includes:
- **TurboModules**: Speech Recognition, Calendar Integration
- **New Architecture**: React Native 0.79.2 with Fabric renderer
- **iPhone 16 Pro Optimization**: A18 Pro chip optimizations
- **Advanced Features**: Native iOS Speech Framework, EventKit

## 📋 Prerequisites

1. **Remote macOS Instance** (choose one):
   - MacStadium (recommended for professional development)
   - Mac-in-Cloud
   - AWS EC2 Mac instances
   - Physical Mac with remote access

2. **Local Development Machine** (Linux/Windows):
   - VS Code with Remote-SSH extension
   - SSH key pair for secure connection
   - Git configured

## 🚀 Step-by-Step Setup

### 1. Configure Remote macOS Access

```bash
# On your local machine, add to ~/.ssh/config:
Host ondeviceai-mac
  HostName your-mac-host.com
  User macuser
  IdentityFile ~/.ssh/id_rsa
  Port 22
  ServerAliveInterval 60
```

### 2. Connect via VS Code Remote-SSH

1. Install **Remote-SSH** extension in VS Code
2. `Ctrl+Shift+P` → "Remote-SSH: Connect to Host"
3. Select `ondeviceai-mac`
4. VS Code will connect and open a remote workspace

### 3. Setup Development Environment on macOS

In the VS Code remote terminal:

```bash
# Download and run our setup script
curl -O https://raw.githubusercontent.com/your-repo/ondeviceai/main/setup-remote-dev.sh
chmod +x setup-remote-dev.sh
./setup-remote-dev.sh
```

### 4. Clone and Setup Project

```bash
# Clone the project
git clone https://github.com/your-repo/ondeviceai.git
cd ondeviceai

# Install dependencies
bun install

# Generate TurboModule interfaces
bun run codegen

# Install iOS dependencies with New Architecture
cd ios
RCT_NEW_ARCH_ENABLED=1 bundle exec pod install
cd ..
```

### 5. Development Workflow

**Terminal 1 - Metro Bundler:**
```bash
bun start
```

**Terminal 2 - iOS Simulator:**
```bash
# Run on iPhone 16 Pro simulator
bun run ios:iphone16pro

# Or run production build
./build-production-iphone16-pro.sh
```

**Terminal 3 - Logs & Debugging:**
```bash
# Watch iOS logs
xcrun simctl spawn booted log stream --predicate 'process == "OnDeviceAI"'
```

## 📱 Physical iPhone Development

### Setup USB Forwarding (Linux Host)

```bash
# Install usbip
sudo apt install usbip
sudo systemctl enable --now usbipd.socket

# Connect iPhone and find bus ID
usbip list -l

# Use our helper script
./connect-usb-device.sh 1-1
```

### Connect on Remote Mac

```bash
# SSH to remote Mac
ssh ondeviceai-mac

# Attach the forwarded iPhone
sudo usbip attach -r YOUR_LINUX_IP -b 1-1

# Verify connection
idevice_id -l
```

## 🔧 TurboModule Development

Our project includes custom TurboModules that require specific setup:

### Speech Recognition Module
- **File**: `ios/OnDeviceAI/RCTSpeechModule.m`
- **Features**: Native iOS Speech Framework integration
- **Testing**: Use iPhone for best results (simulator has limitations)

### Calendar Integration Module
- **File**: `src/modules/IOSCalendarModule.ts`
- **Features**: EventKit native access with Expo fallback
- **Permissions**: Requires calendar permissions on device

### Performance Monitoring
- **Optimization**: iPhone 16 Pro A18 chip specific optimizations
- **Benchmarking**: Real-time performance metrics

## 🛠 Common Development Tasks

### Running Tests
```bash
# TypeScript validation
bun run tsc --noEmit

# iOS unit tests
cd ios && xcodebuild test -workspace OnDeviceAI.xcworkspace -scheme OnDeviceAI -destination 'platform=iOS Simulator,name=iPhone 16 Pro'
```

### Debugging
```bash
# Flipper debugging (if enabled)
open /Applications/Flipper.app

# Xcode debugging
open ios/OnDeviceAI.xcworkspace
```

### Building for Distribution
```bash
# Production build
./build-production-iphone16-pro.sh

# Archive for App Store
cd ios && xcodebuild archive -workspace OnDeviceAI.xcworkspace -scheme OnDeviceAI
```

## 🎨 Screen Sharing & VNC

For visual debugging and UI work:

```bash
# On remote Mac, enable Screen Sharing
# System Settings → Sharing → Screen Sharing

# Connect via VNC client:
# vnc://your-mac-host.com:5900
```

## 🔄 Hot Reload & Fast Refresh

- **File changes** in local VS Code sync instantly via Remote-SSH
- **Metro Fast Refresh** updates simulator/device automatically
- **TurboModule changes** require rebuild: `bun run ios`

## 📊 Performance Monitoring

Our app includes built-in performance monitoring:

```bash
# Run performance tests
bun run test:performance

# iPhone 16 Pro optimization validation
bun run test:iphone16pro
```

## 🚦 CI/CD Integration

Use the same environment for CI:

```yaml
# GitHub Actions example
- name: Setup Remote macOS
  run: ./setup-remote-dev.sh

- name: Build iOS
  run: ./build-production-iphone16-pro.sh
```

## 🆘 Troubleshooting

### Common Issues

1. **Pods won't install**:
   ```bash
   cd ios && rm -rf Pods Podfile.lock
   RCT_NEW_ARCH_ENABLED=1 bundle exec pod install
   ```

2. **TurboModule not found**:
   ```bash
   bun run codegen
   cd ios && xcodebuild clean
   ```

3. **Simulator won't launch**:
   ```bash
   sudo xcode-select -s /Applications/Xcode.app/Contents/Developer
   xcrun simctl shutdown all && xcrun simctl boot "iPhone 16 Pro"
   ```

4. **USB device not forwarding**:
   ```bash
   # Linux side
   sudo systemctl restart usbipd
   # Mac side
   brew reinstall usbip
   ```

## 💡 Pro Tips

1. **Use tmux** for persistent sessions on remote Mac
2. **Enable SSH key forwarding** for Git operations
3. **Set up aliases** for common commands
4. **Use VS Code sync settings** across local and remote
5. **Keep Xcode updated** for latest iOS simulator support

## 📚 Additional Resources

- [React Native New Architecture Guide](https://reactnative.dev/docs/new-architecture-intro)
- [TurboModule Development](https://reactnative.dev/docs/the-new-architecture/pillars-turbomodules)
- [iOS Speech Framework Documentation](https://developer.apple.com/documentation/speech)
- [EventKit Programming Guide](https://developer.apple.com/library/archive/documentation/DataManagement/Conceptual/EventKitProgGuide/)

---

🎉 **You're now ready for professional iOS development with full TurboModule support on remote macOS!**