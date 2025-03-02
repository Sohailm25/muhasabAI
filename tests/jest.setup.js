// Global Jest setup file for MuhasabAI
import '@testing-library/jest-dom';
import { TextEncoder, TextDecoder } from 'util';

// Mock localStorage and sessionStorage
class StorageMock {
  constructor() {
    this.store = {};
  }

  clear() {
    this.store = {};
  }

  getItem(key) {
    return this.store[key] || null;
  }

  setItem(key, value) {
    this.store[key] = String(value);
  }

  removeItem(key) {
    delete this.store[key];
  }

  key(index) {
    return Object.keys(this.store)[index] || null;
  }

  get length() {
    return Object.keys(this.store).length;
  }
}

global.localStorage = new StorageMock();
global.sessionStorage = new StorageMock();

// Mock Web Crypto API
const cryptoMock = {
  subtle: {
    generateKey: jest.fn(),
    encrypt: jest.fn(),
    decrypt: jest.fn(),
    exportKey: jest.fn(),
    importKey: jest.fn(),
    deriveBits: jest.fn(),
    deriveKey: jest.fn(),
    sign: jest.fn(),
    verify: jest.fn(),
    digest: jest.fn(),
  },
  getRandomValues: jest.fn((array) => {
    // Fill array with deterministic values for testing
    for (let i = 0; i < array.length; i++) {
      array[i] = (i * 10) % 256;
    }
    return array;
  }),
  randomUUID: jest.fn(() => '00000000-0000-0000-0000-000000000000'),
};

Object.defineProperty(global, 'crypto', {
  value: cryptoMock,
  writable: true,
});

// Mock fetch API
global.fetch = jest.fn().mockImplementation(() => 
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({}),
    text: () => Promise.resolve(''),
    blob: () => Promise.resolve(new Blob()),
    formData: () => Promise.resolve(new FormData()),
    arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
    headers: new Headers(),
    status: 200,
    statusText: 'OK',
  })
);

// Mock TextEncoder/TextDecoder
global.TextEncoder = class TextEncoder {
  encode(text) {
    const arr = new Uint8Array(text.length);
    for (let i = 0; i < text.length; i++) {
      arr[i] = text.charCodeAt(i);
    }
    return arr;
  }
};

global.TextDecoder = class TextDecoder {
  decode(arr) {
    let str = '';
    for (let i = 0; i < arr.length; i++) {
      str += String.fromCharCode(arr[i]);
    }
    return str;
  }
};

// Add testing-library matchers
import '@testing-library/jest-dom';

// Set up timers for throttling and debouncing tests
jest.useFakeTimers();

// Reset all mocks between tests
beforeEach(() => {
  jest.clearAllMocks();
  localStorage.clear();
  sessionStorage.clear();
  fetch.mockClear();
});

// Console mocks to reduce noise during tests
global.console = {
  ...console,
  // Keep native behavior for these methods
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
}; 