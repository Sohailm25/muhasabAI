import { NextRequest, NextResponse } from "next/server";
import { generateCLEARSuggestions } from "@/lib/anthropic";

export async function POST(req: NextRequest) {
  try {
    const { practice } = await req.json();
    
    if (!practice) {
      return NextResponse.json(
        { error: "Missing practice data" },
        { status: 400 }
      );
    }

    // Get suggestions from Claude
    const suggestions = await generateCLEARSuggestions(practice);
    
    // Return the suggestions
    return NextResponse.json(suggestions);
  } catch (error) {
    console.error("Error generating CLEAR suggestions:", error);
    return NextResponse.json(
      { error: "Failed to generate CLEAR suggestions" },
      { status: 500 }
    );
  }
} 