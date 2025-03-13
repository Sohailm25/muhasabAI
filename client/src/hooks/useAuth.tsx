import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { API } from '../lib/api';
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
  logout: (silent?: boolean) => Promise<void>;
  refreshProfile: () => Promise<void>;
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
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  
  // Clears any profile-related errors in local storage
  const clearProfileErrors = useCallback(() => {
    try {
      // Clear any circuit breakers or profile failure counters
      const errorKeys = Object.keys(localStorage).filter(key => 
        key.startsWith('circuit_') || 
        key.startsWith('failures_') || 
        key.includes('profile')
      );
      
      if (errorKeys.length > 0) {
        console.log('[AUTH] Clearing profile-related error keys:', errorKeys);
        errorKeys.forEach(key => localStorage.removeItem(key));
      }
    } catch (e) {
      console.error('[AUTH] Error clearing profile errors:', e);
    }
  }, []);
  
  // Check if user is already logged in
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        console.log('[Auth Debug] Starting auth status check');
        setIsLoading(true);
        setError(null);
        
        // Clear any previous profile errors on auth status check
        clearProfileErrors();
        
        const token = localStorage.getItem('auth_token');
        
        console.log('[Auth Debug] Token found in storage:', !!token);
        
        // If no token exists, just set user to null and exit early - no need to make API calls
        if (!token) {
          console.log('[Auth Debug] No auth token found, clearing auth state');
          setUser(null);
          setIsLoading(false);
          return;
        }
        
        try {
          console.log('[AUTH] Validating token...');
          
          const userData = await API.validateToken();
          console.log('[AUTH] Token validation successful:', userData);
          
          if (userData) {
            setUser({
              id: userData.id,
              email: userData.email,
              name: userData.name,
              isFirstLogin: userData.isFirstLogin || false,
              hasAcceptedPrivacyPolicy: userData.hasAcceptedPrivacyPolicy || false,
              createdAt: userData.createdAt ? new Date(userData.createdAt) : new Date(),
              updatedAt: userData.updatedAt ? new Date(userData.updatedAt) : new Date()
            });
            setIsAuthenticated(true);
            
            // Ensure user profile exists with more robust error handling
            console.log('[AUTH] Ensuring user profile exists after token validation');
            try {
              const profile = await ensureUserProfile(userData.id);
              
              // If no profile was found or created after multiple attempts
              if (!profile) {
                console.log('[AUTH] Profile could not be created after multiple attempts');
                console.log('[AUTH] Invalidating authentication token due to missing profile');
                
                // Keep user authenticated but set an error about profile
                setError('Your profile could not be found. You may need to create a new profile.');
              }
            } catch (profileError) {
              console.error('[AUTH] Profile error:', profileError);
              
              // Set error but don't force logout - let RequireAuth handle recovery
              setError(profileError instanceof Error 
                ? `Profile error: ${profileError.message}` 
                : 'Error retrieving your profile');
            }
          } else {
            console.log('[AUTH] No user data returned from token validation');
            setUser(null);
            setIsAuthenticated(false);
            localStorage.removeItem('auth_token');
          }
        } catch (error) {
          console.error('[AUTH] Token validation error:', error);
          setUser(null);
          setIsAuthenticated(false);
          localStorage.removeItem('auth_token');
        } finally {
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Error checking auth status:', error);
        setUser(null);
        setIsLoading(false);
      }
    };
    
    checkAuthStatus();
  }, [clearProfileErrors]);
  
  // Function to ensure a user profile exists
  const ensureUserProfile = async (userId: string) => {
    try {
      console.log('[AUTH] Ensuring user profile exists for:', userId);
      
      // Clear any profile errors before checking
      clearProfileErrors();
      
      // First, check if profile already exists
      try {
        console.log('[AUTH] Checking if profile exists...');
        const existingProfile = await API.getUserProfile();
        console.log('[AUTH] Profile check result:', existingProfile ? 'Found' : 'Not found');
        
        if (existingProfile) {
          console.log('[AUTH] Profile already exists, no need to create');
          return existingProfile;
        }
      } catch (profileError) {
        // Profile not found or other error - we'll try to create a new one
        console.log('[AUTH] Profile check failed:', profileError);
      }
      
      // Create a new profile
      console.log('[AUTH] Creating new profile...');
      return await createProfile(userId);
    } catch (error) {
      console.error('[AUTH] Error ensuring user profile exists:', error);
      throw new Error('Failed to set up your profile. Please try again.');
    }
  };
  
  // Function to create a profile
  const createProfile = async (userId: string) => {
    console.log('[AUTH] Creating profile for user:', userId);
    
    // Create basic default profile 
    const profileData = {
      userId,
      generalPreferences: {
        inputMethod: 'text',
        reflectionFrequency: 'daily',
        languagePreferences: 'english',
        theme: 'system',
        fontSize: 'medium'
      },
      privacySettings: {
        localStorageOnly: false,
        allowPersonalization: true,
        enableSync: true,
        shareAnonymousUsageData: false
      }
    };
    
    try {
      // Try API with priority flag
      return await API.createOrUpdateUserProfile(profileData, {
        priority: true,
        maxRetries: 5
      });
    } catch (error) {
      console.error('[AUTH] Profile creation failed:', error);
      throw error;
    }
  };
  
  // Function to refresh profile
  const refreshProfile = async () => {
    if (!user?.id) {
      console.log('[AUTH] Cannot refresh profile: No user ID');
      return;
    }
    
    setError(null);
    clearProfileErrors();
    
    try {
      console.log('[AUTH] Refreshing profile for user:', user.id);
      await ensureUserProfile(user.id);
    } catch (error) {
      console.error('[AUTH] Error refreshing profile:', error);
      setError('Failed to refresh your profile.');
    }
  };
  
  // Modify the register function to ensure profile creation
  const register = useCallback(async (email: string, password: string, name: string) => {
    try {
      setIsLoading(true);
      setError(null);
      clearProfileErrors();
      
      // Call register API
      const response = await API.post('/auth/register', { email, password, name });
      
      // Save token
      const { token, user } = response;
      localStorage.setItem('auth_token', token);
      
      setUser(user);
      setIsAuthenticated(true);
      
      // Explicitly ensure profile exists
      try {
        console.log('Creating profile after registration...');
        await ensureUserProfile(user.id);
      } catch (profileError) {
        console.error('Profile creation failed but registration succeeded:', profileError);
        setError('Registration successful, but we had trouble setting up your profile. Please try refreshing.');
      }
    } catch (err) {
      setError((err as Error).message || 'Registration failed. Please try again.');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [clearProfileErrors]);
  
  // Modify the login function to ensure profile creation
  const login = useCallback(async (email: string, password: string, rememberMe = false) => {
    try {
      setIsLoading(true);
      setError(null);
      clearProfileErrors();
      
      // Call login API
      const response = await API.post('/auth/login', { email, password });
      
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
      setIsAuthenticated(true);
      
      // Explicitly ensure profile exists
      try {
        console.log('Ensuring profile exists after login...');
        await ensureUserProfile(user.id);
      } catch (profileError) {
        console.error('Profile creation failed but login succeeded:', profileError);
        setError('Login successful, but we had trouble loading your profile. Please try refreshing.');
      }
    } catch (err) {
      setError((err as Error).message || 'Login failed. Please check your credentials.');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [clearProfileErrors]);
  
  // Login with Google
  const loginWithGoogle = useCallback(async (action?: 'login' | 'signup') => {
    try {
      setError(null);
      clearProfileErrors();
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
            
            // Set user data in state
            setUser(event.data.user);
            setIsAuthenticated(true);
            console.log('User data set in state');
            
            // Try to initialize profile
            try {
              console.log('Ensuring user profile exists after Google login...');
              if (event.data.user && event.data.user.id) {
                await ensureUserProfile(event.data.user.id);
              }
            } catch (profileError) {
              console.error('Profile creation error after Google login:', profileError);
              setError('Login successful, but we had trouble setting up your profile. Please try refreshing.');
            }
            
            // Remove the event listener before reload to prevent duplicate handling
            window.removeEventListener('message', handleMessage);
            
            console.log('Authentication complete, redirecting...');
            
            // Redirect to home instead of just reloading
            setTimeout(() => {
              window.location.href = '/home';
            }, 1000);
            
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
  }, [clearProfileErrors]);
  
  // Logout
  const logout = useCallback(async (silent = false) => {
    try {
      if (!silent) {
        setIsLoading(true);
      }
      
      // Only call logout API if not in silent mode
      if (!silent) {
        try {
          await API.post('/auth/logout');
        } catch (apiError) {
          console.error('API logout error:', apiError);
          // Continue with local logout even if API call fails
        }
      }
      
      // Clear local storage
      localStorage.removeItem('auth_token');
      localStorage.removeItem('remember_auth');
      
      // Clear any profile errors
      clearProfileErrors();
      
      // Reset user state
      setUser(null);
      setIsAuthenticated(false);
      setError(null);
      
      // Reset profile
      await resetProfile();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      if (!silent) {
        setIsLoading(false);
      }
    }
  }, [resetProfile, clearProfileErrors]);
  
  // Memoized context value
  const contextValue: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    error,
    login,
    register,
    loginWithGoogle,
    logout,
    refreshProfile
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