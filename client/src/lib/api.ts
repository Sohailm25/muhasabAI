import { PublicProfile, EncryptedProfileData } from './types';

export const api = {
  // Create user profile
  async createUserProfile(profile: Partial<PublicProfile>): Promise<PublicProfile> {
    const response = await fetch('/api/profile', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(profile)
    });

    if (!response.ok) {
      throw new Error(`Failed to create profile: ${response.status}`);
    }

    return await response.json();
  },

  // Get user profile
  async getUserProfile(userId?: string): Promise<PublicProfile> {
    const url = userId ? `/api/profile/${userId}` : '/api/profile';
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Failed to fetch profile: ${response.status}`);
    }

    return await response.json();
  },

  // Update user profile
  async updateUserProfile(profile: Partial<PublicProfile>): Promise<PublicProfile> {
    const response = await fetch('/api/profile', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(profile)
    });

    if (!response.ok) {
      throw new Error(`Failed to update profile: ${response.status}`);
    }

    return await response.json();
  },

  // Delete user profile
  async deleteUserProfile(): Promise<boolean> {
    const response = await fetch('/api/profile', {
      method: 'DELETE'
    });

    if (!response.ok) {
      throw new Error(`Failed to delete profile: ${response.status}`);
    }

    return true;
  },

  // Get encrypted profile data
  async getEncryptedProfileData(userId: string): Promise<EncryptedProfileData> {
    const response = await fetch(`/api/profile/${userId}/encrypted`);

    if (!response.ok) {
      if (response.status === 404) {
        // No encrypted data found, return empty
        return { data: '', iv: [] };
      }
      throw new Error(`Failed to fetch encrypted profile: ${response.status}`);
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
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(encryptedData)
    });

    if (!response.ok) {
      throw new Error(`Failed to update encrypted profile: ${response.status}`);
    }

    return true;
  }
}; 