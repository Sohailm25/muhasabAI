/**
 * Health check routes for monitoring system health
 */
import express from 'express';
import { log } from '../vite';
import * as db from '../db';

const router = express.Router();

/**
 * Basic health check endpoint
 * Used by Railway for status monitoring
 */
router.get('/health', async (req, res) => {
  try {
    // Check database connectivity if in production
    if (process.env.NODE_ENV === 'production' || process.env.USE_DATABASE === 'true') {
      try {
        // Simple check - this will throw if database is not available
        await db.getUserProfile('health-check');
        log('Health check: Database connection successful', 'info');
      } catch (error) {
        log(`Health check: Database connection failed: ${error instanceof Error ? error.message : String(error)}`, 'error');
        // Still return OK if the database query fails but server is running
        // This allows Railway to start the app even if DB is not yet ready
        return res.status(200).json({
          status: 'warning',
          message: 'Server is running, but database connection failed',
          timestamp: new Date().toISOString()
        });
      }
    }

    // Return success response
    return res.status(200).json({
      status: 'ok',
      message: 'Service is healthy',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      dbMode: process.env.USE_DATABASE === 'true' ? 'PostgreSQL' : 'In-Memory'
    });
  } catch (error) {
    log(`Health check failed: ${error instanceof Error ? error.message : String(error)}`, 'error');
    
    // Return error response
    return res.status(500).json({
      status: 'error',
      message: 'Service is unhealthy',
      timestamp: new Date().toISOString()
    });
  }
});

export default router; 