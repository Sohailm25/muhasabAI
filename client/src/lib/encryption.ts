// Get or create encryption key
export async function getEncryptionKey() {
  try {
    // Try to get existing key from storage
    const storedKey = localStorage.getItem('sahabai_encryption_key');
    
    if (storedKey) {
      // Parse the stored key
      const keyData = JSON.parse(storedKey);
      
      // Import the key
      return await window.crypto.subtle.importKey(
        'jwk',
        keyData,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt', 'decrypt']
      );
    }
    
    // If no key exists, create a new one
    return await generateEncryptionKey();
  } catch (error) {
    console.error('Error getting encryption key:', error);
    throw new Error('Failed to access encryption key. Please reset your profile.');
  }
}

// Generate a new encryption key
export async function generateEncryptionKey() {
  try {
    // Generate a new key
    const key = await window.crypto.subtle.generateKey(
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    );
    
    // Export for storage
    const exportedKey = await window.crypto.subtle.exportKey('jwk', key);
    
    // Store securely
    localStorage.setItem(
      'sahabai_encryption_key',
      JSON.stringify(exportedKey)
    );
    
    return key;
  } catch (error) {
    console.error('Error generating encryption key:', error);
    throw new Error('Failed to create encryption key. Please check your browser settings.');
  }
}

// Encrypt data
export async function encryptData(data: string, key: CryptoKey, iv: Uint8Array) {
  try {
    // Convert data to buffer
    const dataBuffer = new TextEncoder().encode(data);
    
    // Encrypt
    const encryptedBuffer = await window.crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      dataBuffer
    );
    
    // Convert to base64 for storage
    return arrayBufferToBase64(encryptedBuffer);
  } catch (error) {
    console.error('Error encrypting data:', error);
    throw new Error('Failed to encrypt data.');
  }
}

// Decrypt data
export async function decryptData(encryptedData: string, key: CryptoKey, iv: Uint8Array) {
  try {
    // Convert base64 to buffer
    const encryptedBuffer = base64ToArrayBuffer(encryptedData);
    
    // Decrypt
    const decryptedBuffer = await window.crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      encryptedBuffer
    );
    
    // Convert to string
    return new TextDecoder().decode(decryptedBuffer);
  } catch (error) {
    console.error('Error decrypting data:', error);
    throw new Error('Failed to decrypt data. The encryption key may be invalid.');
  }
}

// Helper function: ArrayBuffer to Base64
function arrayBufferToBase64(buffer: ArrayBuffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  
  return btoa(binary);
}

// Helper function: Base64 to ArrayBuffer
function base64ToArrayBuffer(base64: string) {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  
  return bytes.buffer;
}

// Generate key backup
export async function exportKeyForBackup() {
  try {
    const storedKey = localStorage.getItem('sahabai_encryption_key');
    
    if (!storedKey) {
      throw new Error('No encryption key found');
    }
    
    // Create a download of the key
    const blob = new Blob([storedKey], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    // Create download link
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sahabai-key-backup.json';
    document.body.appendChild(a);
    a.click();
    
    // Clean up
    setTimeout(() => {
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    }, 0);
    
    return true;
  } catch (error) {
    console.error('Error exporting key for backup:', error);
    return false;
  }
}

// Import key from backup
export async function importKeyFromBackup(file: File) {
  try {
    // Read file content
    const reader = new FileReader();
    
    return new Promise<boolean>((resolve, reject) => {
      reader.onload = async (event) => {
        try {
          const keyData = event.target?.result as string;
          
          // Validate key format
          const parsedKey = JSON.parse(keyData);
          if (!parsedKey.k || !parsedKey.alg) {
            throw new Error('Invalid key format');
          }
          
          // Store key
          localStorage.setItem('sahabai_encryption_key', keyData);
          
          // Test by getting the key
          await getEncryptionKey();
          
          resolve(true);
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = () => reject(new Error('Failed to read backup file'));
      
      reader.readAsText(file);
    });
  } catch (error) {
    console.error('Error importing key from backup:', error);
    return false;
  }
} 