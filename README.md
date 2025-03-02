# Ramadan Reflections

A spiritual reflection application designed to help Muslims document and deepen their Ramadan journey through AI-powered conversations and action items.

## Features

- **Voice or Text Reflections**: Share your Ramadan experiences through voice recording or text input
- **AI-Powered Follow-up Questions**: Receive thoughtful, contextual questions that help deepen your reflection
- **Conversation Flow**: Continue the conversation by responding to follow-up questions
- **Action Items**: Generate practical, personalized action items based on your reflections
- **Persistent Sessions**: Your conversations are saved for you to continue your reflective journey

## Prerequisites

Before you begin, ensure you have the following installed:
- [Node.js](https://nodejs.org/) (v18 or higher **REQUIRED**)
- [npm](https://www.npmjs.com/) (comes with Node.js)
- [FFmpeg](https://ffmpeg.org/) (required for audio transcription)
- [OpenAI Whisper](https://github.com/openai/whisper) (required for audio transcription)
- A code editor (e.g., [VS Code](https://code.visualstudio.com/))
- [Git](https://git-scm.com/)

## Environment Setup

1. **Anthropic API Key**: You'll need an API key from [Anthropic](https://www.anthropic.com/) to use Claude.
2. **Database**: The application uses Neon Database (serverless Postgres). For local testing, you can use the in-memory storage option.

## Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd muhasabAI
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory with the following variables:
   ```
   ANTHROPIC_API_KEY=your_anthropic_api_key
   DATABASE_URL=your_database_url_if_using_database
   ```

### Easy Setup with Helper Scripts

We've included helper scripts to make setup easier:

1. **Automated Setup**:
   ```bash
   npm run setup
   ```
   This interactive script will guide you through setting up your environment.

2. **Test Your Setup**:
   ```bash
   npm run test:setup
   ```
   This script verifies that your environment is correctly configured.

3. **Fix Claude Model Version**:
   ```bash
   npm run fix:model
   ```
   This script ensures the correct Claude model version is being used in the code.

## Running Locally

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Open your browser and navigate to [http://localhost:5000](http://localhost:5000)

## Testing Voice Reflections

For voice reflections, the application uses node-whisper for transcription. To ensure this works correctly:

1. Make sure your microphone is properly connected and permissions are granted in your browser
2. Speak clearly when recording
3. The voice data is processed locally, transcribed, and then sent to Claude for analysis

## Project Structure

```
muhasabAI/
├── client/                # Frontend React application
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── hooks/         # Custom React hooks
│   │   ├── lib/           # Utility functions
│   │   └── pages/         # Page components
├── server/                # Backend Express server
│   ├── lib/               # Server-side utilities
│   │   ├── anthropic.ts   # Claude API integration
│   │   └── transcription.ts # Audio transcription
│   ├── db.ts              # Database connection
│   ├── index.ts           # Server entry point
│   ├── routes.ts          # API routes
│   └── storage.ts         # Data storage implementations
├── shared/                # Shared code between client and server
│   └── schema.ts          # Database schema and types
└── package.json           # Project dependencies and scripts
```

## Available Scripts

- `npm run dev`: Start the development server
- `npm run build`: Build the application for production
- `npm run start`: Start the production server
- `npm run check`: Run TypeScript type checking
- `npm run db:push`: Push schema changes to the database
- `npm run setup`: Interactive setup assistant
- `npm run test:setup`: Verify your environment configuration
- `npm run fix:model`: Fix the Claude model version in the code

## Troubleshooting

### TypeScript Errors

If you encounter TypeScript errors about missing types:
- Make sure you're using Node.js v18 or higher
- The project includes a `global.d.ts` file with type declarations for Node.js and Anthropic SDK
- If errors persist, try running `npm install` again to ensure all dependencies are installed

### Audio Recording Issues

If you encounter issues with audio recording:
- Ensure your browser has permission to access your microphone
- Check that your microphone is working correctly
- **Make sure FFmpeg is installed on your system** - this is required for transcription to work
  - If using macOS, you can install FFmpeg with `brew install ffmpeg`
  - If using Linux, use your package manager (e.g., `apt install ffmpeg` on Ubuntu)
  - If using Windows, you can install FFmpeg using [Chocolatey](https://chocolatey.org/) with `choco install ffmpeg`

- **Make sure OpenAI Whisper CLI is installed on your system** - this is required by the node-whisper package
  - Install using pip: `pip install -U openai-whisper`
  - For more detailed installation instructions, refer to the [OpenAI Whisper repository](https://github.com/openai/whisper)
  - Ensure that Python (version 3.8-3.11) and PyTorch are installed
  - You may need to install Rust if tiktoken does not provide a pre-built wheel for your platform

- Try using Chrome or Firefox for best compatibility

### API Key Issues

If Claude responses are not working:
- Verify your Anthropic API key is correctly set in the `.env` file
- Check the console logs for any authentication errors
- Run `npm run test:setup` to verify your API key is properly configured
- If you see "invalid x-api-key" errors, your key may be expired or incorrect
- Visit https://console.anthropic.com/ to generate a new API key if needed
- Note that the application will still function with fallback questions and action items even if the API key is invalid

### Claude Model Version

If you're experiencing issues with the Claude API responses:
- Make sure you're using the correct model version
- Run `npm run fix:model` to automatically fix any model version issues

### Database Connection

By default, the application uses in-memory storage for development. If you want to use a database:
- Ensure your DATABASE_URL is correctly set in the `.env` file
- Run `npm run db:push` to set up the database schema

## Database Configuration

The application supports two storage modes:

1. **In-Memory Storage (Default for local testing)**
   - No database configuration required
   - Data persists only during the server's runtime
   - Perfect for local testing and development

2. **Database Storage (Required for production)**
   - Requires a PostgreSQL database connection string
   - Recommended for production or when data persistence is needed
   - Uses Neon Database for serverless PostgreSQL

### How to Configure Storage

The application automatically detects which storage mode to use based on the presence of the `DATABASE_URL` environment variable:

- **For local testing without a database**: Simply leave `DATABASE_URL` undefined in your `.env` file, and the application will use in-memory storage.
- **For testing with a database**: Set the `DATABASE_URL` in your `.env` file to a valid PostgreSQL connection string.

Example in your `.env` file:
```
# For in-memory storage (local testing)
# DATABASE_URL=

# For database storage
# DATABASE_URL=postgres://username:password@host:port/database
```

The application will log which storage mode it's using when it starts up.

## Deployment

### Deploying to Railway

When deploying to Railway, you'll need to ensure all dependencies are properly set up:

1. **Environment Variables**: Set the following in Railway's environment variables:
   - `ANTHROPIC_API_KEY`: Your API key from Anthropic
   - `DATABASE_URL`: Your database connection string (if using a database)
   - `NODE_ENV`: Set to `production`

2. **FFmpeg Dependency**: Railway's Nixpacks builder (specified in `railway.toml`) will automatically handle installing FFmpeg as a dependency.

3. **Database Setup**: For production deployments, it's recommended to use a PostgreSQL database. You can:
   - Add a PostgreSQL service in your Railway project
   - Connect it to your app by setting the `DATABASE_URL` environment variable

4. **Deployment Steps**:
   - Connect your repository to Railway
   - Configure the environment variables
   - Deploy the application

The application is already configured with a `railway.toml` file that specifies:
- Node.js version 20
- Build and start commands
- Health check configuration
- Restart policies

This ensures a smooth deployment process on Railway's platform.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Voice Reflections - Whisper Setup

For voice reflections, this application uses OpenAI's Whisper for transcription. We've created a setup that helps users manage the dependencies:

1. **Install Virtual Environment and Whisper**:
   ```bash
   python3 -m venv whisper-venv
   source whisper-venv/bin/activate
   pip install -U openai-whisper
   ```

2. **Using the Whisper Wrapper Script**:
   We've included a wrapper script to simplify using Whisper. After installing Whisper, you can use it:
   ```bash
   ./whisper-wrapper.sh <audio-file> --model base --language en
   ```

The wrapper script automatically activates the correct Python environment and passes all arguments to Whisper.

# Security Personalization System

## Overview

The Security Personalization System is a privacy-focused implementation designed to provide personalized experiences for users while ensuring their sensitive data remains secure and private. This implementation follows a "privacy by design" approach, allowing users to control their data sharing preferences and encrypting sensitive information end-to-end.

## Features

- **End-to-End Encryption**: Private user data is encrypted locally using the Web Crypto API
- **Flexible Privacy Settings**: Users control which data is stored locally vs. synced to the server
- **AI-Ready Profiles**: Generate AI context from profiles while respecting privacy settings
- **Secure Key Management**: Keys are generated, stored, and backed up securely
- **Versioned Profiles**: Support for conflict resolution and synchronization

## Architecture

### Core Components

1. **Profile System**
   - `PublicProfile`: Basic user preferences and settings, stored unencrypted
   - `PrivateProfile`: Sensitive personal data, stored with encryption
   - `EncryptedProfileData`: Container for encrypted private profile data

2. **Security Layer**
   - Encryption module: AES-GCM cryptography for private data
   - Key management: Secure generation, storage, and backup of encryption keys

3. **API Layer**
   - Profile API client: Interface for CRUD operations on profiles
   - Security-aware routing: Server routes with authentication and authorization

4. **UI Components**
   - Privacy Settings: User interface for controlling privacy preferences
   - Profile Management: Components for viewing and editing profile data

5. **Data Flow**
   - Local storage → Encryption → API → Server Database
   - Server Database → API → Decryption → Local rendering

## Implementation

### Client-Side

The implementation uses React hooks for state management and API interactions:

- `useProfile`: Custom hook for loading, updating, and managing user profiles
- `reflectionAnalysis`: Module for analyzing user reflections with privacy controls
- `profileSync`: Module for secure profile synchronization across devices

### Server-Side

The server provides secure routes for profile management:

- Authentication middleware ensures only authorized users access profiles
- Encrypted data is stored without server-side decryption capabilities
- Version tracking prevents data loss through conflict resolution

### Security Features

- **Encryption**: AES-GCM 256-bit encryption for all private data
- **Key Management**: Keys never leave the client device unencrypted
- **Backup & Recovery**: Secure key backup with password protection
- **Privacy Controls**: Granular user controls for data sharing

## Getting Started

### Prerequisites

- Node.js 14+ and npm/yarn
- Modern browser with Web Crypto API support

### Installation

```bash
npm install
npm run build
npm start
```

### Usage Example

```typescript
// Using the profile hook in a component
import { useProfile } from './hooks/useProfile';

const ProfileComponent = ({ userId }) => {
  const { 
    publicProfile, 
    privateProfile, 
    updatePublicProfile, 
    updatePrivateProfile,
    isLoading,
    error
  } = useProfile(userId);

  // Example of updating profiles
  const handlePreferenceChange = (newPreferences) => {
    updatePublicProfile({ generalPreferences: newPreferences });
  };

  // Render UI based on profile data
  return (
    <div>
      {isLoading ? (
        <Loading />
      ) : error ? (
        <ErrorDisplay message={error} />
      ) : (
        <>
          <PublicProfileDisplay profile={publicProfile} onChange={handlePreferenceChange} />
          {privateProfile && (
            <PrivateProfileDisplay profile={privateProfile} />
          )}
          <PrivacySettings profile={publicProfile} onChange={handlePreferenceChange} />
        </>
      )}
    </div>
  );
};
```

## Testing

The implementation includes comprehensive tests:

```bash
# Run all tests
npm test

# Run specific test suites
npm test -- --testPathPattern=encryption
npm test -- --testPathPattern=profileApi
```

## Security Considerations

- Encryption keys are generated and stored in browser local storage
- For multi-device sync, users must securely transfer their encryption key
- All private data is encrypted before transmission over the network
- Profile data is versioned to prevent conflicts and unauthorized changes

## Privacy Policy

The system is designed with these privacy principles:

1. **Data Minimization**: Only collect what's necessary
2. **User Control**: Give users control over their data
3. **Transparency**: Clear visibility into what data is stored and how
4. **Security**: Protect data with strong encryption
5. **Local-First**: Prefer local processing over server transmission

## License

MIT License - See [LICENSE](LICENSE) file for details. 