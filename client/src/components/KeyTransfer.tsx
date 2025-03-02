import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { exportKeyForBackup, importKeyFromBackup } from '../lib/encryption';

interface KeyTransferProps {
  userId: string;
  onKeyTransferComplete?: () => void;
}

/**
 * KeyTransfer component handles encryption key backup and transfer
 * between devices for the privacy-focused profile system.
 */
export function KeyTransfer({ userId, onKeyTransferComplete }: KeyTransferProps) {
  const [importFile, setImportFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showExportForm, setShowExportForm] = useState<boolean>(false);
  const [showImportForm, setShowImportForm] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle key export
  const handleExportKey = async () => {
    try {
      setError(null);
      
      const result = await exportKeyForBackup();
      
      if (result) {
        setSuccess('Key exported successfully. Save this backup file securely.');
      } else {
        setError('Failed to export encryption key. Please try again.');
      }
    } catch (err) {
      console.error('Error exporting key:', err);
      setError('Failed to export encryption key. Please try again.');
    }
  };

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setImportFile(e.target.files[0]);
    }
  };

  // Handle key import
  const handleImportKey = async () => {
    try {
      setError(null);
      
      if (!importFile) {
        setError('Please select a backup file');
        return;
      }
      
      const result = await importKeyFromBackup(importFile);
      
      if (result) {
        setSuccess('Key imported successfully! You can now access your encrypted data.');
        
        if (onKeyTransferComplete) {
          onKeyTransferComplete();
        }
      } else {
        setError('Failed to import encryption key. The file may be invalid.');
      }
    } catch (err) {
      console.error('Error importing key:', err);
      setError('Failed to import encryption key. Please check your backup file.');
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Encryption Key Management</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {success && (
          <Alert>
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}
        
        <div className="flex space-x-3">
          <Button 
            variant="outline" 
            onClick={() => {
              setShowExportForm(true);
              setShowImportForm(false);
              setError(null);
              setSuccess(null);
            }}
          >
            Backup Encryption Key
          </Button>
          
          <Button 
            variant="outline" 
            onClick={() => {
              setShowImportForm(true);
              setShowExportForm(false);
              setError(null);
              setSuccess(null);
              // Reset file input
              if (fileInputRef.current) {
                fileInputRef.current.value = '';
              }
              setImportFile(null);
            }}
          >
            Restore Encryption Key
          </Button>
        </div>
        
        {showExportForm && (
          <div className="space-y-3 pt-3 border-t">
            <h3 className="text-sm font-medium">Create Key Backup</h3>
            <p className="text-sm text-muted-foreground">
              Download a secure backup of your encryption key
            </p>
            
            <Button onClick={handleExportKey}>
              Download Backup File
            </Button>
            
            <p className="text-xs text-muted-foreground mt-2">
              Store this file somewhere safe. You'll need it to restore access to your encrypted data on other devices.
            </p>
          </div>
        )}
        
        {showImportForm && (
          <div className="space-y-3 pt-3 border-t">
            <h3 className="text-sm font-medium">Restore From Backup</h3>
            <p className="text-sm text-muted-foreground">
              Select your backup file to restore your encryption key
            </p>
            
            <Input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileChange}
              className="mb-2"
            />
            
            <Button 
              onClick={handleImportKey}
              disabled={!importFile}
            >
              Restore Key
            </Button>
            
            <p className="text-xs text-muted-foreground mt-2">
              This will replace your current encryption key. Make sure you have the correct backup file.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default KeyTransfer; 