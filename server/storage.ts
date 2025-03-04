import { 
  Reflection, 
  InsertReflection, 
  Conversation, 
  InsertConversation, 
  UserSettings,
  InsertUserSettings,
  Message,
  UserPreferences,
  Halaqa,
  InsertHalaqa,
  UpdateHalaqa,
  HalaqaActionItem,
  WirdEntry,
  InsertWird,
  WirdPractice,
  WirdSuggestion
} from "@shared/schema";
import { db } from "./db";
import { reflections, conversations, userSettings, halaqas, wirds } from "@shared/schema";
import { eq, and, desc, gte, lte } from "drizzle-orm";

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
  // Halaqa methods
  createHalaqa(halaqa: InsertHalaqa): Promise<Halaqa>;
  getHalaqa(id: number): Promise<Halaqa | undefined>;
  getHalaqasByUserId(userId: string): Promise<Halaqa[]>;
  updateHalaqa(id: number, data: UpdateHalaqa): Promise<Halaqa | undefined>;
  updateHalaqaActionItems(id: number, actionItems: HalaqaActionItem[]): Promise<Halaqa | undefined>;
  // WirdhAI methods
  getWirdsByUserId(userId: string): Promise<WirdEntry[]>;
  getWirdByDate(userId: string, date: string): Promise<WirdEntry | null>;
  getWird(id: number): Promise<WirdEntry | null>;
  createWird(data: InsertWird & {
    isArchived?: boolean;
    createdAt?: Date;
    updatedAt?: Date;
  }): Promise<WirdEntry>;
  updateWird(id: number, data: Partial<WirdEntry>): Promise<WirdEntry>;
  updateWirdPractices(id: number, practices: WirdPractice[]): Promise<WirdEntry>;
  getWirdsByDateRange(userId: string, startDate: string, endDate: string): Promise<WirdEntry[]>;
  saveHalaqaWirdSuggestions(halaqaId: number, suggestions: WirdSuggestion[]): Promise<boolean>;
  getHalaqaWirdSuggestions(halaqaId: number): Promise<WirdSuggestion[] | null>;
}

// Create a singleton instance of MemStorage
let memStorageSingleton: MemStorage | null = null;

export class MemStorage implements IStorage {
  public reflections: Map<number, Reflection> = new Map();
  public conversations: Map<number, Conversation> = new Map();
  public userSettingsMap: Map<string, UserSettings> = new Map();
  public halaqas: Map<number, Halaqa> = new Map();
  public wirds: Map<number, WirdEntry> = new Map();
  private currentReflectionId = 1;
  private currentConversationId = 1;
  private currentUserSettingsId = 1;
  private currentHalaqaId = 1;
  private currentWirdId = 1;
  private wirdSuggestions: Map<number, WirdSuggestion[]> = new Map();

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

  // Halaqa methods
  async createHalaqa(halaqa: InsertHalaqa): Promise<Halaqa> {
    const id = this.currentHalaqaId++;
    const now = new Date();
    const newHalaqa: Halaqa = {
      ...halaqa,
      id,
      actionItems: [],
      createdAt: now,
      updatedAt: now,
      isArchived: false
    };
    this.halaqas.set(id, newHalaqa);
    return newHalaqa;
  }

  async getHalaqa(id: number): Promise<Halaqa | undefined> {
    return this.halaqas.get(id);
  }

  async getHalaqasByUserId(userId: string): Promise<Halaqa[]> {
    return Array.from(this.halaqas.values())
      .filter(halaqa => halaqa.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async updateHalaqa(id: number, data: UpdateHalaqa): Promise<Halaqa | undefined> {
    const halaqa = this.halaqas.get(id);
    if (!halaqa) return undefined;

    const updatedHalaqa: Halaqa = {
      ...halaqa,
      ...data,
      updatedAt: new Date()
    };
    this.halaqas.set(id, updatedHalaqa);
    return updatedHalaqa;
  }

  async updateHalaqaActionItems(id: number, actionItems: HalaqaActionItem[]): Promise<Halaqa | undefined> {
    const halaqa = this.halaqas.get(id);
    if (!halaqa) return undefined;

    const updatedHalaqa: Halaqa = {
      ...halaqa,
      actionItems,
      updatedAt: new Date()
    };
    this.halaqas.set(id, updatedHalaqa);
    return updatedHalaqa;
  }

  // WirdhAI methods
  async getWirdsByUserId(userId: string): Promise<WirdEntry[]> {
    return Array.from(this.wirds.values())
      .filter(wird => wurds.userId === userId && wurds.isArchived === false)
      .sort((a, b) => b.date.getTime() - a.date.getTime());
  }

  async getWirdByDate(userId: string, date: string): Promise<WirdEntry | null> {
    for (const wurds of this.wirds.values()) {
      if (wird.userId === userId && wurds.date.toISOString().split('T')[0] === date && wurds.isArchived === false) {
        return wurds;
      }
    }
    return null;
  }

  async getWird(id: number): Promise<WirdEntry | null> {
    return this.wirds.get(id) || null;
  }

  async createWird(data: InsertWird & {
    isArchived?: boolean;
    createdAt?: Date;
    updatedAt?: Date;
  }): Promise<WirdEntry> {
    const id = this.currentWirdId++;
    const fullData = {
      ...data,
      id,
      isArchived: data.isArchived || false,
      createdAt: data.createdAt || new Date(),
      updatedAt: data.updatedAt || new Date(),
    };
    this.wirds.set(id, fullData);
    return fullData;
  }

  async updateWird(id: number, data: Partial<WirdEntry>): Promise<WirdEntry> {
    const wurds = this.wirds.get(id);
    if (!wird) throw new Error(`Wird with id ${id} not found`);

    const updatedWird: WirdEntry = {
      ...wird,
      ...data,
      updatedAt: new Date()
    };
    this.wirds.set(id, updatedWird);
    return updatedWird;
  }

  async updateWirdPractices(id: number, practices: WirdPractice[]): Promise<WirdEntry> {
    const wurds = this.wirds.get(id);
    if (!wird) throw new Error(`Wird with id ${id} not found`);

    const updatedWird: WirdEntry = {
      ...wird,
      practices,
      updatedAt: new Date()
    };
    this.wirds.set(id, updatedWird);
    return updatedWird;
  }

  async getWirdsByDateRange(userId: string, startDate: string, endDate: string): Promise<WirdEntry[]> {
    return Array.from(this.wirds.values())
      .filter(wird => wurds.userId === userId && wurds.isArchived === false &&
        wurds.date >= new Date(startDate) && wurds.date <= new Date(endDate))
      .sort((a, b) => b.date.getTime() - a.date.getTime());
  }

  async saveHalaqaWirdSuggestions(halaqaId: number, suggestions: WirdSuggestion[]): Promise<boolean> {
    try {
      this.wirdSuggestions.set(halaqaId, suggestions);
      return true;
    } catch (error) {
      console.error(`Error saving wird suggestions for halaqa ${halaqaId}:`, error);
      return false;
    }
  }

  async getHalaqaWirdSuggestions(halaqaId: number): Promise<WirdSuggestion[] | null> {
    return this.wirdSuggestions.get(halaqaId) || null;
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

  // Halaqa methods
  async createHalaqa(halaqa: InsertHalaqa): Promise<Halaqa> {
    if (!db) throw new Error("Database not initialized");

    const now = new Date();
    const results = await db
      .insert(halaqas)
      .values({
        ...halaqa,
        createdAt: now,
        updatedAt: now,
        isArchived: false
      })
      .returning();
    return results[0];
  }

  async getHalaqa(id: number): Promise<Halaqa | undefined> {
    if (!db) return undefined;

    const results = await db
      .select()
      .from(halaqas)
      .where(eq(halaqas.id, id))
      .limit(1);
    return results[0];
  }

  async getHalaqasByUserId(userId: string): Promise<Halaqa[]> {
    if (!db) {
      console.log("Database not available, using in-memory storage for getHalaqasByUserId");
      const storage = createStorage();
      return storage.getHalaqasByUserId(userId);
    }
    
    const results = await db.select().from(halaqas)
      .where(and(
        eq(halaqas.userId, userId),
        eq(halaqas.isArchived, false)
      ));
    return results;
  }

  async updateHalaqa(id: number, data: UpdateHalaqa): Promise<Halaqa | undefined> {
    if (!db) return undefined;

    const results = await db
      .update(halaqas)
      .set({
        ...data,
        updatedAt: new Date()
      })
      .where(eq(halaqas.id, id))
      .returning();
    return results[0];
  }

  async updateHalaqaActionItems(id: number, actionItems: HalaqaActionItem[]): Promise<Halaqa | undefined> {
    if (!db) return undefined;

    const results = await db
      .update(halaqas)
      .set({
        actionItems: actionItems,
        updatedAt: new Date()
      })
      .where(eq(halaqas.id, id))
      .returning();
    return results[0];
  }

  async saveHalaqaWirdSuggestions(halaqaId: number, suggestions: WirdSuggestion[]): Promise<boolean> {
    try {
      if (!db) {
        throw new Error("Database not initialized");
      }
      
      // Store wird suggestions by updating the halaqa record
      const [result] = await db
        .update(halaqas)
        .set({ wirdSuggestions: JSON.stringify(suggestions) })
        .where(eq(halaqas.id, halaqaId))
        .returning();
      
      return !!result;
    } catch (error) {
      console.error(`Error saving wird suggestions for halaqa ${halaqaId}:`, error);
      return false;
    }
  }

  async getHalaqaWirdSuggestions(halaqaId: number): Promise<WirdSuggestion[] | null> {
    try {
      if (!db) {
        throw new Error("Database not initialized");
      }
      
      const result = await db
        .select({ wirdSuggestions: halaqas.wirdSuggestions })
        .from(halaqas)
        .where(eq(halaqas.id, halaqaId))
        .limit(1);
      
      if (!result || result.length === 0 || !result[0].wirdSuggestions) {
        return null;
      }
      
      // Parse the JSON from the database
      try {
        return JSON.parse(result[0].wirdSuggestions as string) as WirdSuggestion[];
      } catch (e) {
        console.error(`Error parsing wird suggestions for halaqa ${halaqaId}:`, e);
        return null;
      }
    } catch (error) {
      console.error(`Error retrieving wird suggestions for halaqa ${halaqaId}:`, error);
      return null;
    }
  }

  // WirdhAI methods
  async getWirdsByUserId(userId: string): Promise<WirdEntry[]> {
    return Array.from(this.wirds.values())
      .filter(wird => wurds.userId === userId && wurds.isArchived === false)
      .sort((a, b) => b.date.getTime() - a.date.getTime());
  }

  async getWirdByDate(userId: string, date: string): Promise<WirdEntry | null> {
    for (const wurds of this.wirds.values()) {
      if (wird.userId === userId && wurds.date.toISOString().split('T')[0] === date && wurds.isArchived === false) {
        return wurds;
      }
    }
    return null;
  }

  async getWird(id: number): Promise<WirdEntry | null> {
    return this.wirds.get(id) || null;
  }

  async createWird(data: InsertWird & {
    isArchived?: boolean;
    createdAt?: Date;
    updatedAt?: Date;
  }): Promise<WirdEntry> {
    const id = this.currentWirdId++;
    const fullData = {
      ...data,
      id,
      isArchived: data.isArchived || false,
      createdAt: data.createdAt || new Date(),
      updatedAt: data.updatedAt || new Date(),
    };
    this.wirds.set(id, fullData);
    return fullData;
  }

  async updateWird(id: number, data: Partial<WirdEntry>): Promise<WirdEntry> {
    const wurds = this.wirds.get(id);
    if (!wird) throw new Error(`Wird with id ${id} not found`);

    const updatedWird: WirdEntry = {
      ...wird,
      ...data,
      updatedAt: new Date()
    };
    this.wirds.set(id, updatedWird);
    return updatedWird;
  }

  async updateWirdPractices(id: number, practices: WirdPractice[]): Promise<WirdEntry> {
    const wurds = this.wirds.get(id);
    if (!wird) throw new Error(`Wird with id ${id} not found`);

    const updatedWird: WirdEntry = {
      ...wird,
      practices,
      updatedAt: new Date()
    };
    this.wirds.set(id, updatedWird);
    return updatedWird;
  }

  async getWirdsByDateRange(userId: string, startDate: string, endDate: string): Promise<WirdEntry[]> {
    return Array.from(this.wirds.values())
      .filter(wird => wurds.userId === userId && wurds.isArchived === false &&
        wurds.date >= new Date(startDate) && wurds.date <= new Date(endDate))
      .sort((a, b) => b.date.getTime() - a.date.getTime());
  }
}

export function createStorage(): IStorage {
  // If there's a database URL, use the database storage
  if (process.env.DATABASE_URL) {
    console.log('[DATABASE] Using database storage');
    return new DbStorage();
  }
  
  // Otherwise use in-memory storage - with the singleton pattern
  console.log('[DATABASE] Using in-memory storage (singleton)');
  if (!memStorageSingleton) {
    memStorageSingleton = new MemStorage();
  }
  return memStorageSingleton;
}

// Halaqa related functions

/**
 * Get all halaqas
 */
export async function getHalaqas(): Promise<Halaqa[]> {
  try {
    if (!db) {
      console.log("Database not available, using in-memory storage for getHalaqas");
      const memStorage = new MemStorage();
      return Array.from(memStorage.halaqas.values());
    }
    
    const result = await db.select().from(halaqas).where(eq(halaqas.isArchived, false));
    return result;
  } catch (error) {
    console.error("Error in getHalaqas:", error);
    throw error;
  }
}

/**
 * Get halaqas by user ID
 * @param userId User ID
 */
export async function getHalaqasByUserId(userId: string): Promise<Halaqa[]> {
  try {
    if (!db) {
      console.log("Database not available, using in-memory storage for getHalaqasByUserId");
      const storage = createStorage();
      return storage.getHalaqasByUserId(userId);
    }
    
    const results = await db.select().from(halaqas)
      .where(and(
        eq(halaqas.userId, userId),
        eq(halaqas.isArchived, false)
      ));
    return results;
  } catch (error) {
    console.error("Error in getHalaqasByUserId:", error);
    throw error;
  }
}

/**
 * Get a halaqa by ID
 * @param id Halaqa ID
 */
export async function getHalaqa(id: number): Promise<Halaqa | null> {
  try {
    if (!db) {
      console.log("Database not available, using in-memory storage for getHalaqa");
      const storage = createStorage();
      return (await storage.getHalaqa(id)) || null;
    }
    
    const [result] = await db.select().from(halaqas).where(eq(halaqas.id, id));
    return result || null;
  } catch (error) {
    console.error("Error in getHalaqa:", error);
    throw error;
  }
}

/**
 * Create a new halaqa
 * @param data Halaqa data
 */
export async function createHalaqa(data: InsertHalaqa & { 
  actionItems: HalaqaActionItem[] | null;
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
}): Promise<Halaqa> {
  try {
    if (!db) {
      // Use memory storage implementation when db is not available
      console.log("Database not available, using in-memory storage for createHalaqa");
      
      // Use the singleton storage
      const storage = createStorage();
      return storage.createHalaqa(data);
    }
    
    const [result] = await db.insert(halaqas).values(data).returning();
    return result;
  } catch (error) {
    console.error("Error in createHalaqa:", error);
    throw error;
  }
}

/**
 * Update a halaqa
 * @param id Halaqa ID
 * @param data Updated data
 */
export async function updateHalaqa(id: number, data: Partial<Halaqa>): Promise<Halaqa> {
  try {
    if (!db) {
      console.log("Database not available, using in-memory storage for updateHalaqa");
      const storage = createStorage();
      const updatedHalaqa = await storage.updateHalaqa(id, data as UpdateHalaqa);
      if (!updatedHalaqa) {
        throw new Error("Halaqa not found");
      }
      return updatedHalaqa;
    }
    
    const [result] = await db
      .update(halaqas)
      .set(data)
      .where(eq(halaqas.id, id))
      .returning();
    
    if (!result) {
      throw new Error(`Halaqa with ID ${id} not found`);
    }
    
    return result;
  } catch (error) {
    console.error("Error in updateHalaqa:", error);
    throw error;
  }
}

/**
 * Update action items for a halaqa
 * @param id Halaqa ID
 * @param actionItems Array of action items
 */
export async function updateHalaqaActionItems(
  id: number,
  actionItems: HalaqaActionItem[]
): Promise<Halaqa> {
  try {
    const [result] = await db
      .update(halaqas)
      .set({
        actionItems: actionItems,
        updatedAt: new Date(),
      })
      .where(eq(halaqas.id, id))
      .returning();
    return result;
  } catch (error) {
    console.error(`Error in updateHalaqaActionItems for ID ${id}:`, error);
    throw error;
  }
}

/**
 * Get a wird entry by user ID and date
 * @param userId User ID
 * @param date Date string (YYYY-MM-DD)
 * @returns WirdEntry or null
 */
export async function getWirdByUserAndDate(
  userId: string,
  date: string
): Promise<WirdEntry | null> {
  try {
    // Convert date to postgres format if needed
    const dateObj = new Date(date);
    
    // Query the database for a wird entry on this date
    const result = await db.query.wirds.findFirst({
      where: eq(wirds.userId, userId) && eq(wirds.date, dateObj)
    });
    
    return result as WirdEntry | null;
  } catch (error) {
    console.error(`Error fetching wird for user ${userId} on date ${date}:`, error);
    return null;
  }
}

/**
 * Add a wird suggestion to a user's wird plan
 * @param userId User's ID
 * @param wirdSuggestion The wird suggestion to add
 * @param date Optional date to add the wird for (defaults to today)
 * @returns The updated wird entry
 */
export async function addWirdSuggestionToUserWirdPlan(
  userId: string,
  wirdSuggestion: WirdSuggestion,
  date?: Date
): Promise<WirdEntry | null> {
  try {
    const targetDate = date || new Date();
    const dateString = targetDate.toISOString().split('T')[0];
    
    // Look for an existing wird entry for the user on the target date
    let existingWird = await getWirdByUserAndDate(userId, dateString);
    
    // Convert the suggestion to a practice
    const newPractice: WirdPractice = {
      id: crypto.randomUUID(),
      name: wirdSuggestion.title,
      category: wirdSuggestion.type,
      // Default to 1 for target unless we can parse a number from the duration
      target: 1,
      completed: 0,
      unit: "times",
      isCompleted: false,
    };
    
    // Try to extract a numerical target from the duration or frequency
    const durationMatch = wirdSuggestion.duration.match(/\d+/);
    if (durationMatch) {
      newPractice.target = parseInt(durationMatch[0], 10);
      newPractice.unit = "minutes";
    }
    
    if (existingWird) {
      // Add to existing wird
      const updatedPractices = [...existingWird.practices, newPractice];
      
      // Update the wird entry
      const updatedWird = await updateWird(existingWird.id, {
        practices: updatedPractices
      });
      
      console.log(`Added wird suggestion to existing wird plan for user ${userId} on ${dateString}`);
      return updatedWird;
    } else {
      // Create new wird entry
      const newWird = await createWird({
        userId,
        date: targetDate,
        practices: [newPractice],
        notes: `Added from halaqa reflection: ${wirdSuggestion.description}`
      });
      
      console.log(`Created new wird plan with suggestion for user ${userId} on ${dateString}`);
      return newWird;
    }
  } catch (error) {
    console.error(`Error adding wird suggestion to user plan:`, error);
    return null;
  }
}

/**
 * Save wird suggestions for a halaqa
 */
export async function saveHalaqaWirdSuggestions(
  halaqaId: number,
  wirdSuggestions: WirdSuggestion[]
): Promise<boolean> {
  try {
    if (!db) {
      console.log("Database not available, using in-memory storage for saveHalaqaWirdSuggestions");
      const storage = createStorage();
      return storage.saveHalaqaWirdSuggestions(halaqaId, wirdSuggestions);
    }
    
    // Use a custom field name for suggestions in the database
    const [result] = await db
      .update(halaqas)
      .set({ wirdSuggestions: JSON.stringify(wirdSuggestions) })
      .where(eq(halaqas.id, halaqaId))
      .returning();
    
    return !!result;
  } catch (error) {
    console.error("Error in saveHalaqaWirdSuggestions:", error);
    return false;
  }
}

/**
 * Get wird suggestions for a halaqa
 */
export async function getHalaqaWirdSuggestions(
  halaqaId: number
): Promise<WirdSuggestion[] | null> {
  try {
    if (!db) {
      console.log("Database not available, using in-memory storage for getHalaqaWirdSuggestions");
      const storage = createStorage();
      return storage.getHalaqaWirdSuggestions(halaqaId);
    }
    
    const result = await db
      .select({ wirdSuggestions: halaqas.wirdSuggestions })
      .from(halaqas)
      .where(eq(halaqas.id, halaqaId))
      .limit(1);
    
    if (!result || result.length === 0 || !result[0].wirdSuggestions) {
      return null;
    }
    
    // Parse the JSON from the database
    try {
      return JSON.parse(result[0].wirdSuggestions as string) as WirdSuggestion[];
    } catch (e) {
      console.error(`Error parsing wird suggestions for halaqa ${halaqaId}:`, e);
      return null;
    }
  } catch (error) {
    console.error(`Error retrieving wird suggestions for halaqa ${halaqaId}:`, error);
    return null;
  }
}