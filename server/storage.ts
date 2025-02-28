import { Reflection, InsertReflection, Conversation, InsertConversation, Message } from "@shared/schema";

export interface IStorage {
  createReflection(reflection: InsertReflection): Promise<Reflection>;
  getReflection(id: number): Promise<Reflection | undefined>;
  createConversation(conversation: InsertConversation): Promise<Conversation>;
  getConversation(id: number): Promise<Conversation | undefined>;
  updateConversation(id: number, messages: Message[], actionItems?: string[]): Promise<Conversation>;
}

export class MemStorage implements IStorage {
  private reflections: Map<number, Reflection>;
  private conversations: Map<number, Conversation>;
  private currentReflectionId: number;
  private currentConversationId: number;

  constructor() {
    this.reflections = new Map();
    this.conversations = new Map();
    this.currentReflectionId = 1;
    this.currentConversationId = 1;
  }

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
    const conversation = await this.getConversation(id);
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

export const storage = new MemStorage();