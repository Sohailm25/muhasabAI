import { log } from '../vite';

// In-memory data store for users
const usersStore: Map<string, User> = new Map();
const emailIndex: Map<string, string> = new Map(); // email -> userId
const tokensStore: Map<string, Token> = new Map();

export interface User {
  id: string;
  email: string;
  name: string;
  password?: string;
  googleId?: string;
  isFirstLogin: boolean;
  hasAcceptedPrivacyPolicy: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Token {
  id: string;
  userId: string;
  token: string;
  createdAt: Date;
  expiresAt: Date;
  isRevoked: boolean;
}

/**
 * Get user by email
 */
export async function getUserByEmail(email: string): Promise<User | null> {
  try {
    log(`Looking up user by email: ${email}`, 'debug');
    const userId = emailIndex.get(email);
    if (!userId) return null;
    
    const user = usersStore.get(userId);
    return user || null;
  } catch (error) {
    console.error('Error getting user by email:', error);
    return null;
  }
}

/**
 * Get user by ID
 */
export async function getUserById(id: string): Promise<User | null> {
  try {
    console.log(`[DB DEBUG] Looking up user by ID: ${id}`);
    
    // Check if usersStore is initialized
    if (!usersStore) {
      console.error('[DB DEBUG] usersStore is not initialized');
      return null;
    }
    
    console.log(`[DB DEBUG] usersStore size: ${usersStore.size} entries`);
    
    // Log a few user IDs from the store for debugging
    const userIds = Array.from(usersStore.keys()).slice(0, 5);
    console.log(`[DB DEBUG] Sample user IDs in store: ${userIds.join(', ') || 'none'}`);
    
    const user = usersStore.get(id);
    console.log(`[DB DEBUG] User lookup result: ${user ? 'Found' : 'Not found'}`);
    
    if (user) {
      console.log(`[DB DEBUG] User details: ID=${user.id}, Email=${user.email}, Name=${user.name}`);
    }
    
    return user || null;
  } catch (error) {
    console.error('[DB DEBUG] Error getting user by ID:', error);
    return null;
  }
}

/**
 * Create a new user
 */
export async function createUser(userData: Partial<User>): Promise<User> {
  try {
    console.log(`[USER CREATION] Starting user creation process with data:`, {
      email: userData.email,
      name: userData.name,
      googleId: userData.googleId ? 'Present' : 'Not present',
      isFirstLogin: userData.isFirstLogin
    });
    
    // Check if usersStore is initialized
    if (!usersStore) {
      console.error('[USER CREATION] usersStore is not initialized');
      throw new Error('User store not initialized');
    }
    
    console.log(`[USER CREATION] Current users in store: ${usersStore.size}`);
    
    // Generate a unique ID for the user
    const userId = userData.id || generateUniqueId();
    console.log(`[USER CREATION] Generated/provided user ID: ${userId}`);
    
    // Create user object with required fields
    const user: User = {
      id: userId,
      email: userData.email || '',
      name: userData.name || '',
      password: userData.password,
      googleId: userData.googleId,
      isFirstLogin: userData.isFirstLogin !== undefined ? userData.isFirstLogin : true,
      hasAcceptedPrivacyPolicy: userData.hasAcceptedPrivacyPolicy || false,
      createdAt: userData.createdAt || new Date(),
      updatedAt: userData.updatedAt || new Date()
    };
    
    // Store user in memory
    usersStore.set(userId, user);
    
    // Index user by email for quick lookup
    if (user.email) {
      emailIndex.set(user.email, userId);
      console.log(`[USER CREATION] User indexed by email: ${user.email}`);
    }
    
    console.log(`[USER CREATION] User created successfully with ID: ${userId}`);
    console.log(`[USER CREATION] Updated users in store: ${usersStore.size}`);
    
    // Log a few user IDs from the store for debugging
    const userIds = Array.from(usersStore.keys()).slice(0, 5);
    console.log(`[USER CREATION] Sample user IDs in store: ${userIds.join(', ')}`);
    
    return user;
  } catch (error) {
    console.error('[USER CREATION] Error creating user:', error);
    throw error;
  }
}

/**
 * Update user
 */
export async function updateUser(id: string, userData: Partial<User>): Promise<User | null> {
  try {
    const existingUser = usersStore.get(id);
    if (!existingUser) return null;
    
    // Handle email change by updating index
    if (userData.email && userData.email !== existingUser.email) {
      emailIndex.delete(existingUser.email);
      emailIndex.set(userData.email, id);
    }
    
    // Update user data
    const updatedUser: User = {
      ...existingUser,
      ...userData,
      updatedAt: new Date()
    };
    
    usersStore.set(id, updatedUser);
    log(`Updated user: ${id}`, 'debug');
    
    return updatedUser;
  } catch (error) {
    console.error('Error updating user:', error);
    return null;
  }
}

/**
 * Store a valid token
 */
export async function storeToken(userId: string, token: string, expiresIn: number = 7 * 24 * 60 * 60): Promise<Token> {
  try {
    // Calculate expiration date
    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + expiresIn);
    
    const tokenId = generateUniqueId();
    const tokenData: Token = {
      id: tokenId,
      userId,
      token,
      createdAt: new Date(),
      expiresAt,
      isRevoked: false
    };
    
    tokensStore.set(token, tokenData);
    log(`Stored token for user: ${userId}`, 'debug');
    
    return tokenData;
  } catch (error) {
    console.error('Error storing token:', error);
    throw error;
  }
}

/**
 * Validate token
 */
export async function validateToken(token: string, userId: string): Promise<User | null> {
  try {
    const storedToken = tokensStore.get(token);
    
    // Check if token exists and belongs to user
    if (!storedToken || storedToken.userId !== userId || storedToken.isRevoked) {
      return null;
    }
    
    // Check if token is expired
    if (storedToken.expiresAt < new Date()) {
      await invalidateToken(token, userId);
      return null;
    }
    
    // Get user
    return getUserById(userId);
  } catch (error) {
    console.error('Error validating token:', error);
    return null;
  }
}

/**
 * Invalidate token
 */
export async function invalidateToken(token: string, userId: string): Promise<boolean> {
  try {
    const storedToken = tokensStore.get(token);
    
    // Check if token exists and belongs to user
    if (!storedToken || storedToken.userId !== userId) {
      return false;
    }
    
    // Mark token as revoked
    storedToken.isRevoked = true;
    tokensStore.set(token, storedToken);
    
    log(`Invalidated token for user: ${userId}`, 'debug');
    return true;
  } catch (error) {
    console.error('Error invalidating token:', error);
    return false;
  }
}

/**
 * Generate a unique ID (UUID v4)
 */
function generateUniqueId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
} 