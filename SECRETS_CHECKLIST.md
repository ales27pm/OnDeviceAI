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
