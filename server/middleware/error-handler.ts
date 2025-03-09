import { Request, Response, NextFunction } from 'express';
import { AppError, DatabaseError, SchemaError, AuthenticationError } from '../utils/errors';

/**
 * Global error handler middleware
 * Catches all errors and formats them consistently
 */
export function errorHandler(
  err: any, 
  req: Request, 
  res: Response, 
  next: NextFunction
) {
  // Log error details
  console.error('[ERROR] Unhandled error:', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    headers: sanitizeHeaders(req.headers),
    body: sanitizeBody(req.body),
    statusCode: err.statusCode,
    code: err.code,
    name: err.name
  });
  
  // Default error response
  let statusCode = err.statusCode || 500;
  let errorMessage = err.message || 'Internal server error';
  let errorDetails = undefined;
  let errorCode = err.code || 'UNKNOWN_ERROR';
  
  // Handle specific error types
  if (err instanceof AppError) {
    // Already formatted correctly
    statusCode = err.statusCode;
    errorMessage = err.message;
    errorCode = err instanceof DatabaseError ? err.code : errorCode;
  } else if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    statusCode = 401;
    errorMessage = err.name === 'TokenExpiredError' 
      ? 'Authentication token expired' 
      : 'Invalid authentication token';
    errorCode = 'AUTH_ERROR';
  } else if (err.code === '42703') {
    // PostgreSQL undefined column
    statusCode = 500;
    errorMessage = 'Database schema error';
    errorDetails = err.message;
    errorCode = err.code;
  } else if (err.code && err.code.startsWith('42')) {
    // Other PostgreSQL schema errors
    statusCode = 500;
    errorMessage = 'Database schema error';
    errorDetails = err.message;
    errorCode = err.code;
  }
  
  // Include error details in development
  if (process.env.NODE_ENV === 'development') {
    errorDetails = errorDetails || err.message;
  }
  
  // Always return JSON with consistent format
  res.status(statusCode).json({
    success: false,
    error: errorMessage,
    code: errorCode,
    details: errorDetails,
    timestamp: new Date().toISOString()
  });
}

/**
 * Sanitize request headers for logging
 * Removes sensitive information
 */
function sanitizeHeaders(headers: any): any {
  const sanitized = { ...headers };
  
  // Remove sensitive headers
  if (sanitized.authorization) {
    sanitized.authorization = sanitized.authorization.startsWith('Bearer ')
      ? 'Bearer [REDACTED]'
      : '[REDACTED]';
  }
  
  if (sanitized.cookie) {
    sanitized.cookie = '[REDACTED]';
  }
  
  return sanitized;
}

/**
 * Sanitize request body for logging
 * Removes sensitive information
 */
function sanitizeBody(body: any): any {
  if (!body) return body;
  
  const sanitized = { ...body };
  
  // Remove sensitive fields
  const sensitiveFields = ['password', 'token', 'secret', 'apiKey', 'api_key', 'key'];
  
  for (const field of sensitiveFields) {
    if (sanitized[field]) {
      sanitized[field] = '[REDACTED]';
    }
  }
  
  return sanitized;
} 