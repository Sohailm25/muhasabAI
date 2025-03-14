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
import * as memory from '../db/memory-storage'; // Import memory storage functions
import { ProfileRepository } from '../database/profile-repository';
import { AuthenticationError, NotFoundError } from '../utils/errors';
import { Pool } from 'pg';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'sahabai-secret-key';
const USE_DATABASE = process.env.USE_DATABASE === 'true' || process.env.NODE_ENV === 'production';

// Initialize profile repository
let profileRepository: ProfileRepository;

/**
 * Initialize profile routes with database connection
 */
export function initProfileRoutes(pool: any) {
  console.log('[PROFILE_ROUTES] Initializing profile routes with database connection');
  
  // Initialize the profile repository with the database pool
  profileRepository = new ProfileRepository(pool);
  
  // Add middleware to verify tokens for all profile routes
  router.use(verifyToken);
  
  // Log all requests to profile routes
  router.use((req, res, next) => {
    console.log('[PROFILE_ROUTES] Verifying token for request:', req.path);
    console.log('[PROFILE_ROUTES] Auth header present:', !!req.headers.authorization);
    
    if (req.headers.authorization) {
      const token = req.headers.authorization.split(' ')[1];
      console.log('[PROFILE_ROUTES] Token extracted from header:', token.substring(0, 10) + '...');
      
      try {
        const secret = process.env.JWT_SECRET || 'sahabai-secret-key';
        console.log('[PROFILE_ROUTES] Verifying JWT token with secret:', secret.substring(0, 10) + '...');
        
        const decoded = jwt.verify(token, secret);
        console.log('[PROFILE_ROUTES] JWT verification successful, userId:', (decoded as any).userId);
        console.log('[PROFILE_ROUTES] Full decoded payload:', JSON.stringify(decoded));
      } catch (error) {
        console.error('[PROFILE_ROUTES] JWT verification failed:', error);
      }
    }
    
    next();
  });
  
  // Ensure all responses have the correct content-type header
  router.use((req, res, next) => {
    // Store the original json method
    const originalJson = res.json;
    
    // Override the json method
    res.json = function(body) {
      // Set the content-type header
      res.setHeader('Content-Type', 'application/json');
      
      // Call the original json method
      return originalJson.call(this, body);
    };
    
    next();
  });
  
  // Register GET endpoint for encrypted profile data
  router.get('/:userId/encrypted', async (req, res) => {
    try {
      const userId: string = req.params.userId;
      
      console.log('[PROFILE_ROUTES] GET /:userId/encrypted request received');
      console.log('[PROFILE_ROUTES] User ID:', userId);
      console.log('[PROFILE_ROUTES] Headers:', JSON.stringify(req.headers));
      console.log('[PROFILE_ROUTES] Full URL path:', req.originalUrl);
      console.log('[PROFILE_ROUTES] Route path:', req.route.path);
      
      if (!userId) {
        console.log('[PROFILE_ROUTES] No userId provided');
        return res.status(400).json({ error: 'userId is required' });
      }

      console.log('[PROFILE_ROUTES] Fetching encrypted profile data for user:', userId);
      
      // Try to get encrypted data
      let encryptedData;
      
      if (USE_DATABASE) {
        console.log('[PROFILE_ROUTES] Using database storage for encrypted data');
        encryptedData = await getEncryptedProfileData(userId);
      } else {
        console.log('[PROFILE_ROUTES] Using memory storage for encrypted data');
        encryptedData = await memory.getEncryptedProfileDataFromMemory(userId);
      }
      
      if (!encryptedData) {
        console.log('[PROFILE_ROUTES] No encrypted data found for user:', userId);
        return res.status(404).json({ error: 'Encrypted data not found' });
      }

      console.log('[PROFILE_ROUTES] Encrypted data found, data length:', encryptedData.data ? encryptedData.data.length : 0);
      console.log('[PROFILE_ROUTES] IV present:', !!encryptedData.iv);

      // Transform to client format
      const clientEncryptedData = {
        data: encryptedData.data,
        iv: Array.isArray(encryptedData.iv) 
          ? encryptedData.iv 
          : typeof encryptedData.iv === 'string' && encryptedData.iv.includes(',')
            ? encryptedData.iv.split(',').map(Number)
            : encryptedData.iv
      };

      console.log('[PROFILE_ROUTES] Sending encrypted data response with explicit content-type header');
      res.setHeader('Content-Type', 'application/json');
      return res.json(clientEncryptedData);
    } catch (error) {
      console.error('[PROFILE_ROUTES] Error in GET /:userId/encrypted:', error);
      log(`Error fetching encrypted data: ${error instanceof Error ? error.message : String(error)}`, 'error');
      res.status(500).json({ error: 'Failed to fetch encrypted data' });
    }
  });
  
  // Register PUT endpoint for encrypted profile data
  router.put('/:userId/encrypted', async (req, res) => {
    try {
      const userId: string = req.params.userId;
      const { data, iv } = req.body;
      
      console.log('[PROFILE_ROUTES] PUT /:userId/encrypted request received');
      console.log('[PROFILE_ROUTES] User ID:', userId);
      console.log('[PROFILE_ROUTES] Headers:', JSON.stringify(req.headers));
      console.log('[PROFILE_ROUTES] Full URL path:', req.originalUrl);
      console.log('[PROFILE_ROUTES] Route path:', req.route.path);
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

      // Check if user profile exists first
      console.log('[PROFILE_ROUTES] Checking if user profile exists');
      const profile = await getUserProfile(userId);
      if (!profile) {
        console.log('[PROFILE_ROUTES] User profile not found for user:', userId);
        return res.status(404).json({ error: 'User profile not found' });
      }

      // Convert iv array to string for storage if needed
      const ivString = Array.isArray(iv) ? iv.toString() : iv;
      console.log('[PROFILE_ROUTES] IV converted to string, length:', ivString.length);

      // Save encrypted data
      console.log('[PROFILE_ROUTES] Saving encrypted data for user:', userId);
      
      let success = false;
      
      if (USE_DATABASE) {
        console.log('[PROFILE_ROUTES] Using database storage for encrypted data');
        success = await updateEncryptedProfileData(userId, { 
          data, 
          iv: ivString 
        });
      } else {
        console.log('[PROFILE_ROUTES] Using memory storage for encrypted data');
        await memory.saveEncryptedProfileDataToMemory(userId, data, ivString);
        success = true;
      }

      console.log('[PROFILE_ROUTES] Encrypted data saved successfully');
      res.setHeader('Content-Type', 'application/json');
      res.status(200).json({ success: true });
    } catch (error) {
      console.error('[PROFILE_ROUTES] Error in PUT /:userId/encrypted:', error);
      log(`Error saving encrypted data: ${error instanceof Error ? error.message : String(error)}`, 'error');
      res.status(500).json({ error: 'Failed to save encrypted data' });
    }
  });
  
  // Return the router
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
    console.log('[PROFILE_ROUTES] Full URL path:', req.originalUrl);
    console.log('[PROFILE_ROUTES] Route path:', req.route.path);
    
    const userId = (req as any).userId;
    console.log('[PROFILE_ROUTES] Profile requested for authenticated user:', userId);
    
    // Check if userId is valid
    if (!userId) {
      console.log('[PROFILE_ROUTES] No userId found in request after token verification');
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    try {
      console.log('[PROFILE_ROUTES] Fetching profile from repository for user:', userId);
      
      // Try to get profile from repository
      let profile;
      try {
        profile = await profileRepository.getUserProfileById(userId);
        console.log('[PROFILE_ROUTES] Profile found in repository:', profile ? 'Yes' : 'No');
      } catch (repoError) {
        console.error('[PROFILE_ROUTES] Repository error:', repoError);
        
        // If repository fails, try direct DB access as fallback
        console.log('[PROFILE_ROUTES] Trying fallback with direct DB access');
        profile = await getUserProfile(userId);
        console.log('[PROFILE_ROUTES] Profile found with direct DB access:', profile ? 'Yes' : 'No');
      }
      
      if (!profile) {
        console.log('[PROFILE_ROUTES] No profile found for user:', userId);
        return res.status(404).json({ error: 'Profile not found' });
      }
      
      // Format response
      const response = {
        id: profile.id,
        userId: profile.user_id || profile.userId,
        preferences: typeof profile.preferences === 'string' 
          ? JSON.parse(profile.preferences) 
          : profile.preferences,
        sharingPreferences: typeof profile.sharing_preferences === 'string'
          ? JSON.parse(profile.sharing_preferences)
          : (profile.sharingPreferences || profile.sharing_preferences),
        version: profile.version || 1,
        createdAt: profile.created_at || profile.createdAt,
        updatedAt: profile.updated_at || profile.updatedAt
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
    console.log('[PROFILE_ROUTES] Full URL path:', req.originalUrl);
    console.log('[PROFILE_ROUTES] Route path:', req.route.path);
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
    console.log('[PROFILE_ROUTES] Headers:', JSON.stringify(req.headers));
    console.log('[PROFILE_ROUTES] Full URL path:', req.originalUrl);
    console.log('[PROFILE_ROUTES] Route path:', req.route.path);
    console.log('[PROFILE_ROUTES] Body:', JSON.stringify(req.body));
    
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
    
    console.log('[PROFILE_ROUTES] Processed profile data:', JSON.stringify(profileData));
    
    // Create profile directly
    console.log('[PROFILE_ROUTES] Calling createUserProfile');
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
    
    console.log('[PROFILE_ROUTES] Profile created successfully with ID:', response.id);
    console.log('[PROFILE_ROUTES] Response data:', JSON.stringify({
      id: response.id,
      userId: response.userId,
      preferencesKeys: response.preferences ? Object.keys(response.preferences) : [],
      sharingPreferencesKeys: response.sharingPreferences ? Object.keys(response.sharingPreferences) : [],
      version: response.version
    }));
    
    res.setHeader('Content-Type', 'application/json');
    res.status(201).json(response);
  } catch (error) {
    console.error('[PROFILE_ROUTES] Error in POST /profile/create:', error);
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
 * Get encrypted profile data (direct API path format)
 * This route matches the exact path the client is using: /api/profile/{userId}/encrypted
 */
router.get('/:userId/encrypted', async (req, res) => {
  try {
    const userId: string = req.params.userId;
    
    console.log('[PROFILE_ROUTES] GET /:userId/encrypted request received');
    console.log('[PROFILE_ROUTES] User ID:', userId);
    console.log('[PROFILE_ROUTES] Headers:', JSON.stringify(req.headers));
    console.log('[PROFILE_ROUTES] Full URL path:', req.originalUrl);
    console.log('[PROFILE_ROUTES] Route path:', req.route.path);
    
    if (!userId) {
      console.log('[PROFILE_ROUTES] No userId provided');
      return res.status(400).json({ error: 'userId is required' });
    }

    console.log('[PROFILE_ROUTES] Fetching encrypted profile data for user:', userId);
    
    // Try to get encrypted data
    let encryptedData;
    
    if (USE_DATABASE) {
      console.log('[PROFILE_ROUTES] Using database storage for encrypted data');
      encryptedData = await getEncryptedProfileData(userId);
    } else {
      console.log('[PROFILE_ROUTES] Using memory storage for encrypted data');
      encryptedData = await memory.getEncryptedProfileDataFromMemory(userId);
    }
    
    if (!encryptedData) {
      console.log('[PROFILE_ROUTES] No encrypted data found for user:', userId);
      return res.status(404).json({ error: 'Encrypted data not found' });
    }

    console.log('[PROFILE_ROUTES] Encrypted data found, data length:', encryptedData.data ? encryptedData.data.length : 0);
    console.log('[PROFILE_ROUTES] IV present:', !!encryptedData.iv);

    // Transform to client format
    const clientEncryptedData = {
      data: encryptedData.data,
      iv: Array.isArray(encryptedData.iv) 
        ? encryptedData.iv 
        : typeof encryptedData.iv === 'string' && encryptedData.iv.includes(',')
          ? encryptedData.iv.split(',').map(Number)
          : encryptedData.iv
    };

    console.log('[PROFILE_ROUTES] Sending encrypted data response with explicit content-type header');
    res.setHeader('Content-Type', 'application/json');
    return res.json(clientEncryptedData);
  } catch (error) {
    console.error('[PROFILE_ROUTES] Error in GET /:userId/encrypted:', error);
    log(`Error fetching encrypted data: ${error instanceof Error ? error.message : String(error)}`, 'error');
    res.status(500).json({ error: 'Failed to fetch encrypted data' });
  }
});

/**
 * Update encrypted profile data (direct API path format)
 * This route matches the exact path the client is using: /api/profile/{userId}/encrypted
 */
router.put('/:userId/encrypted', async (req, res) => {
  try {
    const userId: string = req.params.userId;
    const { data, iv } = req.body;
    
    console.log('[PROFILE_ROUTES] PUT /:userId/encrypted request received');
    console.log('[PROFILE_ROUTES] User ID:', userId);
    console.log('[PROFILE_ROUTES] Headers:', JSON.stringify(req.headers));
    console.log('[PROFILE_ROUTES] Full URL path:', req.originalUrl);
    console.log('[PROFILE_ROUTES] Route path:', req.route.path);
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

    // Convert iv array to string for storage if needed
    const ivString = Array.isArray(iv) ? iv.toString() : iv;
    console.log('[PROFILE_ROUTES] IV converted to string, length:', ivString.length);

    // Save encrypted data
    console.log('[PROFILE_ROUTES] Saving encrypted data for user:', userId);
    
    let success = false;
    
    if (USE_DATABASE) {
      console.log('[PROFILE_ROUTES] Using database storage for encrypted data');
      success = await updateEncryptedProfileData(userId, { 
        data, 
        iv: ivString 
      });
    } else {
      console.log('[PROFILE_ROUTES] Using memory storage for encrypted data');
      await memory.saveEncryptedProfileDataToMemory(userId, data, ivString);
      success = true;
    }

    console.log('[PROFILE_ROUTES] Encrypted data saved successfully');
    res.setHeader('Content-Type', 'application/json');
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('[PROFILE_ROUTES] Error in PUT /:userId/encrypted:', error);
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