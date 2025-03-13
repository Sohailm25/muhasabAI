import { PublicProfile, EncryptedProfileData } from './types';

// API base URL - with improved environment detection
const getBaseUrl = () => {
  // Use environment variable if available
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  
  // In production, default to the Railway URL
  if (window.location.hostname === 'www.sahabai.dev' || window.location.hostname === 'sahabai.dev') {
    return 'https://sahabai-production.up.railway.app';
  }
  
  // In development, default to localhost:8080 (server runs on 8080 according to logs)
  return 'http://localhost:8080';
};

// Clear any existing circuit breakers on page load to prevent persistent blocking
(() => {
  try {
    Object.keys(localStorage)
      .filter(key => key.startsWith('circuit_') || key.startsWith('failures_'))
      .forEach(key => localStorage.removeItem(key));
    console.log('[API] Cleared circuit breakers at startup');
  } catch (e) {
    console.error('[API] Error clearing circuit breakers:', e);
  }
})();

const BASE_URL = getBaseUrl();
console.log('[API] Base URL configured as:', BASE_URL);

/**
 * Enhanced API client with better error handling and standardized endpoints
 */
export const API = {
  baseUrl: BASE_URL,
  
  // Standardized endpoints
  endpoints: {
    auth: {
      validate: '/api/auth/validate',
      validateWithFallback: '/auth/validate-with-fallback',
      login: '/api/auth/login',
      register: '/api/auth/register',
      google: '/api/auth/google'
    },
    profile: {
      get: '/api/profile',
      create: '/api/profile/create',
      update: '/api/profile',
      encrypted: (userId: string) => `/api/profile/${userId}/encrypted`
    }
  },
  
  /**
   * Enhanced request method with better error handling
   */
  async request(method: string, url: string, data: any = null, options: any = {}) {
    const requestOptions: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        ...options.headers
      },
      body: data ? JSON.stringify(data) : undefined,
      // Increase timeout for profile-related requests
      ...(url.includes('/profile') ? { timeout: 10000 } : {})
    };
    
    try {
      console.log(`[API] ${method} ${url} request`, { data });
      
      // Ensure URL has correct format
      const fullUrl = url.startsWith('http') ? url : this.baseUrl + url;
      
      // Add cache busting for profile requests to avoid stale responses
      const urlWithCacheBusting = url.includes('/profile') && method === 'GET' 
        ? `${fullUrl}${fullUrl.includes('?') ? '&' : '?'}_t=${Date.now()}` 
        : fullUrl;
      
      const response = await fetch(urlWithCacheBusting, requestOptions);
      console.log(`[API] ${method} ${url} response status:`, response.status);
      
      // Check content type
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const json = await response.json();
        console.log(`[API] ${method} ${url} response data:`, json);
        
        if (!response.ok) {
          const errorMessage = json.error || `HTTP error ${response.status}`;
          console.error(`[API] ${method} ${url} failed with status ${response.status}: ${errorMessage}`);
          throw new Error(errorMessage);
        }
        
        return json;
      } else {
        // Handle non-JSON responses
        const text = await response.text();
        
        if (!response.ok) {
          // Provide a more detailed error for non-JSON responses
          const errorMessage = `HTTP error ${response.status}: ${text.substring(0, 100)}${text.length > 100 ? '...' : ''}`;
          console.error(`[API] ${method} ${url} failed with non-JSON response: ${errorMessage}`);
          throw new Error(errorMessage);
        }
        
        console.log(`[API] ${method} ${url} non-JSON response: ${text.length} bytes`);
        return text;
      }
    } catch (error) {
      console.error(`[API] ${method} ${url} error:`, error);
      throw error;
    }
  },
  
  /**
   * Request with retry logic
   */
  async requestWithRetry<T>(method: string, url: string, data: any = null, options: any = {}): Promise<T> {
    const maxRetries = options.maxRetries || 3;
    const baseDelay = options.baseDelay || 1000;
    const priorityRequest = options.priority || false;
    let retries = 0;
    
    // For profile requests, we'll implement a simplified retry mechanism
    // REMOVED: Complex circuit breaker logic for profile endpoints as it was causing more problems than it solved
    const isProfileRequest = url.includes('/profile');
    
    // For profile requests, we will always clear any circuit breakers to prevent dead loops
    if (isProfileRequest) {
      const circuitKeys = Object.keys(localStorage)
        .filter(key => key.startsWith('circuit_') && key.includes('/profile'));
      
      if (circuitKeys.length > 0) {
        console.log(`[API] Clearing ${circuitKeys.length} profile circuit breakers`);
        circuitKeys.forEach(key => localStorage.removeItem(key));
      }
    }
    
    // Simpler retry mechanism without circuit breakers for profile endpoints
    while (retries < maxRetries) {
      try {
        // Ensure URL is properly formatted with base URL
        let fullUrl = url;
        if (!url.startsWith('http')) {
          // Make sure URL has leading slash if needed
          if (!url.startsWith('/')) {
            fullUrl = '/' + url;
          }
          fullUrl = this.baseUrl + fullUrl;
        }
        
        console.log(`[API] Retry ${retries}/${maxRetries}: ${method} ${fullUrl}`);
        
        // Use the properly formatted URL in the request
        const result = await this.request(method, fullUrl, data, options);
        return result as T;
      } catch (error) {
        retries++;
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        
        console.error(`[API] Attempt ${retries}/${maxRetries} failed for ${method} ${url}: ${errorMessage}`);
        
        // Special handling for profile 404 errors
        if (isProfileRequest && errorMessage.includes('not found') && method === 'GET') {
          console.log('[API] Profile not found, will attempt to create it automatically');
          
          if (options.autoCreateProfile !== false) {
            try {
              // Try to create a profile automatically
              return await this.createDefaultProfile() as T;
            } catch (createError) {
              console.error('[API] Failed to auto-create profile:', createError);
            }
          }
        }
        
        if (retries >= maxRetries) {
          throw error;
        }
        
        // Exponential backoff with jitter
        const delay = Math.min(
          Math.pow(1.5, retries) * baseDelay + Math.random() * baseDelay,
          10000 // Cap at 10 seconds
        );
        console.log(`[API] Retrying ${method} ${url} in ${delay}ms (${retries}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    // This should never be reached due to the throw in the loop above
    throw new Error(`Failed to ${method} ${url} after ${maxRetries} attempts`);
  },
  
  /**
   * GET request
   */
  async get<T>(endpoint: string, options = {}): Promise<T> {
    return this.requestWithRetry<T>('GET', endpoint, null, options);
  },
  
  /**
   * POST request
   */
  async post<T>(endpoint: string, data = {}, options = {}): Promise<T> {
    return this.requestWithRetry<T>('POST', endpoint, data, options);
  },
  
  /**
   * PUT request
   */
  async put<T>(endpoint: string, data = {}, options = {}): Promise<T> {
    return this.requestWithRetry<T>('PUT', endpoint, data, options);
  },
  
  /**
   * DELETE request
   */
  async delete<T>(endpoint: string, options = {}): Promise<T> {
    return this.requestWithRetry<T>('DELETE', endpoint, null, options);
  },
  
  /**
   * Create a default profile when none exists
   */
  async createDefaultProfile(): Promise<any> {
    console.log('[API] Creating default profile as none exists');
    
    try {
      // Get current user ID from token validation
      const userData: { id: string } = await this.validateToken();
      
      if (!userData || !userData.id) {
        throw new Error('Cannot create profile: No authenticated user');
      }
      
      // Create default profile data
      const profileData: {
        userId: string;
        generalPreferences: {
          inputMethod: string;
          reflectionFrequency: string;
          languagePreferences: string;
          theme: string;
          fontSize: string;
        };
        privacySettings: {
          localStorageOnly: boolean;
          allowPersonalization: boolean;
          enableSync: boolean;
          shareAnonymousUsageData: boolean;
        };
      } = {
        userId: userData.id,
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
      
      console.log('[API] Attempting to create default profile with data:', profileData);
      
      // Try both profile creation endpoints
      try {
        // First try the dedicated create endpoint
        return await this.post(this.endpoints.profile.create, profileData, {
          priority: true,
          maxRetries: 2
        });
      } catch (createError) {
        console.error('[API] Default profile creation failed, trying fallback:', createError);
        
        // Try fallback method
        return await this.post(this.endpoints.profile.get, profileData, {
          priority: true,
          maxRetries: 2
        });
      }
    } catch (error) {
      console.error('[API] Failed to create default profile:', error);
      throw error;
    }
  },
  
  /**
   * Validate authentication token
   */
  async validateToken(): Promise<any> {
    console.log('[API] Validating authentication token');
    
    try {
      // First try the new endpoint with fallback
      console.log('[API] Trying validateWithFallback endpoint');
      return await this.get(this.endpoints.auth.validateWithFallback);
    } catch (error) {
      console.log('[API] validateWithFallback failed, trying regular validate endpoint');
      
      // Fall back to the regular validate endpoint
      try {
        return await this.get(this.endpoints.auth.validate);
      } catch (secondError) {
        console.error('[API] Both validation endpoints failed');
        throw secondError;
      }
    }
  },
  
  /**
   * Get user profile with enhanced error handling and auto-creation
   */
  async getUserProfile(userId?: string) {
    console.log('[API] Getting user profile');
    const endpoint = userId ? `${this.endpoints.profile.get}/${userId}` : this.endpoints.profile.get;
    
    try {
      return await this.get(endpoint, { autoCreateProfile: true });
    } catch (error) {
      // Handle profile not found by auto-creating
      if (error instanceof Error && (
          error.message.includes('404') || 
          error.message.includes('not found')
      )) {
        console.log('[API] Profile not found, attempting to create automatically');
        
        try {
          return await this.createDefaultProfile();
        } catch (createError) {
          console.error('[API] Auto-creation failed:', createError);
          throw new Error(`Profile not found and creation failed: ${createError instanceof Error ? createError.message : 'Unknown error'}`);
        }
      }
      
      // Re-throw other errors
      throw error;
    }
  },
  
  /**
   * Create user profile with enhanced error handling
   */
  async createUserProfile(profile: any, options: any = {}) {
    console.log('[API] Creating user profile');
    
    try {
      return await this.post(this.endpoints.profile.create, profile, {
        priority: options.priority || false,
        maxRetries: options.maxRetries || 3
      });
    } catch (error) {
      // Enhance error with more context
      if (error instanceof Error) {
        console.error('[API] Profile creation failed with error:', error.message);
        throw new Error(`Profile creation failed: ${error.message}`);
      }
      throw error;
    }
  },
  
  /**
   * Update user profile
   */
  async updateUserProfile(profile: any) {
    console.log('[API] Updating user profile');
    return this.put(this.endpoints.profile.update, profile);
  },
  
  /**
   * Create or update user profile with enhanced recovery options
   */
  async createOrUpdateUserProfile(profileData: any, options: any = {}) {
    console.log('[API] Creating or updating user profile with data:', profileData);
    
    try {
      // First try the new endpoint
      console.log('[API] Trying new /api/profile/create endpoint');
      try {
        const response = await this.post(this.endpoints.profile.create, profileData, {
          priority: options.priority || false,
          maxRetries: options.maxRetries || 3
        });
        console.log('[API] Profile created/updated successfully using new endpoint');
        return response;
      } catch (createError) {
        // If the endpoint doesn't exist or returns 404, try fallback
        console.log(`[API] New endpoint failed: ${createError instanceof Error ? createError.message : 'Unknown error'}`);
        
        // Try legacy endpoint as fallback
        console.log('[API] Falling back to regular /api/profile endpoint');
        const fallbackResponse = await this.post(this.endpoints.profile.get, profileData, {
          priority: options.priority || false,
          maxRetries: options.maxRetries || 3
        });
        console.log('[API] Profile created/updated successfully using fallback endpoint');
        return fallbackResponse;
      }
    } catch (error) {
      console.error('[API] Both profile endpoints failed');
      throw error;
    }
  },

  // Get encrypted profile data
  async getEncryptedProfileData(userId: string): Promise<EncryptedProfileData> {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        console.error('Authentication token not found when getting encrypted profile');
        throw new Error('Authentication token not found');
      }
      
      console.log(`[API] Getting encrypted profile data for user: ${userId}`);
      const url = this.baseUrl + this.endpoints.profile.encrypted(userId);
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log(`[API] Encrypted profile get response status: ${response.status}`);
      
      if (response.status === 404) {
        // No encrypted data found, return empty
        console.log('[API] No encrypted profile data found, returning empty data');
        return { data: '', iv: [] };
      }
      
      if (!response.ok) {
        // Handle other error statuses
        const status = response.status;
        
        if (status === 401) {
          throw new Error('Authentication required');
        }
        
        // Try to parse error response as JSON
        let errorMessage = `Failed to fetch encrypted profile: ${status}`;
        
        try {
          // Only try to parse as JSON if the content type is application/json
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const errorData = await response.json();
            errorMessage = errorData.error || errorMessage;
          }
        } catch (parseError) {
          // If JSON parsing fails, try to get text
          try {
            const textError = await response.text();
            if (textError) {
              errorMessage += ` - ${textError.substring(0, 100)}`;
            }
          } catch (textError) {
            // Ignore text parsing errors
          }
        }
        
        throw new Error(errorMessage);
      }
      
      // Check content type
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        console.error('[API] Received non-JSON response for encrypted profile data');
        throw new Error('Invalid response format: expected JSON');
      }
      
      return await response.json();
    } catch (error) {
      console.error('[API] Error getting encrypted profile data:', error);
      throw error;
    }
  },

  // Update encrypted profile data
  async updateEncryptedProfileData(
    userId: string, 
    encryptedData: EncryptedProfileData
  ): Promise<boolean> {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        console.error('Authentication token not found when updating encrypted profile');
        throw new Error('Authentication token not found');
      }
      
      console.log(`[API] Updating encrypted profile data for user: ${userId}`);
      const url = this.baseUrl + this.endpoints.profile.encrypted(userId);
      
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(encryptedData)
      });
      
      console.log(`[API] Encrypted profile update response status: ${response.status}`);
      
      // Handle various response types
      if (response.status === 204 || response.status === 200) {
        // Success, may or may not have body
        console.log('[API] Encrypted profile updated successfully');
        return true;
      }
      
      // Try to parse error response as JSON
      let errorMessage = `Failed to update encrypted profile: ${response.status}`;
      
      try {
        // Only try to parse as JSON if the content type is application/json
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        }
      } catch (parseError) {
        // If JSON parsing fails, try to get text
        try {
          const textError = await response.text();
          if (textError) {
            errorMessage += ` - ${textError.substring(0, 100)}`;
          }
        } catch (textError) {
          // Ignore text parsing errors
        }
      }
      
      throw new Error(errorMessage);
    } catch (error) {
      console.error('[API] Error updating encrypted profile data:', error);
      throw error;
    }
  },

  /**
   * Delete user profile
   */
  async deleteUserProfile(): Promise<boolean> {
    console.log('[API] Deleting user profile');
    await this.delete(this.endpoints.profile.get);
    return true;
  },
}; 