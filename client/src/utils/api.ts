/**
 * API utility functions for the client
 */

/**
 * Gets the base API URL from environment variables
 * @returns The base API URL for the application
 */
export function getApiUrl(): string {
  return import.meta.env.VITE_API_URL || '';
}

/**
 * Gets the authentication token from local storage
 * @returns The authentication token or null if not found
 */
export function getAuthToken(): string | null {
  return localStorage.getItem('auth_token');
}

/**
 * Creates an authorization header object with the Bearer token
 * @returns The headers object with Authorization set if a token exists
 */
export function getAuthHeaders(): Record<string, string> {
  const token = getAuthToken();
  return token 
    ? { 'Authorization': `Bearer ${token}` }
    : {};
} 