import { ReactNode, useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { LoadingAnimation } from "./LoadingAnimation";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { API } from "@/lib/api";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, RefreshCcw, RotateCcw, ExternalLink, Trash2 } from "lucide-react";

interface RequireAuthProps {
  children: ReactNode;
}

export function RequireAuth({ children }: RequireAuthProps) {
  const { isAuthenticated, isLoading, error, user, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const [retryCount, setRetryCount] = useState(0);
  const [showProfileError, setShowProfileError] = useState(false);
  const [profileRecoveryAttempt, setProfileRecoveryAttempt] = useState(false);
  const [recoveryError, setRecoveryError] = useState<string | null>(null);
  const [showDetailedInfo, setShowDetailedInfo] = useState(false);
  const [clearingStorage, setClearingStorage] = useState(false);

  // Handle profile loading errors and clear any circuit breakers
  useEffect(() => {
    // Always clear profile-related circuit breakers on mount
    clearProfileCircuitBreakers();
    
    if (error && (error.includes("profile") || error.includes("Profile")) && isAuthenticated && !isLoading) {
      console.log('[RequireAuth Debug] Profile error detected:', error);
      setShowProfileError(true);
      
      // Show toast notification
      toast({
        title: "Profile Error",
        description: "We're having trouble loading your profile. Attempting automatic recovery...",
        variant: "destructive",
      });
      
      // Auto-attempt recovery immediately
      attemptProfileRecovery().catch(err => {
        console.error('[RequireAuth] Initial recovery attempt failed:', err);
      });
    }
  }, [error, isAuthenticated, isLoading]);

  // Function to clear profile-related circuit breakers
  const clearProfileCircuitBreakers = () => {
    try {
      const circuitBreakerKeys = Object.keys(localStorage).filter(key => 
        key.startsWith('circuit_') || 
        key.startsWith('failures_') || 
        key.includes('profile')
      );
      
      if (circuitBreakerKeys.length > 0) {
        console.log('[RequireAuth Debug] Clearing circuit breakers:', circuitBreakerKeys);
        circuitBreakerKeys.forEach(key => localStorage.removeItem(key));
        console.log('[RequireAuth Debug] Circuit breakers cleared');
      }
    } catch (e) {
      console.error('[RequireAuth Debug] Error clearing circuit breakers:', e);
    }
  };

  // Clean up error state when component unmounts
  useEffect(() => {
    return () => {
      setShowProfileError(false);
      setRetryCount(0);
      setRecoveryError(null);
    };
  }, []);

  // Function to retry profile loading with enhanced diagnostics
  const retryProfileLoad = async () => {
    setRetryCount(prev => prev + 1);
    setRecoveryError(null);
    
    try {
      // Clear any circuit breakers first
      clearProfileCircuitBreakers();
      
      console.log('[RequireAuth Debug] Manually retrying profile load');
      
      // Check auth token before attempting
      const token = localStorage.getItem('auth_token');
      if (!token) {
        console.error('[RequireAuth Debug] No auth token found during retry');
        setRecoveryError('Authentication token missing. Please login again.');
        return;
      }
      
      // Attempt to load user profile with priority flag
      const profile = await API.getUserProfile();
      console.log('[RequireAuth Debug] Profile load succeeded:', profile);
      setShowProfileError(false);
      
      toast({
        title: "Profile Loaded",
        description: "Your profile has been successfully loaded.",
      });
      
      // Refresh the page after a short delay to reset application state
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('[RequireAuth Debug] Profile load retry failed:', errorMessage);
      setRecoveryError(`Profile load failed: ${errorMessage}`);
      
      // If we've retried a few times without success, suggest recovery
      if (retryCount >= 2) {
        console.log('[RequireAuth Debug] Multiple retries failed, suggesting profile reset');
        toast({
          title: "Profile Recovery Needed",
          description: "We couldn't load your profile after multiple attempts. Try resetting your profile.",
          variant: "destructive",
        });
      }
    }
  };

  // Function to attempt profile recovery with enhanced error handling
  const attemptProfileRecovery = async () => {
    setProfileRecoveryAttempt(true);
    setRecoveryError(null);
    
    try {
      console.log('[RequireAuth Debug] Attempting profile recovery');
      
      // Clear any circuit breakers before attempting recovery
      clearProfileCircuitBreakers();
      
      if (!user?.id) {
        console.error('[RequireAuth Debug] Cannot recover profile: No user ID available');
        setRecoveryError('Unable to recover profile: No user ID available');
        toast({
          title: "Recovery Failed",
          description: "Unable to recover your profile. Please try logging out and back in.",
          variant: "destructive",
        });
        return;
      }
      
      // Create a comprehensive default profile
      const profileData = {
        userId: user.id,
        generalPreferences: {
          inputMethod: 'text',
          reflectionFrequency: 'daily',
          languagePreferences: 'english',
          theme: 'system',
          fontSize: 'medium',
          notificationPreferences: {
            email: true,
            app: true,
            reflectionReminders: true
          }
        },
        privacySettings: {
          localStorageOnly: false,
          allowPersonalization: true,
          enableSync: true,
          shareAnonymousUsageData: false,
          dataRetentionPeriod: 'indefinite'
        }
      };
      
      console.log('[RequireAuth Debug] Attempting to create profile with data:', profileData);
      
      // Use priority flag to bypass circuit breaker and increase retries
      const createdProfile = await API.createOrUpdateUserProfile(profileData, { 
        priority: true, 
        maxRetries: 5 
      });
      
      console.log('[RequireAuth Debug] Profile recovery successful:', createdProfile);
      setShowProfileError(false);
      
      toast({
        title: "Profile Recovered",
        description: "Your profile has been successfully recovered. Refreshing page...",
      });
      
      // Refresh the page after a brief delay
      setTimeout(() => {
        window.location.reload();
      }, 2000);
      
      return createdProfile;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('[RequireAuth Debug] Profile recovery failed:', errorMessage);
      setRecoveryError(`Recovery failed: ${errorMessage}`);
      
      toast({
        title: "Recovery Failed",
        description: "Unable to recover your profile automatically. Please try logging out and back in.",
        variant: "destructive",
      });
      
      return null;
    } finally {
      setProfileRecoveryAttempt(false);
    }
  };

  // Function to log out and redirect to login
  const handleLogout = async () => {
    try {
      console.log('[RequireAuth Debug] Logging out due to profile issues');
      await logout(false);
      
      // Add current path as a return_to parameter to redirect back after login
      const returnPath = encodeURIComponent(location);
      setLocation(`/login?return_to=${returnPath}`);
    } catch (error) {
      console.error('[RequireAuth Debug] Logout failed:', error);
      
      // Force redirect to login if logout fails
      localStorage.removeItem('auth_token');
      setLocation('/login');
    }
  };

  // Nuclear option: clear all local storage and force a clean start
  const handleClearStorage = () => {
    setClearingStorage(true);
    
    try {
      console.log('[RequireAuth Debug] Clearing all local storage');
      localStorage.clear();
      sessionStorage.clear();
      
      // Display confirmation toast
      toast({
        title: "Storage Cleared",
        description: "All local data has been cleared. You will need to log in again.",
      });
      
      // Force reload after a brief delay
      setTimeout(() => {
        window.location.href = '/login';
      }, 1500);
    } catch (error) {
      console.error('[RequireAuth Debug] Error clearing storage:', error);
      
      // Force reload anyway
      setTimeout(() => {
        window.location.href = '/login';
      }, 1500);
    }
  };

  // Function to redirect to login
  const redirectToLogin = () => {
    // Clear any auth token to ensure a clean login
    localStorage.removeItem('auth_token');
    
    // Add current path as a return_to parameter to redirect back after login
    const returnPath = encodeURIComponent(location);
    setLocation(`/login?return_to=${returnPath}`);
  };

  // Toggle detailed technical information
  const toggleDetailedInfo = () => {
    setShowDetailedInfo(!showDetailedInfo);
  };

  useEffect(() => {
    // Redirect to login if not authenticated and not loading
    if (!isAuthenticated && !isLoading) {
      console.log('[RequireAuth Debug] Not authenticated and not loading, redirecting to login');
      redirectToLogin();
    } else {
      console.log('[RequireAuth Debug] Auth state:', { isAuthenticated, isLoading });
    }
  }, [isAuthenticated, isLoading, location, setLocation]);

  // Show loading state while checking authentication
  if (isLoading) {
    console.log('[RequireAuth Debug] Showing loading state');
    return <LoadingAnimation message="Authenticating..." />;
  }

  // Show profile error state with improved layout and actions
  if (showProfileError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 space-y-6">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Profile Error</AlertTitle>
          <AlertDescription>
            We're having trouble loading your profile. This might be due to a temporary issue or 
            your profile data may be missing.
          </AlertDescription>
        </Alert>
        
        {recoveryError && (
          <Alert variant="destructive" className="max-w-md">
            <AlertDescription>
              {recoveryError}
            </AlertDescription>
          </Alert>
        )}
        
        <div className="flex flex-col gap-4 mt-4 w-full max-w-md">
          <Button 
            onClick={retryProfileLoad} 
            variant="outline" 
            disabled={profileRecoveryAttempt || clearingStorage}
            className="flex items-center gap-2"
          >
            <RefreshCcw className="h-4 w-4" /> Retry Loading Profile
          </Button>
          
          <Button
            onClick={attemptProfileRecovery}
            variant="secondary"
            disabled={profileRecoveryAttempt || clearingStorage}
            className="flex items-center gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            {profileRecoveryAttempt ? "Recovering..." : "Reset Profile"}
          </Button>
          
          <Button 
            onClick={handleLogout}
            variant="default"
            disabled={clearingStorage}
          >
            Log Out and Sign In Again
          </Button>
          
          <Button 
            onClick={handleClearStorage} 
            variant="destructive"
            disabled={clearingStorage}
            className="flex items-center gap-2 mt-4"
          >
            <Trash2 className="h-4 w-4" />
            {clearingStorage ? "Clearing..." : "Clear All Data & Restart (Nuclear Option)"}
          </Button>
          
          <Button 
            onClick={toggleDetailedInfo}
            variant="link"
            disabled={clearingStorage}
            className="flex items-center gap-2 mt-2"
          >
            <ExternalLink className="h-4 w-4" />
            {showDetailedInfo ? "Hide Technical Info" : "Show Technical Info"}
          </Button>
        </div>
        
        {showDetailedInfo && (
          <div className="mt-4 p-4 bg-muted text-sm rounded-md max-w-md overflow-auto w-full">
            <h3 className="font-semibold mb-2">Technical Information:</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>User ID: {user?.id || 'Not available'}</li>
              <li>Profile Retry Count: {retryCount}</li>
              <li>Auth State: {isAuthenticated ? 'Authenticated' : 'Not authenticated'}</li>
              <li>Error: {error || 'None'}</li>
              <li>Browser: {navigator.userAgent}</li>
              <li>API Base URL: {API.baseUrl}</li>
              <li>Current Time: {new Date().toISOString()}</li>
            </ul>
            
            <h3 className="font-semibold mt-4 mb-2">Local Storage Keys:</h3>
            <div className="text-xs">
              {Object.keys(localStorage).map(key => (
                <div key={key} className="mb-1">
                  <strong>{key}:</strong> {key.includes('token') 
                    ? '******' 
                    : localStorage.getItem(key)?.substring(0, 30) + 
                      (localStorage.getItem(key)?.length || 0 > 30 ? '...' : '')}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Only render children if authenticated
  console.log('[RequireAuth Debug] Render decision:', { isAuthenticated });
  return isAuthenticated ? <>{children}</> : null;
} 