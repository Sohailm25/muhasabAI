import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';

export function usePrivacyPolicy() {
  const [isOpen, setIsOpen] = useState(false);
  const { user, isLoading } = useAuth();
  
  useEffect(() => {
    // When auth state is loaded and we have a user 
    if (!isLoading && user) {
      // Check if user has accepted privacy policy
      if (!user.hasAcceptedPrivacyPolicy) {
        setIsOpen(true);
      }
    }
  }, [isLoading, user]);
  
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