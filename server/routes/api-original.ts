import { Router } from "express";
import { storage } from "../storage";
import { generateResponse, generateFollowUpQuestions, generateActionItems } from "../lib/anthropic";
import { transcribeAudio } from "../lib/transcription";
import multer from "multer";
import { Message } from "@shared/schema";
import { 
  searchMasjidsByZipCode, 
  getMasjidDetails, 
  getMasjidPrayerTimes, 
  getMasjidWeeklyPrayerTimes 
} from "../lib/masjidi-api";

// Configure multer for in-memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB limit
  },
});

const router = Router();

// Log environment mode and storage type
console.log(`API Routes initialized: NODE_ENV=${process.env.NODE_ENV || 'development'}`);
console.log(`Storage mode: ${process.env.DATABASE_URL ? 'Database' : 'In-Memory'}`);

// Healthcheck endpoint
router.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Post a new reflection - text input
router.post("/reflection", async (req, res) => {
  try {
    const { content, type = "text" } = req.body;

    if (!content) {
      return res.status(400).json({ error: "Content is required" });
    }

    console.log(`Received ${type} reflection with content length: ${content.length}`);

    // Create reflection
    const reflection = await storage.createReflection({
      content,
      type,
      transcription: null,
    });
    console.log(`Created reflection with ID: ${reflection.id}`);

    // Generate follow-up questions
    let questions: string[] = [];
    try {
      questions = await generateFollowUpQuestions(content);
      console.log(`Generated ${questions.length} follow-up questions`);
    } catch (error) {
      console.error("Error generating questions:", error);
      questions = ["How would you like to expand on your reflection?"];
    }

    // Create conversation with initial messages
    const conversation = await storage.createConversation({
      reflectionId: reflection.id,
      messages: [
        { role: "user", content },
        { role: "assistant", content: JSON.stringify(questions) },
      ],
      actionItems: [],
    });
    console.log(`Created conversation with ID: ${conversation.id}`);

    res.json({ reflection, conversation, questions });
  } catch (error) {
    console.error("Error in /reflection endpoint:", error);
    res.status(500).json({ 
      error: "Failed to process reflection",
      details: process.env.NODE_ENV === "development" ? (error instanceof Error ? error.message : String(error)) : undefined
    });
  }
});

// Post a new reflection - audio input
router.post("/reflection/audio", upload.single("audio"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "Audio file is required" });
    }

    console.log("Received audio file, size:", req.file.size);

    // Process audio
    const transcription = await transcribeAudio(req.file.buffer);
    
    if (!transcription) {
      return res.status(400).json({ error: "Failed to transcribe audio" });
    }

    console.log("Transcribed audio:", transcription);

    // Create reflection
    const reflection = await storage.createReflection({
      content: transcription,
      type: "audio",
      transcription,
    });
    console.log(`Created audio reflection with ID: ${reflection.id}`);

    // Generate follow-up questions
    let questions: string[] = [];
    let understanding = "Thank you for sharing your reflection.";
    try {
      const generatedResponse = await generateFollowUpQuestions(transcription);
      if (generatedResponse && generatedResponse.questions && generatedResponse.questions.length > 0) {
        questions = generatedResponse.questions;
        understanding = generatedResponse.understanding;
        console.log(`Generated ${questions.length} follow-up questions for audio`);
      } else {
        console.error("Error generating questions for audio: no valid response received");
        questions = ["How would you like to expand on your reflection?"];
      }
    } catch (error) {
      console.error("Error generating questions for audio:", error);
      questions = ["How would you like to expand on your reflection?"];
    }

    // Create conversation with initial messages
    const conversation = await storage.createConversation({
      reflectionId: reflection.id,
      messages: [
        { role: "user", content: transcription },
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
    console.log(`Created conversation for audio with ID: ${conversation.id}`);

    res.json({ 
      reflection, 
      conversation, 
      transcription, 
      understanding,
      questions 
    });
  } catch (error) {
    console.error("Error in /reflection/audio endpoint:", error);
    res.status(500).json({ 
      error: "Failed to process audio reflection",
      details: process.env.NODE_ENV === "development" ? (error instanceof Error ? error.message : String(error)) : undefined
    });
  }
});

// Get a reflection by ID
router.get("/reflection/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid reflection ID" });
    }
    
    const reflection = await storage.getReflection(id);
    
    if (!reflection) {
      return res.status(404).json({ error: "Reflection not found" });
    }
    
    res.json(reflection);
  } catch (error) {
    console.error(`Error getting reflection ${req.params.id}:`, error);
    res.status(500).json({ 
      error: "Failed to retrieve reflection",
      details: process.env.NODE_ENV === "development" ? (error instanceof Error ? error.message : String(error)) : undefined
    });
  }
});

// Get a conversation by ID
router.get("/conversation/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid conversation ID" });
    }
    
    const conversation = await storage.getConversation(id);
    
    if (!conversation) {
      return res.status(404).json({ error: "Conversation not found" });
    }
    
    res.json(conversation);
  } catch (error) {
    console.error(`Error getting conversation ${req.params.id}:`, error);
    res.status(500).json({ 
      error: "Failed to retrieve conversation",
      details: process.env.NODE_ENV === "development" ? (error instanceof Error ? error.message : String(error)) : undefined
    });
  }
});

// Add a message to an existing conversation
router.post("/conversation/:id/message", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { content } = req.body;
    
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid conversation ID" });
    }
    
    if (!content) {
      return res.status(400).json({ error: "Message content is required" });
    }
    
    console.log(`Adding message to conversation ${id}`);
    const conversation = await storage.getConversation(id);
    
    if (!conversation) {
      return res.status(404).json({ error: "Conversation not found" });
    }
    
    // Add user message
    const messages = [...conversation.messages, { role: "user", content }];
    
    // Get previous messages as strings for context
    const previousMessages = conversation.messages.map(
      msg => `${msg.role}: ${msg.content}`
    );
    
    // Generate follow-up questions based on the new content and previous messages
    let questions: string[] = [];
    try {
      questions = await generateFollowUpQuestions(content, previousMessages);
      console.log(`Generated ${questions.length} follow-up questions for response`);
    } catch (error) {
      console.error("Error generating follow-up questions:", error);
      questions = ["How would you like to continue with your reflection?"];
    }
    
    // Add assistant response
    messages.push({ role: "assistant", content: JSON.stringify(questions) });
    
    // Update conversation with new messages
    const updatedConversation = await storage.updateConversation(id, messages);
    
    res.json({ conversation: updatedConversation, questions });
  } catch (error) {
    console.error(`Error adding message to conversation ${req.params.id}:`, error);
    res.status(500).json({ 
      error: "Failed to add message to conversation",
      details: process.env.NODE_ENV === "development" ? (error instanceof Error ? error.message : String(error)) : undefined
    });
  }
});

// Generate action items for a conversation
router.post("/conversation/:id/action-items", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid conversation ID" });
    }
    
    const conversation = await storage.getConversation(id);
    
    if (!conversation) {
      return res.status(404).json({ error: "Conversation not found" });
    }
    
    console.log(`Generating action items for conversation ${id}`);
    
    // Generate action items by passing the entire messages array
    const actionItems = await generateActionItems(conversation.messages);
    console.log(`Generated ${actionItems.length} action items`);
    
    // Update conversation with action items
    const updatedConversation = await storage.updateConversation(
      id,
      conversation.messages,
      actionItems
    );
    
    res.json({ conversation: updatedConversation, actionItems });
  } catch (error) {
    console.error(`Error generating action items for conversation ${req.params.id}:`, error);
    res.status(500).json({ 
      error: "Failed to generate action items",
      details: process.env.NODE_ENV === "development" ? (error instanceof Error ? error.message : String(error)) : undefined
    });
  }
});

// Add a symlink between /message and /respond endpoints
router.post("/conversation/:id/respond", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { content } = req.body;
    
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid conversation ID" });
    }
    
    if (!content) {
      return res.status(400).json({ error: "Message content is required" });
    }
    
    console.log(`Adding response to conversation ${id} (using /respond endpoint)`);
    const conversation = await storage.getConversation(id);
    
    if (!conversation) {
      return res.status(404).json({ error: "Conversation not found" });
    }
    
    // Add user message
    const messages = [...conversation.messages, { role: "user", content }];
    
    // Get previous messages as strings for context
    const previousMessages = conversation.messages.map(
      msg => `${msg.role}: ${msg.content}`
    );
    
    // Generate follow-up questions based on the new content and previous messages
    let questions: string[] = [];
    try {
      questions = await generateFollowUpQuestions(content, previousMessages);
      console.log(`Generated ${questions.length} follow-up questions for response`);
    } catch (error) {
      console.error("Error generating follow-up questions:", error);
      questions = ["How would you like to continue with your reflection?"];
    }
    
    // Add assistant response
    messages.push({ role: "assistant", content: JSON.stringify(questions) });
    
    // Update conversation with new messages
    const updatedConversation = await storage.updateConversation(id, messages);
    
    res.json({ conversation: updatedConversation, questions });
  } catch (error) {
    console.error(`Error adding response to conversation ${req.params.id}:`, error);
    res.status(500).json({ 
      error: "Failed to add response to conversation",
      details: process.env.NODE_ENV === "development" ? (error instanceof Error ? error.message : String(error)) : undefined
    });
  }
});

// ============= Masjidi API Endpoints =============

// Search masjids by zip code
router.get("/masjids/search", async (req, res) => {
  try {
    const zipCode = req.query.zipcode as string;
    
    if (!zipCode) {
      return res.status(400).json({ error: "Zip code is required" });
    }
    
    const masjids = await searchMasjidsByZipCode(zipCode);
    res.json(masjids);
  } catch (error) {
    console.error("Error searching for masjids:", error);
    res.status(500).json({ 
      error: "Failed to search for masjids",
      details: process.env.NODE_ENV === "development" ? (error instanceof Error ? error.message : String(error)) : undefined
    });
  }
});

// Get masjid details
router.get("/masjids/:id", async (req, res) => {
  try {
    const masjidId = req.params.id;
    
    if (!masjidId) {
      return res.status(400).json({ error: "Masjid ID is required" });
    }
    
    const masjid = await getMasjidDetails(masjidId);
    res.json(masjid);
  } catch (error) {
    console.error(`Error getting masjid details for ID ${req.params.id}:`, error);
    res.status(500).json({ 
      error: "Failed to get masjid details",
      details: process.env.NODE_ENV === "development" ? (error instanceof Error ? error.message : String(error)) : undefined
    });
  }
});

// Get prayer times for a specific masjid
router.get("/masjids/:id/prayertimes", async (req, res) => {
  try {
    const masjidId = req.params.id;
    const date = req.query.date as string;
    
    if (!masjidId) {
      return res.status(400).json({ error: "Masjid ID is required" });
    }
    
    const prayerTimes = await getMasjidPrayerTimes(masjidId, date);
    res.json(prayerTimes);
  } catch (error) {
    console.error(`Error getting prayer times for masjid ID ${req.params.id}:`, error);
    res.status(500).json({ 
      error: "Failed to get prayer times",
      details: process.env.NODE_ENV === "development" ? (error instanceof Error ? error.message : String(error)) : undefined
    });
  }
});

// Get weekly prayer times for a specific masjid
router.get("/masjids/:id/prayertimes/week", async (req, res) => {
  try {
    const masjidId = req.params.id;
    
    if (!masjidId) {
      return res.status(400).json({ error: "Masjid ID is required" });
    }
    
    const weeklyPrayerTimes = await getMasjidWeeklyPrayerTimes(masjidId);
    res.json(weeklyPrayerTimes);
  } catch (error) {
    console.error(`Error getting weekly prayer times for masjid ID ${req.params.id}:`, error);
    res.status(500).json({ 
      error: "Failed to get weekly prayer times",
      details: process.env.NODE_ENV === "development" ? (error instanceof Error ? error.message : String(error)) : undefined
    });
  }
});

// ============= User Settings API Endpoints =============

// Get user settings
router.get("/user/settings", async (req, res) => {
  try {
    // For simplicity, we're using a hardcoded user ID
    // In a real app, this would come from authentication
    const userId = "default-user";
    
    let userSettings = await storage.getUserSettings(userId);
    
    // If no settings exist yet, create default settings
    if (!userSettings) {
      userSettings = await storage.saveUserSettings({
        userId,
        name: null,
        email: null,
        preferences: {
          emailNotifications: false,
          darkMode: false,
          saveHistory: true
        }
      });
    }
    
    res.json(userSettings);
  } catch (error) {
    console.error("Error getting user settings:", error);
    res.status(500).json({ 
      error: "Failed to get user settings",
      details: process.env.NODE_ENV === "development" ? (error instanceof Error ? error.message : String(error)) : undefined
    });
  }
});

// Save or update user settings
router.post("/user/settings", async (req, res) => {
  try {
    // For simplicity, we're using a hardcoded user ID
    // In a real app, this would come from authentication
    const userId = "default-user";
    
    const { name, email, preferences } = req.body;
    
    // Try to get existing settings
    const existingSettings = await storage.getUserSettings(userId);
    
    let userSettings;
    
    if (existingSettings) {
      // Update existing settings
      userSettings = await storage.updateUserSettings(userId, {
        name: name !== undefined ? name : existingSettings.name,
        email: email !== undefined ? email : existingSettings.email,
        preferences: preferences !== undefined ? preferences : existingSettings.preferences
      });
    } else {
      // Create new settings
      userSettings = await storage.saveUserSettings({
        userId,
        name: name || null,
        email: email || null,
        preferences: preferences || {
          emailNotifications: false,
          darkMode: false,
          saveHistory: true
        }
      });
    }
    
    res.json(userSettings);
  } catch (error) {
    console.error("Error saving user settings:", error);
    res.status(500).json({ 
      error: "Failed to save user settings",
      details: process.env.NODE_ENV === "development" ? (error instanceof Error ? error.message : String(error)) : undefined
    });
  }
});

// Set preferred masjid
router.post("/user/settings/masjid", async (req, res) => {
  try {
    // For simplicity, we're using a hardcoded user ID
    // In a real app, this would come from authentication
    const userId = "default-user";
    
    const { masjidId } = req.body;
    
    if (!masjidId) {
      return res.status(400).json({ error: "Masjid ID is required" });
    }
    
    // Get masjid details
    const masjid = await getMasjidDetails(masjidId);
    
    // Get existing user settings
    let userSettings = await storage.getUserSettings(userId);
    
    // If no settings exist yet, create default settings
    if (!userSettings) {
      userSettings = await storage.saveUserSettings({
        userId,
        name: null,
        email: null,
        preferences: {
          emailNotifications: false,
          darkMode: false,
          saveHistory: true,
          selectedMasjid: {
            id: masjid._id,
            name: masjid.name,
            address: `${masjid.address}, ${masjid.city}, ${masjid.state} ${masjid.zip}`,
            zipCode: masjid.zip
          }
        }
      });
    } else {
      // Update existing settings with new masjid
      const updatedPreferences = {
        ...userSettings.preferences,
        selectedMasjid: {
          id: masjid._id,
          name: masjid.name,
          address: `${masjid.address}, ${masjid.city}, ${masjid.state} ${masjid.zip}`,
          zipCode: masjid.zip
        }
      };
      
      userSettings = await storage.updateUserSettings(userId, {
        preferences: updatedPreferences
      });
    }
    
    res.json(userSettings);
  } catch (error) {
    console.error("Error setting preferred masjid:", error);
    res.status(500).json({ 
      error: "Failed to set preferred masjid",
      details: process.env.NODE_ENV === "development" ? (error instanceof Error ? error.message : String(error)) : undefined
    });
  }
});

export default router; 