import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ProfileIntegration } from '../../../client/src/components/ProfileIntegration';
import { useProfile } from '../../../client/src/hooks/useProfile';

// Mock the useProfile hook
jest.mock('../../../client/src/hooks/useProfile', () => ({
  useProfile: jest.fn(),
}));

describe('ProfileIntegration Component', () => {
  // Set up mock return values for useProfile hook
  const mockProfile = {
    publicProfile: {
      userId: 'user123',
      generalPreferences: {
        inputMethod: 'text',
        reflectionFrequency: 'daily',
        languagePreferences: 'english',
      },
      privacySettings: {
        localStorageOnly: true,
        allowPersonalization: true,
        enableSync: false,
      },
    },
    privateProfile: {
      spiritualJourneyStage: 'beginner',
      primaryGoals: ['learn-quran', 'daily-prayer'],
      knowledgeLevel: 'intermediate',
      guidancePreferences: ['practical', 'quran-based'],
    },
    isLoading: false,
    error: null,
    updateProfile: jest.fn(),
    getProfileForAI: jest.fn().mockResolvedValue({
      preferences: {
        inputMethod: 'text',
        language: 'english',
      },
      spiritualContext: {
        journeyStage: 'beginner',
        knowledgeLevel: 'intermediate',
        primaryGoals: ['learn-quran', 'daily-prayer'],
      },
      interests: ['quran', 'daily-practice'],
    }),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useProfile as jest.Mock).mockReturnValue(mockProfile);
  });

  test('renders profile data when loaded', () => {
    render(<ProfileIntegration />);
    
    // Check if profile information is displayed
    expect(screen.getByText(/User Profile/i)).toBeInTheDocument();
    expect(screen.getByText(/user123/i)).toBeInTheDocument();
    expect(screen.getByText(/beginner/i)).toBeInTheDocument();
    expect(screen.getByText(/intermediate/i)).toBeInTheDocument();
    expect(screen.getByText(/daily-prayer/i)).toBeInTheDocument();
  });

  test('displays loading state', () => {
    (useProfile as jest.Mock).mockReturnValue({
      ...mockProfile,
      isLoading: true,
      publicProfile: null,
      privateProfile: null,
    });

    render(<ProfileIntegration />);
    
    expect(screen.getByText(/Loading profile.../i)).toBeInTheDocument();
  });

  test('displays error message when profile load fails', () => {
    const errorMessage = 'Failed to load profile';
    (useProfile as jest.Mock).mockReturnValue({
      ...mockProfile,
      error: new Error(errorMessage),
      publicProfile: null,
      privateProfile: null,
    });

    render(<ProfileIntegration />);
    
    expect(screen.getByText(new RegExp(errorMessage, 'i'))).toBeInTheDocument();
  });

  test('updates profile when form is submitted', async () => {
    render(<ProfileIntegration />);
    
    // Find and interact with form elements
    const inputMethodSelect = screen.getByLabelText(/Input Method/i);
    const submitButton = screen.getByRole('button', { name: /Update Profile/i });
    
    // Change the input method preference
    fireEvent.change(inputMethodSelect, { target: { value: 'voice' } });
    
    // Submit the form
    fireEvent.click(submitButton);
    
    // Wait for the update to process
    await waitFor(() => {
      expect(mockProfile.updateProfile).toHaveBeenCalledWith(
        expect.objectContaining({
          generalPreferences: expect.objectContaining({
            inputMethod: 'voice',
          }),
        }),
        expect.anything()
      );
    });
  });

  test('handles privacy settings changes', () => {
    render(<ProfileIntegration />);
    
    // Find privacy setting checkboxes
    const personalizationToggle = screen.getByLabelText(/Allow Personalization/i);
    
    // Toggle personalization off
    fireEvent.click(personalizationToggle);
    
    // Check that the state was updated
    expect(personalizationToggle).not.toBeChecked();
  });

  test('displays AI-ready profile data', async () => {
    render(<ProfileIntegration />);
    
    // Find and click the button to show AI profile
    const showAIProfileButton = screen.getByRole('button', { name: /Show AI Context/i });
    fireEvent.click(showAIProfileButton);
    
    // Wait for the AI profile to be displayed
    await waitFor(() => {
      expect(mockProfile.getProfileForAI).toHaveBeenCalled();
      // Check some expected values in the AI profile
      expect(screen.getByText(/"journeyStage": "beginner"/i)).toBeInTheDocument();
      expect(screen.getByText(/"language": "english"/i)).toBeInTheDocument();
    });
  });

  test('handles empty profile data gracefully', () => {
    (useProfile as jest.Mock).mockReturnValue({
      ...mockProfile,
      publicProfile: {
        userId: 'user123',
        generalPreferences: {},
        privacySettings: {},
      },
      privateProfile: {
        spiritualJourneyStage: '',
        primaryGoals: [],
        knowledgeLevel: '',
        guidancePreferences: [],
      },
    });

    render(<ProfileIntegration />);
    
    // Check if the component renders without errors
    expect(screen.getByText(/User Profile/i)).toBeInTheDocument();
    expect(screen.getByText(/user123/i)).toBeInTheDocument();
    
    // Not finding these values because they're empty
    expect(screen.queryByText(/beginner/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/intermediate/i)).not.toBeInTheDocument();
  });
}); 