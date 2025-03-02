import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

/**
 * Middleware to log detailed authentication information for debugging
 */
export function authDebugMiddleware(req: Request, res: Response, next: NextFunction) {
  // Log all headers to debug auth issues
  console.log(`[AUTH DEBUG] ${req.method} ${req.path} Headers:`, JSON.stringify({
    authorization: req.headers.authorization ? 'Bearer [hidden for security]' : 'Not provided',
    'content-type': req.headers['content-type'],
    'user-agent': req.headers['user-agent'],
    origin: req.headers.origin,
    referer: req.headers.referer,
  }));
  
  // Check for authorization header
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.log('[AUTH DEBUG] No valid authorization header found');
    next();
    return;
  }
  
  // Extract and analyze token
  const token = authHeader.split(' ')[1];
  console.log('[AUTH DEBUG] Token format:', 
    token.length > 20 ? 
      `${token.substring(0, 10)}...${token.substring(token.length - 10)}` : 
      'Invalid token format'
  );
  
  // Try to decode token without verification to see payload
  try {
    const decoded = jwt.decode(token);
    console.log('[AUTH DEBUG] Token decode attempt:', decoded ? 
      `Success - Payload: ${JSON.stringify(decoded)}` : 
      'Failed to decode token'
    );
  } catch (error) {
    console.log('[AUTH DEBUG] Token decode error:', error instanceof Error ? error.message : String(error));
  }
  
  // Continue with the request
  next();
} 