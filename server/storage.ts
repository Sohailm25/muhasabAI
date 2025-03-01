import { Reflection, InsertReflection, Conversation, InsertConversation, Message } from "@shared/schema";
import { db } from "./db";
import { reflections, conversations } from "@shared/schema";
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
}

// Memory storage implementation for development or testing
export class MemStorage implements IStorage {
  private reflections: Map<number, Reflection> = new Map();
  private conversations: Map<number, Conversation> = new Map();
  private currentReflectionId = 1;
  private currentConversationId = 1;

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
      reflectionId: conversation.reflectionId || null,
      actionItems: conversation.actionItems || [],
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
    const conversation = this.conversations.get(id);
    if (!conversation) {
      throw new Error("Conversation not found");
    }

    const updatedConversation: Conversation = {
      ...conversation,
      messages,
      actionItems: actionItems || conversation.actionItems,
    };
    this.conversations.set(id, updatedConversation);
    return updatedConversation;
  }
}

// Database storage implementation for production
export class DbStorage implements IStorage {
  async createReflection(reflection: InsertReflection): Promise<Reflection> {
    if (!db) {
      throw new Error("Database connection not available");
    }
    try {
      const result = await db.insert(reflections).values(reflection).returning();
      return result[0];
    } catch (error) {
      console.error("Error creating reflection:", error);
      throw error;
    }
  }

  async getReflection(id: number): Promise<Reflection | undefined> {
    if (!db) {
      throw new Error("Database connection not available");
    }
    try {
      const result = await db.select().from(reflections).where(eq(reflections.id, id));
      return result[0];
    } catch (error) {
      console.error(`Error getting reflection ${id}:`, error);
      throw error;
    }
  }

  async createConversation(conversation: InsertConversation): Promise<Conversation> {
    if (!db) {
      throw new Error("Database connection not available");
    }
    try {
      const result = await db.insert(conversations).values(conversation).returning();
      return result[0];
    } catch (error) {
      console.error("Error creating conversation:", error);
      throw error;
    }
  }

  async getConversation(id: number): Promise<Conversation | undefined> {
    if (!db) {
      throw new Error("Database connection not available");
    }
    try {
      const result = await db.select().from(conversations).where(eq(conversations.id, id));
      return result[0];
    } catch (error) {
      console.error(`Error getting conversation ${id}:`, error);
      throw error;
    }
  }

  async updateConversation(
    id: number,
    messages: Message[],
    actionItems?: string[]
  ): Promise<Conversation> {
    if (!db) {
      throw new Error("Database connection not available");
    }
    try {
      const conversation = await this.getConversation(id);
      if (!conversation) {
        throw new Error("Conversation not found");
      }

      const result = await db
        .update(conversations)
        .set({ 
          messages,
          actionItems: actionItems || conversation.actionItems 
        })
        .where(eq(conversations.id, id))
        .returning();
      
      return result[0];
    } catch (error) {
      console.error(`Error updating conversation ${id}:`, error);
      throw error;
    }
  }
}

// Factory function to determine which storage to use
export function createStorage(): IStorage {
  // Always use memory storage if DATABASE_URL is not set
  if (!process.env.DATABASE_URL) {
    console.log("No DATABASE_URL found, using in-memory storage");
    return new MemStorage();
  }
  
  // Use database storage if DATABASE_URL is set
  try {
    console.log("DATABASE_URL found, using database storage");
    return new DbStorage();
  } catch (error) {
    console.error("Failed to initialize database storage:", error);
    console.warn("Falling back to in-memory storage");
    return new MemStorage();
  }
}

// Export storage instance
export const storage = createStorage();