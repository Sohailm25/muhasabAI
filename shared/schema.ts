import { pgTable, text, serial, timestamp, json, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const reflections = pgTable("reflections", {
  id: serial("id").primaryKey(),
  content: text("content").notNull(),
  type: text("type", { enum: ["audio", "text"] }).notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  transcription: text("transcription"),
});

export const conversations = pgTable("conversations", {
  id: serial("id").primaryKey(),
  reflectionId: integer("reflection_id").references(() => reflections.id),
  messages: json("messages").$type<Message[]>().notNull(),
  actionItems: json("action_items").$type<string[]>().default([]),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export type Message = {
  role: "user" | "assistant";
  content: string;
};

export const insertReflectionSchema = createInsertSchema(reflections).pick({
  content: true,
  type: true,
  transcription: true,
});

export const insertConversationSchema = createInsertSchema(conversations).pick({
  reflectionId: true,
  messages: true,
  actionItems: true,
});

export type InsertReflection = z.infer<typeof insertReflectionSchema>;
export type InsertConversation = z.infer<typeof insertConversationSchema>;
export type Reflection = typeof reflections.$inferSelect;
export type Conversation = typeof conversations.$inferSelect;