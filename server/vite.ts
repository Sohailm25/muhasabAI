import express, { type Express } from "express";
import fs from "fs";
import path, { dirname } from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer, createLogger } from "vite";
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
import { type Server } from "http";
import viteConfig from "../vite.config";
import { nanoid } from "nanoid";

/**
 * Development server utilities
 */

// Log levels for different environments
const LOG_LEVELS = {
  development: ['info', 'warn', 'error', 'debug', 'database'] as const,
  production: ['info', 'warn', 'error', 'database'] as const,
  test: ['error'] as const,
};

// Create union type from all possible log levels
type LogLevel = 'info' | 'warn' | 'error' | 'debug' | 'database';
type LogCategory = LogLevel | string;

// Get current environment
const NODE_ENV = process.env.NODE_ENV || 'development';

// Determine active log levels based on environment
const ACTIVE_LOG_LEVELS: readonly string[] = 
  LOG_LEVELS[NODE_ENV as keyof typeof LOG_LEVELS] || LOG_LEVELS.development;

// Log colors for console
const LOG_COLORS = {
  info: '\x1b[36m%s\x1b[0m',    // Cyan
  warn: '\x1b[33m%s\x1b[0m',    // Yellow
  error: '\x1b[31m%s\x1b[0m',   // Red
  debug: '\x1b[35m%s\x1b[0m',   // Magenta
  database: '\x1b[32m%s\x1b[0m', // Green
  default: '\x1b[37m%s\x1b[0m'  // White
};

/**
 * Log a message to the console if the log level is enabled for the current environment
 * @param message The message to log
 * @param category The log category/level
 */
export function log(message: string, category: LogCategory = 'info'): void {
  // Skip logging if this level is not active in current environment
  if (!ACTIVE_LOG_LEVELS.includes(category)) {
    return;
  }

  const timestamp = new Date().toISOString();
  const color = LOG_COLORS[category as keyof typeof LOG_COLORS] || LOG_COLORS.default;
  
  // Format: [TIMESTAMP] [CATEGORY] Message
  console.log(color, `[${timestamp}] [${category.toUpperCase()}] ${message}`);
}

/**
 * Development server utilities
 */

export const isDevelopment = process.env.NODE_ENV === 'development';
export const isProduction = process.env.NODE_ENV === 'production';
export const isTest = process.env.NODE_ENV === 'test';

const viteLogger = createLogger();

export async function setupVite(app: Express, server: Server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: ['all'],
  };

  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      },
    },
    server: serverOptions,
    appType: "custom",
  });

  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;

    try {
      const clientTemplate = path.resolve(
        __dirname,
        "..",
        "client",
        "index.html",
      );

      // always reload the index.html file from disk incase it changes
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`,
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

export function serveStatic(app: Express) {
  const distPath = path.resolve(__dirname, "../dist");
  const publicPath = path.resolve(distPath, "public");

  if (!fs.existsSync(distPath)) {
    log(`WARNING: Build directory not found: ${distPath}`, "express");
    log("Attempting to create dist directory...", "express");
    
    try {
      fs.mkdirSync(distPath, { recursive: true });
      log("Created dist directory", "express");
    } catch (error) {
      log(`ERROR: Failed to create dist directory: ${error}`, "express");
      throw new Error(
        `Could not find or create the build directory: ${distPath}. Make sure to build the client first with 'npm run build'`
      );
    }
  }

  // Check if the public directory exists (this is where Vite builds the client files)
  if (!fs.existsSync(publicPath)) {
    log(`WARNING: Public directory not found: ${publicPath}`, "express");
    log("The client files may not have been built correctly.", "express");
    log("Creating an empty public directory and index.html as fallback...", "express");
    
    try {
      fs.mkdirSync(publicPath, { recursive: true });
      
      // Create a basic index.html file as fallback
      const fallbackHtml = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>MuhasabAI</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 2rem; text-align: center; }
            .message { margin: 2rem 0; }
            .error { color: #e53e3e; }
          </style>
        </head>
        <body>
          <h1>MuhasabAI</h1>
          <div class="message">
            <p>The application is running, but the client-side files were not found.</p>
            <p class="error">Please make sure to run a complete build with 'npm run build'.</p>
          </div>
        </body>
        </html>
      `;
      
      fs.writeFileSync(path.join(publicPath, "index.html"), fallbackHtml);
      log("Created fallback index.html", "express");
    } catch (error) {
      log(`ERROR: Failed to create fallback files: ${error}`, "express");
    }
  }

  // Serve static files with proper caching headers
  app.use(express.static(publicPath, {
    etag: true,
    lastModified: true,
    setHeaders: (res, filePath) => {
      // Long cache for assets
      if (filePath.match(/\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$/)) {
        res.setHeader('Cache-Control', 'public, max-age=31536000'); // 1 year
      } else {
        res.setHeader('Cache-Control', 'public, max-age=0');
      }
    }
  }));

  // fall through to index.html if the file doesn't exist
  app.use("*", (req, res, next) => {
    try {
      const indexPath = path.resolve(publicPath, "index.html");
      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        next(new Error("index.html file not found. Build may be corrupted."));
      }
    } catch (error) {
      next(error);
    }
  });
}
