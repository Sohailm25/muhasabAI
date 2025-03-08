import express from "express";
import * as storageModule from "../storage";
import { WirdEntry, WirdPractice, InsertWird, WirdSuggestion } from "@shared/schema";
import { generateWirdRecommendations } from "../lib/anthropic";
import { z } from "zod";
import { v4 } from "uuid";
import { createLogger } from "../lib/logger";
import { addErrorHandler, createExpressEndpoints } from "trpc-openapi";
import { v4 as uuidv4 } from "uuid";
import { AddWirdSchema, WirdPracticeSchema, UpdatePracticesSchema } from "../../shared/schema";

const router = express.Router();
const logger = createLogger("wirdRoutes");

// Initialize storage
let storage: any;
try {
  storage = storageModule.createStorage();
  console.log('[WIRD ROUTER] Storage initialized successfully');
} catch (error) {
  console.error('[WIRD ROUTER] Failed to initialize storage:', error);
}

// GET /api/wirds/user/:userId - Get all wird entries for a user
router.get("/user/:userId", async (req, res) => {
  try {
    const userId = req.params.userId;
    
    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }
    
    // Initialize storage if not already done
    if (!storage) {
      console.log('[WIRD ROUTER] Initializing storage for getWirdsByUserId');
      storage = storageModule.createStorage();
    }
    
    const wirds = await storage.getWirdsByUserId(userId);
    res.json(wirds);
  } catch (error) {
    console.error("Error fetching wird entries by user ID:", error);
    res.status(500).json({ error: "Failed to fetch wird entries" });
  }
});

// GET /api/wirds/:id - Get a specific wird entry
router.get("/:id", async (req, res) => {
  try {
    const id = req.params.id;
    
    // Validate ID is a number
    const wirdId = parseInt(id);
    if (isNaN(wirdId)) {
      return res.status(400).json({ error: "Invalid wird ID format" });
    }
    
    const wird = await storage.getWird(wirdId);
    
    if (!wird) {
      return res.status(404).json({ error: "Wird entry not found" });
    }
    
    res.json(wird);
  } catch (error) {
    console.error("Error fetching wird entry:", error);
    res.status(500).json({ error: "Failed to fetch wird entry" });
  }
});

// GET /api/wirds/date/:userId/:date - Get wird entry by date for a user
router.get("/date/:userId/:date", async (req, res) => {
  try {
    const { userId, date } = req.params;
    
    if (!userId || !date) {
      return res.status(400).json({ error: "User ID and date are required" });
    }
    
    // Validate date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      return res.status(400).json({ error: "Invalid date format. Use YYYY-MM-DD" });
    }
    
    const wird = await storage.getWirdByDate(userId, date);
    
    if (!wird) {
      return res.status(404).json({ error: "No wird entry found for this date" });
    }
    
    res.json(wird);
  } catch (error) {
    console.error("Error fetching wird entry by date:", error);
    res.status(500).json({ error: "Failed to fetch wird entry" });
  }
});

// GET /api/wirds/range/:userId/:startDate/:endDate - Get wird entries for a date range
router.get("/range/:userId/:startDate/:endDate", async (req, res) => {
  try {
    const { userId, startDate, endDate } = req.params;
    
    console.log('[WIRD ROUTER] Getting wird entries for date range:', { userId, startDate, endDate });
    
    if (!userId || !startDate || !endDate) {
      return res.status(400).json({ error: "User ID, start date, and end date are required" });
    }
    
    // Validate date formats (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(startDate) || !dateRegex.test(endDate)) {
      return res.status(400).json({ error: "Invalid date format. Use YYYY-MM-DD" });
    }
    
    // Initialize storage if not already done
    if (!storage) {
      console.log('[WIRD ROUTER] Initializing storage for getWirdsByDateRange');
      storage = storageModule.createStorage();
    }
    
    try {
      // CRITICAL FIX: Use fallback implementation based on getWirdsByUserId
      console.log('[WIRD ROUTER] Using fallback implementation - filtering all wirds by date');
      
      // Get all wirds for the user
      const allWirds = await storage.getWirdsByUserId(userId);
      console.log(`[WIRD ROUTER] Found ${allWirds.length} total wird entries for user`);
      
      // Convert dates for comparison
      const startDateObj = new Date(startDate);
      const endDateObj = new Date(endDate);
      
      // Filter wirds by date range
      const filteredWirds = allWirds.filter(wird => {
        const wirdDate = new Date(wird.date);
        return wirdDate >= startDateObj && wirdDate <= endDateObj;
      });
      
      console.log(`[WIRD ROUTER] Found ${filteredWirds.length} wird entries in date range`);
      return res.json(filteredWirds);
    } catch (error) {
      console.error('[WIRD ROUTER] Error when filtering wirds by date range:', error);
      return res.status(500).json({ error: "Failed to fetch wird entries" });
    }
  } catch (error) {
    console.error("Error fetching wird entries by date range:", error);
    return res.status(500).json({ error: "Failed to fetch wird entries" });
  }
});

// Create a new wird entry schema
const createWirdSchema = z.object({
  userId: z.string(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format. Use YYYY-MM-DD"),
  practices: z.array(
    z.object({
      id: z.string().optional(),
      name: z.string(),
      category: z.string(),
      target: z.number().positive(),
      completed: z.number().default(0),
      unit: z.string(),
      isCompleted: z.boolean().default(false),
    })
  ),
  notes: z.string().optional(),
  sourceType: z.enum(['reflection', 'halaqa']).optional(),
  sourceId: z.number().optional(),
});

// POST /api/wirds - Create a new wird entry
router.post("/", async (req, res) => {
  try {
    // Validate request body
    const result = createWirdSchema.safeParse(req.body);
    
    if (!result.success) {
      return res.status(400).json({ 
        error: "Invalid wird data", 
        details: result.error.format() 
      });
    }
    
    const wirdData = result.data;
    
    // Ensure each practice has an ID
    const practicesWithIds = wirdData.practices.map(practice => ({
      ...practice,
      id: practice.id || v4()
    }));
    
    // Create the wird entry
    const newWird = await storage.createWird({
      ...wirdData,
      practices: practicesWithIds,
    });
    
    res.status(201).json(newWird);
  } catch (error) {
    console.error("Error creating wird entry:", error);
    res.status(500).json({ error: "Failed to create wird entry" });
  }
});

// Update wird schema
const updateWirdSchema = z.object({
  practices: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      category: z.string(),
      target: z.number().positive(),
      completed: z.number(),
      unit: z.string(),
      isCompleted: z.boolean(),
    })
  ).optional(),
  notes: z.string().optional(),
  isArchived: z.boolean().optional(),
  sourceType: z.enum(['reflection', 'halaqa']).optional(),
  sourceId: z.number().optional(),
});

// PUT /api/wirds/:id - Update a wird entry
router.put("/:id", async (req, res) => {
  try {
    const id = req.params.id;
    
    // Validate ID is a number
    const wirdId = parseInt(id);
    if (isNaN(wirdId)) {
      return res.status(400).json({ error: "Invalid wird ID format" });
    }
    
    // Validate request body
    const result = updateWirdSchema.safeParse(req.body);
    
    if (!result.success) {
      return res.status(400).json({ 
        error: "Invalid wird data", 
        details: result.error.format() 
      });
    }
    
    const wirdData = result.data;
    
    // Check if wird exists
    const existingWird = await storage.getWird(wirdId);
    
    if (!existingWird) {
      return res.status(404).json({ error: "Wird entry not found" });
    }
    
    // Update the wird entry
    const updatedWird = await storage.updateWird(wirdId, {
      ...wirdData,
      updatedAt: new Date(),
    });
    
    res.json(updatedWird);
  } catch (error) {
    console.error("Error updating wird entry:", error);
    res.status(500).json({ error: "Failed to update wird entry" });
  }
});

// Update practice schema
const updatePracticeSchema = z.object({
  id: z.string(),
  completed: z.number(),
  isCompleted: z.boolean(),
});

// PATCH /api/wirds/:id/practices/:practiceId - Update a specific practice
router.patch("/:id/practices/:practiceId", async (req, res) => {
  try {
    const { id, practiceId } = req.params;
    
    // Validate ID is a number
    const wirdId = parseInt(id);
    if (isNaN(wirdId)) {
      return res.status(400).json({ error: "Invalid wird ID format" });
    }
    
    // Validate request body
    const result = updatePracticeSchema.safeParse(req.body);
    
    if (!result.success) {
      return res.status(400).json({ 
        error: "Invalid practice data", 
        details: result.error.format() 
      });
    }
    
    const practiceData = result.data;
    
    // Check if wird exists
    const existingWird = await storage.getWird(wirdId);
    
    if (!existingWird) {
      return res.status(404).json({ error: "Wird entry not found" });
    }
    
    // Find and update the specific practice
    const practices = existingWird.practices.map(practice => 
      practice.id === practiceId ? { ...practice, ...practiceData } : practice
    );
    
    // If we couldn't find the practice, return an error
    if (!practices.some(p => p.id === practiceId)) {
      return res.status(404).json({ error: "Practice not found in this wird entry" });
    }
    
    // Update the wird with the new practices array
    const updatedWird = await storage.updateWirdPractices(wirdId, practices);
    res.json(updatedWird);
  } catch (error) {
    console.error("Error updating practice:", error);
    res.status(500).json({ error: "Failed to update practice" });
  }
});

// POST /api/wirds/recommendations - Get personalized recommendations
router.post("/recommendations", async (req, res) => {
  try {
    const { userId, history, preferences } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }
    
    // Get recommendations based on user's history and preferences
    const recommendations = await generateWirdRecommendations(history, preferences);
    
    res.json({ recommendations });
  } catch (error) {
    console.error("Error generating wird recommendations:", error);
    res.status(500).json({ error: "Failed to generate recommendations" });
  }
});

// Add suggestion schema
const AddWirdSuggestionSchema = z.object({
  userId: z.string(),
  wirdSuggestion: z.object({
    id: z.string(),
    title: z.string().optional(),
    name: z.string().optional(),
    type: z.string().optional(),
    category: z.string().optional(),
    description: z.string().optional(),
    frequency: z.string().optional(),
    duration: z.string().optional(),
    benefit: z.string().optional(),
    target: z.number().optional(),
    unit: z.string().optional(),
  }),
  date: z.string().optional(),
  sourceType: z.enum(['reflection', 'halaqa']).optional(),
  sourceId: z.number().optional(),
});

// POST /api/wirds/add-suggestion - Add a wird suggestion to user's wird plan
router.post("/add-suggestion", async (req, res) => {
  try {
    console.log("Received add-suggestion request:", JSON.stringify(req.body, null, 2));
    
    // Validate the request body
    const { userId, wirdSuggestion, date, sourceType, sourceId } = AddWirdSuggestionSchema.parse(req.body);
    
    if (!userId) {
      return res.status(400).json({ 
        success: false, 
        error: "User ID is required" 
      });
    }
    
    if (!wirdSuggestion) {
      return res.status(400).json({ 
        success: false, 
        error: "Wird suggestion is required" 
      });
    }
    
    try {
      // Override the date if needed (this fixes any date formatting issues)
      const targetDate = date ? new Date(date) : new Date();
      
      console.log("Adding wird suggestion to plan:", { 
        userId,
        wirdSuggestion: JSON.stringify(wirdSuggestion),
        date: targetDate.toISOString()
      });
      
      // Make simple wird practice from suggestion
      const simplePractice = {
        name: wirdSuggestion.title || wirdSuggestion.name || "Spiritual Practice",
        category: wirdSuggestion.type || wirdSuggestion.category || "General",
        id: wirdSuggestion.id || v4(), // Use existing ID or create new one
        target: wirdSuggestion.target || 1,
        completed: 0,
        unit: wirdSuggestion.unit || "times",
        isCompleted: false
      };
      
      // Format the date string for lookup
      const dateStr = targetDate.toISOString().split('T')[0];
      
      // Find existing wird for user on this date
      const existingWirds = await storage.getWirdsByUserId(userId);
      const wirdForDate = existingWirds.find(wird => {
        const wirdDate = typeof wird.date === 'string' 
          ? wird.date.split('T')[0] 
          : wird.date.toISOString().split('T')[0];
        return wirdDate === dateStr;
      });
      
      let result;
      
      if (wirdForDate) {
        // Add practice to existing wird
        const updatedPractices = [...wirdForDate.practices, simplePractice];
        
        // Update the wird with the new practice
        result = await storage.updateWirdPractices(
          wirdForDate.id,
          updatedPractices
        );
        
        // If source information is provided, update the wird with it
        if (sourceType && sourceId) {
          await storage.updateWird(wirdForDate.id, {
            sourceType,
            sourceId
          });
        }
        
        console.log(`Added practice to existing wird ${wirdForDate.id}`);
      } else {
        // Create a new wird with this practice
        result = await storage.createWird({
          userId,
          date: targetDate,
          practices: [simplePractice],
          notes: "",
          sourceType,
          sourceId,
        });
        
        console.log(`Created new wird with ID ${result.id}`);
      }
      
      return res.json({ 
        success: true, 
        result 
      });
    } catch (innerError) {
      console.error("Inner error in add-suggestion:", innerError);
      throw new Error(`Failed to process wird suggestion: ${innerError.message}`);
    }
  } catch (error) {
    console.error("Error adding wird suggestion:", error);
    
    let errorMessage = "Failed to add wird suggestion";
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    
    res.status(500).json({ 
      success: false, 
      error: errorMessage,
      stack: process.env.NODE_ENV === 'development' ? (error as Error).stack : undefined
    });
  }
});

// POST /api/wirds/remove-practice - Remove a practice from a user's wird plan
router.post("/remove-practice", async (req, res) => {
  try {
    console.log("Received remove-practice request:", JSON.stringify(req.body, null, 2));
    
    // Validate the request body
    const { userId, wirdId, practiceId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ 
        success: false, 
        error: "User ID is required" 
      });
    }
    
    if (!wirdId) {
      return res.status(400).json({ 
        success: false, 
        error: "Wird ID is required" 
      });
    }
    
    if (!practiceId) {
      return res.status(400).json({ 
        success: false, 
        error: "Practice ID is required" 
      });
    }
    
    try {
      // Get the wird entry
      const wird = await storage.getWird(wirdId);
      
      if (!wird) {
        return res.status(404).json({ 
          success: false, 
          error: "Wird entry not found" 
        });
      }
      
      // Verify the wird belongs to the user
      if (wird.userId !== userId) {
        return res.status(403).json({ 
          success: false, 
          error: "You don't have permission to modify this wird" 
        });
      }
      
      // Filter out the practice to remove
      const updatedPractices = wird.practices.filter(
        practice => practice.id !== practiceId
      );
      
      // If all practices are removed, delete the wird entry
      if (updatedPractices.length === 0) {
        await storage.deleteWird(wirdId);
        return res.json({ 
          success: true, 
          message: "Wird entry deleted as it had no remaining practices",
          deleted: true
        });
      }
      
      // Update the wird with the filtered practices
      const result = await storage.updateWirdPractices(
        wirdId,
        updatedPractices
      );
      
      return res.json({ 
        success: true, 
        result 
      });
    } catch (innerError) {
      console.error("Inner error in remove-practice:", innerError);
      throw new Error(`Failed to remove practice: ${innerError.message}`);
    }
  } catch (error) {
    console.error("Error removing practice from wird plan:", error);
    return res.status(500).json({ 
      success: false, 
      error: error.message || "Failed to remove practice from wird plan" 
    });
  }
});

export default router; 