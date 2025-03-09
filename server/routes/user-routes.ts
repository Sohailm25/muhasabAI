import express from 'express';
import { authRequired } from '../auth';
import type { Request } from 'express';
import { db } from '../db';
import { users } from '../db';
import { eq } from 'drizzle-orm';

// Define a type for authenticated requests
interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    name: string;
  };
}

const router = express.Router();

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

// Accept privacy policy endpoint
router.post('/accept-privacy-policy', authRequired, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Update user's privacy policy acceptance status
    await db
      .update(users)
      .set({ 
        has_accepted_privacy_policy: true,
        updated_at: new Date()
      })
      .where(eq(users.id, req.user.id));

    res.json({ success: true });
  } catch (error) {
    console.error('Error updating privacy policy acceptance:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router; 