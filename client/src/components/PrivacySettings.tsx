import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useProfile } from '../hooks/useProfile';
import { exportKeyForBackup } from '../lib/encryption';
import { api } from '../lib/api';

export function PrivacySettings() {
  const { publicProfile, updateProfile, error } = useProfile();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [operationError, setOperationError] = useState<string | null>(null);
  const [operationSuccess, setOperationSuccess] = useState<string | null>(null);
  
  const handlePrivacyToggle = async (setting: string, value: boolean) => {
    if (!publicProfile) return;
    
    try {
      setOperationError(null);
      
      const updatedSettings = {
        ...publicProfile.privacySettings,
        [setting]: value
      };
      
      await updateProfile({
        privacySettings: updatedSettings
      });
      
      setOperationSuccess(`Privacy setting updated successfully`);
      setTimeout(() => setOperationSuccess(null), 3000);
    } catch (err) {
      console.error('Error updating privacy setting:', err);
      setOperationError('Failed to update privacy setting. Please try again.');
    }
  };
  
  const handleDataExport = async () => {
    try {
      setIsExporting(true);
      setOperationError(null);
      await exportAllUserData();
      setOperationSuccess('Your data has been exported successfully');
      setTimeout(() => setOperationSuccess(null), 3000);
    } catch (err) {
      console.error('Error exporting data:', err);
      setOperationError('Failed to export data. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };
  
  const handleDataDeletion = async () => {
    // Show confirmation dialog first
    if (!window.confirm('Are you sure you want to delete all your data? This cannot be undone.')) {
      return;
    }
    
    try {
      setIsDeleting(true);
      setOperationError(null);
      await deleteAllUserData();
      setOperationSuccess('Your data has been deleted successfully');
      setTimeout(() => {
        setOperationSuccess(null);
        // Reload the page to reset the application state
        window.location.href = '/';
      }, 3000);
    } catch (err) {
      console.error('Error deleting data:', err);
      setOperationError('Failed to delete data. Please try again.');
      setIsDeleting(false);
    }
  };
  
  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle>Privacy Settings</CardTitle>
        <CardDescription>
          Control how your data is used and stored
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error.message}</AlertDescription>
          </Alert>
        )}
        
        {operationError && (
          <Alert variant="destructive">
            <AlertDescription>{operationError}</AlertDescription>
          </Alert>
        )}
        
        {operationSuccess && (
          <Alert>
            <AlertDescription>{operationSuccess}</AlertDescription>
          </Alert>
        )}
        
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-medium">Store reflections locally only</h3>
              <p className="text-sm text-muted-foreground">
                Your reflections will never leave your device
              </p>
            </div>
            <Switch 
              checked={publicProfile?.privacySettings?.localStorageOnly || false}
              onCheckedChange={(checked) => handlePrivacyToggle('localStorageOnly', checked)}
            />
          </div>
          
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-medium">Personalize questions and insights</h3>
              <p className="text-sm text-muted-foreground">
                Allow the app to learn your interests and tailor responses
              </p>
            </div>
            <Switch 
              checked={publicProfile?.privacySettings?.allowPersonalization !== false}
              onCheckedChange={(checked) => handlePrivacyToggle('allowPersonalization', checked)}
            />
          </div>
          
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-medium">Sync across devices</h3>
              <p className="text-sm text-muted-foreground">
                Securely sync your encrypted profile across devices
              </p>
            </div>
            <Switch 
              checked={publicProfile?.privacySettings?.enableSync !== false}
              onCheckedChange={(checked) => handlePrivacyToggle('enableSync', checked)}
            />
          </div>
        </div>
        
        <div className="pt-4 border-t">
          <h3 className="font-medium mb-3">Data Management</h3>
          
          <div className="flex space-x-3">
            <Button 
              variant="outline" 
              onClick={handleDataExport}
              disabled={isExporting}
            >
              {isExporting ? 'Exporting...' : 'Export All My Data'}
            </Button>
            
            <Button 
              variant="destructive" 
              onClick={handleDataDeletion}
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete All My Data'}
            </Button>
          </div>
          
          <p className="text-sm text-muted-foreground mt-2">
            Deleting your data will permanently remove all your reflections and profile information
          </p>
        </div>
        
        <div className="pt-4 border-t">
          <h3 className="font-medium mb-3">Encryption Key Management</h3>
          
          <Button 
            variant="outline" 
            onClick={exportKeyForBackup}
          >
            Backup Encryption Key
          </Button>
          
          <p className="text-sm text-muted-foreground mt-2">
            Your encryption key unlocks your private data. Keep this backup secure.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

// Helper function to export all user data
async function exportAllUserData() {
  try {
    // Get public profile
    let publicProfile;
    try {
      publicProfile = await api.getUserProfile();
    } catch (err) {
      console.log('No public profile found or not logged in');
      publicProfile = null;
    }
    
    // Get local encrypted profile
    const encryptedProfileString = localStorage.getItem('sahabai_encrypted_profile');
    const encryptedProfile = encryptedProfileString ? JSON.parse(encryptedProfileString) : null;
    
    // Get conversation history
    const conversationHistoryString = localStorage.getItem('sahabai_conversation_history');
    const conversationHistory = conversationHistoryString ? JSON.parse(conversationHistoryString) : [];
    
    // Get encryption key (don't export the actual key, just metadata for identification)
    const encryptionKeyString = localStorage.getItem('sahabai_encryption_key');
    const encryptionKeyMetadata = encryptionKeyString 
      ? { keyExists: true, createdAt: localStorage.getItem('sahabai_profile_updated_at') } 
      : null;
    
    // Combine all data
    const exportData = {
      publicProfile,
      encryptedProfile,
      conversationHistory,
      encryptionKeyMetadata,
      exportDate: new Date().toISOString()
    };
    
    // Create download file
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    // Generate download link
    const a = document.createElement('a');
    a.href = url;
    a.download = `sahabai-data-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    
    // Clean up
    setTimeout(() => {
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    }, 0);
    
    return true;
  } catch (error) {
    console.error('Error exporting user data:', error);
    throw error;
  }
}

// Helper function to delete all user data
async function deleteAllUserData() {
  try {
    // Delete server-side data
    try {
      await api.deleteUserProfile();
    } catch (err) {
      console.error('Error deleting server profile:', err);
      // Continue with local deletion even if server delete fails
    }
    
    // Clear local storage
    localStorage.removeItem('sahabai_encrypted_profile');
    localStorage.removeItem('sahabai_conversation_history');
    localStorage.removeItem('sahabai_profile_updated_at');
    localStorage.removeItem('sahabai_encryption_key');
    
    return true;
  } catch (error) {
    console.error('Error deleting user data:', error);
    throw error;
  }
} 