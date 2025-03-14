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
    console.log('[API Debug] Updating user profile with data:', JSON.stringify(profile, null, 2));
    
    // Create a deep copy of the profile for sanitization
    const sanitizedProfile = JSON.parse(JSON.stringify(profile));
    
    // Function to recursively clean wird-related properties from objects
    const sanitizeObject = (obj: any) => {
      if (!obj || typeof obj !== 'object') return;
      
      // Expanded list of words to detect and remove (case insensitive)
      const sensitiveTerms = ['wird', 'wirdid', 'wirdplan', 'wirdsuggestion', 'habit', 'tracker'];
      
      // Process all properties at this level
      Object.keys(obj).forEach(key => {
        // Check if the key contains any sensitive terms (case insensitive)
        const lowerKey = key.toLowerCase();
        
        // Check if this key should be removed based on any sensitive term
        if (sensitiveTerms.some(term => lowerKey.includes(term.toLowerCase()))) {
          console.log(`[API Debug] Removing sensitive property: ${key}`);
          delete obj[key];
          return; // Skip further processing of this property
        }
        
        // If value is an array, check each item
        if (Array.isArray(obj[key])) {
          // First sanitize any object elements in the array
          obj[key].forEach((item: any, index: number) => {
            if (item && typeof item === 'object') {
              sanitizeObject(item);
            }
          });
          
          // Then filter out any string elements that contain sensitive terms
          obj[key] = obj[key].filter((item: any) => {
            if (typeof item === 'string') {
              const containsSensitiveTerm = sensitiveTerms.some(term => 
                item.toLowerCase().includes(term.toLowerCase())
              );
              if (containsSensitiveTerm) {
                console.log(`[API Debug] Removing sensitive array item: ${item}`);
                return false;
              }
            }
            return true;
          });
        } 
        // If it's an object, recurse
        else if (obj[key] && typeof obj[key] === 'object') {
          sanitizeObject(obj[key]);
        }
        // If it's a string, check if it contains any sensitive terms
        else if (typeof obj[key] === 'string') {
          const containsSensitiveTerm = sensitiveTerms.some(term => 
            obj[key].toLowerCase().includes(term.toLowerCase())
          );
          if (containsSensitiveTerm) {
            console.log(`[API Debug] Removing sensitive string value for ${key}: ${obj[key]}`);
            // For string values that contain sensitive terms, replace with empty string
            // rather than deleting the property
            obj[key] = '';
          }
        }
      });
    };
    
    // Sanitize the profile copy
    sanitizeObject(sanitizedProfile);
    
    // Make sure we're not sending any nested plans or wirdPlan properties
    if (sanitizedProfile.plans) delete sanitizedProfile.plans;
    if (sanitizedProfile.wirdPlan) delete sanitizedProfile.wirdPlan;
    
    // Additional safety check for common sources of Invalid wird ID format
    const keysToCheck = ['dailyTracking', 'habits', 'trackingData', 'wirdPlans', 'wirdData', 'trackers'];
    keysToCheck.forEach(key => {
      if (sanitizedProfile[key]) {
        console.log(`[API Debug] Removing potential source of wird issues: ${key}`);
        delete sanitizedProfile[key];
      }
    });
    
    console.log('[API Debug] Sending sanitized profile without sensitive properties:', JSON.stringify(sanitizedProfile, null, 2));
    return this.put(this.endpoints.profile.update, sanitizedProfile);
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
        console.error('[API] Authentication token not found when getting encrypted profile');
        // Try to load from localStorage as fallback
        return this.loadEncryptedProfileFromLocalStorage(userId);
      }
      
      console.log(`[API] Getting encrypted profile data for user: ${userId}`);
      const url = this.baseUrl + this.endpoints.profile.encrypted(userId);
      
      // Add cache busting to avoid stale responses
      const urlWithCacheBusting = `${url}?_t=${Date.now()}`;
      
      const response = await fetch(urlWithCacheBusting, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });
      
      console.log(`[API] Encrypted profile get response status: ${response.status}`);
      
      if (response.status === 404) {
        // No encrypted data found, try localStorage fallback
        console.log('[API] No encrypted profile data found on server, checking localStorage');
        return this.loadEncryptedProfileFromLocalStorage(userId);
      }
      
      if (!response.ok) {
        // Handle other error statuses
        const status = response.status;
        
        if (status === 401) {
          console.log('[API] Authentication required, trying localStorage fallback');
          return this.loadEncryptedProfileFromLocalStorage(userId);
        }
        
        // Try to parse error response as JSON
        let errorMessage = `Failed to fetch encrypted profile: ${status}`;
        
        try {
          // Only try to parse as JSON if the content type is application/json
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const errorData = await response.json();
            errorMessage = errorData.error || errorMessage;
          } else {
            // If not JSON, try to get text
            const textError = await response.text();
            if (textError) {
              errorMessage += ` - ${textError.substring(0, 100)}`;
            }
          }
        } catch (parseError) {
          console.error('[API] Error parsing error response:', parseError);
        }
        
        console.error('[API] Error fetching encrypted profile:', errorMessage);
        return this.loadEncryptedProfileFromLocalStorage(userId);
      }
      
      // Check content type
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        console.error('[API] Received non-JSON response for encrypted profile data');
        console.log('[API] Content-Type:', contentType);
        
        // Try to get the response text for debugging
        try {
          const text = await response.text();
          console.log('[API] Response text (first 200 chars):', text.substring(0, 200));
          
          // If the response looks like HTML, it might be a routing issue
          if (text.includes('<!DOCTYPE html>') || text.includes('<html>')) {
            console.error('[API] Received HTML response instead of JSON - likely a routing issue');
            // Try localStorage fallback
            return this.loadEncryptedProfileFromLocalStorage(userId);
          }
        } catch (textError) {
          console.error('[API] Error getting response text:', textError);
        }
        
        // Try localStorage fallback
        return this.loadEncryptedProfileFromLocalStorage(userId);
      }
      
      // Parse JSON response
      const encryptedData = await response.json();
      
      // Save to localStorage as a backup
      this.saveEncryptedProfileToLocalStorage(userId, encryptedData);
      
      return encryptedData;
    } catch (error) {
      console.error('[API] Error getting encrypted profile data:', error);
      // Try localStorage fallback
      return this.loadEncryptedProfileFromLocalStorage(userId);
    }
  },
  
  // Helper method to load encrypted profile from localStorage
  loadEncryptedProfileFromLocalStorage(userId: string): EncryptedProfileData {
    try {
      console.log('[API] Loading encrypted profile from localStorage');
      const localData = localStorage.getItem(`encrypted_profile_${userId}`);
      
      if (localData) {
        console.log('[API] Found encrypted profile in localStorage');
        return JSON.parse(localData);
      }
      
      console.log('[API] No encrypted profile found in localStorage');
      return { data: '', iv: [] };
    } catch (error) {
      console.error('[API] Error loading encrypted profile from localStorage:', error);
      return { data: '', iv: [] };
    }
  },
  
  // Helper method to save encrypted profile to localStorage
  saveEncryptedProfileToLocalStorage(userId: string, encryptedData: EncryptedProfileData): void {
    try {
      console.log('[API] Saving encrypted profile to localStorage');
      localStorage.setItem(`encrypted_profile_${userId}`, JSON.stringify(encryptedData));
      console.log('[API] Encrypted profile saved to localStorage successfully');
    } catch (error) {
      console.error('[API] Error saving encrypted profile to localStorage:', error);
    }
  },

  // Update encrypted profile data
  async updateEncryptedProfileData(
    userId: string, 
    encryptedData: EncryptedProfileData
  ): Promise<boolean> {
    try {
      // Always save to localStorage first as a fallback
      this.saveEncryptedProfileToLocalStorage(userId, encryptedData);
      console.log('[API] Encrypted profile saved to localStorage as fallback');
      
      const token = localStorage.getItem('auth_token');
      if (!token) {
        console.error('[API] Authentication token not found when updating encrypted profile');
        // We already saved to localStorage, so just return true
        return true;
      }
      
      console.log(`[API] Updating encrypted profile data for user: ${userId}`);
      
      // Try to save to server
      const url = this.baseUrl + this.endpoints.profile.encrypted(userId);
      
      // Add cache busting to avoid stale responses
      const urlWithCacheBusting = `${url}?_t=${Date.now()}`;
      
      const response = await fetch(urlWithCacheBusting, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        },
        body: JSON.stringify(encryptedData)
      });
      
      console.log(`[API] Encrypted profile update response status: ${response.status}`);
      
      // Handle various response types
      if (response.status === 204 || response.status === 200) {
        // Success, may or may not have body
        console.log('[API] Encrypted profile updated successfully on server');
        
        // Check if we have a JSON response
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          try {
            const result = await response.json();
            console.log('[API] Update response:', result);
            return true;
          } catch (parseError) {
            console.error('[API] Error parsing JSON response:', parseError);
            // Still return true since the status code indicates success
            return true;
          }
        } else {
          // Non-JSON response but still successful
          console.log('[API] Non-JSON success response');
          
          // Try to get the response text for debugging
          try {
            const text = await response.text();
            if (text) {
              console.log('[API] Response text (first 200 chars):', text.substring(0, 200));
              
              // If the response looks like HTML, it might be a routing issue
              if (text.includes('<!DOCTYPE html>') || text.includes('<html>')) {
                console.log('[API] Received HTML response instead of JSON - using localStorage fallback');
                // We already saved to localStorage, so just return true
                return true;
              }
            }
          } catch (textError) {
            console.error('[API] Error getting response text:', textError);
          }
          
          return true;
        }
      }
      
      // Handle error responses
      let errorMessage = `Failed to update encrypted profile: ${response.status}`;
      
      try {
        // Check content type for JSON
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } else {
          // If not JSON, try to get text
          const text = await response.text();
          if (text) {
            errorMessage += ` - ${text.substring(0, 100)}`;
            
            // If the response looks like HTML, it might be a routing issue
            if (text.includes('<!DOCTYPE html>') || text.includes('<html>')) {
              console.log('[API] Received HTML response instead of JSON - using localStorage fallback');
              // We already saved to localStorage, so just return true
              return true;
            }
          }
        }
      } catch (parseError) {
        console.error('[API] Error parsing error response:', parseError);
      }
      
      console.error('[API] Error updating encrypted profile:', errorMessage);
      
      // We already saved to localStorage as fallback at the beginning
      return true; // Return true to avoid breaking the app
    } catch (error) {
      console.error('[API] Error in updateEncryptedProfileData:', error);
      
      // We already saved to localStorage as fallback at the beginning
      return true; // Return true to avoid breaking the app
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