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
      const data = insertReflectionSchema.parse(req.body);

      // Validate base64 for audio
      if (data.type === "audio" && !data.content.startsWith('data:')) {
        throw new Error("Invalid audio data format");
      }

      const reflection = await storage.createReflection(data);

      const questions = await generateFollowUpQuestions(
        data.transcription || data.content
      );

      const conversation = await storage.createConversation({
        reflectionId: reflection.id,
        messages: [
          { role: "user", content: data.transcription || data.content },
          { role: "assistant", content: JSON.stringify(questions) },
        ],
        actionItems: null,
      });

      res.json({ reflection, conversation, questions });
    } catch (error) {
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

      const messages = [...conversation.messages, { role: "user", content }];
      const questions = await generateFollowUpQuestions(content);
      messages.push({ role: "assistant", content: JSON.stringify(questions) });

      const updatedConversation = await storage.updateConversation(
        conversationId,
        messages
      );

      res.json({ conversation: updatedConversation, questions });
    } catch (error) {
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

      const actionItems = await generateActionItems(conversationText);

      const updatedConversation = await storage.updateConversation(
        conversationId,
        conversation.messages,
        actionItems
      );

      res.json({ conversation: updatedConversation, actionItems });
    } catch (error) {
      res.status(400).json({ 
        error: error instanceof Error ? error.message : "Failed to generate action items" 
      });
    }
  });

  return httpServer;
}