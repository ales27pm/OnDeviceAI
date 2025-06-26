#!/usr/bin/env bash
set -euo pipefail

if [ "$#" -ne 1 ]; then
  echo "Usage: $0 <busid>"
  echo "Find busid via: usbip list -l"
  echo ""
  echo "Example:"
  echo "  usbip list -l"
  echo "  sudo ./connect-usb-device.sh 1-1"
  exit 1
fi

BUSID="$1"
LINUX_HOST_IP=$(hostname -I | awk '{print $1}')

echo "📱 USB iPhone Connection Helper for Remote macOS Development"
echo "============================================================"

echo "🔗 Binding iPhone on bus $BUSID to local usbipd…"
sudo usbip bind -b "$BUSID"

echo "📡 iPhone bound successfully!"
echo ""
echo "Now connect from your remote Mac:"
echo "=================================="
echo ""
echo "1. SSH into your remote Mac:"
echo "   ssh macuser@mac.example.com"
echo ""
echo "2. Install usbip on the Mac (if not already installed):"
echo "   brew install usbip"
echo ""
echo "3. Attach the device from the Mac:"
echo "   sudo usbip attach -r $LINUX_HOST_IP -b $BUSID"
echo ""
echo "4. Verify the device is connected:"
echo "   idevice_id -l"
echo ""
echo "5. In Xcode, your iPhone should appear in the device list"
echo ""
echo "🔄 To disconnect later:"
echo "======================"
echo "On Mac: sudo usbip detach -p <port>"
echo "On Linux: sudo usbip unbind -b $BUSID"
echo ""
echo "💡 Troubleshooting:"
echo "=================="
echo "- Ensure iPhone is unlocked and 'Trust This Computer' is accepted"
echo "- Check firewall settings allow connection on Linux host"
echo "- Verify usbipd service is running: sudo systemctl status usbipd"