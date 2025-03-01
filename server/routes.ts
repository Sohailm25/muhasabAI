import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { generateFollowUpQuestions, generateActionItems, generateInsights } from "./lib/anthropic";
import { transcribeAudio } from "./lib/transcription";
import { insertReflectionSchema, insertConversationSchema, Message } from "@shared/schema";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
import multer from "multer";
import { testConnection } from "./db";
import masjidiRouter from "./masjidi-routes";
import express from "express";

// Configure multer for in-memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB limit
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

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

  app.post("/api/reflection", async (req: Request, res: Response) => {
    try {
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
          const transcription = await transcribeAudio(data.content);
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
        const generatedResponse = await generateFollowUpQuestions(content);
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

      // Get custom prompt from request body if provided
      const customPrompt = req.body?.prompt;

      // Default insights in case API fails
      let insights: string[] = [
        "Your journey of self-reflection demonstrates a sincere desire to grow spiritually, as emphasized in Surah Al-Ra'd (13:11): 'Indeed, Allah will not change the condition of a people until they change what is in themselves.'", 
        "Your consistent practice of contemplation aligns with the Prophet's ﷺ emphasis on self-accounting, as he said: 'The wise person is one who takes account of himself and works for what comes after death.' (Tirmidhi)", 
        "Each step of your spiritual journey reflects the concept of ihsan mentioned in the famous hadith of Jibril, where the Prophet ﷺ described it as 'worshiping Allah as if you see Him, for though you do not see Him, He surely sees you.' (Bukhari & Muslim)"
      ];
      
      try {
        const generatedInsights = await generateInsights(conversationText, customPrompt);
        if (generatedInsights && generatedInsights.length > 0) {
          insights = generatedInsights;
        } else {
          console.warn("Empty insights array returned from API, using fallback insights");
        }
      } catch (error) {
        console.error("Error generating insights:", error);
        // Continue with default insights instead of failing the request
        console.log("Using fallback insights due to API error");
      }

      // For now, we don't save insights to the conversation storage
      // This keeps the implementation simpler and storage schema unchanged
      
      res.json({ insights });
    } catch (error) {
      console.error("Error in /api/conversation/insights:", error);
      res.status(500).json({ error: "Failed to generate insights" });
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

  // Add audio-specific endpoint
  app.post("/api/reflection/audio", upload.single("audio"), async (req: Request, res: Response) => {
    try {
      console.log("Audio reflection request received");
      
      // Use type assertion for multer file
      const file = (req as any).file;
      
      if (!file) {
        return res.status(400).json({ error: "No audio file was uploaded" });
      }
      
      console.log(`Received audio file of size ${file.size} bytes`);
      
      // Convert the audio buffer to base64
      const audioBase64 = `data:audio/wav;base64,${file.buffer.toString('base64')}`;
      
      try {
        // Transcribe the audio
        const transcription = await transcribeAudio(audioBase64);
        if (!transcription || transcription.trim().length === 0) {
          return res.status(400).json({
            error: "No speech detected in the audio. Please try again and speak clearly."
          });
        }
        
        console.log("Audio transcription successful:", transcription);
        
        // Create a reflection entry with the transcribed content
        const reflection = await storage.createReflection({
          content: audioBase64,
          type: "audio",
          transcription
        });
        
        // Default questions in case API fails
        let questions: string[] = ["How would you like to expand on your reflection?"];
        let understanding = "Thank you for sharing your reflection.";
        
        try {
          const generatedResponse = await generateFollowUpQuestions(transcription);
          if (generatedResponse && generatedResponse.questions && generatedResponse.questions.length > 0) {
            questions = generatedResponse.questions;
            understanding = generatedResponse.understanding;
            console.log("Generated questions for audio reflection:", questions);
          } else {
            console.warn("Empty questions array returned, using default");
          }
        } catch (error) {
          console.error("Error generating questions for audio:", error);
          // Don't fail the whole request if question generation fails
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
        console.error("Error in audio transcription:", error);
        res.status(500).json({ 
          error: "Failed to process audio reflection",
          details: process.env.NODE_ENV === "development" ? (error instanceof Error ? error.message : String(error)) : undefined
        });
      }
    } catch (error) {
      console.error("Error in /reflection/audio endpoint:", error);
      res.status(500).json({ 
        error: "Failed to process audio reflection",
        details: process.env.NODE_ENV === "development" ? (error instanceof Error ? error.message : String(error)) : undefined
      });
    }
  });

  return httpServer;
}