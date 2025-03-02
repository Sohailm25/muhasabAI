// Load environment variables first
import 'dotenv/config';

import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { initializeDatabase } from "./db";

// Import route modules
import profileRoutes from './routes/profile-routes';
import healthRoutes from './routes/health-routes';

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

  // Use Railway's PORT environment variable or fall back to 5000
  const port = process.env.PORT || 5000;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`Server running on port ${port}`, 'info');
  });
})();