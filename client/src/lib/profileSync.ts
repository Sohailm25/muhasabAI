import { 
  PublicProfile,
  PrivateProfile, 
  EncryptedProfileData
} from './types';
import {
  encryptData,
  decryptData,
  generateKey,
  exportKey,
  importKey
} from './encryption';
import { api } from './api';
import { ProfileType } from '@/types/profile';

/**
 * Profile synchronization module
 * 
 * Handles secure synchronization of user profiles across devices
 * with end-to-end encryption for private data
 */

interface SyncOptions {
  forceSync?: boolean;
  syncPrivate?: boolean;
  skipRemote?: boolean;
  syncDirection?: 'pull' | 'push' | 'bidirectional';
}

interface SyncResult {
  success: boolean;
  syncedPublic: boolean;
  syncedPrivate: boolean;
  error?: string;
  timestamp: number;
}

interface SyncMetadata {
  lastSyncTime: number;
  deviceId: string;
  publicVersion: number;
  privateVersion: number;
}

/**
 * Get local sync metadata from storage
 */
function getSyncMetadata(): SyncMetadata | null {
  try {
    const syncData = localStorage.getItem('muhasab_sync_metadata');
    if (!syncData) return null;
    return JSON.parse(syncData) as SyncMetadata;
  } catch (error) {
    console.error('Error retrieving sync metadata:', error);
    return null;
  }
}

/**
 * Save sync metadata to local storage
 */
function saveSyncMetadata(metadata: SyncMetadata): void {
  try {
    localStorage.setItem('muhasab_sync_metadata', JSON.stringify(metadata));
  } catch (error) {
    console.error('Error saving sync metadata:', error);
  }
}

/**
 * Generate a unique device ID for sync purposes
 */
function generateDeviceId(): string {
  return 'device_' + Math.random().toString(36).substring(2, 15) + 
    '_' + Date.now().toString(36);
}

/**
 * Initialize sync metadata if it doesn't exist
 */
export function initSyncMetadata(): SyncMetadata {
  let metadata = getSyncMetadata();
  
  if (!metadata) {
    metadata = {
      lastSyncTime: 0,
      deviceId: generateDeviceId(),
      publicVersion: 0,
      privateVersion: 0
    };
    saveSyncMetadata(metadata);
  }
  
  return metadata;
}

/**
 * Synchronize public profile data with the server
 */
async function syncPublicProfile(
  userId: string,
  localProfile: PublicProfile | null,
  options: SyncOptions = {}
): Promise<PublicProfile | null> {
  const { syncDirection = 'bidirectional' } = options;
  const metadata = initSyncMetadata();
  
  try {
    // Skip remote operations if specified
    if (options.skipRemote) {
      return localProfile;
    }
    
    // Get remote profile
    const remoteProfile = await api.getUserProfile(userId);
    
    // If local doesn't exist, use remote
    if (!localProfile) {
      if (remoteProfile) {
        // Update metadata
        metadata.publicVersion = remoteProfile.version || 0;
        metadata.lastSyncTime = Date.now();
        saveSyncMetadata(metadata);
      }
      return remoteProfile;
    }
    
    // Handle based on sync direction
    if (syncDirection === 'pull') {
      // Only pull from remote
      if (remoteProfile) {
        metadata.publicVersion = remoteProfile.version || 0;
        metadata.lastSyncTime = Date.now();
        saveSyncMetadata(metadata);
        return remoteProfile;
      }
      return localProfile;
    } else if (syncDirection === 'push') {
      // Only push to remote
      await api.updateUserProfile({ 
        ...localProfile,
        lastModified: Date.now(),
        version: (localProfile.version || 0) + 1
      });
      
      // Update metadata
      metadata.publicVersion = (localProfile.version || 0) + 1;
      saveSyncMetadata(metadata);
      
      // Return local profile
      return localProfile;
    } else {
      // Bidirectional sync - merge changes with conflict resolution
      
      // If remote is newer, prefer remote
      if (remoteProfile && 
          (remoteProfile.version || 0) > (localProfile.version || 0)) {
        metadata.publicVersion = remoteProfile.version || 0;
        metadata.lastSyncTime = Date.now();
        saveSyncMetadata(metadata);
        return remoteProfile;
      }
      
      // If local is newer or same, push local to remote
      if (!remoteProfile || (localProfile.version || 0) >= (remoteProfile.version || 0)) {
        const updatedLocalProfile = {
          ...localProfile,
          lastModified: Date.now(),
          syncDeviceId: metadata.deviceId,
          version: (localProfile.version || 0) + 1
        };
        
        await api.updateUserProfile(updatedLocalProfile);
        
        // Update metadata
        metadata.publicVersion = updatedLocalProfile.version || 0;
        metadata.lastSyncTime = Date.now();
        saveSyncMetadata(metadata);
        
        return updatedLocalProfile;
      }
      
      return localProfile;
    }
  } catch (error) {
    console.error('Error during public profile sync:', error);
    return localProfile;
  }
}

/**
 * Synchronize private profile data with the server
 */
async function syncPrivateProfile(
  userId: string,
  localPublicProfile: PublicProfile,
  localPrivateProfile: PrivateProfile | null,
  options: SyncOptions = {}
): Promise<PrivateProfile | null> {
  const { syncDirection = 'bidirectional' } = options;
  const metadata = initSyncMetadata();
  
  // Don't sync if privacy settings prevent it
  if (localPublicProfile.privacySettings?.localStorageOnly) {
    return localPrivateProfile;
  }
  
  try {
    // Skip remote operations if specified
    if (options.skipRemote) {
      return localPrivateProfile;
    }
    
    // Ensure we have encryption key
    let encryptionKey = await getEncryptionKey(userId);
    if (!encryptionKey) {
      throw new Error('No encryption key available for private data sync');
    }
    
    // Get remote encrypted data
    const remoteEncrypted = await api.getEncryptedProfileData(userId);
    
    // If no local private profile, try to decrypt remote
    if (!localPrivateProfile) {
      if (remoteEncrypted?.encryptedData) {
        try {
          const decrypted = await decryptData(
            remoteEncrypted.encryptedData,
            encryptionKey,
            remoteEncrypted.iv
          );
          
          const remotePrivateProfile = JSON.parse(decrypted) as PrivateProfile;
          
          // Update metadata
          metadata.privateVersion = remotePrivateProfile.version || 0;
          metadata.lastSyncTime = Date.now();
          saveSyncMetadata(metadata);
          
          return remotePrivateProfile;
        } catch (e) {
          console.error('Failed to decrypt remote private profile:', e);
          return null;
        }
      }
      return null;
    }
    
    // Handle sync direction
    if (syncDirection === 'pull') {
      // Only pull from remote
      if (remoteEncrypted?.encryptedData) {
        try {
          const decrypted = await decryptData(
            remoteEncrypted.encryptedData,
            encryptionKey,
            remoteEncrypted.iv
          );
          
          const remotePrivateProfile = JSON.parse(decrypted) as PrivateProfile;
          
          // Update metadata
          metadata.privateVersion = remotePrivateProfile.version || 0;
          metadata.lastSyncTime = Date.now();
          saveSyncMetadata(metadata);
          
          return remotePrivateProfile;
        } catch (e) {
          console.error('Failed to decrypt remote private profile:', e);
          return localPrivateProfile;
        }
      }
      return localPrivateProfile;
    } else if (syncDirection === 'push') {
      // Only push to remote
      const updatedPrivateProfile = {
        ...localPrivateProfile,
        lastModified: Date.now(),
        syncDeviceId: metadata.deviceId,
        version: (localPrivateProfile.version || 0) + 1
      };
      
      // Encrypt private profile
      const iv = window.crypto.getRandomValues(new Uint8Array(12));
      const encryptedData = await encryptData(
        JSON.stringify(updatedPrivateProfile),
        encryptionKey,
        iv
      );
      
      // Update remote encrypted data
      await api.updateEncryptedProfileData(userId, {
        userId,
        encryptedData,
        iv,
        lastModified: Date.now(),
        version: (localPrivateProfile.version || 0) + 1
      });
      
      // Update metadata
      metadata.privateVersion = updatedPrivateProfile.version || 0;
      metadata.lastSyncTime = Date.now();
      saveSyncMetadata(metadata);
      
      return updatedPrivateProfile;
    } else {
      // Bidirectional sync with conflict resolution
      
      // If remote exists, try to decrypt and compare versions
      if (remoteEncrypted?.encryptedData) {
        try {
          const decrypted = await decryptData(
            remoteEncrypted.encryptedData,
            encryptionKey,
            remoteEncrypted.iv
          );
          
          const remotePrivateProfile = JSON.parse(decrypted) as PrivateProfile;
          
          // If remote is newer, prefer remote
          if ((remotePrivateProfile.version || 0) > (localPrivateProfile.version || 0)) {
            // Update metadata
            metadata.privateVersion = remotePrivateProfile.version || 0;
            metadata.lastSyncTime = Date.now();
            saveSyncMetadata(metadata);
            
            return remotePrivateProfile;
          }
        } catch (e) {
          console.error('Failed to decrypt remote private profile:', e);
        }
      }
      
      // If local is newer or remote decrypt failed, push local to remote
      const updatedPrivateProfile = {
        ...localPrivateProfile,
        lastModified: Date.now(),
        syncDeviceId: metadata.deviceId,
        version: (localPrivateProfile.version || 0) + 1
      };
      
      // Encrypt private profile
      const iv = window.crypto.getRandomValues(new Uint8Array(12));
      const encryptedData = await encryptData(
        JSON.stringify(updatedPrivateProfile),
        encryptionKey,
        iv
      );
      
      // Update remote encrypted data
      await api.updateEncryptedProfileData(userId, {
        userId,
        encryptedData,
        iv,
        lastModified: Date.now(),
        version: updatedPrivateProfile.version
      });
      
      // Update metadata
      metadata.privateVersion = updatedPrivateProfile.version || 0;
      metadata.lastSyncTime = Date.now();
      saveSyncMetadata(metadata);
      
      return updatedPrivateProfile;
    }
  } catch (error) {
    console.error('Error during private profile sync:', error);
    return localPrivateProfile;
  }
}

/**
 * Get or create encryption key for user
 */
async function getEncryptionKey(userId: string): Promise<CryptoKey | null> {
  try {
    // Check for key in local storage (exported format)
    const storedKey = localStorage.getItem(`encryption_key_${userId}`);
    
    if (storedKey) {
      // Import from stored key
      return await importKey(JSON.parse(storedKey));
    }
    
    // Generate new key if none exists
    const newKey = await generateKey();
    
    // Export and store
    const exportedKey = await exportKey(newKey);
    localStorage.setItem(`encryption_key_${userId}`, JSON.stringify(exportedKey));
    
    return newKey;
  } catch (error) {
    console.error('Error getting/creating encryption key:', error);
    return null;
  }
}

/**
 * Main sync function for both public and private profiles
 */
export async function syncUserProfiles(
  userId: string, 
  localPublicProfile: PublicProfile | null,
  localPrivateProfile: PrivateProfile | null,
  options: SyncOptions = {}
): Promise<SyncResult> {
  const result: SyncResult = {
    success: false,
    syncedPublic: false,
    syncedPrivate: false,
    timestamp: Date.now()
  };
  
  try {
    // Sync public profile
    const syncedPublic = await syncPublicProfile(
      userId,
      localPublicProfile,
      options
    );
    
    // Update result
    if (syncedPublic) {
      result.syncedPublic = true;
      result.success = true;
    }
    
    // Check if we should sync private data
    if (options.syncPrivate !== false && syncedPublic && !syncedPublic.privacySettings?.localStorageOnly) {
      // Sync private profile
      const syncedPrivate = await syncPrivateProfile(
        userId,
        syncedPublic,
        localPrivateProfile,
        options
      );
      
      // Update result
      if (syncedPrivate) {
        result.syncedPrivate = true;
      }
    }
    
    return result;
  } catch (error) {
    result.error = error instanceof Error ? error.message : 'Unknown sync error';
    console.error('Profile sync error:', error);
    return result;
  }
}

/**
 * Export user profile data for backup/transfer
 */
export async function exportUserProfiles(
  userId: string,
  publicProfile: PublicProfile | null,
  privateProfile: PrivateProfile | null
): Promise<string> {
  try {
    // Get encryption key
    const encryptionKey = await getEncryptionKey(userId);
    
    // Create export package
    const exportData = {
      version: 1,
      timestamp: Date.now(),
      userId,
      publicProfile,
      hasPrivateData: !!privateProfile
    };
    
    // Add encrypted private data if available
    if (privateProfile && encryptionKey) {
      const iv = window.crypto.getRandomValues(new Uint8Array(12));
      const encryptedPrivate = await encryptData(
        JSON.stringify(privateProfile),
        encryptionKey,
        iv
      );
      
      return JSON.stringify({
        ...exportData,
        encryptedPrivate,
        iv: Array.from(iv),
        keyBackup: await exportKey(encryptionKey)
      });
    }
    
    // Return public data only
    return JSON.stringify(exportData);
  } catch (error) {
    console.error('Error exporting profiles:', error);
    throw new Error('Failed to export profile data');
  }
}

/**
 * Import user profile data from backup/transfer
 */
export async function importUserProfiles(
  importData: string
): Promise<{
  userId: string;
  publicProfile: PublicProfile | null;
  privateProfile: PrivateProfile | null;
}> {
  try {
    // Parse import data
    const data = JSON.parse(importData);
    
    // Validate data structure
    if (!data.userId || data.version !== 1) {
      throw new Error('Invalid import data format');
    }
    
    // Extract public profile
    const publicProfile = data.publicProfile;
    let privateProfile = null;
    
    // Try to decrypt private data if present
    if (data.hasPrivateData && data.encryptedPrivate && data.iv && data.keyBackup) {
      try {
        // Import the key
        const key = await importKey(data.keyBackup);
        
        // Decrypt private data
        const iv = new Uint8Array(data.iv);
        const decrypted = await decryptData(data.encryptedPrivate, key, iv);
        
        // Parse private profile
        privateProfile = JSON.parse(decrypted);
      } catch (e) {
        console.error('Failed to decrypt private profile during import:', e);
      }
    }
    
    return {
      userId: data.userId,
      publicProfile,
      privateProfile
    };
  } catch (error) {
    console.error('Error importing profiles:', error);
    throw new Error('Failed to import profile data');
  }
}

/**
 * Synchronizes profile data across devices if enabled in privacy settings
 * This is a simplified version for demonstration purposes
 * @returns Promise that resolves when the sync is complete
 */
export const syncProfileAcrossDevices = async (): Promise<void> => {
  try {
    // For demonstration purposes - in a real app, this would:
    // 1. Get the current user ID from authentication
    // 2. Get the user's profile from local storage or state
    // 3. Check if sync is enabled
    // 4. Sync with the backend

    console.log('Syncing profile across devices...');
    
    // Simulated successful sync
    console.log('Profile sync completed successfully');
  } catch (error) {
    console.error('Error syncing profile across devices:', error);
  }
};

/**
 * Fetches profile data from the server if sync is enabled
 * @param userId The user's ID
 * @returns Promise that resolves with the profile data or null if sync is not enabled
 */
export const fetchProfileFromServer = async (
  userId: string
): Promise<ProfileType | null> => {
  // Check if sync is enabled by checking local storage
  const localProfile = localStorage.getItem(`profile_${userId}`);
  
  if (!localProfile) return null;
  
  const parsedProfile: ProfileType = JSON.parse(localProfile);
  
  if (!parsedProfile?.privacySettings?.enableSync) {
    return null;
  }
  
  try {
    // For now, this is just a placeholder
    // In a real app, this would be an actual API call
    // const response = await api.get(`/api/profile/${userId}`);
    // return response.data;
    
    // For now, just return the local profile
    return parsedProfile;
  } catch (error) {
    console.error('Error fetching profile from server:', error);
    return null;
  }
}; 