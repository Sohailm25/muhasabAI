import { NextRequest, NextResponse } from "next/server";
import { generateFollowUpQuestions, generateActionItems, generateInsights, PersonalizationContext } from "../../lib/anthropic";
import { getDebugHeaders } from "../../lib/debug-logs";

// ANSI color codes for terminal output
const COLORS = {
  RESET: "\x1b[0m",
  BRIGHT: "\x1b[1m",
  RED: "\x1b[31m",
  GREEN: "\x1b[32m",
  YELLOW: "\x1b[33m",
  BLUE: "\x1b[34m",
  MAGENTA: "\x1b[35m",
  CYAN: "\x1b[36m",
  BG_RED: "\x1b[41m",
  BG_CYAN: "\x1b[46m",
  BG_BLACK: "\x1b[40m"
};

/**
 * Display a detailed personalization summary in terminal
 */
function logPersonalizationSummary(context: any): void {
  if (!context) {
    console.log(`${COLORS.BRIGHT}${COLORS.RED}NO PERSONALIZATION DATA PROVIDED${COLORS.RESET}`);
    return;
  }
  
  console.log(`\n${COLORS.BG_BLACK}${COLORS.BRIGHT}${COLORS.CYAN}======= PERSONALIZATION SUMMARY =======${COLORS.RESET}`);
  
  // Process scalar values
  const scalarFields = ['knowledgeLevel', 'spiritualJourneyStage', 'lifeStage', 
                      'communityConnection', 'culturalBackground', 'reflectionStyle'];
  const arrayFields = ['topicsOfInterest', 'primaryGoals', 'guidancePreferences'];
  
  console.log(`\n${COLORS.BRIGHT}${COLORS.GREEN}User Profile:${COLORS.RESET}`);
  
  scalarFields.forEach(field => {
    if (context[field]) {
      console.log(`  ${COLORS.YELLOW}${field}:${COLORS.RESET} ${context[field]}`);
    }
  });
  
  console.log(`\n${COLORS.BRIGHT}${COLORS.GREEN}Preferences:${COLORS.RESET}`);
  
  arrayFields.forEach(field => {
    if (context[field] && context[field].length > 0) {
      console.log(`  ${COLORS.YELLOW}${field}:${COLORS.RESET}`);
      context[field].forEach((item: string) => {
        console.log(`    - ${item}`);
      });
    }
  });
  
  console.log(`\n${COLORS.CYAN}===================================================${COLORS.RESET}\n`);
}

export async function POST(req: NextRequest) {
  try {
    console.log("\n\n🔵🔵🔵 NEXT.JS ROUTE HANDLER: Request received at /api/reflection 🔵🔵🔵");
    console.log("\n\n🔴🔴🔴 ROUTE HANDLER STARTING - CRITICAL DEBUG 🔴🔴🔴");
    
    // Declare variables at the top to avoid redeclarations
    let personalizationContext: PersonalizationContext | undefined = undefined;
    
    // FIRST THING - Log the complete raw request URL
    console.log("\n\n🔴🔴🔴 COMPLETE RAW REQUEST URL:", req.url);
    
    // Process request body to extract content and personalizationContext
    let content: string = "";
    try {
      const rawBody = await req.text();
      console.log("🔴 RAW REQUEST BODY RECEIVED:", rawBody.substring(0, 200) + "...");
      
      try {
        const parsedBody = JSON.parse(rawBody);
        console.log("🔴 PARSED REQUEST BODY:", JSON.stringify(parsedBody, null, 2).substring(0, 300) + "...");
        
        // Extract content
        content = parsedBody.content;
        console.log("🔴 EXTRACTED CONTENT:", content.substring(0, 100) + "...");
        
        // Extract personalizationContext from request body
        if (parsedBody.personalizationContext) {
          console.log("🔴 FOUND PERSONALIZATION IN REQUEST BODY!");
          
          // Save this to use later
          personalizationContext = parsedBody.personalizationContext;
          
          // Log the personalization context
          if (personalizationContext) {
            console.log("🔴 PERSONALIZATION CONTEXT KEYS:", Object.keys(personalizationContext).join(", "));
            console.log("🔴 PERSONALIZATION CONTEXT PREVIEW:", 
              JSON.stringify(personalizationContext).substring(0, 200) + "...");
            
            // Log detailed personalization info
            console.log("Processing personalized reflection with context:", {
              knowledgeLevel: personalizationContext.knowledgeLevel,
              spiritualJourney: personalizationContext.spiritualJourneyStage,
              topicsCount: personalizationContext.topicsOfInterest?.length || 0,
              goalsCount: personalizationContext.primaryGoals?.length || 0,
            });
            
            // Display a more detailed summary in the terminal
            logPersonalizationSummary(personalizationContext);
          }
        } else {
          console.log("🔴 NO PERSONALIZATION FOUND IN REQUEST BODY");
        }
      } catch (e: any) {
        console.error("🔴 FAILED TO PARSE REQUEST BODY:", e.message);
        return NextResponse.json(
          { error: "Invalid request body" },
          { status: 400 }
        );
      }
    } catch (e: any) {
      console.error("🔴 ERROR READING REQUEST BODY:", e.message);
      return NextResponse.json(
        { error: "Failed to read request body" },
        { status: 400 }
      );
    }
    
    // Validate the request
    if (!content) {
      return NextResponse.json(
        { error: "Missing reflection content" },
        { status: 400 }
      );
    }
    
    // Deep check the personalization context if present
    if (personalizationContext) {
      console.log(`${COLORS.BG_RED}${COLORS.BRIGHT}${COLORS.YELLOW}PERSONALIZATION CONTEXT TYPE:${COLORS.RESET}`, typeof personalizationContext);
      console.log(`${COLORS.BG_RED}${COLORS.BRIGHT}${COLORS.YELLOW}PERSONALIZATION CONTEXT CLASS:${COLORS.RESET}`, Object.prototype.toString.call(personalizationContext));
      console.log(`${COLORS.BG_RED}${COLORS.BRIGHT}${COLORS.YELLOW}PERSONALIZATION CONTEXT KEYS:${COLORS.RESET}`, Object.keys(personalizationContext));
      console.log(`${COLORS.BG_RED}${COLORS.BRIGHT}${COLORS.YELLOW}FULL PERSONALIZATION CONTEXT:${COLORS.RESET}`, JSON.stringify(personalizationContext, null, 2));
    } else {
      console.log(`${COLORS.BG_RED}${COLORS.BRIGHT}${COLORS.YELLOW}NO PERSONALIZATION IN REQUEST${COLORS.RESET}`);
    }
    
    // Log before generating follow-up questions
    console.log(`${COLORS.BG_RED}${COLORS.BRIGHT}${COLORS.YELLOW}CALLING generateFollowUpQuestions WITH CONTEXT:${COLORS.RESET}`, 
      personalizationContext ? JSON.stringify(personalizationContext, null, 2) : 'none');
    
    // Add direct debug log
    console.log(`${COLORS.BG_RED}${COLORS.BRIGHT}${COLORS.CYAN}🔎 CRITICAL DEBUG - personalizationContext variable:${COLORS.RESET}`, {
      name: 'personalizationContext',
      type: typeof personalizationContext,
      isNull: personalizationContext === null,
      isUndefined: personalizationContext === undefined,
      valueIfExists: personalizationContext ? JSON.stringify(personalizationContext).substring(0, 100) + '...' : 'N/A',
      keys: personalizationContext ? Object.keys(personalizationContext) : 'N/A'
    });
    
    // Log exactly how we're calling the function
    console.log(`${COLORS.BG_RED}${COLORS.BRIGHT}${COLORS.CYAN}🔎 FUNCTION CALL - generateFollowUpQuestions arguments:${COLORS.RESET}`, {
      content: content.substring(0, 20) + '...',
      previousMessages: undefined,
      personalizationContext: personalizationContext ? 'present' : 'not present'
    });
    
    // CRITICAL: Log the exact variable we're passing
    console.log("🔴🔴🔴 FINAL PERSONALIZATION CONTEXT VALUE:", personalizationContext);
    console.log("TYPEOF:", typeof personalizationContext);
    console.log("IS UNDEFINED:", personalizationContext === undefined);
    console.log("IS NULL:", personalizationContext === null);
    console.log("OBJECT KEYS (if object):", personalizationContext && typeof personalizationContext === 'object' ? Object.keys(personalizationContext).join(', ') : 'N/A');
    
    // Create a clean personalization context to pass to the function
    let cleanContext = undefined;
    if (personalizationContext) {
      try {
        cleanContext = {
          knowledgeLevel: personalizationContext.knowledgeLevel,
          topicsOfInterest: personalizationContext.topicsOfInterest,
          primaryGoals: personalizationContext.primaryGoals,
          spiritualJourneyStage: personalizationContext.spiritualJourneyStage,
          lifeStage: personalizationContext.lifeStage,
          communityConnection: personalizationContext.communityConnection,
          culturalBackground: personalizationContext.culturalBackground,
          reflectionStyle: personalizationContext.reflectionStyle,
          guidancePreferences: personalizationContext.guidancePreferences
        };
        console.log("CREATED CLEAN CONTEXT:", cleanContext);
        console.log("CLEAN CONTEXT KEYS:", Object.keys(cleanContext).join(', '));
      } catch (e) {
        console.error("ERROR CREATING CLEAN CONTEXT:", e);
        cleanContext = undefined;
      }
    }
    
    // Generate follow-up questions with personalization if available
    const { understanding, questions } = await generateFollowUpQuestions(
      content,
      undefined,
      cleanContext // Use the clean context
    );
    
    // Log after generating follow-up questions
    console.log(`${COLORS.BG_RED}${COLORS.BRIGHT}${COLORS.YELLOW}generateFollowUpQuestions RETURNED:${COLORS.RESET}`, {
      hasUnderstanding: !!understanding,
      questionsCount: questions?.length || 0
    });
    
    // Generate action items with personalization if available
    const actionItems = await generateActionItems(
      content,
      cleanContext // Use the clean context
    );
    
    // Generate insights with personalization if available
    const insights = await generateInsights(
      content,
      cleanContext // Use the clean context
    );
    
    // Structure the response
    // Include understanding and questions both at the top level AND in the reflection object
    // This ensures backward compatibility and fixes the current issue
    const response = {
      // Add top-level properties for the client
      understanding,
      questions,
      actionItems,
      insights,
      // Also keep the reflection object for backward compatibility
      reflection: {
        original: content,
        understanding,
        questions,
        actionItems,
        insights,
        timestamp: new Date().toISOString(),
      }
    };
    
    // Log what we're sending back to client
    console.log("Sending response with understanding and questions:", {
      understandingLength: understanding?.length || 0,
      questionsCount: questions?.length || 0,
      topLevel: {
        hasUnderstanding: !!understanding,
        questionsCount: questions?.length || 0
      },
      nested: {
        hasUnderstanding: !!response.reflection.understanding,
        questionsCount: response.reflection.questions?.length || 0
      }
    });
    
    // Get debug headers
    const debugHeaders = getDebugHeaders();
    
    // Return the response with debug headers
    return NextResponse.json(response, {
      headers: debugHeaders
    });
  } catch (error) {
    console.error("Error processing reflection:", error);
    return NextResponse.json(
      { error: "Failed to process reflection" },
      { status: 500 }
    );
  }
} 