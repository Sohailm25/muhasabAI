import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { generateFollowUpQuestions, generateActionItems } from "./lib/anthropic";
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

      const reflection = await storage.createReflection(data);
      console.log("Created reflection:", reflection.id);

      let questions: string[] = [];
      try {
        questions = await generateFollowUpQuestions(
          data.transcription || data.content
        );
        console.log("Generated questions:", questions);
      } catch (error) {
        console.error("Error generating questions:", error);
        throw new Error("Failed to generate relevant follow-up questions. Please try again.");
      }

      const conversation = await storage.createConversation({
        reflectionId: reflection.id,
        messages: [
          { role: "user", content: data.transcription || data.content },
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
        questions = await generateFollowUpQuestions(content);
      } catch (error) {
        console.error("Error generating follow-up questions:", error);
        questions = [
          "Could you elaborate more on that point?",
          "How does this connect to your earlier reflections?",
          "What practical steps can you take based on this insight?"
        ];
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
        actionItems = [
          "Schedule dedicated time for daily Quran recitation and reflection",
          "Identify and work on one specific area of personal improvement",
          "Plan acts of kindness and charity for the community"
        ];
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