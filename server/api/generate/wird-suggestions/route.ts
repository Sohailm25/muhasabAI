import { NextRequest, NextResponse } from "next/server";
import { generateWirdRecommendations, generateHalaqaWirdSuggestions } from "../../../lib/anthropic";
import { v4 as uuidv4 } from "uuid";

export async function POST(req: NextRequest) {
  try {
    const { conversation, messages, personalizationContext } = await req.json();
    
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

    // Generate timestamp for IDs
    const timestamp = Date.now();
    
    try {
      // Call Claude to generate wird suggestions
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
        console.error(`API error: ${response.status} - ${response.statusText}`);
        throw new Error(`Failed to generate wird suggestions: ${response.statusText}`);
      }

      const data = await response.json();
      let wirdSuggestions = [];

      // Parse the response
      try {
        // Extract JSON array from response
        const content = data.content[0]?.text || "";
        const jsonMatch = content.match(/\[[\s\S]*\]/);
        
        if (jsonMatch) {
          wirdSuggestions = JSON.parse(jsonMatch[0]);
        } else {
          // If no valid JSON found, create fallback suggestions
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

      return NextResponse.json({ wirdSuggestions });
    } catch (error) {
      console.error("Error generating wird suggestions:", error);
      
      // Return fallback suggestions if generation fails
      const fallbackSuggestions = generateFallbackSuggestions(timestamp);
      return NextResponse.json({ wirdSuggestions: fallbackSuggestions });
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