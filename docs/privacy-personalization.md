# SahabAI Privacy and Personalization System

This document outlines the SahabAI privacy-focused personalization system, which provides personalized experiences for users while preserving their privacy and data sovereignty.

## Architecture Overview

The system follows a privacy-by-design approach with these core components:

1. **User Profiles**: Two-part structure with public and private components
2. **Encryption**: Client-side encryption of sensitive profile data
3. **Learning System**: Non-invasive personalization based on user interactions
4. **Synchronization**: Encrypted sync across devices when enabled
5. **Privacy Controls**: User-configurable privacy settings

### Technical Components

```
+------------------+     +-------------------+     +----------------+
|                  |     |                   |     |                |
|  Public Profile  +---->+ Private Profile   +---->+ Personalized   |
|  (Server/Client) |     | (Client-only)     |     | Experience     |
|                  |     |                   |     |                |
+------------------+     +--^-------------+--+     +----------------+
                           |             |
                           |             |
                +----------+------+  +---+--------------+
                |                 |  |                  |
                | Encryption Keys |  | Profile Learner  |
                |                 |  |                  |
                +-----------------+  +------------------+
```

## Core Components

### 1. Profile System

#### Public Profile (`PublicProfile` interface)
- Stored server-side if sync is enabled
- Contains non-sensitive preferences:
  - General input/output preferences
  - Language settings
  - Privacy configuration
  - Usage statistics (non-identifying)

#### Private Profile (`PrivateProfile` interface)
- Always encrypted client-side
- Contains sensitive personalization data:
  - Spiritual journey context
  - Knowledge level and interests
  - Observed patterns and preferences
  - Recent interactions and topics

### 2. Client-Side Encryption

The encryption system uses AES-GCM for all sensitive data:

- **Key Management**: 
  - Keys never leave the user's device unencrypted
  - Backup/restore functionality for device transitions
  - Key verification during sync operations

- **Components**:
  - `encryption.ts`: Core encryption utilities
  - `KeyTransfer` component: UI for key management

### 3. Profile Learning System

The system gradually learns user preferences without invasive data collection:

- **Learning Flow**:
  1. User provides reflections
  2. `ProfileLearner` analyzes patterns
  3. Profile is incrementally updated
  4. Personalization applied to future interactions

- **Components**:
  - `ProfileLearner`: Analyzes interactions and updates profile
  - `reflectionAnalysis.ts`: Utilities for text analysis
  - `useProfile` hook: Profile data management

### 4. Profile Synchronization

For multi-device use, the system provides secure synchronization:

- **Sync Process**:
  1. Public profile synced normally
  2. Private profile encrypted before transmission
  3. Received encrypted data decrypted with local key
  4. Profiles merged with conflict resolution

- **Components**:
  - `profileSync.ts`: Sync management
  - `PrivacySettings`: User controls for enabling/disabling sync

### 5. Privacy Controls

Users maintain full control through granular privacy settings:

- **Settings Include**:
  - Local-only storage option
  - Personalization toggles
  - Data export and deletion
  - Sync configuration

- **Components**:
  - `PrivacySettings`: UI for privacy configuration
  - Security-focused API routes

## Implementation Guidelines

### Integrating with the Application

1. Wrap your application with `ProfileIntegration`:

```tsx
// App.tsx
import { ProfileIntegration } from "./components/ProfileIntegration";

function App() {
  // Get user ID from auth system
  const userId = useAuth().userId;
  
  return (
    <ProfileIntegration userId={userId}>
      <YourApp />
    </ProfileIntegration>
  );
}
```

2. Show onboarding for new users:

```tsx
function MainApp() {
  const { publicProfile } = useProfile();
  const [showOnboarding, setShowOnboarding] = useState(false);
  
  useEffect(() => {
    // Show onboarding if no profile exists
    if (!publicProfile) {
      setShowOnboarding(true);
    }
  }, [publicProfile]);
  
  if (showOnboarding) {
    return (
      <ProfileOnboarding
        onComplete={() => setShowOnboarding(false)}
      />
    );
  }
  
  return <YourMainContent />;
}
```

3. Use the profile for personalization:

```tsx
function PersonalizedComponent() {
  const { privateProfile, getProfileForAI } = useProfile();
  
  // Before sending to AI
  useEffect(() => {
    async function getPersonalizedResponse() {
      // Only get necessary profile data for AI
      const profileContext = await getProfileForAI();
      
      // Send to API with profile context
      const response = await getPersonalizedResponse(
        userInput, 
        profileContext,
        conversationHistory
      );
      
      // Use response...
    }
  }, []);
}
```

4. Update the profile based on user interactions:

```tsx
function ReflectionView({ userReflection, aiResponse }) {
  // This silently updates the profile based on the interaction
  return (
    <>
      <YourReflectionUI />
      <ProfileLearner 
        userReflection={userReflection}
        aiResponse={aiResponse}
      />
    </>
  );
}
```

### Database Considerations

1. The `user_profiles` table stores public preferences
2. The `encrypted_profiles` table stores encrypted private data
3. Indexes improve query performance for user-based lookups

### API Routes

The system provides these core API endpoints:

- `POST /api/profile`: Create new profile
- `GET /api/profile/:userId?`: Get profile (self or specific user)
- `PUT /api/profile`: Update profile
- `DELETE /api/profile`: Delete profile
- `GET /api/profile/:userId/encrypted`: Get encrypted private data
- `PUT /api/profile/:userId/encrypted`: Update encrypted private data

## Security Considerations

1. **Encryption**: All sensitive data is encrypted client-side
2. **Key Management**: Keys never transmitted unencrypted
3. **No Analytics**: No tracking of user data for marketing purposes
4. **Minimal Data**: Only necessary data included in AI context
5. **Full Deletion**: Users can permanently delete all profile data

## Deployment Notes

When deploying:

1. Ensure database migrations include the profile tables
2. Set appropriate CORS policies for API access
3. Consider rate limiting on profile endpoints
4. Monitor database performance with increased user load

## Future Enhancements

Potential improvements to consider:

1. Enhanced pattern recognition in ProfileLearner
2. Additional privacy controls for specific data types
3. Improved sync conflict resolution
4. Integration with federated authentication services

## Questions or Concerns?

For technical questions about implementation, please contact the development team.
For privacy policy inquiries, please contact privacy@sahabai.com.

*SahabAI - Supporting your spiritual journey with privacy and care.* 


Implementation Gaps and Next Steps
Phase 1: Complete Core Infrastructure (2 weeks)
1. Profile Types & Interfaces (1-2 days)
[ ] Create a dedicated types.ts file for all profile-related types
[ ] Ensure proper TypeScript typing for all components and interfaces
[ ] Document all interfaces and types with JSDoc comments
2. Complete Server-Side Implementation (3-4 days)
[ ] Implement proper authentication for all profile routes
[ ] Ensure database schema matches profile structure requirements
[ ] Implement proper error handling for all API routes
[ ] Add rate limiting to sensitive endpoints
3. Enhance Security (2-3 days)
[ ] Implement proper key derivation function (PBKDF2) for password-based keys
[ ] Add integrity verification for encrypted data
[ ] Implement secure key rotation mechanism
[ ] Add secure deletion functionality for private data
4. Add Missing Functionality (2-3 days)
[ ] Implement conflict resolution for multi-device sync
[ ] Complete GDPR-compliant data export functionality
[ ] Implement comprehensive data deletion capability
[ ] Add recovery mechanisms for lost encryption keys
Phase 2: Testing and Validation (1-2 weeks)
1. Unit Tests (3-4 days)
[ ] Write tests for encryption module with edge cases
[ ] Write tests for profile sync functionality
[ ] Write tests for the profile hook with various scenarios
[ ] Test privacy settings with different configurations
2. Integration Tests (2-3 days)
[ ] Test full profile creation and update flow
[ ] Test sync between multiple mock devices
[ ] Test encryption/decryption in various scenarios
[ ] Test data export/import functionality
3. Security Testing (2-3 days)
[ ] Conduct penetration testing on profile API
[ ] Test for potential data leakage
[ ] Test encryption implementation for vulnerabilities
[ ] Verify proper key management
Phase 3: Documentation and User Experience (1 week)
1. Documentation (2-3 days)
[ ] Create developer documentation for the profile system
[ ] Update architecture diagrams to match implementation
[ ] Create API documentation for the profile endpoints
[ ] Create user-facing documentation/tooltips
2. UX Improvements (2-3 days)
[ ] Add progressive onboarding with tooltips
[ ] Improve error messages for common issues
[ ] Add visual indicators for encryption status
[ ] Create a profile management dashboard
Phase 4: Performance and Optimization (1 week)
1. Performance Testing (2-3 days)
[ ] Test with large profile datasets
[ ] Optimize sync for speed and reliability
[ ] Reduce encryption overhead where possible
[ ] Improve loading performance for profile data
2. Error Handling and Recovery (2-3 days)
[ ] Implement robust error recovery
[ ] Add detailed error logging
[ ] Implement automatic retry mechanisms
[ ] Create user-friendly error flows
Immediate Action Items
Create Type Definitions
[ ] Create a comprehensive PrivateProfile interface
[ ] Ensure all components use consistent typing
Complete Key Management
[ ] Add better error handling for the KeyTransfer component
[ ] Add password strength requirements
[ ] Implement secure key storage with proper derivation
Add Testing Infrastructure
[ ] Set up test fixtures for profile data
[ ] Create mocks for API endpoints
[ ] Implement integration tests for profile creation flow
Documentation Updates
[ ] Update existing documentation to match implementation
[ ] Create technical documentation for developers
[ ] Create user documentation for privacy features