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

/**
 * Get current user profile
 * This endpoint is used when no userId is provided
 */
router.get('/profile', async (req, res) => {
  try {
    // Get token from authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const token = authHeader.split(' ')[1];
    
    try {
      // Verify token and extract userId
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
      const userId = decoded.userId;
      
      if (!userId) {
        return res.status(401).json({ error: 'Invalid authentication token' });
      }
      
      console.log(`Profile requested for authenticated user: ${userId}`);
      
      // Get user profile from database
      const profile = await getUserProfile(userId);
      
      if (!profile) {
        // If profile doesn't exist yet, return a 404 so client can create one
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
    } catch (tokenError) {
      console.error('Token validation error:', tokenError);
      return res.status(401).json({ error: 'Invalid authentication token' });
    }
  } catch (error) {
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
 * Create new user profile
 */
router.post('/profile', async (req, res) => {
  try {
    const { userId, generalPreferences, privacySettings, usageStats } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    // Check authorization (implement based on your auth system)
    // if (userId !== req.user?.id) {
    //   return res.status(403).json({ error: 'Unauthorized to create profile' });
    // }

    // Check if profile already exists
    const existingProfile = await getUserProfile(userId);
    if (existingProfile) {
      return res.status(409).json({ error: 'Profile already exists' });
    }

    // Create new profile
    const newProfile = await createUserProfile({
      userId,
      preferences: generalPreferences || {
        inputMethod: 'text',
        reflectionFrequency: 'daily',
        languagePreferences: 'english'
      },
      sharingPreferences: privacySettings || {
        localStorageOnly: false,
        allowPersonalization: true,
        enableSync: false
      },
      version: 1
    });

    // Transform to client format
    const clientProfile = {
      userId: newProfile.userId,
      createdAt: newProfile.createdAt || new Date(),
      updatedAt: newProfile.updatedAt || new Date(),
      generalPreferences: newProfile.preferences,
      privacySettings: newProfile.sharingPreferences,
      usageStats: usageStats || {
        reflectionCount: 0,
        lastActiveDate: new Date(),
        streakDays: 0
      }
    };

    res.status(201).json(clientProfile);
  } catch (error) {
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

export default router; 