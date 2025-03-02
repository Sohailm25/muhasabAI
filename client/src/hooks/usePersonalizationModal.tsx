import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';

/**
 * Custom hook to manage the personalization modal for first-time users
 * @returns Object with modal open state and functions to manage it
 */
export function usePersonalizationModal() {
  const [isOpen, setIsOpen] = useState(false);
  const { user, isLoading } = useAuth();
  
  useEffect(() => {
    // When auth state is loaded and we have a user 
    if (!isLoading && user) {
      // Check if this is a first-time login
      const hasSeenWelcome = localStorage.getItem(`${user.id}_has_seen_welcome`);
      
      if (!hasSeenWelcome) {
        // Open the modal for first-time users
        setIsOpen(true);
      }
    }
  }, [isLoading, user]);
  
  // Function to close the modal and mark as seen
  const closeModal = () => {
    if (user) {
      localStorage.setItem(`${user.id}_has_seen_welcome`, 'true');
    }
    setIsOpen(false);
  };
  
  // Function to manually open the modal (e.g., from settings)
  const openModal = () => {
    setIsOpen(true);
  };
  
  return {
    isOpen,
    openModal,
    closeModal,
  };
} 