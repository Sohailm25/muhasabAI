import { API } from '@/lib/api';
import { IdentityFramework, FrameworkComponent } from '@shared/schema';

/**
 * Interface for framework guidance response
 */
export interface FrameworkGuidance {
  suggestions: string[];
  examples: string[];
  feedback: string;
}

/**
 * Fetch AI-generated suggestions for a framework component
 * 
 * @param input The user's spiritual aspiration (framework title)
 * @param componentType The type of component ('identity', 'vision', etc.)
 * @param previousComponents Optional array of previously completed components
 * @param regenerate Whether to force regeneration of suggestions
 * @returns The guidance object with suggestions, examples, and feedback
 */
export async function fetchFrameworkGuidance(
  input: string,
  componentType: string,
  previousComponents?: FrameworkComponent[],
  regenerate: boolean = false
): Promise<FrameworkGuidance> {
  console.log(`Fetching guidance for ${componentType} based on "${input}"`);
  try {
    const response = await API.post('/api/framework-guidance', {
      input,
      componentType,
      previousComponents,
      regenerate
    });
    
    console.log(`Received guidance for ${componentType}`);
    return response.guidance;
  } catch (error) {
    console.error(`Error fetching guidance for ${componentType}:`, error);
    // Return default empty guidance on error
    return {
      suggestions: [],
      examples: [],
      feedback: "Failed to load suggestions. Please try again."
    };
  }
}

/**
 * Parse habit suggestion from formatted example string
 * 
 * @param exampleString A formatted habit example string
 * @returns Object with parsed habit properties
 */
export function parseHabitSuggestion(exampleString: string): {
  description: string;
  minimumVersion: string;
  expandedVersion: string;
  reward: string;
} {
  const parts = exampleString.split('\n');
  return {
    description: parts[0]?.replace(/^Habit:?\s*/, '') || '',
    minimumVersion: parts[1]?.replace(/^Minimum version:?\s*/, '') || '',
    expandedVersion: parts[2]?.replace(/^Expanded version:?\s*/, '') || '',
    reward: parts[3]?.replace(/^Immediate reward:?\s*/, '') || ''
  };
}

/**
 * Parse trigger suggestion from formatted example string
 * 
 * @param exampleString A formatted trigger example string
 * @returns Object with parsed trigger properties
 */
export function parseTriggerSuggestion(exampleString: string): {
  primaryTrigger: string;
  secondaryTrigger: string;
  environmentalSupports: string;
} {
  const parts = exampleString.split('\n');
  return {
    primaryTrigger: parts[0]?.replace(/^.*?Primary trigger:?\s*-?\s*/, '') || '',
    secondaryTrigger: parts[1]?.replace(/^.*?Backup trigger:?\s*-?\s*/, '') || '',
    environmentalSupports: parts[2]?.replace(/^.*?Environmental support:?\s*-?\s*/, '') || ''
  };
}

export default {
  fetchFrameworkGuidance,
  parseHabitSuggestion,
  parseTriggerSuggestion
}; 