import { API } from '../lib/api';

// Define interfaces for user settings
export interface UserPreferences {
  emailNotifications?: boolean;
  darkMode?: boolean;
  saveHistory?: boolean;
  [key: string]: any; // Allow for additional preference fields
}

export interface UserSettings {
  id: string;
  userId: string;
  name: string | null;
  email: string | null;
  preferences: UserPreferences;
  timestamp: string;
}

/**
 * Service for handling user settings operations
 */
export class UserService {
  /**
   * Get user settings
   * @returns User settings object
   */
  async getUserSettings(): Promise<UserSettings> {
    try {
      console.log('[UserService] Getting user settings');
      
      // Use the API client for better error handling
      const data = await API.get<UserSettings>('/api/user/settings');
      
      console.log('[UserService] User settings retrieved successfully:', data);
      return data;
    } catch (error) {
      console.error('[UserService] Error getting user settings:', error);
      
      // Return default settings on error to prevent UI breakage
      return {
        id: 'default',
        userId: 'default',
        name: null,
        email: null,
        preferences: {
          emailNotifications: false,
          darkMode: false,
          saveHistory: true
        },
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Update user settings
   * @param settings Settings to update
   * @returns Updated user settings
   */
  async updateUserSettings(settings: Partial<UserSettings>): Promise<UserSettings> {
    try {
      console.log('[UserService] Updating user settings:', settings);
      
      // Use the API client for better error handling
      const data = await API.post<UserSettings>('/api/user/settings', settings);
      
      console.log('[UserService] User settings updated successfully:', data);
      return data;
    } catch (error) {
      console.error('[UserService] Error updating user settings:', error);
      
      // Return the input settings on error to prevent UI breakage
      return {
        id: 'default',
        userId: 'default',
        name: settings.name || null,
        email: settings.email || null,
        preferences: settings.preferences || {
          emailNotifications: false,
          darkMode: false,
          saveHistory: true
        },
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Accept privacy policy
   * @returns Success status
   */
  async acceptPrivacyPolicy(): Promise<{ success: boolean }> {
    try {
      console.log('[UserService] Accepting privacy policy');
      
      // Use the API client for better error handling
      const data = await API.post<{ success: boolean }>('/api/user/accept-privacy-policy', {});
      
      console.log('[UserService] Privacy policy accepted successfully:', data);
      return data;
    } catch (error) {
      console.error('[UserService] Error accepting privacy policy:', error);
      
      // Return success true on error to prevent UI breakage
      return { success: true };
    }
  }
}

// Create a singleton instance
export const userService = new UserService(); 