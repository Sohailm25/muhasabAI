import express, { Request, Response } from "express";
import * as storage from "../storage.js";
import { Halaqa, HalaqaActionItem } from "@shared/schema";
import { generateHalaqaActions, generateHalaqaApplicationSuggestions, generateHalaqaWirdSuggestions, generateHalaqaInsights } from "../lib/anthropic.js";
import { z } from "zod";
import { v4 } from "uuid";
import { createLogger } from "../lib/logger.js";
import { authRequired } from "../auth.js";

// Define the extended Request type that includes user property
interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    [key: string]: any;
  };
}

const router = express.Router();
const logger = createLogger("halaqaRoutes");

// Add a middleware to log all requests to this router
router.use((req, res, next) => {
  console.log(`🟢 [HALAQA ROUTES] Request received: ${req.method} ${req.baseUrl}${req.path}`);
  console.log(`🟢 [HALAQA ROUTES] Request params:`, req.params);
  console.log(`🟢 [HALAQA ROUTES] Request query:`, req.query);
  next();
});

// GET /api/halaqas - Get all halaqas
router.get("/", async (req, res) => {
  try {
    const halaqas = await storage.getHalaqas();
    res.json(halaqas);
  } catch (error) {
    console.error("Error fetching halaqas:", error);
    res.status(500).json({ error: "Failed to fetch halaqas" });
  }
});

// GET /api/halaqas/user/:userId - Get halaqas for a specific user
// This route must come BEFORE the /:id route to avoid conflict
router.get("/user/:userId", async (req, res) => {
  try {
    const userId = req.params.userId;
    
    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }
    
    // Get halaqas for the user
    const halaqas = await storage.getHalaqasByUserId(userId);
    
    res.json(halaqas);
  } catch (error) {
    console.error("Error fetching halaqas by user ID:", error);
    res.status(500).json({ error: "Failed to fetch user halaqas" });
  }
});

// GET /api/halaqas/:id - Get a specific halaqa
router.get("/:id", async (req, res) => {
  try {
    const id = req.params.id;
    
    // Validate ID is a number
    const halaqaId = parseInt(id);
    if (isNaN(halaqaId)) {
      logger.warn(`Invalid halaqa ID format requested: ${id}`);
      return res.status(400).json({ error: "Invalid halaqa ID format" });
    }
    
    // Log the ID being requested
    logger.info(`Getting halaqa with ID: ${halaqaId}`);
    
    try {
      const halaqa = await storage.getHalaqa(halaqaId);
      
      // DEBUG: Log whether halaqa was found
      logger.info(`Halaqa ${halaqaId} found: ${halaqa ? true : false}`);
      
      // Explicitly check for null or undefined
      if (!halaqa) {
        logger.warn(`Halaqa not found with ID: ${halaqaId}`);
        return res.status(404).json({ error: "Halaqa not found" });
      }
      
      // Ensure we have a valid halaqa object to return
      if (!halaqa.id || !halaqa.userId) {
        logger.error(`Invalid halaqa data returned for ID: ${halaqaId}`);
        return res.status(500).json({ error: "Invalid halaqa data" });
      }
      
      // Log success and return the halaqa
      logger.info(`Successfully retrieved halaqa ${halaqaId}`);
      return res.json(halaqa);
    } catch (storageError) {
      logger.error(`Storage error when fetching halaqa ${halaqaId}:`, storageError);
      return res.status(500).json({ error: "Failed to fetch halaqa from storage" });
    }
  } catch (error) {
    logger.error("Unexpected error fetching halaqa:", error);
    return res.status(500).json({ error: "Failed to fetch halaqa" });
  }
});

// Create a new halaqa schema
const createHalaqaSchema = z.object({
  userId: z.string(),
  title: z.string().min(3),
  speaker: z.string().optional(),
  date: z.string().or(z.date()).transform(val => 
    typeof val === 'string' ? new Date(val) : val
  ),
  topic: z.string().min(1),
  keyReflection: z.string().min(10),
  impact: z.string().min(10),
});

// POST /api/halaqas - Create a new halaqa
router.post("/", async (req, res) => {
  try {
    // If date is a string, convert it to Date
    if (req.body.date && typeof req.body.date === 'string') {
      req.body.date = new Date(req.body.date);
    }
    
    // Validate request body
    const result = createHalaqaSchema.safeParse(req.body);
    
    if (!result.success) {
      return res.status(400).json({ 
        error: "Invalid halaqa data", 
        details: result.error.format() 
      });
    }
    
    const halaqaData = result.data;
    
    // DEBUG: Log data before creation
    console.log("Creating halaqa with data:", halaqaData);
    
    // Create the halaqa
    const newHalaqa = await storage.createHalaqa({
      ...halaqaData,
      date: halaqaData.date.toISOString(),
      actionItems: null,
      isArchived: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    
    // DEBUG: Log the created halaqa
    console.log("Created new halaqa:", newHalaqa);
    
    res.status(201).json(newHalaqa);
  } catch (error) {
    console.error("Error creating halaqa:", error);
    res.status(500).json({ error: "Failed to create halaqa" });
  }
});

// Update halaqa schema
const updateHalaqaSchema = z.object({
  title: z.string().min(3),
  speaker: z.string().optional(),
  date: z.string().or(z.date()).transform(val => 
    typeof val === 'string' ? new Date(val) : val
  ),
  topic: z.string().min(1),
  keyReflection: z.string().min(10),
  impact: z.string().min(10),
});

// PUT /api/halaqas/:id - Update a halaqa
router.put("/:id", async (req, res) => {
  try {
    const id = req.params.id;
    
    // Validate ID is a number
    const halaqaId = parseInt(id);
    if (isNaN(halaqaId)) {
      return res.status(400).json({ error: "Invalid halaqa ID format" });
    }
    
    // Validate request body
    const result = updateHalaqaSchema.safeParse(req.body);
    
    if (!result.success) {
      return res.status(400).json({ 
        error: "Invalid halaqa data", 
        details: result.error.format() 
      });
    }
    
    const halaqaData = result.data;
    
    // Check if halaqa exists
    const existingHalaqa = await storage.getHalaqa(halaqaId);
    
    if (!existingHalaqa) {
      return res.status(404).json({ error: "Halaqa not found" });
    }
    
    // Update the halaqa
    const updatedHalaqa = await storage.updateHalaqa(halaqaId, {
      ...existingHalaqa,
      ...halaqaData,
      updatedAt: new Date(),
    });
    
    res.json(updatedHalaqa);
  } catch (error) {
    console.error("Error updating halaqa:", error);
    res.status(500).json({ error: "Failed to update halaqa" });
  }
});

// DELETE /api/halaqas/:id - Archive a halaqa
router.delete("/:id", async (req, res) => {
  try {
    const id = req.params.id;
    
    // Validate ID is a number
    const halaqaId = parseInt(id);
    if (isNaN(halaqaId)) {
      return res.status(400).json({ error: "Invalid halaqa ID format" });
    }
    
    // Check if halaqa exists
    const existingHalaqa = await storage.getHalaqa(halaqaId);
    
    if (!existingHalaqa) {
      return res.status(404).json({ error: "Halaqa not found" });
    }
    
    // Archive the halaqa
    const updatedHalaqa = await storage.updateHalaqa(halaqaId, {
      ...existingHalaqa,
      isArchived: true,
      updatedAt: new Date(),
    });
    
    res.json({ success: true, message: "Halaqa archived successfully" });
  } catch (error) {
    console.error("Error archiving halaqa:", error);
    res.status(500).json({ error: "Failed to archive halaqa" });
  }
});

// POST /api/halaqas/:id/actions - Generate action items
router.post("/:id/actions", authRequired, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = req.params.id;
    
    // Validate ID is a number
    const halaqaId = parseInt(id);
    if (isNaN(halaqaId)) {
      return res.status(400).json({ error: "Invalid halaqa ID format" });
    }
    
    const halaqa = await storage.getHalaqa(halaqaId);
    
    if (!halaqa) {
      return res.status(404).json({ error: "Halaqa not found" });
    }
    
    // Generate action items based on reflection
    const actionItems = await generateHalaqaActions(halaqa.keyReflection, halaqa.impact);
    
    // Ensure each item has a valid ID
    const actionItemsWithIds: HalaqaActionItem[] = actionItems.map(item => ({
      id: v4(),
      description: item.description,
      completed: false
    }));
    
    const updatedHalaqa = await storage.updateHalaqaActionItems(halaqaId, actionItemsWithIds);
    res.json(updatedHalaqa);
  } catch (error) {
    console.error("Error generating action items:", error);
    res.status(500).json({ error: "Failed to generate action items" });
  }
});

// Update action item schema
const updateActionItemSchema = z.object({
  id: z.string(),
  description: z.string().min(3),
  completed: z.boolean(),
});

// PUT /api/halaqas/:id/actions/:actionId - Update an action item
router.put("/:id/actions/:actionId", async (req, res) => {
  try {
    const { id, actionId } = req.params;
    
    // Validate IDs
    const halaqaId = parseInt(id);
    if (isNaN(halaqaId)) {
      return res.status(400).json({ error: "Invalid halaqa ID format" });
    }
    
    // Validate request body
    const result = updateActionItemSchema.safeParse(req.body);
    
    if (!result.success) {
      return res.status(400).json({ 
        error: "Invalid action item data", 
        details: result.error.format() 
      });
    }
    
    const actionItemData = result.data;
    
    // Check if halaqa exists
    const halaqa = await storage.getHalaqa(halaqaId);
    
    if (!halaqa) {
      return res.status(404).json({ error: "Halaqa not found" });
    }
    
    if (!halaqa.actionItems || halaqa.actionItems.length === 0) {
      return res.status(404).json({ error: "No action items found for this halaqa" });
    }
    
    // Find and update the specific action item
    const updatedActionItems = halaqa.actionItems.map(item => 
      item.id === actionId ? { ...item, ...actionItemData } : item
    );
    
    const updatedHalaqa = await storage.updateHalaqaActionItems(halaqaId, updatedActionItems);
    res.json(updatedHalaqa);
  } catch (error) {
    console.error("Error updating action item:", error);
    res.status(500).json({ error: "Failed to update action item" });
  }
});

// DELETE /api/halaqas/:id/actions/:actionId - Delete an action item
router.delete("/:id/actions/:actionId", async (req, res) => {
  try {
    const { id, actionId } = req.params;
    
    // Validate IDs
    const halaqaId = parseInt(id);
    if (isNaN(halaqaId)) {
      return res.status(400).json({ error: "Invalid halaqa ID format" });
    }
    
    // Check if halaqa exists
    const halaqa = await storage.getHalaqa(halaqaId);
    
    if (!halaqa) {
      return res.status(404).json({ error: "Halaqa not found" });
    }
    
    if (!halaqa.actionItems || halaqa.actionItems.length === 0) {
      return res.status(404).json({ error: "No action items found for this halaqa" });
    }
    
    // Remove the specific action item
    const updatedActionItems = halaqa.actionItems.filter(item => item.id !== actionId);
    
    const updatedHalaqa = await storage.updateHalaqaActionItems(halaqaId, updatedActionItems);
    res.json(updatedHalaqa);
  } catch (error) {
    console.error("Error deleting action item:", error);
    res.status(500).json({ error: "Failed to delete action item" });
  }
});

// POST /api/halaqas/suggestions - Generate application suggestions
const applicationSuggestionsSchema = z.object({
  descriptionSection: z.string().min(10),
  insightsSection: z.string().min(10),
  emotionsSection: z.string().min(10),
});

router.post("/suggestions", async (req, res) => {
  try {
    // Validate request body
    const result = applicationSuggestionsSchema.safeParse(req.body);
    
    if (!result.success) {
      return res.status(400).json({ 
        error: "Invalid input data", 
        details: result.error.format() 
      });
    }
    
    const { descriptionSection, insightsSection, emotionsSection } = result.data;
    
    // Generate suggestions based on the provided sections
    const suggestions = await generateHalaqaApplicationSuggestions(
      descriptionSection,
      insightsSection,
      emotionsSection
    );
    
    res.json({ suggestions });
  } catch (error) {
    console.error("Error generating application suggestions:", error);
    res.status(500).json({ error: "Failed to generate application suggestions" });
  }
});

// POST route for analyzing a halaqa entry (action items + wird suggestions)
router.post("/:id/analyze", authRequired, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const halaqaId = parseInt(req.params.id);
    
    logger.info(`[halaqaRoutes] /:id/analyze endpoint called with ID: ${req.params.id}`);
    logger.info(`[halaqaRoutes] Request body: ${JSON.stringify(req.body)}`);
    
    // Extract personalization context if provided
    const personalizationContext = req.body.personalizationContext;
    if (personalizationContext) {
      logger.info(`[halaqaRoutes] Personalization context provided for analysis`);
    }
    
    if (isNaN(halaqaId)) {
      logger.error(`[halaqaRoutes] Invalid halaqa ID format: ${req.params.id}`);
      return res.status(400).json({ error: "Invalid halaqa ID format" });
    }
    
    logger.info(`[halaqaRoutes] Starting analysis for halaqa ID: ${halaqaId}`);
    
    // Get the halaqa entry
    const halaqa = await storage.getHalaqa(halaqaId);
    
    if (!halaqa) {
      logger.warn(`[halaqaRoutes] Halaqa not found: ${halaqaId}`);
      return res.status(404).json({ error: 'Halaqa not found' });
    }
    
    logger.info(`[halaqaRoutes] Found halaqa for analysis: ${halaqaId}, title: "${halaqa.title}"`);
    
    // Check if halaqa already has wird suggestions and actionItems
    const alreadyHasWirdSuggestions = Array.isArray(halaqa.wirdSuggestions) && halaqa.wirdSuggestions.length > 0;
    const alreadyHasActionItems = Array.isArray(halaqa.actionItems) && halaqa.actionItems.length > 0;
    
    // If analysis is already complete, return existing data without reanalyzing
    if (alreadyHasWirdSuggestions && alreadyHasActionItems) {
      logger.info(`[halaqaRoutes] Halaqa ${halaqaId} already has action items and wird suggestions, skipping analysis`);
      return res.status(200).json({
        message: 'Halaqa already analyzed',
        actionItems: halaqa.actionItems,
        wirdSuggestions: halaqa.wirdSuggestions
      });
    }
    
    // Initialize variables to track analysis progress
    let actionItems: { description: string }[] = [];
    let actionItemsWithIds: HalaqaActionItem[] = [];
    let wirdSuggestions: any[] = [];
    let wirdSuggestionsSucceeded = false;
    let updatedHalaqa: Halaqa | null = null;
    
    try {
      // Generate action items if needed
      if (!alreadyHasActionItems) {
        logger.info(`[halaqaRoutes] Generating action items for halaqa ${halaqaId}`);
        
        try {
          // Generate action items using AI
          actionItems = await generateHalaqaActions(
            halaqa.keyReflection || "",
            halaqa.impact || "",
            personalizationContext
          );
          
          // Add IDs to action items
          actionItemsWithIds = actionItems.map(item => ({
            id: v4(),
            description: item.description,
            completed: false
          }));
          
          logger.info(`[halaqaRoutes] Generated ${actionItemsWithIds.length} action items for halaqa ${halaqaId}`);
        } catch (actionItemsError) {
          logger.error(`[halaqaRoutes] Error generating action items:`, actionItemsError);
          // Continue with analysis even if action items fail
        }
      } else {
        logger.info(`[halaqaRoutes] Halaqa ${halaqaId} already has action items, skipping generation`);
        actionItemsWithIds = halaqa.actionItems || [];
      }
      
      // Generate wird suggestions if needed
      if (!alreadyHasWirdSuggestions) {
        logger.info(`[halaqaRoutes] Generating wird suggestions for halaqa ${halaqaId}`);
        
        try {
          // Enhanced: Preprocess halaqa content to ensure it's complete and well-formatted
          // This ensures the AI has the richest possible context to work with
          const halaqaContent = {
            title: halaqa.title || "Untitled Halaqa", 
            topic: halaqa.topic || "",
            keyReflection: halaqa.keyReflection || "",
            impact: halaqa.impact || ""
          };
          
          // Generate wird suggestions using AI
          wirdSuggestions = await generateHalaqaWirdSuggestions(halaqaContent, personalizationContext);
          
          wirdSuggestionsSucceeded = true;
          
          logger.info(`[halaqaRoutes] Generated ${wirdSuggestions.length} wird suggestions for halaqa ${halaqaId}`);
        } catch (wirdError) {
          logger.error(`[halaqaRoutes] Error generating wird suggestions:`, wirdError);
          // Continue with analysis even if wird suggestions fail
        }
      } else {
        logger.info(`[halaqaRoutes] Halaqa ${halaqaId} already has wird suggestions, skipping generation`);
        wirdSuggestions = halaqa.wirdSuggestions || [];
        wirdSuggestionsSucceeded = true;
      }
      
      // Update the halaqa with the generated content
      try {
        // Only update if we have new content
        if (actionItemsWithIds.length > 0 || wirdSuggestions.length > 0) {
          logger.info(`[halaqaRoutes] Updating halaqa ${halaqaId} with analysis results`);
          
          const updateData: Partial<Halaqa> = {};
          
          if (actionItemsWithIds.length > 0) {
            updateData.actionItems = actionItemsWithIds;
          }
          
          if (wirdSuggestions.length > 0) {
            updateData.wirdSuggestions = wirdSuggestions;
          }
          
          // Update the halaqa
          updatedHalaqa = await storage.updateHalaqa(halaqaId, updateData);
          
          logger.info(`[halaqaRoutes] Successfully updated halaqa ${halaqaId} with analysis results`);
        }
      } catch (updateError) {
        logger.error(`[halaqaRoutes] Error updating halaqa with analysis results:`, updateError);
        // Continue and return the generated data even if update fails
      }
    } catch (analysisError) {
      logger.error(`[halaqaRoutes] Error during halaqa analysis:`, analysisError);
      // Continue and return any partial results
    }
    
    logger.info(`[halaqaRoutes] Partially completed analysis for halaqa ${halaqaId}`);
    
    // Return the results
    return res.status(200).json({
      message: "Analysis partial completion",
      actionItems: updatedHalaqa?.actionItems || actionItemsWithIds,
      wirdSuggestions: wirdSuggestions || null,
      wirdSuggestionsSucceeded,
    });
  } catch (error) {
    logger.error('[halaqaRoutes] Error analyzing halaqa:', error);
    return res.status(500).json({ error: 'An error occurred while analyzing the halaqa' });
  }
});

// Schema for the analyze halaqa request
const AnalyzeHalaqaSchema = z.object({
  halaqaId: z.number(),
});

// POST /api/halaqas/analyze - Generate wird suggestions for a halaqa
router.post("/analyze", authRequired, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { halaqaId } = AnalyzeHalaqaSchema.parse(req.body);
    
    // Get the halaqa entry
    const halaqa = await storage.getHalaqa(halaqaId);
    
    if (!halaqa) {
      return res.status(404).json({ error: "Halaqa entry not found" });
    }
    
    // Make sure the user has access to this halaqa
    if (req.user && halaqa.userId !== req.user.id) {
      return res.status(403).json({ error: "You don't have permission to analyze this halaqa entry" });
    }
    
    logger.info(`Analyzing halaqa entry ${halaqaId} for user ${req.user?.id}`);
    
    // Enhanced: Preprocess halaqa content to ensure it's complete and well-formatted
    // This ensures the AI has the richest possible context to work with
    const halaqaContent = {
      title: halaqa.title || "Untitled Halaqa", 
      topic: halaqa.topic || "",
      keyReflection: halaqa.keyReflection || "",
      impact: halaqa.impact || ""
    };
    
    // Log the content being analyzed to help debug relevance issues
    logger.info(`Analysis content summary for halaqa ${halaqaId}:
      Title: ${halaqaContent.title.substring(0, 50)}...
      Topic: ${halaqaContent.topic.substring(0, 50)}...
      Key Reflection Length: ${halaqaContent.keyReflection.length} chars
      Impact Length: ${halaqaContent.impact.length} chars
    `);
    
    // Generate wird suggestions using AI
    const wirdSuggestions = await generateHalaqaWirdSuggestions(halaqaContent);
    
    if (!wirdSuggestions || wirdSuggestions.length === 0) {
      return res.status(500).json({ error: "Failed to generate wird suggestions" });
    }
    
    // Generate personalized insights
    const personalizedInsights = await generateHalaqaInsights(halaqaContent);
    
    // Save the wird suggestions
    await storage.saveHalaqaWirdSuggestions(halaqaId, wirdSuggestions);
    
    // Return both wird suggestions and personalized insights
    return res.json({ 
      wirdSuggestions,
      personalizedInsights
    });
  } catch (error) {
    logger.error("Error analyzing halaqa entry:", error);
    return res.status(400).json({ error: "Invalid request" });
  }
});

// POST /api/halaqas/:id/application-suggestions - Generate application suggestions
router.post("/:id/application-suggestions", authRequired, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = req.params.id;
    
    // Validate ID is a number
    const halaqaId = parseInt(id);
    if (isNaN(halaqaId)) {
      return res.status(400).json({ error: "Invalid halaqa ID format" });
    }
    
    const halaqa = await storage.getHalaqa(halaqaId);
    
    if (!halaqa) {
      return res.status(404).json({ error: "Halaqa not found" });
    }
    
    // Check if the user making the request is the owner of the halaqa
    if (req.user && halaqa.userId !== req.user.id) {
      return res.status(403).json({ error: "You don't have permission to access this halaqa" });
    }
    
    logger.info(`Analyzing halaqa entry ${halaqaId} for user ${req.user?.id}`);
    
    // Generate application suggestions based on the halaqa content
    // Using an empty string for the third parameter as a workaround
    const suggestions = await generateHalaqaApplicationSuggestions(
      halaqa.topic, 
      halaqa.keyReflection,
      halaqa.impact
    );
    
    res.json({ suggestions });
  } catch (error) {
    console.error("Error generating application suggestions:", error);
    res.status(500).json({ error: "Failed to generate application suggestions" });
  }
});

// POST /api/halaqas/:id/wird-suggestions - Generate wird (devotional practice) suggestions
router.post("/:id/wird-suggestions", (req, res, next) => {
  console.log(`🟢 [HALAQA ROUTES] Matched route: POST /:id/wird-suggestions`);
  console.log(`🟢 [HALAQA ROUTES] ID param:`, req.params.id);
  console.log(`🟢 [HALAQA ROUTES] Full URL:`, req.originalUrl);
  console.log(`🟢 [HALAQA ROUTES] Base URL:`, req.baseUrl);
  console.log(`🟢 [HALAQA ROUTES] Path:`, req.path);
  authRequired(req, res, next);
}, async (req: AuthenticatedRequest, res: Response) => {
  console.log(`🟢 [HALAQA ROUTES] Inside wird-suggestions handler after auth`);
  try {
    const id = req.params.id;
    console.log(`🟢 [HALAQA ROUTES] Processing wird-suggestions for halaqa ID: ${id}`);
    
    // Validate ID is a number
    const halaqaId = parseInt(id);
    if (isNaN(halaqaId)) {
      console.log(`🟢 [HALAQA ROUTES] Invalid halaqa ID format: ${id} is not a number`);
      return res.status(400).json({ error: "Invalid halaqa ID format" });
    }
    
    // Ensure this route only handles numeric IDs to avoid catching unrelated paths
    if (!/^\d+$/.test(id)) {
      console.log(`🟢 [HALAQA ROUTES] Rejecting non-numeric ID: ${id}`);
      return res.status(400).json({ error: "Invalid halaqa ID format: must be numeric" });
    }
    
    const halaqa = await storage.getHalaqa(halaqaId);
    
    if (!halaqa) {
      console.log(`🟢 [HALAQA ROUTES] Halaqa not found with ID: ${halaqaId}`);
      return res.status(404).json({ error: "Halaqa not found" });
    }
    
    // Generate wird suggestions based on the halaqa content
    console.log(`🟢 [HALAQA ROUTES] Generating wird suggestions for halaqa: ${halaqa.title}`);
    const suggestions = await generateHalaqaWirdSuggestions({
      title: halaqa.title,
      topic: halaqa.topic,
      keyReflection: halaqa.keyReflection,
      impact: halaqa.impact
    });
    
    console.log(`🟢 [HALAQA ROUTES] Successfully generated ${suggestions.length} wird suggestions`);
    res.json({ suggestions });
  } catch (error) {
    console.error("🟢 [HALAQA ROUTES] Error generating wird suggestions:", error);
    res.status(500).json({ error: "Failed to generate wird suggestions" });
  }
});

export default router; 