import { PrivateProfile } from '@/types/profile';

// Define types for reflection requests and responses
export interface ReflectionRequest {
  content: string;
  personalizationContext?: any;
  type?: 'text' | 'audio';
}

// Define the structure of the reflection part of the response
export interface ReflectionData {
  original?: string;
  understanding?: string;
  questions?: string[];
  actionItems?: string[];
  insights?: string[];
  timestamp?: string;
  id?: number;
  content?: string; // For direct API responses
  type?: string;
  transcription?: string | null;
}

// Define the response which might be either direct or nested
export interface ReflectionResponse {
  reflection?: ReflectionData;
  id?: number;
  content?: string;
  timestamp?: string;
  type?: string;
  transcription?: string | null;
}

/**
 * Service for submitting and retrieving reflections
 */
class ReflectionService {
  private apiEndpoint = process.env.NEXT_PUBLIC_API_URL || '/api';
  
  /**
   * Submit a reflection with optional personalization
   * @param content The reflection content
   * @param personalizationContext Optional personalization data object
   * @returns The processed reflection
   */
  async submitReflection(content: string, personalizationContext?: any): Promise<ReflectionResponse> {
    try {
      console.log("Submitting reflection with personalization:", !!personalizationContext);
      
      // Get auth token from localStorage
      const token = localStorage.getItem('auth_token');
      
      // Initialize headers with content type and authorization if token exists
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      // Add authorization if token exists
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      } else {
        console.warn("No auth token found - submission may fail if authentication is required");
      }
      
      // Initialize URL (no query parameters)
      const apiUrl = `${this.apiEndpoint}/reflection`;
      console.log("🔴🔴🔴 Using API URL without query parameters:", apiUrl);
      
      if (personalizationContext) {
        console.log("Personalization context keys:", Object.keys(personalizationContext));
        console.log("Personalization context type:", typeof personalizationContext);
        
        // Validate that the personalization context is an object, not a string
        if (typeof personalizationContext === 'string') {
          console.error("ERROR: personalizationContext is a string, expected an object");
          console.log("personalizationContext string length:", personalizationContext.length);
          console.log("personalizationContext preview:", personalizationContext.substring(0, 100) + "...");
          
          // Try to convert string to object if it's JSON
          try {
            const parsed = JSON.parse(personalizationContext);
            console.log("Successfully parsed personalizationContext string to object with keys:", Object.keys(parsed));
            // Use the parsed object instead
            personalizationContext = parsed;
          } catch (e) {
            console.error("Failed to parse personalizationContext string as JSON:", e);
            // In this case, it's better to have no personalization than wrong format
            console.warn("Ignoring personalization due to invalid format");
            personalizationContext = null;
          }
        } else {
          // For object type, log the content
          console.log("personalizationContext content:", JSON.stringify(personalizationContext, null, 2));
        }
        
        console.log("🔴🔴🔴 IMPORTANT: Only using request body for personalization, NOT URL parameters");
      }
      
      // Create the request body object - only include essential fields
      const requestBody = {
        content,
        type: 'text',
      };
      
      // Add personalization to request body
      if (personalizationContext) {
        console.log("🔴🔴🔴 ADDING PERSONALIZATION TO REQUEST BODY");
        // Add personalization context directly to the request body
        (requestBody as any).personalizationContext = personalizationContext;
        console.log("🔴🔴🔴 REQUEST BODY WITH PERSONALIZATION:", JSON.stringify(requestBody, null, 2).substring(0, 200) + "...");
      }
      
      // Log the exact request body, URL, and headers for debugging
      console.log("SENDING REQUEST BODY:", JSON.stringify(requestBody, null, 2));
      console.log("SENDING REQUEST URL:", apiUrl);
      console.log("SENDING REQUEST HEADERS:", headers);
      
      // Add super prominent debug logs
      console.log("\n\n");
      console.log("🔴🔴🔴 CLIENT SENDING REQUEST TO URL 🔴🔴🔴");
      console.log("🔴🔴🔴 FULL API URL:", apiUrl);
      console.log("🔴🔴🔴 REQUEST CONTAINS NO QUERY PARAMETERS");
      console.log("\n\n");
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(requestBody),
      });
      
      if (!response.ok) {
        console.error(`Error response from server: ${response.status} ${response.statusText}`);
        
        try {
          const errorData = await response.json();
          console.error('Server error details:', errorData);
          throw new Error(errorData.error || 'Failed to submit reflection');
        } catch (jsonError) {
          // If we can't parse the error as JSON, use the status text
          throw new Error(`Server error: ${response.status} ${response.statusText}`);
        }
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error submitting reflection:', error);
      throw error;
    }
  }
}

// Export a singleton instance
export const reflectionService = new ReflectionService();

// Import the hook at component level only
import { usePersonalization } from '@/hooks/usePersonalization';

/**
 * Client-side hook for using the reflection service with personalization
 */
export function useReflectionService() {
  const personalization = usePersonalization();
  // Get an instance of the reflection service
  const reflectionService = new ReflectionService();
  
  // Wrap the submitReflection method to inject personalization
  const submitReflection = async (content: string): Promise<ReflectionResponse> => {
    console.log("useReflectionService.submitReflection called with content:", content.substring(0, 30) + "...");
    
    // Get personalization data if enabled
    let personalizationContext = null;
    
    if (personalization.isPersonalizationEnabled()) {
      console.log("Personalization is enabled, fetching context...");
      try {
        // Use the same getPersonalizationContext function we use everywhere else
        personalizationContext = await personalization.getPersonalizationContext();
        console.log("Retrieved personalization context:", personalizationContext ? "yes" : "no");
        
        if (personalizationContext) {
          // Check if it's an object or a string
          console.log("Personalization context type:", typeof personalizationContext);
          console.log("Personalization context keys:", Object.keys(personalizationContext).join(", "));
          console.log("DEBUG - Full personalization context:", JSON.stringify(personalizationContext, null, 2));
          
          // Validate expected structure
          if (typeof personalizationContext !== 'object') {
            console.warn("WARNING: personalizationContext is not an object, type:", typeof personalizationContext);
            
            // Try to parse if it's a string
            if (typeof personalizationContext === 'string') {
              console.log("Attempting to parse personalizationContext string");
              try {
                personalizationContext = JSON.parse(personalizationContext);
                console.log("Successfully parsed personalizationContext from string to object with keys:", 
                  Object.keys(personalizationContext).join(", "));
              } catch (e) {
                console.error("Failed to parse personalizationContext string:", e);
                
                // If we can't parse it, log it for diagnosis
                console.log("Problematic personalizationContext string:", 
                  personalizationContext.substring(0, 100) + "...");
                  
                // Check localStorage as fallback
                const privateProfile = localStorage.getItem('private_profile');
                if (privateProfile) {
                  try {
                    const profile = JSON.parse(privateProfile);
                    console.log("Falling back to profile from localStorage:", profile);
                    personalizationContext = profile;
                  } catch (e) {
                    console.error("Failed to parse profile from localStorage:", e);
                    personalizationContext = null;
                  }
                } else {
                  console.warn("No private profile data found in localStorage");
                  personalizationContext = null;
                }
              }
            } else {
              console.log("✅ Personalization context is correctly an object type");
            }
          } else {
            console.log("✅ Personalization context is correctly an object type");
          }
        } else {
          console.log("Personalization is enabled, but no data is available");
        }
      } catch (error) {
        console.error("Error preparing personalization context:", error);
        // Continue without personalization on error
        personalizationContext = null;
      }
    }
    
    console.log("About to call reflectionService.submitReflection with personalization:", !!personalizationContext);
    if (personalizationContext) {
      console.log("Personalization context type before API call:", typeof personalizationContext);
      console.log("Personalization context has keys:", Object.keys(personalizationContext).join(", "));
    }
    
    // Submit the reflection with personalization context if available
    try {
      const result = await reflectionService.submitReflection(content, personalizationContext);
      console.log("reflectionService.submitReflection returned result:", result ? "success" : "error");
      return result;
    } catch (error) {
      console.error("Error in reflectionService.submitReflection:", error);
      throw error;
    }
  };
  
  return {
    submitReflection,
    isPersonalizationEnabled: personalization.isPersonalizationEnabled,
    isLoading: personalization.isLoading
  };
} 