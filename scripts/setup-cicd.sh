#!/bin/bash

# 🚀 CI/CD Setup Script for OnDeviceAI
# This script helps configure the enhanced CI/CD pipeline

set -e

echo "🚀 Setting up CI/CD Pipeline for OnDeviceAI"
echo "==========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    log_error "This script must be run from the project root directory"
    exit 1
fi

# Check if .github directory exists
if [ ! -d ".github" ]; then
    log_error ".github directory not found. Please ensure workflows are in place."
    exit 1
fi

log_info "Checking CI/CD configuration..."

# 1. Verify workflow files
WORKFLOWS=("ci.yml" "ios-deploy.yml" "release.yml" "security.yml")
for workflow in "${WORKFLOWS[@]}"; do
    if [ -f ".github/workflows/$workflow" ]; then
        log_success "Found workflow: $workflow"
    else
        log_error "Missing workflow: $workflow"
    fi
done

# 2. Check CodeQL configuration
if [ -f ".github/codeql-config.yml" ]; then
    log_success "CodeQL configuration found"
else
    log_warning "CodeQL configuration not found"
fi

# 3. Check issue templates
if [ -d ".github/ISSUE_TEMPLATE" ]; then
    log_success "Issue templates found"
else
    log_warning "Issue templates not found"
fi

# 4. Check PR template
if [ -f ".github/PULL_REQUEST_TEMPLATE.md" ]; then
    log_success "PR template found"
else
    log_warning "PR template not found"
fi

# 5. Verify package.json scripts
log_info "Checking package.json scripts..."

REQUIRED_SCRIPTS=("test" "build" "lint" "type-check")
for script in "${REQUIRED_SCRIPTS[@]}"; do
    if bun run --silent "$script" --help > /dev/null 2>&1; then
        log_success "Script available: $script"
    else
        log_warning "Script not available or not working: $script"
    fi
done

# 6. Check iOS configuration
log_info "Checking iOS configuration..."

if [ -f "ios/OnDeviceAI.xcworkspace" ]; then
    log_success "iOS workspace found"
elif [ -f "ios/OnDeviceAI.xcodeproj" ]; then
    log_success "iOS project found"
else
    log_error "iOS project/workspace not found"
fi

if [ -f "ios/Podfile" ]; then
    log_success "Podfile found"
else
    log_error "Podfile not found"
fi

if [ -f "ios/OnDeviceAI/Info.plist" ]; then
    log_success "Info.plist found"
else
    log_error "Info.plist not found"
fi

# 7. Check environment files
log_info "Checking environment configuration..."

if [ -f ".env.example" ]; then
    log_success ".env.example found"
else
    log_warning ".env.example not found"
fi

if [ -f ".env" ]; then
    log_success ".env found"
else
    log_warning ".env not found (will be created by workflows)"
fi

# 8. Generate secrets checklist
log_info "Generating secrets checklist..."

cat > SECRETS_CHECKLIST.md << 'EOF'
# 🔐 GitHub Secrets Checklist

## Required Secrets for CI/CD Pipeline

### Apple Developer Secrets
- [ ] `APPLE_ID` - Your Apple Developer Account email
- [ ] `APP_STORE_CONNECT_TEAM_ID` - Your App Store Connect team ID
- [ ] `DEVELOPER_TEAM_ID` - Your Apple Developer team ID  
- [ ] `MATCH_PASSWORD` - Password for Fastlane Match certificates
- [ ] `APPLE_APP_SPECIFIC_PASSWORD` - App-specific password for your Apple ID

### Optional Notification Secrets
- [ ] `SLACK_WEBHOOK_URL` - For Slack notifications
- [ ] `DISCORD_WEBHOOK_URL` - For Discord notifications

## How to Add Secrets

1. Go to your GitHub repository
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add each secret with the exact name and value

## Finding Your Apple Developer Information

### Apple ID
- Your Apple Developer account email address

### Team IDs
- Sign in to [Apple Developer](https://developer.apple.com/)
- Go to **Membership** section
- Find your **Team ID**

### App Store Connect Team ID
- Sign in to [App Store Connect](https://appstoreconnect.apple.com/)
- Go to **Users and Access** → **Keys**
- Your Team ID is displayed at the top

### App-Specific Password
- Sign in to [Apple ID](https://appleid.apple.com/)
- Go to **Security** → **App-Specific Passwords**
- Generate a new password for "GitHub Actions"

## Fastlane Match Setup

Fastlane Match requires a separate repository for certificates:

1. Create a new **private** repository: `your-org/your-app-certificates`
2. Initialize it with a README
3. Set `MATCH_PASSWORD` to a secure password
4. The first deployment will initialize the certificates

## Verification

After setting up secrets, test the pipeline:

1. Create a test branch
2. Push changes
3. Check that the CI/CD pipeline runs without secret errors
4. Verify iOS deployment works (may require certificate setup)

## Security Notes

- Never commit secrets to your repository
- Use app-specific passwords, not your main Apple ID password
- Regularly rotate secrets
- Use least-privilege access for service accounts
EOF

log_success "Generated SECRETS_CHECKLIST.md"

# 9. Create GitHub environments configuration
log_info "Creating GitHub environments configuration..."

mkdir -p .github/environments

cat > .github/environments/staging.yml << 'EOF'
# Staging Environment Configuration
name: staging
url: https://staging.ondeviceai.app
reviewers:
  - type: user
    name: maintainer
protection_rules:
  - type: branch_policy
    branch_pattern: develop
deployment_branch_policy:
  protected_branches: false
  custom_branch_policies: true
EOF

cat > .github/environments/production.yml << 'EOF'
# Production Environment Configuration  
name: production
url: https://ondeviceai.app
reviewers:
  - type: user
    name: maintainer
  - type: team
    name: core-team
protection_rules:
  - type: required_reviewers
    count: 1
  - type: wait_timer
    minutes: 5
deployment_branch_policy:
  protected_branches: true
  custom_branch_policies: false
EOF

log_success "Created environment configurations"

# 10. Create Fastlane configuration
log_info "Creating Fastlane configuration..."

mkdir -p ios/fastlane

cat > ios/fastlane/Fastfile << 'EOF'
# Fastlane Configuration for OnDeviceAI

default_platform(:ios)

platform :ios do
  before_all do
    setup_circle_ci if is_ci
  end

  desc "Run tests"
  lane :test do
    run_tests(
      workspace: "OnDeviceAI.xcworkspace",
      scheme: "OnDeviceAI",
      clean: true
    )
  end

  desc "Build app for testing"
  lane :build_for_testing do
    match(type: "appstore", readonly: true)
    
    build_app(
      workspace: "OnDeviceAI.xcworkspace",
      scheme: "OnDeviceAI",
      configuration: "Release",
      clean: true,
      export_method: "app-store"
    )
  end

  desc "Deploy to TestFlight"
  lane :deploy_testflight do
    match(type: "appstore", readonly: true)
    
    build_app(
      workspace: "OnDeviceAI.xcworkspace", 
      scheme: "OnDeviceAI",
      configuration: "Release",
      clean: true,
      export_method: "app-store"
    )
    
    upload_to_testflight(
      skip_waiting_for_build_processing: true,
      changelog: "New build from CI/CD pipeline"
    )
  end

  desc "Deploy to App Store"
  lane :deploy_appstore do
    match(type: "appstore", readonly: true)
    
    build_app(
      workspace: "OnDeviceAI.xcworkspace",
      scheme: "OnDeviceAI", 
      configuration: "Release",
      clean: true,
      export_method: "app-store"
    )
    
    upload_to_app_store(
      submit_for_review: false,
      automatic_release: false,
      force: true
    )
  end

  desc "Create ad-hoc build"
  lane :build_adhoc do
    match(type: "adhoc", readonly: true)
    
    build_app(
      workspace: "OnDeviceAI.xcworkspace",
      scheme: "OnDeviceAI",
      configuration: "Release", 
      clean: true,
      export_method: "ad-hoc"
    )
  end

  error do |lane, exception|
    # This block is called if there was an error
    puts "Error in lane #{lane}: #{exception}"
  end
end
EOF

log_success "Created Fastlane configuration"

# 11. Create project documentation
log_info "Creating project documentation..."

cat > CI_CD_GUIDE.md << 'EOF'
# 🚀 CI/CD Pipeline Guide

## Overview

This project uses a comprehensive CI/CD pipeline with GitHub Actions for:
- **Code Quality**: TypeScript, ESLint, Prettier, Security scanning
- **Testing**: Unit, Integration, E2E testing
- **Building**: iOS builds with TurboModules
- **Security**: CodeQL, OWASP dependency scanning
- **Deployment**: Automated TestFlight and App Store deployment
- **Release Management**: Semantic versioning and changelog generation

## Workflows

### 1. Main CI/CD Pipeline (`ci.yml`)
**Triggers**: Push to main/develop, Pull requests
- Code quality checks
- Test suite execution
- iOS builds (Debug/Release)
- Security scanning
- Performance analysis
- Deployment to staging/production

### 2. iOS Deployment (`ios-deploy.yml`)
**Triggers**: Version tags, Manual dispatch
- Pre-deployment validation
- iOS build and archive
- TestFlight/App Store deployment
- Artifact management

### 3. Release Management (`release.yml`)
**Triggers**: Manual dispatch
- Version bumping (semantic versioning)
- Changelog generation
- GitHub release creation
- Automatic iOS deployment

### 4. Security Scanning (`security.yml`)
**Triggers**: Push, PR, Daily schedule
- CodeQL analysis
- OWASP dependency scanning
- Secrets detection
- License compliance

## Getting Started

### 1. Initial Setup
```bash
# Run setup script
chmod +x scripts/setup-cicd.sh
./scripts/setup-cicd.sh
```

### 2. Configure Secrets
See `SECRETS_CHECKLIST.md` for required GitHub secrets.

### 3. Set Up Environments
- Create `staging` and `production` environments in GitHub
- Configure protection rules and reviewers

### 4. Test the Pipeline
```bash
# Create test branch
git checkout -b test-pipeline

# Make a small change
echo "# Test" >> README.md

# Commit and push
git add README.md
git commit -m "test: pipeline validation"
git push origin test-pipeline

# Create PR to trigger pipeline
```

## Usage

### Triggering Deployments

#### Manual Deployment
1. Go to **Actions** → **iOS Deployment**
2. Click **Run workflow**
3. Select deployment type and options
4. Monitor progress

#### Automatic Deployment
- Push version tags (e.g., `v1.0.0`) triggers deployment
- Main branch pushes deploy to staging
- Release creation triggers production deployment

### Creating Releases

#### Using Release Workflow
1. Go to **Actions** → **Release Management**
2. Click **Run workflow**
3. Select release type (patch/minor/major/beta)
4. Add optional release notes
5. Pipeline handles version bumping and deployment

#### Manual Release
```bash
# Update version in package.json
npm version patch  # or minor, major

# Create and push tag
git push origin v1.0.0

# Release workflow triggers automatically
```

### Monitoring

#### Pipeline Status
- **GitHub Actions**: Real-time progress
- **Artifacts**: Reports and build outputs
- **Notifications**: Configurable via webhooks

#### Common Issues
- **Build Failures**: Check TypeScript/ESLint errors
- **iOS Signing**: Verify certificates and provisioning
- **Test Failures**: Review test logs in artifacts
- **Security Scans**: Address vulnerabilities promptly

## Customization

### Adding New Workflows
1. Create `.github/workflows/new-workflow.yml`
2. Follow existing patterns for consistency
3. Test thoroughly before merging

### Modifying Existing Workflows
1. Update workflow files
2. Test changes in feature branch
3. Monitor for breaking changes

### Environment Variables
Configure in workflow files:
```yaml
env:
  NODE_VERSION: '20'
  XCODE_VERSION: '15.2'
  CUSTOM_SETTING: 'value'
```

## Security

### Best Practices
- Never commit secrets
- Use app-specific passwords
- Regularly rotate credentials
- Monitor security scan results
- Keep dependencies updated

### Compliance
- CodeQL analysis for security vulnerabilities
- OWASP dependency scanning
- License compliance checking
- Automated security reporting

## Troubleshooting

### Common Problems

#### "Secrets not found"
- Verify secrets are configured in repository settings
- Check secret names match exactly
- Ensure secrets are not empty

#### "iOS build failed"
- Check Xcode version compatibility
- Verify iOS project configuration
- Review code signing setup

#### "Tests failing"
- Run tests locally first
- Check test configuration
- Review test logs in artifacts

### Getting Help
1. Check workflow logs
2. Review this documentation
3. Search existing issues
4. Create issue with detailed logs

## Maintenance

### Regular Tasks
- [ ] Monitor security scan results
- [ ] Update dependencies monthly
- [ ] Review and update workflows quarterly
- [ ] Test deployment process regularly
- [ ] Maintain documentation

### Performance Optimization
- [ ] Monitor workflow execution times
- [ ] Optimize caching strategies
- [ ] Review resource usage
- [ ] Update runner versions

---

*Last updated: $(date +'%Y-%m-%d')*
EOF

log_success "Created CI/CD guide"

# 12. Final validation
log_info "Running final validation..."

# Check if all required files exist
REQUIRED_FILES=(
    ".github/workflows/ci.yml"
    ".github/workflows/ios-deploy.yml" 
    ".github/workflows/release.yml"
    ".github/workflows/security.yml"
    ".github/codeql-config.yml"
    ".github/PULL_REQUEST_TEMPLATE.md"
    "SECRETS_CHECKLIST.md"
    "CI_CD_GUIDE.md"
)

ALL_PRESENT=true
for file in "${REQUIRED_FILES[@]}"; do
    if [ -f "$file" ]; then
        log_success "✓ $file"
    else
        log_error "✗ $file"
        ALL_PRESENT=false
    fi
done

echo ""
echo "======================================"
if [ "$ALL_PRESENT" = true ]; then
    log_success "🎉 CI/CD Pipeline setup complete!"
    echo ""
    echo "Next steps:"
    echo "1. 📝 Review SECRETS_CHECKLIST.md and configure GitHub secrets"
    echo "2. 🔧 Set up GitHub environments (staging, production)"
    echo "3. 📱 Configure iOS certificates with Fastlane Match"
    echo "4. 🧪 Test the pipeline with a sample PR"
    echo "5. 📖 Read CI_CD_GUIDE.md for detailed usage instructions"
    echo ""
    echo "🔗 Useful links:"
    echo "   - Secrets: https://github.com/$(git config --get remote.origin.url | sed 's/.*github.com[:/]\([^/]*\/[^/]*\).*/\1/' | sed 's/\.git$//')/settings/secrets/actions"
    echo "   - Actions: https://github.com/$(git config --get remote.origin.url | sed 's/.*github.com[:/]\([^/]*\/[^/]*\).*/\1/' | sed 's/\.git$//')/actions"
    echo "   - Environments: https://github.com/$(git config --get remote.origin.url | sed 's/.*github.com[:/]\([^/]*\/[^/]*\).*/\1/' | sed 's/\.git$//')/settings/environments"
else
    log_error "❌ CI/CD Pipeline setup incomplete. Please check missing files."
fi
echo "======================================"