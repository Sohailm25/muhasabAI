/**
 * Health check routes for monitoring system health
 */
import express from 'express';
import { log } from '../vite';
import * as db from '../db';
import pg from 'pg';

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
        // Direct database connection check
        if (process.env.DATABASE_URL) {
          const pool = new pg.Pool({
            connectionString: process.env.DATABASE_URL,
            ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
            max: 1, // Use just one connection for health check
            idleTimeoutMillis: 5000, 
            connectionTimeoutMillis: 5000
          });
          
          // Test the connection with a simple query
          const client = await pool.connect();
          try {
            await client.query('SELECT 1 AS health_check');
            log('Health check: Database connection successful', 'info');
          } finally {
            client.release();
            await pool.end();
          }
        } else {
          log('Health check: DATABASE_URL not configured', 'warn');
          return res.status(200).json({
            status: 'warning',
            message: 'Server is running, but DATABASE_URL not configured',
            timestamp: new Date().toISOString()
          });
        }
      } catch (error) {
        log(`Health check: Database connection failed: ${error instanceof Error ? error.message : String(error)}`, 'error');
        // Still return OK if the database query fails but server is running
        // This allows Railway to start the app even if DB is not yet ready
        return res.status(200).json({
          status: 'warning',
          message: 'Server is running, but database connection failed',
          error: error instanceof Error ? error.message : String(error),
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
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    });
  }
});

export default router; 