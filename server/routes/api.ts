import { Router } from "express";
import { storage } from "../storage";
import { generateResponse, generateFollowUpQuestions, generateActionItems } from "../lib/anthropic";
import { transcribeAudio } from "../lib/transcription";
import multer from "multer";
import { Message } from "@shared/schema";

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

export default router; 