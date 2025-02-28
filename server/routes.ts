import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { generateFollowUpQuestions, generateActionItems } from "./lib/anthropic";
import { insertReflectionSchema, insertConversationSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  app.post("/api/reflection", async (req, res) => {
    try {
      const data = insertReflectionSchema.parse(req.body);
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
        actionItems: [],
      });

      res.json({ reflection, conversation, questions });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  app.post("/api/conversation/:id/respond", async (req, res) => {
    try {
      const conversationId = parseInt(req.params.id);
      const { content } = req.body;
      
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
      res.status(400).json({ error: error.message });
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
      res.status(400).json({ error: error.message });
    }
  });

  return httpServer;
}
