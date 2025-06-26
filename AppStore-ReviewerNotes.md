# App Store Connect - Notes for Reviewer

## OnDeviceAI - Intelligent Personal Assistant

### App Overview
OnDeviceAI is a privacy-first intelligent personal assistant that processes all user queries locally using on-device AI models. The app provides conversational AI capabilities, semantic memory, and intelligent scheduling assistance while maintaining complete user privacy.

### Privacy & Data Handling

**IMPORTANT: This on-device AI assistant processes all user queries locally via Core ML and on-device language models. No data is sent off-device except when users explicitly choose to use cloud AI services.**

#### Key Privacy Features:
- **100% Local Processing**: All AI reasoning, memory storage, and conversation processing occurs entirely on the user's device
- **No Data Collection**: The app does not collect, store, or transmit any personal information, conversations, or usage analytics
- **No Tracking**: Zero user tracking, advertising, or behavioral analytics
- **Optional Cloud Services**: Users can optionally enable cloud AI services (OpenAI, Anthropic) for enhanced capabilities, with explicit consent

#### Permission Usage:
- **Calendar Access**: Used exclusively for on-device scheduling tasks initiated by user requests. Calendar data never leaves the device.
- **Contacts Access**: Used exclusively for on-device contact lookup when scheduling meetings. Contact information is processed locally only.

### Technical Implementation

#### On-Device AI Processing:
1. **Local Language Models**: Uses device-optimized AI models for conversation and reasoning
2. **SQLite Vector Database**: Semantic memory stored locally using vector embeddings
3. **Core ML Integration**: Leverages Apple's Core ML framework for optimal performance
4. **No Network Dependencies**: Core functionality works completely offline

#### Optional Cloud Services:
- Users can optionally connect to external AI services (OpenAI, Anthropic, Grok)
- Explicit user consent required for each service
- Clear indication when cloud services are being used
- Users can disable cloud services at any time

### Feature Testing Instructions

#### Core Features (No Network Required):
1. **Local Memory**: Add and search memories - all data stays on device
2. **Calendar Integration**: Create events through conversation - uses native iOS Calendar API
3. **Contact Lookup**: Find contacts for meetings - uses native iOS Contacts API
4. **Performance Monitoring**: Built-in performance metrics for transparency

#### Optional Cloud Features (Requires API Keys):
1. Navigate to RAG or Agent tabs
2. Enable cloud AI services in settings (if implemented)
3. Test enhanced AI responses using external APIs
4. Verify user consent flows and data transparency

### Privacy Compliance

#### iOS Privacy Requirements:
- ✅ Privacy Manifest (PrivacyInfo.xcprivacy) included
- ✅ All required reason codes provided (CA92.1, C617.1, E174.1)
- ✅ Usage descriptions clearly explain on-device processing
- ✅ No tracking or data collection configured

#### App Store Privacy Nutrition Label:
- **Data Collected**: None
- **Data Linked to User**: None
- **Data Used for Tracking**: None
- **Third-Party Analytics**: None

### Security Measures

#### Data Protection:
- All local data encrypted using iOS standard encryption
- No plaintext storage of sensitive information
- Secure memory management for AI processing
- No network transmission of personal data (core features)

#### API Security (Optional Features):
- Secure HTTPS connections to external AI services
- No API key storage in plain text
- User-controlled service connections
- Transparent data usage notifications

### Testing Scenarios

#### Scenario 1: Completely Offline Usage
1. Disable device internet connection
2. Test core memory and conversation features
3. Verify calendar and contact integration
4. Confirm no network error messages

#### Scenario 2: Privacy-Conscious User
1. Deny calendar and contacts permissions initially
2. Test graceful permission handling
3. Grant permissions selectively
4. Verify feature availability updates accordingly

#### Scenario 3: Advanced AI Features (Optional)
1. Enable cloud AI services (if API keys provided)
2. Test enhanced conversation capabilities
3. Verify data transparency and user control
4. Test disabling cloud services

### Support Information

#### Contact Information:
- **Developer**: OnDeviceAI Team
- **Support Email**: support@ondeviceai.app
- **Privacy Policy**: https://ondeviceai.app/privacy
- **Terms of Service**: https://ondeviceai.app/terms

#### Technical Support:
- Comprehensive in-app help system
- Privacy-focused FAQ
- Local troubleshooting guides
- No user data required for support

### Regulatory Compliance

#### GDPR Compliance:
- No personal data processing (by design)
- No data controllers or processors involved
- Complete user control over local data
- Right to deletion inherently supported

#### CCPA Compliance:
- No personal information sale or sharing
- No behavioral advertising or tracking
- Complete transparency in data usage
- User control over all data processing

### Additional Notes for Review

1. **Performance**: The app includes comprehensive performance monitoring for transparency, not data collection
2. **Battery Usage**: Optimized for minimal battery impact with efficient on-device processing
3. **Storage**: Local storage requirements clearly communicated to users
4. **Accessibility**: Full VoiceOver and accessibility support implemented
5. **Localization**: Prepared for multiple language support while maintaining privacy

This app represents the future of privacy-conscious AI assistance, demonstrating that powerful AI features can be delivered without compromising user privacy or requiring data collection.

---
**Reviewer Access**: Please contact us if you need specific testing credentials or have questions about any privacy or technical aspects of the implementation.