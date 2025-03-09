import { NextRequest, NextResponse } from "next/server";
import { generateInsights, PersonalizationContext } from "../../lib/anthropic";

// Alternative route for insights generation at /api/insights
export async function POST(req: NextRequest) {
  // Always set JSON content type headers
  const headers = new Headers();
  headers.set('Content-Type', 'application/json');
  
  try {
    console.log("[INSIGHTS ALT API] Insights API called at /api/insights");
    
    // Parse the request body
    let conversation;
    let personalizationContext;
    
    try {
      const body = await req.json();
      conversation = body.conversation;
      personalizationContext = body.personalizationContext;
      
      console.log("[INSIGHTS ALT API] Request body parsed successfully");
      console.log("[INSIGHTS ALT API] Conversation length:", conversation?.length || 0);
      console.log("[INSIGHTS ALT API] Has personalization:", !!personalizationContext);
    } catch (parseError) {
      console.error("[INSIGHTS ALT API] Error parsing request body:", parseError);
      return NextResponse.json(
        { error: "Invalid request format", success: false },
        { status: 400, headers }
      );
    }
    
    // Validate the request
    if (!conversation) {
      console.error("[INSIGHTS ALT API] Missing conversation content");
      return NextResponse.json(
        { error: "Missing conversation content", success: false },
        { status: 400, headers }
      );
    }
    
    try {
      // Generate insights with personalization if available
      console.log("[INSIGHTS ALT API] Calling generateInsights function");
      
      let insights;
      try {
        insights = await generateInsights(
          conversation,
          personalizationContext as PersonalizationContext
        );
        
        console.log("[INSIGHTS ALT API] Insights generated successfully:", insights?.length || 0);
      } catch (insightError) {
        console.error("[INSIGHTS ALT API] Error in generateInsights function:", insightError);
        throw insightError; // Re-throw to be caught by the outer catch block
      }
      
      // Validate insights to ensure it's an array
      if (!Array.isArray(insights)) {
        console.error("[INSIGHTS ALT API] Invalid insights format, not an array:", typeof insights);
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
      console.error("[INSIGHTS ALT API] Error in insights generation:", generationError);
      
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
    console.error("[INSIGHTS ALT API] Unhandled error in insights API:", error);
    
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