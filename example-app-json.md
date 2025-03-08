# Example Expo Configuration (app.json)

This file contains the Expo configuration for the iOS application, defining app metadata, permissions, and build settings.

```json
{
  "expo": {
    "name": "MuhasabAI",
    "slug": "muhasabai",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "automatic",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#10B981"
    },
    "assetBundlePatterns": [
      "**/*"
    ],
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.muhasabai.app",
      "buildNumber": "1",
      "infoPlist": {
        "NSMicrophoneUsageDescription": "MuhasabAI needs access to your microphone for recording voice reflections",
        "NSCameraUsageDescription": "MuhasabAI needs access to your camera for profile photos",
        "NSPhotoLibraryUsageDescription": "MuhasabAI needs access to your photo library for profile photos",
        "UIBackgroundModes": [
          "audio"
        ],
        "CFBundleAllowMixedLocalizations": true,
        "UIViewControllerBasedStatusBarAppearance": true
      },
      "associatedDomains": [
        "applinks:muhasabai.com"
      ],
      "config": {
        "usesNonExemptEncryption": false
      }
    },
    "plugins": [
      [
        "expo-build-properties",
        {
          "ios": {
            "useFrameworks": "static"
          }
        }
      ],
      [
        "expo-updates",
        {
          "username": "muhasabai"
        }
      ],
      "expo-localization",
      "expo-secure-store",
      [
        "expo-av",
        {
          "microphonePermission": "MuhasabAI needs access to your microphone for recording voice reflections."
        }
      ]
    ],
    "updates": {
      "enabled": true,
      "fallbackToCacheTimeout": 0,
      "url": "https://u.expo.dev/your-project-id"
    },
    "runtimeVersion": {
      "policy": "appVersion"
    },
    "extra": {
      "eas": {
        "projectId": "your-eas-project-id"
      }
    },
    "owner": "muhasabai",
    "hooks": {
      "postPublish": [
        {
          "file": "sentry-expo/upload-sourcemaps",
          "config": {
            "organization": "muhasabai",
            "project": "muhasabai-ios"
          }
        }
      ]
    },
    "scheme": "muhasabai"
  }
}
```

## Key Configuration Areas Explained

### 1. Basic App Information

- **name**: The display name of the app on device home screens
- **slug**: A URL-friendly identifier for the app in the Expo ecosystem
- **version**: The version number displayed on the App Store
- **orientation**: Set to portrait for this app
- **icon & splash**: Branding assets for the app icon and splash screen

### 2. iOS-Specific Configuration

- **bundleIdentifier**: The unique identifier for the app in the Apple ecosystem
- **buildNumber**: Version code for App Store submissions
- **infoPlist**: 
  - Permission descriptions that iOS requires for privacy features
  - Background modes for audio recording
  - Localization support
  - Status bar appearance control

- **associatedDomains**: Supports universal links for deep linking
- **usesNonExemptEncryption**: Declares that the app doesn't use custom encryption (simplifies export compliance)

### 3. Expo Plugins

These plugins extend the functionality of Expo:

- **expo-build-properties**: Configures native build settings
- **expo-updates**: Enables over-the-air updates
- **expo-localization**: Adds support for internationalization
- **expo-secure-store**: Securely stores sensitive data
- **expo-av**: Configures audio/video capabilities with proper permissions

### 4. Updates Configuration

- **updates**: Configures over-the-air updates
- **runtimeVersion**: Defines how app versions are managed
- **fallbackToCacheTimeout**: Controls caching behavior for updates

### 5. EAS Build and Submit

- **eas**: Configuration for Expo Application Services
- **projectId**: Links to your EAS project for builds

### 6. Advanced Features

- **hooks**: Post-publish hooks for services like Sentry for crash reporting
- **scheme**: Custom URL scheme for deep linking

## Usage with eas.json

This app.json works in conjunction with an eas.json file, which defines build profiles:

```json
{
  "cli": {
    "version": ">= 7.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "ios": {
        "simulator": true
      }
    },
    "preview": {
      "distribution": "internal",
      "channel": "preview"
    },
    "production": {
      "autoIncrement": true,
      "channel": "production"
    }
  },
  "submit": {
    "production": {
      "ios": {
        "appleId": "developer@muhasabai.com",
        "ascAppId": "1234567890",
        "appleTeamId": "ABC123DEF"
      }
    }
  }
}
```

This configuration allows for:

1. **Development builds**: For testing in simulators and on devices
2. **Preview builds**: For internal testing via TestFlight
3. **Production builds**: For App Store submission
4. **Automated submission**: Configuration for App Store Connect submission

Together, these files provide a complete configuration for building, testing, and deploying your iOS application without requiring Xcode. 