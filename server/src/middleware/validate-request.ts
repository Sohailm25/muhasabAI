import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';

/**
 * Middleware to validate request body against a Zod schema
 * @param schema Zod schema to validate against
 * @returns Express middleware function
 */
export const validateRequest = (schema: AnyZodObject) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Parse and validate the request body
      await schema.parseAsync(req.body);
      
      // If validation succeeds, proceed to the next middleware/handler
      return next();
    } catch (error) {
      // Handle validation errors
      if (error instanceof ZodError) {
        // Format Zod errors into a user-friendly format
        const formattedErrors = error.errors.map((err) => ({
          path: err.path.join('.'),
          message: err.message
        }));
        
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: formattedErrors
        });
      }
      
      // Handle other unexpected errors
      console.error('Request validation error:', error);
      return res.status(500).json({
        success: false,
        message: 'Server error during request validation'
      });
    }
  };
}; 