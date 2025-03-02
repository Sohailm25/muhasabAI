# SahabAI Privacy-Focused Profile System

This repository contains a privacy-focused user profiling system for SahabAI, designed to balance personalization with user privacy. The system enables dynamic user profiles while preserving user privacy through client-side encryption and privacy controls.

## 🔐 Key Features

- **Privacy-first Design**: Client-side encryption keeps sensitive profile data private
- **Dynamic Profiling**: Learns from user interactions to improve personalization
- **Multi-device Sync**: Securely synchronize profiles across devices
- **User Control**: Granular privacy settings give users control over their data
- **Development Tools**: Debug utilities and API testing tools to aid development

## 🚀 Getting Started

### Prerequisites

- Node.js 14+
- npm/yarn
- PostgreSQL database (for server-side components)
- Modern browser with Web Crypto API support

### Installation

1. Clone the repository
2. Install dependencies for both client and server:

```bash
# Install client dependencies
cd client
npm install

# Install server dependencies
cd ../server
npm install
```

3. Configure environment variables (see `.env.example`)
4. Initialize the database:

```bash
cd server
npm run db:migrate
```

5. Start the development server:

```bash
# Start server
cd server
npm run dev

# In a separate terminal, start client
cd client
npm run dev
```

## 📖 Usage

### Integrating with your application

1. Wrap your application with the `ProfileIntegration` component:

```tsx
import { ProfileIntegration } from './components/ProfileIntegration';

function App() {
  return (
    <ProfileIntegration userId={currentUser.id}>
      <YourMainApp />
    </ProfileIntegration>
  );
}
```

2. Show the onboarding component for new users:

```tsx
import { ProfileOnboarding } from './components/ProfileOnboarding';
import { useProfile } from './hooks/useProfile';

function MainContent() {
  const { profile, isLoading } = useProfile();
  
  if (isLoading) return <LoadingSpinner />;
  
  // Show onboarding for new users
  if (!profile) {
    return <ProfileOnboarding />;
  }
  
  return <YourRegularContent />;
}
```

3. Use the profile hook to access profile data:

```tsx
import { useProfile } from './hooks/useProfile';

function PersonalizedContent() {
  const { profile, privateProfile, updateProfile } = useProfile();
  
  // Access profile data to personalize content
  const userLanguage = profile?.generalPreferences.languagePreferences || 'english';
  const topicsOfInterest = privateProfile?.topicsOfInterest || [];
  
  // ... your personalized rendering logic ...
}
```

4. Update profiles based on user interactions:

```tsx
// The ProfileLearner component automatically analyzes user interactions
import { ProfileLearner } from './components/ProfileLearner';

function Conversation() {
  const [reflections, setReflections] = useState([]);
  const [responses, setResponses] = useState([]);
  
  return (
    <>
      {/* Your conversation UI */}
      <ProfileLearner 
        userReflections={reflections} 
        aiResponses={responses} 
      />
    </>
  );
}
```

### Development and Debugging

For development purposes, you can use the testing and debugging utilities:

```tsx
import { createTestProfile, getProfileDebugInfo } from './lib/profileDebug';
import { runProfileApiTest } from './lib/profileApiTest';

// Create a test profile
await createTestProfile();

// Get debug information
const debugInfo = await getProfileDebugInfo();
console.log(debugInfo);

// Test the API endpoints
const testResults = await runProfileApiTest();
console.log(testResults);
```

## 🏗️ Architecture

The profile system consists of the following components:

1. **Client Components**:
   - `ProfileIntegration`: Main provider for profile context
   - `ProfileOnboarding`: User interface for profile setup
   - `ProfileLearner`: Analyzes interactions for profile updates
   - `PrivacySettings`: User interface for privacy controls
   - `KeyTransfer`: Facilitates transferring encryption keys

2. **Client Libraries**:
   - `useProfile` hook: Main interface for accessing profile data
   - `encryption.ts`: Manages client-side encryption/decryption
   - `profileSync.ts`: Handles sync between devices
   - `profileAnlaysis.ts`: Performs analysis on user interactions
   - `profileDebug.ts`: Development-only debugging utilities
   - `profileApiTest.ts`: Testing tools for the profile API

3. **Server Components**:
   - API routes in `server/routes/profile-routes.ts`
   - Database schema in `server/db.ts`

## 📚 Documentation

Detailed documentation is available in the `docs/` directory:

- [Privacy and Personalization Architecture](docs/privacy-personalization.md)

## 🔍 Testing

Run the tests:

```bash
# Client tests
cd client
npm test

# Server tests
cd server
npm test

# API tests (development only)
import { runProfileApiTest } from './lib/profileApiTest';
await runProfileApiTest();
```

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📬 Contact

For questions or support, please contact [support@sahabai.com](mailto:support@sahabai.com). 