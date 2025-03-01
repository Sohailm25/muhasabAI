import Anthropic from '@anthropic-ai/sdk';

// Using the correct Claude model - claude-3-7-sonnet-20250219
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || 'default-key',
});

// Define the types we'll use for messages
type AnthropicMessage = {
  role: 'user' | 'assistant';
  content: string;
};

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

/**
 * Generates a response from Claude based on user input
 * @param input The user input to respond to
 * @param previousMessages Optional array of previous messages for context
 * @returns A string response from Claude
 */
export async function generateResponse(input: string, previousMessages?: AnthropicMessage[]): Promise<string> {
  try {
    console.log("Generating response for:", input);
    
    // Format the messages for Claude
    const messages = previousMessages ? 
      [...previousMessages, { role: 'user' as const, content: input }] : 
      [{ role: 'user' as const, content: input }];
    
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

export async function generateFollowUpQuestions(input: string, previousMessages?: string[]): Promise<string[]> {
  console.log("Generating follow-up questions for:", input);
  
  // Provide a fallback for API authentication failures
  const fallbackQuestions = [
    "How would you like to expand on your reflection?", 
    "What aspects of your spiritual journey would you like to explore further?",
    "Is there anything specific from today that you'd like to reflect on more deeply?"
  ];
  
  // If the API key is missing or obviously invalid, return fallback questions immediately
  if (!process.env.ANTHROPIC_API_KEY || !isValidApiKey(process.env.ANTHROPIC_API_KEY)) {
    console.warn("Using fallback questions due to missing or invalid API key");
    return fallbackQuestions;
  }
  
  const conversationContext = previousMessages 
    ? `Previous conversation:\n${previousMessages.join("\n")}\n\nLatest reflection: "${input}"`
    : `Reflection: "${input}"`;

  const prompt = `As an Islamic spiritual guide, carefully analyze this personal reflection and the previous conversation context (if any) to generate 3 thoughtful, contextual follow-up questions. Focus on building upon the insights shared throughout the conversation:

${conversationContext}

Your task:
1. Consider the entire conversational context and spiritual journey expressed so far
2. Generate exactly 3 questions that build upon both the latest reflection and previous exchanges
3. Each question should help deepen understanding of topics already discussed or explore closely related aspects
4. Format your response as a JSON array of strings containing only the questions

Example format:
["How does this new insight build upon your earlier reflection about patience?", "Given what you shared about your daily prayers, what specific changes are you considering?", "How might these combined experiences shape your approach to the last days of Ramadan?"]`;

  try {
    console.log("Sending prompt to Claude...");
    const response = await anthropic.messages.create({
      model: 'claude-3-7-sonnet-20250219',
      messages: [{ role: 'user' as const, content: prompt }],
      max_tokens: 1024,
      temperature: 0.7,
    });

    // Extract and process the response content
    let responseText = '';
    if (response.content && response.content.length > 0 && response.content[0].type === 'text') {
      responseText = response.content[0].text || '';
    }

    // Clean the response - remove any markdown formatting if present
    const cleanedResponse = responseText.replace(/```json\n?|\n?```/g, '').trim();
    console.log("Claude response (raw):", responseText);
    console.log("Parsed questions:", cleanedResponse);
    
    // Parse the JSON response and ensure it's an array
    let questions: string[] = [];
    try {
      questions = JSON.parse(cleanedResponse);
      // Ensure questions is an array
      if (!Array.isArray(questions)) {
        questions = fallbackQuestions;
      }
    } catch (parseError) {
      console.warn("Failed to parse JSON response:", parseError);
      questions = fallbackQuestions;
    }
    
    // Validate that we got an array with 3 questions
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
    
    return questions;
  } catch (error) {
    handleAnthropicError(error, "generating follow-up questions");
    return fallbackQuestions;
  }
}

export async function generateActionItems(messages: AnthropicMessage[] | string): Promise<string[]> {
  console.log("Generating action items");
  
  // Fallback action items in case of API failure
  const fallbackActionItems = [
    "Reflect on your spiritual journey each day", 
    "Increase your Quran recitation", 
    "Engage in more dhikr (remembrance of Allah)"
  ];
  
  // If the API key is missing or obviously invalid, return fallback items immediately
  if (!process.env.ANTHROPIC_API_KEY || !isValidApiKey(process.env.ANTHROPIC_API_KEY)) {
    console.warn("Using fallback action items due to missing or invalid API key");
    return fallbackActionItems;
  }
  
  // Convert input to a conversation string if it's an array of messages
  const conversation = typeof messages === 'string' 
    ? messages 
    : messages.map(msg => `${msg.role}: ${msg.content}`).join("\n");

  const prompt = `As an Islamic spiritual guide during Ramadan, carefully analyze this conversation and generate 3 specific, actionable steps for spiritual growth. Base your recommendations on the person's unique situation and Islamic teachings from the Quran and Sunnah.

Conversation:
${conversation}

Your task:
1. Consider the specific challenges, goals, and insights shared in the conversation
2. Generate exactly 3 detailed, practical action items tailored to their situation
3. Each action item should be specific, measurable, and grounded in Islamic teachings
4. Format your response as a JSON array of strings containing only the action items

Example format:
["Schedule 15 minutes after Fajr prayer for Quran recitation and reflection on Surah Al-Mulk", "Keep a daily gratitude journal focusing on Allah's blessings in your life", "Plan and prepare healthy suhoor meals to maintain energy for worship"]`;

  try {
    console.log("Sending prompt to Claude for action items...");
    const response = await anthropic.messages.create({
      model: 'claude-3-7-sonnet-20250219',
      messages: [{ role: 'user' as const, content: prompt }],
      max_tokens: 1024,
      temperature: 0.7,
    });

    // Extract and process the response content
    let responseText = '';
    if (response.content && response.content.length > 0 && response.content[0].type === 'text') {
      responseText = response.content[0].text || '';
    }

    // Clean the response - remove any markdown formatting if present
    const cleanedResponse = responseText.replace(/```json\n?|\n?```/g, '').trim();
    console.log("Claude action items response (raw):", responseText);
    
    // Parse the JSON response and ensure it's an array
    let actionItems: string[] = [];
    try {
      actionItems = JSON.parse(cleanedResponse);
      // Ensure actionItems is an array
      if (!Array.isArray(actionItems)) {
        actionItems = fallbackActionItems;
      }
    } catch (parseError) {
      console.warn("Failed to parse JSON response:", parseError);
      actionItems = fallbackActionItems;
    }
    
    // Validate that we got an array with 3 action items
    if (actionItems.length < 1) {
      console.warn("Claude didn't return any action items, using fallback");
      actionItems = fallbackActionItems;
    } else if (actionItems.length < 3) {
      console.warn(`Claude only returned ${actionItems.length} action items instead of 3`);
      // Add fallback items to fill the gaps
      while (actionItems.length < 3) {
        const fallbackIndex = actionItems.length % fallbackActionItems.length;
        actionItems.push(fallbackActionItems[fallbackIndex]);
      }
    }
    
    return actionItems;
  } catch (error) {
    handleAnthropicError(error, "generating action items");
    return fallbackActionItems;
  }
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