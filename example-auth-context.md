# AuthContext Implementation

This file implements the authentication context for React Native, adapting the existing web authentication system to work with secure storage on iOS.

```typescript
import React, { createContext, useState, useContext, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import axios from 'axios';
import { API_URL } from '../config';
import { User } from '../types/auth';

// Define authentication context types
interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  googleSignIn: () => Promise<void>;
  refreshToken: () => Promise<boolean>;
}

// Create the context with default values
const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  isLoading: true,
  user: null,
  login: async () => {},
  register: async () => {},
  logout: async () => {},
  googleSignIn: async () => {},
  refreshToken: async () => false,
});

// Secure storage keys
const TOKEN_KEY = 'auth_token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const USER_DATA_KEY = 'user_data';

// Provider component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  
  // Configure axios with authentication header
  const setupAxiosInterceptors = (token: string) => {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  };

  // Remove axios interceptors
  const resetAxiosInterceptors = () => {
    delete axios.defaults.headers.common['Authorization'];
  };

  // Initialize auth state from secure storage
  const initialize = async () => {
    try {
      const token = await SecureStore.getItemAsync(TOKEN_KEY);
      const userData = await SecureStore.getItemAsync(USER_DATA_KEY);
      
      if (token && userData) {
        setupAxiosInterceptors(token);
        setUser(JSON.parse(userData));
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error('Error initializing auth:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    initialize();
  }, []);

  // Login handler
  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await axios.post(`${API_URL}/api/auth/login`, {
        email,
        password,
      });
      
      const { token, refreshToken, user } = response.data;
      
      // Store auth data in secure storage
      await SecureStore.setItemAsync(TOKEN_KEY, token);
      await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken);
      await SecureStore.setItemAsync(USER_DATA_KEY, JSON.stringify(user));
      
      setupAxiosInterceptors(token);
      setUser(user);
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Registration handler
  const register = async (name: string, email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await axios.post(`${API_URL}/api/auth/register`, {
        name,
        email,
        password,
      });
      
      const { token, refreshToken, user } = response.data;
      
      // Store auth data in secure storage
      await SecureStore.setItemAsync(TOKEN_KEY, token);
      await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken);
      await SecureStore.setItemAsync(USER_DATA_KEY, JSON.stringify(user));
      
      setupAxiosInterceptors(token);
      setUser(user);
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Logout handler
  const logout = async () => {
    try {
      // Call logout API endpoint if needed
      await axios.post(`${API_URL}/api/auth/logout`);
      
      // Clear secure storage
      await SecureStore.deleteItemAsync(TOKEN_KEY);
      await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
      await SecureStore.deleteItemAsync(USER_DATA_KEY);
      
      resetAxiosInterceptors();
      setUser(null);
      setIsAuthenticated(false);
    } catch (error) {
      console.error('Logout error:', error);
      
      // Even if API call fails, clear local storage
      await SecureStore.deleteItemAsync(TOKEN_KEY);
      await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
      await SecureStore.deleteItemAsync(USER_DATA_KEY);
      
      resetAxiosInterceptors();
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  // Token refresh handler
  const refreshToken = async (): Promise<boolean> => {
    try {
      const refreshTokenValue = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
      
      if (!refreshTokenValue) {
        return false;
      }
      
      const response = await axios.post(`${API_URL}/api/auth/refresh`, {
        refreshToken: refreshTokenValue,
      });
      
      const { token, refreshToken: newRefreshToken } = response.data;
      
      await SecureStore.setItemAsync(TOKEN_KEY, token);
      await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, newRefreshToken);
      
      setupAxiosInterceptors(token);
      return true;
    } catch (error) {
      console.error('Token refresh error:', error);
      
      // If refresh fails, log out the user
      await logout();
      return false;
    }
  };

  // Google sign-in handler
  const googleSignIn = async () => {
    // This would use Expo Google Auth
    // Implementation would depend on expo-auth-session or similar
    throw new Error('Google Sign-In not implemented yet');
  };

  // Context value
  const value = {
    isAuthenticated,
    isLoading,
    user,
    login,
    register,
    logout,
    googleSignIn,
    refreshToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook for using auth context
export const useAuth = () => useContext(AuthContext);

// Hook for protected API calls with automatic token refresh
export const useAuthenticatedApi = () => {
  const { refreshToken, isAuthenticated } = useAuth();
  
  // Create an API instance with interceptors for token refresh
  const api = axios.create({
    baseURL: API_URL,
  });
  
  // Add response interceptor for handling 401 errors
  api.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config;
      
      // If the error is 401 and we're authenticated, try to refresh the token
      if (error.response?.status === 401 && isAuthenticated && !originalRequest._retry) {
        originalRequest._retry = true;
        
        const refreshed = await refreshToken();
        if (refreshed) {
          // Retry the original request
          return api(originalRequest);
        }
      }
      
      return Promise.reject(error);
    }
  );
  
  return api;
};
```

## Key Features

1. **Secure Storage**:
   - Uses Expo's SecureStore for token storage instead of localStorage
   - Encrypts sensitive information on the device
   - Securely manages authentication tokens

2. **Authentication Flow**:
   - Preserves the same login/register/logout flow from the web app
   - Adapts token management for mobile environment

3. **Token Refresh**:
   - Implements automatic token refresh mechanism
   - Handles expired tokens gracefully

4. **API Integration**:
   - Configures axios with authentication headers
   - Provides a custom hook for authenticated API calls

5. **Error Handling**:
   - Comprehensive error handling for auth operations
   - Fallback mechanisms for network failures

## Usage Example

```typescript
// In a login screen component
import React, { useState } from 'react';
import { View, TextInput, Button, Alert } from 'react-native';
import { useAuth } from '../context/AuthContext';

const LoginScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter both email and password');
      return;
    }

    setIsLoading(true);
    try {
      await login(email, password);
      // Navigation will happen automatically due to auth state change
    } catch (error) {
      Alert.alert('Login Failed', 'Invalid email or password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={{ padding: 20 }}>
      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextInput
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <Button 
        title={isLoading ? "Logging in..." : "Login"}
        onPress={handleLogin}
        disabled={isLoading}
      />
    </View>
  );
};

export default LoginScreen;
``` 