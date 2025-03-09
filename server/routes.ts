import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { createStorage } from "./storage";
import { generateFollowUpQuestions, generateActionItems, generateInsights, generateFrameworkSuggestions } from "./lib/anthropic";
import { insertReflectionSchema, insertConversationSchema, Message, IdentityFramework, FrameworkComponent, HabitTracking } from "@shared/schema";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
import multer from "multer";
import { testConnection } from "./db";
import masjidiRouter from "./masjidi-routes";
import profileRouter from "./routes/profile-routes";
import authRouter from "./routes/auth-routes";
import halaqaRouter from "./routes/halaqa-routes";
import express from "express";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import wirdRouter from "./routes/wird-routes";
import { authRequired } from "./auth";
import jwt from "jsonwebtoken";

// Import debug middleware
import { authDebugMiddleware } from "./middleware/auth-debug";

// Import the TranscriptionService
import { TranscriptionService } from './lib/transcription';

// Get current directory for ES modules (replacement for __dirname)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define JWT secret
const JWT_SECRET = process.env.JWT_SECRET || "sahabai-secret-key";

// Configure multer for in-memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB limit
  },
});

// Create a storage instance
let storage: any;

// Initialize storage right away
try {
  storage = createStorage();
  console.log('Storage initialized at routes startup');
} catch (error) {
  console.error('Failed to initialize storage at startup:', error);
}

// Add a type definition for AuthenticatedRequest
interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    name: string;
  };
}

// Add authentication logging middleware to track the user object
const authLoggingMiddleware = (req: Request, res: Response, next: NextFunction) => {
  console.log('[AUTH LOGGING] Request path:', req.path);
  console.log('[AUTH LOGGING] Initial req.user:', (req as any).user);
  
  // Store original request object for later comparison
  const originalRequest = { ...req };
  
  // Process the request
  next();
  
  // Log user object after processing (this happens in async mode, will log later)
  setTimeout(() => {
    console.log('[AUTH LOGGING] Final req.user:', (req as any).user);
    console.log('[AUTH LOGGING] User object changed:', JSON.stringify(originalRequest.user) !== JSON.stringify((req as any).user));
  }, 10);
};

// Create identity framework routes at the top level to ensure they're defined first
const identityFrameworkRoutes = (app: Express) => {
  console.log("[IDENTITY DEBUG] Setting up identity framework routes at top level");
  
  // GET individual framework by ID
  app.get('/api/identity-frameworks/:id', (req: Request, res: Response, next: NextFunction) => {
    console.log('[IDENTITY DEBUG] Intercepting GET /api/identity-frameworks/:id');
    if (req.path.startsWith('/api/identity-frameworks/')) {
      // Handle identity frameworks route directly
      const authRequired = (req: Request, res: Response, next: NextFunction) => {
        try {
          console.log('[AUTH DIRECT] Checking auth for get framework by ID');
          const authHeader = req.headers.authorization;
          if (!authHeader || !authHeader.startsWith("Bearer ")) {
            console.log('[AUTH DIRECT] No valid authorization header found');
            return res.status(401).json({ error: "Authentication required" });
          }
          
          const token = authHeader.split(" ")[1];
          console.log('[AUTH DIRECT] Token found, verifying...');
          
          // Verify token
          const decoded = jwt.verify(token, JWT_SECRET) as any;
          console.log('[AUTH DIRECT] Token verified, decoded payload:', decoded);
          
          // Add user info directly to request object
          (req as any).user = {
            id: decoded.userId
          };
          
          console.log('[AUTH DIRECT] User object attached to request:', (req as any).user);
          next();
        } catch (error) {
          console.error("[AUTH DIRECT] Authentication error:", error);
          return res.status(401).json({ error: "Invalid or expired token" });
        }
      };
      
      // Chain the auth check and the actual handler
      return authRequired(req, res, async () => {
        try {
          const userId = (req as any).user?.id;
          const frameworkId = req.params.id;
          
          console.log('[IDENTITY DIRECT] GET /api/identity-frameworks/:id handler running');
          console.log('[IDENTITY DIRECT] Framework ID:', frameworkId);
          console.log('[IDENTITY DIRECT] Auth user:', (req as any).user);
          
          if (!userId) {
            console.log('[IDENTITY DIRECT] No user ID found in request');
            return res.status(401).json({ error: "Not authenticated" });
          }
          
          if (!frameworkId) {
            console.log('[IDENTITY DIRECT] No framework ID provided');
            return res.status(400).json({ error: "Framework ID is required" });
          }
          
          // Initialize storage if it's not already
          if (!storage) {
            console.log('[IDENTITY DIRECT] Initializing storage for fetching framework');
            storage = createStorage();
          }
          
          console.log('[IDENTITY DIRECT] Fetching framework for user:', userId, 'framework ID:', frameworkId);
          const framework = await storage.getFramework(userId, frameworkId);
          
          if (!framework) {
            console.log('[IDENTITY DIRECT] Framework not found:', frameworkId);
            return res.status(404).json({ error: "Framework not found" });
          }
          
          console.log('[IDENTITY DIRECT] Framework found:', framework.id);
          return res.json({ framework });
        } catch (error) {
          console.error('[IDENTITY DIRECT] Error fetching framework:', error);
          return res.status(500).json({ error: "Failed to fetch framework" });
        }
      });
    }
    
    // If it's not our path, continue to next handler
    next();
  });
  
  // List all frameworks
  app.get('/api/identity-frameworks', (req: Request, res: Response, next: NextFunction) => {
    console.log('[IDENTITY DEBUG] Intercepting GET /api/identity-frameworks');
    if (req.path === '/api/identity-frameworks') {
      // Handle identity frameworks route directly
      const authRequired = (req: Request, res: Response, next: NextFunction) => {
        try {
          console.log('[AUTH DIRECT] Checking auth for identity frameworks');
          const authHeader = req.headers.authorization;
          if (!authHeader || !authHeader.startsWith("Bearer ")) {
            console.log('[AUTH DIRECT] No valid authorization header found');
            return res.status(401).json({ error: "Authentication required" });
          }
          
          const token = authHeader.split(" ")[1];
          console.log('[AUTH DIRECT] Token found, verifying...');
          
          // Verify token
          const decoded = jwt.verify(token, JWT_SECRET) as any;
          console.log('[AUTH DIRECT] Token verified, decoded payload:', decoded);
          
          // Add user info directly to request object
          (req as any).user = {
            id: decoded.userId
          };
          
          console.log('[AUTH DIRECT] User object attached to request:', (req as any).user);
          next();
        } catch (error) {
          console.error("[AUTH DIRECT] Authentication error:", error);
          return res.status(401).json({ error: "Invalid or expired token" });
        }
      };
      
      // Chain the auth check and the actual handler
      return authRequired(req, res, async () => {
        try {
          console.log('[IDENTITY DIRECT] GET /api/identity-frameworks handler running');
          console.log('[IDENTITY DIRECT] Auth user:', (req as any).user);
          
          // Get all frameworks for the authenticated user
          const userId = (req as any).user?.id;
          
          if (!userId) {
            console.log('[IDENTITY DIRECT] No user ID found in request');
            return res.status(401).json({ error: "Not authenticated" });
          }
          
          // Initialize storage if it's not already
          if (!storage) {
            console.log('[IDENTITY DIRECT] Initializing storage for frameworks request');
            storage = createStorage();
          }
          
          console.log('[IDENTITY DIRECT] Fetching frameworks for user:', userId);
          const frameworks = await storage.getFrameworks(userId);
          console.log('[IDENTITY DIRECT] Frameworks found:', frameworks?.length || 0);
          
          return res.json({ frameworks });
        } catch (error) {
          console.error('[IDENTITY DIRECT] Error fetching frameworks:', error);
          return res.status(500).json({ error: "Failed to fetch frameworks" });
        }
      });
    }
    
    // If it's not our exact route, continue to next handler
    next();
  });
  
  app.post('/api/identity-frameworks', (req: Request, res: Response, next: NextFunction) => {
    console.log('[IDENTITY DEBUG] Intercepting POST /api/identity-frameworks');
    if (req.path === '/api/identity-frameworks') {
      // Handle identity frameworks route directly
      const authRequired = (req: Request, res: Response, next: NextFunction) => {
        try {
          console.log('[AUTH DIRECT] Checking auth for POST identity frameworks');
          const authHeader = req.headers.authorization;
          if (!authHeader || !authHeader.startsWith("Bearer ")) {
            console.log('[AUTH DIRECT] No valid authorization header found');
            return res.status(401).json({ error: "Authentication required" });
          }
          
          const token = authHeader.split(" ")[1];
          console.log('[AUTH DIRECT] Token found, verifying...');
          
          // Verify token
          const decoded = jwt.verify(token, JWT_SECRET) as any;
          console.log('[AUTH DIRECT] Token verified, decoded payload:', decoded);
          
          // Add user info directly to request object
          (req as any).user = {
            id: decoded.userId
          };
          
          console.log('[AUTH DIRECT] User object attached to request:', (req as any).user);
          next();
        } catch (error) {
          console.error("[AUTH DIRECT] Authentication error:", error);
          return res.status(401).json({ error: "Invalid or expired token" });
        }
      };
      
      // Chain the auth check and the actual handler
      return authRequired(req, res, async () => {
        try {
          console.log('[IDENTITY DIRECT] POST /api/identity-frameworks handler running');
          console.log('[IDENTITY DIRECT] Request body:', req.body);
          console.log('[IDENTITY DIRECT] Auth user:', (req as any).user);
          
          const userId = (req as any).user?.id;
          
          if (!userId) {
            console.log('[IDENTITY DIRECT] No user ID found in request');
            return res.status(401).json({ error: "Not authenticated" });
          }
          
          const { title } = req.body;
          
          if (!title) {
            console.log('[IDENTITY DIRECT] No title provided in request');
            return res.status(400).json({ error: "Title is required" });
          }
          
          // Initialize storage if it's not already
          if (!storage) {
            console.log('[IDENTITY DIRECT] Initializing storage for framework creation');
            storage = createStorage();
          }
          
          // Create a new framework
          console.log('[IDENTITY DIRECT] Creating framework with title:', title, 'for user:', userId);
          const framework = await storage.createFramework(userId, title);
          console.log('[IDENTITY DIRECT] Framework created:', framework?.id);
          
          return res.status(201).json({ framework });
        } catch (error) {
          console.error('[IDENTITY DIRECT] Error creating framework:', error);
          return res.status(500).json({ error: "Failed to create framework" });
        }
      });
    }
    
    // If it's not our exact route, continue to next handler
    next();
  });

  // POST framework components
  app.post('/api/identity-frameworks/:id/components', (req: Request, res: Response, next: NextFunction) => {
    console.log('[IDENTITY DEBUG] Intercepting POST /api/identity-frameworks/:id/components');
    if (req.path.includes('/api/identity-frameworks/') && req.path.includes('/components')) {
      // Handle identity frameworks components route directly
      const authRequired = (req: Request, res: Response, next: NextFunction) => {
        try {
          console.log('[AUTH DIRECT] Checking auth for POST components');
          const authHeader = req.headers.authorization;
          if (!authHeader || !authHeader.startsWith("Bearer ")) {
            console.log('[AUTH DIRECT] No valid authorization header found');
            return res.status(401).json({ error: "Authentication required" });
          }
          
          const token = authHeader.split(" ")[1];
          console.log('[AUTH DIRECT] Token found, verifying...');
          
          // Verify token
          const decoded = jwt.verify(token, JWT_SECRET) as any;
          console.log('[AUTH DIRECT] Token verified, decoded payload:', decoded);
          
          // Add user info directly to request object
          (req as any).user = {
            id: decoded.userId
          };
          
          console.log('[AUTH DIRECT] User object attached to request:', (req as any).user);
          next();
        } catch (error) {
          console.error("[AUTH DIRECT] Authentication error:", error);
          return res.status(401).json({ error: "Invalid or expired token" });
        }
      };
      
      // Chain the auth check and the actual handler
      return authRequired(req, res, async () => {
        try {
          const userId = (req as any).user?.id;
          const frameworkId = req.params.id;
          
          console.log('[IDENTITY DIRECT] POST /api/identity-frameworks/:id/components handler running');
          console.log('[IDENTITY DIRECT] Framework ID:', frameworkId);
          console.log('[IDENTITY DIRECT] Request body:', req.body);
          console.log('[IDENTITY DIRECT] Auth user:', (req as any).user);
          
          if (!userId) {
            console.log('[IDENTITY DIRECT] No user ID found in request');
            return res.status(401).json({ error: "Not authenticated" });
          }
          
          if (!frameworkId) {
            console.log('[IDENTITY DIRECT] No framework ID provided');
            return res.status(400).json({ error: "Framework ID is required" });
          }
          
          const { componentType, content } = req.body;
          
          if (!componentType || !content) {
            console.log('[IDENTITY DIRECT] Missing component data');
            return res.status(400).json({ error: "Component type and content are required" });
          }
          
          // Initialize storage if it's not already
          if (!storage) {
            console.log('[IDENTITY DIRECT] Initializing storage for creating component');
            storage = createStorage();
          }
          
          // First verify the framework exists and belongs to the user
          const framework = await storage.getFramework(userId, frameworkId);
          
          if (!framework) {
            console.log('[IDENTITY DIRECT] Framework not found or does not belong to user');
            return res.status(404).json({ error: "Framework not found" });
          }
          
          console.log('[IDENTITY DIRECT] Creating component for framework:', frameworkId);
          const component = await storage.createComponent(frameworkId, componentType, content);
          console.log('[IDENTITY DIRECT] Component created:', component?.id);
          
          // Update framework completion percentage
          const validTypes = ["identity", "vision", "systems", "goals", "habits", "triggers"];
          const allComponents = await storage.getComponents(frameworkId);
          const uniqueComponents = new Set(allComponents.map((c: any) => c.componentType));
          const completionPercentage = Math.round((uniqueComponents.size / validTypes.length) * 100);
          
          await storage.updateFrameworkCompletion(userId, frameworkId, completionPercentage);
          
          return res.status(201).json({ component });
        } catch (error) {
          console.error('[IDENTITY DIRECT] Error creating component:', error);
          return res.status(500).json({ error: "Failed to create component" });
        }
      });
    }
    
    // If it's not our path, continue to next handler
    next();
  });

  // PUT framework - update title
  app.put('/api/identity-frameworks/:id', (req: Request, res: Response, next: NextFunction) => {
    console.log('[IDENTITY DEBUG] Intercepting PUT /api/identity-frameworks/:id');
    if (req.path.startsWith('/api/identity-frameworks/') && !req.path.includes('/components')) {
      // Handle identity frameworks update route directly
      const authRequired = (req: Request, res: Response, next: NextFunction) => {
        try {
          console.log('[AUTH DIRECT] Checking auth for PUT framework');
          const authHeader = req.headers.authorization;
          if (!authHeader || !authHeader.startsWith("Bearer ")) {
            console.log('[AUTH DIRECT] No valid authorization header found');
            return res.status(401).json({ error: "Authentication required" });
          }
          
          const token = authHeader.split(" ")[1];
          console.log('[AUTH DIRECT] Token found, verifying...');
          
          // Verify token
          const decoded = jwt.verify(token, JWT_SECRET) as any;
          console.log('[AUTH DIRECT] Token verified, decoded payload:', decoded);
          
          // Add user info directly to request object
          (req as any).user = {
            id: decoded.userId
          };
          
          console.log('[AUTH DIRECT] User object attached to request:', (req as any).user);
          next();
        } catch (error) {
          console.error("[AUTH DIRECT] Authentication error:", error);
          return res.status(401).json({ error: "Invalid or expired token" });
        }
      };
      
      // Chain the auth check and the actual handler
      return authRequired(req, res, async () => {
        try {
          const userId = (req as any).user?.id;
          const frameworkId = req.params.id;
          
          console.log('[IDENTITY DIRECT] PUT /api/identity-frameworks/:id handler running');
          console.log('[IDENTITY DIRECT] Framework ID:', frameworkId);
          console.log('[IDENTITY DIRECT] Request body:', req.body);
          console.log('[IDENTITY DIRECT] Auth user:', (req as any).user);
          
          if (!userId) {
            console.log('[IDENTITY DIRECT] No user ID found in request');
            return res.status(401).json({ error: "Not authenticated" });
          }
          
          if (!frameworkId) {
            console.log('[IDENTITY DIRECT] No framework ID provided');
            return res.status(400).json({ error: "Framework ID is required" });
          }
          
          const { title } = req.body;
          
          if (!title) {
            console.log('[IDENTITY DIRECT] No title provided');
            return res.status(400).json({ error: "Title is required" });
          }
          
          // Initialize storage if it's not already
          if (!storage) {
            console.log('[IDENTITY DIRECT] Initializing storage for updating framework');
            storage = createStorage();
          }
          
          // First verify the framework exists and belongs to the user
          const existingFramework = await storage.getFramework(userId, frameworkId);
          
          if (!existingFramework) {
            console.log('[IDENTITY DIRECT] Framework not found or does not belong to user');
            return res.status(404).json({ error: "Framework not found" });
          }
          
          console.log('[IDENTITY DIRECT] Updating framework title:', frameworkId);
          const framework = await storage.updateFramework(userId, frameworkId, title);
          console.log('[IDENTITY DIRECT] Framework updated:', framework?.id);
          
          return res.json({ framework });
        } catch (error) {
          console.error('[IDENTITY DIRECT] Error updating framework:', error);
          return res.status(500).json({ error: "Failed to update framework" });
        }
      });
    }
    
    // If it's not our path, continue to next handler
    next();
  });
};

// Add the suggestion cache as a module-level variable at the top of the file after imports
// Simple in-memory cache for suggestions
const suggestionCache = new Map<string, any>();

// Initialize the transcription service
const transcriptionService = new TranscriptionService();

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  
  // CRITICAL: Register identity framework routes FIRST, before anything else
  console.log("[IDENTITY DEBUG] Registering identity framework routes as first priority");
  identityFrameworkRoutes(app);
  
  // Create middleware directory if it doesn't exist
  const middlewareDir = path.join(__dirname, 'middleware');
  if (!fs.existsSync(middlewareDir)) {
    fs.mkdirSync(middlewareDir, { recursive: true });
  }
  
  // Apply auth debug middleware to all requests
  app.use(authDebugMiddleware);

  // Health check endpoint for Railway
  app.get("/health", async (req: Request, res: Response) => {
    const healthCheck = {
      uptime: process.uptime(),
      message: 'OK',
      timestamp: Date.now(),
      dbStatus: 'not_applicable'
    };

    // Check database connection if configured
    if (process.env.DATABASE_URL) {
      try {
        const isConnected = await testConnection();
        healthCheck.dbStatus = isConnected ? 'connected' : 'error';
      } catch (error) {
        healthCheck.dbStatus = 'error';
      }
    }

    res.status(200).json(healthCheck);
  });

  // Mount the Masjidi API routes
  app.use("/api", masjidiRouter);
  
  // Mount the Profile API routes
  app.use("/api", profileRouter);
  
  // Mount the Auth routes
  app.use("/auth", authRouter);

  // CRITICAL FIX: We need to create a middleware to prevent halaqaRouter from handling identity-frameworks routes
  const blockIdentityFrameworksRoutes = (req: Request, res: Response, next: NextFunction) => {
    if (req.path.includes('/identity-frameworks')) {
      console.log("[ROUTE DEBUG] Blocking halaqaRouter from handling identity-frameworks path:", req.path);
      return res.status(404).send('Not found - This endpoint should be handled by identity-frameworks routes');
    }
    next();
  };

  // DEBUG: Add this log to check correct route registration
  console.log("[ROUTE DEBUG] Registering identity framework routes");

  // IMPORTANT: Identity Framework Routes MUST be registered before halaqaRouter
  // Mount the Halaqa API routes - AFTER identity framework routes, with blocking middleware
  app.use("/api", blockIdentityFrameworksRoutes, halaqaRouter);

  // Mount the Wird API routes
  app.use("/api/wirds", wirdRouter);

  app.post("/api/reflection", authRequired, async (req: Request, res: Response) => {
    try {
      console.log("\n\n🚨🚨🚨 EXPRESS HANDLER: Request received at /api/reflection 🚨🚨🚨");
      console.log("Request headers:", req.headers);
      console.log("Request body:", req.body);
      console.log("Has personalizationContext:", !!req.body.personalizationContext);
      if (req.body.personalizationContext) {
        console.log("personalizationContext keys:", Object.keys(req.body.personalizationContext));
      }
      
      console.log("Reflection request body:", {
        type: req.body.type,
        contentLength: req.body.content?.length,
        hasTranscription: !!req.body.transcription
      });

      const data = insertReflectionSchema.parse(req.body);
      console.log("Parsed reflection data successfully");

      // Validate base64 for audio
      if (data.type === "audio") {
        if (!data.content.startsWith('data:')) {
          return res.status(400).json({
            error: "Invalid audio data format. Expected base64 data URL."
          });
        }

        try {
          console.log("Starting audio transcription...");
          const transcription = await transcriptionService.transcribeAudio(
            Buffer.from(data.content.split(',')[1], 'base64'),
            data.type.split('/')[1]
          );
          if (!transcription || transcription.trim().length === 0) {
            return res.status(400).json({
              error: "No speech detected in the audio. Please try again and speak clearly."
            });
          }
          data.transcription = transcription;
          console.log("Transcribed audio successfully:", transcription);
        } catch (error) {
          console.error("Error transcribing audio:", error);
          return res.status(500).json({
            error: "Failed to transcribe audio. Please ensure you have a clear recording and try again."
          });
        }
      }

      const reflection = await storage.createReflection(data);
      console.log("Created reflection:", reflection.id);

      // Default questions in case API fails
      let questions: string[] = ["How would you like to expand on your reflection?"];
      let understanding = "Thank you for sharing your reflection.";
      
      try {
        // Use transcription for audio reflections
        const content = data.type === "audio" ? data.transcription! : data.content;
        
        // Pass the personalizationContext to the generateFollowUpQuestions function
        const generatedResponse = await generateFollowUpQuestions(
          content, 
          undefined, // No previous messages
          req.body.personalizationContext // Pass personalization context
        );
        
        if (generatedResponse && generatedResponse.questions && generatedResponse.questions.length > 0) {
          questions = generatedResponse.questions;
          understanding = generatedResponse.understanding;
          console.log("Generated questions:", questions);
        } else {
          console.warn("Empty questions array returned, using default");
        }
      } catch (error) {
        console.error("Error generating questions:", error);
        // Don't fail the whole request if question generation fails
        questions = ["How would you like to expand on your reflection?"];
      }

      const conversation = await storage.createConversation({
        reflectionId: reflection.id,
        messages: [
          { 
            role: "user", 
            content: data.type === "audio" ? data.transcription! : data.content 
          },
          { 
            role: "assistant", 
            content: JSON.stringify({
              understanding: understanding,
              questions: questions
            })
          },
        ],
        actionItems: [],
      });
      console.log("Created conversation:", conversation.id);

      res.json({ 
        reflection, 
        conversation, 
        understanding,
        questions 
      });
    } catch (error) {
      console.error("Error in /api/reflection:", error);
      if (error instanceof ZodError) {
        return res.status(400).json({ 
          error: fromZodError(error).message 
        });
      }
      return res.status(error instanceof Error && error.message.includes("400") ? 400 : 500).json({ 
        error: error instanceof Error ? error.message : "Failed to save reflection" 
      });
    }
  });

  app.post("/api/conversation/:id/respond", async (req: Request, res: Response) => {
    try {
      const conversationId = parseInt(req.params.id);
      if (isNaN(conversationId)) {
        return res.status(400).json({ error: "Invalid conversation ID" });
      }
      
      const { content } = req.body;

      if (!content || typeof content !== 'string') {
        return res.status(400).json({ error: "Content is required and must be a string" });
      }

      const conversation = await storage.getConversation(conversationId);
      if (!conversation) {
        return res.status(404).json({ error: "Conversation not found" });
      }

      const messages = [...conversation.messages, { role: "user" as const, content }];
      
      // Default questions in case API fails
      let questions: string[] = [
        "How would you like to expand on your reflection?",
        "What aspects of your spiritual journey would you like to explore further?",
        "Is there anything specific from today that you'd like to reflect on more deeply?"
      ];
      let understanding = "Thank you for sharing your thoughts.";

      try {
        // Get all previous user messages for context
        const previousMessages = conversation.messages
          .map((msg: Message) => `${msg.role}: ${msg.content}`)
          .filter((msg: string) => !msg.includes('{"understanding":')); // Filter out the response objects

        const generatedResponse = await generateFollowUpQuestions(content, previousMessages);
        if (generatedResponse && generatedResponse.questions && generatedResponse.questions.length > 0) {
          questions = generatedResponse.questions;
          understanding = generatedResponse.understanding;
          console.log("Generated follow-up questions:", questions);
        } else {
          console.warn("Empty questions array returned from API, using fallback questions");
        }
      } catch (error) {
        console.error("Error generating follow-up questions:", error);
        // Continue with default questions instead of failing the request
        console.log("Using fallback questions due to API error");
      }

      // Add messages to the conversation
      messages.push({ 
        role: "assistant" as const, 
        content: JSON.stringify({
          understanding: understanding,
          questions: questions
        })
      });

      try {
        const updatedConversation = await storage.updateConversation(
          conversationId,
          messages
        );
        
        res.json({ conversation: updatedConversation, questions });
      } catch (storageError) {
        console.error("Error updating conversation in storage:", storageError);
        return res.status(500).json({ 
          error: "Failed to save your response, but here are some follow-up questions",
          questions: questions
        });
      }
    } catch (error) {
      console.error("Error in /api/conversation/respond:", error);
      return res.status(error instanceof Error && error.message.includes("404") ? 404 : 500).json({ 
        error: error instanceof Error ? error.message : "Failed to save response" 
      });
    }
  });

  app.post("/api/conversation/:id/action-items", async (req: Request, res: Response) => {
    try {
      const conversationId = parseInt(req.params.id);
      if (isNaN(conversationId)) {
        return res.status(400).json({ error: "Invalid conversation ID" });
      }
      
      const conversation = await storage.getConversation(conversationId);

      if (!conversation) {
        return res.status(404).json({ error: "Conversation not found" });
      }

      const conversationText = conversation.messages
        .map((msg: Message) => `${msg.role}: ${msg.content}`)
        .join("\n");

      // Default action items in case API fails
      let actionItems: string[] = [
        "Reflect on your spiritual journey each day", 
        "Increase your Quran recitation", 
        "Engage in more dhikr (remembrance of Allah)"
      ];
      
      try {
        const generatedItems = await generateActionItems(conversationText);
        if (generatedItems && generatedItems.length > 0) {
          actionItems = generatedItems;
        } else {
          console.warn("Empty action items array returned from API, using fallback items");
        }
      } catch (error) {
        console.error("Error generating action items:", error);
        // Continue with default action items instead of failing the request
        console.log("Using fallback action items due to API error");
      }

      try {
        const updatedConversation = await storage.updateConversation(
          conversationId,
          conversation.messages,
          actionItems
        );
        
        res.json({ conversation: updatedConversation, actionItems });
      } catch (storageError) {
        console.error("Error updating conversation in storage:", storageError);
        return res.status(500).json({ 
          error: "Failed to save action items to conversation",
          actionItems: actionItems
        });
      }
    } catch (error) {
      console.error("Error in /api/conversation/action-items:", error);
      return res.status(error instanceof Error && error.message.includes("404") ? 404 : 500).json({ 
        error: error instanceof Error ? error.message : "Failed to generate action items" 
      });
    }
  });

  app.post("/api/conversation/:id/insights", async (req: Request, res: Response) => {
    // Always set JSON content type
    res.setHeader('Content-Type', 'application/json');
    
    try {
      console.log("[EXPRESS INSIGHTS API] Processing request for conversation ID:", req.params.id);
      
      const conversationId = parseInt(req.params.id);
      if (isNaN(conversationId)) {
        console.error("[EXPRESS INSIGHTS API] Invalid conversation ID:", req.params.id);
        return res.status(400).json({ 
          error: "Invalid conversation ID",
          success: false
        });
      }
      
      const conversation = await storage.getConversation(conversationId);

      if (!conversation) {
        console.error("[EXPRESS INSIGHTS API] Conversation not found:", conversationId);
        return res.status(404).json({ 
          error: "Conversation not found",
          success: false
        });
      }

      console.log("[EXPRESS INSIGHTS API] Conversation found, messages count:", conversation.messages.length);
      
      const conversationText = conversation.messages
        .map((msg: Message) => `${msg.role}: ${msg.content}`)
        .join("\n");

      // Get custom prompt from request body if provided
      const customPrompt = req.body?.prompt;
      if (customPrompt) {
        console.log("[EXPRESS INSIGHTS API] Using custom prompt");
      }

      // Default insights in case API fails
      let insights: string[] = [
        "Your journey of self-reflection demonstrates a sincere desire to grow spiritually, as emphasized in Surah Al-Ra'd (13:11): 'Indeed, Allah will not change the condition of a people until they change what is in themselves.'", 
        "Your consistent practice of contemplation aligns with the Prophet's ﷺ emphasis on self-accounting, as he said: 'The wise person is one who takes account of himself and works for what comes after death.' (Tirmidhi)", 
        "Each step of your spiritual journey reflects the concept of ihsan mentioned in the famous hadith of Jibril, where the Prophet ﷺ described it as 'worshiping Allah as if you see Him, for though you do not see Him, He surely sees you.' (Bukhari & Muslim)"
      ];
      
      let usedFallback = false;
      
      try {
        console.log("[EXPRESS INSIGHTS API] Calling generateInsights function");
        const generatedInsights = await generateInsights(conversationText, customPrompt);
        if (generatedInsights && generatedInsights.length > 0) {
          console.log("[EXPRESS INSIGHTS API] Successfully generated insights:", generatedInsights.length);
          insights = generatedInsights;
        } else {
          console.warn("[EXPRESS INSIGHTS API] Empty insights array returned from API, using fallback insights");
          usedFallback = true;
        }
      } catch (error) {
        console.error("[EXPRESS INSIGHTS API] Error generating insights:", error);
        // Continue with default insights instead of failing the request
        console.log("[EXPRESS INSIGHTS API] Using fallback insights due to API error");
        usedFallback = true;
      }

      // For now, we don't save insights to the conversation storage
      // This keeps the implementation simpler and storage schema unchanged
      
      res.json({ 
        insights,
        success: true,
        fallback: usedFallback
      });
    } catch (error) {
      console.error("[EXPRESS INSIGHTS API] Unhandled error:", error);
      res.status(500).json({ 
        error: "Failed to generate insights",
        details: error instanceof Error ? error.message : String(error),
        success: false
      });
    }
  });

  // Make sure the /message endpoint also works as a symlink to /respond for backward compatibility
  app.post("/api/conversation/:id/message", async (req: Request, res: Response) => {
    try {
      // Forward the request to the /respond endpoint handler
      const conversationId = parseInt(req.params.id);
      if (isNaN(conversationId)) {
        return res.status(400).json({ error: "Invalid conversation ID" });
      }
      
      const { content } = req.body;
      if (!content || typeof content !== 'string') {
        return res.status(400).json({ error: "Content is required and must be a string" });
      }

      const conversation = await storage.getConversation(conversationId);
      if (!conversation) {
        return res.status(404).json({ error: "Conversation not found" });
      }

      const messages = [...conversation.messages, { role: "user" as const, content }];
      
      // Default questions in case API fails
      let questions: string[] = [
        "How would you like to expand on your reflection?",
        "What aspects of your spiritual journey would you like to explore further?",
        "Is there anything specific from today that you'd like to reflect on more deeply?"
      ];
      let understanding = "Thank you for sharing your thoughts.";

      try {
        // Get all previous user messages for context
        const previousMessages = conversation.messages
          .map((msg: Message) => `${msg.role}: ${msg.content}`)
          .filter((msg: string) => !msg.includes('{"understanding":')); // Filter out the response objects

        const generatedResponse = await generateFollowUpQuestions(content, previousMessages);
        if (generatedResponse && generatedResponse.questions && generatedResponse.questions.length > 0) {
          questions = generatedResponse.questions;
          understanding = generatedResponse.understanding;
          console.log("Generated follow-up questions:", questions);
        } else {
          console.warn("Empty questions array returned from API, using fallback questions");
        }
      } catch (error) {
        console.error("Error generating follow-up questions:", error);
        // Continue with default questions
      }

      // Add messages to the conversation
      messages.push({ 
        role: "assistant" as const, 
        content: JSON.stringify({
          understanding: understanding,
          questions: questions
        })
      });

      const updatedConversation = await storage.updateConversation(
        conversationId,
        messages
      );

      res.json({ conversation: updatedConversation, questions });
    } catch (error) {
      console.error("Error in /api/conversation/message:", error);
      return res.status(error instanceof Error && error.message.includes("404") ? 404 : 500).json({ 
        error: error instanceof Error ? error.message : "Failed to save response" 
      });
    }
  });

  // Update the audio transcription route
  app.post('/api/reflection/audio', upload.single('audio'), async (req, res) => {
    console.log('Received audio transcription request');
    
    if (!req.file) {
      console.error('No audio file provided in request');
      return res.status(400).json({ error: 'No audio file provided' });
    }

    console.log('Audio file details:', {
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      fieldname: req.file.fieldname
    });

    try {
      // Extract format from mimetype instead of filename
      const fileExtension = req.file.mimetype.split('/')[1];
      console.log('Processing audio file with extension:', fileExtension);

      const transcriptionService = new TranscriptionService();
      console.log('Starting transcription service...');

      const transcription = await transcriptionService.transcribeAudio(
        req.file.buffer,
        fileExtension
      );

      console.log('Transcription completed successfully:', {
        length: transcription.length,
        preview: transcription.substring(0, 100) + '...'
      });

      return res.json({ transcription });
    } catch (error: any) {
      console.error('Error in audio transcription:', error);
      console.error('Stack trace:', error.stack);
      return res.status(500).json({ 
        error: `Transcription failed: ${error.message}`,
        details: error.stack
      });
    }
  });

  // Identity Framework Routes
  app.get('/api/identity-frameworks/:id', authRequired, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.id;
      const frameworkId = req.params.id;
      
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      // Get the framework and ensure it belongs to the user
      const framework = await storage.getFramework(userId, frameworkId);
      
      if (!framework) {
        return res.status(404).json({ error: "Framework not found" });
      }
      
      // Get all components for this framework
      const components = await storage.getComponents(frameworkId);
      
      // Get habit tracking data if any habits exist
      const habitsComponent = components.find((c: FrameworkComponent) => c.componentType === 'habits');
      let habitTracking = [];
      
      if (habitsComponent) {
        habitTracking = await storage.getHabitTracking(habitsComponent.id);
      }
      
      return res.json({ 
        framework: {
          ...framework,
          components,
          habitTracking
        } 
      });
    } catch (error) {
      console.error('Error fetching framework:', error);
      return res.status(500).json({ error: "Failed to fetch framework" });
    }
  });

  app.put('/api/identity-frameworks/:id', authRequired, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.id;
      const frameworkId = req.params.id;
      
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      const { title } = req.body;
      
      if (!title) {
        return res.status(400).json({ error: "Title is required" });
      }
      
      // Check if framework exists and belongs to user
      const framework = await storage.getFramework(userId, frameworkId);
      
      if (!framework) {
        return res.status(404).json({ error: "Framework not found" });
      }
      
      // Update the framework
      const updatedFramework = await storage.updateFramework(userId, frameworkId, title);
      
      return res.json({ framework: updatedFramework });
    } catch (error) {
      console.error('Error updating framework:', error);
      return res.status(500).json({ error: "Failed to update framework" });
    }
  });

  app.delete('/api/identity-frameworks/:id', authRequired, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.id;
      const frameworkId = req.params.id;
      
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      // Check if framework exists and belongs to user
      const framework = await storage.getFramework(userId, frameworkId);
      
      if (!framework) {
        return res.status(404).json({ error: "Framework not found" });
      }
      
      // Delete the framework (cascade will delete components and tracking)
      await storage.deleteFramework(userId, frameworkId);
      
      return res.json({ success: true });
    } catch (error) {
      console.error('Error deleting framework:', error);
      return res.status(500).json({ error: "Failed to delete framework" });
    }
  });

  // Framework Component Routes
  app.post('/api/identity-frameworks/:id/components', authRequired, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.id;
      const frameworkId = req.params.id;
      
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      const { componentType, content } = req.body;
      
      if (!componentType || !content) {
        return res.status(400).json({ error: "Component type and content are required" });
      }
      
      // Validate component type
      const validTypes = ['identity', 'vision', 'systems', 'goals', 'habits', 'triggers'];
      if (!validTypes.includes(componentType)) {
        return res.status(400).json({ error: "Invalid component type" });
      }
      
      // Check if framework exists and belongs to user
      const framework = await storage.getFramework(userId, frameworkId);
      
      if (!framework) {
        return res.status(404).json({ error: "Framework not found" });
      }
      
      if (framework.userId !== userId) {
        return res.status(403).json({ error: "Not authorized to update this framework" });
      }
      
      // Check if component already exists for this type
      const component = await storage.getComponent(frameworkId, componentType);
      
      let updatedComponent;
      
      if (component) {
        // Update existing component
        updatedComponent = await storage.updateComponent(frameworkId, componentType, content);
      } else {
        // Create new component
        updatedComponent = await storage.createComponent(frameworkId, componentType, content);
      }
      
      // Handle habit tracking if this is a habits component
      if (componentType === 'habits' && content.habits && Array.isArray(content.habits)) {
        // Delete existing tracking for habits that might have been removed
        await storage.deleteHabitTracking(updatedComponent.id);
        
        // Create tracking entries for each habit
        const habitTrackingValues = content.habits.map((_: any, index: number) => ({
          componentId: updatedComponent.id,
          habitIndex: index,
          currentStreak: 0,
          longestStreak: 0
        }));
        
        if (habitTrackingValues.length > 0) {
          await storage.createHabitTracking(habitTrackingValues);
        }
      }
      
      // Update completion percentage
      const allComponents = await storage.getComponents(frameworkId);
      
      const uniqueComponents = new Set(allComponents.map(c => c.componentType));
      const completionPercentage = Math.round((uniqueComponents.size / validTypes.length) * 100);
      
      await storage.updateFrameworkCompletion(userId, frameworkId, completionPercentage);
      
      return res.json({ component, completionPercentage });
    } catch (error) {
      console.error('Error creating/updating component:', error);
      return res.status(500).json({ error: "Failed to create/update component" });
    }
  });

  // Habit Tracking Routes
  app.post('/api/habit-tracking/:habitId/complete', authRequired, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.id;
      const habitId = req.params.habitId;
      
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      // Get the habit tracking and verify ownership through the framework
      const tracking = await storage.getHabitTracking(habitId);
      
      if (!tracking) {
        return res.status(404).json({ error: "Habit tracking not found" });
      }
      
      // Get the component to check framework
      const component = await storage.getComponent(tracking.componentId);
      
      if (!component) {
        return res.status(404).json({ error: "Component not found" });
      }
      
      // Check if the framework belongs to the user
      const framework = await storage.getFramework(userId, component.frameworkId);
      
      if (!framework || framework.userId !== userId) {
        return res.status(403).json({ error: "Not authorized to update this habit" });
      }
      
      // Calculate streak
      const now = new Date();
      let currentStreak = tracking.currentStreak;
      let longestStreak = tracking.longestStreak;
      
      // If there's a last completed date
      if (tracking.lastCompleted) {
        const lastDate = new Date(tracking.lastCompleted);
        const dayDiff = Math.floor((now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (dayDiff <= 1) {
          // Same day or consecutive day, increment streak
          currentStreak += 1;
        } else {
          // Streak broken
          currentStreak = 1;
        }
      } else {
        // First completion
        currentStreak = 1;
      }
      
      // Update longest streak if needed
      if (currentStreak > longestStreak) {
        longestStreak = currentStreak;
      }
      
      // Update the tracking
      const updatedTracking = await storage.updateHabitTracking(habitId, currentStreak, longestStreak, now);
      
      return res.json({ tracking: updatedTracking });
    } catch (error) {
      console.error('Error updating habit tracking:', error);
      return res.status(500).json({ error: "Failed to update habit tracking" });
    }
  });

  // AI Guidance Routes for Framework Building
  app.post('/api/framework-guidance', authRequired, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { input, componentType, previousComponents, regenerate = false } = req.body;
      const userId = req.user?.id;
      
      console.log(`[FRAMEWORK GUIDANCE] Request for ${componentType} guidance based on "${input}"`);
      console.log(`[FRAMEWORK GUIDANCE] User ID: ${userId}, Regenerate: ${regenerate}`);
      
      if (!input || !componentType) {
        console.log('[FRAMEWORK GUIDANCE] Missing input or componentType');
        return res.status(400).json({ error: "Input and component type are required" });
      }
      
      // Validate component type
      const validTypes = ['identity', 'vision', 'systems', 'goals', 'habits', 'triggers'];
      if (!validTypes.includes(componentType)) {
        console.log(`[FRAMEWORK GUIDANCE] Invalid component type: ${componentType}`);
        return res.status(400).json({ error: "Invalid component type" });
      }
      
      // Create a cache key based on user ID, input, and component type
      const cacheKey = `${userId}:${input}:${componentType}`;
      
      // Check if we have cached guidance and the request doesn't ask to regenerate
      let guidance = !regenerate ? suggestionCache.get(cacheKey) : null;
      
      if (guidance) {
        console.log(`[FRAMEWORK GUIDANCE] Using cached guidance for ${componentType}`);
      } else {
        console.log(`[FRAMEWORK GUIDANCE] Generating new guidance for ${componentType}`);
        
        // Generate guidance using Claude
        guidance = await generateFrameworkSuggestions(input, componentType, previousComponents);
        
        // Cache the guidance for future use (1 hour expiration)
        suggestionCache.set(cacheKey, guidance);
        setTimeout(() => {
          suggestionCache.delete(cacheKey);
        }, 3600000); // 1 hour in milliseconds
        
        console.log(`[FRAMEWORK GUIDANCE] Generated and cached new guidance for ${componentType}`);
      }
      
      return res.json({ guidance });
    } catch (error) {
      console.error('[FRAMEWORK GUIDANCE] Error generating guidance:', error);
      return res.status(500).json({ error: "Failed to generate guidance" });
    }
  });

  return httpServer;
}