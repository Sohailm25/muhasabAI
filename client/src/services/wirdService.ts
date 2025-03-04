import { formatDate } from "@/lib/utils";
import { v4 as uuidv4 } from 'uuid';

// Define types directly in this file to avoid import issues
export interface WirdPractice {
  id?: string;
  name: string;
  category: string;
  target: number;
  completed: number;
  unit: string;
  isCompleted: boolean;
}

export interface WirdEntry {
  id: number;
  userId: string;
  date: string | Date;
  practices: WirdPractice[];
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  isArchived: boolean | null;
}

export interface WirdFormData {
  userId: string;
  date: Date;
  practices: WirdPractice[];
  notes?: string;
}

export interface WirdRecommendation {
  name: string;
  category: string;
  target: number;
  unit: string;
  description: string;
}

export class WirdService {
  private apiBase: string;

  constructor() {
    this.apiBase = '/api';
  }

  /**
   * Get all wird entries for a user
   * @param userId User ID
   * @returns Array of WirdEntry objects
   */
  async getWirdsByUserId(userId: string): Promise<WirdEntry[]> {
    try {
      const response = await fetch(`${this.apiBase}/wirds/user/${userId}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch wird entries: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data.map((wird: any) => ({
        ...wird,
        date: new Date(wird.date),
        createdAt: new Date(wird.createdAt),
        updatedAt: new Date(wird.updatedAt),
      }));
    } catch (error) {
      console.error("Error fetching wird entries:", error);
      throw error;
    }
  }
  
  /**
   * Get a wird entry by ID
   * @param id Wird ID
   * @returns WirdEntry object
   */
  async getWird(id: number): Promise<WirdEntry> {
    try {
      const response = await fetch(`${this.apiBase}/wirds/${id}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch wird entry: ${response.statusText}`);
      }
      
      const data = await response.json();
      return {
        ...data,
        date: new Date(data.date),
        createdAt: new Date(data.createdAt),
        updatedAt: new Date(data.updatedAt),
      };
    } catch (error) {
      console.error("Error fetching wird entry:", error);
      throw error;
    }
  }
  
  /**
   * Get a wird entry by date for a specific user
   * @param userId User ID
   * @param date Date object
   * @returns WirdEntry object or null if not found
   */
  async getWirdByDate(userId: string, date: Date): Promise<WirdEntry | null> {
    try {
      // Format date as YYYY-MM-DD
      const formattedDate = date.toISOString().split('T')[0];
      
      const response = await fetch(`${this.apiBase}/wirds/date/${userId}/${formattedDate}`);
      
      if (response.status === 404) {
        // No wird entry for this date
        return null;
      }
      
      if (!response.ok) {
        throw new Error(`Failed to fetch wird entry: ${response.statusText}`);
      }
      
      const data = await response.json();
      return {
        ...data,
        date: new Date(data.date),
        createdAt: new Date(data.createdAt),
        updatedAt: new Date(data.updatedAt),
      };
    } catch (error) {
      console.error("Error fetching wird entry by date:", error);
      throw error;
    }
  }
  
  /**
   * Create a new wird entry
   * @param wirdData Wird form data
   * @returns Created WirdEntry object
   */
  async createWird(wirdData: WirdFormData): Promise<WirdEntry> {
    try {
      // Ensure every practice has an ID
      const practices = wirdData.practices.map(practice => ({
        ...practice,
        id: practice.id || uuidv4()
      }));
      
      // Format the data for the API
      const formattedData = {
        ...wirdData,
        practices,
        date: wirdData.date.toISOString().split('T')[0] // Format as YYYY-MM-DD
      };
      
      const response = await fetch(`${this.apiBase}/wirds`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formattedData),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to create wird entry: ${response.statusText}`);
      }
      
      const data = await response.json();
      return {
        ...data,
        date: new Date(data.date),
        createdAt: new Date(data.createdAt),
        updatedAt: new Date(data.updatedAt),
      };
    } catch (error) {
      console.error("Error creating wird entry:", error);
      throw error;
    }
  }
  
  /**
   * Update a wird entry
   * @param id Wird ID
   * @param wirdData Updated wird data
   * @returns Updated WirdEntry object
   */
  async updateWird(id: number, wirdData: Partial<WirdFormData>): Promise<WirdEntry> {
    try {
      const response = await fetch(`${this.apiBase}/wirds/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(wirdData),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to update wird entry: ${response.statusText}`);
      }
      
      const data = await response.json();
      return {
        ...data,
        date: new Date(data.date),
        createdAt: new Date(data.createdAt),
        updatedAt: new Date(data.updatedAt),
      };
    } catch (error) {
      console.error("Error updating wird entry:", error);
      throw error;
    }
  }
  
  /**
   * Update a specific practice in a wird entry
   * @param wirdId Wird ID
   * @param practiceId Practice ID
   * @param practiceData Updated practice data
   * @returns Updated WirdEntry object
   */
  async updatePractice(
    wirdId: number,
    practiceId: string,
    practiceData: { completed: number; isCompleted: boolean }
  ): Promise<WirdEntry> {
    try {
      const response = await fetch(`${this.apiBase}/wirds/${wirdId}/practices/${practiceId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(practiceData),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to update practice: ${response.statusText}`);
      }
      
      const data = await response.json();
      return {
        ...data,
        date: new Date(data.date),
        createdAt: new Date(data.createdAt),
        updatedAt: new Date(data.updatedAt),
      };
    } catch (error) {
      console.error("Error updating practice:", error);
      throw error;
    }
  }
  
  /**
   * Get wird entries for a date range
   * @param userId User ID
   * @param startDate Start date
   * @param endDate End date
   * @returns Array of WirdEntry objects
   */
  async getWirdsByDateRange(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<WirdEntry[]> {
    try {
      // Format dates as YYYY-MM-DD
      const formattedStartDate = startDate.toISOString().split('T')[0];
      const formattedEndDate = endDate.toISOString().split('T')[0];
      
      const response = await fetch(
        `${this.apiBase}/wirds/range/${userId}/${formattedStartDate}/${formattedEndDate}`
      );
      
      if (!response.ok) {
        throw new Error(`Failed to fetch wird entries: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data.map((wird: any) => ({
        ...wird,
        date: new Date(wird.date),
        createdAt: new Date(wird.createdAt),
        updatedAt: new Date(wird.updatedAt),
      }));
    } catch (error) {
      console.error("Error fetching wird entries by date range:", error);
      throw error;
    }
  }
  
  /**
   * Get personalized wird recommendations
   * @param userId User ID
   * @param history Previous wird entries or practice history
   * @param preferences User preferences
   * @returns Array of WirdRecommendation objects
   */
  async getRecommendations(
    userId: string,
    history?: any,
    preferences?: any
  ): Promise<WirdRecommendation[]> {
    try {
      const response = await fetch(`${this.apiBase}/wirds/recommendations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          history: history || [],
          preferences: preferences || {}
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to get recommendations: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data.recommendations;
    } catch (error) {
      console.error("Error getting wird recommendations:", error);
      throw error;
    }
  }
}

// Create a singleton instance
export const wirdService = new WirdService(); 