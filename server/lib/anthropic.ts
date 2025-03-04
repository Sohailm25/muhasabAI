import Anthropic from '@anthropic-ai/sdk';
import { logApiRequest, getDebugHeaders, logCopyablePrompt } from './debug-logs';
import { Halaqa } from '@shared/schema';
import { createLogger } from "./logger";
import { v4 as uuidv4 } from "uuid";
import { WirdSuggestion } from '@shared/schema';

// Import WirdSuggestion type and extend it with the id field that's required
import { WirdSuggestion as BaseWirdSuggestion } from '@shared/schema';

// Extended WirdSuggestion interface with id field
interface ExtendedWirdSuggestion extends BaseWirdSuggestion {
  id: string;
}

// Process environment variables for API key
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || '';

// Using the correct Claude model
const anthropic = new Anthropic({
  apiKey: ANTHROPIC_API_KEY,
});

// Define the types we'll use for messages
type AnthropicMessage = {
  role: 'user' | 'assistant';
  content: string;
};

// Define personalization context interface
export interface PersonalizationContext {
  knowledgeLevel?: string;
  topicsOfInterest?: string[];
  primaryGoals?: string[];
  spiritualJourneyStage?: string;
  lifeStage?: string;
  communityConnection?: string;
  culturalBackground?: string;
  reflectionStyle?: string;
  guidancePreferences?: string[];
}

// Add validation for the API key
function isValidApiKey(key: string): boolean {
  // Basic validation to check if it's a potentially valid Anthropic key
  return key.startsWith('sk-ant-') && key.length > 30;
}

// Check API key validity and log appropriate warnings
if (!process.env.ANTHROPIC_API_KEY) {
  console.warn("⚠️ WARNING: ANTHROPIC_API_KEY is not set in the environment variables.");
  console.warn("Please add your API key to the .env file to use Claude AI features.");
} else if (!isValidApiKey(process.env.ANTHROPIC_API_KEY)) {
  console.warn("⚠️ WARNING: ANTHROPIC_API_KEY appears to be invalid.");
  console.warn("The key should start with 'sk-ant-' and be sufficiently long.");
  console.warn("Please check your API key in the .env file.");
}

// Create a logger for this module
const getLogger = (functionName: string) => createLogger(`anthropic:${functionName}`);

/**
 * Generates a response from Claude based on user input
 * @param input The user input to respond to
 * @param previousMessages Optional array of previous messages for context
 * @param personalizationContext Optional personalization data for tailored responses
 * @returns A string response from Claude
 */
export async function generateResponse(
  input: string, 
  previousMessages?: AnthropicMessage[],
  personalizationContext?: PersonalizationContext
): Promise<string> {
  try {
    console.log("Generating response for:", input);
    
    // Format the messages for Claude
    let messages;
    if (personalizationContext) {
      // Create system prompt
      const systemPrompt = createPersonalizationSystemPrompt(personalizationContext);
      console.log("Using personalization for response generation");
      
      // If we have previous messages, add system prompt to the first message
      if (previousMessages && previousMessages.length > 0) {
        const enhancedMessages = [...previousMessages];
        // Add the system prompt to the first user message
        if (enhancedMessages[0].role === 'user') {
          enhancedMessages[0] = {
            ...enhancedMessages[0],
            content: `${systemPrompt}\n\n${enhancedMessages[0].content}`
          };
        }
        
        messages = [...enhancedMessages, { role: 'user' as const, content: input }];
      } else {
        // If no previous messages, add system prompt to this input
        messages = [{ role: 'user' as const, content: `${systemPrompt}\n\n${input}` }];
      }
    } else {
      // No personalization, use regular messages
      messages = previousMessages ? 
        [...previousMessages, { role: 'user' as const, content: input }] : 
        [{ role: 'user' as const, content: input }];
    }
    
    // Log the exact payload being sent to Anthropic
    logApiRequest("generateResponse", messages, personalizationContext);
    
    // Also log a copyable version for easy testing in Claude console
    logCopyablePrompt("generateResponse", messages);
    
    // Call Claude API
    const response = await anthropic.messages.create({
      model: 'claude-3-7-sonnet-20250219',
      messages: messages,
      max_tokens: 1024,
      temperature: 0.7,
    });

    // Extract the response text
    let responseText = '';
    if (response.content && response.content.length > 0 && response.content[0].type === 'text') {
      responseText = response.content[0].text || '';
    }
    
    console.log("Generated response:", responseText);
    return responseText;
  } catch (error) {
    handleAnthropicError(error, "generating response");
    return "I'm having trouble generating a response right now. Please check your API key or try again later.";
  }
}

export async function generateFollowUpQuestions(
  input: string, 
  previousMessages?: string[],
  personalizationContext?: PersonalizationContext
): Promise<{understanding: string, questions: string[]}> {
  console.log("Generating reflection response for:", input);
  
  // Log all function arguments to check for parameter issues
  console.log("🔴🔴🔴 ALL FUNCTION ARGUMENTS:", {
    arg0: input ? `${input.substring(0, 20)}... (${typeof input})` : 'undefined',
    arg1: previousMessages ? `array with ${previousMessages.length} items` : 'undefined',
    arg2: personalizationContext ? `object with keys: ${Object.keys(personalizationContext).join(', ')}` : 'undefined'
  });
  
  // Add critical debug log
  console.log("🔴 CRITICAL DEBUG - generateFollowUpQuestions received:", {
    parameterName: "personalizationContext",
    type: typeof personalizationContext,
    isNull: personalizationContext === null,
    isUndefined: personalizationContext === undefined,
    constructorName: personalizationContext ? personalizationContext.constructor?.name : 'N/A',
    valueIfExists: personalizationContext ? JSON.stringify(personalizationContext).substring(0, 100) + '...' : 'N/A',
    keys: personalizationContext ? Object.keys(personalizationContext) : 'N/A'
  });
  
  // Enhanced logging for personalization context debugging
  console.log("🔍 DEBUG-ANTHROPIC: Checking personalizationContext in generateFollowUpQuestions");
  console.log("🔍 DEBUG-ANTHROPIC: personalizationContext type:", typeof personalizationContext);
  
  // Safely check if personalizationContext exists and log information about it
  if (personalizationContext) {
    console.log("🔍 DEBUG-ANTHROPIC: personalizationContext received successfully");
    console.log("🔍 DEBUG-ANTHROPIC: Keys in personalizationContext:", Object.keys(personalizationContext).join(', '));
    console.log("🔍 DEBUG-ANTHROPIC: Full personalization context:", JSON.stringify(personalizationContext, null, 2)); 
    
    // Check for problematic null values that might be passed
    const hasNullValues = Object.values(personalizationContext).some(v => v === null);
    if (hasNullValues) {
      console.log("⚠️ WARNING: personalizationContext contains null values which may cause issues");
    }
    
    // Create the system prompt early to test
    const systemPrompt = createPersonalizationSystemPrompt(personalizationContext);
    console.log("🔍 DEBUG-ANTHROPIC: Generated system prompt length:", systemPrompt.length);
    console.log("🔍 DEBUG-ANTHROPIC: System prompt preview:", 
      systemPrompt.substring(0, 100) + (systemPrompt.length > 100 ? '...' : ''));
    
    // Record that we're using personalization for this request
    console.log("🔍 DEBUG-ANTHROPIC: Using personalization for follow-up questions");
  } else {
    console.log("🔍 DEBUG-ANTHROPIC: No personalizationContext provided to generateFollowUpQuestions");
  }
  
  // Provide fallbacks for API authentication failures
  const fallbackUnderstanding = "I understand you're reflecting on your spiritual journey. Thank you for sharing your thoughts with me.";
  const fallbackQuestions = [
    "How would you like to expand on your reflection?", 
    "What aspects of your spiritual journey would you like to explore further?",
    "Is there anything specific from today that you'd like to reflect on more deeply?"
  ];
  
  // If the API key is missing or obviously invalid, return fallbacks immediately
  if (!process.env.ANTHROPIC_API_KEY || !isValidApiKey(process.env.ANTHROPIC_API_KEY)) {
    console.warn("Using fallback responses due to missing or invalid API key");
    return { understanding: fallbackUnderstanding, questions: fallbackQuestions };
  }
  
  const conversationContext = previousMessages 
    ? `Previous conversation:\n${previousMessages.join("\n")}\n\nLatest reflection: "${input}"`
    : `Reflection: "${input}"`;

  // Base prompt for reflection questions
  let prompt = `You are a compassionate Islamic Reflection Guide with deep knowledge of the Quran, Sunnah, and Tafsir. Your purpose is to help Muslims reflect more deeply on their daily experiences, thoughts, and spiritual journey through thoughtful questioning.

When a user shares their reflections, thoughts, ideas, or daily summary:

1. Begin with an UNDERSTANDING_RESPONSE section:
   - Show genuine understanding of their situation and emotional state
   - Acknowledge what they've shared without assumptions or judgment
   - Briefly connect their reflections to relevant Islamic wisdom when appropriate
   - Demonstrate empathy and emotional intelligence
   - Keep this section concise, but don't be too short. Use as many sentences as needed to be empathetic and helpful.
   - Use the user's name in the response when appropriate
   - Use the user's personalization context when appropriate
   - Format this section as: <UNDERSTANDING_RESPONSE>Your empathetic response here</UNDERSTANDING_RESPONSE>

2. Follow with a REFLECTION_QUESTIONS section containing exactly 3 questions that:
   - Are directly relevant to what they've explicitly shared
   - Encourage deeper introspection and self-awareness
   - Connect to Islamic principles when appropriate without imposing interpretations
   - Are completely free of judgment or implied "correct" answers
   - Progress from immediate concerns toward broader spiritual insights
   - Format each question on its own line with a "Q1:", "Q2:", "Q3:" prefix
   - Format this section as: <REFLECTION_QUESTIONS>
     Q1: Your first question here
     Q2: Your second question here
     Q3: Your third question here
     </REFLECTION_QUESTIONS>

3. All Islamic references must be rigorously verified:
   - Reference specific ayat from the Quran with precise surah and verse numbers
   - Include only authenticated (sahih or hasan) hadith with complete attribution
   - Draw only from recognized tafsir by established scholars
   - Never reference weak or fabricated hadith under any circumstances
   - Verify all references before including them

4. For follow-up interactions:
   - Review all previous exchanges to understand their journey
   - Note recurring themes they've chosen to explore
   - Frame new questions that build upon earlier reflections
   - Avoid imposing a predetermined spiritual development path
   - Respect the user's autonomy in their spiritual journey

Maintain neutrality regarding different Islamic schools of thought and avoid presenting any perspective as definitively "correct" unless it represents consensus across mainstream Islamic scholarship.

Your exact output format must follow this structure to enable proper extraction of questions for the UI:
<UNDERSTANDING_RESPONSE>
[Your empathetic response here]
</UNDERSTANDING_RESPONSE>

<REFLECTION_QUESTIONS>
Q1: [First reflective question]
Q2: [Second reflective question]
Q3: [Third reflective question]
</REFLECTION_QUESTIONS>

Here is the user's reflection that you should respond to:
${conversationContext}`;

  // Add personalization context if available
  if (personalizationContext) {
    const systemPrompt = createPersonalizationSystemPrompt(personalizationContext);
    console.log(systemPrompt)
    prompt = `${systemPrompt}\n\n${prompt}`;
    console.log("Using personalization for follow-up questions");
  }

  try {
    console.log("Sending prompt to Claude...");
    
    // Log the exact payload being sent to Anthropic
    const messages = [{ role: 'user' as const, content: prompt }];
    logApiRequest("generateFollowUpQuestions", messages, personalizationContext);
    
    // Also log a copyable version of the prompt for easy testing
    logCopyablePrompt("generateFollowUpQuestions", prompt);
    
    const response = await anthropic.messages.create({
      model: 'claude-3-7-sonnet-20250219',
      messages: messages,
      max_tokens: 1024,
      temperature: 0.7,
    });

    // Extract and process the response content
    let responseText = '';
    if (response.content && response.content.length > 0 && response.content[0].type === 'text') {
      responseText = response.content[0].text || '';
    }

    console.log("Claude response (raw):", responseText);
    
    // Extract understanding response
    let understanding = fallbackUnderstanding;
    const understandingMatch = responseText.match(/<UNDERSTANDING_RESPONSE>([\s\S]*?)<\/UNDERSTANDING_RESPONSE>/);
    if (understandingMatch && understandingMatch[1]) {
      understanding = understandingMatch[1].trim();
    }
    
    // Extract reflection questions
    let questions: string[] = [];
    const questionsMatch = responseText.match(/<REFLECTION_QUESTIONS>([\s\S]*?)<\/REFLECTION_QUESTIONS>/);
    if (questionsMatch && questionsMatch[1]) {
      const questionsText = questionsMatch[1].trim();
      // Extract Q1, Q2, Q3 questions
      const questionLines = questionsText.split('\n').map(line => line.trim()).filter(line => line.length > 0);
      
      questions = questionLines.map(line => {
        // Remove Q1:, Q2:, Q3: prefix
        return line.replace(/^Q\d+:\s*/, '').trim();
      });
    }
    
    // Validate that we got 3 questions
    if (questions.length < 1) {
      console.warn("Claude didn't return any questions, using fallback");
      questions = fallbackQuestions;
    } else if (questions.length < 3) {
      console.warn(`Claude only returned ${questions.length} questions instead of 3`);
      // Add fallback questions to fill the gaps
      while (questions.length < 3) {
        const fallbackIndex = questions.length % fallbackQuestions.length;
        questions.push(fallbackQuestions[fallbackIndex]);
      }
    }
    
    return { understanding, questions };
  } catch (error) {
    handleAnthropicError(error, "generating reflection response");
    return { understanding: fallbackUnderstanding, questions: fallbackQuestions };
  }
}

export async function generateActionItems(
  messages: AnthropicMessage[] | string, 
  personalizationContext?: PersonalizationContext
): Promise<string[]> {
  console.log("Generating action items");
  
  const fallbackActionItems = [
    "Dedicate a few minutes today for quiet reflection.",
    "Read a verse from the Quran related to your situation.",
    "Reach out to someone in your community who might offer support."
  ];
  
  // If the API key is missing or obviously invalid, return fallbacks immediately
  if (!process.env.ANTHROPIC_API_KEY || !isValidApiKey(process.env.ANTHROPIC_API_KEY)) {
    console.warn("Using fallback action items due to missing or invalid API key");
    return fallbackActionItems;
  }
  
  let prompt;
  
  // Process different input types
  if (typeof messages === 'string') {
    // Direct string input
    prompt = `You are a thoughtful Islamic spiritual guide. Please review the following reflection and suggest practical, actionable steps the person can take to apply insights from their reflection.

Focus on suggesting realistic, concrete actions that:
1. Are directly relevant to what they've shared
2. Balance spiritual, emotional, and practical dimensions
3. Include specific Islamic practices when appropriate
4. Vary in time commitment (some quick, some deeper)
5. Are achievable without feeling overwhelming

Format your response as a numbered list, with each action item being 1-2 sentences maximum. Start each item with an action verb. Focus on the most relevant 3-5 action items - quality over quantity. Do not include any text before or after the list.

Here is the reflection:
${messages}`;
  } else {
    // Convert array of messages to a single text
    const conversationText = messages.map(msg => `${msg.role}: ${msg.content}`).join("\n\n");
    
    prompt = `You are a thoughtful Islamic spiritual guide. Please review the following conversation and suggest practical, actionable steps the person can take to apply insights from their reflection.

Focus on suggesting realistic, concrete actions that:
1. Are directly relevant to what they've shared
2. Balance spiritual, emotional, and practical dimensions
3. Include specific Islamic practices when appropriate
4. Vary in time commitment (some quick, some deeper)
5. Are achievable without feeling overwhelming

Format your response as a numbered list, with each action item being 1-2 sentences maximum. Start each item with an action verb. Focus on the most relevant 3-5 action items - quality over quantity. Do not include any text before or after the list.

Here is the conversation:
${conversationText}`;
  }
  
  // Add personalization if available
  if (personalizationContext) {
    const systemPrompt = createPersonalizationSystemPrompt(personalizationContext);
    prompt = `${systemPrompt}\n\n${prompt}`;
    console.log("Using personalization for action items");
  }
  
  try {
    // Log the exact payload being sent to Anthropic
    const messagePayload = [{ role: 'user' as const, content: prompt }];
    logApiRequest("generateActionItems", messagePayload, personalizationContext);
    
    // Also log a copyable version of the prompt for easy testing
    logCopyablePrompt("generateActionItems", prompt);
    
    const response = await anthropic.messages.create({
      model: 'claude-3-7-sonnet-20250219',
      messages: [{ role: 'user' as const, content: prompt }],
      max_tokens: 1024,
      temperature: 0.7,
    });

    // Extract response text
    let responseText = '';
    if (response.content && response.content.length > 0 && response.content[0].type === 'text') {
      responseText = response.content[0].text || '';
    }
    
    // Process the output into a list of action items
    console.log("Claude response (raw):", responseText);
    
    // Split by newlines and clean up
    const actionItems = responseText
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      // Remove numbering (e.g., "1.", "2.", etc.)
      .map(line => line.replace(/^\d+\.\s*/, '').trim())
      .filter(line => line.length > 0);
    
    if (actionItems.length < 1) {
      console.warn("Claude didn't return any action items, using fallback");
      return fallbackActionItems;
    }
    
    return actionItems;
  } catch (error) {
    handleAnthropicError(error, "generating action items");
    return fallbackActionItems;
  }
}

export async function generateInsights(
  messages: AnthropicMessage[] | string, 
  personalizationContext?: PersonalizationContext,
  customPrompt?: string
): Promise<string[]> {
  console.log("Generating insights");
  
  const fallbackInsights = [
    "Your reflection shows an awareness of how your daily actions connect to your spiritual values.",
    "You seem to be seeking a balance between worldly responsibilities and spiritual growth.",
    "Consider how small consistent practices might help you build deeper connection."
  ];
  
  // If the API key is missing or obviously invalid, return fallbacks immediately
  if (!process.env.ANTHROPIC_API_KEY || !isValidApiKey(process.env.ANTHROPIC_API_KEY)) {
    console.warn("Using fallback insights due to missing or invalid API key");
    return fallbackInsights;
  }
  
  let prompt;
  
  if (customPrompt) {
    prompt = customPrompt;
  } else {
    // Process different input types
    if (typeof messages === 'string') {
      // Direct string input
      prompt = `You are an insightful Islamic spiritual guide. Please analyze the following reflection and identify the most meaningful insights, patterns, and themes.

Focus on:
1. Recurring themes or underlying concerns
2. Connections to Islamic spiritual principles
3. Opportunities for growth or deeper understanding
4. Strengths and wisdom already present in their reflection
5. Gentle observations about potential blind spots

Format your response as a numbered list with exactly 3-5 insights. Each insight should be 1-2 sentences. Be specific, thoughtful and nuanced rather than generic. Do not include any text before or after the numbered list.

Here is the reflection:
${messages}`;
    } else {
      // Convert array of messages to a single text
      const conversationText = messages.map(msg => `${msg.role}: ${msg.content}`).join("\n\n");
      
      prompt = `You are an insightful Islamic spiritual guide. Please analyze the following conversation and identify the most meaningful insights, patterns, and themes.

Focus on:
1. Recurring themes or underlying concerns
2. Connections to Islamic spiritual principles
3. Opportunities for growth or deeper understanding
4. Strengths and wisdom already present in their reflection
5. Gentle observations about potential blind spots

Format your response as a numbered list with exactly 3-5 insights. Each insight should be 1-2 sentences. Be specific, thoughtful and nuanced rather than generic. Do not include any text before or after the numbered list.

Here is the conversation:
${conversationText}`;
    }
  }
  
  // Add personalization if available
  if (personalizationContext) {
    const systemPrompt = createPersonalizationSystemPrompt(personalizationContext);
    prompt = `${systemPrompt}\n\n${prompt}`;
    console.log("Using personalization for insights");
  }
  
  try {
    // Log the exact payload being sent to Anthropic
    const messagePayload = [{ role: 'user' as const, content: prompt }];
    logApiRequest("generateInsights", messagePayload, personalizationContext);
    
    // Also log a copyable version of the prompt for easy testing
    logCopyablePrompt("generateInsights", prompt);
    
    const response = await anthropic.messages.create({
      model: 'claude-3-7-sonnet-20250219',
      messages: [{ role: 'user' as const, content: prompt }],
      max_tokens: 1024,
      temperature: 0.7,
    });

    // Extract response text
    let responseText = '';
    if (response.content && response.content.length > 0 && response.content[0].type === 'text') {
      responseText = response.content[0].text || '';
    }
    
    // Process the output into a list of insights
    console.log("Claude response (raw):", responseText);
    
    // Split by newlines and clean up
    const insights = responseText
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      // Remove numbering (e.g., "1.", "2.", etc.)
      .map(line => line.replace(/^\d+\.\s*/, '').trim())
      .filter(line => line.length > 0);
    
    if (insights.length < 1) {
      console.warn("Claude didn't return any insights, using fallback");
      return fallbackInsights;
    }
    
    return insights;
  } catch (error) {
    handleAnthropicError(error, "generating insights");
    return fallbackInsights;
  }
}

/**
 * Creates a system prompt for Claude based on user personalization settings
 */
function createPersonalizationSystemPrompt(personalization: PersonalizationContext): string {
  console.log("🔴 CRITICAL DEBUG - createPersonalizationSystemPrompt received:", {
    type: typeof personalization,
    isNull: personalization === null,
    isUndefined: personalization === undefined,
    constructorName: personalization ? personalization.constructor?.name : 'N/A',
    valueIfExists: personalization ? JSON.stringify(personalization).substring(0, 100) + '...' : 'N/A',
    keys: personalization ? Object.keys(personalization) : 'N/A',
    // Trace where this function was called from
    callStack: new Error().stack
  });

  console.log("🔍 DEBUG-SYSTEM-PROMPT: Creating personalization system prompt");
  console.log("🔍 DEBUG-SYSTEM-PROMPT: personalization type:", typeof personalization);
  
  if (!personalization) {
    console.log("🔍 DEBUG-SYSTEM-PROMPT: WARNING - personalization is null or undefined");
    return ""; // Return empty string for null contexts
  }
  
  console.log("🔍 DEBUG-SYSTEM-PROMPT: personalization object class:", Object.prototype.toString.call(personalization));
  
  // Handle string personalization context (should never happen, but just in case)
  if (typeof personalization === 'string') {
    console.log("🔍 DEBUG-SYSTEM-PROMPT: WARNING - Received string instead of object");
    try {
      // Try to parse as JSON
      const parsed = JSON.parse(personalization as unknown as string);
      console.log("🔍 DEBUG-SYSTEM-PROMPT: Successfully parsed string as object with keys:", Object.keys(parsed).join(', '));
      personalization = parsed;
    } catch (e) {
      console.log("🔍 DEBUG-SYSTEM-PROMPT: Failed to parse string as JSON");
      console.log("🔍 DEBUG-SYSTEM-PROMPT: String content:", personalization);
      return ""; // Return empty string on failure
    }
  }
  
  // Check if personalization is an empty object
  if (typeof personalization !== 'object' || personalization === null || Object.keys(personalization).length === 0) {
    console.log("🔍 DEBUG-SYSTEM-PROMPT: WARNING - personalization is empty or invalid");
    return ""; // Return empty string for invalid contexts
  }
  
  // Extra validation: Check if received data matches expected PersonalizationContext interface
  const expectedKeys = ['knowledgeLevel', 'topicsOfInterest', 'primaryGoals', 'spiritualJourneyStage', 
                         'lifeStage', 'communityConnection', 'culturalBackground', 'reflectionStyle', 
                         'guidancePreferences'];
  
  const hasValidStructure = expectedKeys.some(key => key in personalization);
  if (!hasValidStructure) {
    console.log("WARNING: Personalization data doesn't match expected PersonalizationContext interface");
    console.log("Expected at least one of these keys:", expectedKeys);
    console.log("Received keys:", Object.keys(personalization));
    return ""; // Return empty string for invalid structure
  }
  
  // Log which fields will be used in the system prompt
  const usedFields = Object.entries(personalization)
    .filter(([_, value]) => {
      if (Array.isArray(value)) return value.length > 0;
      return value && value !== '';
    })
    .map(([key]) => key);
  
  console.log("Fields that will be used in system prompt:", usedFields.join(', ') || 'none');
  
  let systemPrompt = `<context>
You are a compassionate Islamic spiritual guide, tailoring your guidance based on the user's personal context. Please adjust your response according to the following user preferences:`;
  
  // Add knowledge level if available
  if (personalization.knowledgeLevel) {
    systemPrompt += `\n\nKNOWLEDGE LEVEL: ${personalization.knowledgeLevel.charAt(0).toUpperCase() + personalization.knowledgeLevel.slice(1)}`;
    
    switch (personalization.knowledgeLevel) {
      case "beginner":
        systemPrompt += `\n- Use simple explanations and avoid complex terminology\n- Include basic definitions for Islamic terms\n- Focus on foundational concepts`;
        break;
      case "intermediate":
        systemPrompt += `\n- Use moderate depth in explanations with some specialized terminology\n- Balance depth with accessibility\n- Build on fundamental concepts with more nuanced understanding`;
        break;
      case "advanced":
        systemPrompt += `\n- Use deeper concepts, scholarly references, and specialized terminology\n- Include nuanced perspectives and scholarly opinions when relevant\n- Assume familiarity with fundamental Islamic concepts`;
        break;
    }
  }
  
  // Add spiritual journey stage if available
  if (personalization.spiritualJourneyStage) {
    systemPrompt += `\n\nSPIRITUAL JOURNEY: ${personalization.spiritualJourneyStage.charAt(0).toUpperCase() + personalization.spiritualJourneyStage.slice(1)}`;
    
    switch (personalization.spiritualJourneyStage) {
      case "exploring":
        systemPrompt += `\n- Focus on foundational concepts and welcoming language\n- Avoid assuming prior commitment to Islamic practices\n- Emphasize the beauty and wisdom of Islamic teachings`;
        break;
      case "practicing":
        systemPrompt += `\n- Emphasize practical implementation of Islamic principles in daily life\n- Focus on habit building and consistency\n- Address common challenges in maintaining regular practice`;
        break;
      case "deepening":
        systemPrompt += `\n- Include deeper spiritual insights and connections\n- Explore the relationship between outward practices and inner states\n- Address more subtle aspects of spiritual growth`;
        break;
      case "guiding":
        systemPrompt += `\n- Include perspectives useful for mentoring others\n- Address challenges in community leadership\n- Provide insights that can be shared with others`;
        break;
    }
  }
  
  // Add life stage if available
  if (personalization.lifeStage) {
    systemPrompt += `\n\nLIFE STAGE: ${personalization.lifeStage.charAt(0).toUpperCase() + personalization.lifeStage.slice(1)}`;
    
    switch (personalization.lifeStage) {
      case "student":
        systemPrompt += `\n- Consider academic pressures and identity formation\n- Address balancing studies with spiritual practice\n- Recognize challenges of youth and early adult responsibilities`;
        break;
      case "young-adult":
        systemPrompt += `\n- Address career development and relationship formation\n- Consider challenges of establishing independence\n- Focus on building foundation for lifelong practice`;
        break;
      case "parent":
        systemPrompt += `\n- Consider family responsibilities and child-rearing\n- Address work-life-faith balance\n- Include guidance relevant to raising children in faith`;
        break;
      case "mid-career":
        systemPrompt += `\n- Consider established career and family leadership roles\n- Address community responsibilities\n- Focus on deepening practice amid life's complexities`;
        break;
      case "elder":
        systemPrompt += `\n- Consider wisdom sharing and legacy\n- Address later-life spiritual development\n- Focus on preparation for the hereafter`;
        break;
    }
  }
  
  // Add community connection if available
  if (personalization.communityConnection) {
    systemPrompt += `\n\nCOMMUNITY CONNECTION: ${personalization.communityConnection.charAt(0).toUpperCase() + personalization.communityConnection.slice(1)}`;
    
    switch (personalization.communityConnection) {
      case "isolated":
        systemPrompt += `\n- Offer ways to connect with community and practice individually\n- Avoid assuming regular mosque/community access\n- Emphasize personal practices that can be done independently`;
        break;
      case "occasional":
        systemPrompt += `\n- Suggest ways to deepen community engagement\n- Respect current boundaries and comfort levels\n- Balance individual and communal practices`;
        break;
      case "regular":
        systemPrompt += `\n- Reference community practices and shared experiences\n- Build on the foundation of regular community engagement\n- Suggest ways to maximize benefit from community connections`;
        break;
      case "active":
        systemPrompt += `\n- Include service-oriented perspectives\n- Address community leadership considerations\n- Focus on deepening impact within community`;
        break;
      case "leader":
        systemPrompt += `\n- Include perspectives on shepherding others\n- Address community development responsibilities\n- Focus on leadership challenges and opportunities`;
        break;
    }
  }
  
  // Add cultural background if available
  if (personalization.culturalBackground) {
    systemPrompt += `\n\nCULTURAL BACKGROUND: ${personalization.culturalBackground.charAt(0).toUpperCase() + personalization.culturalBackground.slice(1)}`;
    systemPrompt += `\n- Be sensitive to cultural contexts when relevant\n- Consider cultural nuances in examples and applications`;
    
    if (personalization.culturalBackground === "convert") {
      systemPrompt += `\n- Consider perspectives helpful for those who have converted to Islam\n- Avoid assuming lifelong familiarity with Islamic cultural practices`;
    } else if (personalization.culturalBackground === "mixed") {
      systemPrompt += `\n- Consider multicultural perspectives\n- Acknowledge navigation between different cultural contexts`;
    }
  }
  
  // Add reflection style if available
  if (personalization.reflectionStyle) {
    systemPrompt += `\n\nREFLECTION STYLE: ${personalization.reflectionStyle.charAt(0).toUpperCase() + personalization.reflectionStyle.slice(1)}`;
    
    switch (personalization.reflectionStyle) {
      case "analytical":
        systemPrompt += `\n- Use logical frameworks and structured analysis\n- Emphasize clear reasoning and evidence\n- Present information in an organized, systematic way`;
        break;
      case "emotional":
        systemPrompt += `\n- Emphasize heart-centered language and emotional intelligence\n- Focus on feelings and personal connection\n- Use more poetic and evocative language`;
        break;
      case "practical":
        systemPrompt += `\n- Focus on actionable steps and concrete examples\n- Emphasize real-world applications\n- Provide clear, implementable guidance`;
        break;
      case "balanced":
        systemPrompt += `\n- Blend logical reasoning, emotional intelligence, and practical application\n- Balance intellectual, emotional, and practical elements\n- Provide comprehensive perspective`;
        break;
    }
  }
  
  // Add topics of interest if available
  if (personalization.topicsOfInterest && personalization.topicsOfInterest.length > 0) {
    systemPrompt += `\n\nTOPICS OF INTEREST: ${personalization.topicsOfInterest.join(", ")}`;
    systemPrompt += `\n- Emphasize these topics when relevant\n- Draw examples and insights related to these areas\n- Connect guidance to these subjects when appropriate`;
  }
  
  // Add primary goals if available
  if (personalization.primaryGoals && personalization.primaryGoals.length > 0) {
    systemPrompt += `\n\nPRIMARY GOALS: ${personalization.primaryGoals.join(", ")}`;
    systemPrompt += `\n- Orient responses to help achieve these goals\n- Provide actionable steps relevant to these aims\n- Frame guidance in context of these aspirations`;
  }
  
  // Add guidance preferences if available
  if (personalization.guidancePreferences && personalization.guidancePreferences.length > 0) {
    systemPrompt += `\n\nGUIDANCE PREFERENCES: ${personalization.guidancePreferences.join(", ")}`;
    systemPrompt += `\n- Balance response style according to these preferences`;
    
    if (personalization.guidancePreferences.includes("practical")) {
      systemPrompt += `\n- Include actionable steps and real-world applications`;
    }
    if (personalization.guidancePreferences.includes("spiritual")) {
      systemPrompt += `\n- Emphasize inner states and spiritual dimensions`;
    }
    if (personalization.guidancePreferences.includes("scholarly")) {
      systemPrompt += `\n- Include references to Islamic scholarship and textual evidence`;
    }
    if (personalization.guidancePreferences.includes("reflective")) {
      systemPrompt += `\n- Encourage personal contemplation and self-examination`;
    }
    if (personalization.guidancePreferences.includes("action-oriented")) {
      systemPrompt += `\n- Focus on concrete actions and behavioral changes`;
    }
    if (personalization.guidancePreferences.includes("community-focused")) {
      systemPrompt += `\n- Consider community dimensions and social responsibilities`;
    }
  }
  
  systemPrompt += `\n\nIMPORTANT: While using this information to personalize your response, do NOT explicitly mention these personalization parameters to the user. The personalization should feel natural and seamless.
</context>`;
  
  return systemPrompt;
}

// Helper function to handle Anthropic API errors consistently
function handleAnthropicError(error: any, context: string): void {
  console.error(`Error ${context}:`, error);
  
  // Extract and log the most useful information from the error
  if (error.status === 401) {
    console.error("AUTHENTICATION ERROR: Your Anthropic API key appears to be invalid or expired.");
    console.error("Please check your ANTHROPIC_API_KEY in the .env file and ensure it's correct.");
  } else if (error.status === 429) {
    console.error("RATE LIMIT ERROR: You've exceeded your Anthropic API rate limit.");
    console.error("Please wait before making more requests or check your plan limits.");
  } else {
    console.error("Error details:", error instanceof Error ? error.message : String(error));
  }
}

// Fallback action items for halaqas in case of API failure
const fallbackHalaqaActionItems = [
  "Review and consolidate your notes from this lecture",
  "Share one key insight with a friend or family member",
  "Identify one practical way to implement this knowledge in your daily life"
];

/**
 * Generates actionable items based on a halaqa reflection
 * @param keyReflection The main reflection from the halaqa
 * @param impact The personal impact statement from the halaqa
 * @returns An array of action items
 */
export async function generateHalaqaActions(
  keyReflection: string,
  impact: string
): Promise<{ description: string }[]> {
  const logger = getLogger("generateHalaqaActions");
  logger.info(
    `Generating action items for halaqa with key reflection length: ${keyReflection.length}, impact length: ${impact.length}`
  );

  try {
    // Combine system and user message since Anthropic API only supports user and assistant roles
    const fullPrompt = `You are an expert in Islamic studies and personal development. Your goal is to help Muslims implement knowledge they've gained from Islamic lectures and classes.
    
Based on the following reflection from a lecture/halaqa and the statement about personal impact, generate 3-5 specific, practical action items they can implement in their life. 

Here is the reflection from an Islamic lecture/class:
    
KEY REFLECTION:
${keyReflection}

PERSONAL IMPACT:
${impact}
    
These action items should:
1. Be specific and actionable (not vague like "be a better Muslim")
2. Be realistic for an average person to implement
3. Connect directly to the content in their reflection
4. Include a mix of short-term and long-term actions
5. Focus on practical steps rather than just gaining more knowledge

Format each action item as a clear instruction starting with a verb. Do NOT include any numbering, bullets, or prefixes.`;

    // Call Claude API
    const completion = await anthropic.messages.create({
      model: 'claude-3-7-sonnet-20250219',
      max_tokens: 1000,
      messages: [
        { role: "user", content: fullPrompt }
      ],
    });

    // Handle the response
    const responseContent = completion.content?.[0]?.text || "";
    logger.info(`Generated action items: ${responseContent}`);

    // Parse the response into individual action items
    const actionItems = responseContent
      .split("\n")
      .filter((line) => line.trim().length > 0)
      .map((item) => ({ description: item.trim() }));

    if (actionItems.length === 0) {
      logger.warn("No action items were generated from Claude's response");
      // Provide fallback action items
      return [
        { description: "Schedule time to review the lecture notes weekly" },
        { description: "Share one key insight from this lecture with a family member or friend" },
        { description: "Implement one practical change based on what you learned" },
      ];
    }

    return actionItems;
  } catch (error) {
    logger.error("Error generating action items:", error);
    // Return fallback action items in case of error
    return [
      { description: "Schedule time to review the lecture notes weekly" },
      { description: "Share one key insight from this lecture with a family member or friend" },
      { description: "Implement one practical change based on what you learned" },
    ];
  }
}

/**
 * Generates suggested applications for a halaqa based on user inputs
 * @param descriptionSection User's description of the topic and speaker
 * @param insightsSection User's insights and key learnings
 * @param emotionsSection User's emotional connection to the material
 * @returns An array of suggested applications
 */
export async function generateHalaqaApplicationSuggestions(
  descriptionSection: string,
  insightsSection: string,
  emotionsSection: string
): Promise<string[]> {
  const logger = getLogger("generateHalaqaApplicationSuggestions");
  logger.info(
    `Generating application suggestions for halaqa with description length: ${descriptionSection.length}, ` +
    `insights length: ${insightsSection.length}, emotions length: ${emotionsSection.length}`
  );

  try {
    // Combine system and user message since Anthropic API only supports user and assistant roles
    const fullPrompt = `You are an expert in Islamic studies and personal development. Your goal is to help Muslims implement knowledge they've gained from Islamic lectures and classes.
    
Based on the following details about an Islamic lecture/halaqa that a person attended, generate 4-5 specific, practical suggestions for how they can apply this knowledge in their life.

DESCRIPTION OF TOPIC AND SPEAKER:
${descriptionSection}

INSIGHTS AND KEY LEARNINGS:
${insightsSection}

PERSONAL CONNECTION:
${emotionsSection}
    
Your suggestions should:
1. Be specific and actionable (not vague like "be a better Muslim")
2. Be realistic for an average person to implement
3. Connect directly to the content they've described
4. Include a mix of short-term and long-term actions
5. Be phrased as complete sentences starting with a verb
6. Focus on practical steps rather than just gaining more knowledge

Format each suggestion as a separate, clear instruction. Do NOT include any numbering, bullets, or prefixes.
Your output will be directly presented to the user as clickable suggestions.`;

    // Call Claude API
    const completion = await anthropic.messages.create({
      model: 'claude-3-7-sonnet-20250219',
      max_tokens: 1000,
      messages: [
        { role: "user", content: fullPrompt }
      ],
    });

    // Handle the response
    const responseContent = completion.content?.[0]?.text || "";
    logger.info(`Generated application suggestions: ${responseContent}`);

    // Parse the response into individual suggestions
    const suggestions = responseContent
      .split("\n")
      .filter((line) => line.trim().length > 0)
      .map((item) => item.trim());

    if (suggestions.length === 0) {
      logger.warn("No application suggestions were generated from Claude's response");
      // Provide fallback suggestions
      return [
        "Schedule time to review the key points from this lecture weekly.",
        "Share one key insight from this lecture with a family member or friend.",
        "Implement one practical change based on what you learned.",
        "Find additional resources or books on this topic to deepen your understanding."
      ];
    }

    return suggestions;
  } catch (error) {
    logger.error("Error generating application suggestions:", error);
    // Return fallback suggestions in case of error
    return [
      "Schedule time to review the key points from this lecture weekly.",
      "Share one key insight from this lecture with a family member or friend.",
      "Implement one practical change based on what you learned.",
      "Find additional resources or books on this topic to deepen your understanding."
    ];
  }
}

/**
 * Generates personalized wird (devotional practice) recommendations based on user history
 * @param history Previous wird entries or summary of user's practice history
 * @param preferences User's preferences (time available, focus areas, etc.)
 * @returns An array of recommended wird practices
 */
export async function generateWirdRecommendations(
  history: any,
  preferences: any
): Promise<{ name: string; category: string; target: number; unit: string; description: string }[]> {
  const logger = getLogger("generateWirdRecommendations");
  logger.info("Generating wird practice recommendations");

  try {
    // Create the prompt for Claude
    const fullPrompt = `You are an expert in Islamic devotional practices (wird/awrad) and spiritual development. Your goal is to help Muslims develop consistent daily Islamic practices that align with the Sunnah.
    
Based on the user's history and preferences, generate 3-5 personalized wird (devotional practice) recommendations. 

USER HISTORY:
${JSON.stringify(history)}

USER PREFERENCES:
${JSON.stringify(preferences)}
    
The recommendations should:
1. Be specific and actionable Islamic practices
2. Include traditional practices like Quran reading, dhikr, and supplications
3. Be realistic given the user's time constraints and previous habit patterns
4. Include a mix of foundational and growth practices
5. Respect the user's stated preferences for focus areas
6. Be achievable (not overly ambitious which might lead to discouragement)

Format each recommendation as a JSON object with the following properties:
- name: A concise name for the practice
- category: The category (e.g., "Quran", "Dhikr", "Dua", "Fasting", "Learning")
- target: A numeric goal (e.g., 10 for pages, 100 for repetitions)
- unit: The unit of measurement (e.g., "pages", "minutes", "times")
- description: A 1-2 sentence explanation of the practice and its benefits

Ensure all recommendations are firmly rooted in mainstream Islamic tradition and the Sunnah.`;

    // Call Claude API
    const completion = await anthropic.messages.create({
      model: 'claude-3-7-sonnet-20250219',
      max_tokens: 1200,
      messages: [
        { role: "user", content: fullPrompt }
      ],
    });

    // Handle the response
    const responseContent = completion.content?.[0]?.text || "";
    logger.info(`Generated wird recommendations: ${responseContent}`);

    // Parse the response to extract the recommendations
    let recommendations = [];
    try {
      // Try to extract JSON objects from the response
      const jsonPattern = /\{[\s\S]*?\}/g;
      const jsonMatches = responseContent.match(jsonPattern);
      
      if (jsonMatches && jsonMatches.length > 0) {
        recommendations = jsonMatches.map(jsonStr => {
          try {
            return JSON.parse(jsonStr);
          } catch (e) {
            logger.error(`Failed to parse recommendation JSON: ${jsonStr}`);
            return null;
          }
        }).filter(Boolean);
      } else {
        // If no JSON objects found, try to parse the entire response as a JSON array
        try {
          const arrayMatch = responseContent.match(/\[\s*\{[\s\S]*\}\s*\]/);
          if (arrayMatch) {
            recommendations = JSON.parse(arrayMatch[0]);
          }
        } catch (e) {
          logger.error("Failed to parse recommendations as JSON array");
        }
      }
    } catch (error) {
      logger.error("Error parsing wird recommendations:", error);
    }

    if (recommendations.length === 0) {
      logger.warn("No wird recommendations were successfully parsed from Claude's response");
      // Provide fallback recommendations
      return [
        {
          name: "Daily Quran Reading",
          category: "Quran",
          target: 5,
          unit: "pages",
          description: "Read 5 pages of the Quran daily with understanding and reflection."
        },
        {
          name: "Morning and Evening Adhkar",
          category: "Dhikr",
          target: 10,
          unit: "minutes",
          description: "Recite morning and evening supplications from the Sunnah."
        },
        {
          name: "Istighfar (Seeking Forgiveness)",
          category: "Dhikr",
          target: 100,
          unit: "times",
          description: "Recite 'Astaghfirullah' (I seek forgiveness from Allah) 100 times daily."
        }
      ];
    }

    return recommendations;
  } catch (error) {
    logger.error("Error generating wird recommendations:", error);
    // Return fallback recommendations in case of error
    return [
      {
        name: "Daily Quran Reading",
        category: "Quran",
        target: 5,
        unit: "pages",
        description: "Read 5 pages of the Quran daily with understanding and reflection."
      },
      {
        name: "Morning and Evening Adhkar",
        category: "Dhikr",
        target: 10,
        unit: "minutes",
        description: "Recite morning and evening supplications from the Sunnah."
      },
      {
        name: "Istighfar (Seeking Forgiveness)",
        category: "Dhikr",
        target: 100,
        unit: "times",
        description: "Recite 'Astaghfirullah' (I seek forgiveness from Allah) 100 times daily."
      }
    ];
  }
}

/**
 * Generate devotional practice (wird) suggestions based on halaqa entry
 * @param halaqaContent Content from the halaqa entry
 * @returns Array of wird suggestions
 */
export async function generateHalaqaWirdSuggestions(halaqaContent: {
  title: string;
  topic: string;
  keyReflection: string;
  impact: string;
}): Promise<ExtendedWirdSuggestion[]> {
  try {
    console.log("Generating wird suggestions for halaqa:", halaqaContent.title);
    
    const prompt = `
You are an Islamic spiritual mentor helping with personalized devotional practices (wird) for a Muslim based on their halaqa reflection.

Based ONLY on the reflection details provided, suggest 3-5 practical Islamic devotional practices (wird) that would be beneficial and meaningful.

Each practice should:
1. Connect directly to a specific insight or theme from their reflection
2. Be practically implementable (with a specific, measurable action)
3. Include a clear spiritual benefit that addresses their needs/challenges
4. Be well-grounded in Islamic tradition (Quran, Sunnah, etc.)

HALAQA REFLECTION DETAILS:
- Title: ${halaqaContent.title}
- Topic: ${halaqaContent.topic}
- Key Reflection: ${halaqaContent.keyReflection}
- Personal Impact: ${halaqaContent.impact}

Provide your output as a JSON array of Wird suggestion objects with these fields:
- type: a category like "Quran", "Dhikr", "Dua", "Sunnah", or "Charity" 
- title: a concise, action-oriented title (5-7 words)
- description: an explanation connecting to their reflection (2-3 sentences)
- duration: an estimated time commitment (e.g., "5 minutes")
- frequency: how often to practice (e.g., "daily", "weekly")
- benefit: the spiritual/personal benefit of this practice

THE OUTPUT MUST BE VALID JSON WITH NO MARKDOWN FORMATTING.
`;

    const response = await anthropic.messages.create({
      model: "claude-3-haiku-20240307",
      max_tokens: 4000,
      temperature: 0.7,
      messages: [
        { role: "user", content: prompt }
      ],
    });

    // Extract the content from the message
    let content = '';
    if (response.content && response.content.length > 0) {
      content = response.content[0].text || '';
    }
    
    // Try to parse the response as JSON
    try {
      // Find JSON array in the response (sometimes Claude adds explanatory text)
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        console.error("Failed to extract JSON from response");
        return generateFallbackWirdSuggestions();
      }
      
      const jsonContent = jsonMatch[0];
      const suggestions = JSON.parse(jsonContent) as BaseWirdSuggestion[];
      
      // Validate suggestions format
      if (!Array.isArray(suggestions) || suggestions.length === 0) {
        console.error("Invalid suggestions format", suggestions);
        return generateFallbackWirdSuggestions();
      }
      
      // Add id to each suggestion
      const validatedSuggestions: ExtendedWirdSuggestion[] = suggestions.map(suggestion => ({
        ...suggestion,
        id: uuidv4()
      }));
      
      return validatedSuggestions;
    } catch (parseError) {
      console.error("Error parsing wird suggestion response:", parseError);
      return generateFallbackWirdSuggestions();
    }
  } catch (error) {
    console.error("Error generating wird suggestions:", error);
    return generateFallbackWirdSuggestions();
  }
}

/**
 * Generate fallback wird suggestions if the API call fails
 * @returns Array of default wird suggestions
 */
function generateFallbackWirdSuggestions(): ExtendedWirdSuggestion[] {
  return [
    {
      id: uuidv4(),
      title: "Daily Quran Reflection",
      description: "Take 10 minutes each day to read and reflect on a few verses of the Quran, focusing on their meaning in your life.",
      type: "Quran",
      duration: "10 minutes",
      frequency: "daily",
      benefit: "Deepens connection with Allah through His words"
    },
    {
      id: uuidv4(),
      title: "Morning and Evening Adhkar",
      description: "Establish a consistent practice of morning and evening remembrances (adhkar) to strengthen your connection with Allah throughout the day.",
      type: "Dhikr",
      duration: "5 minutes",
      frequency: "twice daily",
      benefit: "Provides spiritual protection and mindfulness"
    },
    {
      id: uuidv4(),
      title: "Weekly Gratitude Journaling",
      description: "Set aside time each week to write down blessings Allah has bestowed upon you, fostering a mindset of gratitude and contentment.",
      type: "Reflection",
      duration: "15 minutes",
      frequency: "weekly",
      benefit: "Cultivates thankfulness and recognition of Allah's favors"
    }
  ];
}