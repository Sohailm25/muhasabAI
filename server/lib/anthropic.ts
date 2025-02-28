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

export async function generateFollowUpQuestions(input: string, previousMessages?: string[]): Promise<string[]> {
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
    const response = await anthropic.messages.create({
      model: 'claude-3-7-sonnet-20250219',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 1024,
      temperature: 0.7,
    });

    const responseContent = response.content[0].type === 'text' 
      ? response.content[0].text 
      : '[]';

    // Clean the response - remove any markdown formatting if present
    const cleanedResponse = responseContent.replace(/```json\n?|\n?```/g, '').trim();
    return JSON.parse(cleanedResponse);
  } catch (error) {
    console.error("Error generating follow-up questions:", error);
    console.log("Error details:", error instanceof Error ? error.message : String(error));
    throw new Error("Failed to generate relevant follow-up questions");
  }
}

export async function generateActionItems(conversation: string): Promise<string[]> {
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
    const response = await anthropic.messages.create({
      model: 'claude-3-sonnet-20240229',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 1024,
      temperature: 0.7,
    });

    const responseContent = response.content[0].type === 'text' 
      ? response.content[0].text 
      : '[]';

    // Clean the response - remove any markdown formatting if present
    const cleanedResponse = responseContent.replace(/```json\n?|\n?```/g, '').trim();
    return JSON.parse(cleanedResponse);
  } catch (error) {
    console.error("Error generating action items:", error);
    console.log("Error details:", error instanceof Error ? error.message : String(error));
    throw new Error("Failed to generate relevant action items");
  }
}