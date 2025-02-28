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
- Try using Chrome or Firefox for best compatibility

### API Key Issues

If Claude responses are not working:
- Verify your Anthropic API key is correctly set in the `.env` file
- Check the console logs for any authentication errors
- Run `npm run test:setup` to verify your API key is properly configured

### Claude Model Version

If you're experiencing issues with the Claude API responses:
- Make sure you're using the correct model version
- Run `npm run fix:model` to automatically fix any model version issues

### Database Connection

By default, the application uses in-memory storage for development. If you want to use a database:
- Ensure your DATABASE_URL is correctly set in the `.env` file
- Run `npm run db:push` to set up the database schema

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details. 