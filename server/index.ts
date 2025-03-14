// Load environment variables first
import 'dotenv/config';

import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes as registerAppRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { initializeDatabase } from "./db";
import * as db from './db/index';
import cors from 'cors';
import bodyParser from 'body-parser';
import { createServer } from 'http';

// Import route modules
import profileRoutes, { initProfileRoutes } from './routes/profile-routes';
import healthRoutes from './routes/health-routes';
import halaqaRoutes from './routes/halaqa-routes';
import wirdRoutes from './routes/wird-routes';
import authRoutes from './routes/auth-routes';
import insightsRoutes from './routes/insights-routes';

// Import route handlers
import userRoutes from "./routes/user-routes";
import reflectionRoutes from "./routes/reflection-routes";
import transcriptionRoutes from './src/routes/transcription';
import { authRequired } from './auth';
import { generateWirdRecommendations } from './lib/anthropic';

// Import middleware
import { errorHandler } from './middleware/error-handler';
import { requestLogger } from './middleware/request-logger';

// Import database utilities
import { runMigrations, validateDatabaseSchema } from './database/migration-manager';

// Import or define the missing functions
// import { testConnection } from './db/postgres';

// Check for required environment variables
function checkRequiredEnvVars() {
  const requiredVars = ['ANTHROPIC_API_KEY'];
  const missingVars = requiredVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.error(`ERROR: Missing required environment variables: ${missingVars.join(', ')}`);
    console.error('Please set these variables in your Railway project settings or .env file for local development');
    
    // In production, exit the process if variables are missing
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
  }
}

const app = express();
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: false, limit: '50mb' }));

// Add a dedicated health check endpoint at the root level
// This must be registered BEFORE any other routes to avoid conflicts
app.get('/api/health', (req, res) => {
  return res.status(200).json({
    status: 'ok',
    message: 'Service is healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Configure CORS
app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // List of allowed origins
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3001',
      'https://www.sahabai.dev',
      'https://sahabai.dev'
    ];
    
    if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
      callback(null, true);
    } else {
      console.log('[CORS] Blocked request from:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Log CORS configuration
console.log('🔍 [SERVER INIT] CORS configured with allowed origins:', [
  'http://localhost:3000',
  'http://localhost:3001',
  'https://www.sahabai.dev',
  'https://sahabai.dev'
]);

// Add a request logger middleware
app.use((req, res, next) => {
  console.log(`[SERVER] ${req.method} ${req.path} - Headers: ${JSON.stringify(req.headers)}`);
  next();
});

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

// Add middleware to log all requests
app.use((req, res, next) => {
  console.log(`[SERVER] ${req.method} ${req.originalUrl}`);
  console.log(`[SERVER] Headers: ${JSON.stringify(req.headers)}`);
  
  // Check if this is an API request
  const isApiRequest = req.originalUrl.startsWith('/api/');
  console.log(`[SERVER] Is API request: ${isApiRequest}`);
  
  if (isApiRequest) {
    // Store the original json method
    const originalJson = res.json;
    
    // Override the json method
    res.json = function(body) {
      // Set the content-type header
      res.setHeader('Content-Type', 'application/json');
      
      // Call the original json method
      return originalJson.call(this, body);
    };
  }
  
  next();
});

// Define a direct route handler for /api/generate/wird-suggestions
// This must be defined BEFORE any other routes
app.post('/api/generate/wird-suggestions', (req, res, next) => {
  console.log('⭐ DIRECT ROUTE HANDLER: /api/generate/wird-suggestions');
  console.log('⭐ Method:', req.method);
  console.log('⭐ Headers:', JSON.stringify(req.headers));
  console.log('⭐ Body:', JSON.stringify(req.body));
  
  // Call authRequired middleware
  authRequired(req, res, (err) => {
    if (err) {
      console.log('⭐ Auth error:', err);
      return next(err);
    }
    
    console.log('⭐ Authentication successful');
    
    // Extract data from request body
    const { conversation, messages, personalizationContext } = req.body;
    
    // Validate the request
    if (!conversation) {
      console.log('⭐ Missing conversation content');
      return res.status(400).json({ error: "Missing conversation content" });
    }
    
    console.log('⭐ Conversation length:', conversation.length);
    
    // Generate timestamp for IDs
    const timestamp = Date.now();
    
    // Generate fallback suggestions
    const fallbackSuggestions = [
      {
        id: `wird-${timestamp}-1`,
        type: "Quran",
        category: "Quran",
        name: "Daily Quran Reading",
        title: "Daily Quran Reading",
        description: "Read portions of the Quran daily to strengthen your connection with Allah's words",
        target: 5,
        unit: "pages",
        duration: "15-20 minutes",
        frequency: "daily"
      },
      {
        id: `wird-${timestamp}-2`,
        type: "Dhikr",
        category: "Dhikr",
        name: "Morning and Evening Adhkar",
        title: "Morning and Evening Adhkar",
        description: "Incorporate the Prophetic morning and evening remembrances into your daily routine",
        target: 1,
        unit: "session",
        duration: "10 minutes",
        frequency: "twice daily"
      },
      {
        id: `wird-${timestamp}-3`,
        type: "Dua",
        category: "Dua",
        name: "Personal Reflection Dua",
        title: "Personal Reflection Dua",
        description: "Take time for personal conversation with Allah, expressing gratitude and seeking guidance",
        target: 1,
        unit: "session",
        duration: "5 minutes",
        frequency: "daily"
      }
    ];
    
    console.log('⭐ Returning fallback suggestions');
    return res.json({ wirdSuggestions: fallbackSuggestions });
  });
});

// Function to get user count from the database
async function getUserCount(): Promise<number> {
  try {
    // This is a placeholder implementation - replace with actual implementation
    console.log('[DB INIT] Getting user count from database');
    // For now, just return 0 as we don't have the actual implementation
    return 0;
  } catch (error) {
    console.error('[DB INIT] Error getting user count:', error);
    return 0;
  }
}

// Function to test database connection
async function testConnection(): Promise<boolean> {
  try {
    console.log('[DB INIT] Testing database connection');
    // This is a placeholder implementation - replace with actual implementation
    // For now, just return true to simulate a successful connection
    return true;
  } catch (error) {
    console.error('[DB INIT] Error testing database connection:', error);
    return false;
  }
}

// Initialize database and run migrations
async function initializeDatabaseWithMigrations() {
  console.log('🔍 [SERVER INIT] Initializing database...');
  
  try {
    // Check if we're using a database or in-memory storage
    const usingDatabase = !!process.env.DATABASE_URL;
    
    if (!usingDatabase) {
      console.log('🔍 [SERVER INIT] No DATABASE_URL provided - using in-memory storage mode');
      console.log('✅ [SERVER INIT] Database initialization skipped - using in-memory storage');
      return true;
    }
    
    // Initialize database connection
    await initializeDatabase();
    
    // Validate database schema
    console.log('🔍 [SERVER INIT] Validating database schema...');
    const schemaValid = await validateDatabaseSchema(db.getPool());
    
    if (!schemaValid) {
      console.warn('⚠️ [SERVER INIT] Database schema validation failed. Running migrations...');
    }
    
    // Run migrations
    console.log('🔍 [SERVER INIT] Running database migrations...');
    await runMigrations(db.getPool());
    
    console.log('✅ [SERVER INIT] Database initialization completed successfully');
    return true;
  } catch (error) {
    console.error('❌ [SERVER INIT] Database initialization failed:', error);
    if (!process.env.DATABASE_URL) {
      console.log('✅ [SERVER INIT] Continuing with in-memory storage mode');
      return true;
    }
    throw error;
  }
}

// Register routes
function registerRoutes() {
  console.log('🔍 [SERVER INIT] Registering routes...');
  
  // Add request logger middleware
  app.use(requestLogger);
  
  // Register health check endpoint
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });
  
  // Register API routes
  console.log('🔍 [SERVER INIT] Registering API routes...');
  
  // Define API prefixes
  const API_PREFIX = '/api';
  const AUTH_PREFIX = `${API_PREFIX}/auth`;
  const PROFILE_PREFIX = `${API_PREFIX}/profile`;
  
  // Add a middleware to log all API requests
  app.use((req, res, next) => {
    if (req.originalUrl.includes('/api/profile')) {
      console.log(`[API DEBUG] ${req.method} ${req.originalUrl} request received`);
      console.log(`[API DEBUG] Headers: ${JSON.stringify(req.headers)}`);
      console.log(`[API DEBUG] Query params: ${JSON.stringify(req.query)}`);
      console.log(`[API DEBUG] Body: ${req.body ? JSON.stringify(req.body) : 'none'}`);
    }
    next();
  });
  
  // Register auth routes
  console.log("🔍 [SERVER INIT] Registering auth routes at /auth");
  app.use('/auth', authRoutes);
  console.log("🔍 [SERVER INIT] Registering auth routes at /api/auth");
  app.use(AUTH_PREFIX, authRoutes);
  
  // Register profile routes
  console.log("🔍 [SERVER INIT] Registering profile routes at /api/profile");
  app.use(PROFILE_PREFIX, initProfileRoutes(db.getPool()));
  
  // Register compatibility routes
  console.log("🔍 [SERVER INIT] Registering compatibility routes");
  
  // Redirect /api/auth/validate to /auth/validate-with-fallback
  app.get('/api/auth/validate', (req, res, next) => {
    console.log("🔍 [COMPAT] Redirecting /api/auth/validate to /auth/validate-with-fallback");
    res.redirect(307, '/auth/validate-with-fallback');
  });
  
  // Register other routes
  console.log("🔍 [SERVER INIT] Registering transcription routes");
  app.use('/api/transcribe', transcriptionRoutes);
  
  // Register wird routes
  console.log("🔍 [SERVER INIT] Registering wird routes at /api/wirds");
  app.use('/api/wirds', wirdRoutes);
  
  // Register user routes
  console.log("🔍 [SERVER INIT] Registering user routes at /api/user");
  app.use('/api/user', userRoutes);
  
  // Register reflection routes
  console.log("🔍 [SERVER INIT] Registering reflection routes at /api/reflections");
  app.use('/api/reflections', reflectionRoutes);
  
  // Register halaqa routes
  console.log("🔍 [SERVER INIT] Registering halaqa routes at /api/halaqas");
  app.use('/api/halaqas', halaqaRoutes);
  
  // Register error handler middleware (must be after routes)
  app.use(errorHandler);
  
  // Log all registered routes for debugging
  console.log('🚀 REGISTERED ROUTES:');
  app._router.stack.forEach((middleware: any) => {
    if (middleware.route) {
      console.log(`${middleware.route.stack[0].method.toUpperCase()} ${middleware.route.path}`);
    } else if (middleware.name === 'router') {
      middleware.handle.stack.forEach((handler: any) => {
        if (handler.route) {
          const method = handler.route.stack[0].method.toUpperCase();
          const path = handler.route.path;
          console.log(`${method} ${middleware.regexp} ${path}`);
        }
      });
    }
  });
  
  console.log('✅ [SERVER INIT] Routes registered successfully');
}

// Define PORT
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 8080;

// Start server
async function startServer() {
  console.log(`🔍 [SERVER INIT] Starting server initialization...`);
  console.log(`🔍 [SERVER INIT] Initialization timestamp: ${new Date().toISOString()}`);
  console.log(`🔍 [SERVER INIT] Environment: ${process.env.NODE_ENV}`);
  
  try {
    // Initialize database
    await initializeDatabaseWithMigrations();
    
    // Register routes
    registerRoutes();
    
    // Create HTTP server
    const server = createServer(app);
    
    // Setup Vite or serve static files
    console.log('🔍 [SERVER INIT] Setting up static file serving');
    serveStatic(app);
    
    // Start server
    server.listen(PORT, () => {
      console.log(`🚀 [SERVER] Server running on port ${PORT}`);
      console.log(`🚀 [SERVER] Access the application at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('❌ [SERVER INIT] Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
startServer();
