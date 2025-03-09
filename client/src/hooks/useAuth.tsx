import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { api } from '../lib/api';
import { useProfile } from './useProfile';

// Types for authentication
export interface AuthUser {
  id: string;
  email: string;
  name: string;
  isFirstLogin: boolean;
  hasAcceptedPrivacyPolicy: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  loginWithGoogle: (action?: 'login' | 'signup') => Promise<void>;
  logout: () => Promise<void>;
}

// Create context
const AuthContext = createContext<AuthContextType | null>(null);

interface AuthProviderProps {
  children: React.ReactNode;
}

// Authentication provider component
export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { resetProfile } = useProfile();
  
  // Check if user is already logged in
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        console.log('[Auth Debug] Starting auth status check');
        setIsLoading(true);
        const token = localStorage.getItem('auth_token');
        
        console.log('[Auth Debug] Token found in storage:', !!token);
        
        // If no token exists, just set user to null and exit early - no need to make API calls
        if (!token) {
          console.log('[Auth Debug] No auth token found, clearing auth state');
          setUser(null);
          setIsLoading(false);
          return;
        }
        
        let validationAttempts = 0;
        const maxAttempts = 3;
        
        const validateToken = async (): Promise<void> => {
          try {
            console.log('[Auth Debug] Validating token with server... Attempt:', validationAttempts + 1);
            const userData = await api.get('/auth/validate');
            console.log('[Auth Debug] Token validation successful, user data:', userData);
            setUser(userData);
            
            // Only try to get or create profile if we have valid user data
            if (userData && userData.id) {
              try {
                console.log('Checking for user profile on app load...');
                await api.get('/api/profile');
                console.log('Profile exists');
              } catch (error) {
                const profileError = error as { status?: number };
                if (profileError.status === 404) {
                  console.log('Profile not found on app load, creating new profile');
                  try {
                    await api.post('/api/profile', {
                      userId: userData.id,
                      generalPreferences: {
                        inputMethod: 'text',
                        reflectionFrequency: 'daily',
                        languagePreferences: 'english'
                      },
                      privacySettings: {
                        localStorageOnly: false,
                        allowPersonalization: true,
                        enableSync: true
                      }
                    });
                    console.log('Profile created successfully on app load');
                  } catch (createError) {
                    console.error('Error creating profile on app load:', createError);
                  }
                } else {
                  console.error('Error checking for profile:', profileError);
                }
              }
            }
          } catch (validationError) {
            console.error('Token validation failed:', validationError);
            validationAttempts++;
            
            if (validationAttempts < maxAttempts) {
              console.log(`Retrying validation... Attempt ${validationAttempts + 1} of ${maxAttempts}`);
              await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second between attempts
              return validateToken();
            }
            
            // If all attempts fail, clear token and user state
            console.error(`Token validation failed after ${maxAttempts} attempts`);
            localStorage.removeItem('auth_token');
            setUser(null);
          }
        };
        
        await validateToken();
      } catch (err) {
        console.error('Unexpected error in auth check:', err);
        localStorage.removeItem('auth_token');
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkAuthStatus();
  }, []);
  
  // Login with email and password
  const login = useCallback(async (email: string, password: string, rememberMe = false) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Call login API
      const response = await api.post('/auth/login', { email, password });
      
      // Save token
      const { token, user } = response;
      localStorage.setItem('auth_token', token);
      
      // Handle remember me
      if (rememberMe) {
        localStorage.setItem('remember_auth', 'true');
      } else {
        localStorage.removeItem('remember_auth');
      }
      
      setUser(user);
      
      // Check if profile exists and create one if needed
      try {
        console.log('Checking for user profile after login...');
        // First try to fetch existing profile
        const profileResponse = await api.get('/api/profile');
        console.log('Profile exists, no need to create one');
      } catch (error) {
        // If profile doesn't exist (404), create a new one
        const profileError = error as { status?: number };
        if (profileError.status === 404) {
          console.log('Profile not found, creating new profile after login');
          try {
            const createResponse = await api.post('/api/profile', {
              userId: user.id,
              generalPreferences: {
                inputMethod: 'text',
                reflectionFrequency: 'daily',
                languagePreferences: 'english'
              },
              privacySettings: {
                localStorageOnly: false,
                allowPersonalization: true,
                enableSync: true
              }
            });
            console.log('Profile created successfully:', createResponse);
          } catch (createError) {
            console.error('Error creating profile after login:', createError);
            // Don't fail the login if profile creation fails
          }
        } else {
          console.error('Error checking for profile:', profileError);
        }
      }
    } catch (err) {
      setError((err as Error).message || 'Login failed. Please check your credentials.');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  // Register new user
  const register = useCallback(async (email: string, password: string, name: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Call register API
      const response = await api.post('/auth/register', { email, password, name });
      
      // Save token
      const { token, user } = response;
      localStorage.setItem('auth_token', token);
      
      setUser(user);
      
      // Create user profile after successful registration
      try {
        console.log('Creating user profile after successful registration...');
        const profileResponse = await api.post('/api/profile', {
          userId: user.id,
          generalPreferences: {
            inputMethod: 'text',
            reflectionFrequency: 'daily',
            languagePreferences: 'english'
          },
          privacySettings: {
            localStorageOnly: false,
            allowPersonalization: true,
            enableSync: true
          }
        });
        
        console.log('Profile created successfully:', profileResponse);
      } catch (profileError) {
        console.error('Error creating profile:', profileError);
        // Don't fail the registration if profile creation fails
      }
    } catch (err) {
      setError((err as Error).message || 'Registration failed. Please try again.');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  // Login with Google
  const loginWithGoogle = useCallback(async (action?: 'login' | 'signup') => {
    try {
      setError(null);
      console.log(`Starting Google ${action} flow...`);
      
      // Open Google OAuth popup with action parameter
      const googleAuthWindow = window.open(
        `/auth/google?action=${action}`,
        'googleAuth',
        'width=500,height=600'
      );
      
      console.log('Opened Google auth window, waiting for response...');
      
      // Create listener for message from popup
      const handleMessage = async (event: MessageEvent) => {
        console.log('Received message from popup:', event.origin, 'Expected origin:', window.location.origin);
        
        // Verify message origin
        if (event.origin !== window.location.origin) {
          console.warn('Ignoring message from unexpected origin:', event.origin);
          return;
        }
        
        // Close popup
        if (googleAuthWindow) {
          console.log('Closing Google auth window');
          googleAuthWindow.close();
        }
        
        // Check for error from Google auth
        if (event.data.error) {
          console.error('Google auth error:', event.data.error);
          setError(event.data.error || 'Google authentication failed');
          setIsLoading(false);
          
          // Remove event listener on error
          window.removeEventListener('message', handleMessage);
          return;
        }
        
        // Log the data received from the popup
        console.log('Message data received:', JSON.stringify({
          hasToken: !!event.data.token,
          hasUser: !!event.data.user,
          user: event.data.user ? {
            id: event.data.user.id,
            email: event.data.user.email
          } : null,
          error: event.data.error
        }));
        
        // Check for token
        if (event.data.token) {
          // Set loading state to indicate authentication is in progress
          setIsLoading(true);
          
          try {
            console.log('Received Google auth token, storing...');
            
            // Clear any existing token first
            localStorage.removeItem('auth_token');
            
            // Store token in localStorage
            localStorage.setItem('auth_token', event.data.token);
            console.log('Token stored in localStorage');
            
            // Make sure token is fully stored before proceeding (increase delay)
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Check token was actually stored
            const storedToken = localStorage.getItem('auth_token');
            console.log('Verifying token was stored properly:', !!storedToken);
            
            // Set user data in state
            setUser(event.data.user);
            console.log('User data set in state');
            
            // Make a test request to validate the token is working
            try {
              const response = await fetch('/auth/validate', {
                headers: {
                  'Authorization': `Bearer ${storedToken}`
                }
              });
              console.log('Token validation test:', 
                response.status, 
                response.statusText, 
                response.ok ? 'Success' : 'Failed'
              );
              
              // IMPORTANT: Try to initialize user profile after successful login
              if (response.ok) {
                try {
                  console.log('Creating user profile after successful login...');
                  // First try to fetch existing profile
                  const profileResponse = await fetch('/api/profile', {
                    headers: {
                      'Authorization': `Bearer ${storedToken}`
                    }
                  });
                  
                  // If profile doesn't exist (404), create a new one
                  if (profileResponse.status === 404) {
                    console.log('Profile not found, creating new profile');
                    const createResponse = await fetch('/api/profile', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${storedToken}`
                      },
                      body: JSON.stringify({
                        userId: event.data.user.id,
                        generalPreferences: {
                          inputMethod: 'text',
                          reflectionFrequency: 'daily',
                          languagePreferences: 'english'
                        },
                        privacySettings: {
                          localStorageOnly: false,
                          allowPersonalization: true,
                          enableSync: true
                        }
                      })
                    });
                    
                    if (createResponse.ok) {
                      console.log('Profile created successfully');
                    } else {
                      console.error('Failed to create profile:', createResponse.status, createResponse.statusText);
                    }
                  } else if (profileResponse.ok) {
                    console.log('Profile already exists');
                  } else {
                    console.error('Error checking profile:', profileResponse.status, profileResponse.statusText);
                  }
                } catch (profileError) {
                  console.error('Profile creation error:', profileError);
                  // Don't fail the login if profile creation fails
                }
              }
            } catch (validationError) {
              console.error('Token validation test failed:', validationError);
            }
            
            // Remove the event listener before reload to prevent duplicate handling
            window.removeEventListener('message', handleMessage);
            
            console.log('Authentication complete, reloading page...');
            
            // Force reload to ensure a clean authentication state
            // Delay the reload to ensure token is properly stored
            setTimeout(() => {
              // Redirect to the home page instead of just reloading
              window.location.href = '/home';
            }, 1500);
            
          } catch (err) {
            console.error('Error processing Google auth:', err);
            setError((err instanceof Error ? err.message : String(err)) || 'Error processing Google authentication');
            setIsLoading(false);
            
            // Remove event listener on error
            window.removeEventListener('message', handleMessage);
          }
        }
      };
      
      // Add listener
      window.addEventListener('message', handleMessage);
      
      // Safety cleanup in case the OAuth flow doesn't complete
      setTimeout(() => {
        window.removeEventListener('message', handleMessage);
      }, 120000); // 2 minute timeout
      
    } catch (err) {
      setError((err instanceof Error ? err.message : String(err)) || 'Google authentication failed');
      setIsLoading(false);
    }
  }, []);
  
  // Logout
  const logout = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Call logout API
      await api.post('/auth/logout');
      
      // Clear local storage
      localStorage.removeItem('auth_token');
      localStorage.removeItem('remember_auth');
      
      // Reset user state
      setUser(null);
      
      // Reset profile
      await resetProfile();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [resetProfile]);
  
  // Memoized context value
  const contextValue: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    error,
    login,
    register,
    loginWithGoogle,
    logout
  };
  
  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook for using the auth context
export function useAuth() {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
} 