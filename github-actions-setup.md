# GitHub Actions CI/CD Setup for OnDeviceAI

**Free iOS builds on GitHub's macOS runners with TurboModule support**

## 🚀 Quick Setup

### 1. Push to GitHub

```bash
# Create new repo on GitHub, then:
git remote add origin https://github.com/YOUR_USERNAME/ondeviceai.git
git branch -M main
git push -u origin main
```

### 2. GitHub Actions Workflows

We've included two pre-configured workflows:

#### 🔧 **`.github/workflows/ios-build.yml`** - Development CI
- **Triggers**: Every push to main/dev, PRs
- **Purpose**: Build validation, TurboModule testing
- **Simulator**: iPhone 16 Pro
- **Duration**: ~15-20 minutes
- **Cost**: **FREE** (GitHub provides 2000 minutes/month)

#### 🚀 **`.github/workflows/ios-testflight.yml`** - Production Deploy  
- **Triggers**: Release tags (v1.0.0), manual dispatch
- **Purpose**: TestFlight uploads, App Store builds
- **Requirements**: Code signing certificates
- **Duration**: ~25-35 minutes

### 3. Configuration

Replace these placeholders in the workflows:

| Placeholder | Your Value | Example |
|-------------|------------|---------|
| `YOUR_USERNAME` | GitHub username | `yourusername` |
| `YOUR_REPO_NAME` | Repository name | `ondeviceai` |
| `YOUR_APP_SCHEME` | Xcode scheme | `OnDeviceAI` |

## 📱 What Gets Built

### ✅ **Automatic Validation**
- **TurboModule Compilation** - Full codegen and native compilation
- **TypeScript Check** - Type safety validation
- **CocoaPods Installation** - All iOS dependencies
- **iPhone 16 Pro Build** - Simulator compilation and testing
- **New Architecture** - TurboModule and Fabric verification

### ✅ **TurboModule Testing**
- **Speech Recognition** - Native iOS Speech Framework
- **Text-to-Speech** - AVSpeechSynthesizer integration
- **Event Emitters** - Real-time communication testing
- **Performance** - A18 Pro optimization validation

## 🔧 GitHub Secrets Setup (For TestFlight)

For production builds, add these secrets in your GitHub repo:

1. Go to **Settings** → **Secrets and variables** → **Actions**
2. Click **New repository secret** for each:

| Secret Name | Description | Where to Get |
|-------------|-------------|--------------|
| `FASTLANE_APPLE_ID` | Your Apple ID email | Apple Developer Account |
| `FASTLANE_APPLE_APPLICATION_SPECIFIC_PASSWORD` | App-specific password | [Apple ID Settings](https://appleid.apple.com) |
| `APP_STORE_CONNECT_TEAM_ID` | Team ID for App Store Connect | App Store Connect → Users and Access |
| `DEVELOPER_TEAM_ID` | Development Team ID | Apple Developer → Membership |
| `MATCH_PASSWORD` | Certificate encryption password | Your choice (if using Fastlane Match) |

## 📊 Build Process

### **Development Build Flow**
```
1. Code Push → 2. GitHub Actions → 3. macOS Runner → 4. TurboModule Build → 5. iPhone 16 Pro Test → 6. ✅ Success
```

### **Production Build Flow**
```
1. Release Tag → 2. GitHub Actions → 3. Code Signing → 4. Archive Build → 5. TestFlight Upload → 6. 🚀 Live
```

## 🎯 Monitoring Builds

### **View Build Status**
1. Go to your GitHub repo
2. Click **Actions** tab
3. Select **iOS CI - TurboModule Build**
4. View real-time build logs

### **Build Artifacts**
Each build generates downloadable artifacts:
- **ios-build-artifacts** - Build outputs, logs, generated files
- **production-build** - .ipa files, archives (TestFlight builds)

## 💡 Advanced Configuration

### **Custom Simulator Targets**
Edit `.github/workflows/ios-build.yml`:
```yaml
--simulator "iPhone 15 Pro Max"
# or
--simulator "iPad Pro (12.9-inch)"
```

### **Branch-Specific Builds**
```yaml
on:
  push:
    branches: [ main, develop, feature/* ]
```

### **Matrix Builds** (Multiple Simulators)
```yaml
strategy:
  matrix:
    simulator: ["iPhone 16 Pro", "iPhone 15", "iPad Pro"]
```

## 🚨 Troubleshooting

### **Common Issues**

1. **Build Timeout**
   - Increase `timeout-minutes: 60`
   - Optimize CocoaPods caching

2. **Simulator Not Found**
   - Check available simulators: `xcrun simctl list devices`
   - Use exact simulator name from Xcode

3. **TurboModule Compilation Fails**
   - Verify `RCT_NEW_ARCH_ENABLED=1` is set
   - Check codegen output in build logs

4. **Pod Installation Issues**
   - Clear caches: Add `pod cache clean --all`
   - Update Ruby version in workflow

### **Debug Commands**
Add to workflow for debugging:
```yaml
- name: Debug Environment
  run: |
    echo "Xcode version: $(xcodebuild -version)"
    echo "Available simulators:"
    xcrun simctl list devices available
    echo "Ruby version: $(ruby --version)"
    echo "CocoaPods version: $(pod --version)"
```

## 🎉 Success Metrics

After setup, every push will:
- ✅ **Build TurboModules** on real macOS
- ✅ **Test iPhone 16 Pro** compatibility  
- ✅ **Validate New Architecture** 
- ✅ **Generate Build Reports**
- ✅ **Cache Dependencies** for faster builds

## 🔗 Integration with Remote Development

This GitHub Actions setup complements your remote macOS development:

- **Local Development**: Remote macOS for active coding
- **CI/CD**: GitHub Actions for automated testing
- **Team Collaboration**: Shared build validation
- **Production**: Automated TestFlight deployment

---

## 🎊 You're All Set!

**Your OnDeviceAI project now has professional CI/CD with:**
- 🆓 **Free macOS builds** on every commit
- 📱 **iPhone 16 Pro testing** automatically
- ⚡ **TurboModule validation** with every change
- 🚀 **TestFlight deployment** ready for production

**Push your code and watch it build on GitHub's infrastructure!** 🎉