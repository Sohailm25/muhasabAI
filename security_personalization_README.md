# Security and Personalization System

## Overview

The Security and Personalization System implements a privacy-focused approach to user profiles in MuhasabAI. The system allows users to manage their preferences while maintaining control over their personal data through end-to-end encryption, local storage options, and granular privacy settings.

## Key Features

- **End-to-End Encryption**: Private profile data is encrypted client-side before transmission
- **Local-Only Storage Option**: Users can opt to keep sensitive data on their device only
- **Granular Privacy Controls**: Fine-grained control over what data is shared with AI
- **Cross-Device Sync**: Secure synchronization of profile data across multiple devices
- **Implicit Learning**: Background analysis of user interactions to improve personalization without explicit data sharing
- **Secure Key Management**: Tools for backing up and transferring encryption keys

## Architecture

### Client Components

1. **Types and Interfaces**
   - `PublicProfile`: General preferences, privacy settings visible to the server
   - `PrivateProfile`: Spiritual journey details, sensitive data encrypted locally
   - `EncryptedProfileData`: Format for storing encrypted data

2. **Core Modules**
   - `encryption.ts`: Handles key generation, encryption, and decryption using Web Crypto API
   - `api.ts`: Client for communicating with server endpoints
   - `reflectionAnalysis.ts`: Analyzes reflections for implicit personalization 
   - `profileSync.ts`: Manages secure data synchronization across devices

3. **React Components**
   - `ProfileIntegration`: Main component integrating profiles with the application
   - `ProfileOnboarding`: Collects initial profile information
   - `PrivacySettings`: UI for adjusting privacy preferences
   - `KeyTransfer`: Facilitates secure key backup and transfer

4. **Hooks**
   - `useProfile`: Core hook managing profile state and operations

### Server Components

1. **API Routes**
   - `profile-routes.ts`: Endpoints for managing profiles

2. **Database**
   - Tables for public profiles and encrypted data

## Security Implementation Details

### Data Segregation

- **Public Data**: Basic preferences stored in plaintext
- **Private Data**: Sensitive information encrypted client-side 

### Encryption 

- **Algorithm**: AES-GCM with 256-bit keys
- **Key Storage**: Local storage with export capabilities 
- **Implementation**: Web Crypto API for cryptographic operations

### Privacy Settings

- `localStorageOnly`: Prevents any profile data from being sent to server
- `shareWithAI`: Controls what data is included in AI context
- Field-level controls for granular sharing preferences

## User Flow

1. **Onboarding**
   - User creates a profile with basic preferences
   - Encryption key is generated and stored locally
   - Privacy settings are established

2. **Regular Usage**
   - Profile data is loaded with public portions from server
   - Private data is decrypted locally when needed
   - Personalization is applied based on profile and analysis

3. **Cross-Device Setup**
   - User exports encryption key from first device
   - Key is imported on second device
   - Profile data is synchronized across devices

## Personalization Framework

### Explicit Personalization

- Direct settings in user profile
- Preferences explicitly set by user

### Implicit Personalization

- `ProfileLearner` component tracks user interactions
- `reflectionAnalysis.ts` extracts insights from user's reflections
- Insights update the `dynamicAttributes` section of private profile

## Testing

The system includes comprehensive tests:

- Unit tests for core functionality
- Integration tests for components
- Security tests for encryption
- API tests for server endpoints

## Privacy Considerations

- All encryption/decryption happens client-side
- Server never receives unencrypted private data
- Private data can be kept entirely local if desired
- Clear data management options for users

## Implementation Guidelines

When extending the system:

1. Maintain the separation of public/private data
2. Ensure all private data is encrypted before transmission
3. Respect user privacy settings in all components
4. Use the `useProfile` hook for accessing profile data
5. Add appropriate tests for new functionality

## Future Enhancements

- Multi-factor authentication for profile access
- Improved key recovery options
- Enhanced personalization algorithms
- Conflict resolution for multi-device sync
- Audit logging for profile changes 