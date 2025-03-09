import { NextRequest, NextResponse } from "next/server";

// Simple test endpoint to verify API routing is working for the new path
export async function GET(req: NextRequest) {
  console.log("[TEST ALT API] Test insights API called at /api/insights/test");
  
  // Always set JSON content type headers
  const headers = new Headers();
  headers.set('Content-Type', 'application/json');
  
  // Return a simple JSON response
  return NextResponse.json(
    { 
      message: "Alternative insights API test endpoint is working", 
      success: true,
      timestamp: new Date().toISOString(),
      path: "/api/insights/test"
    },
    { status: 200, headers }
  );
} 