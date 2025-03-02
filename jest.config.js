/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  roots: ['src', 'tests'],
  moduleNameMapper: {
    // Handle CSS imports (with CSS modules)
    '\\.module\\.(css|sass|scss)$': 'identity-obj-proxy',
    
    // Handle CSS imports (without CSS modules)
    '\\.(css|sass|scss)$': '<rootDir>/__mocks__/styleMock.js',
    
    // Handle image imports
    '\\.(jpg|jpeg|png|gif|webp|svg)$': '<rootDir>/__mocks__/fileMock.js',
    
    // Handle module aliases
    '^@components/(.*)$': '<rootDir>/client/src/components/$1',
    '^@lib/(.*)$': '<rootDir>/client/src/lib/$1',
    '^@hooks/(.*)$': '<rootDir>/client/src/hooks/$1',
    '^@api/(.*)$': '<rootDir>/client/src/api/$1',
    
    // Absolute path resolution for client/server imports in tests
    '^client/(.*)$': '<rootDir>/client/$1',
    '^server/(.*)$': '<rootDir>/server/$1',
  },
  setupFilesAfterEnv: [
    '<rootDir>/tests/jest.setup.js',
    '<rootDir>/tests/setupTests.ts'
  ],
  collectCoverageFrom: [
    'client/src/**/*.{js,jsx,ts,tsx}',
    'server/**/*.{js,ts}',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/vendor/**'
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  },
  watchPlugins: [
    'jest-watch-typeahead/filename',
    'jest-watch-typeahead/testname'
  ],
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      tsconfig: 'tsconfig.json',
      isolatedModules: true,
      jsx: 'react'
    }]
  },
  moduleDirectories: ['node_modules', '<rootDir>'],
  globals: {
    'ts-jest': {
      isolatedModules: true,
      jsx: 'react'
    }
  },
  verbose: true
}; 