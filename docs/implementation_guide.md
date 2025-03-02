# Privacy-Focused Personalization Implementation Guide

## Overview

This guide provides instructions for implementing and extending the privacy-focused personalization system in MuhasabAI. Our architecture enforces strict data protection through client-side encryption, tiered data storage, and explicit user consent mechanisms.

## Key Principles

When working with the personalization system, always adhere to these principles:

1. **Privacy by Design**: Consider privacy implications before adding any feature
2. **Minimize Data Collection**: Only collect what's necessary
3. **Data Segregation**: Keep sensitive and non-sensitive data separate
4. **Local-First**: Prioritize local processing when possible
5. **Explicit Consent**: Always get user permission for data usage
6. **Encrypt Sensitive Data**: Never store or transmit sensitive data in plaintext

## Architecture Overview

### Client Components

```
client/
├── src/
│   ├── lib/
│   │   ├── types.ts               # Data type definitions
│   │   ├── encryption.ts          # Encryption utilities
│   │   ├── api.ts                 # API client for server communication
│   │   ├── profileSync.ts         # Cross-device synchronization
│   │   └── reflectionAnalysis.ts  # Learning from user interactions
│   ├── hooks/
│   │   └── useProfile.ts          # Profile management hook
│   └── components/
│       ├── ProfileIntegration.tsx # Main integration component
│       ├── ProfileOnboarding.tsx  # Initial profile setup
│       ├── PrivacySettings.tsx    # User privacy controls
│       ├── ProfileLearner.tsx     # Implicit personalization
│       └── KeyTransfer.tsx        # Key backup and recovery
```

### Server Components

```
server/
├── routes/
│   └── profile-routes.ts         # API endpoints
├── db/
│   ├── index.ts                  # Database adapter
│   ├── operations.ts             # Core database operations
│   ├── postgres.ts               # PostgreSQL implementation
│   └── memory-storage.ts         # Fallback in-memory storage
└── db.ts                         # Database connection and schema
```

## Data Flow

1. **Profile Creation**:
   - Public profile created and stored in both local storage and server
   - Encryption key generated and stored only in local storage
   - Private profile data encrypted locally before transmission

2. **Data Synchronization**:
   - Public profile synced directly
   - Private profile encrypted before sync
   - Key transfer handled by user, not automatically

3. **Personalization Process**:
   - Profile loaded from storage
   - Private data decrypted locally
   - AI context includes only authorized data
   - Learning from interactions happens client-side

## Implementation Guidelines

### Adding New Profile Fields

1. Update the appropriate interface in `client/src/lib/types.ts`:
   - `PublicProfile`: For non-sensitive, unencrypted data
   - `PrivateProfile`: For sensitive, encrypted data

2. Update the profile management in `useProfile.ts` hook

3. Add UI controls in appropriate components

4. Document the purpose and privacy implications

### Working with Encrypted Data

1. Always use the encryption utilities in `encryption.ts`

2. Follow this pattern for operations on encrypted data:
   ```typescript
   // To write encrypted data
   const key = await getEncryptionKey();
   const iv = crypto.getRandomValues(new Uint8Array(12));
   const encryptedData = await encryptData(JSON.stringify(privateProfile), key, iv);
   await api.updateEncryptedProfileData(userId, { data: encryptedData, iv: Array.from(iv) });

   // To read encrypted data
   const key = await getEncryptionKey();
   const encryptedData = await api.getEncryptedProfileData(userId);
   const decryptedData = await decryptData(encryptedData.data, key, new Uint8Array(encryptedData.iv));
   const privateProfile = JSON.parse(decryptedData);
   ```

### Adding New Personalization Features

1. Determine the privacy implications first
2. Decide which profile section to use (public vs. private)
3. Implement client-side learning in `ProfileLearner` component
4. Update the AI context creation to include new attributes as needed
5. Add appropriate privacy controls in `PrivacySettings`

### User Consent and Control

1. All personalization features must have:
   - Clear explanation of purpose
   - User toggle to enable/disable
   - Visibility into what data is being used

2. Implement in `PrivacySettings` component

### Testing Privacy Features

1. Use the `tests/security` directory for security-related tests
2. Verify encrypted data never appears in:
   - Server logs
   - Network requests (except as encrypted)
   - Analytics systems

## Security Considerations

### Key Management

The encryption key is critical - if lost, user data cannot be recovered:

1. Provide clear backup instructions for users
2. Implement the key backup feature securely
3. Test key recovery extensively

### Data Deletion

When a user deletes their profile:

1. Remove public profile from server database
2. Remove encrypted data from server database
3. Clear local storage
4. Delete the encryption key

### Authentication

Currently, the system uses basic authentication. Future work should:

1. Implement proper auth with JWT or similar
2. Add user ID validation in API routes
3. Consider multi-factor authentication for key recovery

## Common Patterns

### Profile Update Pattern

```typescript
const { updateProfile } = useProfile();

// Update both public and private data
await updateProfile(
  { 
    // Public updates (unencrypted)
    generalPreferences: { 
      inputMethod: 'voice' 
    } 
  },
  { 
    // Private updates (encrypted)
    primaryGoals: ['improve_knowledge', 'daily_practice']
  }
);
```

### Privacy Setting Check Pattern

```typescript
const { publicProfile } = useProfile();

// Check if personalization is allowed before using profile data
if (publicProfile?.privacySettings.allowPersonalization) {
  // Use profile data for personalization
} else {
  // Use default non-personalized approach
}
```

## Troubleshooting

### Debugging Encryption Issues

1. Check browser console for encryption errors
2. Verify localStorage has the encryption key
3. Ensure IV (initialization vector) is correctly passed

### Profile Sync Issues

1. Verify the user has enabled sync in privacy settings
2. Check the encryption key is properly imported on the new device
3. Ensure both devices have network connectivity

## Best Practices

1. **Never** bypass the encryption system for sensitive data
2. **Always** use the `useProfile` hook for accessing profile data
3. **Never** store sensitive profile fields in public profile
4. **Always** provide user controls for new personalization features
5. **Never** log decrypted private profile data
6. **Always** handle encryption errors gracefully with user-friendly messages

## Extending the System

When extending the system:

1. Follow the existing architecture patterns
2. Add appropriate tests for new features
3. Update documentation for any changes
4. Consider backward compatibility with existing profiles
5. Add appropriate error handling

## Further Resources

- [Web Crypto API Documentation](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API)
- [Design Document: Privacy-Preserving Architecture](../security_personalization_README.md)
- [API Documentation](./api_docs.md) 