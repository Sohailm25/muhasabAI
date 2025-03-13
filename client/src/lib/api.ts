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
  
  // In development, default to localhost
  return 'http://localhost:3000';
};

const BASE_URL = getBaseUrl();
console.log('API Base URL configured as:', BASE_URL);

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
      update: '/api/profile'
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
      
      const response = await fetch(this.baseUrl + url, requestOptions);
      console.log(`[API] ${method} ${url} response status:`, response.status);
      
      // Check content type
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const json = await response.json();
        console.log(`[API] ${method} ${url} response data:`, json);
        
        if (!response.ok) {
          throw new Error(json.error || `HTTP error ${response.status}`);
        }
        
        return json;
      } else {
        // Handle non-JSON responses
        const text = await response.text();
        console.error(`[API] Received non-JSON response for ${method} ${url}:`, text.substring(0, 200));
        throw new Error(`Received non-JSON response: ${response.status}`);
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
    let retries = 0;
    
    while (retries < maxRetries) {
      try {
        return await this.request(method, url, data, options);
      } catch (error) {
        retries++;
        
        if (retries >= maxRetries) {
          throw error;
        }
        
        // Exponential backoff
        const delay = Math.pow(2, retries) * 1000 + Math.random() * 1000;
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
   * Get user profile
   */
  async getUserProfile(userId?: string) {
    console.log('[API] Getting user profile');
    const endpoint = userId ? `${this.endpoints.profile.get}/${userId}` : this.endpoints.profile.get;
    return this.get(endpoint);
  },
  
  /**
   * Create user profile
   */
  async createUserProfile(profile: any) {
    console.log('[API] Creating user profile');
    return this.post(this.endpoints.profile.create, profile);
  },
  
  /**
   * Update user profile
   */
  async updateUserProfile(profile: any) {
    console.log('[API] Updating user profile');
    return this.put(this.endpoints.profile.update, profile);
  },
  
  /**
   * Create or update user profile
   */
  async createOrUpdateUserProfile(profileData: any) {
    console.log('[API] Creating or updating user profile with data:', profileData);
    
    try {
      // First try the new endpoint
      console.log('[API] Trying new /api/profile/create endpoint');
      const response = await this.post(this.endpoints.profile.create, profileData);
      console.log('[API] Profile created/updated successfully using new endpoint');
      return response;
    } catch (error) {
      console.log(`[API] New endpoint failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      
      // If the new endpoint fails, try the regular endpoint
      console.log('[API] Falling back to regular /api/profile endpoint');
      try {
        const fallbackResponse = await this.post(this.endpoints.profile.get, profileData);
        console.log('[API] Profile created/updated successfully using fallback endpoint');
        return fallbackResponse;
      } catch (fallbackError) {
        console.error('[API] Both endpoints failed');
        throw fallbackError;
      }
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
      const url = `${this.baseUrl}/api/profile/${userId}/encrypted`;
      
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
      const url = `${this.baseUrl}/api/profile/${userId}/encrypted`;
      
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