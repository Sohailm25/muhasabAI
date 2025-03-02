import React, { useEffect } from 'react';
import { useProfile } from '../hooks/useProfile';
import { syncProfileAcrossDevices } from '../lib/profileSync';

interface ProfileIntegrationProps {
  userId: string | null;
  children: React.ReactNode;
}

/**
 * ProfileIntegration handles the integration of the user profile system
 * with the rest of the application. It ensures profiles are loaded,
 * synchronized, and sets up any necessary global listeners.
 */
export function ProfileIntegration({ userId, children }: ProfileIntegrationProps) {
  const { isLoading, error, publicProfile, updateProfile } = useProfile();

  // Initialize profile on first load if needed
  useEffect(() => {
    async function initializeProfile() {
      if (!userId) return;
      
      // If no public profile exists, create one
      if (!publicProfile && !isLoading) {
        console.log('Creating initial user profile...');
        
        // Create default profile
        await updateProfile({
          userId,
          generalPreferences: {
            inputMethod: 'text',
            reflectionFrequency: 'daily',
            languagePreferences: 'english'
          },
          privacySettings: {
            localStorageOnly: true,
            allowPersonalization: true,
            enableSync: false
          }
        });
        
        console.log('Initial profile created');
      }
    }
    
    initializeProfile();
  }, [userId, publicProfile, isLoading, updateProfile]);
  
  // Sync profile across devices if enabled
  useEffect(() => {
    async function handleSync() {
      if (!publicProfile || !userId) return;
      
      // Only sync if enabled in privacy settings
      if (publicProfile.privacySettings.enableSync) {
        console.log('Syncing profile across devices...');
        await syncProfileAcrossDevices();
      }
    }
    
    // Initial sync
    handleSync();
    
    // Set up periodic sync
    const syncInterval = setInterval(handleSync, 5 * 60 * 1000); // Every 5 minutes
    
    return () => clearInterval(syncInterval);
  }, [publicProfile, userId]);
  
  // Listen for storage events (when another tab updates the profile)
  useEffect(() => {
    function handleStorageChange(event: StorageEvent) {
      // If profile data changed in another tab, reload the page
      if (
        event.key === 'sahabai_encrypted_profile' || 
        event.key === 'sahabai_encryption_key' ||
        event.key === 'sahabai_public_profile'
      ) {
        console.log('Profile data changed in another tab, reloading...');
        window.location.reload();
      }
    }
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);
  
  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading your profile...</p>
        </div>
      </div>
    );
  }
  
  // Show error state
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="bg-destructive/10 p-6 rounded-lg max-w-md">
          <h2 className="text-xl font-bold text-destructive mb-2">Profile Error</h2>
          <p className="mb-4">{error.message}</p>
          <button 
            className="bg-primary text-primary-foreground px-4 py-2 rounded"
            onClick={() => window.location.reload()}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }
  
  // Render children when profile is ready
  return <>{children}</>;
} 