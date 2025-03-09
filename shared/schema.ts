import { pgTable, text, serial, timestamp, json, integer, boolean, date, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const reflections = pgTable("reflections", {
  id: serial("id").primaryKey(),
  content: text("content").notNull(),
  type: text("type", { enum: ["audio", "text"] }).notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  transcription: text("transcription"),
  audioData: text("audio_data"),
});

export const conversations = pgTable("conversations", {
  id: serial("id").primaryKey(),
  reflectionId: integer("reflection_id").references(() => reflections.id),
  messages: json("messages").$type<Message[]>().notNull(),
  actionItems: json("action_items").$type<string[]>().default([]),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export const halaqas = pgTable("halaqas", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  title: text("title").notNull(),
  speaker: text("speaker"),
  date: date("date").notNull(),
  topic: text("topic").notNull(),
  keyReflection: text("key_reflection").notNull(),
  impact: text("impact").notNull(),
  actionItems: json("action_items").$type<HalaqaActionItem[]>().default([]),
  wirdSuggestions: json("wird_suggestions").$type<WirdSuggestion[]>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  isArchived: boolean("is_archived").default(false),
});

export const userSettings = pgTable("user_settings", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().unique(),
  name: text("name"),
  email: text("email"),
  preferences: json("preferences").$type<UserPreferences>().notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export const wirds = pgTable("wirds", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  date: date("date").notNull(),
  practices: json("practices").$type<WirdPractice[]>().notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  isArchived: boolean("is_archived").default(false),
});

export const identity_frameworks = pgTable("identity_frameworks", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").notNull(),
  title: text("title").notNull(),
  completionPercentage: integer("completion_percentage").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const framework_components = pgTable("framework_components", {
  id: uuid("id").defaultRandom().primaryKey(),
  frameworkId: uuid("framework_id").notNull(),
  componentType: text("component_type").notNull(),
  content: json("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const habit_tracking = pgTable("habit_tracking", {
  id: uuid("id").defaultRandom().primaryKey(),
  componentId: uuid("component_id").notNull(),
  habitIndex: integer("habit_index").notNull(),
  currentStreak: integer("current_streak").default(0).notNull(),
  longestStreak: integer("longest_streak").default(0).notNull(),
  lastCompleted: timestamp("last_completed"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
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

export type HalaqaActionItem = {
  id: string;
  description: string;
  completed: boolean;
  completedDate?: Date;
};

export type WirdPractice = {
  id: string;
  name: string;
  type: 'general' | 'rakat' | 'dhikr';
  status: 'completed' | 'incomplete';
  count?: number;
  notes?: string;
};

export type WirdSuggestion = {
  id: string;
  name: string;
  title?: string;
  type?: string;
  category?: string;
  target?: number;
  unit?: string;
};

export interface CLEARFrameworkChoice {
  id: string;
  text: string;
  selected: boolean;
}

export interface CLEARFrameworkData {
  cueChoices: CLEARFrameworkChoice[];
  lowFrictionChoices: CLEARFrameworkChoice[];
  expandableChoices: CLEARFrameworkChoice[];
  adaptableChoices: CLEARFrameworkChoice[];
  rewardChoices: CLEARFrameworkChoice[];
  summary: string;
}

export interface WirdEntry {
  id: string;
  title: string;
  date: Date;
  practices: WirdPractice[];
  notes?: string;
  clearFramework?: CLEARFrameworkData;
  sourceType?: 'reflection' | 'halaqa';
  sourceId?: number;
}

export type Halaqa = {
  id: number;
  userId: string;
  title: string;
  speaker: string | null;
  date: string | Date;
  topic: string;
  keyReflection: string;
  impact: string;
  actionItems: HalaqaActionItem[] | null;
  wirdSuggestions?: WirdSuggestion[];
  createdAt: Date;
  updatedAt: Date;
  isArchived: boolean | null;
};

export const insertReflectionSchema = createInsertSchema(reflections).pick({
  content: true,
  type: true,
  transcription: true,
  audioData: true,
});

export const insertConversationSchema = createInsertSchema(conversations).pick({
  reflectionId: true,
  messages: true,
  actionItems: true,
});

export const insertHalaqaSchema = createInsertSchema(halaqas).pick({
  userId: true,
  title: true,
  speaker: true,
  date: true,
  topic: true,
  keyReflection: true,
  impact: true,
});

export const updateHalaqaSchema = createInsertSchema(halaqas).pick({
  title: true,
  speaker: true,
  date: true,
  topic: true,
  keyReflection: true,
  impact: true,
  isArchived: true,
}).partial();

export const halaqaActionItemSchema = z.object({
  id: z.string().optional(),
  description: z.string(),
  completed: z.boolean().default(false),
  completedDate: z.date().optional(),
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

export const insertWirdSchema = createInsertSchema(wirds).pick({
  userId: true,
  date: true,
  practices: true,
  notes: true,
});

export const updateWirdSchema = createInsertSchema(wirds).pick({
  practices: true,
  notes: true,
  isArchived: true,
}).partial();

export type InsertReflection = z.infer<typeof insertReflectionSchema>;
export type InsertConversation = z.infer<typeof insertConversationSchema>;
export type InsertHalaqa = z.infer<typeof insertHalaqaSchema>;
export type UpdateHalaqa = z.infer<typeof updateHalaqaSchema>;
export type InsertUserSettings = z.infer<typeof insertUserSettingsSchema>;
export type InsertWird = z.infer<typeof insertWirdSchema>;
export type UpdateWird = z.infer<typeof updateWirdSchema>;
export type Reflection = typeof reflections.$inferSelect;
export type Conversation = typeof conversations.$inferSelect;
export type HalaqaRow = typeof halaqas.$inferSelect;
export type UserSettings = typeof userSettings.$inferSelect;
export type WirdRow = typeof wirds.$inferSelect;

export type IdentityFramework = {
  id: string;
  userId: string;
  title: string;
  completionPercentage: number;
  createdAt: Date;
  updatedAt: Date;
};

export type FrameworkComponent = {
  id: string;
  frameworkId: string;
  componentType: string;
  content: any;
  createdAt: Date;
  updatedAt: Date;
};

export type HabitTracking = {
  id: string;
  componentId: string;
  habitIndex: number;
  currentStreak: number;
  longestStreak: number;
  lastCompleted: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type IdentityFrameworkRow = typeof identity_frameworks.$inferSelect;
export type FrameworkComponentRow = typeof framework_components.$inferSelect;
export type HabitTrackingRow = typeof habit_tracking.$inferSelect;

export const AddWirdSchema = {
  type: 'object',
  properties: {
    userId: { type: 'string' },
    date: { type: 'string', pattern: '^\d{4}-\d{2}-\d{2}$' },
    practices: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          category: { type: 'string' },
          target: { type: 'number', minimum: 1 },
          completed: { type: 'number', default: 0 },
          unit: { type: 'string' },
          isCompleted: { type: 'boolean', default: false },
        },
        required: ['name', 'category', 'target'],
      },
    },
    notes: { type: 'string' },
    sourceType: { type: 'string', enum: ['reflection', 'halaqa'] },
    sourceId: { type: 'number' },
  },
  required: ['userId', 'date', 'practices'],
};

export const WirdPracticeSchema = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    name: { type: 'string' },
    type: { type: 'string', enum: ['general', 'rakat', 'dhikr'] },
    status: { type: 'string', enum: ['completed', 'incomplete'] },
    count: { type: 'number' },
    notes: { type: 'string' },
  },
  required: ['id', 'name', 'type', 'status'],
};

export const UpdatePracticesSchema = {
  type: 'array',
  items: WirdPracticeSchema,
};