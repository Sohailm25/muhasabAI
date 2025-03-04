// This file provides browser-compatible versions of the shared schema types
// It acts as a shim for the server-side schema.ts when used from client code

import { 
  Message,
  HalaqaActionItem,
  Halaqa,
  HalaqaFormData,
  ActionItemFormData,
  WirdPractice,
  WirdEntry,
  WirdFormData,
  WirdRecommendation
} from '../types/schema';

// Re-export all client-side types to match the server schema exports
export {
  Message,
  HalaqaActionItem,
  Halaqa,
  HalaqaFormData,
  ActionItemFormData,
  WirdPractice,
  WirdEntry,
  WirdFormData,
  WirdRecommendation
}; 