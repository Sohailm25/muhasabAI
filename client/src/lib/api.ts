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

export const api = {
  baseUrl: BASE_URL,

  // Generic GET request
  async get(endpoint: string, options = {}) {
    const token = localStorage.getItem('auth_token');
    
    // For validation endpoint, return early with error if no token exists
    if (endpoint === '/auth/validate' && !token) {
      console.log('[API Debug] No token found for validation request, skipping');
      throw new Error('No authentication token');
    }
    
    // Check if this is an endpoint requiring auth
    const requiresAuth = endpoint.startsWith('/api/') || 
                       (endpoint.includes('/auth/') && !endpoint.includes('/auth/validate'));
                       
    if (requiresAuth && !token) {
      console.error(`[API Debug] Authentication required for ${endpoint} but no token found`);
      throw new Error('Authentication required');
    }
    
    try {
      const response = await fetch(`${BASE_URL}${endpoint}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        ...options
      });

      if (!response.ok) {
        const status = response.status;
        if (status === 401) {
          console.log('[API Debug] Received 401, clearing invalid token');
          // For 401 errors, clear the token as it's invalid
          if (token) {
            localStorage.removeItem('auth_token');
            // Attempt to logout to clean up server-side
            try {
              await fetch(`${BASE_URL}/auth/logout`, {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${token}`
                }
              });
            } catch (logoutError) {
              console.error('[API Debug] Error during logout cleanup:', logoutError);
            }
          }
          throw new Error('Authentication required');
        }
        throw new Error(`API error: ${status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      // Rethrow with better context
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`[API Debug] API error for ${endpoint}: ${errorMessage}`);
      throw error;
    }
  },

  // Generic POST request
  async post(endpoint: string, data = {}, options = {}) {
    const token = localStorage.getItem('auth_token');
    
    // Check if this is an endpoint requiring auth
    const requiresAuth = endpoint.startsWith('/api/') || 
                        (endpoint.includes('/auth/') && 
                         !endpoint.includes('/auth/login') && 
                         !endpoint.includes('/auth/register'));
                         
    if (requiresAuth && !token) {
      console.error(`Authentication required for ${endpoint} but no token found`);
      throw new Error('Authentication required');
    }
    
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
      },
      body: JSON.stringify(data),
      ...options
    });

    if (!response.ok) {
      const status = response.status;
      if (status === 401) {
        throw new Error('Authentication required');
      }
      throw new Error(`API error: ${status}`);
    }

    return await response.json();
  },

  // Generic PUT request
  async put(endpoint: string, data = {}, options = {}) {
    const token = localStorage.getItem('auth_token');
    
    // Check if this is an endpoint requiring auth
    const requiresAuth = endpoint.startsWith('/api/');
                         
    if (requiresAuth && !token) {
      console.error(`Authentication required for ${endpoint} but no token found`);
      throw new Error('Authentication required');
    }
    
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
      },
      body: JSON.stringify(data),
      ...options
    });

    if (!response.ok) {
      const status = response.status;
      if (status === 401) {
        throw new Error('Authentication required');
      }
      throw new Error(`API error: ${status}`);
    }

    return await response.json();
  },

  // Create user profile
  async createUserProfile(profile: Partial<PublicProfile>): Promise<PublicProfile> {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      console.error('Authentication token not found when creating profile');
      throw new Error('Authentication token not found');
    }
    
    console.log('Creating profile with token:', token ? 'Token exists' : 'No token');
    console.log('Profile data being sent:', JSON.stringify(profile));
    
    try {
      const response = await fetch(`${BASE_URL}/api/profile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(profile)
      });

      console.log('Profile creation response status:', response.status);
      
      if (!response.ok) {
        const status = response.status;
        if (status === 409) {
          console.log('Profile already exists (409 status)');
          // If profile already exists, try to get it instead
          return await this.getUserProfile();
        }
        if (status === 401) {
          console.error('Authentication failed when creating profile');
          throw new Error('Authentication required');
        }
        
        // Try to get error details from response
        try {
          const errorData = await response.json();
          console.error('Profile creation error details:', errorData);
        } catch (e) {
          console.error('Could not parse error response');
        }
        
        throw new Error(`Failed to create profile: ${status}`);
      }

      const data = await response.json();
      console.log('Profile created successfully:', data);
      return data;
    } catch (error) {
      console.error('Error in createUserProfile:', error);
      throw error;
    }
  },

  // Get user profile
  async getUserProfile(userId?: string): Promise<PublicProfile> {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      console.error('Authentication token not found when getting profile');
      throw new Error('Authentication token not found');
    }
    
    const url = userId ? `/api/profile/${userId}` : '/api/profile';
    const response = await fetch(`${BASE_URL}${url}`, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const status = response.status;
      if (status === 401) {
        console.error('Authentication failed when fetching profile');
        throw new Error('Failed to fetch profile: Authentication required');
      }
      if (status === 404) {
        console.log('Profile not found');
        throw new Error('Profile not found');
      }
      throw new Error(`Failed to fetch profile: ${status}`);
    }

    return await response.json();
  },

  // Update user profile
  async updateUserProfile(profile: Partial<PublicProfile>): Promise<PublicProfile> {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      console.error('Authentication token not found when updating profile');
      throw new Error('Authentication token not found');
    }
    
    const response = await fetch(`${BASE_URL}/api/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(profile)
    });

    if (!response.ok) {
      const status = response.status;
      if (status === 401) {
        throw new Error('Authentication required');
      }
      throw new Error(`Failed to update profile: ${status}`);
    }

    return await response.json();
  },

  // Delete user profile
  async deleteUserProfile(): Promise<boolean> {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      console.error('Authentication token not found when deleting profile');
      throw new Error('Authentication token not found');
    }
    
    const response = await fetch(`${BASE_URL}/api/profile`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const status = response.status;
      if (status === 401) {
        throw new Error('Authentication required');
      }
      throw new Error(`Failed to delete profile: ${status}`);
    }

    return true;
  },

  // Get encrypted profile data
  async getEncryptedProfileData(userId: string): Promise<EncryptedProfileData> {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      console.error('Authentication token not found when getting encrypted profile');
      throw new Error('Authentication token not found');
    }
    
    const response = await fetch(`${BASE_URL}/api/profile/${userId}/encrypted`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      if (response.status === 404) {
        // No encrypted data found, return empty
        return { data: '', iv: [] };
      }
      const status = response.status;
      if (status === 401) {
        throw new Error('Authentication required');
      }
      throw new Error(`Failed to fetch encrypted profile: ${status}`);
    }

    return await response.json();
  },

  // Update encrypted profile data
  async updateEncryptedProfileData(
    userId: string, 
    encryptedData: EncryptedProfileData
  ): Promise<boolean> {
    const response = await fetch(`/api/profile/${userId}/encrypted`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`
      },
      body: JSON.stringify(encryptedData)
    });

    if (!response.ok) {
      throw new Error(`Failed to update encrypted profile: ${response.status}`);
    }

    return true;
  },

  /**
   * Create or update user profile
   */
  async createOrUpdateUserProfile(profileData: any): Promise<any> {
    console.log('[API] Creating or updating user profile with data:', profileData);
    
    try {
      // First try the new endpoint
      console.log('[API] Trying new /api/profile/create endpoint');
      const response = await fetch(`${BASE_URL}/api/profile/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify(profileData)
      });
      
      if (!response.ok) {
        console.log(`[API] New endpoint failed with status: ${response.status}`);
        
        // If the new endpoint fails, try the old endpoint
        console.log('[API] Falling back to /api/profile endpoint');
        const fallbackResponse = await fetch(`${BASE_URL}/api/profile`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
          },
          body: JSON.stringify(profileData)
        });
        
        if (!fallbackResponse.ok) {
          console.error(`[API] Both endpoints failed. Status: ${fallbackResponse.status}`);
          throw new Error(`Failed to create profile: ${fallbackResponse.status}`);
        }
        
        return await fallbackResponse.json();
      }
      
      console.log('[API] Profile created/updated successfully using new endpoint');
      return await response.json();
    } catch (error) {
      console.error('[API] Error creating/updating profile:', error);
      throw error;
    }
  }
}; 