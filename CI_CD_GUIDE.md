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
