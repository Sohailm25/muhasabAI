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
            console.log('[AUTH] Validating token...');
            setIsLoading(true);
            
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
              
              // Ensure user profile exists
              console.log('[AUTH] Ensuring user profile exists after token validation');
              try {
                const profile = await ensureUserProfile(userData.id);
                
                // If no profile was found or created after multiple attempts
                if (!profile) {
                  console.log('[AUTH] Profile could not be created after multiple attempts');
                  console.log('[AUTH] Invalidating authentication token due to missing profile');
                  // Force logout to clear token and reset auth state
                  await logout(true);
                  setError('Your profile could not be found. Please try logging in again.');
                  return;
                }
              } catch (profileError) {
                console.error('[AUTH] Critical profile error:', profileError);
                // Force logout on critical profile errors
                await logout(true);
                setError('Error retrieving your profile. Please try logging in again.');
                return;
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
        };
        
        await validateToken();
        setIsLoading(false);
      } catch (error) {
        console.error('Error checking auth status:', error);
        setUser(null);
        setIsLoading(false);
      }
    };
    
    checkAuthStatus();
  }, []);
  
  // Function to ensure a user profile exists
  const ensureUserProfile = async (userId: string) => {
    try {
      console.log('[AUTH] Ensuring user profile exists for:', userId);
      
      // Check if profile already exists
      console.log('[AUTH] Checking if profile exists...');
      let profileExists = false;
      let retryCount = 0;
      const maxRetries = 5;
      const retryDelay = 2000; // 2 seconds between retries

      // Add more robust retry logic for checking if profile exists
      while (!profileExists && retryCount < maxRetries) {
        try {
          const existingProfile = await API.getUserProfile();
          console.log('[AUTH] Profile check result:', existingProfile ? 'Found' : 'Not found');
          
          if (existingProfile) {
            console.log('[AUTH] Profile already exists, no need to create');
            profileExists = true;
            return existingProfile;
          }
        } catch (profileError) {
          console.log(`[AUTH] Profile check attempt ${retryCount + 1}/${maxRetries} failed:`, profileError);
          retryCount++;
          
          if (retryCount < maxRetries) {
            console.log(`[AUTH] Waiting ${retryDelay}ms before retrying profile check...`);
            await new Promise(resolve => setTimeout(resolve, retryDelay));
          }
        }
      }
      
      // If we got here, we need to create a profile
      console.log('[AUTH] Profile not found after retries, creating new one...');
      
      // Attempt auto-recovery: Force profile creation with max priority
      return await createProfileWithPriority(userId);
    } catch (error) {
      console.error('[AUTH] Error ensuring user profile exists:', error);
      setError('Failed to set up your profile. Please try again.');
      return null;
    }
  };
  
  /**
   * Creates a profile with maximum priority - used for profile recovery
   */
  const createProfileWithPriority = async (userId: string) => {
    console.log('[AUTH] Creating profile with maximum priority for user:', userId);
    
    // Create profile with comprehensive default values
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
    
    console.log('[AUTH] Sending priority profile creation request with data:', profileData);
    
    // Added retry mechanism with extended parameters
    let creationRetryCount = 0;
    const maxCreationRetries = 5; // Increased from 3 to 5
    const initialRetryDelay = 2000;
    
    while (creationRetryCount < maxCreationRetries) {
      try {
        // Try both profile creation endpoints with higher timeout
        try {
          console.log(`[AUTH] Attempting direct profile creation (attempt ${creationRetryCount + 1}/${maxCreationRetries})`);
          const createdProfile = await API.createUserProfile(profileData);
          console.log('[AUTH] Profile created successfully via direct endpoint:', createdProfile);
          return createdProfile;
        } catch (directError) {
          console.error('[AUTH] Direct profile creation failed, trying fallback method:', directError);
          
          // Try fallback method - creationOrUpdate
          const fallbackProfile = await API.createOrUpdateUserProfile(profileData);
          console.log('[AUTH] Profile created successfully via fallback method:', fallbackProfile);
          return fallbackProfile;
        }
      } catch (createError) {
        console.error(`[AUTH] Error creating profile (attempt ${creationRetryCount + 1}/${maxCreationRetries}):`, createError);
        creationRetryCount++;
        
        if (creationRetryCount < maxCreationRetries) {
          // Exponential backoff with jitter
          const delay = Math.pow(1.5, creationRetryCount) * initialRetryDelay + Math.random() * 1000;
          console.log(`[AUTH] Waiting ${delay}ms before retrying profile creation...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        } else {
          console.error('[AUTH] Failed to create profile after multiple attempts');
          // At this point we've tried both endpoints multiple times with backoff
          return null;
        }
      }
    }
    
    return null;
  };
  
  // Modify the register function to ensure profile creation
  const register = useCallback(async (email: string, password: string, name: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Call register API
      const response = await API.post('/auth/register', { email, password, name });
      
      // Save token
      const { token, user } = response;
      localStorage.setItem('auth_token', token);
      
      setUser(user);
      
      // Explicitly ensure profile exists
      try {
        console.log('Creating profile after registration...');
        await ensureUserProfile(user.id);
      } catch (profileError) {
        console.error('Profile creation failed but registration succeeded:', profileError);
        // Continue with registration even if profile creation fails
      }
    } catch (err) {
      setError((err as Error).message || 'Registration failed. Please try again.');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  // Modify the login function to ensure profile creation
  const login = useCallback(async (email: string, password: string, rememberMe = false) => {
    try {
      setIsLoading(true);
      setError(null);
      
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
      
      // Explicitly ensure profile exists
      try {
        console.log('Ensuring profile exists after login...');
        await ensureUserProfile(user.id);
      } catch (profileError) {
        console.error('Profile creation failed but login succeeded:', profileError);
        // Continue with login even if profile creation fails
      }
    } catch (err) {
      setError((err as Error).message || 'Login failed. Please check your credentials.');
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
      
      // Reset user state
      setUser(null);
      setIsAuthenticated(false);
      
      // Reset profile
      await resetProfile();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      if (!silent) {
        setIsLoading(false);
      }
    }
  }, [resetProfile]);
  
  // Memoized context value
  const contextValue: AuthContextType = {
    user,
    isAuthenticated,
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