import { NextRequest, NextResponse } from "next/server";
import { generateInsights, PersonalizationContext } from "../../../lib/anthropic";

// This file defines the API route for /api/generate/insights
// It should be located at server/api/generate/insights/route.ts
export async function POST(req: NextRequest) {
  // Always set JSON content type headers
  const headers = new Headers();
  headers.set('Content-Type', 'application/json');
  
  try {
    console.log("[INSIGHTS API] Insights API called");
    
    // Parse the request body
    let conversation;
    let personalizationContext;
    
    try {
      const body = await req.json();
      conversation = body.conversation;
      personalizationContext = body.personalizationContext;
      
      console.log("[INSIGHTS API] Request body parsed successfully");
      console.log("[INSIGHTS API] Conversation length:", conversation?.length || 0);
      console.log("[INSIGHTS API] Has personalization:", !!personalizationContext);
    } catch (parseError) {
      console.error("[INSIGHTS API] Error parsing request body:", parseError);
      return NextResponse.json(
        { error: "Invalid request format", success: false },
        { status: 400, headers }
      );
    }
    
    // Validate the request
    if (!conversation) {
      console.error("[INSIGHTS API] Missing conversation content");
      return NextResponse.json(
        { error: "Missing conversation content", success: false },
        { status: 400, headers }
      );
    }
    
    // Log personalization context if provided
    if (personalizationContext) {
      console.log("[INSIGHTS API] Generating insights with personalization context:", {
        knowledgeLevel: personalizationContext.knowledgeLevel,
        spiritualJourney: personalizationContext.spiritualJourneyStage,
        topicsCount: personalizationContext.topicsOfInterest?.length || 0,
        goalsCount: personalizationContext.primaryGoals?.length || 0,
      });
    } else {
      console.log("[INSIGHTS API] Generating insights without personalization");
    }
    
    // Custom prompt for generating insights from conversation history
    const customPrompt = `
As an insightful Islamic Reflection Analyst with deep scholarly knowledge of the Quran, Sunnah, and authentic Tafsir, your role is to provide meaningful spiritual insights after carefully observing a user's reflection journey through multiple exchanges.

When analyzing a conversation:

1. ASSESSMENT PHASE:
   - Review the complete conversation history thoroughly
   - Identify the user's specific situation, challenges, and growth areas
   - Consider both explicit statements and implicit attitudes or beliefs

2. ANALYSIS PHASE:
   - Identify recurring themes, challenges, spiritual states, and patterns in the user's reflections
   - Note specific areas where the user shows growth, insight, or struggle
   - Connect these observations to relevant Islamic concepts and principles
   - Prepare references from primary Islamic sources that relate to their specific situation

3. INSIGHT GENERATION:
   - Create 3-5 meaningful insights that synthesize your observations
   - Format each insight with:
     * A clear statement of the pattern or understanding you've observed
     * A connection to Islamic wisdom through authenticated sources
     * A practical spiritual consideration or action the user might contemplate
   - Each insight must include at least one specific reference to Quran, authentic hadith, or established scholarly interpretation

4. VERIFICATION PROCESS:
   - For every Quranic reference:
     * Verify the surah and verse number
     * Ensure the interpretation aligns with mainstream tafsir
     * Double-check that the application to the user's situation is appropriate
   - For every hadith reference:
     * Confirm it comes from authentic collections (Bukhari, Muslim, etc.)
     * Verify attribution to narrator and authenticity grading
     * Ensure the context of usage respects the original meaning
   - For scholarly interpretations:
     * Only include widely accepted interpretations from recognized authorities
     * Avoid controversial opinions or minority positions
     * Note if multiple valid interpretations exist on a matter

Your insights should offer new perspectives that help the user integrate their personal experiences with Islamic wisdom, revealing connections they might not have recognized on their own.

Here is the conversation history to analyze:
${conversation}

Respond with only a JSON array of 3-5 insights, with each insight as a string in the array.
`;
    
    try {
      // Generate insights with personalization if available
      console.log("[INSIGHTS API] Calling generateInsights function");
      
      let insights;
      try {
        insights = await generateInsights(
          conversation,
          personalizationContext as PersonalizationContext,
          customPrompt
        );
        
        console.log("[INSIGHTS API] Insights generated successfully:", insights?.length || 0);
      } catch (insightError) {
        console.error("[INSIGHTS API] Error in generateInsights function:", insightError);
        throw insightError; // Re-throw to be caught by the outer catch block
      }
      
      // Validate insights to ensure it's an array
      if (!Array.isArray(insights)) {
        console.error("[INSIGHTS API] Invalid insights format, not an array:", typeof insights);
        throw new Error("Invalid insights format returned from generator");
      }
      
      // Structure the response
      const response = {
        insights,
        success: true
      };
      
      // Return JSON response with headers
      return NextResponse.json(response, { headers });
    } catch (generationError: unknown) {
      console.error("[INSIGHTS API] Error in insights generation:", generationError);
      
      // Fallback insights in case of error
      const fallbackInsights = [
        "Your journey of self-reflection demonstrates a sincere desire to grow spiritually, as emphasized in Surah Al-Ra'd (13:11): 'Indeed, Allah will not change the condition of a people until they change what is in themselves.'", 
        "Your consistent practice of contemplation aligns with the Prophet's ﷺ emphasis on self-accounting, as he said: 'The wise person is one who takes account of himself and works for what comes after death.' (Tirmidhi)", 
        "Each step of your spiritual journey reflects the concept of ihsan mentioned in the famous hadith of Jibril, where the Prophet ﷺ described it as 'worshiping Allah as if you see Him, for though you do not see Him, He surely sees you.' (Bukhari & Muslim)"
      ];
      
      // Return fallback insights with error details
      return NextResponse.json(
        { 
          insights: fallbackInsights,
          error: "Failed to generate insights", 
          details: generationError instanceof Error ? generationError.message : String(generationError),
          success: false,
          fallback: true
        },
        { status: 200, headers }  // Return 200 with fallback insights instead of 500
      );
    }
  } catch (error) {
    console.error("[INSIGHTS API] Unhandled error in insights API:", error);
    
    // Even for unhandled errors, return JSON
    return NextResponse.json(
      { 
        error: "Failed to process request", 
        details: error instanceof Error ? error.message : String(error),
        success: false
      },
      { status: 500, headers }
    );
  }
} 