import { NextRequest, NextResponse } from "next/server";
import { generateInsights } from "../../../../lib/anthropic";

// Debug endpoint to test insights generation with mock Claude responses
export async function GET(req: NextRequest) {
  console.log("[DEBUG API] Debug insights API called");
  
  // Always set JSON content type headers
  const headers = new Headers();
  headers.set('Content-Type', 'application/json');
  
  // Create a mock Claude response with XML-like tags
  const mockClaudeResponse = `<UNDERSTANDING_RESPONSE>
I notice that you've been reflecting on your prayer habits and seeking to improve your connection with Allah. Your journey shows a sincere desire to grow spiritually while navigating the challenges of daily life.
</UNDERSTANDING_RESPONSE>

<REFLECTION_QUESTIONS>
Q1: How has your prayer routine changed over the past few weeks?
Q2: What specific aspects of prayer do you find most challenging to maintain consistently?
Q3: When you do manage to pray with full concentration, how does it affect your overall spiritual state?
</REFLECTION_QUESTIONS>`;

  try {
    // Test our fix by processing this mock response
    const mockConversation = "User: I've been trying to pray more regularly but sometimes struggle with consistency.";
    
    // Call the actual generateInsights function with our mock conversation
    const insights = await generateInsights(mockConversation);
    
    // Return the processed insights
    return NextResponse.json({
      success: true,
      insights,
      mockResponse: mockClaudeResponse,
      message: "Debug endpoint successful"
    }, { status: 200, headers });
  } catch (error) {
    console.error("[DEBUG API] Error in debug endpoint:", error);
    return NextResponse.json({
      success: false,
      error: "Failed to process mock response",
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500, headers });
  }
} 