import Anthropic from '@anthropic-ai/sdk';

// the newest Anthropic model is "claude-3-7-sonnet-20250219" which was released February 24, 2025
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || 'default-key',
});

export async function generateFollowUpQuestions(input: string): Promise<string[]> {
  const prompt = `As an Islamic spiritual guide during Ramadan, carefully analyze this personal reflection and generate 3 thoughtful, contextual follow-up questions. Focus on the specific content shared and help the person achieve deeper spiritual growth:

Reflection: "${input}"

Your task:
1. Consider the unique spiritual context and personal journey expressed in their reflection
2. Generate exactly 3 questions that directly relate to their specific situation
3. Aim for questions that encourage deeper reflection and practical spiritual growth
4. Format your response as a JSON array of strings containing only the questions

Example format:
["How does this experience relate to your understanding of sabr?", "What specific changes in your daily routine could help strengthen this aspect of your faith?", "How might this insight help you better connect with Allah during your prayers?"]`;

  const response = await anthropic.messages.create({
    model: 'claude-3-7-sonnet-20250219',
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 1024,
    temperature: 0.7,
  });

  const responseContent = response.content[0].type === 'text' 
    ? response.content[0].text 
    : '[]';

  try {
    // Clean the response - remove any markdown formatting if present
    const cleanedResponse = responseContent.replace(/```json\n?|\n?```/g, '').trim();
    return JSON.parse(cleanedResponse);
  } catch (error) {
    console.error("Error parsing Claude's response:", error);
    console.log("Raw response:", responseContent);
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

  const response = await anthropic.messages.create({
    model: 'claude-3-7-sonnet-20250219',
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 1024,
    temperature: 0.7,
  });

  const responseContent = response.content[0].type === 'text' 
    ? response.content[0].text 
    : '[]';

  try {
    // Clean the response - remove any markdown formatting if present
    const cleanedResponse = responseContent.replace(/```json\n?|\n?```/g, '').trim();
    return JSON.parse(cleanedResponse);
  } catch (error) {
    console.error("Error parsing Claude's response:", error);
    console.log("Raw response:", responseContent);
    throw new Error("Failed to generate relevant action items");
  }
}