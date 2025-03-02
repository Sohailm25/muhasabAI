export interface PublicProfile {
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  version?: number;
  generalPreferences: {
    inputMethod: string;
    reflectionFrequency: string;
    languagePreferences: string;
  };
  privacySettings: {
    localStorageOnly: boolean;
    allowPersonalization: boolean;
    enableSync?: boolean;
  };
  // Non-sensitive usage statistics
  usageStats?: {
    reflectionCount: number;
    lastActiveDate: Date;
    streakDays: number;
  };
}

export interface PrivateProfile {
  // Personal context
  version?: number;
  spiritualJourneyStage: string;
  primaryGoals: string[];
  knowledgeLevel: string;
  lifeStage: string;
  communityConnection: string;
  culturalBackground: string;
  
  // Reflection preferences
  reflectionStyle: string;
  guidancePreferences: string[];
  topicsOfInterest: string[];
  
  // Dynamic attributes (evolve over time)
  dynamicAttributes?: {
    topicsEngagedWith: Record<string, number>;
    preferredReferences: Record<string, number>;
    emotionalResponsiveness: Record<string, number>;
    languageComplexity: number;
  };
  
  // Observed patterns
  observedPatterns?: {
    recurringChallenges: string[];
    strongEmotionalTopics: string[];
    growthAreas: string[];
    spiritualStrengths: string[];
    avoidedTopics: string[];
  };
  
  // Recent context
  recentInteractions?: {
    lastTopics: string[];
    lastActionItems: string[];
    completedActionItems: string[];
  };
}

export interface EncryptedProfileData {
  data: string; // Base64 encoded encrypted data
  iv: number[]; // Initialization vector for decryption
} 