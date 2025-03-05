import Anthropic from '@anthropic-ai/sdk';
import { logApiRequest, getDebugHeaders, logCopyablePrompt } from './debug-logs';
import { Halaqa } from '@shared/schema';
import { createLogger } from "./logger";
import { v4 } from "uuid";
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

CRITICAL INSTRUCTION: Your suggestions MUST be based EXCLUSIVELY on the specific content of their reflection below. DO NOT provide generic Islamic practices that aren't directly connected to their exact words and themes.

HALAQA REFLECTION DETAILS:
- Title: ${halaqaContent.title}
- Topic: ${halaqaContent.topic}
- Key Reflection: ${halaqaContent.keyReflection}
- Personal Impact: ${halaqaContent.impact}

Step 1: First, identify and list 3-5 SPECIFIC PHRASES, CONCEPTS, or THEMES that the user explicitly mentioned in their reflection.

Step 2: For each identified phrase/concept/theme, create a tailored wird suggestion that:
1. Directly quotes or references the user's exact language from their reflection
2. Provides concrete, customized guidance specifically addressing that phrase/concept
3. Includes detailed implementation steps with specifics (e.g., which verses, which times of day)
4. Grounds the practice in Islamic tradition relevant to their specific reflection topic

IMPORTANT: Your suggestions must be highly customized to their specific reflection content. Each suggestion should clearly reference elements from their actual reflection and quote their own words where possible.

Provide your output as a JSON array of Wird suggestion objects with these fields:
- type: a category like "Quran", "Dhikr", "Dua", "Sunnah", or "Charity" 
- title: a concise, action-oriented title (5-7 words) that references their specific reflection content
- description: a detailed explanation connecting to specific phrases or concepts from their reflection (3-4 sentences)
- duration: an estimated time commitment (e.g., "5 minutes")
- frequency: how often to practice (e.g., "daily", "weekly")
- benefit: the specific spiritual/personal benefit of this practice as it relates to their expressed needs

THE OUTPUT MUST BE VALID JSON WITH NO MARKDOWN FORMATTING. Do not include any other text, commentary, or explanation outside the JSON array.
IMPORTANT: Ensure all strings are properly escaped with double quotes and the JSON is valid.
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
    
    // Clean and normalize the content for parsing
    let cleanedContent = content
      // Remove markdown code blocks
      .replace(/```json\s*/g, '')
      .replace(/```\s*$/g, '')
      .replace(/```/g, '')
      // Trim whitespace
      .trim();
      
    // Try several parsing strategies
    try {
      // Strategy 1: Try to parse the entire cleaned content as JSON
      try {
        const parsedData = JSON.parse(cleanedContent);
        if (Array.isArray(parsedData) && parsedData.length > 0) {
          return parsedData.map(s => ({ ...s, id: v4() }));
        }
      } catch (e) {
        // Continue to next strategy if this fails
        console.log("Strategy 1 failed, trying next approach");
      }
      
      // Strategy 2: Try to extract JSON array using regex
      const jsonRegex = /\[[\s\S]*?\]/;
      const match = cleanedContent.match(jsonRegex);
      if (match && match[0]) {
        try {
          const parsedData = JSON.parse(match[0]);
          if (Array.isArray(parsedData) && parsedData.length > 0) {
            return parsedData.map(s => ({ ...s, id: v4() }));
          }
        } catch (e) {
          console.log("Strategy 2 failed, trying next approach");
        }
      }
      
      // Strategy 3: More aggressive JSON cleanup and try again
      // This handles cases with trailing commas or other common JSON errors
      let fixedContent = cleanedContent
        // Fix common JSON errors like trailing commas
        .replace(/,(\s*[\]}])/g, '$1')
        // Ensure property names are double-quoted
        .replace(/([{,]\s*)([a-zA-Z0-9_]+)(\s*:)/g, '$1"$2"$3')
        // Ensure string values use double quotes
        .replace(/:\s*'([^']*)'/g, ': "$1"');
      
      try {
        const parsedData = JSON.parse(fixedContent);
        if (Array.isArray(parsedData) && parsedData.length > 0) {
          return parsedData.map(s => ({ ...s, id: v4() }));
        }
      } catch (e) {
        console.log("Strategy 3 failed, falling back to default suggestions");
      }
      
      // If we got here, all parsing strategies failed
      console.error("All JSON parsing strategies failed. Returning fallback suggestions.");
      return generateFallbackWirdSuggestions();
      
    } catch (parseError) {
      console.error("Error parsing wird suggestion response:", parseError);
      // Provide fallback suggestions when parsing fails
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
      id: v4(),
      title: "Daily Quran Reflection",
      description: "Take 10 minutes each day to read and reflect on a few verses of the Quran, focusing on their meaning in your life.",
      type: "Quran",
      duration: "10 minutes",
      frequency: "daily",
      benefit: "Deepens connection with Allah through His words"
    },
    {
      id: v4(),
      title: "Morning and Evening Adhkar",
      description: "Establish a consistent practice of morning and evening remembrances (adhkar) to strengthen your connection with Allah throughout the day.",
      type: "Dhikr",
      duration: "5 minutes",
      frequency: "twice daily",
      benefit: "Provides spiritual protection and mindfulness"
    },
    {
      id: v4(),
      title: "Weekly Gratitude Journaling",
      description: "Set aside time each week to write down blessings Allah has bestowed upon you, fostering a mindset of gratitude and contentment.",
      type: "Reflection",
      duration: "15 minutes",
      frequency: "weekly",
      benefit: "Cultivates thankfulness and recognition of Allah's favors"
    }
  ];
}

/**
 * Generates detailed, personalized insights based on a halaqa reflection
 * @param halaqaContent Content from the halaqa entry
 * @returns Array of personalized insights
 */
export async function generateHalaqaInsights(halaqaContent: {
  title: string;
  topic: string;
  keyReflection: string;
  impact: string;
}): Promise<Array<{id: string; title: string; content: string;}>> {
  const logger = getLogger("generateHalaqaInsights");
  logger.info(`Generating personalized insights for halaqa: ${halaqaContent.title}`);

  try {
    const prompt = `
You are a deeply knowledgeable Islamic scholar with expertise in spiritual development and practical application of Islamic teachings. Your task is to generate personalized, specific insights based on a Muslim's halaqa (Islamic study circle) reflection.

CRITICAL INSTRUCTION: Your insights MUST be based EXCLUSIVELY on the specific content provided below. DO NOT provide generic Islamic advice that isn't directly connected to the user's exact words and themes.

HALAQA REFLECTION:
Title: ${halaqaContent.title}
Topic: ${halaqaContent.topic}
Key Reflection: ${halaqaContent.keyReflection}
Personal Impact: ${halaqaContent.impact}

Step 1: First, carefully extract and list 4-6 SPECIFIC PHRASES, CONCEPTS, or THEMES that the user explicitly mentioned in their reflection.

Step 2: For each identified phrase/concept/theme, create a personalized insight that:
1. Directly quotes the user's exact words from their reflection
2. Provides deeper theological/spiritual context for that specific phrase or concept
3. Connects that specific phrase to relevant Quranic ayat or hadith
4. Offers practical application directly addressing their expressed situation
5. Includes thoughtful questions that help them deepen their understanding of that specific concept

Structure each insight with a relevant title that references their specific reflection content and detailed, substantive content (250+ words per insight).

Your insights must feel deeply personalized - like you've truly understood their specific situation and reflection. The user should immediately recognize that you're responding to their exact words and concepts.

Format your response as a JSON array with objects containing:
- id: A unique identifier like "insight-1", "insight-2", etc.
- title: A meaningful, specific title that directly references words or phrases from their reflection
- content: The detailed insight content that directly addresses their specific reflection, with quotes from their own words

THE OUTPUT MUST BE VALID JSON WITH NO MARKDOWN FORMATTING. Do not include any other text, commentary, or explanation outside the JSON array.
`;

    // Call Claude API
    const completion = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 4000,
      temperature: 0.7,
      messages: [
        { role: "user", content: prompt }
      ],
    });

    // Extract the content from the response
    let content = '';
    if (completion.content && completion.content.length > 0) {
      content = completion.content[0].text || '';
    }
    
    // Clean and normalize the content for parsing
    let cleanedContent = content
      // Remove markdown code blocks
      .replace(/```json\s*/g, '')
      .replace(/```\s*$/g, '')
      .replace(/```/g, '')
      // Trim whitespace
      .trim();
      
    try {
      const parsedData = JSON.parse(cleanedContent);
      if (Array.isArray(parsedData) && parsedData.length > 0) {
        logger.info(`Successfully generated ${parsedData.length} insights`);
        return parsedData;
      }
    } catch (e) {
      logger.error("Error parsing insights JSON:", e);
    }
    
    // Return fallback insights if parsing fails
    return [
      {
        id: "insight-1",
        title: "Connection to Core Beliefs",
        content: `Your reflection on "${halaqaContent.topic}" shows a thoughtful engagement with Islamic principles. Consider how these ideas connect to foundational concepts in the Quran and Sunnah, and how you might deepen this understanding through regular study.`
      },
      {
        id: "insight-2",
        title: "Practical Implementation",
        content: `The impact you've described suggests opportunities for practical application. Consider ways to incorporate these learnings into your daily routine through consistent, small actions that align with the guidance you've received.`
      },
      {
        id: "insight-3", 
        title: "Knowledge and Action",
        content: `Islamic tradition emphasizes that knowledge should lead to action. Your reflection touches on important concepts that can be transformed into tangible changes in how you approach your relationship with Allah and those around you.`
      },
      {
        id: "insight-4",
        title: "Spiritual Growth",
        content: `The journey of faith involves continuous reflection and improvement. Your thoughts on this topic reflect a sincere desire to grow spiritually, which is itself a blessing from Allah.`
      }
    ];
  } catch (error) {
    logger.error("Error generating halaqa insights:", error);
    // Return fallback insights
    return [
      {
        id: "insight-1",
        title: "Connection to Islamic Principles",
        content: `Your reflection contains valuable observations about ${halaqaContent.topic}. Consider exploring related concepts in the Quran and Sunnah to deepen your understanding.`
      },
      {
        id: "insight-2",
        title: "Practical Application",
        content: `Consider how you might apply the lessons from this halaqa in your daily life through consistent practice and mindfulness.`
      }
    ];
  }
}

/**
 * Generate personalized suggestions for identity framework components
 * @param input The spiritual aspect the user wants to develop (framework title)
 * @param componentType The type of component ('identity', 'vision', 'systems', etc.)
 * @param previousComponents Optional data from previously completed components
 * @returns Object containing suggestions, examples, and feedback
 */
export async function generateFrameworkSuggestions(
  input: string,
  componentType: string,
  previousComponents?: any
): Promise<{
  suggestions: string[];
  examples: string[];
  feedback: string;
}> {
  console.log(`Generating framework suggestions for ${componentType} based on "${input}"`);
  
  // Get previous component content if available
  let previousIdentity = '';
  let previousVision = '';
  let previousSystems = '';
  
  if (previousComponents && Array.isArray(previousComponents)) {
    const identityComponent = previousComponents.find(c => c.componentType === 'identity');
    const visionComponent = previousComponents.find(c => c.componentType === 'vision');
    const systemsComponent = previousComponents.find(c => c.componentType === 'systems');
    
    if (identityComponent && identityComponent.content && identityComponent.content.statements) {
      previousIdentity = identityComponent.content.statements.filter(Boolean).join("; ");
    }
    
    if (visionComponent && visionComponent.content && visionComponent.content.statements) {
      previousVision = visionComponent.content.statements.filter(Boolean).join("; ");
    }
    
    if (systemsComponent && systemsComponent.content && systemsComponent.content.processes) {
      previousSystems = systemsComponent.content.processes.filter(Boolean).join("; ");
    }
  }
  
  // Create context string from previous components
  const previousContext = `
${previousIdentity ? `IDENTITY: ${previousIdentity}` : ''}
${previousVision ? `VISION: ${previousVision}` : ''}
${previousSystems ? `SYSTEMS: ${previousSystems}` : ''}
  `.trim();
  
  // Define specific prompts for each component type
  const componentPrompts: Record<string, string> = {
    identity: `You are helping a Muslim develop their spiritual identity. Based on their aspiration "${input}", generate 3 personalized identity statements that DIRECTLY RELATE to this specific aspiration.

The statements should complete these prompts:
1. "I am (or am becoming) a _________ person."
2. "At my core, I value __________."
3. "My strengths that support this identity include __________."

Make sure each statement:
- Is specific to their aspiration "${input}"
- Uses natural, first-person language
- Is concise but meaningful (15-25 words)
- Focuses on spiritual growth, not generic self-help
- Incorporates Islamic values when relevant

Format your response as a JSON object with this structure:
{
  "suggestions": [3 identity statements that complete the first prompt],
  "examples": [3 additional examples that could work for any of the prompts, clearly labeled with which prompt they complete],
  "feedback": "A brief sentence of guidance about crafting good identity statements"
}`,

    vision: `You are helping a Muslim develop their spiritual vision. Based on their aspiration "${input}"${previousIdentity ? ` and their identity statements: ${previousIdentity}` : ''}, generate 3 personalized vision statements that DIRECTLY RELATE to this specific aspiration.

The statements should complete these prompts:
1. "This identity matters to me because __________."
2. "When I embody this identity, the impact on others is __________."
3. "In five years, living this identity would mean __________."

Make sure each statement:
- Specifically references their aspiration "${input}"
- Connects to their identity statements when possible
- Uses natural, first-person language
- Focuses on meaningful impact and purpose
- Incorporates Islamic values when relevant

Format your response as a JSON object with this structure:
{
  "suggestions": [3 vision statements that relate to their aspiration, one for each prompt],
  "examples": [3 additional examples that could work for any of the prompts, clearly labeled with which prompt they complete],
  "feedback": "A brief sentence of guidance about creating a meaningful vision"
}`,

    systems: `You are helping a Muslim develop systems to support their spiritual growth. Based on their aspiration "${input}"${previousIdentity ? ` and their identity statements: ${previousIdentity}` : ''}${previousVision ? ` and their vision: ${previousVision}` : ''}, generate 3 personalized system processes that DIRECTLY RELATE to this specific aspiration.

The statements should complete these prompts:
1. "My daily/weekly process includes __________."
2. "The principles that guide my approach are __________."
3. "I maintain balance by __________."

Make sure each statement:
- Specifically references their aspiration "${input}"
- Is practical and actionable
- Is sustainable and realistic
- Incorporates Islamic practices when relevant
- Connects to their identity and vision when possible

Format your response as a JSON object with this structure:
{
  "suggestions": [3 system process statements relevant to their aspiration, one for each prompt],
  "examples": [3 additional examples that could work for any of the prompts, clearly labeled with which prompt they complete],
  "feedback": "A brief sentence of guidance about creating effective systems"
}`,

    goals: `You are helping a Muslim set goals for their spiritual growth. Based on their aspiration "${input}"${previousContext ? ` and their previous components:\n${previousContext}` : ''}, generate personalized goals that DIRECTLY RELATE to this specific aspiration.

Create goals that complete these prompts:
1. Short-term goal (1-3 months): "Within the next few months, I will __________."
2. Medium-term goal (3-12 months): "Within the next year, I will __________."
3. Long-term goal (1+ years): "In the long-term, I will __________."
4. Success criteria: "I'll know I've succeeded when __________."

Make sure each goal:
- Specifically references their aspiration "${input}"
- Is SMART (Specific, Measurable, Achievable, Relevant, Time-bound)
- Aligns with Islamic values
- Builds progressively (short-term goals support medium-term goals, etc.)
- Connects to their identity, vision, and systems when possible

Format your response as a JSON object with this structure:
{
  "suggestions": [4 goals, one for each timeframe including success criteria],
  "examples": [4 additional examples, one for each timeframe including success criteria],
  "feedback": "A brief sentence of guidance about setting effective spiritual goals"
}`,

    habits: `You are helping a Muslim develop habits for spiritual growth. Based on their aspiration "${input}"${previousContext ? ` and their previous components:\n${previousContext}` : ''}, generate 3 personalized habits that DIRECTLY RELATE to this specific aspiration.

Each habit should have these components:
1. Habit description: A clear statement of the habit
2. Minimum viable version: A simplified version for low-energy days
3. Expanded version: The full practice for ideal conditions
4. The immediate reward: The benefit felt right after doing the habit

Make sure each habit:
- Specifically supports their aspiration "${input}"
- Is realistic and sustainable
- Has a clear trigger and reward
- Incorporates Islamic practices when relevant
- Connects to their goals, systems, vision, and identity

Format your response as a JSON object with this structure:
{
  "suggestions": [3 habit descriptions that directly support their aspiration],
  "examples": [3 formatted examples with all components like: "Habit: Morning Quran recitation\\nMinimum version: 5 minutes\\nExpanded version: 30 minutes with reflection\\nImmediate reward: Sense of peace and connection"],
  "feedback": "A brief sentence of guidance about forming effective spiritual habits"
}`,

    triggers: `You are helping a Muslim establish triggers for spiritual habits. Based on their aspiration "${input}"${previousContext ? ` and their previous components:\n${previousContext}` : ''}, generate 3 personalized trigger sets that DIRECTLY RELATE to this specific aspiration.

Each trigger set should have these components:
1. Primary trigger: When/Where to perform the habit (e.g., "After Fajr prayer")
2. Secondary trigger: A backup trigger if the primary one isn't possible (e.g., "Before breakfast")
3. Environmental supports: Physical changes to make the habit easier (e.g., "Prayer mat placed by bedside")

Make sure each trigger set:
- Is specific and clear
- Attaches to existing routines when possible
- Is realistic for daily life
- Takes into account Islamic daily rhythms (prayer times, etc.)
- Connects to the habits they want to develop

Format your response as a JSON object with this structure:
{
  "suggestions": [3 primary trigger ideas that directly support their aspiration],
  "examples": [3 formatted examples with all components like: "Primary trigger: After Fajr prayer\\nBackup trigger: Before breakfast\\nEnvironmental support: Prayer mat placed by bedside"],
  "feedback": "A brief sentence of guidance about creating effective triggers"
}`,
  };

  // Get the appropriate prompt for this component type
  const prompt = componentPrompts[componentType] || 
    `Generate suggestions to help a Muslim develop the spiritual aspect "${input}" for the component "${componentType}". Format as JSON with suggestions, examples, and feedback fields.`;
  
  try {
    console.log(`Calling Claude API for ${componentType} suggestions`);
    
    // Call the Claude API
    const response = await anthropic.messages.create({
      model: 'claude-3-7-sonnet-20250219',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 1024,
      temperature: 0.7,
    });

    // Extract and parse the response
    let responseText = '';
    if (response.content && response.content.length > 0 && response.content[0].type === 'text') {
      responseText = response.content[0].text || '';
    }
    
    console.log(`Received response from Claude API for ${componentType}`);
    
    try {
      const parsedResponse = JSON.parse(responseText);
      
      return {
        suggestions: parsedResponse.suggestions || [],
        examples: parsedResponse.examples || [],
        feedback: parsedResponse.feedback || ""
      };
    } catch (error) {
      console.error(`Error parsing Claude response for ${componentType}:`, error);
      console.log("Raw response:", responseText);
      return getDefaultFrameworkSuggestions(componentType);
    }
  } catch (error) {
    console.error(`Error generating ${componentType} framework suggestions:`, error);
    return getDefaultFrameworkSuggestions(componentType);
  }
}

/**
 * Fallback suggestions when the API call fails
 */
function getDefaultFrameworkSuggestions(componentType: string) {
  console.log(`Using default suggestions for ${componentType}`);
  
  // Default suggestions based on component type
  const defaults: Record<string, any> = {
    identity: {
      suggestions: [
        "I am becoming a more mindful person who notices Allah's signs.",
        "At my core, I value spiritual growth and connection with Allah.",
        "My strengths include my dedication to daily practice and self-reflection."
      ],
      examples: [
        "I am a person who strives to embody patience in all situations.",
        "I value consistency in my spiritual practice above perfection.",
        "My strength of perseverance supports my Islamic identity."
      ],
      feedback: "Focus on qualities that align with Islamic values and your authentic self."
    },
    vision: {
      suggestions: [
        "This identity matters to me because it brings me closer to Allah.",
        "When I embody this identity, I inspire others to strengthen their faith.",
        "In five years, living this identity would mean greater peace and taqwa."
      ],
      examples: [
        "This matters because it helps me fulfill my purpose as a believer.",
        "My growth impacts my family by creating a more spiritually nurturing home.",
        "Living this identity means embodying the Prophet's (PBUH) example daily."
      ],
      feedback: "Connect your vision to your relationship with Allah and your community."
    },
    systems: {
      suggestions: [
        "My daily process includes Quran recitation after Fajr prayer.",
        "The principles that guide me are consistency, intention, and gratitude.",
        "I maintain balance by alternating focused worship with service to others."
      ],
      examples: [
        "My system includes weekly self-accountability sessions.",
        "I'm guided by the principle of excellence (ihsan) in all actions.",
        "Balance comes through scheduled rest and spiritual renewal."
      ],
      feedback: "Create sustainable systems that integrate seamlessly with your daily life."
    },
    goals: {
      suggestions: [
        "Complete a Quran study course within the next 3 months.",
        "Establish regular volunteer work with my local masjid within 6 months.",
        "Memorize 3 new surahs by the end of the year."
      ],
      examples: [
        "Short-term: Pray all five salah on time for 30 consecutive days.",
        "Medium-term: Lead taraweeh for one night during Ramadan.",
        "Long-term: Perform Hajj within the next five years.",
        "I'll know I've succeeded when I can maintain khushoo throughout my prayers."
      ],
      feedback: "Set specific, measurable goals that progressively build your spiritual capacity."
    },
    habits: {
      suggestions: [
        "Morning dhikr practice",
        "Quran recitation with reflection",
        "Nightly self-accountability"
      ],
      examples: [
        "Habit: Morning Quran recitation\nMinimum version: 5 minutes\nExpanded version: 30 minutes with tafsir study\nImmediate reward: Starting the day with Allah's guidance",
        "Habit: Midday reflection\nMinimum version: 2 minutes of gratitude\nExpanded version: 15 minutes of journaling\nImmediate reward: Renewed focus and intention",
        "Habit: Evening dhikr\nMinimum version: 33 repetitions of subhanAllah\nExpanded version: Complete tasbih with reflection\nImmediate reward: Calm mind before sleep"
      ],
      feedback: "Create habits with a low barrier to start and clear spiritual benefits."
    },
    triggers: {
      suggestions: [
        "After completing wudu",
        "Upon entering your designated prayer space",
        "When the adhan app notification sounds"
      ],
      examples: [
        "For Quran: Primary trigger - After Fajr prayer\nBackup trigger - During morning commute\nEnvironmental support - Quran and tafsir books visible on bedside table",
        "For dhikr: Primary trigger - While walking between tasks\nBackup trigger - During wait times\nEnvironmental support - Tasbih beads in pocket or bag",
        "For dua: Primary trigger - Before meals\nBackup trigger - Before sleeping\nEnvironmental support - Dua list saved on phone home screen"
      ],
      feedback: "Link spiritual practices to existing daily activities and physical locations."
    }
  };
  
  return defaults[componentType] || {
    suggestions: ["Develop a consistent practice.", "Focus on small, sustainable changes.", "Connect your practice to your values."],
    examples: ["Example suggestion 1", "Example suggestion 2", "Example suggestion 3"],
    feedback: "Start small and build gradually for lasting spiritual growth."
  };
}