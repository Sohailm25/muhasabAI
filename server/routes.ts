import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { generateFollowUpQuestions, generateActionItems } from "./lib/anthropic";
import { transcribeAudio } from "./lib/transcription";
import { insertReflectionSchema, insertConversationSchema } from "@shared/schema";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  app.post("/api/reflection", async (req, res) => {
    try {
      console.log("Reflection request body:", {
        type: req.body.type,
        contentLength: req.body.content?.length,
        hasTranscription: !!req.body.transcription
      });

      const data = insertReflectionSchema.parse(req.body);
      console.log("Parsed reflection data successfully");

      // Validate base64 for audio
      if (data.type === "audio" && !data.content.startsWith('data:')) {
        throw new Error("Invalid audio data format");
      }

      // Handle audio transcription
      if (data.type === "audio") {
        try {
          const transcription = await transcribeAudio(data.content);
          data.transcription = transcription;
          console.log("Transcribed audio successfully:", transcription);
        } catch (error) {
          console.error("Error transcribing audio:", error);
          throw new Error("Failed to transcribe audio reflection. Please try again.");
        }
      }

      const reflection = await storage.createReflection(data);
      console.log("Created reflection:", reflection.id);

      let questions: string[] = [];
      try {
        // Use transcription for audio reflections
        const content = data.type === "audio" ? data.transcription! : data.content;
        questions = await generateFollowUpQuestions(content);
        console.log("Generated questions:", questions);
      } catch (error) {
        console.error("Error generating questions:", error);
        throw new Error("Failed to generate relevant follow-up questions. Please try again.");
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
      res.status(400).json({ 
        error: error instanceof Error ? error.message : "Failed to save reflection" 
      });
    }
  });

  app.post("/api/conversation/:id/respond", async (req, res) => {
    try {
      const conversationId = parseInt(req.params.id);
      const { content } = req.body;

      if (!content || typeof content !== 'string') {
        throw new Error("Content is required");
      }

      const conversation = await storage.getConversation(conversationId);
      if (!conversation) {
        return res.status(404).json({ error: "Conversation not found" });
      }

      const messages = [...conversation.messages, { role: "user" as const, content }];
      let questions: string[] = [];

      try {
        // Get all previous user messages for context
        const previousMessages = conversation.messages
          .map(msg => `${msg.role}: ${msg.content}`)
          .filter(msg => !msg.includes('["')); // Filter out the question arrays

        questions = await generateFollowUpQuestions(content, previousMessages);
      } catch (error) {
        console.error("Error generating follow-up questions:", error);
        throw new Error("Failed to generate relevant follow-up questions. Please try again.");
      }

      messages.push({ role: "assistant" as const, content: JSON.stringify(questions) });

      const updatedConversation = await storage.updateConversation(
        conversationId,
        messages
      );

      res.json({ conversation: updatedConversation, questions });
    } catch (error) {
      console.error("Error in /api/conversation/respond:", error);
      res.status(400).json({ 
        error: error instanceof Error ? error.message : "Failed to save response" 
      });
    }
  });

  app.post("/api/conversation/:id/action-items", async (req, res) => {
    try {
      const conversationId = parseInt(req.params.id);
      const conversation = await storage.getConversation(conversationId);

      if (!conversation) {
        return res.status(404).json({ error: "Conversation not found" });
      }

      const conversationText = conversation.messages
        .map((msg) => `${msg.role}: ${msg.content}`)
        .join("\n");

      let actionItems: string[];
      try {
        actionItems = await generateActionItems(conversationText);
      } catch (error) {
        console.error("Error generating action items:", error);
        throw new Error("Failed to generate action items. Please try again.");
      }

      const updatedConversation = await storage.updateConversation(
        conversationId,
        conversation.messages,
        actionItems
      );

      res.json({ conversation: updatedConversation, actionItems });
    } catch (error) {
      console.error("Error in /api/conversation/action-items:", error);
      res.status(400).json({ 
        error: error instanceof Error ? error.message : "Failed to generate action items" 
      });
    }
  });

  return httpServer;
}