import { NextRequest, NextResponse } from "next/server";
import { generateWirdRecommendations, generateHalaqaWirdSuggestions } from "../../../lib/anthropic";
import { v4 as uuidv4 } from "uuid";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "sahabai-secret-key";

// Helper function to verify JWT token
const verifyToken = (token: string) => {
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: string };
  } catch (error) {
    console.error("JWT verification error:", error);
    return null;
  }
};

export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('[AUTH DEBUG] No valid authorization header found for wird-suggestions');
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }
    
    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);
    
    if (!decoded || !decoded.userId) {
      console.log('[AUTH DEBUG] Invalid token for wird-suggestions');
      return NextResponse.json(
        { error: "Invalid authentication token" },
        { status: 401 }
      );
    }
    
    console.log(`[AUTH DEBUG] Authenticated user ${decoded.userId} for wird-suggestions`);
    
    // Parse the request body
    const requestBody = await req.json();
    console.log("Request body keys:", Object.keys(requestBody));
    
    // Determine the source of the request (halaqa or chat/reflection)
    const isHalaqaRequest = requestBody.halaqaContent !== undefined;
    console.log("Request source:", isHalaqaRequest ? "halaqa" : "chat/reflection");
    
    // Generate timestamp for IDs
    const timestamp = Date.now();
    
    // Handle halaqa requests
    if (isHalaqaRequest) {
      const { halaqaContent } = requestBody;
      
      // Validate halaqa content
      if (!halaqaContent || !halaqaContent.title || !halaqaContent.topic) {
        console.error("Invalid halaqa content:", halaqaContent);
        return NextResponse.json(
          { error: "Invalid halaqa content" },
          { status: 400 }
        );
      }
      
      try {
        // Generate wird suggestions for halaqa
        console.log("Generating wird suggestions for halaqa:", halaqaContent.title);
        const wirdSuggestions = await generateHalaqaWirdSuggestions(halaqaContent);
        return NextResponse.json({ wirdSuggestions });
      } catch (error) {
        console.error("Error generating halaqa wird suggestions:", error);
        const fallbackSuggestions = generateFallbackSuggestions(timestamp);
        return NextResponse.json({ wirdSuggestions: fallbackSuggestions });
      }
    }
    
    // Handle chat/reflection requests
    else {
      const { conversation, messages, personalizationContext } = requestBody;
      
      // Validate the request
      if (!conversation) {
        return NextResponse.json(
          { error: "Missing conversation content" },
          { status: 400 }
        );
      }
      
      // Log personalization context if provided
      if (personalizationContext) {
        console.log("Generating wird suggestions with personalization context:", {
          knowledgeLevel: personalizationContext.knowledgeLevel,
          spiritualJourney: personalizationContext.spiritualJourneyStage,
          topicsCount: personalizationContext.topicsOfInterest?.length || 0,
          goalsCount: personalizationContext.primaryGoals?.length || 0,
        });
      } else {
        console.log("Generating wird suggestions without personalization");
      }
      
      // Extract key themes from the conversation
      console.log("Extracting key themes from conversation context");
      console.log("Conversation length:", conversation.length, "characters");
      
      // Custom prompt for generating wird suggestions from conversation
      const customPrompt = `
As an Islamic spiritual mentor, I need your help generating personalized spiritual practice (wird) suggestions based on a reflection conversation.

CONVERSATION CONTEXT:
${conversation}

INSTRUCTION:
Based solely on the specific themes, concerns, and spiritual needs expressed in this conversation, generate 3-5 personalized wird (devotional practice) suggestions that:

1. Address specific spiritual needs, challenges, or goals mentioned in the conversation
2. Connect directly to Islamic concepts or teachings relevant to what was discussed
3. Are practical, specific, and actionable
4. Vary in commitment level (some quick/easy, some deeper)

Each suggestion should:
- Have a clear purpose directly related to something mentioned in the conversation
- Include specific implementation guidance (when, how, what to say/do)
- Be grounded in authentic Islamic practice

Provide your output as a JSON array of wird suggestion objects with these fields:
- id: A unique identifier string (e.g., "wird-{timestamp}-{number}")
- type: A category like "Quran", "Dhikr", "Dua", "Sunnah", or "Charity" 
- category: Same as type
- name: A concise, descriptive title (e.g., "Morning Gratitude Dhikr")
- title: Same as name
- description: A detailed explanation connecting to specific themes from their reflection (3-4 sentences)
- target: A numeric goal (e.g., 5, 10, 33)
- unit: The unit for the target (e.g., "pages", "minutes", "times")
- duration: An estimated time commitment (e.g., "5-10 minutes")
- frequency: How often to practice (e.g., "daily", "weekly")

Response format must be valid JSON only, no markdown or additional text.
`;
      
      try {
        // Call Claude to generate wird suggestions
        console.log("Calling Claude API to generate wird suggestions");
        const response = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": process.env.ANTHROPIC_API_KEY || "",
            "anthropic-version": "2023-06-01"
          },
          body: JSON.stringify({
            model: "claude-3-opus-20240229",
            max_tokens: 2000,
            temperature: 0.7,
            system: "You are an insightful Islamic spiritual guide helping Muslims develop personalized spiritual practices.",
            messages: [
              {
                role: "user",
                content: customPrompt
              }
            ]
          })
        });

        if (!response.ok) {
          console.error(`Claude API error: ${response.status} - ${response.statusText}`);
          throw new Error(`Failed to generate wird suggestions: ${response.statusText}`);
        }

        const data = await response.json();
        let wirdSuggestions = [];

        // Parse the response
        try {
          // Extract JSON array from response
          const content = data.content[0]?.text || "";
          console.log("Claude response received, length:", content.length);
          const jsonMatch = content.match(/\[[\s\S]*\]/);
          
          if (jsonMatch) {
            console.log("JSON match found in Claude response");
            wirdSuggestions = JSON.parse(jsonMatch[0]);
            console.log(`Successfully parsed ${wirdSuggestions.length} wird suggestions`);
          } else {
            // If no valid JSON found, create fallback suggestions
            console.log("No valid JSON found in Claude response, using fallback");
            wirdSuggestions = generateFallbackSuggestions(timestamp);
          }
        } catch (parseError) {
          console.error("Error parsing wird suggestions:", parseError);
          wirdSuggestions = generateFallbackSuggestions(timestamp);
        }

        // Ensure all suggestions have required fields
        wirdSuggestions = wirdSuggestions.map((suggestion: any, index: number) => {
          return {
            id: suggestion.id || `wird-${timestamp}-${index + 1}`,
            type: suggestion.type || "General",
            category: suggestion.category || suggestion.type || "General",
            name: suggestion.name || suggestion.title || "Spiritual Practice",
            title: suggestion.title || suggestion.name || "Spiritual Practice",
            description: suggestion.description || "A regular spiritual practice to strengthen your connection with Allah.",
            target: suggestion.target || 1,
            unit: suggestion.unit || "times",
            duration: suggestion.duration || "5-10 minutes",
            frequency: suggestion.frequency || "daily",
          };
        });

        console.log("Returning wird suggestions to client");
        return NextResponse.json({ wirdSuggestions });
      } catch (error) {
        console.error("Error generating wird suggestions:", error);
        
        // Return fallback suggestions if generation fails
        const fallbackSuggestions = generateFallbackSuggestions(timestamp);
        return NextResponse.json({ wirdSuggestions: fallbackSuggestions });
      }
    }
  } catch (error) {
    console.error("Error in wird-suggestions endpoint:", error);
    return NextResponse.json(
      { error: "Failed to generate wird suggestions" },
      { status: 500 }
    );
  }
}

// Generate fallback suggestions if API call fails
function generateFallbackSuggestions(timestamp: number) {
  return [
    {
      id: `wird-${timestamp}-1`,
      type: "Quran",
      category: "Quran",
      name: "Daily Quran Reading",
      title: "Daily Quran Reading",
      description: "Read portions of the Quran daily to strengthen your connection with Allah's words",
      target: 5,
      unit: "pages",
      duration: "15-20 minutes",
      frequency: "daily"
    },
    {
      id: `wird-${timestamp}-2`,
      type: "Dhikr",
      category: "Dhikr",
      name: "Morning and Evening Adhkar",
      title: "Morning and Evening Adhkar",
      description: "Incorporate the Prophetic morning and evening remembrances into your daily routine",
      target: 1,
      unit: "session",
      duration: "10 minutes",
      frequency: "twice daily"
    },
    {
      id: `wird-${timestamp}-3`,
      type: "Dua",
      category: "Dua",
      name: "Personal Reflection Dua",
      title: "Personal Reflection Dua",
      description: "Take time for personal conversation with Allah, expressing gratitude and seeking guidance",
      target: 1,
      unit: "session",
      duration: "5 minutes",
      frequency: "daily"
    }
  ];
} 