/**
 * Custom error types for better error handling
 */

/**
 * Base application error class
 */
export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;
  
  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Database error
 */
export class DatabaseError extends AppError {
  code: string;
  
  constructor(message: string, code: string = 'DB_ERROR') {
    super(`Database error: ${message}`, 500);
    this.code = code;
  }
}

/**
 * Authentication error
 */
export class AuthenticationError extends AppError {
  constructor(message: string) {
    super(message, 401);
  }
}

/**
 * Authorization error
 */
export class AuthorizationError extends AppError {
  constructor(message: string) {
    super(message, 403);
  }
}

/**
 * Not found error
 */
export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource} not found`, 404);
  }
}

/**
 * Validation error
 */
export class ValidationError extends AppError {
  errors: any;
  
  constructor(message: string, errors: any = null) {
    super(message, 400);
    this.errors = errors;
  }
}

/**
 * Schema error
 */
export class SchemaError extends DatabaseError {
  constructor(message: string, code: string = 'SCHEMA_ERROR') {
    super(message, code);
  }
}

/**
 * Convert PostgreSQL error to appropriate application error
 */
export function convertPgError(error: any): AppError {
  console.log('[ERROR] Converting PostgreSQL error:', error);
  
  // Handle specific PostgreSQL error codes
  switch (error.code) {
    case '42703': // undefined_column
      return new SchemaError(`Schema error: ${error.message}`, error.code);
    case '23505': // unique_violation
      return new ValidationError(`Duplicate entry: ${error.detail}`, error);
    case '23503': // foreign_key_violation
      return new ValidationError(`Foreign key violation: ${error.detail}`, error);
    case '42P01': // undefined_table
      return new SchemaError(`Table not found: ${error.message}`, error.code);
    default:
      return new DatabaseError(error.message, error.code);
  }
} 