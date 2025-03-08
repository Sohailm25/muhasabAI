import { type Request, type Response, type NextFunction } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "sahabai-secret-key";

/**
 * Middleware to verify authentication token
 * This middleware checks if the request has a valid JWT token
 * If valid, it adds the decoded user information to req.user and calls next()
 * If invalid, it returns a 401 Unauthorized response
 */
export const authRequired = (req: Request, res: Response, next: NextFunction) => {
  try {
    console.log('[AUTH DEBUG] Path:', req.path);
    console.log('[AUTH DEBUG] Method:', req.method);
    
    // Get token from authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.log('[AUTH DEBUG] No valid authorization header found');
      return res.status(401).json({ error: "Authentication required" });
    }
    
    const token = authHeader.split(" ")[1];
    console.log('[AUTH DEBUG] Token found, verifying...');
    
    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    console.log('[AUTH DEBUG] Token verified, decoded payload:', decoded);
    
    // Make sure we have a userId field
    if (!decoded || typeof decoded !== 'object' || !decoded.userId) {
      console.log('[AUTH DEBUG] Invalid token payload format (no userId):', decoded);
      return res.status(401).json({ error: "Invalid token format" });
    }
    
    // Add user info to request object
    (req as any).user = {
      id: decoded.userId, 
      // Include other properties if available
      email: decoded.email || '',
      name: decoded.name || ''
    };
    
    console.log('[AUTH DEBUG] User object attached to request:', (req as any).user);
    
    next();
  } catch (error) {
    console.error("[AUTH DEBUG] Authentication error:", error);
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}; 