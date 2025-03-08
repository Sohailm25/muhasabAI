import { NextRequest, NextResponse } from "next/server";
import { generateInsights, PersonalizationContext } from "../../../lib/anthropic";

export async function POST(req: NextRequest) {
  try {
    console.log("Insights API called");
    
    // Parse the request body
    let conversation;
    let personalizationContext;
    
    try {
      const body = await req.json();
      conversation = body.conversation;
      personalizationContext = body.personalizationContext;
      
      console.log("Request body parsed successfully");
      console.log("Conversation length:", conversation?.length || 0);
      console.log("Has personalization:", !!personalizationContext);
    } catch (parseError) {
      console.error("Error parsing request body:", parseError);
      return NextResponse.json(
        { error: "Invalid request format" },
        { status: 400 }
      );
    }
    
    // Validate the request
    if (!conversation) {
      console.error("Missing conversation content");
      return NextResponse.json(
        { error: "Missing conversation content" },
        { status: 400 }
      );
    }
    
    // Log personalization context if provided
    if (personalizationContext) {
      console.log("Generating insights with personalization context:", {
        knowledgeLevel: personalizationContext.knowledgeLevel,
        spiritualJourney: personalizationContext.spiritualJourneyStage,
        topicsCount: personalizationContext.topicsOfInterest?.length || 0,
        goalsCount: personalizationContext.primaryGoals?.length || 0,
      });
    } else {
      console.log("Generating insights without personalization");
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
      console.log("Calling generateInsights function");
      const insights = await generateInsights(
        conversation,
        personalizationContext as PersonalizationContext,
        customPrompt
      );
      
      console.log("Insights generated successfully:", insights?.length || 0);
      
      // Structure the response
      const response = {
        insights
      };
      
      // Set appropriate headers
      const headers = new Headers();
      headers.set('Content-Type', 'application/json');
      
      return NextResponse.json(response, { headers });
    } catch (generationError: unknown) {
      console.error("Error in insights generation:", generationError);
      return NextResponse.json(
        { 
          error: "Failed to generate insights", 
          details: generationError instanceof Error ? generationError.message : String(generationError) 
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Unhandled error in insights API:", error);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
} 