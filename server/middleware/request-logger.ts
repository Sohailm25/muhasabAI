import { Request, Response, NextFunction } from 'express';

/**
 * Request logger middleware
 * Logs all incoming requests and their responses
 */
export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();
  const requestId = generateRequestId();
  
  // Attach request ID to the request object for correlation
  (req as any).requestId = requestId;
  
  // Log request
  console.log(`[REQUEST][${requestId}] ${req.method} ${req.path}`, {
    headers: sanitizeHeaders(req.headers),
    query: req.query,
    body: sanitizeBody(req.body),
    ip: req.ip,
    timestamp: new Date().toISOString()
  });
  
  // Capture original methods to intercept response
  const originalSend = res.send;
  const originalJson = res.json;
  const originalEnd = res.end;
  
  // Override send method
  res.send = function(body: any): Response {
    const duration = Date.now() - start;
    logResponse(req, res, body, duration, requestId);
    return originalSend.apply(this, arguments as any);
  };
  
  // Override json method
  res.json = function(body: any): Response {
    const duration = Date.now() - start;
    logResponse(req, res, body, duration, requestId);
    return originalJson.apply(this, arguments as any);
  };
  
  // Override end method
  res.end = function(chunk: any): Response {
    const duration = Date.now() - start;
    logResponse(req, res, chunk, duration, requestId);
    return originalEnd.apply(this, arguments as any);
  };
  
  next();
}

/**
 * Log response details
 */
function logResponse(
  req: Request, 
  res: Response, 
  body: any, 
  duration: number,
  requestId: string
) {
  // Only log once
  if ((res as any).__responsedLogged) return;
  (res as any).__responsedLogged = true;
  
  // Log response
  console.log(`[RESPONSE][${requestId}] ${req.method} ${req.path} ${res.statusCode} in ${duration}ms`, {
    statusCode: res.statusCode,
    headers: res.getHeaders(),
    size: body ? (typeof body === 'string' ? body.length : JSON.stringify(body).length) : 0,
    duration,
    timestamp: new Date().toISOString()
  });
  
  // Log response body in development
  if (process.env.NODE_ENV === 'development') {
    try {
      const bodyToLog = typeof body === 'string' ? 
        (body.startsWith('{') || body.startsWith('[') ? JSON.parse(body) : body.substring(0, 200)) : 
        body;
      
      console.log(`[RESPONSE_BODY][${requestId}]`, sanitizeBody(bodyToLog));
    } catch (error) {
      console.log(`[RESPONSE_BODY][${requestId}] Could not parse response body`);
    }
  }
}

/**
 * Generate a unique request ID
 */
function generateRequestId(): string {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
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
 * Sanitize request/response body for logging
 * Removes sensitive information
 */
function sanitizeBody(body: any): any {
  if (!body) return body;
  
  // If body is a string that's too long, truncate it
  if (typeof body === 'string' && body.length > 500) {
    return body.substring(0, 500) + '... [truncated]';
  }
  
  // If not an object, return as is
  if (typeof body !== 'object') return body;
  
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