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
    console.log('[PROFILE_ROUTES] Headers:', JSON.stringify(req.headers));
    
    const userId = (req as any).userId;
    console.log('[PROFILE_ROUTES] Profile requested for authenticated user:', userId);
    
    try {
      console.log('[PROFILE_ROUTES] Fetching profile from repository for user:', userId);
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
      
      console.log('[PROFILE_ROUTES] Profile found, returning data with ID:', response.id);
      console.log('[PROFILE_ROUTES] Profile data:', JSON.stringify({
        id: response.id,
        userId: response.userId,
        preferencesKeys: response.preferences ? Object.keys(response.preferences) : [],
        sharingPreferencesKeys: response.sharingPreferences ? Object.keys(response.sharingPreferences) : [],
        version: response.version
      }));
      
      res.setHeader('Content-Type', 'application/json');
      return res.json(response);
    } catch (error) {
      console.log('[PROFILE_ROUTES] Error getting profile:', error);
      
      if (error instanceof NotFoundError) {
        console.log('[PROFILE_ROUTES] Profile not found, returning 404');
        return res.status(404).json({ error: 'Profile not found' });
      } else {
        next(error);
      }
    }
  } catch (error) {
    console.error('[PROFILE_ROUTES] Unexpected error in GET /:', error);
    next(error);
  }
});

/**
 * POST /profile - Create or update user profile
 */
router.post('/', verifyToken, async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  try {
    console.log('[PROFILE_ROUTES] POST / request received');
    console.log('[PROFILE_ROUTES] Headers:', JSON.stringify(req.headers));
    console.log('[PROFILE_ROUTES] Body keys:', Object.keys(req.body));
    
    const userId = (req as any).userId;
    console.log('[PROFILE_ROUTES] Creating/updating profile for authenticated user:', userId);
    
    // Validate request body
    if (!req.body) {
      console.log('[PROFILE_ROUTES] No request body provided');
      throw new Error('Request body is required');
    }
    
    // Ensure userId in token matches userId in request body (if provided)
    if (req.body.userId && req.body.userId !== userId) {
      console.log('[PROFILE_ROUTES] User ID mismatch:', { tokenUserId: userId, bodyUserId: req.body.userId });
      throw new AuthenticationError('User ID mismatch between token and request body');
    }
    
    // Check for wird-related properties that might cause issues
    const sensitiveProps = ['wird', 'wirdId', 'wirdPlan', 'wirdSuggestion', 'habit', 'tracker'];
    const hasSensitiveProps = Object.keys(req.body).some(key => 
      sensitiveProps.some(prop => key.toLowerCase().includes(prop.toLowerCase()))
    );
    
    if (hasSensitiveProps) {
      console.log('[PROFILE_ROUTES] Request contains wird-related properties that might cause issues');
      console.log('[PROFILE_ROUTES] Request body keys:', Object.keys(req.body));
      return res.status(400).json({ 
        error: 'Request contains wird-related properties that might cause issues',
        message: 'Please remove wird-related properties from the request body'
      });
    }
    
    // Prepare profile data
    const profileData = {
      userId,
      preferences: req.body.generalPreferences || req.body.preferences || {},
      sharingPreferences: req.body.privacySettings || req.body.sharingPreferences || {}
    };
    
    console.log('[PROFILE_ROUTES] Processed profile data:', JSON.stringify({
      userId: profileData.userId,
      preferencesKeys: Object.keys(profileData.preferences),
      sharingPreferencesKeys: Object.keys(profileData.sharingPreferences)
    }));
    
    // Create or update profile
    console.log('[PROFILE_ROUTES] Calling createOrUpdateUserProfile');
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
    
    console.log('[PROFILE_ROUTES] Profile created/updated successfully with ID:', response.id);
    console.log('[PROFILE_ROUTES] Response data:', JSON.stringify({
      id: response.id,
      userId: response.userId,
      preferencesKeys: response.preferences ? Object.keys(response.preferences) : [],
      sharingPreferencesKeys: response.sharingPreferences ? Object.keys(response.sharingPreferences) : [],
      version: response.version
    }));
    
    res.setHeader('Content-Type', 'application/json');
    res.status(200).json(response);
  } catch (error) {
    console.error('[PROFILE_ROUTES] Error in POST /profile:', error);
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
    
    console.log('[PROFILE_ROUTES] GET /profile/:userId/encrypted request received');
    console.log('[PROFILE_ROUTES] User ID:', userId);
    console.log('[PROFILE_ROUTES] Headers:', JSON.stringify(req.headers));
    
    if (!userId) {
      console.log('[PROFILE_ROUTES] No userId provided');
      return res.status(400).json({ error: 'userId is required' });
    }

    // Check authorization (implement based on your auth system)
    // if (userId !== req.user?.id) {
    //   return res.status(403).json({ error: 'Unauthorized access to encrypted data' });
    // }

    console.log('[PROFILE_ROUTES] Fetching encrypted profile data for user:', userId);
    const encryptedData = await getEncryptedProfileData(userId);
    
    if (!encryptedData) {
      console.log('[PROFILE_ROUTES] No encrypted data found for user:', userId);
      return res.status(404).json({ error: 'Encrypted data not found' });
    }

    console.log('[PROFILE_ROUTES] Encrypted data found, data length:', encryptedData.data ? encryptedData.data.length : 0);
    console.log('[PROFILE_ROUTES] IV present:', !!encryptedData.iv);

    // Transform to client format
    const clientEncryptedData = {
      data: encryptedData.data,
      iv: encryptedData.iv.split(',').map(Number) // Convert string to array of numbers
    };

    console.log('[PROFILE_ROUTES] Sending encrypted data response');
    res.setHeader('Content-Type', 'application/json');
    return res.json(clientEncryptedData);
  } catch (error) {
    console.error('[PROFILE_ROUTES] Error in GET /profile/:userId/encrypted:', error);
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
    
    console.log('[PROFILE_ROUTES] PUT /profile/:userId/encrypted request received');
    console.log('[PROFILE_ROUTES] User ID:', userId);
    console.log('[PROFILE_ROUTES] Headers:', JSON.stringify(req.headers));
    console.log('[PROFILE_ROUTES] Request body has data:', !!data);
    console.log('[PROFILE_ROUTES] Request body has IV:', !!iv);
    
    if (!userId) {
      console.log('[PROFILE_ROUTES] No userId provided');
      return res.status(400).json({ error: 'userId is required' });
    }
    
    if (!data || !iv) {
      console.log('[PROFILE_ROUTES] Missing data or IV in request body');
      return res.status(400).json({ error: 'data and iv are required' });
    }

    // Check authorization (implement based on your auth system)
    // if (userId !== req.user?.id) {
    //   return res.status(403).json({ error: 'Unauthorized to update encrypted data' });
    // }

    // Check if user profile exists first
    console.log('[PROFILE_ROUTES] Checking if user profile exists');
    const profile = await getUserProfile(userId);
    if (!profile) {
      console.log('[PROFILE_ROUTES] User profile not found for user:', userId);
      return res.status(404).json({ error: 'User profile not found' });
    }

    // Convert iv array to string for storage
    const ivString = Array.isArray(iv) ? iv.toString() : iv;
    console.log('[PROFILE_ROUTES] IV converted to string, length:', ivString.length);

    // Save encrypted data
    console.log('[PROFILE_ROUTES] Saving encrypted data for user:', userId);
    await updateEncryptedProfileData(userId, { 
      data, 
      iv: ivString 
    });

    console.log('[PROFILE_ROUTES] Encrypted data saved successfully');
    res.setHeader('Content-Type', 'application/json');
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('[PROFILE_ROUTES] Error in PUT /profile/:userId/encrypted:', error);
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