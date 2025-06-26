#!/usr/bin/env bash
set -euo pipefail

echo "🚀 PUSHING ONDEVICEAI TURBOMODULE TO GITHUB"
echo "============================================"

# Your GitHub details
GITHUB_USERNAME="ales27pm"
REPO_NAME="ondeviceai"
GITHUB_EMAIL="56891139+ales27pm@users.noreply.github.com"

echo "👤 GitHub User: $GITHUB_USERNAME"
echo "📧 Email: $GITHUB_EMAIL"
echo "📦 Repository: $REPO_NAME"
echo ""

# Configure git user if not already set
echo "🔧 Configuring Git..."
git config user.email "$GITHUB_EMAIL"
git config user.name "$GITHUB_USERNAME"

# Check current status
echo "📊 Current Status:"
echo "• Commits ready: $(git rev-list --count HEAD)"
echo "• Current branch: $(git branch --show-current)"

# Add GitHub remote
echo ""
echo "🔗 Adding GitHub remote..."
if git remote get-url origin >/dev/null 2>&1; then
    echo "⚠️  Remote 'origin' already exists. Removing and re-adding..."
    git remote remove origin
fi

git remote add origin "https://github.com/$GITHUB_USERNAME/$REPO_NAME.git"
echo "✅ GitHub remote added: https://github.com/$GITHUB_USERNAME/$REPO_NAME.git"

# Show what will be pushed
echo ""
echo "📋 Files ready to push:"
git ls-files | grep -E "(TurboModule|ios/OnDeviceAI|\.github)" | head -10
echo "... and $(git ls-files | wc -l) total files"

echo ""
echo "🎯 READY TO PUSH!"
echo "=================="
echo ""
echo "Manual push command:"
echo "git push -u origin main"
echo ""
echo "OR run: git push -u origin main"
echo ""

# Offer to push automatically
read -p "🚀 Push to GitHub now? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🚀 Pushing to GitHub..."
    git push -u origin main
    
    echo ""
    echo "🎉 SUCCESS! Your project is now on GitHub!"
    echo "=========================================="
    echo ""
    echo "🔗 Repository URL: https://github.com/$GITHUB_USERNAME/$REPO_NAME"
    echo "⚡ Actions URL: https://github.com/$GITHUB_USERNAME/$REPO_NAME/actions"
    echo ""
    echo "Next steps:"
    echo "1. Go to: https://github.com/$GITHUB_USERNAME/$REPO_NAME"
    echo "2. Click 'Actions' tab to watch your TurboModule build!"
    echo "3. See 'iOS CI - TurboModule Build' running on free macOS"
    echo ""
    echo "🎊 Your TurboModule is building automatically on GitHub!"
else
    echo ""
    echo "📝 Manual push when ready:"
    echo "git push -u origin main"
    echo ""
    echo "Then visit: https://github.com/$GITHUB_USERNAME/$REPO_NAME"
fi