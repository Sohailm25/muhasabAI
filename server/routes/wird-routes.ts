import express from "express";
import * as storage from "../storage";
import { WirdEntry, WirdPractice, InsertWird } from "@shared/schema";
import { generateWirdRecommendations } from "../lib/anthropic";
import { z } from "zod";
import { v4 } from "uuid";
import { createLogger } from "../lib/logger";

const router = express.Router();
const logger = createLogger("wirdRoutes");

// GET /api/wirds/user/:userId - Get all wird entries for a user
router.get("/user/:userId", async (req, res) => {
  try {
    const userId = req.params.userId;
    
    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
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
    
    if (!userId || !startDate || !endDate) {
      return res.status(400).json({ error: "User ID, start date, and end date are required" });
    }
    
    // Validate date formats (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(startDate) || !dateRegex.test(endDate)) {
      return res.status(400).json({ error: "Invalid date format. Use YYYY-MM-DD" });
    }
    
    const wirds = await storage.getWirdsByDateRange(userId, startDate, endDate);
    res.json(wirds);
  } catch (error) {
    console.error("Error fetching wird entries by date range:", error);
    res.status(500).json({ error: "Failed to fetch wird entries" });
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

// Schema for adding wird suggestions
const AddWirdSuggestionSchema = z.object({
  userId: z.string(),
  wirdSuggestion: z.object({
    id: z.string(),
    title: z.string(),
    description: z.string(),
    type: z.string(),
    duration: z.string(),
    frequency: z.string()
  }),
  date: z.string().optional()
});

// POST /api/wird/add-suggestion - Add a wird suggestion to a user's wird plan
router.post("/add-suggestion", async (req, res) => {
  try {
    const { userId, wirdSuggestion, date } = AddWirdSuggestionSchema.parse(req.body);
    
    // Convert date string to Date object if provided
    const targetDate = date ? new Date(date) : undefined;
    
    // Add the wird suggestion to the user's wird plan
    const result = await storage.addWirdSuggestionToUserWirdPlan(
      userId,
      wirdSuggestion,
      targetDate
    );
    
    if (!result) {
      return res.status(500).json({ success: false, error: "Failed to add wird suggestion to plan" });
    }
    
    return res.json({ success: true, wird: result });
  } catch (error) {
    logger.error("Error adding wird suggestion to plan:", error);
    return res.status(400).json({ success: false, error: "Invalid request" });
  }
});

export default router; 