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
    
    if (isNaN(halaqaId)) {
      logger.error(`Invalid halaqa ID format: ${req.params.id}`);
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
    let updatedHalaqa: Halaqa | undefined = undefined;
    let wirdSuggestions = null;
    let wirdSuggestionsSucceeded = false;
    
    // Generate action items if they don't exist already
    if (!alreadyHasActionItems) {
      try {
        actionItems = await generateHalaqaActions(halaqa.keyReflection, halaqa.impact);
        logger.info(`[halaqaRoutes] Generated ${actionItems.length} action items for halaqa ${halaqaId}`);
        
        // Add IDs and set completed to false
        actionItemsWithIds = actionItems.map(item => ({
          id: v4(),
          description: item.description,
          completed: false
        }));
        
        // Update the halaqa with the action items
        try {
          updatedHalaqa = await storage.updateHalaqaActionItems(halaqaId, actionItemsWithIds);
          logger.info(`[halaqaRoutes] Updated halaqa ${halaqaId} with action items`);
        } catch (updateError) {
          logger.error(`[halaqaRoutes] Error updating action items for halaqa ${halaqaId}:`, updateError);
          
          // Create an in-memory version of the updated halaqa
          updatedHalaqa = {
            ...halaqa,
            actionItems: actionItemsWithIds
          };
          logger.info(`[halaqaRoutes] Created in-memory updated halaqa object with action items for ${halaqaId}`);
        }
      } catch (updateError) {
        logger.error(`[halaqaRoutes] Error processing action items for halaqa ${halaqaId}:`, updateError);
        // Continue with the workflow even if updating action items fails
        // Since we couldn't save them, we'll add them to the response directly
        updatedHalaqa = {
          ...halaqa,
          actionItems: actionItems.map(item => ({
            id: v4(),
            description: item.description,
            completed: false
          }))
        };
      }
    } else {
      logger.info(`[halaqaRoutes] Halaqa ${halaqaId} already has action items, skipping generation`);
      actionItemsWithIds = halaqa.actionItems || [];
      updatedHalaqa = halaqa;
    }

    // Generate wird suggestions if they don't exist already
    if (!alreadyHasWirdSuggestions) {
      // Max retries for wird suggestions to prevent rate limiting
      const MAX_RETRIES = 1;
      let retries = 0;
      
      while (retries <= MAX_RETRIES && !wirdSuggestions) {
        try {
          wirdSuggestions = await generateHalaqaWirdSuggestions({
            title: halaqa.title,
            topic: halaqa.topic,
            keyReflection: halaqa.keyReflection,
            impact: halaqa.impact
          });
          
          wirdSuggestionsSucceeded = true;
          logger.info(`[halaqaRoutes] Generated ${wirdSuggestions.length} wird suggestions for halaqa ${halaqaId}`);
        } catch (error) {
          retries++;
          if (retries > MAX_RETRIES) {
            logger.error(`[halaqaRoutes] Failed to generate wird suggestions after ${MAX_RETRIES} retries:`, error);
            break;
          }
          
          logger.warn(`[halaqaRoutes] Retry ${retries}/${MAX_RETRIES} for wird suggestions:`, error);
          // Wait before retrying to avoid rate limits (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retries)));
        }
      }
      
      // Process wird suggestions if successful
      if (wirdSuggestions && wirdSuggestions.length > 0) {
        try {
          // Store wird suggestions
          await storage.saveHalaqaWirdSuggestions(halaqaId, wirdSuggestions);
          logger.info(`[halaqaRoutes] Saved wird suggestions for halaqa ${halaqaId}`);
        } catch (saveError) {
          logger.error(`[halaqaRoutes] Error saving wird suggestions for halaqa ${halaqaId}:`, saveError);
          // Continue even if saving fails
        }
      }
    } else {
      logger.info(`[halaqaRoutes] Halaqa ${halaqaId} already has wird suggestions, skipping generation`);
      wirdSuggestions = halaqa.wirdSuggestions || [];
      wirdSuggestionsSucceeded = true;
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
router.post("/:id/wird-suggestions", authRequired, async (req: AuthenticatedRequest, res: Response) => {
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
    
    // Generate wird suggestions based on the halaqa content
    const suggestions = await generateHalaqaWirdSuggestions({
      title: halaqa.title,
      topic: halaqa.topic,
      keyReflection: halaqa.keyReflection,
      impact: halaqa.impact
    });
    
    res.json({ suggestions });
  } catch (error) {
    console.error("Error generating wird suggestions:", error);
    res.status(500).json({ error: "Failed to generate wird suggestions" });
  }
});

export default router; 