import { NextRequest, NextResponse } from "next/server";

// Simple test endpoint to verify API routing is working
export async function GET(req: NextRequest) {
  console.log("[TEST API] Test insights API called");
  
  // Always set JSON content type headers
  const headers = new Headers();
  headers.set('Content-Type', 'application/json');
  
  // Return a simple JSON response
  return NextResponse.json(
    { 
      message: "Test insights API is working", 
      success: true,
      timestamp: new Date().toISOString()
    },
    { status: 200, headers }
  );
} 