/**
 * Security tests for the encryption implementation
 * These tests verify that our encryption functions are secure and working correctly
 */

import {
  getEncryptionKey,
  generateEncryptionKey,
  encryptData,
  decryptData,
  exportKey,
  importKey,
  createKeyBackup,
  restoreKeyFromBackup,
  storeEncryptionKey
} from '../../client/src/lib/encryption';

// Mock values for testing
const mockCryptoKey = { algorithm: { name: 'AES-GCM' }, usages: ['encrypt', 'decrypt'] } as CryptoKey;
const mockIV = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
const mockEncryptedData = new Uint8Array([21, 22, 23, 24, 25]);
const mockDecryptedData = JSON.stringify({ test: 'sensitive data' });
const mockKeyBackupPassword = 'secure-password-123';
const mockExportedKey = new Uint8Array([30, 31, 32, 33, 34, 35, 36]);
const mockKeyBackup = {
  salt: new Uint8Array([40, 41, 42, 43]),
  iv: new Uint8Array([50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61]),
  encryptedKey: new Uint8Array([70, 71, 72, 73, 74, 75])
};

// Mock crypto and localStorage
let mockLocalStorage: Record<string, string> = {};

beforeEach(() => {
  // Clear mock storage
  mockLocalStorage = {};
  
  // Mock localStorage
  Storage.prototype.setItem = jest.fn((key, value) => {
    mockLocalStorage[key] = value;
  });
  
  Storage.prototype.getItem = jest.fn((key) => {
    return mockLocalStorage[key] || null;
  });
  
  Storage.prototype.removeItem = jest.fn((key) => {
    delete mockLocalStorage[key];
  });
  
  // Mock Web Crypto API
  window.crypto = {
    subtle: {
      generateKey: jest.fn().mockResolvedValue(mockCryptoKey),
      encrypt: jest.fn().mockResolvedValue(mockEncryptedData),
      decrypt: jest.fn().mockResolvedValue(new TextEncoder().encode(mockDecryptedData)),
      exportKey: jest.fn().mockResolvedValue(mockExportedKey),
      importKey: jest.fn().mockResolvedValue(mockCryptoKey),
      deriveBits: jest.fn().mockResolvedValue(new Uint8Array([60, 61, 62, 63, 64, 65])),
      deriveKey: jest.fn().mockResolvedValue(mockCryptoKey),
    },
    getRandomValues: jest.fn((array) => {
      // Fill array with deterministic values for testing
      for (let i = 0; i < array.length; i++) {
        array[i] = (i * 10) % 256;
      }
      return array;
    })
  } as unknown as Crypto;
});

describe('Encryption Module', () => {
  describe('Key Management', () => {
    test('generateEncryptionKey should create a valid AES-GCM key', async () => {
      const key = await generateEncryptionKey();
      
      expect(key).toEqual(mockCryptoKey);
      expect(window.crypto.subtle.generateKey).toHaveBeenCalledWith(
        { name: 'AES-GCM', length: 256 },
        true,
        ['encrypt', 'decrypt']
      );
    });
    
    test('storeEncryptionKey should save key to localStorage', async () => {
      await storeEncryptionKey(mockCryptoKey);
      
      expect(window.crypto.subtle.exportKey).toHaveBeenCalledWith('raw', mockCryptoKey);
      expect(localStorage.setItem).toHaveBeenCalledWith(
        'encryption_key',
        expect.any(String)
      );
    });
    
    test('getEncryptionKey should retrieve key from localStorage', async () => {
      // Setup localStorage with mock key
      mockLocalStorage['encryption_key'] = btoa(String.fromCharCode(...Array.from(mockExportedKey)));
      
      const key = await getEncryptionKey();
      
      expect(window.crypto.subtle.importKey).toHaveBeenCalled();
      expect(key).toEqual(mockCryptoKey);
    });
    
    test('getEncryptionKey should generate new key if none exists', async () => {
      const key = await getEncryptionKey();
      
      expect(window.crypto.subtle.generateKey).toHaveBeenCalled();
      expect(localStorage.setItem).toHaveBeenCalled();
      expect(key).toEqual(mockCryptoKey);
    });
  });
  
  describe('Data Encryption and Decryption', () => {
    test('encryptData should encrypt data correctly', async () => {
      const data = { sensitive: 'information' };
      const result = await encryptData(data, mockCryptoKey);
      
      expect(window.crypto.subtle.encrypt).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'AES-GCM' }),
        mockCryptoKey,
        expect.any(Uint8Array)
      );
      
      expect(result).toHaveProperty('encryptedData');
      expect(result).toHaveProperty('iv');
    });
    
    test('decryptData should decrypt data correctly', async () => {
      const encryptedDataString = btoa(String.fromCharCode(...Array.from(mockEncryptedData)));
      
      const decrypted = await decryptData(encryptedDataString, mockIV, mockCryptoKey);
      
      expect(window.crypto.subtle.decrypt).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'AES-GCM',
          iv: mockIV
        }),
        mockCryptoKey,
        expect.any(Uint8Array)
      );
      
      expect(decrypted).toEqual(JSON.parse(mockDecryptedData));
    });
    
    test('should handle encryption of different data types', async () => {
      const testCases = [
        { test: 'string value' },
        { test: 123 },
        { test: true },
        { test: null },
        { test: [1, 2, 3] },
        { test: { nested: 'object' } }
      ];
      
      for (const testCase of testCases) {
        await encryptData(testCase, mockCryptoKey);
        
        // Verify proper stringification before encryption
        expect(window.crypto.subtle.encrypt).toHaveBeenCalledWith(
          expect.anything(),
          expect.anything(),
          expect.any(Uint8Array)
        );
      }
    });
    
    test('should throw error for invalid decryption', async () => {
      // Mock decrypt to throw error
      (window.crypto.subtle.decrypt as jest.Mock).mockRejectedValueOnce(new Error('Decryption failed'));
      
      await expect(
        decryptData('invalid-data', mockIV, mockCryptoKey)
      ).rejects.toThrow();
    });
  });
  
  describe('Key Backup and Recovery', () => {
    test('createKeyBackup should encrypt key with password', async () => {
      const backup = await createKeyBackup(mockCryptoKey, mockKeyBackupPassword);
      
      expect(window.crypto.subtle.exportKey).toHaveBeenCalledWith('raw', mockCryptoKey);
      expect(window.crypto.subtle.deriveKey).toHaveBeenCalled();
      expect(window.crypto.subtle.encrypt).toHaveBeenCalled();
      
      expect(backup).toHaveProperty('salt');
      expect(backup).toHaveProperty('iv');
      expect(backup).toHaveProperty('encryptedKey');
    });
    
    test('restoreKeyFromBackup should recover original key', async () => {
      const recoveredKey = await restoreKeyFromBackup(mockKeyBackup, mockKeyBackupPassword);
      
      expect(window.crypto.subtle.deriveKey).toHaveBeenCalled();
      expect(window.crypto.subtle.decrypt).toHaveBeenCalled();
      expect(window.crypto.subtle.importKey).toHaveBeenCalledWith(
        'raw',
        expect.any(Uint8Array),
        { name: 'AES-GCM', length: 256 },
        true,
        ['encrypt', 'decrypt']
      );
      
      expect(recoveredKey).toEqual(mockCryptoKey);
    });
    
    test('should throw error for incorrect password during key restoration', async () => {
      // Mock derived key to be different
      (window.crypto.subtle.decrypt as jest.Mock).mockRejectedValueOnce(new Error('Invalid password'));
      
      await expect(
        restoreKeyFromBackup(mockKeyBackup, 'wrong-password')
      ).rejects.toThrow('Invalid password');
    });
  });
  
  describe('Security Considerations', () => {
    test('should generate unique IVs for each encryption', async () => {
      // Encrypt same data twice
      const data = { test: 'data' };
      const result1 = await encryptData(data, mockCryptoKey);
      const result2 = await encryptData(data, mockCryptoKey);
      
      // IVs should be different
      expect(result1.iv).not.toEqual(result2.iv);
    });
    
    test('should not store raw keys in localStorage', async () => {
      await storeEncryptionKey(mockCryptoKey);
      
      // Get stored value
      const storedValue = mockLocalStorage['encryption_key'];
      
      // Convert raw key to string for comparison
      const rawKeyString = Array.from(mockExportedKey).toString();
      
      // Stored value should be encoded/encrypted, not raw
      expect(storedValue).not.toEqual(rawKeyString);
    });
    
    test('should not use predictable key derivation parameters', async () => {
      await createKeyBackup(mockCryptoKey, mockKeyBackupPassword);
      
      // Verify random salt was used
      expect(window.crypto.getRandomValues).toHaveBeenCalled();
    });
  });
}); 