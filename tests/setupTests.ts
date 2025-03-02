import '@testing-library/jest-dom';
import 'jest-localstorage-mock';

// Basic mock for crypto
const cryptoMock = {
  subtle: {
    generateKey: jest.fn().mockResolvedValue('mock-key'),
    exportKey: jest.fn().mockResolvedValue({ k: 'test-key-data' }),
    importKey: jest.fn().mockResolvedValue('mock-key'),
    encrypt: jest.fn().mockResolvedValue(new ArrayBuffer(8)),
    decrypt: jest.fn().mockResolvedValue(new ArrayBuffer(8)),
  },
  getRandomValues: jest.fn().mockImplementation((arr) => arr),
  randomUUID: jest.fn().mockReturnValue('test-uuid-12345'),
};

// Basic mock for TextEncoder/Decoder
const textEncoderMock = {
  encode: jest.fn().mockReturnValue(new Uint8Array(8)),
};

const textDecoderMock = {
  decode: jest.fn().mockReturnValue('{"test":"data"}'),
};

// Apply mocks to global
Object.defineProperty(global, 'crypto', { value: cryptoMock });
Object.defineProperty(global, 'TextEncoder', { value: jest.fn(() => textEncoderMock) });
Object.defineProperty(global, 'TextDecoder', { value: jest.fn(() => textDecoderMock) });

// Mock fetch
global.fetch = jest.fn().mockResolvedValue({
  ok: true,
  status: 200,
  json: jest.fn().mockResolvedValue({}),
});

// Enhanced console logging for tests
const originalLog = console.log;
const originalError = console.error;
const originalWarn = console.warn;

console.log = jest.fn((...args) => originalLog('[TEST]', ...args));
console.error = jest.fn((...args) => originalError('[TEST ERROR]', ...args));
console.warn = jest.fn((...args) => originalWarn('[TEST WARNING]', ...args));

// Reset mocks after each test
afterEach(() => {
  jest.clearAllMocks();
  localStorage.clear();
});

console.log('Test environment setup complete'); 