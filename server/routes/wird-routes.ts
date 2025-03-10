import express from "express";
import * as storageModule from "../storage";
import { WirdEntry, WirdPractice, InsertWird, WirdSuggestion } from "@shared/schema";
import { generateWirdRecommendations, generateHalaqaWirdSuggestions } from "../lib/anthropic";
import { z } from "zod";
import { v4 } from "uuid";
import { createLogger } from "../lib/logger";
import { addErrorHandler, createExpressEndpoints } from "trpc-openapi";
import { v4 as uuidv4 } from "uuid";
import { AddWirdSchema, WirdPracticeSchema, UpdatePracticesSchema } from "../../shared/schema";
import { authRequired } from "../auth";

// Define a type for authenticated requests
interface AuthenticatedRequest extends express.Request {
  user?: {
    id: string;
    email: string;
    name: string;
  };
}

const router = express.Router();
const logger = createLogger("wirdRoutes");

console.log("🔵 [WIRD ROUTES] Initializing wird-routes.ts");

// Initialize storage
let storage: any;
try {
  storage = storageModule.createStorage();
  console.log('[WIRD ROUTER] Storage initialized successfully');
} catch (error) {
  console.error('[WIRD ROUTER] Failed to initialize storage:', error);
}

// Log all routes being registered
console.log("🔵 [WIRD ROUTES] Registering routes:");

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

// PUT /api/wirds/:id/clear-framework - Update CLEAR framework for a wird
router.put("/:id/clear-framework", async (req, res) => {
  try {
    const { id } = req.params;
    const { clearFramework } = req.body;
    
    if (!clearFramework) {
      return res.status(400).json({ error: "CLEAR framework data is required" });
    }
    
    const wird = await storage.getWird(id);
    
    if (!wird) {
      return res.status(404).json({ error: "Wird entry not found" });
    }
    
    const updatedWird = await storage.updateWird(id, {
      ...wird,
      clearFramework,
    });
    
    res.json(updatedWird);
  } catch (error) {
    console.error("Error updating CLEAR framework:", error);
    res.status(500).json({ error: "Failed to update CLEAR framework" });
  }
});

// POST /api/wirds/generate-clear-summary - Generate summary using Anthropic
router.post("/generate-clear-summary", async (req, res) => {
  try {
    const { choices } = req.body;
    
    if (!choices) {
      return res.status(400).json({ error: "CLEAR framework choices are required" });
    }
    
    // Get selected choices for each category
    const selectedChoices = {
      cue: choices.cueChoices.filter(c => c.selected).map(c => c.text),
      lowFriction: choices.lowFrictionChoices.filter(c => c.selected).map(c => c.text),
      expandable: choices.expandableChoices.filter(c => c.selected).map(c => c.text),
      adaptable: choices.adaptableChoices.filter(c => c.selected).map(c => c.text),
      reward: choices.rewardChoices.filter(c => c.selected).map(c => c.text),
    };
    
    // Generate prompt for Anthropic
    const prompt = `
      Generate a concise one-sentence summary of a spiritual practice based on the following CLEAR framework choices:
      
      Cue (triggers): ${selectedChoices.cue.join(', ')}
      Low Friction (ease): ${selectedChoices.lowFriction.join(', ')}
      Expandable (growth): ${selectedChoices.expandable.join(', ')}
      Adaptable (flexibility): ${selectedChoices.adaptable.join(', ')}
      Reward (benefits): ${selectedChoices.reward.join(', ')}
      
      The summary should follow this template, but feel natural and vary the words based on the actual choices:
      "This wird is [triggered by X], [takes minimal effort], [can be expanded through Y], [adapts to Z], and [provides rewards A]."
      
      Make it sound natural and flowing, while keeping the same basic structure.
    `;
    
    // Call Anthropic API (implementation needed)
    const summary = await generateWirdSummary(prompt);
    
    res.json({ summary });
  } catch (error) {
    console.error("Error generating CLEAR summary:", error);
    res.status(500).json({ error: "Failed to generate summary" });
  }
});

// Helper function to generate fallback wird suggestions if API fails
function generateFallbackSuggestions(timestamp: number) {
  console.log("[WIRD ROUTES] Generating fallback wird suggestions");
  return [
    {
      id: `wird-${timestamp}-1`,
      type: "Quran",
      category: "Quran",
      name: "Daily Quran Reflection",
      title: "Daily Quran Reflection",
      description: "Set aside time each day to read and reflect on a small portion of the Quran. Focus on understanding the meaning and how it applies to your life.",
      target: 5,
      unit: "minutes",
      duration: "5-10 minutes",
      frequency: "daily"
    },
    {
      id: `wird-${timestamp}-2`,
      type: "Dhikr",
      category: "Dhikr",
      name: "Morning and Evening Adhkar",
      title: "Morning and Evening Adhkar",
      description: "Practice the morning and evening remembrances (adhkar) as taught by the Prophet Muhammad ﷺ to protect yourself and strengthen your connection with Allah.",
      target: 10,
      unit: "minutes",
      duration: "10 minutes",
      frequency: "twice daily"
    },
    {
      id: `wird-${timestamp}-3`,
      type: "Dua",
      category: "Dua",
      name: "Personal Supplication",
      title: "Personal Supplication",
      description: "Take time each day to speak to Allah in your own words, sharing your concerns, hopes, and asking for guidance in your specific situation.",
      target: 5,
      unit: "minutes",
      duration: "5 minutes",
      frequency: "daily"
    }
  ];
}

// POST /api/wirds/generate-suggestions - Generate wird suggestions based on conversation
console.log("🔵 [WIRD ROUTES] Registering POST /api/wirds/generate-suggestions route");
router.post("/generate-suggestions", (req, res, next) => {
  console.log("🔴 [WIRD ROUTES] POST /generate-suggestions route MATCHED!");
  console.log("🔴 [WIRD ROUTES] Request headers:", JSON.stringify(req.headers));
  console.log("🔴 [WIRD ROUTES] Request body:", JSON.stringify(req.body));
  console.log("🔴 [WIRD ROUTES] Calling authRequired middleware...");
  authRequired(req, res, next);
}, async (req: AuthenticatedRequest, res) => {
  console.log("🔴 [WIRD ROUTES] Inside POST /generate-suggestions handler after authRequired");
  console.log("[WIRD ROUTES] Received request to /api/wirds/generate-suggestions");
  console.log("[WIRD ROUTES] Request path:", req.path);
  console.log("[WIRD ROUTES] Request method:", req.method);
  console.log("[WIRD ROUTES] Request headers:", JSON.stringify(req.headers, null, 2));
  
  try {
    const userId = req.user?.id;
    if (!userId) {
      console.log("[WIRD ROUTES] Authentication required but user ID not found");
      return res.status(401).json({ error: "Authentication required" });
    }

    console.log(`[WIRD ROUTES] Generating wird suggestions for user ${userId}`);
    
    // Extract data from request body
    const { conversation, messages, personalizationContext } = req.body;
    
    // Validate the request
    if (!conversation) {
      console.log("[WIRD ROUTES] Missing conversation content in request body");
      return res.status(400).json({ error: "Missing conversation content" });
    }
    
    console.log("[WIRD ROUTES] Request body keys:", Object.keys(req.body));
    console.log("[WIRD ROUTES] Conversation length:", conversation.length, "characters");
    
    // Log personalization context if provided
    if (personalizationContext) {
      console.log("[WIRD ROUTES] Generating wird suggestions with personalization context:", {
        knowledgeLevel: personalizationContext.knowledgeLevel,
        spiritualJourney: personalizationContext.spiritualJourneyStage,
        topicsCount: personalizationContext.topicsOfInterest?.length || 0,
        goalsCount: personalizationContext.primaryGoals?.length || 0,
      });
    } else {
      console.log("[WIRD ROUTES] Generating wird suggestions without personalization");
    }
    
    // Generate timestamp for IDs
    const timestamp = Date.now();
    
    try {
      // Call Claude to generate wird suggestions
      console.log("[WIRD ROUTES] Calling Claude API to generate wird suggestions");
      
      // Custom prompt for generating wird suggestions from conversation
      const customPrompt = `
As an Islamic spiritual mentor, I need your help generating personalized spiritual practice (wird) suggestions based on a reflection conversation.

CONVERSATION CONTEXT:
${conversation}

INSTRUCTION:
Based solely on the specific themes, concerns, and spiritual needs expressed in this conversation, generate 3-5 personalized wird (devotional practice) suggestions that:

1. Address specific spiritual needs, challenges, or goals mentioned in the conversation
2. Connect directly to Islamic concepts or teachings relevant to what was discussed
3. Are practical, specific, and actionable
4. Vary in commitment level (some quick/easy, some deeper)

Each suggestion should:
- Have a clear purpose directly related to something mentioned in the conversation
- Include specific implementation guidance (when, how, what to say/do)
- Be grounded in authentic Islamic practice

Provide your output as a JSON array of wird suggestion objects with these fields:
- id: A unique identifier string (e.g., "wird-{timestamp}-{number}")
- type: A category like "Quran", "Dhikr", "Dua", "Sunnah", or "Charity" 
- category: Same as type
- name: A concise, descriptive title (e.g., "Morning Gratitude Dhikr")
- title: Same as name
- description: A detailed explanation connecting to specific themes from their reflection (3-4 sentences)
- target: A numeric goal (e.g., 5, 10, 33)
- unit: The unit for the target (e.g., "pages", "minutes", "times")
- duration: An estimated time commitment (e.g., "5-10 minutes")
- frequency: How often to practice (e.g., "daily", "weekly")

Response format must be valid JSON only, no markdown or additional text.
`;
      
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.ANTHROPIC_API_KEY || "",
          "anthropic-version": "2023-06-01"
        },
        body: JSON.stringify({
          model: "claude-3-opus-20240229",
          max_tokens: 2000,
          temperature: 0.7,
          system: "You are an insightful Islamic spiritual guide helping Muslims develop personalized spiritual practices.",
          messages: [
            {
              role: "user",
              content: customPrompt
            }
          ]
        })
      });

      if (!response.ok) {
        console.error(`[WIRD ROUTES] Claude API error: ${response.status} - ${response.statusText}`);
        throw new Error(`Failed to generate wird suggestions: ${response.statusText}`);
      }

      const data = await response.json();
      let wirdSuggestions = [];

      // Parse the response
      try {
        // Extract JSON array from response
        const content = data.content[0]?.text || "";
        console.log("[WIRD ROUTES] Claude response received, length:", content.length);
        const jsonMatch = content.match(/\[[\s\S]*\]/);
        
        if (jsonMatch) {
          console.log("[WIRD ROUTES] JSON match found in Claude response");
          wirdSuggestions = JSON.parse(jsonMatch[0]);
          console.log(`[WIRD ROUTES] Successfully parsed ${wirdSuggestions.length} wird suggestions`);
        } else {
          // If no valid JSON found, create fallback suggestions
          console.log("[WIRD ROUTES] No valid JSON found in Claude response, using fallback");
          wirdSuggestions = generateFallbackSuggestions(timestamp);
        }
      } catch (parseError) {
        console.error("[WIRD ROUTES] Error parsing wird suggestions:", parseError);
        wirdSuggestions = generateFallbackSuggestions(timestamp);
      }

      // Ensure all suggestions have required fields
      wirdSuggestions = wirdSuggestions.map((suggestion: any, index: number) => {
        return {
          id: suggestion.id || `wird-${timestamp}-${index + 1}`,
          type: suggestion.type || "General",
          category: suggestion.category || suggestion.type || "General",
          name: suggestion.name || suggestion.title || "Spiritual Practice",
          title: suggestion.title || suggestion.name || "Spiritual Practice",
          description: suggestion.description || "A regular spiritual practice to strengthen your connection with Allah.",
          target: suggestion.target || 1,
          unit: suggestion.unit || "times",
          duration: suggestion.duration || "5-10 minutes",
          frequency: suggestion.frequency || "daily",
        };
      });

      console.log("[WIRD ROUTES] Returning wird suggestions to client");
      return res.json({ wirdSuggestions });
    } catch (error) {
      console.error("[WIRD ROUTES] Error generating wird suggestions:", error);
      console.error("[WIRD ROUTES] Error details:", JSON.stringify(error, null, 2));
      
      // Return fallback suggestions if generation fails
      const fallbackSuggestions = generateFallbackSuggestions(timestamp);
      return res.json({ wirdSuggestions: fallbackSuggestions });
    }
  } catch (error) {
    console.error("[WIRD ROUTES] Error in generate-suggestions endpoint:", error);
    console.error("[WIRD ROUTES] Error stack:", error instanceof Error ? error.stack : "No stack trace available");
    return res.status(500).json({ error: "Failed to generate wird suggestions" });
  }
});

export default router; 