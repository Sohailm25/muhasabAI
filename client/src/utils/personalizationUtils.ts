import { Profile } from "@/types/profile";

/**
 * Creates a personalization context string based on user profile settings.
 * This string can be prepended to prompts to guide AI responses.
 * 
 * @param profile The user's profile containing personalization settings
 * @returns A formatted string to guide AI responses, or empty string if personalization is disabled
 */
export function createPersonalizationContext(profile?: Profile): string {
  // Early return if no profile or personalization is disabled
  if (!profile) {
    console.log("[createPersonalizationContext] No profile provided");
    return "";
  }

  if (!profile.privacySettings?.allowPersonalization) {
    console.log("[createPersonalizationContext] Personalization is disabled");
    return "";
  }

  const privateProfile = profile.privateProfile;
  
  // Early return if no private profile data is available
  if (!privateProfile) {
    console.log("[createPersonalizationContext] No private profile data");
    return "";
  }

  // Log what personalization data is available
  if (process.env.NODE_ENV === "development") {
    const availableData = {
      knowledgeLevel: !!privateProfile.knowledgeLevel,
      topics: privateProfile.topicsOfInterest?.length || 0,
      goals: privateProfile.primaryGoals?.length || 0,
      spiritualJourney: !!privateProfile.spiritualJourneyStage,
      lifeStage: !!privateProfile.lifeStage,
      communityConnection: !!privateProfile.communityConnection,
      culturalBackground: !!privateProfile.culturalBackground,
      reflectionStyle: !!privateProfile.reflectionStyle,
      guidancePreferences: privateProfile.guidancePreferences?.length || 0,
    };
    
    console.log("[createPersonalizationContext] Available personalization data:", availableData);
  }

  // Build personalization context
  let context = `
==== PERSONALIZATION CONTEXT ====
Please tailor this response based on the following user preferences:

`;

  // Add knowledge level if available
  if (privateProfile.knowledgeLevel) {
    context += `KNOWLEDGE LEVEL: ${privateProfile.knowledgeLevel.charAt(0).toUpperCase() + privateProfile.knowledgeLevel.slice(1)}
- Adjust terminology and concepts to match this level
- ${getKnowledgeLevelGuidance(privateProfile.knowledgeLevel)}

`;
  }

  // Add spiritual journey stage if available
  if (privateProfile.spiritualJourneyStage) {
    context += `SPIRITUAL JOURNEY: ${privateProfile.spiritualJourneyStage.charAt(0).toUpperCase() + privateProfile.spiritualJourneyStage.slice(1)}
- Frame guidance appropriate to this stage
- ${getSpiritualJourneyGuidance(privateProfile.spiritualJourneyStage)}

`;
  }

  // Add life stage if available
  if (privateProfile.lifeStage) {
    context += `LIFE STAGE: ${privateProfile.lifeStage.charAt(0).toUpperCase() + privateProfile.lifeStage.slice(1)}
- Consider life circumstances related to this stage
- ${getLifeStageGuidance(privateProfile.lifeStage)}

`;
  }

  // Add community connection if available
  if (privateProfile.communityConnection) {
    context += `COMMUNITY CONNECTION: ${privateProfile.communityConnection.charAt(0).toUpperCase() + privateProfile.communityConnection.slice(1)}
- ${getCommunityConnectionGuidance(privateProfile.communityConnection)}

`;
  }

  // Add cultural background if available
  if (privateProfile.culturalBackground) {
    context += `CULTURAL BACKGROUND: ${privateProfile.culturalBackground.charAt(0).toUpperCase() + privateProfile.culturalBackground.slice(1)}
- Consider cultural sensitivities and contexts when appropriate
- ${getCulturalBackgroundGuidance(privateProfile.culturalBackground)}

`;
  }

  // Add reflection style if available
  if (privateProfile.reflectionStyle) {
    context += `REFLECTION STYLE: ${privateProfile.reflectionStyle.charAt(0).toUpperCase() + privateProfile.reflectionStyle.slice(1)}
- Format responses to match this reflection style
- ${getReflectionStyleGuidance(privateProfile.reflectionStyle)}

`;
  }

  // Add topics of interest if available
  if (privateProfile.topicsOfInterest && privateProfile.topicsOfInterest.length > 0) {
    context += `TOPICS OF INTEREST: ${privateProfile.topicsOfInterest.join(", ")}
- Emphasize these topics when relevant
- Draw examples and insights related to these areas

`;
  }

  // Add primary goals if available
  if (privateProfile.primaryGoals && privateProfile.primaryGoals.length > 0) {
    context += `PRIMARY GOALS: ${privateProfile.primaryGoals.join(", ")}
- Orient responses to help achieve these goals
- Provide actionable steps relevant to these goals

`;
  }

  // Add guidance preferences if available
  if (privateProfile.guidancePreferences && privateProfile.guidancePreferences.length > 0) {
    context += `GUIDANCE PREFERENCES: ${privateProfile.guidancePreferences.join(", ")}
- Balance response style according to these preferences
- ${getGuidancePreferencesGuidance(privateProfile.guidancePreferences)}

`;
  }

  context += `============================

IMPORTANT: While using this information to personalize the response, do not explicitly mention 
these personalization parameters to the user. The personalization should feel natural and seamless.
`;

  console.log("[createPersonalizationContext] Generated context with length:", context.length);
  return context;
}

// Helper functions for specific guidance based on user preferences

function getKnowledgeLevelGuidance(level: string): string {
  switch (level) {
    case "beginner":
      return "Use simple explanations and avoid complex terminology. Include basic definitions where needed.";
    case "intermediate":
      return "Use moderate depth in explanations and some specialized terminology. Balance depth with accessibility.";
    case "advanced":
      return "Use deeper concepts, scholarly references, and specialized terminology. Include nuanced perspectives.";
    default:
      return "Balance accessibility with depth.";
  }
}

function getSpiritualJourneyGuidance(journey: string): string {
  switch (journey) {
    case "exploring":
      return "Focus on foundational concepts and welcoming language. Avoid assuming prior commitment.";
    case "practicing":
      return "Emphasize practical implementation of Islamic principles in daily life.";
    case "deepening":
      return "Include deeper spiritual insights and connections between practices and inner states.";
    case "guiding":
      return "Include perspectives useful for mentoring others and community leadership.";
    default:
      return "Balance practical guidance with spiritual depth.";
  }
}

function getLifeStageGuidance(stage: string): string {
  switch (stage) {
    case "student":
      return "Consider academic pressures, identity formation, and early adult responsibilities.";
    case "young-adult":
      return "Consider career development, relationship formation, and establishing independence.";
    case "parent":
      return "Consider family responsibilities, child-rearing, and work-life balance.";
    case "mid-career":
      return "Consider established career, family leadership, and community roles.";
    case "elder":
      return "Consider wisdom sharing, legacy, and later-life spiritual development.";
    default:
      return "Consider diverse life circumstances in guidance.";
  }
}

function getCommunityConnectionGuidance(connection: string): string {
  switch (connection) {
    case "isolated":
      return "Offer ways to connect with community and practice individually. Avoid assuming community access.";
    case "occasional":
      return "Suggest ways to deepen community engagement while respecting current boundaries.";
    case "regular":
      return "Reference community practices and shared experiences as points of connection.";
    case "active":
      return "Include service-oriented perspectives and community leadership considerations.";
    case "leader":
      return "Include perspectives on shepherding others and community development responsibilities.";
    default:
      return "Balance individual practice with community engagement.";
  }
}

function getCulturalBackgroundGuidance(background: string): string {
  switch (background) {
    case "south-asian":
      return "Be sensitive to South Asian cultural contexts when relevant.";
    case "middle-eastern":
      return "Be sensitive to Middle Eastern cultural contexts when relevant.";
    case "african":
      return "Be sensitive to African cultural contexts when relevant.";
    case "southeast-asian":
      return "Be sensitive to Southeast Asian cultural contexts when relevant.";
    case "western":
      return "Be sensitive to Western cultural contexts when relevant.";
    case "convert":
      return "Consider perspectives helpful for those who have converted to Islam.";
    case "mixed":
      return "Consider multicultural perspectives and navigation between different cultural contexts.";
    default:
      return "Be culturally sensitive and inclusive in examples and guidance.";
  }
}

function getReflectionStyleGuidance(style: string): string {
  switch (style) {
    case "analytical":
      return "Use logical frameworks, structured analysis, and clear reasoning.";
    case "emotional":
      return "Emphasize heart-centered language, emotional intelligence, and personal connection.";
    case "practical":
      return "Focus on actionable steps, concrete examples, and real-world applications.";
    case "balanced":
      return "Blend logical reasoning, emotional intelligence, and practical application.";
    default:
      return "Balance intellectual, emotional, and practical elements in responses.";
  }
}

function getGuidancePreferencesGuidance(preferences: string[]): string {
  const guidanceMap: Record<string, string> = {
    "practical": "Include actionable steps and real-world applications",
    "spiritual": "Emphasize inner states and spiritual dimensions",
    "scholarly": "Include references to Islamic scholarship and textual evidence",
    "reflective": "Encourage personal contemplation and self-examination",
    "action-oriented": "Focus on concrete actions and behavioral changes",
    "community-focused": "Consider community dimensions and social responsibilities"
  };

  const guidancePoints = preferences
    .map(pref => guidanceMap[pref] || "")
    .filter(guidance => guidance !== "");
  
  return guidancePoints.join(". ") + ".";
} 