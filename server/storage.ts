import { 
  Reflection, 
  InsertReflection, 
  Conversation, 
  InsertConversation, 
  UserSettings,
  InsertUserSettings,
  Message,
  UserPreferences
} from "@shared/schema";
import { db } from "./db";
import { reflections, conversations, userSettings } from "@shared/schema";
import { eq } from "drizzle-orm";

// For type safety with process.env
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV?: string;
      DATABASE_URL?: string;
    }
  }
}

export interface IStorage {
  createReflection(reflection: InsertReflection): Promise<Reflection>;
  getReflection(id: number): Promise<Reflection | undefined>;
  createConversation(conversation: InsertConversation): Promise<Conversation>;
  getConversation(id: number): Promise<Conversation | undefined>;
  updateConversation(id: number, messages: Message[], actionItems?: string[]): Promise<Conversation>;
  getUserSettings(userId: string): Promise<UserSettings | undefined>;
  saveUserSettings(settings: InsertUserSettings): Promise<UserSettings>;
  updateUserSettings(userId: string, settings: Partial<InsertUserSettings>): Promise<UserSettings>;
}

// Memory storage implementation for development or testing
export class MemStorage implements IStorage {
  private reflections: Map<number, Reflection> = new Map();
  private conversations: Map<number, Conversation> = new Map();
  private userSettingsMap: Map<string, UserSettings> = new Map();
  private currentReflectionId = 1;
  private currentConversationId = 1;
  private currentUserSettingsId = 1;

  async createReflection(reflection: InsertReflection): Promise<Reflection> {
    const id = this.currentReflectionId++;
    const newReflection: Reflection = {
      ...reflection,
      id,
      timestamp: new Date(),
      transcription: reflection.transcription || null,
    };
    this.reflections.set(id, newReflection);
    return newReflection;
  }

  async getReflection(id: number): Promise<Reflection | undefined> {
    return this.reflections.get(id);
  }

  async createConversation(conversation: InsertConversation): Promise<Conversation> {
    const id = this.currentConversationId++;
    const newConversation: Conversation = {
      ...conversation,
      id,
      timestamp: new Date(),
    };
    this.conversations.set(id, newConversation);
    return newConversation;
  }

  async getConversation(id: number): Promise<Conversation | undefined> {
    return this.conversations.get(id);
  }

  async updateConversation(
    id: number,
    messages: Message[],
    actionItems?: string[]
  ): Promise<Conversation> {
    const conversation = await this.getConversation(id);
    if (!conversation) {
      throw new Error(`Conversation with id ${id} not found`);
    }

    const updatedConversation: Conversation = {
      ...conversation,
      messages,
      ...(actionItems !== undefined ? { actionItems } : {}),
    };
    this.conversations.set(id, updatedConversation);
    return updatedConversation;
  }

  async getUserSettings(userId: string): Promise<UserSettings | undefined> {
    for (const settings of this.userSettingsMap.values()) {
      if (settings.userId === userId) {
        return settings;
      }
    }
    return undefined;
  }

  async saveUserSettings(settings: InsertUserSettings): Promise<UserSettings> {
    const existingSettings = await this.getUserSettings(settings.userId);
    
    if (existingSettings) {
      return this.updateUserSettings(settings.userId, settings);
    }
    
    const id = this.currentUserSettingsId++;
    const newSettings: UserSettings = {
      ...settings,
      id,
      timestamp: new Date(),
      name: settings.name || null,
      email: settings.email || null
    };
    this.userSettingsMap.set(settings.userId, newSettings);
    return newSettings;
  }

  async updateUserSettings(userId: string, settings: Partial<InsertUserSettings>): Promise<UserSettings> {
    const existingSettings = await this.getUserSettings(userId);
    
    if (!existingSettings) {
      throw new Error(`No settings found for user ${userId}`);
    }
    
    const updatedSettings: UserSettings = {
      ...existingSettings,
      ...settings,
      userId: existingSettings.userId, // Ensure userId doesn't change
      timestamp: new Date(),
      // Ensure null instead of undefined for compatibility
      name: settings.name !== undefined ? settings.name : existingSettings.name,
      email: settings.email !== undefined ? settings.email : existingSettings.email
    };
    
    this.userSettingsMap.set(userId, updatedSettings);
    return updatedSettings;
  }
}

// Database storage implementation
export class DbStorage implements IStorage {
  async createReflection(reflection: InsertReflection): Promise<Reflection> {
    if (!db) throw new Error("Database not initialized");

    const results = await db
      .insert(reflections)
      .values(reflection)
      .returning();
    return results[0];
  }

  async getReflection(id: number): Promise<Reflection | undefined> {
    if (!db) return undefined;

    const results = await db
      .select()
      .from(reflections)
      .where(eq(reflections.id, id))
      .limit(1);
    return results[0];
  }

  async createConversation(conversation: InsertConversation): Promise<Conversation> {
    if (!db) throw new Error("Database not initialized");

    const results = await db
      .insert(conversations)
      .values(conversation)
      .returning();
    return results[0];
  }

  async getConversation(id: number): Promise<Conversation | undefined> {
    if (!db) return undefined;

    const results = await db
      .select()
      .from(conversations)
      .where(eq(conversations.id, id))
      .limit(1);
    return results[0];
  }

  async updateConversation(
    id: number,
    messages: Message[],
    actionItems?: string[]
  ): Promise<Conversation> {
    if (!db) throw new Error("Database not initialized");

    const updateData: Partial<Conversation> = { messages };
    if (actionItems !== undefined) {
      updateData.actionItems = actionItems;
    }

    const results = await db
      .update(conversations)
      .set(updateData)
      .where(eq(conversations.id, id))
      .returning();

    if (results.length === 0) {
      throw new Error(`Conversation with id ${id} not found`);
    }

    return results[0];
  }

  async getUserSettings(userId: string): Promise<UserSettings | undefined> {
    if (!db) return undefined;
    
    try {
      const results = await db
        .select()
        .from(userSettings)
        .where(eq(userSettings.userId, userId))
        .limit(1);
      
      return results[0];
    } catch (error) {
      console.error("Error fetching user settings:", error);
      return undefined;
    }
  }

  async saveUserSettings(settings: InsertUserSettings): Promise<UserSettings> {
    if (!db) throw new Error("Database not initialized");
    
    try {
      const existingSettings = await this.getUserSettings(settings.userId);
      
      if (existingSettings) {
        return this.updateUserSettings(settings.userId, settings);
      }
      
      const results = await db
        .insert(userSettings)
        .values(settings)
        .returning();
      
      return results[0];
    } catch (error) {
      console.error("Error saving user settings:", error);
      throw new Error(`Failed to save user settings: ${error}`);
    }
  }

  async updateUserSettings(userId: string, settings: Partial<InsertUserSettings>): Promise<UserSettings> {
    if (!db) throw new Error("Database not initialized");
    
    try {
      // Ensure we're not updating the userId
      const { userId: _, ...updateValues } = settings;
      
      const results = await db
        .update(userSettings)
        .set(updateValues)
        .where(eq(userSettings.userId, userId))
        .returning();
      
      if (results.length === 0) {
        throw new Error(`No settings found for user ${userId}`);
      }
      
      return results[0];
    } catch (error) {
      console.error("Error updating user settings:", error);
      throw new Error(`Failed to update user settings: ${error}`);
    }
  }
}

export const storage = process.env.DATABASE_URL
  ? new DbStorage()
  : new MemStorage();

export function createStorage(): IStorage {
  return storage;
}