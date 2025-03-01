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

export async function generateFollowUpQuestions(input: string, previousMessages?: string[]): Promise<{understanding: string, questions: string[]}> {
  console.log("Generating reflection response for:", input);
  
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

  const prompt = `You are a compassionate Islamic Reflection Guide with deep knowledge of the Quran, Sunnah, and Tafsir. Your purpose is to help Muslims reflect more deeply on their daily experiences, thoughts, and spiritual journey through thoughtful questioning.

When a user shares their reflections, thoughts, ideas, or daily summary:

1. Begin with an UNDERSTANDING_RESPONSE section:
   - Show genuine understanding of their situation and emotional state
   - Acknowledge what they've shared without assumptions or judgment
   - Briefly connect their reflections to relevant Islamic wisdom when appropriate
   - Demonstrate empathy and emotional intelligence
   - Keep this section concise (3-5 sentences maximum)
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

export async function generateInsights(messages: AnthropicMessage[] | string, customPrompt?: string): Promise<string[]> {
  console.log("Generating spiritual insights");
  
  // Fallback insights in case of API failure
  const fallbackInsights = [
    "Your journey of self-reflection demonstrates a sincere desire to grow spiritually, as emphasized in Surah Al-Ra'd (13:11): 'Indeed, Allah will not change the condition of a people until they change what is in themselves.'", 
    "Your consistent practice of contemplation aligns with the Prophet's ﷺ emphasis on self-accounting, as he said: 'The wise person is one who takes account of himself and works for what comes after death.' (Tirmidhi)", 
    "Each step of your spiritual journey reflects the concept of ihsan mentioned in the famous hadith of Jibril, where the Prophet ﷺ described it as 'worshiping Allah as if you see Him, for though you do not see Him, He surely sees you.' (Bukhari & Muslim)"
  ];
  
  // If the API key is missing or obviously invalid, return fallback items immediately
  if (!process.env.ANTHROPIC_API_KEY || !isValidApiKey(process.env.ANTHROPIC_API_KEY)) {
    console.warn("Using fallback insights due to missing or invalid API key");
    return fallbackInsights;
  }
  
  // Convert input to a conversation string if it's an array of messages
  const conversation = typeof messages === 'string' 
    ? messages 
    : messages.map(msg => `${msg.role}: ${msg.content}`).join("\n");

  // Use custom prompt if provided, otherwise use default prompt
  const prompt = customPrompt || `As an insightful Islamic Reflection Analyst with deep scholarly knowledge of the Quran, Sunnah, and authentic Tafsir, analyze this conversation and provide meaningful spiritual insights.

Conversation:
${conversation}

Your task:
1. Identify recurring themes, challenges, spiritual states, and patterns in the user's reflections
2. Generate 3-5 meaningful insights that connect their experiences to Islamic wisdom
3. Each insight should include a clear observation, a connection to Islamic sources (Quran, authentic hadith, or scholarly interpretation), and a practical spiritual consideration
4. Format your response as a JSON array of strings containing only the insights

Example format:
["Your consistent efforts toward patience reflect the wisdom in Surah Al-Asr, where Allah reminds us that success requires both faith and perseverance. Consider viewing challenges as opportunities to strengthen this virtue.", "The recurring theme of gratitude in your reflections aligns with Allah's reminder in Surah Ibrahim (14:7): 'If you are grateful, I will surely increase you.' Your practice of counting blessings can be enhanced through specific daily dhikr.", "Your journey through doubt demonstrates the natural spiritual growth process. As the Prophet Muhammad ﷺ said in an authentic hadith: 'Faith wears out in your heart as clothes wear out, so ask Allah to renew the faith in your hearts.' (Al-Hakim)"]`;

  try {
    console.log("Sending prompt to Claude for spiritual insights...");
    const response = await anthropic.messages.create({
      model: 'claude-3-7-sonnet-20250219',
      messages: [{ role: 'user' as const, content: prompt }],
      max_tokens: 2048,
      temperature: 0.7,
    });

    // Extract and process the response content
    let responseText = '';
    if (response.content && response.content.length > 0 && response.content[0].type === 'text') {
      responseText = response.content[0].text || '';
    }

    console.log(`Raw Claude response for insights: ${responseText.substring(0, 200)}...`);
    
    // Try to extract JSON array
    try {
      // Find JSON array in the response
      const jsonRegex = /\[[\s\S]*\]/;
      const jsonMatch = responseText.match(jsonRegex);
      
      if (jsonMatch) {
        const jsonPart = jsonMatch[0];
        const parsedItems = JSON.parse(jsonPart);
        
        if (Array.isArray(parsedItems) && parsedItems.length > 0) {
          return parsedItems as string[];
        }
      }
      
      console.warn("Failed to parse insights as JSON array, using fallback insights");
      return fallbackInsights;
    } catch (parseError) {
      console.error("Error parsing insights from Claude response:", parseError);
      return fallbackInsights;
    }
  } catch (error) {
    handleAnthropicError(error, "generating insights");
    return fallbackInsights;
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