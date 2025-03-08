# Example App.tsx Implementation

This file serves as the entry point for the React Native iOS application.

```typescript
import React, { useEffect } from 'react';
import { StatusBar, LogBox, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider as PaperProvider } from 'react-native-paper';
import AppNavigator from './src/navigation/AppNavigator';
import AuthNavigator from './src/navigation/AuthNavigator';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { ProfileProvider } from './src/context/ProfileContext';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { theme } from './src/theme';
import { PersonalizationProvider } from './src/context/PersonalizationContext';
import SplashScreen from './src/screens/onboarding/SplashScreen';

// Ignore specific warnings - adjust as needed
LogBox.ignoreLogs(['Reanimated 2']);

// Create React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  },
});

// Main application content
const Main = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const { theme: appTheme } = useTheme();

  // Debug token on startup (for development)
  useEffect(() => {
    if (__DEV__) {
      console.log('App initialized with auth status:', isAuthenticated ? 'Authenticated' : 'Not authenticated');
    }
  }, [isAuthenticated]);

  // Show splash screen while loading
  if (isLoading) {
    return <SplashScreen />;
  }

  return (
    <PaperProvider theme={appTheme}>
      <NavigationContainer theme={appTheme.navigation}>
        <StatusBar 
          barStyle={appTheme.dark ? 'light-content' : 'dark-content'} 
          backgroundColor={appTheme.colors.background} 
        />
        {isAuthenticated ? <AppNavigator /> : <AuthNavigator />}
      </NavigationContainer>
    </PaperProvider>
  );
};

// Root component with providers
const App = () => {
  return (
    <SafeAreaProvider>
      <ThemeProvider defaultTheme="light">
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <ProfileProvider>
              <PersonalizationProvider>
                <Main />
              </PersonalizationProvider>
            </ProfileProvider>
          </AuthProvider>
        </QueryClientProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
};

export default App;
```

## Key Components Explained

1. **Provider Structure**:
   - `SafeAreaProvider`: Handles safe area insets for notches and system UI
   - `ThemeProvider`: Manages application theming
   - `QueryClientProvider`: Handles API data fetching and caching
   - `AuthProvider`: Manages authentication state
   - `ProfileProvider`: Manages user profile data
   - `PersonalizationProvider`: Manages user personalization settings

2. **Navigation**:
   - Conditionally renders either `AppNavigator` or `AuthNavigator` based on authentication state
   - Handles navigation theming

3. **Platform Adaptation**:
   - Status bar configuration for iOS
   - Safe area handling

4. **Performance Optimizations**:
   - React Query configuration for efficient API caching
   - LogBox configuration to ignore non-critical warnings

## Theme Implementation

The theme implementation is designed to mirror the current web application's theming while adapting to mobile patterns:

```typescript
// src/theme/index.ts
import { DefaultTheme as NavigationDefaultTheme, DarkTheme as NavigationDarkTheme } from '@react-navigation/native';
import { MD3LightTheme, MD3DarkTheme } from 'react-native-paper';

// Our custom colors
const customColors = {
  primary: '#10B981', // emerald-500
  onPrimary: '#FFFFFF',
  primaryContainer: '#D1FAE5', // emerald-100
  onPrimaryContainer: '#065F46', // emerald-800
  secondary: '#6366F1', // indigo-500
  onSecondary: '#FFFFFF',
  secondaryContainer: '#E0E7FF', // indigo-100
  onSecondaryContainer: '#4338CA', // indigo-700
  background: '#FFFFFF',
  onBackground: '#1F2937', // gray-800
  surface: '#F9FAFB', // gray-50
  onSurface: '#1F2937', // gray-800
  error: '#EF4444', // red-500
  onError: '#FFFFFF',
  errorContainer: '#FEE2E2', // red-100
  onErrorContainer: '#991B1B', // red-800
  outline: '#E5E7EB', // gray-200
  surfaceVariant: '#F3F4F6', // gray-100
  onSurfaceVariant: '#4B5563', // gray-600
};

// Dark colors
const customDarkColors = {
  primary: '#34D399', // emerald-400
  onPrimary: '#022C22', // emerald-950
  primaryContainer: '#065F46', // emerald-800
  onPrimaryContainer: '#D1FAE5', // emerald-100
  secondary: '#818CF8', // indigo-400
  onSecondary: '#1E1B4B', // indigo-950
  secondaryContainer: '#4338CA', // indigo-700
  onSecondaryContainer: '#E0E7FF', // indigo-100
  background: '#111827', // gray-900
  onBackground: '#F9FAFB', // gray-50
  surface: '#1F2937', // gray-800
  onSurface: '#F3F4F6', // gray-100
  error: '#F87171', // red-400
  onError: '#7F1D1D', // red-900
  errorContainer: '#991B1B', // red-800
  onErrorContainer: '#FEE2E2', // red-100
  outline: '#374151', // gray-700
  surfaceVariant: '#374151', // gray-700
  onSurfaceVariant: '#D1D5DB', // gray-300
};

// Create complete themes
export const lightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    ...customColors,
  },
  navigation: {
    ...NavigationDefaultTheme,
    colors: {
      ...NavigationDefaultTheme.colors,
      primary: customColors.primary,
      background: customColors.background,
      card: customColors.surface,
      text: customColors.onSurface,
      border: customColors.outline,
    },
  },
  dark: false,
};

export const darkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    ...customDarkColors,
  },
  navigation: {
    ...NavigationDarkTheme,
    colors: {
      ...NavigationDarkTheme.colors,
      primary: customDarkColors.primary,
      background: customDarkColors.background,
      card: customDarkColors.surface,
      text: customDarkColors.onSurface,
      border: customDarkColors.outline,
    },
  },
  dark: true,
};

export const theme = { light: lightTheme, dark: darkTheme };
``` 