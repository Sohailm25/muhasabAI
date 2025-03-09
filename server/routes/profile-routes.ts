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

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'sahabai-secret-key';

// Add middleware to log all requests to profile routes
router.use('/profile', (req, res, next) => {
  console.log(`[PROFILE ROUTES] ${req.method} ${req.path} request received`);
  console.log('[PROFILE ROUTES] Headers:', JSON.stringify(req.headers));
  next();
});

/**
 * Get current user profile
 * This endpoint is used when no userId is provided
 */
router.get('/profile', async (req, res) => {
  try {
    console.log('[PROFILE ROUTES] GET /profile - Starting profile retrieval');
    console.log('[PROFILE ROUTES] Request path:', req.path);
    console.log('[PROFILE ROUTES] Request method:', req.method);
    console.log('[PROFILE ROUTES] Request headers:', JSON.stringify(req.headers));
    
    // Get token from authorization header
    const authHeader = req.headers.authorization;
    console.log('[PROFILE ROUTES] Auth header present:', !!authHeader);
    console.log('[PROFILE ROUTES] Auth header:', authHeader ? `${authHeader.substring(0, 15)}...` : 'None');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('[PROFILE ROUTES] Authentication required - no valid auth header');
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const token = authHeader.split(' ')[1];
    console.log('[PROFILE ROUTES] Token extracted from header:', token ? `${token.substring(0, 10)}...` : 'None');
    
    try {
      // Verify token and extract userId
      console.log('[PROFILE ROUTES] Verifying JWT token with secret:', JWT_SECRET ? `${JWT_SECRET.substring(0, 5)}...` : 'None');
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
      const userId = decoded.userId;
      console.log('[PROFILE ROUTES] JWT verification successful, userId:', userId);
      console.log('[PROFILE ROUTES] Full decoded payload:', JSON.stringify(decoded));
      
      if (!userId) {
        console.log('[PROFILE ROUTES] Invalid token - no userId in payload');
        return res.status(401).json({ error: 'Invalid authentication token' });
      }
      
      console.log(`[PROFILE ROUTES] Profile requested for authenticated user: ${userId}`);
      
      // Get user profile from database
      console.log(`[PROFILE ROUTES] Looking up profile in database for userId: ${userId}`);
      const profile = await getUserProfile(userId);
      console.log(`[PROFILE ROUTES] Profile lookup result:`, profile ? 'Found' : 'Not found');
      
      if (profile) {
        console.log(`[PROFILE ROUTES] Profile details: userId=${profile.userId}, preferences=${JSON.stringify(profile.preferences)}`);
      }
      
      if (!profile) {
        // If profile doesn't exist yet, return a 404 so client can create one
        console.log('[PROFILE ROUTES] Profile not found, returning 404');
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
      
      console.log('[PROFILE ROUTES] Returning profile to client:', JSON.stringify(clientProfile));
      res.json(clientProfile);
    } catch (tokenError) {
      console.error('[PROFILE ROUTES] Token validation error:', tokenError);
      return res.status(401).json({ error: 'Invalid authentication token' });
    }
  } catch (error) {
    console.error(`[PROFILE ROUTES] Error fetching profile:`, error);
    log(`Error fetching profile: ${error instanceof Error ? error.message : String(error)}`, 'error');
    res.status(500).json({ error: 'Failed to fetch profile' });
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
 * Create a new user profile
 */
router.post('/profile', async (req, res) => {
  try {
    console.log('[PROFILE ROUTES] POST /profile - Starting profile creation');
    console.log('[PROFILE ROUTES] Request body:', JSON.stringify(req.body));
    console.log('[PROFILE ROUTES] Request headers:', JSON.stringify(req.headers));
    
    // Get token from authorization header
    const authHeader = req.headers.authorization;
    console.log('[PROFILE ROUTES] Auth header present:', !!authHeader);
    console.log('[PROFILE ROUTES] Auth header:', authHeader ? `${authHeader.substring(0, 15)}...` : 'None');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('[PROFILE ROUTES] Authentication required - no valid auth header');
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const token = authHeader.split(' ')[1];
    console.log('[PROFILE ROUTES] Token extracted from header:', token ? `${token.substring(0, 10)}...` : 'None');
    
    try {
      // Verify token and extract userId
      console.log('[PROFILE ROUTES] Verifying JWT token with secret:', JWT_SECRET ? `${JWT_SECRET.substring(0, 5)}...` : 'None');
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
      const userId = decoded.userId;
      console.log('[PROFILE ROUTES] JWT verification successful, userId:', userId);
      console.log('[PROFILE ROUTES] Full decoded payload:', JSON.stringify(decoded));
      
      if (!userId) {
        console.log('[PROFILE ROUTES] Invalid token - no userId in payload');
        return res.status(401).json({ error: 'Invalid authentication token' });
      }
      
      console.log(`[PROFILE ROUTES] Creating profile for user: ${userId}`);
      
      // Check if profile already exists
      console.log(`[PROFILE ROUTES] Checking if profile already exists for userId: ${userId}`);
      const existingProfile = await getUserProfile(userId);
      console.log(`[PROFILE ROUTES] Profile exists check result: ${existingProfile ? 'Found' : 'Not found'}`);
      
      if (existingProfile) {
        console.log('[PROFILE ROUTES] Profile already exists, returning 409');
        return res.status(409).json({ error: 'Profile already exists' });
      }
      
      // Extract profile data from request body
      const { generalPreferences, privacySettings } = req.body;
      console.log('[PROFILE ROUTES] Extracted preferences from request body:', {
        generalPreferences: generalPreferences ? 'Present' : 'Not present',
        privacySettings: privacySettings ? 'Present' : 'Not present'
      });
      
      // Create profile object
      const profileData = {
        userId,
        preferences: generalPreferences || {
          inputMethod: 'text',
          reflectionFrequency: 'daily',
          languagePreferences: 'english'
        },
        sharingPreferences: privacySettings || {
          localStorageOnly: false,
          allowPersonalization: true,
          enableSync: true
        },
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      console.log('[PROFILE ROUTES] Creating profile with data:', JSON.stringify(profileData));
      
      // Create profile in database
      console.log('[PROFILE ROUTES] Calling createUserProfile function');
      const newProfile = await createUserProfile(profileData);
      
      console.log('[PROFILE ROUTES] Profile created successfully:', JSON.stringify(newProfile));
      
      // Transform to client format
      const clientProfile = {
        userId: newProfile.userId,
        createdAt: newProfile.createdAt || new Date(),
        updatedAt: newProfile.updatedAt || new Date(),
        generalPreferences: newProfile.preferences || {
          inputMethod: 'text',
          reflectionFrequency: 'daily',
          languagePreferences: 'english'
        },
        privacySettings: newProfile.sharingPreferences || {
          localStorageOnly: false,
          allowPersonalization: true,
          enableSync: true
        },
        usageStats: {
          reflectionCount: 0,
          lastActiveDate: new Date(),
          streakDays: 0
        }
      };
      
      console.log('[PROFILE ROUTES] Returning client profile:', JSON.stringify(clientProfile));
      res.status(201).json(clientProfile);
    } catch (tokenError) {
      console.error('[PROFILE ROUTES] Token validation error:', tokenError);
      return res.status(401).json({ error: 'Invalid authentication token' });
    }
  } catch (error) {
    console.error('[PROFILE ROUTES] Error creating profile:', error);
    log(`Error creating profile: ${error instanceof Error ? error.message : String(error)}`, 'error');
    res.status(500).json({ error: 'Failed to create profile' });
  }
});

/**
 * Update user profile
 * This is the main endpoint for updating without specifying userId in the URL
 */
router.put('/profile', async (req, res) => {
  try {
    const { userId, generalPreferences, privacySettings, usageStats } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    // Check authorization (implement based on your auth system)
    // if (userId !== req.user?.id) {
    //   return res.status(403).json({ error: 'Unauthorized to update profile' });
    // }

    // Check if profile exists
    const existingProfile = await getUserProfile(userId);
    if (!existingProfile) {
      return res.status(404).json({ error: 'Profile not found' });
    }
    
    // Update profile
    const updatedProfile = await updateUserProfile(userId, {
      preferences: generalPreferences,
      sharingPreferences: privacySettings
    });

    // Transform to client format
    const clientProfile = {
      userId: updatedProfile.userId,
      createdAt: existingProfile.createdAt || new Date(),
      updatedAt: updatedProfile.updatedAt || new Date(),
      generalPreferences: updatedProfile.preferences,
      privacySettings: updatedProfile.sharingPreferences,
      usageStats: usageStats || existingProfile.preferences?.usageStats || {
        reflectionCount: 0,
        lastActiveDate: new Date(),
        streakDays: 0
      }
    };

    res.json(clientProfile);
  } catch (error) {
    log(`Error updating profile: ${error instanceof Error ? error.message : String(error)}`, 'error');
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

/**
 * Delete user profile
 */
router.delete('/profile', async (req, res) => {
  try {
    // Get authenticated user ID (implement based on your auth system)
    // For now, we'll use the userId from the query for testing
    const userId = req.query.userId as string;
    
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    // Check authorization (implement based on your auth system)
    // if (userId !== req.user?.id) {
    //   return res.status(403).json({ error: 'Unauthorized to delete profile' });
    // }

    // Check if profile exists
    const existingProfile = await getUserProfile(userId);
    if (!existingProfile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    // Delete profile
    const deleted = await deleteUserProfile(userId);
    
    if (!deleted) {
      return res.status(500).json({ error: 'Failed to delete profile' });
    }

    // Also delete any encrypted data for this user
    await deleteEncryptedProfileData(userId).catch((err: Error) => {
      log(`Non-critical error when deleting encrypted data: ${err.message}`, 'warn');
    });

    res.status(204).send();
  } catch (error) {
    log(`Error deleting profile: ${error instanceof Error ? error.message : String(error)}`, 'error');
    res.status(500).json({ error: 'Failed to delete profile' });
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

/**
 * Create or update user profile - direct endpoint for client use
 * This endpoint allows creating a profile without checking if it exists first
 */
router.post('/profile/create', async (req, res) => {
  try {
    console.log('[PROFILE ROUTES] POST /profile/create - Starting direct profile creation');
    console.log('[PROFILE ROUTES] Request body:', JSON.stringify(req.body));
    console.log('[PROFILE ROUTES] Request headers:', JSON.stringify(req.headers));
    
    // Get token from authorization header
    const authHeader = req.headers.authorization;
    console.log('[PROFILE ROUTES] Auth header present:', !!authHeader);
    console.log('[PROFILE ROUTES] Auth header:', authHeader ? `${authHeader.substring(0, 15)}...` : 'None');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('[PROFILE ROUTES] Authentication required - no valid auth header');
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const token = authHeader.split(' ')[1];
    console.log('[PROFILE ROUTES] Token extracted from header:', token ? `${token.substring(0, 10)}...` : 'None');
    
    try {
      // Verify token and extract userId
      console.log('[PROFILE ROUTES] Verifying JWT token with secret:', JWT_SECRET ? `${JWT_SECRET.substring(0, 5)}...` : 'None');
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
      const userId = decoded.userId;
      console.log('[PROFILE ROUTES] JWT verification successful, userId:', userId);
      console.log('[PROFILE ROUTES] Full decoded payload:', JSON.stringify(decoded));
      
      if (!userId) {
        console.log('[PROFILE ROUTES] Invalid token - no userId in payload');
        return res.status(401).json({ error: 'Invalid authentication token' });
      }
      
      console.log(`[PROFILE ROUTES] Creating/updating profile for user: ${userId}`);
      
      // Extract profile data from request body
      const { userId: bodyUserId, generalPreferences, privacySettings } = req.body;
      
      // Ensure the userId in the token matches the one in the request body, if provided
      if (bodyUserId && bodyUserId !== userId) {
        console.log(`[PROFILE ROUTES] UserId mismatch: token=${userId}, body=${bodyUserId}`);
        return res.status(403).json({ error: 'Unauthorized - userId mismatch' });
      }
      
      console.log('[PROFILE ROUTES] Extracted preferences from request body:', {
        generalPreferences: generalPreferences ? 'Present' : 'Not present',
        privacySettings: privacySettings ? 'Present' : 'Not present'
      });
      
      // Create profile object
      const profileData = {
        userId,
        preferences: generalPreferences || {
          inputMethod: 'text',
          reflectionFrequency: 'daily',
          languagePreferences: 'english'
        },
        sharingPreferences: privacySettings || {
          localStorageOnly: false,
          allowPersonalization: true,
          enableSync: true
        },
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      console.log('[PROFILE ROUTES] Creating/updating profile with data:', JSON.stringify(profileData));
      
      // Check if profile already exists
      console.log(`[PROFILE ROUTES] Checking if profile already exists for userId: ${userId}`);
      const existingProfile = await getUserProfile(userId);
      console.log(`[PROFILE ROUTES] Profile exists check result: ${existingProfile ? 'Found' : 'Not found'}`);
      
      let profile;
      
      if (existingProfile) {
        // Update existing profile
        console.log(`[PROFILE ROUTES] Updating existing profile for userId: ${userId}`);
        profile = await updateUserProfile(userId, {
          preferences: profileData.preferences,
          sharingPreferences: profileData.sharingPreferences
        });
        console.log('[PROFILE ROUTES] Profile updated successfully');
      } else {
        // Create new profile
        console.log(`[PROFILE ROUTES] Creating new profile for userId: ${userId}`);
        profile = await createUserProfile(profileData);
        console.log('[PROFILE ROUTES] Profile created successfully');
      }
      
      // Transform to client format
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
          enableSync: true
        },
        usageStats: {
          reflectionCount: 0,
          lastActiveDate: new Date(),
          streakDays: 0
        }
      };
      
      console.log('[PROFILE ROUTES] Returning client profile:', JSON.stringify(clientProfile));
      res.status(200).json(clientProfile);
    } catch (tokenError) {
      console.error('[PROFILE ROUTES] Token validation error:', tokenError);
      return res.status(401).json({ error: 'Invalid authentication token' });
    }
  } catch (error) {
    console.error('[PROFILE ROUTES] Error creating/updating profile:', error);
    log(`Error creating/updating profile: ${error instanceof Error ? error.message : String(error)}`, 'error');
    res.status(500).json({ error: 'Failed to create/update profile' });
  }
});

export default router; 