import { ReactNode, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { LoadingAnimation } from "./LoadingAnimation";

interface RequireAuthProps {
  children: ReactNode;
}

export function RequireAuth({ children }: RequireAuthProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const [location, setLocation] = useLocation();

  useEffect(() => {
    // Redirect to login if not authenticated and not loading
    if (!isAuthenticated && !isLoading) {
      console.log('[RequireAuth Debug] Not authenticated and not loading, redirecting to login');
      // Add current path as a return_to parameter to redirect back after login
      const returnPath = encodeURIComponent(location);
      setLocation(`/login?return_to=${returnPath}`);
    } else {
      console.log('[RequireAuth Debug] Auth state:', { isAuthenticated, isLoading });
    }
  }, [isAuthenticated, isLoading, location, setLocation]);

  // Show loading state while checking authentication
  if (isLoading) {
    console.log('[RequireAuth Debug] Showing loading state');
    return <LoadingAnimation message="Authenticating..." />;
  }

  // Only render children if authenticated
  console.log('[RequireAuth Debug] Render decision:', { isAuthenticated });
  return isAuthenticated ? <>{children}</> : null;
} 