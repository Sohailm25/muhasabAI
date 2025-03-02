import { Router } from 'express';
import { z } from 'zod';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { db } from '../lib/db';
import { validateRequest } from '../middleware/validate-request';

const router = Router();

// Schema for login request validation
const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  rememberMe: z.boolean().optional().default(false)
});

// Schema for registration request validation
const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters')
});

// Login route
router.post('/login', validateRequest(loginSchema), async (req, res) => {
  try {
    const { email, password, rememberMe } = req.body;
    
    // Find user by email
    const user = await db.user.findUnique({
      where: { email }
    });
    
    // Check if user exists and password is correct
    if (!user || !await bcrypt.compare(password, user.passwordHash)) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }
    
    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET || 'default_secret',
      { expiresIn: rememberMe ? '30d' : '24h' }
    );
    
    // Return user info and token
    return res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      },
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during login'
    });
  }
});

// Registration route
router.post('/register', validateRequest(registerSchema), async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email }
    });
    
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'User with this email already exists'
      });
    }
    
    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);
    
    // Create new user
    const newUser = await db.user.create({
      data: {
        name,
        email,
        passwordHash
      }
    });
    
    // Generate JWT token
    const token = jwt.sign(
      { id: newUser.id, email: newUser.email },
      process.env.JWT_SECRET || 'default_secret',
      { expiresIn: '24h' }
    );
    
    // Return user info and token
    return res.status(201).json({
      success: true,
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name
      },
      token
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during registration'
    });
  }
});

// Google OAuth login/signup route (simplified for now)
router.post('/google', async (req, res) => {
  try {
    const { token } = req.body;
    
    // In a real implementation, validate Google token here
    // For now, we'll simulate success with mock data
    const googleUser = {
      id: 'google-123456',
      email: 'user@example.com',
      name: 'Google User'
    };
    
    // Find or create user
    let user = await db.user.findUnique({
      where: { email: googleUser.email }
    });
    
    if (!user) {
      // Create new user from Google data
      user = await db.user.create({
        data: {
          name: googleUser.name,
          email: googleUser.email,
          passwordHash: '', // No password for OAuth users
          googleId: googleUser.id
        }
      });
    }
    
    // Generate JWT token
    const jwtToken = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET || 'default_secret',
      { expiresIn: '30d' }
    );
    
    // Return user info and token
    return res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      },
      token: jwtToken
    });
  } catch (error) {
    console.error('Google auth error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during Google authentication'
    });
  }
});

// Validate token and get current user
router.get('/validate', async (req, res) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided'
      });
    }
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default_secret') as { id: string };
    
    // Get user data
    const user = await db.user.findUnique({
      where: { id: decoded.id }
    });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Return user info
    return res.json({
      id: user.id,
      email: user.email,
      name: user.name
    });
  } catch (error) {
    console.error('Token validation error:', error);
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token'
    });
  }
});

// Logout route (for client reference - actual logout happens client-side)
router.post('/logout', (req, res) => {
  return res.json({
    success: true,
    message: 'Logout successful'
  });
});

export default router; 