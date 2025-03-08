# Example package.json for iOS Application

This file shows the required dependencies and scripts for the React Native iOS application.

```json
{
  "name": "muhasabai-ios",
  "version": "1.0.0",
  "main": "node_modules/expo/AppEntry.js",
  "scripts": {
    "start": "expo start",
    "android": "expo start --android",
    "ios": "expo start --ios",
    "web": "expo start --web",
    "test": "jest --watchAll",
    "lint": "eslint .",
    "build:ios": "eas build --platform ios --profile preview",
    "build:prod": "eas build --platform ios --profile production",
    "submit": "eas submit --platform ios",
    "prepare-update": "eas update --branch production --message \"Update $(date)\"",
    "ts:check": "tsc --noEmit",
    "format": "prettier --write \"**/*.{js,jsx,ts,tsx,json,md}\""
  },
  "dependencies": {
    "@expo/vector-icons": "^14.0.0",
    "@hookform/resolvers": "^3.9.1",
    "@react-native-async-storage/async-storage": "^1.22.0",
    "@react-navigation/bottom-tabs": "^6.5.8",
    "@react-navigation/native": "^6.1.7",
    "@react-navigation/native-stack": "^6.9.13",
    "@tanstack/react-query": "^5.60.5",
    "axios": "^1.6.7",
    "date-fns": "^3.6.0",
    "expo": "~50.0.5",
    "expo-av": "~13.10.4",
    "expo-dev-client": "~3.3.8",
    "expo-device": "~5.9.3",
    "expo-file-system": "~16.0.5",
    "expo-linking": "~6.2.2",
    "expo-secure-store": "~12.8.1",
    "expo-splash-screen": "~0.26.4",
    "expo-status-bar": "~1.11.1",
    "expo-updates": "~0.24.10",
    "expo-web-browser": "~12.8.2",
    "react": "18.2.0",
    "react-hook-form": "^7.53.1",
    "react-native": "0.73.4",
    "react-native-gesture-handler": "~2.14.0",
    "react-native-paper": "^5.12.3",
    "react-native-reanimated": "~3.6.2",
    "react-native-safe-area-context": "4.8.2",
    "react-native-screens": "~3.29.0",
    "react-native-vector-icons": "^10.0.3",
    "zod": "^3.23.8"
  },
  "devDependencies": {
    "@babel/core": "^7.22.5",
    "@testing-library/jest-native": "^5.4.2",
    "@testing-library/react-native": "^12.0.1",
    "@types/react": "~18.2.48",
    "@types/react-native": "~0.73.0",
    "@typescript-eslint/eslint-plugin": "^5.59.0",
    "@typescript-eslint/parser": "^5.59.0",
    "babel-preset-expo": "^10.0.1",
    "detox": "^20.11.4",
    "eas-cli": "^7.0.0",
    "eslint": "^8.40.0",
    "eslint-config-prettier": "^8.8.0",
    "eslint-plugin-react": "^7.32.2",
    "eslint-plugin-react-hooks": "^4.6.0",
    "jest": "^29.6.3",
    "jest-expo": "~50.0.2",
    "prettier": "^2.8.8",
    "react-test-renderer": "18.2.0",
    "typescript": "^5.3.0"
  },
  "jest": {
    "preset": "jest-expo",
    "transformIgnorePatterns": [
      "node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg)"
    ],
    "setupFilesAfterEnv": [
      "@testing-library/jest-native/extend-expect"
    ],
    "collectCoverageFrom": [
      "src/**/*.{js,jsx,ts,tsx}",
      "!**/node_modules/**",
      "!**/__tests__/**"
    ],
    "coverageThreshold": {
      "global": {
        "lines": 70,
        "statements": 70
      }
    }
  },
  "private": true,
  "volta": {
    "node": "18.19.0",
    "npm": "10.2.3"
  }
}
```

## Key Configurations Explained

### 1. Scripts

The package.json includes several important scripts for development, testing, and deployment:

- **Development Scripts**:
  - `start`: Starts the Expo development server
  - `ios`: Starts the app in iOS simulator
  - `android`: Starts the app in Android emulator
  - `web`: Starts the web version (not our primary target)

- **Testing Scripts**:
  - `test`: Runs Jest tests in watch mode
  - `lint`: Lints the codebase using ESLint
  - `ts:check`: Type-checks the TypeScript code

- **Build & Deployment Scripts**:
  - `build:ios`: Builds the iOS app in preview mode using EAS
  - `build:prod`: Builds the production version of the iOS app
  - `submit`: Submits the app to App Store Connect
  - `prepare-update`: Creates an OTA update bundle

### 2. Dependencies

The dependencies are organized to support a React Native application with Expo, focusing on iOS:

- **Core Libraries**:
  - React Native
  - Expo SDK and modules
  - React Navigation for routing

- **State Management and Data Fetching**:
  - React Query for API data fetching
  - Axios for HTTP requests
  - AsyncStorage and SecureStore for data persistence

- **UI Components**:
  - React Native Paper for Material Design components
  - Vector icons for iconography
  - React Native Reanimated for animations

- **Form Handling**:
  - React Hook Form for form state management
  - Zod for schema validation

- **Media Support**:
  - Expo AV for audio recording and playback
  - Expo File System for file management

### 3. Development Tools

Tools for quality assurance and development productivity:

- **TypeScript**: For type safety and better developer experience
- **ESLint and Prettier**: For code quality and consistent formatting
- **Jest and Testing Library**: For unit and component testing
- **Detox**: For end-to-end testing
- **EAS CLI**: For Expo's build and submission services

### 4. Jest Configuration

The Jest configuration is set up to work with React Native and Expo:

- Uses `jest-expo` preset
- Configures transform ignore patterns for node_modules
- Sets up testing library extensions
- Configures coverage thresholds

### 5. Node Version Management

Using Volta to ensure consistent Node.js and npm versions across development environments. 