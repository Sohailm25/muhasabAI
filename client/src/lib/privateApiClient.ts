// Claude API integration that preserves privacy
export async function getPersonalizedResponse(
  userReflection: string,
  profileContext: any,
  conversationHistory: any[]
) {
  try {
    // Prepare data for Claude
    const requestData = {
      model: "claude-3-7-sonnet-20250219",
      max_tokens: 1000,
      messages: [
        {
          role: "user",
          content: `
            <USER_PROFILE>
              ${JSON.stringify(profileContext)}
            </USER_PROFILE>
            
            <CONVERSATION_HISTORY>
              ${JSON.stringify(conversationHistory)}
            </CONVERSATION_HISTORY>
            
            <USER_REFLECTION>
              ${userReflection}
            </USER_REFLECTION>
            
            Based on the user's profile and this reflection, respond with:
            
            <UNDERSTANDING_RESPONSE>
              A brief empathetic response that shows understanding of their situation
            </UNDERSTANDING_RESPONSE>
            
            <REFLECTION_QUESTIONS>
              Q1: First question tailored to their situation and profile
              Q2: Second question exploring a different aspect
              Q3: Third question that encourages deeper spiritual reflection
            </REFLECTION_QUESTIONS>
          `
        }
      ]
    };
    
    // Call Claude API via your backend proxy
    const response = await fetch('/api/claude/reflection', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestData)
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error getting personalized response:', error);
    
    // Fallback to default questions if AI fails
    return {
      understanding: "Thank you for sharing your reflection.",
      questions: [
        "How did this experience affect your spiritual state?",
        "What Quranic principles might relate to this situation?",
        "What actions might help you grow from this experience?"
      ]
    };
  }
} 