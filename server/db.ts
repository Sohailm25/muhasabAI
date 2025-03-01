import pkg from 'pg';
const { Pool } = pkg;
import { drizzle } from "drizzle-orm/node-postgres";
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";

// Configure WebSocket for Neon serverless
neonConfig.webSocketConstructor = ws;

// Determine if we're using a database or in-memory storage
const usingDatabase = !!process.env.DATABASE_URL;

// Log the storage mode
console.log(`Database module initialized: ${usingDatabase ? 'Using database storage' : 'Using in-memory storage'}`);

// Only create the database connection if we have a DATABASE_URL
let pool = undefined;
let db = undefined;

// Create a connection pool and database client only if DATABASE_URL is provided
if (usingDatabase && process.env.DATABASE_URL) {
  try {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });
    
    // Initialize Drizzle with the pool
    db = drizzle(pool);
    
    console.log("Database connection established successfully");
  } catch (error) {
    console.error("Failed to connect to database:", error);
    console.warn("Will use in-memory storage instead");
  }
}

export { db };
