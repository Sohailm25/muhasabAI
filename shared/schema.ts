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

export const userSettings = pgTable("user_settings", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().unique(),
  name: text("name"),
  email: text("email"),
  preferences: json("preferences").$type<UserPreferences>().notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export type Message = {
  role: "user" | "assistant";
  content: string;
};

export type Masjid = {
  id: string;
  name: string;
  address: string;
  zipCode: string;
};

export type UserPreferences = {
  emailNotifications: boolean;
  darkMode: boolean;
  saveHistory: boolean;
  selectedMasjid?: Masjid;
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

export const userPreferencesSchema = z.object({
  emailNotifications: z.boolean().default(false),
  darkMode: z.boolean().default(false),
  saveHistory: z.boolean().default(true),
  selectedMasjid: z.object({
    id: z.string(),
    name: z.string(),
    address: z.string(),
    zipCode: z.string()
  }).optional(),
});

export const insertUserSettingsSchema = createInsertSchema(userSettings).pick({
  userId: true,
  name: true,
  email: true,
}).extend({
  preferences: userPreferencesSchema,
});

export type InsertReflection = z.infer<typeof insertReflectionSchema>;
export type InsertConversation = z.infer<typeof insertConversationSchema>;
export type InsertUserSettings = z.infer<typeof insertUserSettingsSchema>;
export type Reflection = typeof reflections.$inferSelect;
export type Conversation = typeof conversations.$inferSelect;
export type UserSettings = typeof userSettings.$inferSelect;