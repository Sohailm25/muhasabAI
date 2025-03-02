/**
 * Unit tests for useProfile hook
 */

import React from 'react';
import { renderHook, act } from '@testing-library/react-hooks';
import { useProfile } from '../../../client/src/hooks/useProfile';
import { api } from '../../../client/src/lib/api';
import * as encryption from '../../../client/src/lib/encryption';
import { PublicProfile, PrivateProfile, EncryptedProfileData } from '../../../client/src/lib/types';
import { 
  getUserProfile, 
  createUserProfile, 
  updateUserProfile, 
  getEncryptedProfileData,
  updateEncryptedProfileData
} from '../../../client/src/api/profileApi';
import { 
  encryptData, 
  decryptData, 
  generateKey,
  exportKeyToString,
  importKeyFromString
} from '../../../client/src/lib/encryption';

// Mock the API
jest.mock('../../../client/src/lib/api', () => ({
  api: {
    getUserProfile: jest.fn(),
    createUserProfile: jest.fn(),
    updateUserProfile: jest.fn(),
    getEncryptedProfileData: jest.fn(),
    updateEncryptedProfileData: jest.fn(),
    deleteUserProfile: jest.fn(),
  },
}));

// Mock encryption functions
jest.mock('../../../client/src/lib/encryption', () => ({
  getEncryptionKey: jest.fn(),
  generateEncryptionKey: jest.fn(),
  encryptData: jest.fn(),
  decryptData: jest.fn(),
}));

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Sample data for tests
const mockPublicProfile: PublicProfile = {
  userId: 'user-123',
  createdAt: new Date(),
  updatedAt: new Date(),
  generalPreferences: {
    inputMethod: 'text',
    reflectionFrequency: 'daily',
    languagePreferences: 'english',
  },
  privacySettings: {
    localStorageOnly: true,
    allowPersonalization: true,
    enableSync: false,
  },
  usageStats: {
    reflectionCount: 5,
    lastActiveDate: new Date(),
    streakDays: 3,
  },
};

const mockPrivateProfile: PrivateProfile = {
  spiritualJourneyStage: 'exploring',
  primaryGoals: ['learn-quran', 'improve-prayers'],
  knowledgeLevel: 'intermediate',
  lifeStage: 'adult',
  communityConnection: 'connected',
  culturalBackground: 'western',
  reflectionStyle: 'contemplative',
  guidancePreferences: ['quran', 'hadith', 'scholarly'],
  topicsOfInterest: ['prayer', 'fasting', 'charity'],
};

const mockEncryptedData: EncryptedProfileData = {
  data: 'encrypted-private-profile-data',
  iv: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
};

// Mock crypto key
const mockCryptoKey = {} as CryptoKey;

// Mock all the API functions
jest.mock('../../../client/src/api/profileApi', () => ({
  getUserProfile: jest.fn(),
  createUserProfile: jest.fn(),
  updateUserProfile: jest.fn(),
  getEncryptedProfileData: jest.fn(),
  updateEncryptedProfileData: jest.fn()
}));

// Mock encryption functions
jest.mock('../../../client/src/lib/encryption', () => ({
  encryptData: jest.fn(),
  decryptData: jest.fn(),
  generateKey: jest.fn(),
  exportKeyToString: jest.fn(),
  importKeyFromString: jest.fn()
}));

describe('useProfile Hook', () => {
  const userId = 'test-user-123';
  
  // Sample public profile data
  const mockPublicProfile = {
    userId,
    generalPreferences: {
      inputMethod: 'text',
      reflectionFrequency: 'daily',
    },
    privacySettings: {
      localStorageOnly: false,
      allowPersonalization: true,
      enableEncryption: true,
    },
    version: 1,
    createdAt: Date.now(),
    lastModified: Date.now()
  };
  
  // Sample private profile data
  const mockPrivateProfile = {
    userId,
    personalPreferences: {
      topicsOfInterest: ['mindfulness', 'productivity'],
      favoritePractices: ['gratitude', 'reflection'],
    },
    journalEntries: {
      'entry-1': { title: 'First Entry', content: 'This is private content' },
    },
    dynamicAttributes: {
      topicsEngagedWith: { mindfulness: 5, productivity: 3 },
      preferredReferences: { books: 2, articles: 4 },
      emotionalResponsiveness: { positive: 0.7, negative: 0.3 },
      languageComplexity: 0.6,
    },
    version: 1,
    createdAt: Date.now(),
    lastModified: Date.now()
  };
  
  // Encrypted data mock
  const mockEncryptedData = {
    userId,
    encryptedData: 'encrypted-string-mock',
    iv: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    version: 1,
    createdAt: Date.now(),
    lastModified: Date.now()
  };
  
  // Mock encryption key
  const mockEncryptionKey = { type: 'secret', usages: ['encrypt', 'decrypt'] } as CryptoKey;
  
  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Setup default mock implementations
    (getUserProfile as jest.Mock).mockResolvedValue(mockPublicProfile);
    (getEncryptedProfileData as jest.Mock).mockResolvedValue(mockEncryptedData);
    (createUserProfile as jest.Mock).mockResolvedValue(undefined);
    (updateUserProfile as jest.Mock).mockResolvedValue(undefined);
    (updateEncryptedProfileData as jest.Mock).mockResolvedValue(undefined);
    
    // Setup encryption mocks
    (encryptData as jest.Mock).mockResolvedValue({
      encryptedData: 'encrypted-string-mock',
      iv: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
    });
    (decryptData as jest.Mock).mockResolvedValue(JSON.stringify(mockPrivateProfile));
    (generateKey as jest.Mock).mockResolvedValue(mockEncryptionKey);
    (exportKeyToString as jest.Mock).mockResolvedValue('mock-key-string');
    (importKeyFromString as jest.Mock).mockResolvedValue(mockEncryptionKey);
    
    // Mock localStorage
    Storage.prototype.getItem = jest.fn((key) => {
      if (key === 'profile_encryption_key') return 'mock-key-string';
      return null;
    });
    Storage.prototype.setItem = jest.fn();
  });
  
  describe('Loading profiles', () => {
    test('should load public profile on initialization', async () => {
      const { result, waitForNextUpdate } = renderHook(() => useProfile(userId));
      
      // Initial state should be loading
      expect(result.current.isLoading).toBe(true);
      expect(result.current.publicProfile).toBeNull();
      expect(result.current.privateProfile).toBeNull();
      
      await waitForNextUpdate();
      
      // After loading completes
      expect(result.current.isLoading).toBe(false);
      expect(result.current.publicProfile).toEqual(mockPublicProfile);
      expect(getUserProfile).toHaveBeenCalledWith(userId);
    });
    
    test('should load encrypted private profile when enableEncryption is true', async () => {
      const { result, waitForNextUpdate } = renderHook(() => useProfile(userId));
      
      await waitForNextUpdate();
      
      expect(result.current.privateProfile).toEqual(mockPrivateProfile);
      expect(getEncryptedProfileData).toHaveBeenCalledWith(userId);
      expect(decryptData).toHaveBeenCalledWith(
        mockEncryptedData.encryptedData,
        new Uint8Array(mockEncryptedData.iv),
        expect.any(Object)
      );
    });
    
    test('should not load encrypted data when enableEncryption is false', async () => {
      // Override the public profile mock to disable encryption
      (getUserProfile as jest.Mock).mockResolvedValueOnce({
        ...mockPublicProfile,
        privacySettings: {
          ...mockPublicProfile.privacySettings,
          enableEncryption: false
        }
      });
      
      const { result, waitForNextUpdate } = renderHook(() => useProfile(userId));
      
      await waitForNextUpdate();
      
      expect(result.current.privateProfile).toBeNull();
      expect(getEncryptedProfileData).not.toHaveBeenCalled();
      expect(decryptData).not.toHaveBeenCalled();
    });
    
    test('should handle error when loading public profile fails', async () => {
      const errorMessage = 'Failed to load profile';
      (getUserProfile as jest.Mock).mockRejectedValueOnce(new Error(errorMessage));
      
      const { result, waitForNextUpdate } = renderHook(() => useProfile(userId));
      
      await waitForNextUpdate();
      
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe(errorMessage);
      expect(result.current.publicProfile).toBeNull();
    });
    
    test('should handle error when loading encrypted data fails', async () => {
      const errorMessage = 'Failed to load encrypted data';
      (getEncryptedProfileData as jest.Mock).mockRejectedValueOnce(new Error(errorMessage));
      
      const { result, waitForNextUpdate } = renderHook(() => useProfile(userId));
      
      await waitForNextUpdate();
      
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe(errorMessage);
      expect(result.current.publicProfile).not.toBeNull();
      expect(result.current.privateProfile).toBeNull();
    });
    
    test('should handle error when decryption fails', async () => {
      const errorMessage = 'Decryption failed';
      (decryptData as jest.Mock).mockRejectedValueOnce(new Error(errorMessage));
      
      const { result, waitForNextUpdate } = renderHook(() => useProfile(userId));
      
      await waitForNextUpdate();
      
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe(errorMessage);
      expect(result.current.publicProfile).not.toBeNull();
      expect(result.current.privateProfile).toBeNull();
    });
    
    test('should create a new profile if none exists', async () => {
      // Mock no existing profile
      (getUserProfile as jest.Mock).mockResolvedValueOnce(null);
      
      const { result, waitForNextUpdate } = renderHook(() => useProfile(userId));
      
      await waitForNextUpdate();
      
      expect(createUserProfile).toHaveBeenCalledWith(expect.objectContaining({
        userId,
        generalPreferences: expect.any(Object),
        privacySettings: expect.any(Object)
      }));
      expect(result.current.publicProfile).not.toBeNull();
    });
  });
  
  describe('Updating profiles', () => {
    test('should update public profile successfully', async () => {
      const { result, waitForNextUpdate } = renderHook(() => useProfile(userId));
      await waitForNextUpdate();
      
      const profileUpdate = {
        generalPreferences: {
          inputMethod: 'voice',
        }
      };
      
      act(() => {
        result.current.updatePublicProfile(profileUpdate);
      });
      
      // Should be in loading state during update
      expect(result.current.isLoading).toBe(true);
      
      await waitForNextUpdate();
      
      // Should update correctly
      expect(updateUserProfile).toHaveBeenCalledWith(
        userId,
        expect.objectContaining({
          generalPreferences: expect.objectContaining({
            inputMethod: 'voice',
          })
        })
      );
      expect(result.current.publicProfile?.generalPreferences.inputMethod).toBe('voice');
      expect(result.current.isLoading).toBe(false);
    });
    
    test('should update private profile successfully and encrypt it', async () => {
      const { result, waitForNextUpdate } = renderHook(() => useProfile(userId));
      await waitForNextUpdate();
      
      const privateProfileUpdate = {
        personalPreferences: {
          topicsOfInterest: ['mindfulness', 'productivity', 'creativity'],
        }
      };
      
      act(() => {
        result.current.updatePrivateProfile(privateProfileUpdate);
      });
      
      await waitForNextUpdate();
      
      // Should encrypt and update
      expect(encryptData).toHaveBeenCalled();
      expect(updateEncryptedProfileData).toHaveBeenCalledWith(
        userId,
        expect.objectContaining({
          encryptedData: 'encrypted-string-mock',
          iv: expect.any(Array),
          version: expect.any(Number)
        })
      );
      
      expect(result.current.privateProfile?.personalPreferences.topicsOfInterest).toContain('creativity');
    });
    
    test('should handle error during public profile update', async () => {
      const { result, waitForNextUpdate } = renderHook(() => useProfile(userId));
      await waitForNextUpdate();
      
      const errorMessage = 'Update failed';
      (updateUserProfile as jest.Mock).mockRejectedValueOnce(new Error(errorMessage));
      
      act(() => {
        result.current.updatePublicProfile({ generalPreferences: { inputMethod: 'voice' } });
      });
      
      await waitForNextUpdate();
      
      expect(result.current.error).toBe(errorMessage);
      expect(result.current.isLoading).toBe(false);
    });
    
    test('should handle error during private profile update', async () => {
      const { result, waitForNextUpdate } = renderHook(() => useProfile(userId));
      await waitForNextUpdate();
      
      const errorMessage = 'Encryption failed';
      (encryptData as jest.Mock).mockRejectedValueOnce(new Error(errorMessage));
      
      act(() => {
        result.current.updatePrivateProfile({ personalPreferences: { topicsOfInterest: ['mindfulness'] } });
      });
      
      await waitForNextUpdate();
      
      expect(result.current.error).toBe(errorMessage);
      expect(result.current.isLoading).toBe(false);
    });
    
    test('should not update private profile when enableEncryption is false', async () => {
      // Override the public profile mock to disable encryption
      (getUserProfile as jest.Mock).mockResolvedValueOnce({
        ...mockPublicProfile,
        privacySettings: {
          ...mockPublicProfile.privacySettings,
          enableEncryption: false
        }
      });
      
      const { result, waitForNextUpdate } = renderHook(() => useProfile(userId));
      await waitForNextUpdate();
      
      act(() => {
        const updateResult = result.current.updatePrivateProfile({ personalPreferences: { topicsOfInterest: ['mindfulness'] } });
        expect(updateResult).rejects.toThrow();
      });
      
      expect(encryptData).not.toHaveBeenCalled();
      expect(updateEncryptedProfileData).not.toHaveBeenCalled();
    });
  });
  
  describe('Privacy settings', () => {
    test('should toggle encryption and handle key generation', async () => {
      const { result, waitForNextUpdate } = renderHook(() => useProfile(userId));
      await waitForNextUpdate();
      
      // Initially encryption is enabled
      expect(result.current.publicProfile?.privacySettings.enableEncryption).toBe(true);
      
      // Disable encryption
      act(() => {
        result.current.updatePublicProfile({
          privacySettings: {
            enableEncryption: false
          }
        });
      });
      
      await waitForNextUpdate();
      
      expect(result.current.publicProfile?.privacySettings.enableEncryption).toBe(false);
      
      // Enable encryption again
      (generateKey as jest.Mock).mockClear();
      
      act(() => {
        result.current.updatePublicProfile({
          privacySettings: {
            enableEncryption: true
          }
        });
      });
      
      await waitForNextUpdate();
      
      expect(generateKey).toHaveBeenCalled();
      expect(exportKeyToString).toHaveBeenCalled();
      expect(localStorage.setItem).toHaveBeenCalledWith('profile_encryption_key', 'mock-key-string');
      expect(result.current.publicProfile?.privacySettings.enableEncryption).toBe(true);
    });
    
    test('should respect localStorageOnly setting for profile sync', async () => {
      // Set localStorageOnly to true
      (getUserProfile as jest.Mock).mockResolvedValueOnce({
        ...mockPublicProfile,
        privacySettings: {
          ...mockPublicProfile.privacySettings,
          localStorageOnly: true
        }
      });
      
      const { result, waitForNextUpdate } = renderHook(() => useProfile(userId));
      await waitForNextUpdate();
      
      expect(result.current.publicProfile?.privacySettings.localStorageOnly).toBe(true);
      
      // Try to update profile
      act(() => {
        result.current.updatePublicProfile({
          generalPreferences: {
            inputMethod: 'voice'
          }
        });
      });
      
      await waitForNextUpdate();
      
      // Should only update local storage, not API
      expect(updateUserProfile).not.toHaveBeenCalled();
      expect(result.current.publicProfile?.generalPreferences.inputMethod).toBe('voice');
    });
  });
  
  describe('AI Context Generation', () => {
    test('should generate AI context based on privacy settings', async () => {
      const { result, waitForNextUpdate } = renderHook(() => useProfile(userId));
      await waitForNextUpdate();
      
      const context = result.current.getProfileForAIContext();
      
      // Should include public profile
      expect(context).toHaveProperty('generalPreferences');
      expect(context.generalPreferences).toEqual(mockPublicProfile.generalPreferences);
      
      // Should include non-sensitive private data
      expect(context).toHaveProperty('topicsOfInterest');
      expect(context.topicsOfInterest).toEqual(mockPrivateProfile.personalPreferences.topicsOfInterest);
      
      // Should NOT include sensitive private data
      expect(context).not.toHaveProperty('journalEntries');
    });
    
    test('should not include private data in AI context when personalization is disabled', async () => {
      // Override the public profile mock to disable personalization
      (getUserProfile as jest.Mock).mockResolvedValueOnce({
        ...mockPublicProfile,
        privacySettings: {
          ...mockPublicProfile.privacySettings,
          allowPersonalization: false
        }
      });
      
      const { result, waitForNextUpdate } = renderHook(() => useProfile(userId));
      await waitForNextUpdate();
      
      const context = result.current.getProfileForAIContext();
      
      // Should include only the minimal public profile data
      expect(context).toHaveProperty('generalPreferences');
      
      // Should not include any private data
      expect(context).not.toHaveProperty('topicsOfInterest');
      expect(context).not.toHaveProperty('dynamicAttributes');
    });
  });
}); 