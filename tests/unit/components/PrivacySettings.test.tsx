import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import PrivacySettings from '../../../client/src/components/PrivacySettings';
import { useProfile } from '../../../client/src/hooks/useProfile';

// Mock the useProfile hook
jest.mock('../../../client/src/hooks/useProfile', () => ({
  useProfile: jest.fn(),
}));

describe('PrivacySettings Component', () => {
  // Default mock implementation
  const mockUpdateProfile = jest.fn().mockResolvedValue(undefined);
  const mockResetProfile = jest.fn().mockResolvedValue(undefined);
  
  // Mock return values for useProfile
  beforeEach(() => {
    (useProfile as jest.Mock).mockReturnValue({
      publicProfile: {
        userId: 'user-123',
        privacySettings: {
          localStorageOnly: true,
          allowPersonalization: true,
          enableSync: false,
          dataRetention: '30-days',
        },
      },
      privateProfile: {
        spiritualJourneyStage: 'exploring',
        primaryGoals: ['learn-quran'],
        knowledgeLevel: 'intermediate',
      },
      updateProfile: mockUpdateProfile,
      resetProfile: mockResetProfile,
      isLoading: false,
      error: null,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('renders all privacy settings correctly', () => {
    render(<PrivacySettings />);
    
    // Check that all settings are rendered
    expect(screen.getByText(/Privacy Settings/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Store data locally only/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Personalized experience/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Enable syncing/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Data retention period/i)).toBeInTheDocument();
    
    // Check that settings are initialized with correct values
    expect(screen.getByLabelText(/Store data locally only/i)).toBeChecked();
    expect(screen.getByLabelText(/Personalized experience/i)).toBeChecked();
    expect(screen.getByLabelText(/Enable syncing/i)).not.toBeChecked();
    expect(screen.getByLabelText(/Data retention period/i)).toHaveValue('30-days');
  });

  test('toggles privacy settings correctly', async () => {
    render(<PrivacySettings />);
    
    // Toggle settings
    fireEvent.click(screen.getByLabelText(/Store data locally only/i));
    fireEvent.click(screen.getByLabelText(/Personalized experience/i));
    fireEvent.click(screen.getByLabelText(/Enable syncing/i));
    fireEvent.change(screen.getByLabelText(/Data retention period/i), { target: { value: '90-days' } });
    
    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /Save Settings/i }));
    
    // Check that updateProfile was called with the correct settings
    await waitFor(() => {
      expect(mockUpdateProfile).toHaveBeenCalledWith({
        privacySettings: {
          localStorageOnly: false,
          allowPersonalization: false,
          enableSync: true,
          dataRetention: '90-days',
        },
      });
    });
  });

  test('disables form submission while loading', () => {
    // Mock loading state
    (useProfile as jest.Mock).mockReturnValue({
      publicProfile: {
        userId: 'user-123',
        privacySettings: {
          localStorageOnly: true,
          allowPersonalization: true,
          enableSync: false,
          dataRetention: '30-days',
        },
      },
      updateProfile: mockUpdateProfile,
      isLoading: true,
      error: null,
    });
    
    render(<PrivacySettings />);
    
    // Save button should be disabled
    expect(screen.getByRole('button', { name: /Save Settings/i })).toBeDisabled();
  });

  test('displays warning when disabling personalization', () => {
    render(<PrivacySettings />);
    
    // Initially, no warning should be shown
    expect(screen.queryByText(/This will limit personalized guidance/i)).not.toBeInTheDocument();
    
    // Toggle personalization off
    fireEvent.click(screen.getByLabelText(/Personalized experience/i));
    
    // Warning should now be visible
    expect(screen.getByText(/This will limit personalized guidance/i)).toBeInTheDocument();
  });

  test('displays encryption info when local storage only is enabled', () => {
    render(<PrivacySettings />);
    
    // Encryption info should be visible initially since localStorageOnly is true
    expect(screen.getByText(/Your data is encrypted/i)).toBeInTheDocument();
    
    // Toggle localStorageOnly off
    fireEvent.click(screen.getByLabelText(/Store data locally only/i));
    
    // Encryption info should change to show server storage information
    expect(screen.getByText(/Your data will be stored on our servers/i)).toBeInTheDocument();
  });

  test('allows resetting all privacy data', async () => {
    render(<PrivacySettings />);
    
    // Open the reset dialog (assuming it's opened through a "Reset Data" button)
    fireEvent.click(screen.getByRole('button', { name: /Reset Data/i }));
    
    // Should show a confirmation dialog
    expect(screen.getByText(/Are you sure you want to reset/i)).toBeInTheDocument();
    
    // Confirm the reset
    fireEvent.click(screen.getByRole('button', { name: /Confirm Reset/i }));
    
    // Check that resetProfile was called
    await waitFor(() => {
      expect(mockResetProfile).toHaveBeenCalled();
    });
  });

  test('shows validation errors for invalid inputs', async () => {
    // Mock implementation with custom validation rules
    render(<PrivacySettings />);
    
    // Try to submit with an invalid data retention value (assuming we need to select a value)
    fireEvent.change(screen.getByLabelText(/Data retention period/i), { target: { value: '' } });
    fireEvent.click(screen.getByRole('button', { name: /Save Settings/i }));
    
    // Should show a validation error
    expect(screen.getByText(/Please select a data retention period/i)).toBeInTheDocument();
    
    // updateProfile should not have been called
    expect(mockUpdateProfile).not.toHaveBeenCalled();
  });

  test('shows error message when update fails', async () => {
    // Mock an error response from updateProfile
    mockUpdateProfile.mockRejectedValueOnce(new Error('Failed to update privacy settings'));
    
    render(<PrivacySettings />);
    
    // Submit the form
    fireEvent.click(screen.getByRole('button', { name: /Save Settings/i }));
    
    // Should show an error message
    await waitFor(() => {
      expect(screen.getByText(/Failed to update privacy settings/i)).toBeInTheDocument();
    });
  });

  test('enables syncing when allowPersonalization is turned off', () => {
    render(<PrivacySettings />);
    
    // Turn off personalization
    fireEvent.click(screen.getByLabelText(/Personalized experience/i));
    
    // Sync option should be disabled and unchecked
    expect(screen.getByLabelText(/Enable syncing/i)).toBeDisabled();
    expect(screen.getByLabelText(/Enable syncing/i)).not.toBeChecked();
    
    // Help text should explain why syncing is disabled
    expect(screen.getByText(/Syncing requires personalization to be enabled/i)).toBeInTheDocument();
  });

  test('renders encryption export/import options when local storage is enabled', () => {
    render(<PrivacySettings />);
    
    // With localStorageOnly=true, encryption key backup options should be visible
    expect(screen.getByText(/Export Encryption Key/i)).toBeInTheDocument();
    expect(screen.getByText(/Import Encryption Key/i)).toBeInTheDocument();
    
    // Turn off local storage only
    fireEvent.click(screen.getByLabelText(/Store data locally only/i));
    
    // Backup options should be hidden
    expect(screen.queryByText(/Export Encryption Key/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Import Encryption Key/i)).not.toBeInTheDocument();
  });
}); 