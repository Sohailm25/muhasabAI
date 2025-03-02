/**
 * Unit tests for the encryption utilities
 */

import {
  getEncryptionKey,
  generateEncryptionKey,
  encryptData,
  decryptData,
  exportKeyForBackup,
  importKeyFromBackup
} from '../../../client/src/lib/encryption';

// Mock dependencies and web APIs
const mockSubtle = {
  generateKey: jest.fn(),
  exportKey: jest.fn(),
  importKey: jest.fn(),
  encrypt: jest.fn(),
  decrypt: jest.fn()
};

const mockCrypto = {
  subtle: mockSubtle,
  getRandomValues: jest.fn(arr => arr)
};

// Setup global crypto mock
Object.defineProperty(global, 'crypto', { value: mockCrypto });

// Mock window to handle localStorage
Object.defineProperty(global, 'localStorage', {
  value: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn()
  }
});

// Create text encoder/decoder mocks
const mockEncoded = new Uint8Array([1, 2, 3, 4]);
const mockTextEncoder = {
  encode: jest.fn().mockReturnValue(mockEncoded)
};

const mockTextDecoder = {
  decode: jest.fn().mockReturnValue('{"test":"value"}')
};

Object.defineProperty(global, 'TextEncoder', { 
  value: jest.fn(() => mockTextEncoder) 
});

Object.defineProperty(global, 'TextDecoder', { 
  value: jest.fn(() => mockTextDecoder) 
});

// Mock document and URL for exportKeyForBackup
const mockCreateElement = jest.fn();
const mockAppendChild = jest.fn();
const mockRemoveChild = jest.fn();
const mockClick = jest.fn();

Object.defineProperty(global, 'document', {
  value: {
    createElement: mockCreateElement,
    body: {
      appendChild: mockAppendChild,
      removeChild: mockRemoveChild
    }
  }
});

Object.defineProperty(global, 'URL', {
  value: {
    createObjectURL: jest.fn(),
    revokeObjectURL: jest.fn()
  }
});

// Helper function to reset all mocks
function resetAllMocks() {
  jest.clearAllMocks();
  localStorage.clear();
  
  // Reset specific mocks
  mockCreateElement.mockReset().mockImplementation(() => ({
    href: '',
    download: '',
    click: mockClick
  }));
}

// Run before each test
beforeEach(() => {
  resetAllMocks();
});

describe('Encryption Utils', () => {
  describe('getEncryptionKey', () => {
    test('should retrieve existing key from localStorage', async () => {
      // Setup mocks
      const mockStoredKey = JSON.stringify({ key: 'test-key' });
      const mockKey = 'crypto-key-object';
      
      localStorage.getItem.mockReturnValueOnce(mockStoredKey);
      mockSubtle.importKey.mockResolvedValueOnce(mockKey);
      
      // Execute test
      const result = await getEncryptionKey();
      
      // Assertions
      expect(localStorage.getItem).toHaveBeenCalledWith('sahabai_encryption_key');
      expect(mockSubtle.importKey).toHaveBeenCalledWith(
        'jwk',
        JSON.parse(mockStoredKey),
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt', 'decrypt']
      );
      expect(result).toBe(mockKey);
    });
    
    test('should generate new key if none exists', async () => {
      // Setup mocks
      localStorage.getItem.mockReturnValueOnce(null);
      const mockKey = 'new-crypto-key';
      mockSubtle.generateKey.mockResolvedValueOnce(mockKey);
      mockSubtle.exportKey.mockResolvedValueOnce({ k: 'exported-key' });
      
      // Execute test
      const result = await getEncryptionKey();
      
      // Assertions
      expect(localStorage.getItem).toHaveBeenCalledWith('sahabai_encryption_key');
      expect(mockSubtle.generateKey).toHaveBeenCalled();
      expect(localStorage.setItem).toHaveBeenCalled();
      expect(result).toBe(mockKey);
    });
    
    test('should handle errors', async () => {
      // Setup mocks
      localStorage.getItem.mockImplementationOnce(() => {
        throw new Error('Storage error');
      });
      
      // Execute test & assert
      await expect(getEncryptionKey()).rejects.toThrow('Failed to access encryption key');
    });
  });
  
  describe('generateEncryptionKey', () => {
    test('should generate and store a new key', async () => {
      // Setup mocks
      const mockKey = 'new-crypto-key';
      const mockExportedKey = { k: 'exported-key-data' };
      
      mockSubtle.generateKey.mockResolvedValueOnce(mockKey);
      mockSubtle.exportKey.mockResolvedValueOnce(mockExportedKey);
      
      // Execute test
      const result = await generateEncryptionKey();
      
      // Assertions
      expect(mockSubtle.generateKey).toHaveBeenCalledWith(
        { name: 'AES-GCM', length: 256 },
        true,
        ['encrypt', 'decrypt']
      );
      expect(mockSubtle.exportKey).toHaveBeenCalledWith('jwk', mockKey);
      expect(localStorage.setItem).toHaveBeenCalledWith(
        'sahabai_encryption_key',
        JSON.stringify(mockExportedKey)
      );
      expect(result).toBe(mockKey);
    });
    
    test('should handle errors', async () => {
      // Setup mocks
      mockSubtle.generateKey.mockRejectedValueOnce(new Error('Crypto error'));
      
      // Execute test & assert
      await expect(generateEncryptionKey()).rejects.toThrow('Failed to create encryption key');
    });
  });
  
  describe('encryptData', () => {
    test('should encrypt data correctly', async () => {
      // Setup mocks
      const mockKey = 'crypto-key';
      const mockIv = new Uint8Array(12);
      const mockData = 'test data';
      const mockEncryptedBuffer = new ArrayBuffer(8);
      
      mockSubtle.encrypt.mockResolvedValueOnce(mockEncryptedBuffer);
      
      // Mock for arrayBufferToBase64
      const btoa = jest.spyOn(global, 'btoa').mockReturnValueOnce('base64-encoded');
      
      // Execute test
      const result = await encryptData(mockData, mockKey, mockIv);
      
      // Assertions
      expect(mockTextEncoder.encode).toHaveBeenCalledWith(mockData);
      expect(mockSubtle.encrypt).toHaveBeenCalledWith(
        { name: 'AES-GCM', iv: mockIv },
        mockKey,
        mockEncoded
      );
      expect(btoa).toHaveBeenCalled();
      expect(result).toBe('base64-encoded');
      
      // Cleanup
      btoa.mockRestore();
    });
    
    test('should handle encryption errors', async () => {
      // Setup mocks
      mockSubtle.encrypt.mockRejectedValueOnce(new Error('Encryption failed'));
      
      // Execute test & assert
      await expect(encryptData('data', 'key', new Uint8Array(12))).rejects.toThrow('Failed to encrypt data');
    });
  });
  
  describe('decryptData', () => {
    test('should decrypt data correctly', async () => {
      // Setup mocks
      const mockKey = 'crypto-key';
      const mockIv = new Uint8Array(12);
      const mockEncryptedData = 'encrypted-base64';
      const mockDecryptedBuffer = new ArrayBuffer(8);
      
      const atob = jest.spyOn(global, 'atob').mockReturnValueOnce('decoded-binary');
      mockSubtle.decrypt.mockResolvedValueOnce(mockDecryptedBuffer);
      
      // Execute test
      const result = await decryptData(mockEncryptedData, mockKey, mockIv);
      
      // Assertions
      expect(atob).toHaveBeenCalledWith(mockEncryptedData);
      expect(mockSubtle.decrypt).toHaveBeenCalledWith(
        { name: 'AES-GCM', iv: mockIv },
        mockKey,
        expect.any(ArrayBuffer)
      );
      expect(mockTextDecoder.decode).toHaveBeenCalledWith(mockDecryptedBuffer);
      expect(result).toBe('{"test":"value"}');
      
      // Cleanup
      atob.mockRestore();
    });
    
    test('should handle decryption errors', async () => {
      // Setup mocks
      mockSubtle.decrypt.mockRejectedValueOnce(new Error('Decryption failed'));
      const atob = jest.spyOn(global, 'atob').mockReturnValueOnce('decoded-binary');
      
      // Execute test & assert
      await expect(decryptData('data', 'key', new Uint8Array(12))).rejects.toThrow('Failed to decrypt data');
      
      // Cleanup
      atob.mockRestore();
    });
  });
  
  describe('exportKeyForBackup', () => {
    test('should create and trigger download of key backup', async () => {
      // Setup mocks
      const mockStoredKey = JSON.stringify({ key: 'test-key' });
      localStorage.getItem.mockReturnValueOnce(mockStoredKey);
      
      const mockBlob = {};
      const mockURL = 'blob:url';
      
      global.Blob = jest.fn().mockImplementationOnce(() => mockBlob);
      URL.createObjectURL.mockReturnValueOnce(mockURL);
      
      const mockLink = {
        href: '',
        download: '',
        click: mockClick
      };
      
      mockCreateElement.mockReturnValueOnce(mockLink);
      
      // Setup setTimeout mock
      jest.useFakeTimers();
      
      // Execute test
      const result = await exportKeyForBackup();
      
      // Fast-forward timers
      jest.runAllTimers();
      
      // Assertions
      expect(localStorage.getItem).toHaveBeenCalledWith('sahabai_encryption_key');
      expect(global.Blob).toHaveBeenCalledWith([mockStoredKey], { type: 'application/json' });
      expect(URL.createObjectURL).toHaveBeenCalledWith(mockBlob);
      expect(mockCreateElement).toHaveBeenCalledWith('a');
      expect(mockLink.href).toBe(mockURL);
      expect(mockLink.download).toBe('sahabai-key-backup.json');
      expect(mockAppendChild).toHaveBeenCalledWith(mockLink);
      expect(mockClick).toHaveBeenCalled();
      expect(mockRemoveChild).toHaveBeenCalledWith(mockLink);
      expect(URL.revokeObjectURL).toHaveBeenCalledWith(mockURL);
      expect(result).toBe(true);
      
      // Clean up
      jest.useRealTimers();
    });
    
    test('should handle case when no key exists', async () => {
      // Setup mocks
      localStorage.getItem.mockReturnValueOnce(null);
      
      // Execute test & assert
      await expect(exportKeyForBackup()).rejects.toThrow('No encryption key found');
    });
    
    test('should handle export errors', async () => {
      // Setup mocks
      localStorage.getItem.mockImplementationOnce(() => {
        throw new Error('Storage error');
      });
      
      // Execute test
      const result = await exportKeyForBackup();
      
      // Assertions
      expect(result).toBe(false);
    });
  });
  
  describe('importKeyFromBackup', () => {
    test('should successfully import key from file', async () => {
      // Setup mocks
      const mockFile = new File(['{"k":"key-data","alg":"A256GCM"}'], 'backup.json', { 
        type: 'application/json' 
      });
      
      // Mock FileReader
      const mockFileReader = {
        onload: null,
        onerror: null,
        readAsText: jest.fn().mockImplementation(function(file) {
          this.onload({ target: { result: '{"k":"key-data","alg":"A256GCM"}' } });
        })
      };
      
      global.FileReader = jest.fn(() => mockFileReader);
      
      const mockKey = 'imported-crypto-key';
      mockSubtle.importKey.mockResolvedValueOnce(mockKey);
      
      // Execute test
      const result = await importKeyFromBackup(mockFile);
      
      // Assertions
      expect(mockFileReader.readAsText).toHaveBeenCalledWith(mockFile);
      expect(localStorage.setItem).toHaveBeenCalledWith(
        'sahabai_encryption_key',
        '{"k":"key-data","alg":"A256GCM"}'
      );
      expect(result).toBe(true);
    });
    
    test('should reject invalid key format', async () => {
      // Setup mocks
      const mockFile = new File(['{"invalid":"format"}'], 'backup.json', { 
        type: 'application/json' 
      });
      
      // Mock FileReader
      const mockFileReader = {
        onload: null,
        onerror: null,
        readAsText: jest.fn().mockImplementation(function(file) {
          this.onload({ target: { result: '{"invalid":"format"}' } });
        })
      };
      
      global.FileReader = jest.fn(() => mockFileReader);
      
      // Execute test & assert
      await expect(importKeyFromBackup(mockFile)).rejects.toThrow('Invalid key format');
    });
    
    test('should handle file read errors', async () => {
      // Setup mocks
      const mockFile = new File([''], 'backup.json', { type: 'application/json' });
      
      // Mock FileReader with error
      const mockFileReader = {
        onload: null,
        onerror: null,
        readAsText: jest.fn().mockImplementation(function(file) {
          this.onerror();
        })
      };
      
      global.FileReader = jest.fn(() => mockFileReader);
      
      // Execute test & assert
      await expect(importKeyFromBackup(mockFile)).rejects.toThrow('Failed to read backup file');
    });
    
    test('should handle key import errors', async () => {
      // Setup mocks
      const mockFile = new File(['{"k":"key-data","alg":"A256GCM"}'], 'backup.json', { 
        type: 'application/json' 
      });
      
      // Mock FileReader
      const mockFileReader = {
        onload: null,
        onerror: null,
        readAsText: jest.fn().mockImplementation(function(file) {
          this.onload({ target: { result: '{"k":"key-data","alg":"A256GCM"}' } });
        })
      };
      
      global.FileReader = jest.fn(() => mockFileReader);
      
      // Mock error during getEncryptionKey
      mockSubtle.importKey.mockRejectedValueOnce(new Error('Import error'));
      
      // Execute test
      const result = await importKeyFromBackup(mockFile);
      
      // Assertions
      expect(result).toBe(false);
    });
  });
}); 