import { NextRequest, NextResponse } from "next/server";
import { generateActionItems, PersonalizationContext } from "../../../lib/anthropic";

export async function POST(req: NextRequest) {
  try {
    const { conversation, personalizationContext } = await req.json();
    
    // Validate the request
    if (!conversation) {
      return NextResponse.json(
        { error: "Missing conversation content" },
        { status: 400 }
      );
    }
    
    // Log personalization context if provided
    if (personalizationContext) {
      console.log("Generating action items with personalization context:", {
        knowledgeLevel: personalizationContext.knowledgeLevel,
        spiritualJourney: personalizationContext.spiritualJourneyStage,
        topicsCount: personalizationContext.topicsOfInterest?.length || 0,
        goalsCount: personalizationContext.primaryGoals?.length || 0,
      });
    } else {
      console.log("Generating action items without personalization");
    }
    
    // Generate action items with personalization if available
    const actionItems = await generateActionItems(
      conversation,
      personalizationContext as PersonalizationContext
    );
    
    // Structure the response
    const response = {
      actionItems
    };
    
    return NextResponse.json(response);
  } catch (error) {
    console.error("Error generating action items:", error);
    return NextResponse.json(
      { error: "Failed to generate action items" },
      { status: 500 }
    );
  }
} 