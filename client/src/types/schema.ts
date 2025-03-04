// Client-side type definitions matching the server schema

// Message type for chat
export interface Message {
  role: "user" | "assistant";
  content: string;
}

// Halaqa types
export interface HalaqaActionItem {
  id: string;
  description: string;
  completed: boolean;
  completedDate?: Date;
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

// Wird types
export interface WirdPractice {
  id?: string;
  name: string;
  category: string;
  target: number;
  completed: number;
  unit: string;
  isCompleted: boolean;
}

export interface WirdSuggestion {
  id: string;
  title: string;
  description: string;
  type: string; // e.g., "Quran", "Dhikr", "Dua" 
  duration: string; // e.g., "5 minutes", "10 minutes"
  frequency: string; // e.g., "daily", "weekly"
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