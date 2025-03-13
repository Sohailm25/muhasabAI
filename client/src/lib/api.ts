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
      body: data ? JSON.stringify(data) : undefined
    };
    
    try {
      console.log(`[API] ${method} ${url} request`, { data });
      
      // Ensure URL has correct format
      const fullUrl = url.startsWith('http') ? url : this.baseUrl + url;
      const response = await fetch(fullUrl, requestOptions);
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
  async requestWithRetry(method: string, url: string, data: any = null, options: any = {}) {
    const maxRetries = options.maxRetries || 3;
    const baseDelay = options.baseDelay || 1000;
    const priorityRequest = options.priority || false;
    let retries = 0;
    
    // For profile requests, we'll implement a basic circuit breaker
    const isProfileRequest = url.includes('/profile');
    const circuitKey = `circuit_${method}_${url.split('?')[0]}`;
    
    // For priority requests, always clear any open circuit
    if (priorityRequest && isProfileRequest) {
      console.log(`[API] Priority request detected, clearing any open circuit for ${url}`);
      localStorage.removeItem(circuitKey);
      
      // Also clear any failure counters
      localStorage.removeItem(`failures_${method}_${url.split('?')[0]}`);
    }
    
    // Check if circuit is open (too many failures)
    if (isProfileRequest && localStorage.getItem(circuitKey)) {
      const circuitData = JSON.parse(localStorage.getItem(circuitKey) || '{}');
      const now = Date.now();
      
      if (circuitData.openUntil && circuitData.openUntil > now && !priorityRequest) {
        console.log(`[API] Circuit open for ${url}, blocking request until ${new Date(circuitData.openUntil).toISOString()}`);
        throw new Error(`Service temporarily unavailable (circuit open): ${url}`);
      } else if (circuitData.openUntil && circuitData.openUntil <= now) {
        // Circuit timeout expired, clear it
        console.log(`[API] Circuit timeout expired for ${url}, resetting`);
        localStorage.removeItem(circuitKey);
      }
    }
    
    // Track consecutive failures for this endpoint
    let consecutiveFailures = 0;
    if (isProfileRequest) {
      const failureData = localStorage.getItem(`failures_${method}_${url.split('?')[0]}`);
      if (failureData) {
        consecutiveFailures = parseInt(failureData, 10);
      }
    }
    
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
        
        // On success, reset failure count
        if (isProfileRequest) {
          localStorage.removeItem(`failures_${method}_${url.split('?')[0]}`);
          console.log(`[API] Success: Cleared failure count for ${url}`);
        }
        
        return result;
      } catch (error) {
        retries++;
        
        // For profile requests, track consecutive failures
        if (isProfileRequest) {
          consecutiveFailures++;
          localStorage.setItem(`failures_${method}_${url.split('?')[0]}`, consecutiveFailures.toString());
          
          // If too many consecutive failures, open circuit breaker
          if (consecutiveFailures >= 5 && !priorityRequest) {
            const openUntil = Date.now() + (10 * 1000); // 10 seconds (reduced from 30)
            localStorage.setItem(circuitKey, JSON.stringify({ openUntil }));
            console.log(`[API] Opening circuit for ${url} until ${new Date(openUntil).toISOString()} due to ${consecutiveFailures} consecutive failures`);
          }
        }
        
        if (retries >= maxRetries) {
          // Enhanced error logging for profile requests
          if (isProfileRequest) {
            console.error(`[API] All ${maxRetries} retries failed for profile request:`, {
              url,
              method,
              consecutiveFailures,
              error: error instanceof Error ? error.message : 'Unknown error'
            });
          }
          throw error;
        }
        
        // Exponential backoff with jitter
        const delay = Math.pow(2, retries) * baseDelay + Math.random() * baseDelay;
        console.log(`[API] Retrying ${method} ${url} in ${delay}ms (${retries}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  },
  
  /**
   * GET request
   */
  async get(endpoint: string, options = {}) {
    return this.requestWithRetry('GET', endpoint, null, options);
  },
  
  /**
   * POST request
   */
  async post(endpoint: string, data = {}, options = {}) {
    return this.requestWithRetry('POST', endpoint, data, options);
  },
  
  /**
   * PUT request
   */
  async put(endpoint: string, data = {}, options = {}) {
    return this.requestWithRetry('PUT', endpoint, data, options);
  },
  
  /**
   * DELETE request
   */
  async delete(endpoint: string, options = {}) {
    return this.requestWithRetry('DELETE', endpoint, null, options);
  },
  
  /**
   * Validate authentication token
   */
  async validateToken() {
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
   * Get user profile with enhanced error handling
   */
  async getUserProfile(userId?: string) {
    console.log('[API] Getting user profile');
    const endpoint = userId ? `${this.endpoints.profile.get}/${userId}` : this.endpoints.profile.get;
    
    try {
      return await this.get(endpoint);
    } catch (error) {
      // Handle profile not found by providing a clearer error
      if (error instanceof Error && (
          error.message.includes('404') || 
          error.message.includes('not found')
      )) {
        console.log('[API] Profile not found, throwing formatted error');
        throw new Error('Profile not found');
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
    
    // Track attempts for this specific user
    const userId = profileData.userId;
    if (userId) {
      const attemptKey = `profile_create_attempts_${userId}`;
      const currentAttempts = parseInt(localStorage.getItem(attemptKey) || '0', 10);
      localStorage.setItem(attemptKey, (currentAttempts + 1).toString());
      
      // If we've tried too many times for this user, add delay
      if (currentAttempts > 5 && !options.priority) {
        const delay = Math.min(currentAttempts * 1000, 10000); // Max 10 second delay
        console.log(`[API] Adding ${delay}ms delay before profile creation due to ${currentAttempts} previous attempts`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    try {
      // First try the new endpoint
      console.log('[API] Trying new /api/profile/create endpoint');
      try {
        const response = await this.post(this.endpoints.profile.create, profileData, {
          priority: options.priority || false,
          maxRetries: options.maxRetries || 3
        });
        console.log('[API] Profile created/updated successfully using new endpoint');
        
        // On success, reset attempt counter
        if (userId) {
          localStorage.removeItem(`profile_create_attempts_${userId}`);
        }
        
        return response;
      } catch (createError) {
        // If the endpoint doesn't exist or returns 404, try fallback
        console.log(`[API] New endpoint failed: ${createError instanceof Error ? createError.message : 'Unknown error'}`);
        
        // If the new endpoint fails with anything other than 404, it might be a data issue
        // In that case, we should propagate the original error
        if (createError instanceof Error && 
            !createError.message.includes('404') && 
            !createError.message.includes('not found')) {
          throw createError;
        }
        
        // Try legacy endpoint as fallback
        console.log('[API] Falling back to regular /api/profile endpoint');
        const fallbackResponse = await this.post(this.endpoints.profile.get, profileData, {
          priority: options.priority || false,
          maxRetries: options.maxRetries || 3
        });
        console.log('[API] Profile created/updated successfully using fallback endpoint');
        
        // On success, reset attempt counter
        if (userId) {
          localStorage.removeItem(`profile_create_attempts_${userId}`);
        }
        
        return fallbackResponse;
      }
    } catch (error) {
      console.error('[API] Both profile endpoints failed');
      
      // Enhance error with attempt information
      if (userId) {
        const attempts = localStorage.getItem(`profile_create_attempts_${userId}`);
        console.error(`[API] This is attempt ${attempts} for user ${userId}`);
      }
      
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