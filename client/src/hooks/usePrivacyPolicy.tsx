import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { useLocation } from 'wouter';

export function usePrivacyPolicy() {
  const [isOpen, setIsOpen] = useState(false);
  const { user, isLoading } = useAuth();
  const [location] = useLocation();
  
  // Check if we're on a public page that doesn't need personalization
  const isPublicPage = 
    location === '/' || 
    location === '/login' || 
    location === '/register' || 
    location === '/about' || 
    location.startsWith('/public/');
  
  useEffect(() => {
    // Only show privacy policy modal if:
    // 1. Auth state is loaded
    // 2. We have a user (authenticated)
    // 3. Not on a public page
    // 4. User hasn't accepted privacy policy yet
    if (!isLoading && user && !isPublicPage) {
      // Check if user has accepted privacy policy
      if (!user.hasAcceptedPrivacyPolicy) {
        setIsOpen(true);
      }
    } else {
      // Make sure modal is closed on public pages or when not authenticated
      setIsOpen(false);
    }
  }, [isLoading, user, isPublicPage]);
  
  // Function to handle privacy policy acceptance
  const acceptPrivacyPolicy = async () => {
    if (user) {
      try {
        // Update the user's privacy policy acceptance status in the database
        const response = await fetch('/api/users/accept-privacy-policy', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (!response.ok) {
          throw new Error('Failed to update privacy policy acceptance status');
        }
        
        // Close the modal
        setIsOpen(false);
      } catch (error) {
        console.error('Error updating privacy policy acceptance:', error);
      }
    }
  };
  
  return {
    isOpen,
    acceptPrivacyPolicy,
  };
} 