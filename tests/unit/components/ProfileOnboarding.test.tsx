/**
 * Unit tests for the ProfileOnboarding component
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ProfileOnboarding } from '../../../client/src/components/ProfileOnboarding';
import { useProfile } from '../../../client/src/hooks/useProfile';

// Mock the useProfile hook
jest.mock('../../../client/src/hooks/useProfile', () => ({
  useProfile: jest.fn(),
}));

describe('ProfileOnboarding Component', () => {
  // Mock function for onComplete prop
  const mockOnComplete = jest.fn();
  
  // Setup for each test
  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    
    // Setup default mock implementation for useProfile
    (useProfile as jest.Mock).mockReturnValue({
      updateProfile: jest.fn().mockResolvedValue({}),
      publicProfile: null,
      privateProfile: null,
      isLoading: false,
      error: null,
    });
  });

  test('renders the onboarding component with initial view', () => {
    render(<ProfileOnboarding onComplete={mockOnComplete} />);
    
    // Check if privacy settings section is visible
    expect(screen.getByText(/Welcome to SahabAI/i)).toBeInTheDocument();
    expect(screen.getByText(/Your privacy is important to us/i)).toBeInTheDocument();
    
    // Check for privacy checkboxes
    expect(screen.getByText(/Store reflections locally/i)).toBeInTheDocument();
    expect(screen.getByText(/Allow personalization/i)).toBeInTheDocument();
    expect(screen.getByText(/Enable secure sync/i)).toBeInTheDocument();
  });
  
  test('navigates to the next step when continue button is clicked', () => {
    render(<ProfileOnboarding onComplete={mockOnComplete} />);
    
    // Click the continue button
    fireEvent.click(screen.getByText(/Continue/i));
    
    // Now we should see the personal info section
    expect(screen.getByText(/Tell us about yourself/i)).toBeInTheDocument();
    expect(screen.getByText(/Spiritual journey stage/i)).toBeInTheDocument();
  });
  
  test('collects user preferences correctly', async () => {
    const mockUpdateProfile = jest.fn().mockResolvedValue({});
    (useProfile as jest.Mock).mockReturnValue({
      updateProfile: mockUpdateProfile,
      publicProfile: null,
      privateProfile: null,
      isLoading: false,
      error: null,
    });
    
    render(<ProfileOnboarding onComplete={mockOnComplete} />);
    
    // Set privacy preferences
    const localStorageCheckbox = screen.getByLabelText(/Store reflections locally/i);
    const personalizationCheckbox = screen.getByLabelText(/Allow personalization/i);
    
    fireEvent.click(localStorageCheckbox);
    fireEvent.click(personalizationCheckbox);
    
    // Navigate to personal info
    fireEvent.click(screen.getByText(/Continue/i));
    
    // Set spiritual journey stage
    fireEvent.change(screen.getByLabelText(/Spiritual journey stage/i), {
      target: { value: 'exploring' },
    });
    
    // Select a primary goal (assuming checkbox)
    fireEvent.click(screen.getByLabelText(/Learn more about Islam/i));
    
    // Navigate to next step
    fireEvent.click(screen.getByText(/Continue/i));
    
    // Set reflection preferences
    fireEvent.change(screen.getByLabelText(/Preferred reflection style/i), {
      target: { value: 'scholarly' },
    });
    
    // Select guidance preferences
    fireEvent.click(screen.getByLabelText(/Quran references/i));
    
    // Submit the form
    fireEvent.click(screen.getByText(/Complete Profile/i));
    
    // Wait for profile update to be called
    await waitFor(() => {
      expect(mockUpdateProfile).toHaveBeenCalled();
    });
    
    // Verify update was called with correct data
    expect(mockUpdateProfile).toHaveBeenCalledWith(
      expect.objectContaining({
        privacySettings: expect.objectContaining({
          localStorageOnly: true,
          allowPersonalization: true,
        }),
      }),
      expect.objectContaining({
        spiritualJourneyStage: 'exploring',
        primaryGoals: expect.arrayContaining(['Learn more about Islam']),
        reflectionStyle: 'scholarly',
        guidancePreferences: expect.arrayContaining(['Quran references']),
      })
    );
    
    // Verify onComplete callback was called
    expect(mockOnComplete).toHaveBeenCalled();
  });
  
  test('handles error during profile submission', async () => {
    const mockError = new Error('Profile creation failed');
    const mockUpdateProfile = jest.fn().mockRejectedValue(mockError);
    
    (useProfile as jest.Mock).mockReturnValue({
      updateProfile: mockUpdateProfile,
      publicProfile: null,
      privateProfile: null,
      isLoading: false,
      error: null,
    });
    
    render(<ProfileOnboarding onComplete={mockOnComplete} />);
    
    // Navigate to the last step quickly
    fireEvent.click(screen.getByText(/Continue/i)); // Privacy to Personal
    fireEvent.click(screen.getByText(/Continue/i)); // Personal to Preferences
    
    // Submit the form
    fireEvent.click(screen.getByText(/Complete Profile/i));
    
    // Wait for error message to appear
    await waitFor(() => {
      expect(screen.getByText(/Error creating profile/i)).toBeInTheDocument();
    });
    
    // Verify onComplete was not called
    expect(mockOnComplete).not.toHaveBeenCalled();
  });
  
  test('validates required fields before submission', async () => {
    render(<ProfileOnboarding onComplete={mockOnComplete} />);
    
    // Skip to the last step without filling anything
    fireEvent.click(screen.getByText(/Continue/i)); // Privacy to Personal
    fireEvent.click(screen.getByText(/Continue/i)); // Personal to Preferences
    
    // Submit with empty form
    fireEvent.click(screen.getByText(/Complete Profile/i));
    
    // Should see validation message
    await waitFor(() => {
      expect(screen.getByText(/Please complete required fields/i)).toBeInTheDocument();
    });
    
    // Verify updateProfile was not called
    const { updateProfile } = useProfile();
    expect(updateProfile).not.toHaveBeenCalled();
  });
}); 