import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { generateFollowUpQuestions, generateActionItems } from "./lib/anthropic";
import { transcribeAudio } from "./lib/transcription";
import { insertReflectionSchema, insertConversationSchema, Message } from "@shared/schema";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";

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

      let questions: string[] = [];
      try {
        // Use transcription for audio reflections
        const content = data.type === "audio" ? data.transcription! : data.content;
        questions = await generateFollowUpQuestions(content);
        console.log("Generated questions:", questions);
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
      let questions: string[] = [];

      try {
        // Get all previous user messages for context
        const previousMessages = conversation.messages
          .map((msg: Message) => `${msg.role}: ${msg.content}`)
          .filter((msg: string) => !msg.includes('["')); // Filter out the question arrays

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
      return res.status(error instanceof Error && error.message.includes("404") ? 404 : 500).json({ 
        error: error instanceof Error ? error.message : "Failed to generate action items" 
      });
    }
  });

  return httpServer;
}