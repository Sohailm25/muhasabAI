# MuhasabAI iOS Development Guide

This guide provides step-by-step instructions for setting up your development environment, building, testing, and deploying the MuhasabAI iOS application without using Xcode.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Project Setup](#project-setup)
4. [Development Workflow](#development-workflow)
5. [Testing](#testing)
6. [Building for Distribution](#building-for-distribution)
7. [Deployment](#deployment)
8. [Troubleshooting](#troubleshooting)

## Prerequisites

Before starting development, ensure you have:

- **Node.js**: v18.x or higher (v18.19.0 recommended)
- **npm**: v10.x or higher (v10.2.3 recommended)
- **Git**: Latest version
- **Apple Developer Account**: Required for building and distributing iOS apps
- **iOS Device**: For testing (optional but recommended)

## Environment Setup

### 1. Install Development Tools

First, install the required tools:

```bash
# Install Node.js using a version manager (recommended)
# Using nvm:
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.3/install.sh | bash
nvm install 18.19.0
nvm use 18.19.0

# OR using Volta (built-in to the project)
curl https://get.volta.sh | bash
# Volta will automatically use the correct Node version when you're in the project directory

# Install Expo CLI globally
npm install -g expo-cli

# Install EAS CLI for building and deploying
npm install -g eas-cli
```

### 2. Configure Expo Account

You'll need an Expo account for building and deploying:

```bash
# Login to Expo
expo login

# Or if using EAS CLI
eas login
```

### 3. iOS Development Tools

Even without Xcode, we need a few dependencies:

```bash
# Install iOS simulator if you're on macOS (optional)
xcode-select --install

# For non-macOS users, you can use Expo Go on a physical iOS device
# Download Expo Go from the App Store on your iOS device
```

## Project Setup

### 1. Clone the Repository

```bash
git clone https://github.com/your-org/muhasabai-ios.git
cd muhasabai-ios
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env` file in the project root:

```
API_URL=https://api.muhasabai.com
# Add other environment variables as needed
```

### 4. Set Up Expo Development Build

For the best development experience, create a development build:

```bash
# Configure EAS
eas build:configure

# Create a development build for iOS
eas build --profile development --platform ios

# If you're on macOS and want to use the simulator
eas build --profile development --platform ios --simulator
```

## Development Workflow

### 1. Starting the Development Server

```bash
# Start the Expo development server
npm start

# Or to specifically target iOS
npm run ios
```

### 2. Connecting to Your App

- **Physical iOS Device**: 
  - Open the Expo Go app
  - Scan the QR code from the terminal or Expo Dev Tools
  - OR: Sign in to your Expo account in the Expo Go app to see your projects

- **iOS Simulator** (macOS only):
  - Press `i` in the terminal where Expo is running
  - OR: Click "Run on iOS simulator" in Expo Dev Tools

### 3. Live Reloading & Development Tools

- Changes to your code will automatically reload in the app
- Shake your device (or press `Cmd+D` in simulator) to open the developer menu
- In the developer menu, you can:
  - Reload the app
  - Open developer tools
  - Toggle performance monitor
  - Toggle inspector

### 4. Debugging

For debugging, use the React Native Debugger:

```bash
# Install React Native Debugger (macOS)
brew install --cask react-native-debugger

# For Windows/Linux, download from:
# https://github.com/jhen0409/react-native-debugger/releases
```

Then:
1. Open React Native Debugger
2. In your app's developer menu, select "Debug JS Remotely"

## Testing

### 1. Running Unit Tests

```bash
# Run all tests
npm test

# Run tests with coverage
npm test -- --coverage

# Run specific tests
npm test -- MyComponent
```

### 2. Testing on iOS Devices

To test on physical iOS devices without Xcode:

1. Create an internal distribution build:
```bash
eas build --profile preview --platform ios
```

2. Once the build is complete, you'll receive an email with a link to install the app
3. Open the link on your iOS device and follow the instructions

### 3. End-to-End Testing with Detox

For end-to-end testing:

```bash
# Install Detox CLI
npm install -g detox-cli

# Build for Detox testing (requires macOS with Xcode command-line tools)
detox build --configuration ios.sim.debug

# Run Detox tests
detox test --configuration ios.sim.debug
```

## Building for Distribution

### 1. Creating a Production Build

```bash
# Create a production build
eas build --platform ios --profile production
```

### 2. Building for TestFlight

```bash
# Create a build for TestFlight
eas build --platform ios --profile preview --auto-submit
```

### 3. Creating a Development Client

For testing native code changes:

```bash
eas build --platform ios --profile development
```

## Deployment

### 1. Submitting to App Store

```bash
# Build and submit to App Store Connect
eas build --platform ios --profile production --auto-submit

# Or submit an existing build
eas submit --platform ios --id YOUR_BUILD_ID
```

### 2. Over-the-Air Updates

For minor updates without resubmitting to the App Store:

```bash
# Publish an update to the production channel
eas update --branch production --message "Update description"
```

### 3. Enterprise Distribution

For enterprise distribution:

```bash
# Build with enterprise profile
eas build --platform ios --profile enterprise
```

## Troubleshooting

### Common Issues and Solutions

#### 1. Expo CLI Connection Issues

If you can't connect to your app:

```bash
# Clear Expo cache
expo start -c

# Verify your device and computer are on the same network
# Or use a tunnel connection
expo start --tunnel
```

#### 2. Build Failures

For EAS build failures:

1. Check the build logs in the Expo dashboard
2. Verify your Apple Developer account has the correct provisioning profiles and certificates
3. Run `eas credentials` to manage your credentials

#### 3. Environment Variables

If environment variables aren't working:

1. Make sure you've created the `.env` file
2. Ensure variables are properly referenced in `app.config.js`
3. Rebuild the development client after changing environment variables

#### 4. Dependency Issues

For dependency conflicts:

```bash
# Clear node_modules and reinstall
rm -rf node_modules
npm install
```

#### 5. API Connection Issues

If your app can't connect to the API:

1. Verify the API is running and accessible
2. Check that `API_URL` in your `.env` file is correct
3. Ensure network requests have the correct headers and authentication

### Getting Help

- **Discord Channel**: Join our developer Discord at [discord.gg/muhasabai](https://discord.gg/muhasabai)
- **GitHub Issues**: Report bugs on our [GitHub repository](https://github.com/your-org/muhasabai-ios/issues)
- **Documentation**: Additional documentation is available in the `docs` directory

## Additional Resources

- [Expo Documentation](https://docs.expo.dev/)
- [React Native Documentation](https://reactnative.dev/docs/getting-started)
- [EAS Build Documentation](https://docs.expo.dev/build/introduction/)
- [React Navigation Documentation](https://reactnavigation.org/docs/getting-started/)
- [React Query Documentation](https://tanstack.com/query/latest/docs/react/overview) 