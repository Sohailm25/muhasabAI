import express, { Request, Response } from "express";
import * as storage from "../storage.js";
import { Halaqa, HalaqaActionItem } from "@shared/schema";
import { generateHalaqaActions, generateHalaqaApplicationSuggestions, generateHalaqaWirdSuggestions } from "../lib/anthropic.js";
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
      return res.status(400).json({ error: "Invalid halaqa ID format" });
    }
    
    // DEBUG: Log ID being requested
    console.log("Getting halaqa with ID:", halaqaId);
    
    const halaqa = await storage.getHalaqa(halaqaId);
    
    // DEBUG: Log whether halaqa was found
    console.log("Halaqa found:", halaqa ? true : false);
    
    if (!halaqa) {
      return res.status(404).json({ error: "Halaqa not found" });
    }
    
    res.json(halaqa);
  } catch (error) {
    console.error("Error fetching halaqa:", error);
    res.status(500).json({ error: "Failed to fetch halaqa" });
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

// POST /api/halaqas/:id/analyze - Analyze a halaqa entry to generate action items and wird suggestions
router.post("/:id/analyze", async (req, res) => {
  const halaqaId = parseInt(req.params.id);
  
  if (isNaN(halaqaId)) {
    logger.error(`Invalid halaqa ID format: ${req.params.id}`);
    return res.status(400).json({ error: "Invalid halaqa ID format" });
  }
  
  logger.info(`Starting analysis for halaqa ID: ${halaqaId}`);
  
  try {
    // Fetch the halaqa entry
    const halaqa = await storage.getHalaqa(halaqaId);
    
    if (!halaqa) {
      logger.error(`Halaqa not found for ID: ${halaqaId}`);
      return res.status(404).json({ error: "Halaqa not found" });
    }
    
    logger.info(`Found halaqa for analysis: ${halaqaId}, title: "${halaqa.title}"`);
    
    // Generate action items and wird suggestions in parallel
    // This provides better performance than sequential requests
    const [actionItems, wirdSuggestions] = await Promise.all([
      generateHalaqaActions(halaqa.keyReflection, halaqa.impact)
        .catch(error => {
          logger.error(`Error generating action items for halaqa ${halaqaId}:`, error);
          return null;
        }),
      generateHalaqaWirdSuggestions({
        title: halaqa.title,
        topic: halaqa.topic,
        keyReflection: halaqa.keyReflection,
        impact: halaqa.impact
      })
        .catch(error => {
          logger.error(`Error generating wird suggestions for halaqa ${halaqaId}:`, error);
          return null;
        })
    ]);
    
    // Process results and update storage
    let updatedHalaqa = halaqa;
    
    // Process action items if successful
    if (actionItems) {
      logger.info(`Generated ${actionItems.length} action items for halaqa ${halaqaId}`);
      
      // Add IDs to action items
      const actionItemsWithIds: HalaqaActionItem[] = actionItems.map(item => ({
        id: v4(),
        description: item.description,
        completed: false
      }));
      
      // Update the halaqa with action items
      updatedHalaqa = await storage.updateHalaqaActionItems(halaqaId, actionItemsWithIds);
      logger.info(`Updated halaqa ${halaqaId} with action items`);
    } else {
      logger.warn(`No action items generated for halaqa ${halaqaId}`);
    }
    
    // Process wird suggestions if successful
    if (wirdSuggestions) {
      logger.info(`Generated ${wirdSuggestions.length} wird suggestions for halaqa ${halaqaId}`);
      
      // Store wird suggestions
      await storage.saveHalaqaWirdSuggestions(halaqaId, wirdSuggestions);
      logger.info(`Saved wird suggestions for halaqa ${halaqaId}`);
      
      // Add wird suggestions to the response object
      updatedHalaqa = {
        ...updatedHalaqa,
        wirdSuggestions: wirdSuggestions
      };
    } else {
      logger.warn(`No wird suggestions generated for halaqa ${halaqaId}`);
    }
    
    // Return the updated halaqa with action items and wird suggestions
    res.json(updatedHalaqa);
    logger.info(`Successfully completed analysis for halaqa ${halaqaId}`);
  } catch (error) {
    logger.error(`Error analyzing halaqa ${halaqaId}:`, error);
    res.status(500).json({ error: "Failed to analyze halaqa entry" });
  }
});

// Schema for the analyze halaqa request
const AnalyzeHalaqaSchema = z.object({
  halaqaId: z.number(),
});

// POST /api/halaqas/analyze - Generate wird suggestions for a halaqa
router.post("/analyze", authRequired, async (req: Request, res: Response) => {
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
    
    // Generate wird suggestions using AI
    const wirdSuggestions = await generateHalaqaWirdSuggestions({
      title: halaqa.title, 
      topic: halaqa.topic,
      keyReflection: halaqa.keyReflection,
      impact: halaqa.impact
    });
    
    if (!wirdSuggestions || wirdSuggestions.length === 0) {
      return res.status(500).json({ error: "Failed to generate wird suggestions" });
    }
    
    // Save the wird suggestions
    await storage.saveHalaqaWirdSuggestions(halaqaId, wirdSuggestions);
    
    // Return the wird suggestions
    return res.json({ wirdSuggestions });
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