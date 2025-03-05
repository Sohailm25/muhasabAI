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
  WirdSuggestion,
  IdentityFramework,
  FrameworkComponent,
  HabitTracking
} from "@shared/schema";
import { db } from "./db";
import { reflections, conversations, userSettings, halaqas, wirds } from "@shared/schema";
import { eq, and, desc, gte, lte } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

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
  getHalaqa(id: number): Promise<Halaqa | null>;
  getHalaqasByUserId(userId: string): Promise<Halaqa[]>;
  updateHalaqa(id: number, data: UpdateHalaqa): Promise<Halaqa | null>;
  updateHalaqaActionItems(id: number, actionItems: HalaqaActionItem[]): Promise<Halaqa | null>;
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
  // Identity Framework methods
  getFrameworks(userId: string): Promise<IdentityFramework[]>;
  getFramework(userId: string, frameworkId: string): Promise<IdentityFramework | null>;
  createFramework(userId: string, title: string): Promise<IdentityFramework>;
  updateFramework(userId: string, frameworkId: string, title: string): Promise<IdentityFramework>;
  updateFrameworkCompletion(userId: string, frameworkId: string, completionPercentage: number): Promise<IdentityFramework>;
  deleteFramework(userId: string, frameworkId: string): Promise<boolean>;
  // Framework Component methods
  getComponents(frameworkId: string): Promise<FrameworkComponent[]>;
  getComponent(frameworkId: string, componentType: string): Promise<FrameworkComponent | null>;
  createComponent(frameworkId: string, componentType: string, content: any): Promise<FrameworkComponent>;
  updateComponent(frameworkId: string, componentType: string, content: any): Promise<FrameworkComponent>;
  // Habit Tracking methods
  getHabitTracking(componentId: string): Promise<HabitTracking[]>;
  deleteHabitTracking(componentId: string): Promise<boolean>;
  createHabitTracking(habitTrackingValues: Partial<HabitTracking>[]): Promise<HabitTracking[]>;
  updateHabitTracking(habitId: string, currentStreak: number, longestStreak: number, lastCompleted: Date): Promise<HabitTracking>;
}

// Create a singleton instance of MemStorage
let memStorageSingleton: MemStorage | null = null;

export class MemStorage implements IStorage {
  public reflections: Map<number, Reflection> = new Map();
  public conversations: Map<number, Conversation> = new Map();
  public userSettingsMap: Map<string, UserSettings> = new Map();
  public halaqas: Map<number, Halaqa> = new Map();
  public wirds: Map<number, WirdEntry> = new Map();
  public frameworks: Map<string, IdentityFramework> = new Map();
  public components: Map<string, FrameworkComponent> = new Map();
  public habitTracking: Map<string, HabitTracking> = new Map();
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

  async getHalaqa(id: number): Promise<Halaqa | null> {
    const halaqa = this.halaqas.get(id);
    return halaqa ?? null;
  }

  async getHalaqasByUserId(userId: string): Promise<Halaqa[]> {
    return Array.from(this.halaqas.values())
      .filter(halaqa => halaqa.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async updateHalaqa(id: number, data: UpdateHalaqa): Promise<Halaqa | null> {
    const halaqa = this.halaqas.get(id);
    if (!halaqa) return null;

    const updatedHalaqa: Halaqa = {
      ...halaqa,
      ...data,
      updatedAt: new Date()
    };
    this.halaqas.set(id, updatedHalaqa);
    return updatedHalaqa;
  }

  async updateHalaqaActionItems(id: number, actionItems: HalaqaActionItem[]): Promise<Halaqa | null> {
    const halaqa = this.halaqas.get(id);
    if (!halaqa) return null;

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
      .filter(wird => wird.userId === userId && wird.isArchived === false)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  async getWirdByDate(userId: string, date: string): Promise<WirdEntry | null> {
    try {
      for (const wird of this.wirds.values()) {
        if (wird.userId === userId && wird.date === date) {
          return wird;
        }
      }
      return null;
    } catch (error) {
      console.error("Error getting wird by date:", error);
      return null;
    }
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
    const wird = this.wirds.get(id);
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
    try {
      const wird = this.wirds.get(id);
      if (!wird) throw new Error(`Wird with id ${id} not found`);

      const updatedWird: WirdEntry = {
        ...wird,
        practices,
        updatedAt: new Date()
      };
      this.wirds.set(id, updatedWird);
      return updatedWird;
    } catch (error) {
      console.error(`Error updating wird practices: ${error}`);
      throw error;
    }
  }

  async getWirdsByDateRange(userId: string, startDate: string, endDate: string): Promise<WirdEntry[]> {
    return Array.from(this.wirds.values())
      .filter(wird => wird.userId === userId && wird.isArchived === false &&
        wird.date >= new Date(startDate) && wird.date <= new Date(endDate))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
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

  async addWirdSuggestionToUserWirdPlan(
    userId: string,
    wirdSuggestion: WirdSuggestion,
    date?: Date
  ): Promise<WirdEntry | null> {
    try {
      console.log("Adding wird suggestion to plan:", {
        userId,
        wirdSuggestion: JSON.stringify(wirdSuggestion),
        date: date?.toISOString() || new Date().toISOString(),
      });
      
      const targetDate = date || new Date();
      const dateString = targetDate.toISOString().split("T")[0];

      // Try to get existing wird for this date
      let existingWird = null;
      try {
        existingWird = await this.getWirdByDate(userId, targetDate);
        console.log("Found existing wird for date:", existingWird ? existingWird.id : "none");
      } catch (err) {
        console.log("Error finding existing wird, will create new one:", err);
      }

      // Create a new practice from the suggestion
      const newPractice: WirdPractice = {
        id: uuidv4(),
        name: wirdSuggestion.title || wirdSuggestion.name || "Spiritual Practice",
        category: wirdSuggestion.type || wirdSuggestion.category || "General",
        target: wirdSuggestion.target || 1,
        completed: 0,
        unit: wirdSuggestion.unit || "times",
        isCompleted: false,
      };

      // Try to extract a number from the duration string
      if (wirdSuggestion.duration) {
        const match = wirdSuggestion.duration.match(/(\d+)/);
        if (match && match[1]) {
          const numericTarget = parseInt(match[1], 10);
          if (!isNaN(numericTarget)) {
            newPractice.target = numericTarget;
            if (wirdSuggestion.duration.includes("minute")) {
              newPractice.unit = "minutes";
            } else if (wirdSuggestion.duration.includes("page")) {
              newPractice.unit = "pages";
            }
          }
        }
      }

      if (existingWird) {
        // Update existing wird with new practice
        console.log("Updating existing wird with new practice");
        const updatedPractices = [...existingWird.practices, newPractice];
        return await this.updateWird(existingWird.id, {
          practices: updatedPractices,
        });
      } else {
        // Create new wird with this practice
        console.log("Creating new wird with practice");
        // Using this.createWird instead of createWird (which doesn't exist in this scope)
        return await this.createWird({
          userId,
          date: targetDate,
          practices: [newPractice],
          notes: "",
        });
      }
    } catch (error) {
      console.error("Error adding wird suggestion to user wird plan:", error);
      return null;
    }
  }

  // Identity Framework methods
  async getFrameworks(userId: string): Promise<IdentityFramework[]> {
    const frameworks: IdentityFramework[] = [];
    
    for (const framework of this.frameworks.values()) {
      if (framework.userId === userId) {
        frameworks.push(framework);
      }
    }
    
    return frameworks.sort((a, b) => 
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }

  async getFramework(userId: string, frameworkId: string): Promise<IdentityFramework | null> {
    const framework = this.frameworks.get(frameworkId);
    
    if (!framework || framework.userId !== userId) {
      return null;
    }
    
    return framework;
  }

  async createFramework(userId: string, title: string): Promise<IdentityFramework> {
    const id = uuidv4();
    const now = new Date();
    
    const framework: IdentityFramework = {
      id,
      userId,
      title,
      createdAt: now,
      updatedAt: now,
      completionPercentage: 0
    };
    
    this.frameworks.set(id, framework);
    return framework;
  }

  async updateFramework(userId: string, frameworkId: string, title: string): Promise<IdentityFramework> {
    const framework = await this.getFramework(userId, frameworkId);
    
    if (!framework) {
      throw new Error("Framework not found");
    }
    
    const updatedFramework: IdentityFramework = {
      ...framework,
      title,
      updatedAt: new Date()
    };
    
    this.frameworks.set(frameworkId, updatedFramework);
    return updatedFramework;
  }

  async updateFrameworkCompletion(userId: string, frameworkId: string, completionPercentage: number): Promise<IdentityFramework> {
    const framework = await this.getFramework(userId, frameworkId);
    
    if (!framework) {
      throw new Error("Framework not found");
    }
    
    const updatedFramework: IdentityFramework = {
      ...framework,
      completionPercentage,
      updatedAt: new Date()
    };
    
    this.frameworks.set(frameworkId, updatedFramework);
    return updatedFramework;
  }

  async deleteFramework(userId: string, frameworkId: string): Promise<boolean> {
    const framework = await this.getFramework(userId, frameworkId);
    
    if (!framework) {
      return false;
    }
    
    // Delete all components related to this framework
    for (const [componentId, component] of this.components.entries()) {
      if (component.frameworkId === frameworkId) {
        // Delete all habit tracking related to this component
        for (const [trackingId, tracking] of this.habitTracking.entries()) {
          if (tracking.componentId === componentId) {
            this.habitTracking.delete(trackingId);
          }
        }
        
        this.components.delete(componentId);
      }
    }
    
    return this.frameworks.delete(frameworkId);
  }

  // Framework Component methods
  async getComponents(frameworkId: string): Promise<FrameworkComponent[]> {
    const components: FrameworkComponent[] = [];
    
    for (const component of this.components.values()) {
      if (component.frameworkId === frameworkId) {
        components.push(component);
      }
    }
    
    return components;
  }

  async getComponent(frameworkId: string, componentType: string): Promise<FrameworkComponent | null> {
    for (const component of this.components.values()) {
      if (component.frameworkId === frameworkId && component.componentType === componentType) {
        return component;
      }
    }
    
    return null;
  }

  async createComponent(frameworkId: string, componentType: string, content: any): Promise<FrameworkComponent> {
    const id = uuidv4();
    const now = new Date();
    
    const component: FrameworkComponent = {
      id,
      frameworkId,
      componentType,
      content,
      createdAt: now,
      updatedAt: now
    };
    
    this.components.set(id, component);
    return component;
  }

  async updateComponent(frameworkId: string, componentType: string, content: any): Promise<FrameworkComponent> {
    const component = await this.getComponent(frameworkId, componentType);
    
    if (component) {
      const updatedComponent: FrameworkComponent = {
        ...component,
        content,
        updatedAt: new Date()
      };
      
      this.components.set(component.id, updatedComponent);
      return updatedComponent;
    } else {
      return this.createComponent(frameworkId, componentType, content);
    }
  }

  // Habit Tracking methods
  async getHabitTracking(componentId: string): Promise<HabitTracking[]> {
    const tracking: HabitTracking[] = [];
    
    for (const track of this.habitTracking.values()) {
      if (track.componentId === componentId) {
        tracking.push(track);
      }
    }
    
    return tracking.sort((a, b) => a.habitIndex - b.habitIndex);
  }

  async deleteHabitTracking(componentId: string): Promise<boolean> {
    let deleted = false;
    
    for (const [trackingId, tracking] of this.habitTracking.entries()) {
      if (tracking.componentId === componentId) {
        this.habitTracking.delete(trackingId);
        deleted = true;
      }
    }
    
    return deleted;
  }

  async createHabitTracking(habitTrackingValues: Partial<HabitTracking>[]): Promise<HabitTracking[]> {
    const now = new Date();
    const result: HabitTracking[] = [];
    
    for (const values of habitTrackingValues) {
      if (!values.componentId || values.habitIndex === undefined) {
        throw new Error("Component ID and habit index are required");
      }
      
      const id = uuidv4();
      
      const tracking: HabitTracking = {
        id,
        componentId: values.componentId,
        habitIndex: values.habitIndex,
        currentStreak: values.currentStreak || 0,
        longestStreak: values.longestStreak || 0,
        lastCompleted: values.lastCompleted || null,
        createdAt: now,
        updatedAt: now
      };
      
      this.habitTracking.set(id, tracking);
      result.push(tracking);
    }
    
    return result;
  }

  async updateHabitTracking(habitId: string, currentStreak: number, longestStreak: number, lastCompleted: Date): Promise<HabitTracking> {
    const tracking = this.habitTracking.get(habitId);
    
    if (!tracking) {
      throw new Error("Habit tracking not found");
    }
    
    const updatedTracking: HabitTracking = {
      ...tracking,
      currentStreak,
      longestStreak,
      lastCompleted,
      updatedAt: new Date()
    };
    
    this.habitTracking.set(habitId, updatedTracking);
    return updatedTracking;
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

  async getHalaqa(id: number): Promise<Halaqa | null> {
    if (!db) return null;

    const results = await db
      .select()
      .from(halaqas)
      .where(eq(halaqas.id, id))
      .limit(1);
    return results[0] || null;
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

  async updateHalaqa(id: number, data: UpdateHalaqa): Promise<Halaqa | null> {
    if (!db) return null;

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

  async updateHalaqaActionItems(id: number, actionItems: HalaqaActionItem[]): Promise<Halaqa | null> {
    if (!db) return null;

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
      .filter(wird => wird.userId === userId && wird.isArchived === false)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  async getWirdByDate(userId: string, date: string): Promise<WirdEntry | null> {
    try {
      for (const wird of this.wirds.values()) {
        if (wird.userId === userId && wird.date === date) {
          return wird;
        }
      }
      return null;
    } catch (error) {
      console.error("Error getting wird by date:", error);
      return null;
    }
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
    const wird = this.wirds.get(id);
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
    try {
      const wird = this.wirds.get(id);
      if (!wird) throw new Error(`Wird with id ${id} not found`);

      const updatedWird: WirdEntry = {
        ...wird,
        practices,
        updatedAt: new Date()
      };
      this.wirds.set(id, updatedWird);
      return updatedWird;
    } catch (error) {
      console.error(`Error updating wird practices: ${error}`);
      throw error;
    }
  }

  async getWirdsByDateRange(userId: string, startDate: string, endDate: string): Promise<WirdEntry[]> {
    return Array.from(this.wirds.values())
      .filter(wird => wird.userId === userId && wird.isArchived === false &&
        wird.date >= new Date(startDate) && wird.date <= new Date(endDate))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  // Identity Framework methods
  async getFrameworks(userId: string): Promise<IdentityFramework[]> {
    try {
      const { identity_frameworks } = await import("./db");
      const { sql } = await import("drizzle-orm");
      const { db } = await import("./db");
      
      const frameworks = await db.select({
        id: identity_frameworks.id,
        userId: identity_frameworks.user_id,
        title: identity_frameworks.title,
        createdAt: identity_frameworks.created_at,
        updatedAt: identity_frameworks.updated_at,
        completionPercentage: identity_frameworks.completion_percentage
      })
      .from(identity_frameworks)
      .where(sql`${identity_frameworks.user_id} = ${userId}`)
      .orderBy(identity_frameworks.updated_at);
      
      return frameworks.map(f => ({
        id: f.id.toString(),
        userId: f.userId.toString(),
        title: f.title,
        createdAt: f.createdAt,
        updatedAt: f.updatedAt,
        completionPercentage: f.completionPercentage
      }));
    } catch (error) {
      console.error("Error fetching frameworks:", error);
      return [];
    }
  }

  async getFramework(userId: string, frameworkId: string): Promise<IdentityFramework | null> {
    try {
      const { identity_frameworks } = await import("./db");
      const { sql } = await import("drizzle-orm");
      const { db } = await import("./db");
      
      const [framework] = await db.select({
        id: identity_frameworks.id,
        userId: identity_frameworks.user_id,
        title: identity_frameworks.title,
        createdAt: identity_frameworks.created_at,
        updatedAt: identity_frameworks.updated_at,
        completionPercentage: identity_frameworks.completion_percentage
      })
      .from(identity_frameworks)
      .where(sql`${identity_frameworks.id} = ${frameworkId} AND ${identity_frameworks.user_id} = ${userId}`);
      
      if (!framework) return null;
      
      return {
        id: framework.id.toString(),
        userId: framework.userId.toString(),
        title: framework.title,
        createdAt: framework.createdAt,
        updatedAt: framework.updatedAt,
        completionPercentage: framework.completionPercentage
      };
    } catch (error) {
      console.error("Error fetching framework:", error);
      return null;
    }
  }

  async createFramework(userId: string, title: string): Promise<IdentityFramework> {
    try {
      const { identity_frameworks } = await import("./db");
      const { db } = await import("./db");
      
      const [framework] = await db.insert(identity_frameworks)
        .values({
          user_id: userId,
          title: title
        })
        .returning({
          id: identity_frameworks.id,
          userId: identity_frameworks.user_id,
          title: identity_frameworks.title,
          createdAt: identity_frameworks.created_at,
          updatedAt: identity_frameworks.updated_at,
          completionPercentage: identity_frameworks.completion_percentage
        });
      
      return {
        id: framework.id.toString(),
        userId: framework.userId.toString(),
        title: framework.title,
        createdAt: framework.createdAt,
        updatedAt: framework.updatedAt,
        completionPercentage: framework.completionPercentage
      };
    } catch (error) {
      console.error("Error creating framework:", error);
      throw error;
    }
  }

  async updateFramework(userId: string, frameworkId: string, title: string): Promise<IdentityFramework> {
    try {
      const { identity_frameworks } = await import("./db");
      const { sql } = await import("drizzle-orm");
      const { db } = await import("./db");
      
      const [framework] = await db.update(identity_frameworks)
        .set({
          title,
          updated_at: new Date()
        })
        .where(sql`${identity_frameworks.id} = ${frameworkId} AND ${identity_frameworks.user_id} = ${userId}`)
        .returning({
          id: identity_frameworks.id,
          userId: identity_frameworks.user_id,
          title: identity_frameworks.title,
          createdAt: identity_frameworks.created_at,
          updatedAt: identity_frameworks.updated_at,
          completionPercentage: identity_frameworks.completion_percentage
        });
      
      if (!framework) {
        throw new Error("Framework not found or not authorized");
      }
      
      return {
        id: framework.id.toString(),
        userId: framework.userId.toString(),
        title: framework.title,
        createdAt: framework.createdAt,
        updatedAt: framework.updatedAt,
        completionPercentage: framework.completionPercentage
      };
    } catch (error) {
      console.error("Error updating framework:", error);
      throw error;
    }
  }

  async updateFrameworkCompletion(userId: string, frameworkId: string, completionPercentage: number): Promise<IdentityFramework> {
    try {
      const { identity_frameworks } = await import("./db");
      const { sql } = await import("drizzle-orm");
      const { db } = await import("./db");
      
      const [framework] = await db.update(identity_frameworks)
        .set({
          completion_percentage: completionPercentage,
          updated_at: new Date()
        })
        .where(sql`${identity_frameworks.id} = ${frameworkId} AND ${identity_frameworks.user_id} = ${userId}`)
        .returning({
          id: identity_frameworks.id,
          userId: identity_frameworks.user_id,
          title: identity_frameworks.title,
          createdAt: identity_frameworks.created_at,
          updatedAt: identity_frameworks.updated_at,
          completionPercentage: identity_frameworks.completion_percentage
        });
      
      if (!framework) {
        throw new Error("Framework not found or not authorized");
      }
      
      return {
        id: framework.id.toString(),
        userId: framework.userId.toString(),
        title: framework.title,
        createdAt: framework.createdAt,
        updatedAt: framework.updatedAt,
        completionPercentage: framework.completionPercentage
      };
    } catch (error) {
      console.error("Error updating framework completion:", error);
      throw error;
    }
  }

  async deleteFramework(userId: string, frameworkId: string): Promise<boolean> {
    try {
      const { identity_frameworks } = await import("./db");
      const { sql } = await import("drizzle-orm");
      const { db } = await import("./db");
      
      const result = await db.delete(identity_frameworks)
        .where(sql`${identity_frameworks.id} = ${frameworkId} AND ${identity_frameworks.user_id} = ${userId}`);
      
      return true;
    } catch (error) {
      console.error("Error deleting framework:", error);
      return false;
    }
  }

  // Framework Component methods
  async getComponents(frameworkId: string): Promise<FrameworkComponent[]> {
    try {
      const { framework_components } = await import("./db");
      const { sql } = await import("drizzle-orm");
      const { db } = await import("./db");
      
      const components = await db.select({
        id: framework_components.id,
        frameworkId: framework_components.framework_id,
        componentType: framework_components.component_type,
        content: framework_components.content,
        createdAt: framework_components.created_at,
        updatedAt: framework_components.updated_at
      })
      .from(framework_components)
      .where(sql`${framework_components.framework_id} = ${frameworkId}`)
      .orderBy(framework_components.component_type);
      
      return components.map(c => ({
        id: c.id.toString(),
        frameworkId: c.frameworkId.toString(),
        componentType: c.componentType,
        content: c.content,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt
      }));
    } catch (error) {
      console.error("Error fetching components:", error);
      return [];
    }
  }

  async getComponent(frameworkId: string, componentType: string): Promise<FrameworkComponent | null> {
    try {
      const { framework_components } = await import("./db");
      const { sql } = await import("drizzle-orm");
      const { db } = await import("./db");
      
      const [component] = await db.select({
        id: framework_components.id,
        frameworkId: framework_components.framework_id,
        componentType: framework_components.component_type,
        content: framework_components.content,
        createdAt: framework_components.created_at,
        updatedAt: framework_components.updated_at
      })
      .from(framework_components)
      .where(sql`${framework_components.framework_id} = ${frameworkId} AND ${framework_components.component_type} = ${componentType}`);
      
      if (!component) return null;
      
      return {
        id: component.id.toString(),
        frameworkId: component.frameworkId.toString(),
        componentType: component.componentType,
        content: component.content,
        createdAt: component.createdAt,
        updatedAt: component.updatedAt
      };
    } catch (error) {
      console.error("Error fetching component:", error);
      return null;
    }
  }

  async createComponent(frameworkId: string, componentType: string, content: any): Promise<FrameworkComponent> {
    try {
      const { framework_components } = await import("./db");
      const { db } = await import("./db");
      
      const [component] = await db.insert(framework_components)
        .values({
          framework_id: frameworkId,
          component_type: componentType,
          content
        })
        .returning({
          id: framework_components.id,
          frameworkId: framework_components.framework_id,
          componentType: framework_components.component_type,
          content: framework_components.content,
          createdAt: framework_components.created_at,
          updatedAt: framework_components.updated_at
        });
      
      return {
        id: component.id.toString(),
        frameworkId: component.frameworkId.toString(),
        componentType: component.componentType,
        content: component.content,
        createdAt: component.createdAt,
        updatedAt: component.updatedAt
      };
    } catch (error) {
      console.error("Error creating component:", error);
      throw error;
    }
  }

  async updateComponent(frameworkId: string, componentType: string, content: any): Promise<FrameworkComponent> {
    try {
      const { framework_components } = await import("./db");
      const { sql } = await import("drizzle-orm");
      const { db } = await import("./db");
      
      // Check if component exists
      const existingComponent = await this.getComponent(frameworkId, componentType);
      
      if (existingComponent) {
        // Update existing component
        const [component] = await db.update(framework_components)
          .set({
            content,
            updated_at: new Date()
          })
          .where(sql`${framework_components.id} = ${existingComponent.id}`)
          .returning({
            id: framework_components.id,
            frameworkId: framework_components.framework_id,
            componentType: framework_components.component_type,
            content: framework_components.content,
            createdAt: framework_components.created_at,
            updatedAt: framework_components.updated_at
          });
        
        return {
          id: component.id.toString(),
          frameworkId: component.frameworkId.toString(),
          componentType: component.componentType,
          content: component.content,
          createdAt: component.createdAt,
          updatedAt: component.updatedAt
        };
      } else {
        // Create new component
        return this.createComponent(frameworkId, componentType, content);
      }
    } catch (error) {
      console.error("Error updating component:", error);
      throw error;
    }
  }

  // Habit Tracking methods
  async getHabitTracking(componentId: string): Promise<HabitTracking[]> {
    try {
      const { habit_tracking } = await import("./db");
      const { sql } = await import("drizzle-orm");
      const { db } = await import("./db");
      
      const tracking = await db.select({
        id: habit_tracking.id,
        componentId: habit_tracking.component_id,
        habitIndex: habit_tracking.habit_index,
        currentStreak: habit_tracking.current_streak,
        longestStreak: habit_tracking.longest_streak,
        lastCompleted: habit_tracking.last_completed,
        createdAt: habit_tracking.created_at,
        updatedAt: habit_tracking.updated_at
      })
      .from(habit_tracking)
      .where(sql`${habit_tracking.component_id} = ${componentId}`)
      .orderBy(habit_tracking.habit_index);
      
      return tracking.map(t => ({
        id: t.id.toString(),
        componentId: t.componentId.toString(),
        habitIndex: t.habitIndex,
        currentStreak: t.currentStreak,
        longestStreak: t.longestStreak,
        lastCompleted: t.lastCompleted,
        createdAt: t.createdAt,
        updatedAt: t.updatedAt
      }));
    } catch (error) {
      console.error("Error fetching habit tracking:", error);
      return [];
    }
  }

  async deleteHabitTracking(componentId: string): Promise<boolean> {
    try {
      const { habit_tracking } = await import("./db");
      const { sql } = await import("drizzle-orm");
      const { db } = await import("./db");
      
      await db.delete(habit_tracking)
        .where(sql`${habit_tracking.component_id} = ${componentId}`);
      
      return true;
    } catch (error) {
      console.error("Error deleting habit tracking:", error);
      return false;
    }
  }

  async createHabitTracking(habitTrackingValues: Partial<HabitTracking>[]): Promise<HabitTracking[]> {
    try {
      const { habit_tracking } = await import("./db");
      const { db } = await import("./db");
      
      const values = habitTrackingValues.map(v => ({
        component_id: v.componentId,
        habit_index: v.habitIndex,
        current_streak: v.currentStreak || 0,
        longest_streak: v.longestStreak || 0,
        last_completed: v.lastCompleted || null
      }));
      
      const tracking = await db.insert(habit_tracking)
        .values(values)
        .returning({
          id: habit_tracking.id,
          componentId: habit_tracking.component_id,
          habitIndex: habit_tracking.habit_index,
          currentStreak: habit_tracking.current_streak,
          longestStreak: habit_tracking.longest_streak,
          lastCompleted: habit_tracking.last_completed,
          createdAt: habit_tracking.created_at,
          updatedAt: habit_tracking.updated_at
        });
      
      return tracking.map(t => ({
        id: t.id.toString(),
        componentId: t.componentId.toString(),
        habitIndex: t.habitIndex,
        currentStreak: t.currentStreak,
        longestStreak: t.longestStreak,
        lastCompleted: t.lastCompleted,
        createdAt: t.createdAt,
        updatedAt: t.updatedAt
      }));
    } catch (error) {
      console.error("Error creating habit tracking:", error);
      throw error;
    }
  }

  async updateHabitTracking(habitId: string, currentStreak: number, longestStreak: number, lastCompleted: Date): Promise<HabitTracking> {
    try {
      const { habit_tracking } = await import("./db");
      const { sql } = await import("drizzle-orm");
      const { db } = await import("./db");
      
      const [tracking] = await db.update(habit_tracking)
        .set({
          current_streak: currentStreak,
          longest_streak: longestStreak,
          last_completed: lastCompleted,
          updated_at: new Date()
        })
        .where(sql`${habit_tracking.id} = ${habitId}`)
        .returning({
          id: habit_tracking.id,
          componentId: habit_tracking.component_id,
          habitIndex: habit_tracking.habit_index,
          currentStreak: habit_tracking.current_streak,
          longestStreak: habit_tracking.longest_streak,
          lastCompleted: habit_tracking.last_completed,
          createdAt: habit_tracking.created_at,
          updatedAt: habit_tracking.updated_at
        });
      
      if (!tracking) {
        throw new Error("Habit tracking not found");
      }
      
      return {
        id: tracking.id.toString(),
        componentId: tracking.componentId.toString(),
        habitIndex: tracking.habitIndex,
        currentStreak: tracking.currentStreak,
        longestStreak: tracking.longestStreak,
        lastCompleted: tracking.lastCompleted,
        createdAt: tracking.createdAt,
        updatedAt: tracking.updatedAt
      };
    } catch (error) {
      console.error("Error updating habit tracking:", error);
      throw error;
    }
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
      // Convert undefined to null for consistency
      const halaqa = await storage.getHalaqa(id);
      return halaqa ?? null;
    }
    
    try {
      // Use a try/catch here to handle case where the query might fail
      const [result] = await db.select().from(halaqas).where(eq(halaqas.id, id));
      
      if (!result) {
        console.log(`No halaqa found with ID: ${id}`);
        return null;
      }
      
      console.log(`Successfully retrieved halaqa ${id} from database`);
      return result;
    } catch (dbError) {
      console.error(`Database error when fetching halaqa ${id}:`, dbError);
      
      // If there's a database error, try to fall back to in-memory storage
      console.log(`Falling back to in-memory storage for halaqa ${id}`);
      const memStorage = createStorage();
      const halaqa = await memStorage.getHalaqa(id);
      return halaqa ?? null;
    }
  } catch (error) {
    console.error(`Critical error in getHalaqa for ID ${id}:`, error);
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
    // If database is not available, use in-memory storage
    if (!db) {
      console.log("Database not available, using in-memory storage for updateHalaqaActionItems");
      const storage = createStorage();
      return await storage.updateHalaqaActionItems(id, actionItems);
    }
    
    // Check if we have a valid database connection before attempting to use it
    if (typeof db.update !== 'function') {
      console.error("Database connection invalid or not properly initialized for updateHalaqaActionItems");
      // Fall back to in-memory storage
      const storage = createStorage();
      return await storage.updateHalaqaActionItems(id, actionItems);
    }
    
    // Otherwise use database
    const [result] = await db
      .update(halaqas)
      .set({
        actionItems: actionItems,
        updatedAt: new Date(),
      })
      .where(eq(halaqas.id, id))
      .returning();
      
    if (!result) {
      throw new Error(`Halaqa with ID ${id} not found during update`);
    }
    
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
    console.log(`Fetching wird for user ${userId} on date ${date}`);
    
    // Create a storage instance
    const storage = createStorage();
    
    // Try using the storage interface directly
    try {
      return await storage.getWirdByDate(userId, date);
    } catch (err) {
      console.log("Error using storage interface, falling back to in-memory search:", err);
      
      // Fallback to in-memory search
      const memStorage = new MemStorage();
      const entries = Array.from(memStorage.wirds.values());
      
      for (const entry of entries) {
        if (entry.userId === userId && entry.date === date) {
          return entry;
        }
      }
      
      return null;
    }
  } catch (error) {
    console.error(`Error fetching wird for user ${userId} on date ${date}:`, error);
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

// Export Identity Framework functions
export async function getFrameworks(userId: string): Promise<IdentityFramework[]> {
  const storage = createStorage();
  return storage.getFrameworks(userId);
}

export async function getFramework(userId: string, frameworkId: string): Promise<IdentityFramework | null> {
  const storage = createStorage();
  return storage.getFramework(userId, frameworkId);
}

export async function createFramework(userId: string, title: string): Promise<IdentityFramework> {
  const storage = createStorage();
  return storage.createFramework(userId, title);
}

export async function updateFramework(userId: string, frameworkId: string, title: string): Promise<IdentityFramework> {
  const storage = createStorage();
  return storage.updateFramework(userId, frameworkId, title);
}

export async function deleteFramework(userId: string, frameworkId: string): Promise<boolean> {
  const storage = createStorage();
  return storage.deleteFramework(userId, frameworkId);
}

export async function getComponents(frameworkId: string): Promise<FrameworkComponent[]> {
  const storage = createStorage();
  return storage.getComponents(frameworkId);
}

export async function getComponent(frameworkId: string, componentType: string): Promise<FrameworkComponent | null> {
  const storage = createStorage();
  return storage.getComponent(frameworkId, componentType);
}

export async function createComponent(frameworkId: string, componentType: string, content: any): Promise<FrameworkComponent> {
  const storage = createStorage();
  return storage.createComponent(frameworkId, componentType, content);
}

export async function updateComponent(frameworkId: string, componentType: string, content: any): Promise<FrameworkComponent> {
  const storage = createStorage();
  return storage.updateComponent(frameworkId, componentType, content);
}

export async function updateFrameworkCompletion(userId: string, frameworkId: string, completionPercentage: number): Promise<IdentityFramework> {
  const storage = createStorage();
  return storage.updateFrameworkCompletion(userId, frameworkId, completionPercentage);
}

export async function getHabitTracking(componentId: string): Promise<HabitTracking[]> {
  const storage = createStorage();
  return storage.getHabitTracking(componentId);
}

export async function deleteHabitTracking(componentId: string): Promise<boolean> {
  const storage = createStorage();
  return storage.deleteHabitTracking(componentId);
}

export async function createHabitTracking(habitTrackingValues: Partial<HabitTracking>[]): Promise<HabitTracking[]> {
  const storage = createStorage();
  return storage.createHabitTracking(habitTrackingValues);
}

export async function updateHabitTracking(habitId: string, currentStreak: number, longestStreak: number, lastCompleted: Date): Promise<HabitTracking> {
  const storage = createStorage();
  return storage.updateHabitTracking(habitId, currentStreak, longestStreak, lastCompleted);
}