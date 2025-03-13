import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { useLocation } from 'wouter';

/**
 * Custom hook to manage the personalization modal for first-time users
 * @returns Object with modal open state and functions to manage it
 */
export function usePersonalizationModal() {
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
    // Only show personalization modal if:
    // 1. Auth state is loaded
    // 2. We have a user (authenticated)
    // 3. Not on a public page
    // 4. User hasn't seen the welcome modal before
    if (!isLoading && user && !isPublicPage) {
      // Check if this is a first-time login
      const hasSeenWelcome = localStorage.getItem(`${user.id}_has_seen_welcome`);
      
      if (!hasSeenWelcome) {
        // Open the modal for first-time users, but only on protected pages
        setIsOpen(true);
      }
    } else {
      // Make sure modal is closed on public pages or when not authenticated
      setIsOpen(false);
    }
  }, [isLoading, user, isPublicPage]);
  
  // Function to close the modal and mark as seen
  const closeModal = () => {
    if (user) {
      localStorage.setItem(`${user.id}_has_seen_welcome`, 'true');
    }
    setIsOpen(false);
  };
  
  // Function to manually open the modal (e.g., from settings)
  const openModal = () => {
    // Only allow opening the modal if authenticated and not on a public page
    if (user && !isPublicPage) {
      setIsOpen(true);
    }
  };
  
  return {
    isOpen,
    openModal,
    closeModal,
  };
} 