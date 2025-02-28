import Anthropic from '@anthropic-ai/sdk';

// the newest Anthropic model is "claude-3-7-sonnet-20250219" which was released February 24, 2025
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || 'default-key',
});

export async function generateFollowUpQuestions(input: string): Promise<string[]> {
  const prompt = `As an Islamic spiritual guide during Ramadan, analyze this reflection and generate 3 thoughtful follow-up questions. Focus on helping the person achieve deeper spiritual growth and self-improvement:

${input}

Generate exactly 3 questions that are specific to their situation, encouraging deeper reflection and growth. Format as a JSON array of strings.`;

  const response = await anthropic.messages.create({
    model: 'claude-3-7-sonnet-20250219',
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 1024,
  });

  const responseContent = response.content[0].type === 'text' 
    ? response.content[0].text 
    : '[]';

  return JSON.parse(responseContent);
}

export async function generateActionItems(conversation: string): Promise<string[]> {
  const prompt = `As an Islamic spiritual guide during Ramadan, analyze this conversation and generate 3 specific, actionable steps for spiritual growth and self-improvement. Base your recommendations on Islamic teachings from the Quran and Sunnah:

${conversation}

Generate exactly 3 detailed, practical action items that are specific to their situation. Format as a JSON array of strings.`;

  const response = await anthropic.messages.create({
    model: 'claude-3-7-sonnet-20250219',
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 1024,
  });

  const responseContent = response.content[0].type === 'text' 
    ? response.content[0].text 
    : '[]';

  return JSON.parse(responseContent);
}