import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import { log } from '../vite';
import { getUserByEmail, getUserById, createUser, validateToken, invalidateToken, storeToken } from '../db/auth';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'sahabai-secret-key';

// Get the Google OAuth credentials from environment variables
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID ?? '';
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET ?? '';
const GOOGLE_CALLBACK_URL = process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3000/auth/google/callback';

if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
  console.error('Missing required Google OAuth credentials');
}

// Create a new OAuth2 client
const oAuth2Client = new OAuth2Client({
  clientId: GOOGLE_CLIENT_ID,
  clientSecret: GOOGLE_CLIENT_SECRET,
  redirectUri: GOOGLE_CALLBACK_URL
});

// Hash password utility
async function hashPassword(password: string): Promise<string> {
  const saltRounds = 10;
  return bcrypt.hash(password, saltRounds);
}

// Generate JWT token
function generateToken(userId: string): string {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
}

/**
 * User registration
 */
router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    
    // Validate input
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, password, and name are required' });
    }
    
    // Check if user already exists
    const existingUser = await getUserByEmail(email);
    if (existingUser) {
      return res.status(409).json({ error: 'User with this email already exists' });
    }
    
    // Hash password
    const hashedPassword = await hashPassword(password as string);
    
    // Create user
    const newUser = await createUser({
      email,
      password: hashedPassword,
      name,
      isFirstLogin: true,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    // Generate token
    const token = generateToken(newUser.id);
    
    // Return user info (excluding password) and token
    const { password: _, ...userWithoutPassword } = newUser;
    
    res.status(201).json({ 
      user: userWithoutPassword,
      token
    });
  } catch (error) {
    log(`Error in registration: ${error instanceof Error ? error.message : String(error)}`, 'error');
    res.status(500).json({ error: 'Registration failed' });
  }
});

/**
 * User login
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Validate input
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    
    // Find user
    const user = await getUserByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    
    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    
    // Generate token
    const token = generateToken(user.id);
    
    // Store token in database
    await storeToken(user.id, token);
    
    // Return user info (excluding password) and token
    const { password: _, ...userWithoutPassword } = user;
    
    res.status(200).json({ 
      user: userWithoutPassword,
      token,
      isFirstLogin: user.isFirstLogin
    });
  } catch (error) {
    log(`Error in login: ${error instanceof Error ? error.message : String(error)}`, 'error');
    res.status(500).json({ error: 'Login failed' });
  }
});

/**
 * Validate token
 */
router.get('/validate', async (req, res) => {
  try {
    console.log('[Validate Debug] Starting token validation');
    // Get token from header
    const authHeader = req.headers.authorization;
    console.log('[Validate Debug] Auth header present:', !!authHeader);
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('[Validate Debug] Invalid auth header format');
      return res.status(401).json({
        success: false,
        message: 'No token provided'
      });
    }
    
    const token = authHeader.split(' ')[1];
    console.log('[Validate Debug] Token extracted from header');
    
    // Verify token
    try {
      console.log('[Validate Debug] Verifying JWT token');
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
      console.log('[Validate Debug] JWT verification successful, user id:', decoded.userId);
      
      // Get user data
      console.log('[Validate Debug] Fetching user data from database');
      const user = await getUserById(decoded.userId);
      
      if (!user) {
        console.log('[Validate Debug] User not found in database');
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }
      
      console.log('[Validate Debug] User found, returning data');
      // Return user info
      return res.json({
        id: user.id,
        email: user.email,
        name: user.name
      });
    } catch (jwtError) {
      console.log('[Validate Debug] JWT verification failed:', jwtError);
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token'
      });
    }
  } catch (error) {
    console.error('[Validate Debug] Unexpected error:', error);
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token'
    });
  }
});

/**
 * Logout
 */
router.post('/logout', async (req, res) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }
    
    const token = authHeader.split(' ')[1];
    
    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    
    // Invalidate token
    await invalidateToken(token, decoded.userId);
    
    res.status(200).json({ message: 'Logout successful' });
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(200).json({ message: 'Logout successful' });
    }
    
    log(`Error in logout: ${error instanceof Error ? error.message : String(error)}`, 'error');
    res.status(500).json({ error: 'Logout failed' });
  }
});

/**
 * Google OAuth initialization
 */
router.get('/google', (req, res) => {
  try {
    // Get the action parameter (login or signup)
    const action = req.query.action as string || 'login';
    
    if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
      console.error('Google OAuth credentials not configured');
      return res.status(500).json({ error: 'OAuth configuration error' });
    }

    const authUrl = oAuth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: [
        'https://www.googleapis.com/auth/userinfo.profile',
        'https://www.googleapis.com/auth/userinfo.email'
      ],
      include_granted_scopes: true,
      prompt: 'consent',
      state: action,
      client_id: GOOGLE_CLIENT_ID,
      redirect_uri: GOOGLE_CALLBACK_URL,
      response_type: 'code',
      login_hint: '',
      hd: '*'
    });
    
    console.log('Redirecting to Google OAuth URL:', authUrl);
    res.redirect(authUrl);
  } catch (error) {
    console.error('Error initiating Google OAuth:', error);
    res.status(500).json({ error: 'Failed to initiate Google OAuth' });
  }
});

/**
 * Google OAuth callback
 */
router.get('/google/callback', async (req, res) => {
  try {
    const { code, state } = req.query;
    const action = (state as string) || 'login';
    
    console.log('OAuth callback received:', {
      code: code ? 'present' : 'missing',
      state,
      action
    });
    
    if (!code || typeof code !== 'string') {
      console.error('OAuth callback: Missing or invalid authorization code');
      return res.status(400).send('Authorization code missing');
    }
    
    console.log(`OAuth callback: Got authorization code, exchanging for tokens (action: ${action})`);
    
    let tokens;
    // Exchange code for tokens
    try {
      const response = await oAuth2Client.getToken(code);
      tokens = response.tokens;
      console.log('OAuth callback: Successfully exchanged code for tokens:', {
        access_token: tokens.access_token ? 'present' : 'missing',
        id_token: tokens.id_token ? 'present' : 'missing',
        expiry_date: tokens.expiry_date
      });
      oAuth2Client.setCredentials(tokens);
    } catch (tokenError) {
      console.error('OAuth callback: Token exchange error:', tokenError);
      return res.status(500).send('Error obtaining access token');
    }
    
    // Get user info from Google
    try {
      console.log('OAuth callback: Requesting user info from Google');
      const userInfoResponse = await oAuth2Client.request({
        url: 'https://www.googleapis.com/oauth2/v3/userinfo',
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${tokens.access_token}`
        }
      });
      
      console.log('OAuth callback: Raw user info response:', userInfoResponse);
      
      const userInfo = userInfoResponse.data as {
        email: string;
        name: string;
        picture: string;
        sub: string;
      };
      
      if (!userInfo.email) {
        throw new Error('Email not received from Google');
      }
      
      console.log('OAuth callback: Parsed user info:', {
        email: userInfo.email,
        name: userInfo.name,
        sub: userInfo.sub
      });
    
      // Check if user exists
      console.log('OAuth callback: Checking if user exists in database');
      let user = await getUserByEmail(userInfo.email);
      
      // If signup action but user already exists, return error
      if (action === 'signup' && user) {
        console.log('OAuth callback: Signup attempt for existing user');
        return res.send(`
          <script>
            window.opener.postMessage({
              error: "An account with this email already exists. Please use the login option instead."
            }, "${process.env.CLIENT_URL || '*'}");
            window.close();
          </script>
        `);
      }
      
      if (!user) {
        // Create new user
        console.log('OAuth callback: Creating new user in database');
        try {
          user = await createUser({
            email: userInfo.email,
            name: userInfo.name,
            googleId: userInfo.sub,
            isFirstLogin: true,
            createdAt: new Date(),
            updatedAt: new Date()
          });
          console.log('OAuth callback: New user created successfully:', user.id);
        } catch (createError) {
          console.error('OAuth callback: Error creating user:', createError);
          return res.status(500).send('Failed to create user account');
        }
      }
      
      // Generate token
      console.log('OAuth callback: Generating JWT token');
      const token = generateToken(user.id);
      
      // Store token in database
      console.log('OAuth callback: Storing token in database');
      try {
        await storeToken(user.id, token);
        console.log('OAuth callback: Token stored successfully');
      } catch (storeError) {
        console.error('OAuth callback: Failed to store token:', storeError);
      }
      
      // Close popup and send token to parent window
      console.log('OAuth callback: Sending response to client');
      res.send(`
        <script>
          window.opener.postMessage({
            token: "${token}",
            user: ${JSON.stringify({ ...user, password: undefined })}
          }, "${process.env.CLIENT_URL || '*'}");
          window.close();
        </script>
      `);
    } catch (userInfoError) {
      console.error('OAuth callback: Error fetching user info:', userInfoError);
      if (userInfoError instanceof Error) {
        console.error('Error details:', userInfoError.message);
        console.error('Error stack:', userInfoError.stack);
      }
      return res.status(500).send('Failed to fetch user information');
    }
  } catch (error) {
    console.error('OAuth callback: Unhandled error:', error);
    if (error instanceof Error) {
      console.error('Error details:', error.message);
      console.error('Error stack:', error.stack);
    }
    log(`Error in Google OAuth: ${error instanceof Error ? error.message : String(error)}`, 'error');
    res.status(500).send('Authentication failed');
  }
});

export default router; 