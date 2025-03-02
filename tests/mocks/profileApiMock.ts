/**
 * Mock implementation of the Profile API for testing
 */

// Mock profile data
export const mockProfiles = {
  'user-123': {
    id: 'user-123',
    username: 'testuser',
    preferences: {
      theme: 'light',
      language: 'en',
      notifications: true
    },
    privacy: {
      storeLocalReflections: true,
      allowPersonalization: true,
      enableEncryptedSync: false
    },
    created_at: '2023-08-15T10:30:00Z',
    updated_at: '2023-08-15T10:30:00Z'
  },
  'user-456': {
    id: 'user-456',
    username: 'privateuser',
    preferences: {
      theme: 'dark',
      language: 'ar',
      notifications: false
    },
    privacy: {
      storeLocalReflections: false,
      allowPersonalization: true,
      enableEncryptedSync: true
    },
    created_at: '2023-08-10T08:20:00Z',
    updated_at: '2023-08-12T14:15:00Z'
  }
};

// Mock encrypted profiles
export const mockEncryptedProfiles = {
  'user-456': {
    id: 'user-456',
    user_id: 'user-456',
    encrypted_data: 'eyJkYXRhIjoiZW5jcnlwdGVkIGRhdGEgaGVyZSJ9',
    iv: 'aXYxMjM0NTY3ODkwMQ==',
    created_at: '2023-08-12T14:15:00Z',
    updated_at: '2023-08-12T14:15:00Z'
  }
};

// Mock profile API implementation
export const profileApiMock = {
  // Profiles API
  getProfile: jest.fn().mockImplementation(async (userId: string) => {
    if (mockProfiles[userId]) {
      return { success: true, data: mockProfiles[userId] };
    }
    return { success: false, error: 'Profile not found' };
  }),

  createProfile: jest.fn().mockImplementation(async (userId: string, profileData: any) => {
    // Simulate profile creation
    const profile = {
      id: userId,
      ...profileData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    mockProfiles[userId] = profile;
    return { success: true, data: profile };
  }),

  updateProfile: jest.fn().mockImplementation(async (userId: string, profileData: any) => {
    if (!mockProfiles[userId]) {
      return { success: false, error: 'Profile not found' };
    }
    
    // Simulate profile update
    const updatedProfile = {
      ...mockProfiles[userId],
      ...profileData,
      updated_at: new Date().toISOString()
    };
    
    mockProfiles[userId] = updatedProfile;
    return { success: true, data: updatedProfile };
  }),

  deleteProfile: jest.fn().mockImplementation(async (userId: string) => {
    if (!mockProfiles[userId]) {
      return { success: false, error: 'Profile not found' };
    }
    
    // Simulate profile deletion
    delete mockProfiles[userId];
    return { success: true };
  }),

  // Encrypted Profiles API
  getEncryptedProfile: jest.fn().mockImplementation(async (userId: string) => {
    if (mockEncryptedProfiles[userId]) {
      return { success: true, data: mockEncryptedProfiles[userId] };
    }
    return { success: false, error: 'Encrypted profile not found' };
  }),

  createEncryptedProfile: jest.fn().mockImplementation(async (userId: string, encryptedData: string, iv: string) => {
    // Simulate encrypted profile creation
    const encryptedProfile = {
      id: `encrypted-${userId}`,
      user_id: userId,
      encrypted_data: encryptedData,
      iv,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    mockEncryptedProfiles[userId] = encryptedProfile;
    return { success: true, data: encryptedProfile };
  }),

  updateEncryptedProfile: jest.fn().mockImplementation(async (userId: string, encryptedData: string, iv: string) => {
    if (!mockEncryptedProfiles[userId]) {
      return { success: false, error: 'Encrypted profile not found' };
    }
    
    // Simulate encrypted profile update
    const updatedEncryptedProfile = {
      ...mockEncryptedProfiles[userId],
      encrypted_data: encryptedData,
      iv,
      updated_at: new Date().toISOString()
    };
    
    mockEncryptedProfiles[userId] = updatedEncryptedProfile;
    return { success: true, data: updatedEncryptedProfile };
  }),

  deleteEncryptedProfile: jest.fn().mockImplementation(async (userId: string) => {
    if (!mockEncryptedProfiles[userId]) {
      return { success: false, error: 'Encrypted profile not found' };
    }
    
    // Simulate encrypted profile deletion
    delete mockEncryptedProfiles[userId];
    return { success: true };
  })
};

// Reset all mocks to their initial state
export const resetProfileApiMocks = () => {
  // Reset all API mocks
  Object.values(profileApiMock).forEach(mockFn => {
    if (typeof mockFn.mockReset === 'function') {
      mockFn.mockReset();
    }
  });
  
  // Reset mock data
  Object.keys(mockProfiles).forEach(key => {
    if (key !== 'user-123' && key !== 'user-456') {
      delete mockProfiles[key];
    }
  });
  
  Object.keys(mockEncryptedProfiles).forEach(key => {
    if (key !== 'user-456') {
      delete mockEncryptedProfiles[key];
    }
  });
}; 