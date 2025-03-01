import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { generateFollowUpQuestions, generateActionItems } from "./lib/anthropic";
import { transcribeAudio } from "./lib/transcription";
import { insertReflectionSchema, insertConversationSchema, Message } from "@shared/schema";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
import multer from "multer";

// Configure multer for in-memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB limit
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

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
      
      try {
        // Use transcription for audio reflections
        const content = data.type === "audio" ? data.transcription! : data.content;
        const generatedQuestions = await generateFollowUpQuestions(content);
        if (generatedQuestions && generatedQuestions.length > 0) {
          questions = generatedQuestions;
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
          { role: "assistant", content: JSON.stringify(questions) },
        ],
        actionItems: [],
      });
      console.log("Created conversation:", conversation.id);

      res.json({ reflection, conversation, questions });
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

      try {
        // Get all previous user messages for context
        const previousMessages = conversation.messages
          .map((msg: Message) => `${msg.role}: ${msg.content}`)
          .filter((msg: string) => !msg.includes('["')); // Filter out the question arrays

        const generatedQuestions = await generateFollowUpQuestions(content, previousMessages);
        if (generatedQuestions && generatedQuestions.length > 0) {
          questions = generatedQuestions;
          console.log("Generated follow-up questions:", questions);
        } else {
          console.warn("Empty questions array returned from API, using fallback questions");
        }
      } catch (error) {
        console.error("Error generating follow-up questions:", error);
        // Continue with default questions instead of failing the request
        console.log("Using fallback questions due to API error");
      }

      messages.push({ role: "assistant" as const, content: JSON.stringify(questions) });

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

      try {
        // Get all previous user messages for context
        const previousMessages = conversation.messages
          .map((msg: Message) => `${msg.role}: ${msg.content}`)
          .filter((msg: string) => !msg.includes('["')); // Filter out the question arrays

        const generatedQuestions = await generateFollowUpQuestions(content, previousMessages);
        if (generatedQuestions && generatedQuestions.length > 0) {
          questions = generatedQuestions;
        }
      } catch (error) {
        console.error("Error generating follow-up questions:", error);
        // Continue with default questions
      }

      messages.push({ role: "assistant" as const, content: JSON.stringify(questions) });

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
        
        try {
          const generatedQuestions = await generateFollowUpQuestions(transcription);
          if (generatedQuestions && generatedQuestions.length > 0) {
            questions = generatedQuestions;
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
            { role: "assistant", content: JSON.stringify(questions) },
          ],
          actionItems: [],
        });
        console.log(`Created conversation for audio with ID: ${conversation.id}`);
        
        res.json({ reflection, conversation, transcription, questions });
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