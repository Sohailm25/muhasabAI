import React, { useEffect, useRef, useState } from 'react';
import { useProfile } from '../hooks/useProfile';
import { syncProfileAcrossDevices } from '../lib/profileSync';
import { useAuth } from '../hooks/useAuth';
import { API } from '../lib/api';
import { useLocation } from 'wouter';

interface ProfileIntegrationProps {
  children: React.ReactNode;
}

/**
 * ProfileIntegration handles the integration of the user profile system
 * with the rest of the application. It ensures profiles are loaded,
 * synchronized, and sets up any necessary global listeners.
 */
export function ProfileIntegration({ children }: ProfileIntegrationProps) {
  const { isLoading: authLoading, user } = useAuth();
  const userId = user?.id || null;
  const { isLoading, error, publicProfile, updateProfile } = useProfile();
  const initializeAttempted = useRef(false);
  const [initError, setInitError] = useState<string | null>(null);
  const [location] = useLocation();

  // Check if we're on a public page that doesn't need profile data
  const isPublicPage = 
    location === '/' || 
    location === '/login' || 
    location === '/register' || 
    location === '/about' || 
    location.startsWith('/public/');

  // Initialize profile on first load if needed (but skip on public pages)
  useEffect(() => {
    // Skip profile initialization on public pages
    if (isPublicPage) {
      console.log('On public page, skipping profile initialization');
      return;
    }
    
    let isMounted = true;
    let initTimeout: number | undefined;
    
    async function initializeProfile() {
      // Don't proceed if we're unmounted or already attempted initialization
      if (!isMounted || initializeAttempted.current) return;
      
      // Don't attempt initialization if no user ID
      if (!userId) return;
      
      // Don't attempt initialization if already loading
      if (isLoading || authLoading) return;
      
      // Make sure to wait a moment after auth is completed before trying to initialize
      // This gives time for the token to be properly stored
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Check again if we're still mounted
      if (!isMounted) return;
      
      // Check if the auth token exists - extra safety check
      const token = localStorage.getItem('auth_token');
      if (!token) {
        console.log('No auth token found, cannot initialize profile');
        if (isMounted) {
          setInitError('Authentication token not found. Please try logging in again.');
        }
        return;
      }
      
      // Mark that we've attempted initialization to prevent multiple attempts
      initializeAttempted.current = true;
      
      try {
        console.log('Starting profile initialization...');
        
        // First, try to fetch an existing profile
        try {
          console.log('Checking for existing profile...');
          const profile = await API.getUserProfile();
          
          if (profile && isMounted) {
            console.log('Found existing profile, no need to create one');
            return; // Profile exists, no need to create one
          }
        } catch (fetchErr) {
          // Only proceed if this is a not-found error (404)
          // If it's an auth error (401), we should fail
          if (fetchErr instanceof Error) {
            if (fetchErr.message.includes('Authentication')) {
              console.error('Authentication error when fetching profile:', fetchErr);
              if (isMounted) {
                setInitError('Authentication error. Please try logging in again.');
              }
              return;
            }
            if (!fetchErr.message.includes('not found')) {
              console.error('Unexpected error fetching profile:', fetchErr);
              throw fetchErr;
            }
          }
        }
        
        // Only proceed with profile creation if no profile was found
        if (!isMounted) return;
        
        console.log('No existing profile found, creating initial user profile...');
        
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
        
        console.log('Initial profile created successfully');
      } catch (error) {
        console.error('Error initializing profile:', error);
        
        // Set a user-friendly error message
        if (isMounted) {
          setInitError(error instanceof Error 
            ? error.message 
            : 'Failed to initialize profile. Please try refreshing the page.');
        }
        
        // Reset the attempt flag after a longer delay to prevent rapid retries
        initTimeout = window.setTimeout(() => {
          if (isMounted) {
            initializeAttempted.current = false;
          }
        }, 10000);
      }
    }
    
    // Wait a moment after component mounts before attempting to initialize
    // This helps avoid race conditions with authentication state
    const timeout = setTimeout(() => {
      initializeProfile();
    }, 2000);
    
    // Cleanup function to prevent memory leaks
    return () => {
      isMounted = false;
      clearTimeout(timeout);
      if (initTimeout) clearTimeout(initTimeout);
    };
  }, [userId, publicProfile, isLoading, authLoading, updateProfile]);
  
  // Sync profile across devices if enabled
  useEffect(() => {
    let syncInterval: number | undefined;
    
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
    syncInterval = window.setInterval(handleSync, 5 * 60 * 1000); // Every 5 minutes
    
    return () => {
      if (syncInterval) clearInterval(syncInterval);
    };
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
  
  // Show loading state only for authenticated users on non-public pages
  if (userId && (authLoading || isLoading) && !isPublicPage) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading your profile...</p>
        </div>
      </div>
    );
  }
  
  // Show error state from profile system (but not on public pages)
  if ((error || initError) && !isPublicPage) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="bg-destructive/10 p-6 rounded-lg max-w-md">
          <h2 className="text-xl font-bold text-destructive mb-2">Profile Error</h2>
          <p className="mb-4">{error?.message || initError}</p>
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
  
  // Public routes or public pages don't need a profile
  if (!userId || isPublicPage) {
    return <>{children}</>;
  }
  
  // Render children when profile is ready
  return <>{children}</>;
} 