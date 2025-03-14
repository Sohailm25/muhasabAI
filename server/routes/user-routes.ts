import express from 'express';
import { authRequired } from '../auth';
import type { Request } from 'express';
import { db } from '../db';
import { users } from '../db';
import { eq } from 'drizzle-orm';
import { createStorage } from '../storage';
import jwt from 'jsonwebtoken';

// Define a type for authenticated requests
interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    name: string;
  };
}

const router = express.Router();
const storage = createStorage();

// Basic user profile endpoint
router.get('/profile', authRequired, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    
    // This is a stub - in a real implementation, you would fetch user data from your storage
    return res.json({ 
      success: true,
      message: "User profile endpoint" 
    });
  } catch (error) {
    console.error('Error in user profile endpoint:', error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// Get user settings
router.get('/settings', async (req, res) => {
  try {
    console.log('[USER_ROUTES] Processing get settings request');
    console.log('[USER_ROUTES] Headers:', JSON.stringify(req.headers));
    
    // Get token from authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('[USER_ROUTES] No valid authorization header found');
      return res.status(401).json({ error: 'Unauthorized - No valid token provided' });
    }
    
    const token = authHeader.split(' ')[1];
    console.log('[USER_ROUTES] Token extracted from header:', token.substring(0, 10) + '...');
    
    // Verify token
    try {
      const JWT_SECRET = process.env.JWT_SECRET || 'sahabai-secret-key';
      console.log('[USER_ROUTES] Verifying JWT token with secret:', JWT_SECRET.substring(0, 5) + '...');
      
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      
      // Ensure we have a userId
      if (!decoded || typeof decoded !== 'object' || !decoded.userId) {
        console.log('[USER_ROUTES] Invalid token payload - no userId:', decoded);
        return res.status(401).json({ error: 'Invalid token format' });
      }
      
      const userId = decoded.userId;
      console.log('[USER_ROUTES] JWT verification successful, userId:', userId);
      
      console.log('[USER_ROUTES] Getting settings for user:', userId);
      
      let userSettings = await storage.getUserSettings(userId);
      
      // If no settings exist yet, create default settings
      if (!userSettings) {
        console.log('[USER_ROUTES] No settings found, creating defaults for user:', userId);
        userSettings = await storage.saveUserSettings({
          userId,
          name: null,
          email: null,
          preferences: {
            emailNotifications: false,
            darkMode: false,
            saveHistory: true
          }
        });
      }
      
      console.log('[USER_ROUTES] Returning settings for user:', userId);
      return res.json(userSettings);
    } catch (error) {
      console.log('[USER_ROUTES] JWT verification failed:', error);
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
  } catch (error) {
    console.error("Error getting user settings:", error);
    return res.status(500).json({ error: "Failed to get user settings" });
  }
});

// Save or update user settings
router.post('/settings', async (req, res) => {
  try {
    console.log('[USER_ROUTES] Processing update settings request');
    console.log('[USER_ROUTES] Headers:', JSON.stringify(req.headers));
    console.log('[USER_ROUTES] Request body:', req.body);
    
    // Get token from authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('[USER_ROUTES] No valid authorization header found');
      return res.status(401).json({ error: 'Unauthorized - No valid token provided' });
    }
    
    const token = authHeader.split(' ')[1];
    console.log('[USER_ROUTES] Token extracted from header:', token.substring(0, 10) + '...');
    
    // Verify token
    try {
      const JWT_SECRET = process.env.JWT_SECRET || 'sahabai-secret-key';
      console.log('[USER_ROUTES] Verifying JWT token with secret:', JWT_SECRET.substring(0, 5) + '...');
      
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      
      // Ensure we have a userId
      if (!decoded || typeof decoded !== 'object' || !decoded.userId) {
        console.log('[USER_ROUTES] Invalid token payload - no userId:', decoded);
        return res.status(401).json({ error: 'Invalid token format' });
      }
      
      const userId = decoded.userId;
      console.log('[USER_ROUTES] JWT verification successful, userId:', userId);
      
      console.log('[USER_ROUTES] Updating settings for user:', userId);
      
      const { name, email, preferences } = req.body;
      
      // Try to get existing settings
      const existingSettings = await storage.getUserSettings(userId);
      
      let userSettings;
      
      if (existingSettings) {
        // Update existing settings
        console.log('[USER_ROUTES] Updating existing settings for user:', userId);
        userSettings = await storage.updateUserSettings(userId, {
          name: name !== undefined ? name : existingSettings.name,
          email: email !== undefined ? email : existingSettings.email,
          preferences: preferences !== undefined ? preferences : existingSettings.preferences
        });
      } else {
        // Create new settings
        console.log('[USER_ROUTES] Creating new settings for user:', userId);
        userSettings = await storage.saveUserSettings({
          userId,
          name: name || null,
          email: email || null,
          preferences: preferences || {
            emailNotifications: false,
            darkMode: false,
            saveHistory: true
          }
        });
      }
      
      console.log('[USER_ROUTES] Settings updated successfully for user:', userId);
      return res.json(userSettings);
    } catch (error) {
      console.log('[USER_ROUTES] JWT verification failed:', error);
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
  } catch (error) {
    console.error("Error saving user settings:", error);
    return res.status(500).json({ error: "Failed to save user settings" });
  }
});

// Accept privacy policy endpoint
router.post('/accept-privacy-policy', async (req, res) => {
  try {
    console.log('[USER_ROUTES] Processing privacy policy acceptance request');
    console.log('[USER_ROUTES] Headers:', JSON.stringify(req.headers));
    
    // Get token from authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('[USER_ROUTES] No valid authorization header found');
      return res.status(401).json({ error: 'Unauthorized - No valid token provided' });
    }
    
    const token = authHeader.split(' ')[1];
    console.log('[USER_ROUTES] Token extracted from header:', token.substring(0, 10) + '...');
    
    // Verify token
    try {
      const JWT_SECRET = process.env.JWT_SECRET || 'sahabai-secret-key';
      console.log('[USER_ROUTES] Verifying JWT token with secret:', JWT_SECRET.substring(0, 5) + '...');
      
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      
      // Ensure we have a userId
      if (!decoded || typeof decoded !== 'object' || !decoded.userId) {
        console.log('[USER_ROUTES] Invalid token payload - no userId:', decoded);
        return res.status(401).json({ error: 'Invalid token format' });
      }
      
      const userId = decoded.userId;
      console.log('[USER_ROUTES] JWT verification successful, userId:', userId);
      
      // Update user's privacy policy acceptance status
      await db
        .update(users)
        .set({ 
          has_accepted_privacy_policy: true,
          updated_at: new Date()
        })
        .where(eq(users.id, userId));
      
      console.log('[USER_ROUTES] Privacy policy acceptance updated successfully for user:', userId);
      return res.json({ success: true });
    } catch (error) {
      console.log('[USER_ROUTES] JWT verification failed:', error);
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
  } catch (error) {
    console.error('Error updating privacy policy acceptance:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router; 