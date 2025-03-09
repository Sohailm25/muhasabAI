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
    log(`Looking up user by ID: ${id}`, 'debug');
    const user = usersStore.get(id);
    return user || null;
  } catch (error) {
    console.error('Error getting user by ID:', error);
    return null;
  }
}

/**
 * Create a new user
 */
export async function createUser(userData: Partial<User>): Promise<User> {
  try {
    // Generate a unique ID if not provided
    const id = userData.id || generateUniqueId();
    const data: User = {
      id: id,
      email: userData.email!,
      name: userData.name!,
      password: userData.password,
      googleId: userData.googleId,
      isFirstLogin: userData.isFirstLogin ?? true,
      hasAcceptedPrivacyPolicy: userData.hasAcceptedPrivacyPolicy ?? false,
      createdAt: userData.createdAt || new Date(),
      updatedAt: userData.updatedAt || new Date()
    };
    
    // Store user and create email index
    usersStore.set(id, data);
    emailIndex.set(data.email, id);
    
    log(`Created new user: ${id} (${data.email})`, 'debug');
    return data;
  } catch (error) {
    console.error('Error creating user:', error);
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