// Load environment variables first
import 'dotenv/config';

import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { initializeDatabase } from "./db";
import cors from 'cors';

// Import route modules
import profileRoutes from './routes/profile-routes';
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
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://your-production-domain.com'] // Replace with your production domain
    : ['http://localhost:3000', 'http://localhost:5000', 'http://127.0.0.1:3000', 'http://127.0.0.1:5000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

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

(async () => {
  // Check environment variables
  checkRequiredEnvVars();
  
  // Initialize database for Railway deployment
  if (process.env.NODE_ENV === 'production') {
    try {
      await initializeDatabase();
      log('Database initialization completed successfully', 'database');
    } catch (error) {
      log(`Database initialization error: ${error instanceof Error ? error.message : String(error)}`, 'error');
      // Don't exit on database error - allow fallback to in-memory storage
    }
  }
  
  // Register main routes
  const server = await registerRoutes(app);

  // Register additional routes for security personalization feature
  app.use('/api', profileRoutes);
  app.use('/api', healthRoutes);
  app.use('/api', insightsRoutes);

  // Add a special route to log and debug requests to /api/generate/wird-suggestions
  app.use('/api/generate/wird-suggestions', (req, res, next) => {
    console.log('🔍 DEBUGGING ROUTE: /api/generate/wird-suggestions');
    console.log('🔍 Method:', req.method);
    console.log('🔍 Headers:', JSON.stringify(req.headers));
    console.log('🔍 Body:', JSON.stringify(req.body));
    console.log('🔍 Passing to next handler...');
    next();
  });

  console.log('🚀 ROUTE REGISTRATION ORDER:');
  console.log('1. Registering wird routes at /api');
  
  // Feature-specific API routes - IMPORTANT: Register wird routes BEFORE halaqa routes
  app.use('/api', wirdRoutes); // Register wird routes first to ensure /api/generate/wird-suggestions is handled correctly
  
  console.log('2. Registering user routes at /api/user');
  app.use('/api/user', userRoutes);
  
  console.log('3. Registering reflection routes at /api/reflections');
  app.use('/api/reflections', reflectionRoutes);
  
  console.log('4. Registering halaqa routes at /api/halaqas');
  app.use('/api/halaqas', halaqaRoutes); // Register halaqa routes after wird routes
  
  // Mount auth routes at both /api/auth and /auth to handle both API and OAuth callback
  app.use('/auth', authRoutes);
  app.use('/api/auth', authRoutes);

  // Register transcription routes
  app.use('/api', transcriptionRoutes);

  // Add a catch-all route for debugging unhandled API requests
  app.use('/api/*', (req, res, next) => {
    console.log(`⚠️ UNHANDLED API REQUEST: ${req.method} ${req.path}`);
    next();
  });

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    log(`Error: ${err.stack || err}`, 'error');
    res.status(status).json({ error: message });
  });

  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Use Railway's PORT environment variable or fall back to 3000
  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
  server.listen(port, "0.0.0.0", () => {
    log(`Server running on port ${port}`, 'info');
  });
})();
