import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { exportKeyForBackup, importKeyFromBackup } from '../lib/encryption';

export function KeyTransfer() {
  const [activeTab, setActiveTab] = useState('export');
  const [keyData, setKeyData] = useState('');
  const [backupFile, setBackupFile] = useState<File | null>(null);
  const [status, setStatus] = useState('');
  const [statusType, setStatusType] = useState<'success' | 'error' | 'info'>('info');
  
  // Generate QR code with key data
  const generateQRCode = async () => {
    try {
      setStatus('Generating key data...');
      setStatusType('info');
      const storedKey = localStorage.getItem('sahabai_encryption_key');
      
      if (storedKey) {
        setKeyData(storedKey);
        setStatus('Key ready for transfer via QR code');
        setStatusType('success');
      } else {
        setStatus('No encryption key found');
        setStatusType('error');
      }
    } catch (error) {
      console.error('Error generating QR code:', error);
      setStatus('Failed to generate key data');
      setStatusType('error');
    }
  };
  
  // Handle file backup
  const handleBackupKey = async () => {
    try {
      setStatus('Creating backup file...');
      setStatusType('info');
      const result = await exportKeyForBackup();
      
      if (result) {
        setStatus('Backup file created successfully');
        setStatusType('success');
      } else {
        setStatus('Failed to create backup file');
        setStatusType('error');
      }
    } catch (error) {
      console.error('Error backing up key:', error);
      setStatus('Failed to create backup file');
      setStatusType('error');
    }
  };
  
  // Handle file selection for import
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setBackupFile(e.target.files[0]);
    }
  };
  
  // Import key from file
  const handleImportKey = async () => {
    if (!backupFile) {
      setStatus('Please select a backup file');
      setStatusType('error');
      return;
    }
    
    try {
      setStatus('Importing key...');
      setStatusType('info');
      const result = await importKeyFromBackup(backupFile);
      
      if (result) {
        setStatus('Key imported successfully');
        setStatusType('success');
      } else {
        setStatus('Failed to import key');
        setStatusType('error');
      }
    } catch (error) {
      console.error('Error importing key:', error);
      setStatus('Failed to import key');
      setStatusType('error');
    }
  };
  
  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Profile Key Management</CardTitle>
        <CardDescription>
          Transfer your encryption key to access your private data on multiple devices
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-2 mb-4">
            <TabsTrigger value="export">Export Key</TabsTrigger>
            <TabsTrigger value="import">Import Key</TabsTrigger>
          </TabsList>
          
          <TabsContent value="export">
            <div className="space-y-4">
              <div>
                <h3 className="font-medium mb-2">QR Code Transfer</h3>
                <p className="text-sm text-muted-foreground mb-2">
                  Generate a QR code to scan from another device
                </p>
                
                <Button onClick={generateQRCode}>Generate QR Code</Button>
                
                {keyData && (
                  <div className="mt-4 p-4 bg-muted rounded-md overflow-hidden">
                    <p className="text-xs break-all">{keyData}</p>
                    <p className="text-sm mt-2">Copy this text to the other device</p>
                  </div>
                )}
              </div>
              
              <div className="pt-4 border-t">
                <h3 className="font-medium mb-2">File Backup</h3>
                <p className="text-sm text-muted-foreground mb-2">
                  Create a backup file to transfer your key
                </p>
                
                <Button onClick={handleBackupKey}>
                  Download Backup File
                </Button>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="import">
            <div className="space-y-4">
              <div>
                <h3 className="font-medium mb-2">Import from File</h3>
                <p className="text-sm text-muted-foreground mb-2">
                  Select a backup file to restore your key
                </p>
                
                <Input
                  type="file"
                  onChange={handleFileChange}
                  accept=".json"
                  className="mb-2"
                />
                
                <Button 
                  onClick={handleImportKey}
                  disabled={!backupFile}
                >
                  Import Key
                </Button>
              </div>
              
              <div className="pt-4 border-t">
                <h3 className="font-medium mb-2">Manual Key Input</h3>
                <p className="text-sm text-muted-foreground mb-2">
                  Paste the key text from another device
                </p>
                
                <textarea 
                  className="w-full p-2 border rounded-md mb-2 h-24"
                  placeholder="Paste key data here..."
                />
                
                <Button>
                  Import from Text
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
        
        {status && (
          <Alert 
            variant={statusType === 'error' ? 'destructive' : undefined}
            className="mt-4"
          >
            <AlertDescription>{status}</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
} 