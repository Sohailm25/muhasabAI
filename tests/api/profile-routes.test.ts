/**
 * API tests for profile routes
 */

import request from 'supertest';
import express, { Express } from 'express';
import { mockProfiles, profileApiMock, resetProfileApiMocks } from '../mocks/profileApiMock';
import { PublicProfile, PrivateProfile, EncryptedProfileData } from '../../client/src/lib/types';
import { db } from '../../server/db';
import profileRoutes from '../../server/routes/profile-routes';

// Mock the database methods
jest.mock('../../server/db', () => ({
  db: {
    getUserProfile: jest.fn(),
    createUserProfile: jest.fn(),
    updateUserProfile: jest.fn(),
    deleteUserProfile: jest.fn(),
    getEncryptedProfileData: jest.fn(),
    createEncryptedProfileData: jest.fn(),
    updateEncryptedProfileData: jest.fn(),
    deleteEncryptedProfileData: jest.fn(),
  }
}));

// Mock authentication middleware
jest.mock('../../server/middleware/auth', () => ({
  requireAuth: (req, res, next) => {
    // Add mock user to request
    req.user = { id: 'test-user-id' };
    next();
  },
}));

// Create a test app
let app: Express;

// Import the routes module - we'll mock its dependencies
const profileRoutes = require('../../server/routes/profile-routes');

describe('Profile API Routes', () => {
  let app: Express;
  const mockedDb = db as jest.Mocked<typeof db>;
  
  // Sample user data
  const testUserId = 'test-user-123';
  const testProfile = {
    userId: testUserId,
    generalPreferences: {
      inputMethod: 'text',
      reflectionFrequency: 'daily',
      languagePreferences: 'english',
    },
    privacySettings: {
      localStorageOnly: false,
      allowPersonalization: true,
      enableSync: true,
    },
    createdAt: Date.now(),
    lastModified: Date.now(),
    version: 1
  };
  
  const encryptedData = {
    userId: testUserId,
    encryptedData: 'encrypted-data-mock',
    iv: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    createdAt: Date.now(),
    lastModified: Date.now(),
    version: 1
  };

  // Auth middleware mock
  const authMiddlewareMock = jest.fn((req, res, next) => {
    req.user = { id: testUserId };
    next();
  });

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Create a fresh app for each test
    app = express();
    app.use(express.json());
    
    // Setup mock auth middleware
    app.use((req, res, next) => {
      authMiddlewareMock(req, res, next);
    });
    
    // Apply routes
    app.use('/api/profile', profileRoutes);
    
    // Reset DB mock implementations
    mockedDb.getUserProfile.mockReset();
    mockedDb.createUserProfile.mockReset();
    mockedDb.updateUserProfile.mockReset();
    mockedDb.deleteUserProfile.mockReset();
    mockedDb.getEncryptedProfileData.mockReset();
    mockedDb.createEncryptedProfileData.mockReset();
    mockedDb.updateEncryptedProfileData.mockReset();
    mockedDb.deleteEncryptedProfileData.mockReset();
  });

  describe('GET /api/profile/:userId', () => {
    test('returns profile when found and user is authorized', async () => {
      mockedDb.getUserProfile.mockResolvedValueOnce(testProfile);
      
      const response = await request(app)
        .get(`/api/profile/${testUserId}`)
        .expect(200);
      
      expect(response.body).toEqual(testProfile);
      expect(mockedDb.getUserProfile).toHaveBeenCalledWith(testUserId);
    });
    
    test('returns 404 when profile not found', async () => {
      mockedDb.getUserProfile.mockResolvedValueOnce(null);
      
      await request(app)
        .get(`/api/profile/${testUserId}`)
        .expect(404);
      
      expect(mockedDb.getUserProfile).toHaveBeenCalledWith(testUserId);
    });
    
    test('returns 403 when user is not authorized', async () => {
      // Override auth middleware for this test
      authMiddlewareMock.mockImplementationOnce((req, res, next) => {
        req.user = { id: 'different-user-id' };
        next();
      });
      
      await request(app)
        .get(`/api/profile/${testUserId}`)
        .expect(403);
      
      expect(mockedDb.getUserProfile).not.toHaveBeenCalled();
    });
  });

  describe('POST /api/profile', () => {
    test('creates a new profile successfully', async () => {
      mockedDb.getUserProfile.mockResolvedValueOnce(null);
      mockedDb.createUserProfile.mockResolvedValueOnce(undefined);
      
      const profileData = {
        generalPreferences: {
          inputMethod: 'text',
          reflectionFrequency: 'weekly',
        },
        privacySettings: {
          localStorageOnly: true,
        }
      };
      
      const response = await request(app)
        .post('/api/profile')
        .send(profileData)
        .expect(201);
      
      expect(response.body).toHaveProperty('userId', testUserId);
      expect(response.body.generalPreferences).toEqual(profileData.generalPreferences);
      expect(mockedDb.createUserProfile).toHaveBeenCalled();
    });
    
    test('returns 409 when profile already exists', async () => {
      mockedDb.getUserProfile.mockResolvedValueOnce(testProfile);
      
      await request(app)
        .post('/api/profile')
        .send({ generalPreferences: { inputMethod: 'text' } })
        .expect(409);
      
      expect(mockedDb.createUserProfile).not.toHaveBeenCalled();
    });
    
    test('returns 400 when required fields are missing', async () => {
      mockedDb.getUserProfile.mockResolvedValueOnce(null);
      
      await request(app)
        .post('/api/profile')
        .send({
          privacySettings: { localStorageOnly: true }
          // Missing generalPreferences
        })
        .expect(400);
      
      expect(mockedDb.createUserProfile).not.toHaveBeenCalled();
    });
  });

  describe('PUT /api/profile/:userId', () => {
    test('updates profile successfully', async () => {
      mockedDb.getUserProfile.mockResolvedValueOnce(testProfile);
      mockedDb.updateUserProfile.mockResolvedValueOnce(undefined);
      
      const updates = {
        generalPreferences: {
          inputMethod: 'voice',
          reflectionFrequency: 'daily',
        }
      };
      
      const response = await request(app)
        .put(`/api/profile/${testUserId}`)
        .send(updates)
        .expect(200);
      
      expect(response.body.generalPreferences.inputMethod).toBe('voice');
      expect(response.body.version).toBe(testProfile.version + 1);
      expect(mockedDb.updateUserProfile).toHaveBeenCalled();
    });
    
    test('returns 404 when profile not found', async () => {
      mockedDb.getUserProfile.mockResolvedValueOnce(null);
      
      await request(app)
        .put(`/api/profile/${testUserId}`)
        .send({ generalPreferences: { inputMethod: 'voice' } })
        .expect(404);
      
      expect(mockedDb.updateUserProfile).not.toHaveBeenCalled();
    });
    
    test('returns 409 when version conflict occurs', async () => {
      mockedDb.getUserProfile.mockResolvedValueOnce({
        ...testProfile,
        version: 5 // Current version is higher
      });
      
      await request(app)
        .put(`/api/profile/${testUserId}`)
        .send({
          generalPreferences: { inputMethod: 'voice' },
          version: 3 // Older version
        })
        .expect(409);
      
      expect(mockedDb.updateUserProfile).not.toHaveBeenCalled();
    });
    
    test('returns 403 when user is not authorized', async () => {
      // Override auth middleware for this test
      authMiddlewareMock.mockImplementationOnce((req, res, next) => {
        req.user = { id: 'different-user-id' };
        next();
      });
      
      await request(app)
        .put(`/api/profile/${testUserId}`)
        .send({ generalPreferences: { inputMethod: 'voice' } })
        .expect(403);
      
      expect(mockedDb.updateUserProfile).not.toHaveBeenCalled();
    });
  });

  describe('DELETE /api/profile/:userId', () => {
    test('deletes profile successfully', async () => {
      mockedDb.getUserProfile.mockResolvedValueOnce(testProfile);
      mockedDb.deleteUserProfile.mockResolvedValueOnce(undefined);
      mockedDb.deleteEncryptedProfileData.mockResolvedValueOnce(undefined);
      
      await request(app)
        .delete(`/api/profile/${testUserId}`)
        .expect(200);
      
      expect(mockedDb.deleteUserProfile).toHaveBeenCalledWith(testUserId);
      expect(mockedDb.deleteEncryptedProfileData).toHaveBeenCalledWith(testUserId);
    });
    
    test('returns 404 when profile not found', async () => {
      mockedDb.getUserProfile.mockResolvedValueOnce(null);
      
      await request(app)
        .delete(`/api/profile/${testUserId}`)
        .expect(404);
      
      expect(mockedDb.deleteUserProfile).not.toHaveBeenCalled();
    });
    
    test('returns 403 when user is not authorized', async () => {
      // Override auth middleware for this test
      authMiddlewareMock.mockImplementationOnce((req, res, next) => {
        req.user = { id: 'different-user-id' };
        next();
      });
      
      await request(app)
        .delete(`/api/profile/${testUserId}`)
        .expect(403);
      
      expect(mockedDb.deleteUserProfile).not.toHaveBeenCalled();
    });
  });

  describe('GET /api/profile/:userId/encrypted', () => {
    test('returns encrypted data when found and user is authorized', async () => {
      mockedDb.getEncryptedProfileData.mockResolvedValueOnce(encryptedData);
      
      const response = await request(app)
        .get(`/api/profile/${testUserId}/encrypted`)
        .expect(200);
      
      expect(response.body).toEqual(encryptedData);
      expect(mockedDb.getEncryptedProfileData).toHaveBeenCalledWith(testUserId);
    });
    
    test('returns 404 when encrypted data not found', async () => {
      mockedDb.getEncryptedProfileData.mockResolvedValueOnce(null);
      
      await request(app)
        .get(`/api/profile/${testUserId}/encrypted`)
        .expect(404);
      
      expect(mockedDb.getEncryptedProfileData).toHaveBeenCalledWith(testUserId);
    });
    
    test('returns 403 when user is not authorized', async () => {
      // Override auth middleware for this test
      authMiddlewareMock.mockImplementationOnce((req, res, next) => {
        req.user = { id: 'different-user-id' };
        next();
      });
      
      await request(app)
        .get(`/api/profile/${testUserId}/encrypted`)
        .expect(403);
      
      expect(mockedDb.getEncryptedProfileData).not.toHaveBeenCalled();
    });
  });

  describe('PUT /api/profile/:userId/encrypted', () => {
    const encryptedDataUpdate = {
      encryptedData: 'new-encrypted-data',
      iv: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
      version: 1
    };
    
    test('creates new encrypted data when none exists', async () => {
      mockedDb.getEncryptedProfileData.mockResolvedValueOnce(null);
      mockedDb.createEncryptedProfileData.mockResolvedValueOnce(undefined);
      
      const response = await request(app)
        .put(`/api/profile/${testUserId}/encrypted`)
        .send(encryptedDataUpdate)
        .expect(201);
      
      expect(response.body).toHaveProperty('userId', testUserId);
      expect(response.body).toHaveProperty('encryptedData', encryptedDataUpdate.encryptedData);
      expect(mockedDb.createEncryptedProfileData).toHaveBeenCalled();
    });
    
    test('updates existing encrypted data', async () => {
      mockedDb.getEncryptedProfileData.mockResolvedValueOnce(encryptedData);
      mockedDb.updateEncryptedProfileData.mockResolvedValueOnce(undefined);
      
      const response = await request(app)
        .put(`/api/profile/${testUserId}/encrypted`)
        .send(encryptedDataUpdate)
        .expect(200);
      
      expect(response.body).toHaveProperty('encryptedData', encryptedDataUpdate.encryptedData);
      expect(response.body).toHaveProperty('version', encryptedData.version + 1);
      expect(mockedDb.updateEncryptedProfileData).toHaveBeenCalled();
    });
    
    test('returns 400 when required fields are missing', async () => {
      await request(app)
        .put(`/api/profile/${testUserId}/encrypted`)
        .send({
          // Missing encryptedData and iv
          version: 1
        })
        .expect(400);
      
      expect(mockedDb.getEncryptedProfileData).not.toHaveBeenCalled();
    });
    
    test('returns 409 when version conflict occurs', async () => {
      mockedDb.getEncryptedProfileData.mockResolvedValueOnce({
        ...encryptedData,
        version: 5 // Current version is higher
      });
      
      await request(app)
        .put(`/api/profile/${testUserId}/encrypted`)
        .send({
          ...encryptedDataUpdate,
          version: 3 // Older version
        })
        .expect(409);
      
      expect(mockedDb.updateEncryptedProfileData).not.toHaveBeenCalled();
    });
    
    test('returns 403 when user is not authorized', async () => {
      // Override auth middleware for this test
      authMiddlewareMock.mockImplementationOnce((req, res, next) => {
        req.user = { id: 'different-user-id' };
        next();
      });
      
      await request(app)
        .put(`/api/profile/${testUserId}/encrypted`)
        .send(encryptedDataUpdate)
        .expect(403);
      
      expect(mockedDb.updateEncryptedProfileData).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    test('should handle database errors gracefully', async () => {
      // Mock database error
      const dbMock = require('../../server/db').db;
      dbMock.query.mockRejectedValueOnce(new Error('Database connection error'));
      
      // Make request
      const response = await request(app)
        .get('/api/profile')
        .expect('Content-Type', /json/)
        .expect(500);
      
      // Verify response
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('server error');
    });
    
    test('should handle unauthorized access', async () => {
      // Override auth middleware mock for this test only
      const authMiddleware = require('../../server/middleware/auth');
      const originalRequireAuth = authMiddleware.requireAuth;
      
      authMiddleware.requireAuth = (req, res, next) => {
        return res.status(401).json({ error: 'Unauthorized' });
      };
      
      // Make request
      const response = await request(app)
        .get('/api/profile')
        .expect('Content-Type', /json/)
        .expect(401);
      
      // Verify response
      expect(response.body).toHaveProperty('error', 'Unauthorized');
      
      // Restore original mock
      authMiddleware.requireAuth = originalRequireAuth;
    });
  });
}); 