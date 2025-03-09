import express from 'express';
import { log } from '../vite';
import jwt from 'jsonwebtoken';
import { 
  getUserProfile,
  createUserProfile,
  updateUserProfile,
  deleteUserProfile,
  getEncryptedProfileData,
  updateEncryptedProfileData,
  deleteEncryptedProfileData
} from '../db/index'; // Import specific functions from db/index
import { ProfileRepository } from '../database/profile-repository';
import { AuthenticationError, NotFoundError } from '../utils/errors';
import { Pool } from 'pg';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'sahabai-secret-key';

// Initialize profile repository
let profileRepository: ProfileRepository;

export function initProfileRoutes(db: Pool) {
  console.log('[PROFILE_ROUTES] Initializing profile routes with database connection');
  profileRepository = new ProfileRepository(db);
  return router;
}

/**
 * Middleware to verify JWT token
 */
const verifyToken = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.log('[PROFILE_ROUTES] Verifying token for request:', req.path);
  
  try {
    const authHeader = req.headers.authorization;
    console.log('[PROFILE_ROUTES] Auth header present:', !!authHeader);
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('[PROFILE_ROUTES] Invalid auth header format');
      throw new AuthenticationError('No token provided');
    }
    
    const token = authHeader.split(' ')[1];
    console.log('[PROFILE_ROUTES] Token extracted from header:', token ? `${token.substring(0, 10)}...` : 'None');
    
    try {
      console.log('[PROFILE_ROUTES] Verifying JWT token with secret:', JWT_SECRET ? `${JWT_SECRET.substring(0, 5)}...` : 'None');
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      
      // Ensure we have a userId
      if (!decoded || typeof decoded !== 'object' || !decoded.userId) {
        console.log('[PROFILE_ROUTES] Invalid token payload - no userId:', decoded);
        throw new AuthenticationError('Invalid token format');
      }
      
      console.log('[PROFILE_ROUTES] JWT verification successful, userId:', decoded.userId);
      console.log('[PROFILE_ROUTES] Full decoded payload:', JSON.stringify(decoded));
      
      // Attach user ID to request
      (req as any).userId = decoded.userId;
      next();
    } catch (error) {
      console.log('[PROFILE_ROUTES] JWT verification failed:', error);
      throw new AuthenticationError('Invalid or expired token');
    }
  } catch (error) {
    next(error);
  }
};

/**
 * GET /profile - Get user profile
 */
router.get('/', verifyToken, async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  try {
    console.log('[PROFILE_ROUTES] GET / request received');
    console.log('[PROFILE_ROUTES] Headers:', req.headers);
    
    const userId = (req as any).userId;
    console.log('[PROFILE_ROUTES] Profile requested for authenticated user:', userId);
    
    try {
      const profile = await profileRepository.getUserProfileById(userId);
      
      // Format response
      const response = {
        id: profile.id,
        userId: profile.user_id,
        preferences: typeof profile.preferences === 'string' 
          ? JSON.parse(profile.preferences) 
          : profile.preferences,
        sharingPreferences: typeof profile.sharing_preferences === 'string'
          ? JSON.parse(profile.sharing_preferences)
          : profile.sharing_preferences,
        version: profile.version || 1,
        createdAt: profile.created_at,
        updatedAt: profile.updated_at
      };
      
      console.log('[PROFILE_ROUTES] Profile found, returning data');
      res.json(response);
    } catch (error) {
      console.log('[PROFILE_ROUTES] Error getting profile:', error);
      
      if (error instanceof NotFoundError) {
        console.log('[PROFILE_ROUTES] Profile not found, returning 404');
        res.status(404).json({ error: 'Profile not found' });
      } else {
        next(error);
      }
    }
  } catch (error) {
    next(error);
  }
});

/**
 * POST /profile - Create or update user profile
 */
router.post('/', verifyToken, async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  try {
    console.log('[PROFILE_ROUTES] POST / request received');
    console.log('[PROFILE_ROUTES] Headers:', req.headers);
    console.log('[PROFILE_ROUTES] Body:', req.body);
    
    const userId = (req as any).userId;
    console.log('[PROFILE_ROUTES] Creating/updating profile for authenticated user:', userId);
    
    // Validate request body
    if (!req.body) {
      throw new Error('Request body is required');
    }
    
    // Ensure userId in token matches userId in request body (if provided)
    if (req.body.userId && req.body.userId !== userId) {
      console.log('[PROFILE_ROUTES] User ID mismatch:', { tokenUserId: userId, bodyUserId: req.body.userId });
      throw new AuthenticationError('User ID mismatch between token and request body');
    }
    
    // Prepare profile data
    const profileData = {
      userId,
      preferences: req.body.generalPreferences || req.body.preferences || {},
      sharingPreferences: req.body.privacySettings || req.body.sharingPreferences || {}
    };
    
    console.log('[PROFILE_ROUTES] Processed profile data:', profileData);
    
    // Create or update profile
    const profile = await profileRepository.createOrUpdateUserProfile(profileData);
    
    // Format response
    const response = {
      id: profile.id,
      userId: profile.user_id,
      preferences: typeof profile.preferences === 'string' 
        ? JSON.parse(profile.preferences) 
        : profile.preferences,
      sharingPreferences: typeof profile.sharing_preferences === 'string'
        ? JSON.parse(profile.sharing_preferences)
        : profile.sharing_preferences,
      version: profile.version || 1,
      createdAt: profile.created_at,
      updatedAt: profile.updated_at
    };
    
    console.log('[PROFILE_ROUTES] Profile created/updated successfully');
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /profile/create - Direct profile creation endpoint
 * This endpoint is specifically designed to handle the version column issue
 */
router.post('/create', verifyToken, async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  try {
    console.log('[PROFILE_ROUTES] POST /create request received');
    console.log('[PROFILE_ROUTES] Headers:', req.headers);
    console.log('[PROFILE_ROUTES] Body:', req.body);
    
    const userId = (req as any).userId;
    console.log('[PROFILE_ROUTES] Creating profile for authenticated user:', userId);
    
    // Validate request body
    if (!req.body) {
      throw new Error('Request body is required');
    }
    
    // Ensure userId in token matches userId in request body (if provided)
    if (req.body.userId && req.body.userId !== userId) {
      console.log('[PROFILE_ROUTES] User ID mismatch:', { tokenUserId: userId, bodyUserId: req.body.userId });
      throw new AuthenticationError('User ID mismatch between token and request body');
    }
    
    // Prepare profile data
    const profileData = {
      userId,
      preferences: req.body.generalPreferences || req.body.preferences || {},
      sharingPreferences: req.body.privacySettings || req.body.sharingPreferences || {}
    };
    
    console.log('[PROFILE_ROUTES] Processed profile data:', profileData);
    
    // Create profile directly
    const profile = await profileRepository.createUserProfile(profileData);
    
    // Format response
    const response = {
      id: profile.id,
      userId: profile.user_id,
      preferences: typeof profile.preferences === 'string' 
        ? JSON.parse(profile.preferences) 
        : profile.preferences,
      sharingPreferences: typeof profile.sharing_preferences === 'string'
        ? JSON.parse(profile.sharing_preferences)
        : profile.sharing_preferences,
      version: profile.version || 1,
      createdAt: profile.created_at,
      updatedAt: profile.updated_at
    };
    
    console.log('[PROFILE_ROUTES] Profile created successfully');
    res.status(201).json(response);
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /profile - Delete user profile
 */
router.delete('/', verifyToken, async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  try {
    console.log('[PROFILE_ROUTES] DELETE / request received');
    
    const userId = (req as any).userId;
    console.log('[PROFILE_ROUTES] Deleting profile for authenticated user:', userId);
    
    await profileRepository.deleteUserProfile(userId);
    
    console.log('[PROFILE_ROUTES] Profile deleted successfully');
    res.status(200).json({ success: true, message: 'Profile deleted successfully' });
  } catch (error) {
    console.log('[PROFILE_ROUTES] Error deleting profile:', error);
    
    if (error instanceof NotFoundError) {
      res.status(404).json({ error: 'Profile not found' });
    } else {
      next(error);
    }
  }
});

/**
 * Get user profile by ID
 */
router.get('/profile/:userId', async (req, res) => {
  try {
    const userId: string = req.params.userId;
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    // Check authorization (implement based on your auth system)
    // if (userId !== req.user?.id) {
    //   return res.status(403).json({ error: 'Unauthorized access to profile' });
    // }

    const profile = await getUserProfile(userId);
    
    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    // Transform from DB format to client expected format
    const clientProfile = {
      userId: profile.userId,
      createdAt: profile.createdAt || new Date(),
      updatedAt: profile.updatedAt || new Date(),
      generalPreferences: profile.preferences || {
        inputMethod: 'text',
        reflectionFrequency: 'daily',
        languagePreferences: 'english'
      },
      privacySettings: profile.sharingPreferences || {
        localStorageOnly: false,
        allowPersonalization: true,
        enableSync: false
      },
      usageStats: {
        reflectionCount: 0,
        lastActiveDate: new Date(),
        streakDays: 0
      }
    };

    res.json(clientProfile);
  } catch (error) {
    log(`Error fetching profile: ${error instanceof Error ? error.message : String(error)}`, 'error');
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

/**
 * Get encrypted profile data
 */
router.get('/profile/:userId/encrypted', async (req, res) => {
  try {
    const userId: string = req.params.userId;
    
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    // Check authorization (implement based on your auth system)
    // if (userId !== req.user?.id) {
    //   return res.status(403).json({ error: 'Unauthorized access to encrypted data' });
    // }

    const encryptedData = await getEncryptedProfileData(userId);
    
    if (!encryptedData) {
      return res.status(404).json({ error: 'Encrypted data not found' });
    }

    // Transform to client format
    const clientEncryptedData = {
      data: encryptedData.data,
      iv: encryptedData.iv.split(',').map(Number) // Convert string to array of numbers
    };

    res.json(clientEncryptedData);
  } catch (error) {
    log(`Error fetching encrypted data: ${error instanceof Error ? error.message : String(error)}`, 'error');
    res.status(500).json({ error: 'Failed to fetch encrypted data' });
  }
});

/**
 * Update encrypted profile data
 */
router.put('/profile/:userId/encrypted', async (req, res) => {
  try {
    const userId: string = req.params.userId;
    const { data, iv } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }
    
    if (!data || !iv) {
      return res.status(400).json({ error: 'data and iv are required' });
    }

    // Check authorization (implement based on your auth system)
    // if (userId !== req.user?.id) {
    //   return res.status(403).json({ error: 'Unauthorized to update encrypted data' });
    // }

    // Check if user profile exists first
    const profile = await getUserProfile(userId);
    if (!profile) {
      return res.status(404).json({ error: 'User profile not found' });
    }

    // Convert iv array to string for storage
    const ivString = Array.isArray(iv) ? iv.toString() : iv;

    // Save encrypted data
    await updateEncryptedProfileData(userId, { 
      data, 
      iv: ivString 
    });

    res.status(200).json({ success: true });
  } catch (error) {
    log(`Error saving encrypted data: ${error instanceof Error ? error.message : String(error)}`, 'error');
    res.status(500).json({ error: 'Failed to save encrypted data' });
  }
});

/**
 * Delete encrypted profile data
 */
router.delete('/profile/:userId/encrypted', async (req, res) => {
  try {
    const userId: string = req.params.userId;
    
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    // Check authorization (implement based on your auth system)
    // if (userId !== req.user?.id) {
    //   return res.status(403).json({ error: 'Unauthorized to delete encrypted data' });
    // }

    // Delete encrypted data
    const deleted = await deleteEncryptedProfileData(userId);
    
    if (!deleted) {
      return res.status(404).json({ error: 'Encrypted data not found or already deleted' });
    }

    res.status(204).send();
  } catch (error) {
    log(`Error deleting encrypted data: ${error instanceof Error ? error.message : String(error)}`, 'error');
    res.status(500).json({ error: 'Failed to delete encrypted data' });
  }
});

export default router; 