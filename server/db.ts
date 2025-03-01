import pkg from 'pg';
const { Pool } = pkg;
import { drizzle } from "drizzle-orm/node-postgres";
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import { log } from "./vite";

// Configure WebSocket for Neon serverless
neonConfig.webSocketConstructor = ws;

// Determine if we're using a database or in-memory storage
const usingDatabase = !!process.env.DATABASE_URL;

// Log the storage mode
log(`Database module initialized: ${usingDatabase ? 'Using database storage' : 'Using in-memory storage'}`, 'database');

// Only create the database connection if we have a DATABASE_URL
let pool: pkg.Pool | undefined = undefined;
let db: any = undefined;

// Test database connection
async function testConnection() {
  if (!pool) return false;
  
  try {
    const client = await pool.connect();
    const res = await client.query('SELECT NOW()');
    client.release();
    log('Database connection test successful', 'database');
    return true;
  } catch (error) {
    log(`Database connection test failed: ${error}`, 'database');
    return false;
  }
}

// Create a connection pool and database client only if DATABASE_URL is provided
if (usingDatabase && process.env.DATABASE_URL) {
  try {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 20, // Adjust connection pool size for Railway
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });
    
    // Add error handler to the pool
    pool.on('error', (err) => {
      log(`Unexpected database error: ${err}`, 'database');
      // Don't crash the app, just log the error
    });
    
    // Initialize Drizzle with the pool
    db = drizzle(pool);
    
    // Test connection
    testConnection()
      .then(isConnected => {
        if (isConnected) {
          log("Database connection established successfully", 'database');
        } else {
          log("Database connection test failed", 'database');
        }
      })
      .catch(err => {
        log(`Error testing database connection: ${err}`, 'database');
      });
      
  } catch (error) {
    log(`Failed to connect to database: ${error}`, 'database');
    log("Will use in-memory storage instead", 'database');
  }
}

export { db, testConnection };
