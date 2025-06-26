# Remote macOS Dev Environment (No Simulation)

Develop on Linux/Windows via VS Code Remote–SSH; build & run on a real macOS instance with Xcode.

---

## A. Provision Remote macOS

1. **Rent a Mac VM** (MacStadium, Mac-in-Cloud, AWS EC2 Mac instances)
2. **Enable Remote Login & Screen Sharing:**
   - **System Settings → General → Sharing → Remote Login**
   - **System Settings → General → Sharing → Screen Sharing**

---

## B. VS Code Remote‐SSH

On your local machine:

```bash
# 1. Install VS Code + Remote-SSH extension
# 2. Add to ~/.ssh/config:
Host remote-mac
  HostName  mac.example.com
  User      macuser
  IdentityFile ~/.ssh/id_rsa

# 3. In VS Code: Remote-SSH → Connect to Host… → remote-mac
```

---

## C. Install Toolchain on Remote

In your VS Code remote terminal:

```bash
# 1. Xcode CLI
xcode-select --install

# 2. Homebrew
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# 3. CocoaPods & Bundler
brew install cocoapods
sudo gem install bundler

# 4. Node & Bun
brew install node
curl -fsSL https://bun.sh/install | bash

# 5. Clone repo & deps
git clone <your-repo-url>
cd your-app
bun install

# 6. Pod install with New Architecture
cd ios
bundle install
RCT_NEW_ARCH_ENABLED=1 bundle exec pod install
cd ..
```

---

## D. Launch Metro & iOS Simulator

**Terminal A (remote):**
```bash
cd your-app
bun start
```

**Terminal B (remote):**
```bash
cd your-app
bun run ios:iphone16pro
# or manually:
# npx react-native run-ios --simulator "iPhone 16 Pro" --scheme OnDeviceAI --configuration Debug
```

The iOS Simulator will launch on the remote Mac. Use a VNC client pointing at the Mac's Screen Sharing address to view it.

---

## E. Connect Real iPhone (Optional)

**On Linux host:**

1. **Install usbip:**
```bash
sudo apt install usbip
sudo systemctl enable --now usbipd.socket
```

2. **List USB ports & attach your iPhone:**
```bash
usbip list -l
sudo usbip bind -b <busid>
```

**On remote Mac:**
```bash
ssh macuser@mac.example.com 'sudo usbip attach -r <linuxHostIP> -b <busid>'
```

3. **On the Mac, `idevice_id -l` will show the forwarded device.**
4. **In Xcode (remote), select your iPhone under Devices and run.**

---

## F. Debugging & Logs

- **Metro logs** show up in Terminal A
- **Xcode console** appears in the VNC session
- **Hot reload** works instantly on file save in your local VS Code (synced via Remote-SSH)

---

## G. CI Parity

Use the exact same steps in a GitHub Actions or Codemagic macOS runner to ensure your remote dev & CI are identical.

---

## H. TurboModule Specific Setup

For our OnDeviceAI project with TurboModules:

```bash
# After cloning and installing dependencies:
cd your-app

# 1. Run codegen
bun run codegen

# 2. Install iOS dependencies with New Architecture
cd ios
RCT_NEW_ARCH_ENABLED=1 bundle exec pod install

# 3. Build for iPhone 16 Pro
cd ..
./build-production-iphone16-pro.sh
```

**Expected TurboModules:**
- Speech Recognition (RCTSpeechModule)
- Calendar Integration (IOSCalendarModule)
- Performance Monitoring

---

End of remote-mac setup guide