import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { wirds } from "@shared/schema";
import { eq } from "drizzle-orm";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string; practiceId: string } }
) {
  try {
    const wirdId = parseInt(params.id);
    const practiceId = params.practiceId;

    if (isNaN(wirdId)) {
      return NextResponse.json(
        { error: "Invalid wird ID format" },
        { status: 400 }
      );
    }

    const { clearFramework } = await req.json();

    if (!clearFramework) {
      return NextResponse.json(
        { error: "Missing CLEAR framework data" },
        { status: 400 }
      );
    }

    // Get the current wird
    const wirdResults = await db.select().from(wirds).where(eq(wirds.id, wirdId)).limit(1);
    
    if (wirdResults.length === 0) {
      return NextResponse.json(
        { error: "Wird not found" },
        { status: 404 }
      );
    }

    const wird = wirdResults[0];
    
    // Find the practice and update its CLEAR framework data
    const practices = wird.practices;
    const practiceIndex = practices.findIndex(p => p.id === practiceId);
    
    if (practiceIndex === -1) {
      return NextResponse.json(
        { error: "Practice not found in this wird" },
        { status: 404 }
      );
    }

    // Update the CLEAR framework data
    practices[practiceIndex] = {
      ...practices[practiceIndex],
      clearFramework
    };

    // Update the wird in the database
    const updatedWird = await db
      .update(wirds)
      .set({
        practices,
        updatedAt: new Date()
      })
      .where(eq(wirds.id, wirdId))
      .returning();

    if (updatedWird.length === 0) {
      return NextResponse.json(
        { error: "Failed to update wird" },
        { status: 500 }
      );
    }

    // Return just the updated practice
    return NextResponse.json(practices[practiceIndex]);
  } catch (error) {
    console.error("Error updating CLEAR framework:", error);
    return NextResponse.json(
      { error: "Failed to update CLEAR framework" },
      { status: 500 }
    );
  }
} 