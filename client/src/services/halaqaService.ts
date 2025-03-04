import { v4 as uuidv4 } from 'uuid';
import { formatDate } from '@/lib/utils';
import axios from 'axios';

// Define types directly in this file to avoid import issues
export interface HalaqaActionItem {
  id: string;
  description: string;
  completed: boolean;
  completedDate?: Date;
}

export interface WirdSuggestion {
  id: string;
  title: string;
  description: string;
  type: string; // e.g., "Quran", "Dhikr", "Dua" 
  duration: string; // e.g., "5 minutes", "10 minutes"
  frequency: string; // e.g., "daily", "weekly"
}

export interface Halaqa {
  id: number;
  userId: string;
  title: string;
  speaker: string | null;
  date: string | Date;
  topic: string;
  keyReflection: string;
  impact: string;
  actionItems: HalaqaActionItem[] | null;
  wirdSuggestions?: WirdSuggestion[] | null;
  createdAt: Date;
  updatedAt: Date;
  isArchived: boolean | null;
}

export interface HalaqaFormData {
  userId: string;
  title: string;
  speaker?: string;
  date: Date;
  topic: string;
  keyReflection: string;
  impact: string;
}

export interface ActionItemFormData {
  description: string;
  completed?: boolean;
}

// Helper function to get API URL
function getApiUrl(): string {
  return import.meta.env.VITE_API_URL || '';
}

// Helper function to get auth headers
function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem('auth_token');
  return token 
    ? { 'Authorization': `Bearer ${token}` }
    : {};
}

export class HalaqaService {
  private apiBase: string;

  constructor() {
    this.apiBase = '/api';
  }

  /**
   * Get all halaqas for the current user
   */
  async getHalaqas(userId: string): Promise<Halaqa[]> {
    try {
      const response = await fetch(`${this.apiBase}/halaqas?userId=${userId}`, {
        headers: {
          ...getAuthHeaders()
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch halaqas');
      }
      
      const data = await response.json();
      
      // Process dates
      return data.halaqas.map((halaqa: any) => ({
        ...halaqa,
        date: new Date(halaqa.date),
        createdAt: new Date(halaqa.createdAt),
        updatedAt: new Date(halaqa.updatedAt),
        actionItems: Array.isArray(halaqa.actionItems) 
          ? halaqa.actionItems.map((item: any) => ({
              ...item,
              completedDate: item.completedDate ? new Date(item.completedDate) : undefined
            })) 
          : []
      }));
    } catch (error) {
      console.error('Error fetching halaqas:', error);
      throw error;
    }
  }

  /**
   * Get a single halaqa by ID
   * @param id Halaqa ID
   * @returns Halaqa object
   */
  async getHalaqa(id: number): Promise<Halaqa> {
    try {
      const response = await fetch(`${this.apiBase}/halaqas/${id}`, {
        headers: {
          ...getAuthHeaders()
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch halaqa: ${response.statusText}`);
      }
      
      const data = await response.json();
      return {
        ...data,
        date: new Date(data.date),
        createdAt: new Date(data.createdAt),
        updatedAt: new Date(data.updatedAt)
      };
    } catch (error) {
      console.error(`Error fetching halaqa ${id}:`, error);
      throw error;
    }
  }

  /**
   * Get all halaqas for a specific user
   * @param userId User ID
   * @returns Array of Halaqa objects
   */
  async getHalaqasByUserId(userId: string): Promise<Halaqa[]> {
    try {
      const response = await fetch(`${this.apiBase}/halaqas/user/${userId}`, {
        headers: {
          ...getAuthHeaders()
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch user halaqas: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data.map((halaqa: any) => ({
        ...halaqa,
        date: new Date(halaqa.date),
        createdAt: new Date(halaqa.createdAt),
        updatedAt: new Date(halaqa.updatedAt),
      }));
    } catch (error) {
      console.error("Error fetching user halaqas:", error);
      throw error;
    }
  }

  /**
   * Create a new halaqa
   * @param data Halaqa form data
   * @returns Created Halaqa object
   */
  async createHalaqa(data: HalaqaFormData): Promise<Halaqa> {
    try {
      const response = await fetch(`${this.apiBase}/halaqas`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        throw new Error(`Failed to create halaqa: ${response.statusText}`);
      }
      
      const responseData = await response.json();
      return {
        ...responseData,
        date: new Date(responseData.date),
        createdAt: new Date(responseData.createdAt),
        updatedAt: new Date(responseData.updatedAt),
      };
    } catch (error) {
      console.error('Error creating halaqa:', error);
      throw error;
    }
  }

  /**
   * Update an existing halaqa
   * @param id Halaqa ID
   * @param halaqaData Updated halaqa data
   * @returns Updated Halaqa object
   */
  async updateHalaqa(id: string | number, halaqaData: HalaqaFormData): Promise<Halaqa> {
    try {
      const response = await fetch(`${this.apiBase}/halaqas/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify(halaqaData),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to update halaqa: ${response.statusText}`);
      }
      
      const data = await response.json();
      return {
        ...data,
        date: new Date(data.date),
        createdAt: new Date(data.createdAt),
        updatedAt: new Date(data.updatedAt),
      };
    } catch (error) {
      console.error("Error updating halaqa:", error);
      throw error;
    }
  }

  /**
   * Archive (soft delete) a halaqa
   * @param id Halaqa ID
   * @returns Success message
   */
  async archiveHalaqa(id: string | number): Promise<{success: boolean, message: string}> {
    try {
      const response = await fetch(`${this.apiBase}/halaqas/${id}`, {
        method: 'DELETE',
        headers: {
          ...getAuthHeaders()
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to archive halaqa: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error("Error archiving halaqa:", error);
      throw error;
    }
  }

  /**
   * Generate action items for a halaqa using AI
   * @param id Halaqa ID
   * @returns Updated Halaqa with generated action items
   */
  async generateActionItems(id: string | number): Promise<Halaqa> {
    try {
      const response = await fetch(`${this.apiBase}/halaqas/${id}/actions`, {
        method: 'POST',
        headers: {
          ...getAuthHeaders()
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to generate action items: ${response.statusText}`);
      }
      
      const data = await response.json();
      return {
        ...data,
        date: new Date(data.date),
        createdAt: new Date(data.createdAt),
        updatedAt: new Date(data.updatedAt),
      };
    } catch (error) {
      console.error("Error generating action items:", error);
      throw error;
    }
  }

  /**
   * Generate wird suggestions for a halaqa using AI
   * @param id Halaqa ID 
   * @returns Updated Halaqa with generated wird suggestions
   */
  async generateWirdSuggestions(id: string | number): Promise<Halaqa> {
    try {
      const response = await fetch(`${this.apiBase}/halaqas/${id}/wird`, {
        method: 'POST',
        headers: {
          ...getAuthHeaders()
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to generate wird suggestions: ${response.statusText}`);
      }
      
      const data = await response.json();
      return {
        ...data,
        date: new Date(data.date),
        createdAt: new Date(data.createdAt),
        updatedAt: new Date(data.updatedAt),
      };
    } catch (error) {
      console.error("Error generating wird suggestions:", error);
      throw error;
    }
  }

  /**
   * Analyze a halaqa entry to generate action items and wird suggestions
   * @param id Halaqa ID
   * @returns Analysis results
   */
  async analyzeHalaqaEntry(id: string | number): Promise<any> {
    try {
      const response = await fetch(`${this.apiBase}/halaqas/${id}/analyze`, {
        method: 'POST',
        headers: {
          ...getAuthHeaders()
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to analyze halaqa: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error("Error analyzing halaqa:", error);
      throw error;
    }
  }

  /**
   * Update an action item
   * @param halaqaId Halaqa ID
   * @param actionItemId Action item ID
   * @param actionItemData Updated action item data
   * @returns Updated Halaqa object
   */
  async updateActionItem(
    halaqaId: string | number, 
    actionItemId: string, 
    actionItemData: HalaqaActionItem
  ): Promise<Halaqa> {
    try {
      const response = await fetch(`${this.apiBase}/halaqas/${halaqaId}/actions/${actionItemId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(actionItemData),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to update action item: ${response.statusText}`);
      }
      
      const data = await response.json();
      return {
        ...data,
        date: new Date(data.date),
        createdAt: new Date(data.createdAt),
        updatedAt: new Date(data.updatedAt),
      };
    } catch (error) {
      console.error("Error updating action item:", error);
      throw error;
    }
  }

  /**
   * Delete an action item
   * @param halaqaId Halaqa ID
   * @param actionItemId Action item ID
   * @returns Updated Halaqa object
   */
  async deleteActionItem(halaqaId: string | number, actionItemId: string): Promise<Halaqa> {
    try {
      const response = await fetch(`${this.apiBase}/halaqas/${halaqaId}/actions/${actionItemId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error(`Failed to delete action item: ${response.statusText}`);
      }
      
      const data = await response.json();
      return {
        ...data,
        date: new Date(data.date),
        createdAt: new Date(data.createdAt),
        updatedAt: new Date(data.updatedAt),
      };
    } catch (error) {
      console.error("Error deleting action item:", error);
      throw error;
    }
  }

  /**
   * Generate application suggestions based on user inputs
   * @param descriptionSection Description of topic and speaker
   * @param insightsSection Insights and key learnings
   * @param emotionsSection Personal connection
   * @returns Array of suggested applications
   */
  async generateApplicationSuggestions(
    descriptionSection: string,
    insightsSection: string,
    emotionsSection: string
  ): Promise<string[]> {
    try {
      const response = await fetch(`${this.apiBase}/halaqas/suggestions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          descriptionSection,
          insightsSection,
          emotionsSection
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to generate suggestions: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data.suggestions;
    } catch (error) {
      console.error("Error generating application suggestions:", error);
      throw error;
    }
  }
}

// Create a singleton instance
export const halaqaService = new HalaqaService();

/**
 * Analyze a halaqa entry to generate wird suggestions
 * @param halaqaId The ID of the halaqa to analyze
 * @returns Updated halaqa data with generated wird suggestions
 */
export async function analyzeHalaqaEntry(halaqaId: number): Promise<{ wirdSuggestions: WirdSuggestion[] }> {
  try {
    const response = await axios.post(`${getApiUrl()}/halaqas/analyze`, { halaqaId });
    return response.data;
  } catch (error) {
    console.error('Error analyzing halaqa entry:', error);
    throw new Error('Failed to analyze halaqa entry');
  }
}

/**
 * Add a wird suggestion to the user's wird plan
 * @param userId User ID
 * @param wirdSuggestion The wird suggestion to add
 * @param date Optional date to add the wird for (defaults to today)
 * @returns Success status
 */
export async function addWirdSuggestionToWirdPlan(
  userId: string,
  wirdSuggestion: WirdSuggestion,
  date?: Date
): Promise<boolean> {
  try {
    const response = await axios.post(`${getApiUrl()}/wird/add-suggestion`, {
      userId,
      wirdSuggestion,
      date: date ? date.toISOString() : new Date().toISOString()
    });
    return response.data.success;
  } catch (error) {
    console.error('Error adding wird suggestion to plan:', error);
    throw new Error('Failed to add wird suggestion to plan');
  }
} 