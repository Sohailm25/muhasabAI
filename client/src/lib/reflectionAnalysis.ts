interface ReflectionAnalysis {
  topics: string[];
  referenceTypes?: string[];
  emotions?: Record<string, number>;
  complexity?: number;
  actionItems?: string[];
}

/**
 * Analyzes a user reflection and AI response to extract insights
 * while preserving privacy. This is used for implicit personalization
 * based on user interactions.
 */
export function analyzeReflection(
  userReflection: string,
  aiResponse: any
): ReflectionAnalysis {
  // Main analysis object
  const analysis: ReflectionAnalysis = {
    topics: [],
  };
  
  try {
    // Extract topics from reflection and response
    analysis.topics = extractTopics(userReflection, aiResponse);
    
    // Identify reference types (Quran, hadith, scholarly)
    analysis.referenceTypes = identifyReferenceTypes(userReflection, aiResponse);
    
    // Analyze emotional content
    analysis.emotions = analyzeEmotionalContent(userReflection);
    
    // Calculate language complexity
    analysis.complexity = calculateComplexity(userReflection);
    
    // Extract action items
    analysis.actionItems = extractActionItems(userReflection, aiResponse);
    
    return analysis;
  } catch (error) {
    console.error('Error analyzing reflection:', error);
    // Return at least topic analysis if available, otherwise empty
    return {
      topics: analysis.topics.length > 0 ? analysis.topics : [],
    };
  }
}

/**
 * Extract main topics from user reflection and AI response
 */
function extractTopics(userReflection: string, aiResponse: any): string[] {
  const combinedText = `${userReflection} ${JSON.stringify(aiResponse)}`.toLowerCase();
  
  // Common Islamic topics to look for
  const topicMap: Record<string, string[]> = {
    'prayer': ['prayer', 'salah', 'salat', 'namaz', 'worship'],
    'quran': ['quran', 'qur\'an', 'ayah', 'surah', 'verse'],
    'fasting': ['fast', 'fasting', 'ramadan', 'sawm', 'iftar', 'suhoor'],
    'charity': ['charity', 'zakat', 'sadaqah', 'giving', 'donate'],
    'pilgrimage': ['hajj', 'umrah', 'pilgrimage', 'mecca', 'kaaba'],
    'faith': ['iman', 'faith', 'belief', 'doubt', 'trust in allah'],
    'family': ['family', 'marriage', 'parent', 'child', 'spouse', 'relationship'],
    'ethics': ['ethics', 'morals', 'character', 'akhlaq', 'behavior', 'conduct'],
    'spirituality': ['spirituality', 'spiritual', 'soul', 'heart', 'nafs', 'ruh'],
    'community': ['community', 'ummah', 'brotherhood', 'sisterhood', 'mosque', 'masjid'],
    'knowledge': ['knowledge', 'learning', 'study', 'education', 'ilm'],
    'daily-life': ['daily', 'routine', 'lifestyle', 'habit', 'discipline'],
    'challenges': ['challenge', 'difficulty', 'struggle', 'hardship', 'problem'],
    'gratitude': ['gratitude', 'thankful', 'shukr', 'blessings', 'appreciate'],
    'patience': ['patience', 'sabr', 'endurance', 'perseverance'],
    'repentance': ['repentance', 'tawbah', 'forgiveness', 'mercy', 'istighfar'],
    'mindfulness': ['mindfulness', 'presence', 'awareness', 'intention', 'niyyah'],
  };
  
  // Identify topics from the map
  const detectedTopics = Object.entries(topicMap)
    .filter(([_, keywords]) => 
      keywords.some(keyword => combinedText.includes(keyword))
    )
    .map(([topic]) => topic);
  
  // Ensure we return at least one topic
  return detectedTopics.length > 0 ? detectedTopics : ['general'];
}

/**
 * Identify types of references used in the reflection and response
 */
function identifyReferenceTypes(userReflection: string, aiResponse: any): string[] {
  const combinedText = `${userReflection} ${JSON.stringify(aiResponse)}`.toLowerCase();
  const referenceTypes: string[] = [];
  
  // Reference patterns
  const patterns: Record<string, RegExp[]> = {
    'quran': [
      /surah|ayah|verse|qur['']an \d+:\d+/i,
      /quran \d+:\d+/i,
      /sura[ht]/i
    ],
    'hadith': [
      /hadith|bukhari|muslim|tirmidhi|narrated by|reported by/i,
      /the prophet said|prophet muhammad said|messenger of allah said/i
    ],
    'scholarly': [
      /scholar|imam|sheikh|opinion|according to|view|interpretation/i,
      /madhab|madhdhab|maliki|hanafi|shafi'i|hanbali/i
    ],
    'practical': [
      /practical|steps|habit|routine|daily|implement|action/i,
      /try to|begin to|start by|practice/i
    ],
    'reflective': [
      /reflect|contemplate|consider|ponder|think about|meditate on/i,
      /what does this mean|how does this|why might|question/i
    ]
  };
  
  // Check for each reference type
  for (const [type, patternList] of Object.entries(patterns)) {
    if (patternList.some(pattern => pattern.test(combinedText))) {
      referenceTypes.push(type);
    }
  }
  
  return referenceTypes;
}

/**
 * Basic emotional content analysis
 */
function analyzeEmotionalContent(text: string): Record<string, number> {
  const emotions: Record<string, number> = {};
  const lowerText = text.toLowerCase();
  
  // Emotional patterns to check for
  const emotionPatterns: Record<string, [string[], number]> = {
    'joy': [['happy', 'joy', 'grateful', 'thankful', 'blessed', 'elated', 'pleased'], 8],
    'sadness': [['sad', 'sorrow', 'grief', 'unhappy', 'depressed', 'down', 'blue'], 7],
    'fear': [['afraid', 'fear', 'scared', 'anxious', 'worried', 'nervous', 'dread'], 7],
    'anger': [['angry', 'upset', 'frustrated', 'annoyed', 'irritated', 'mad'], 8],
    'confusion': [['confused', 'unsure', 'uncertain', 'puzzled', 'perplexed', 'doubt'], 6],
    'hope': [['hope', 'hopeful', 'optimistic', 'looking forward', 'excited', 'anticipate'], 7],
    'peace': [['peace', 'calm', 'tranquil', 'serene', 'content', 'relaxed'], 6],
    'guilt': [['guilt', 'regret', 'remorse', 'sorry', 'apologetic'], 8],
    'loneliness': [['lonely', 'alone', 'isolated', 'disconnected'], 7],
    'gratitude': [['grateful', 'thankful', 'appreciate', 'blessed'], 7]
  };
  
  // Check for emotional keywords and assign intensity
  for (const [emotion, [keywords, baseIntensity]] of Object.entries(emotionPatterns)) {
    for (const keyword of keywords) {
      if (lowerText.includes(keyword)) {
        // Count occurrences for intensity boost
        const occurrences = (lowerText.match(new RegExp(`\\b${keyword}\\b`, 'gi')) || []).length;
        
        // Calculate intensity (capped at 10)
        const intensity = Math.min(baseIntensity + (occurrences > 1 ? 2 : 0), 10);
        
        emotions[emotion] = Math.max(emotions[emotion] || 0, intensity);
      }
    }
  }
  
  return emotions;
}

/**
 * Calculate text complexity (1-10 scale)
 */
function calculateComplexity(text: string): number {
  // Skip empty or very short text
  if (!text || text.length < 10) {
    return 5; // Default mid-level
  }
  
  // Split by sentence-ending punctuation
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  
  // Calculate average sentence length (word count)
  const avgSentenceLength = sentences.reduce((sum, sentence) => {
    const words = sentence.trim().split(/\s+/).length;
    return sum + words;
  }, 0) / Math.max(sentences.length, 1);
  
  // Calculate average word length
  const words = text.split(/\s+/).filter(w => w.length > 0);
  const avgWordLength = words.reduce((sum, word) => {
    return sum + word.length;
  }, 0) / Math.max(words.length, 1);
  
  // Count uncommon/complex words
  const complexWordCount = words.filter(word => {
    // Simple heuristic: longer words tend to be more complex
    return word.length > 8 || 
      // Or words with specific academic/theological prefixes
      /^(meta|theo|philo|onto|epist|eschato|exege|herme)/i.test(word);
  }).length;
  
  // Percentage of complex words
  const complexWordPercentage = complexWordCount / Math.max(words.length, 1);
  
  // Calculate complexity score (1-10 scale)
  // Based on sentence length, word length, and complex word percentage
  let complexityScore = 
    (avgSentenceLength / 25 * 4) + // Longer sentences = higher score
    (avgWordLength / 8 * 3) +      // Longer words = higher score
    (complexWordPercentage * 15);  // More complex words = higher score
  
  // Ensure score is between 1-10
  return Math.max(1, Math.min(10, Math.round(complexityScore)));
}

/**
 * Extract action items from reflection and response
 */
function extractActionItems(userReflection: string, aiResponse: any): string[] {
  // Get response text from different possible response formats
  let responseText = '';
  
  if (typeof aiResponse === 'string') {
    responseText = aiResponse;
  } else if (aiResponse.text || aiResponse.content) {
    responseText = aiResponse.text || aiResponse.content;
  } else if (aiResponse.understanding && aiResponse.questions) {
    responseText = `${aiResponse.understanding} ${aiResponse.questions.join(' ')}`;
  } else if (typeof aiResponse === 'object') {
    responseText = JSON.stringify(aiResponse);
  }
  
  // Look for action patterns in the AI response
  const actionPatterns = [
    /try to ([^.!?]+)[.!?]/gi,
    /consider ([^.!?]+)[.!?]/gi,
    /practice ([^.!?]+)[.!?]/gi,
    /should ([^.!?]+)[.!?]/gi,
    /could ([^.!?]+)[.!?]/gi,
    /start ([^.!?]+)[.!?]/gi,
    /begin ([^.!?]+)[.!?]/gi,
    /implement ([^.!?]+)[.!?]/gi,
    /incorporate ([^.!?]+)[.!?]/gi
  ];
  
  const actionItems: string[] = [];
  
  // Extract potential action items (fix for matchAll iterator error)
  for (const pattern of actionPatterns) {
    // Use exec in a loop instead of matchAll
    let match;
    while ((match = pattern.exec(responseText)) !== null) {
      if (match[1] && match[1].length > 5 && match[1].length < 100) {
        actionItems.push(match[1].trim());
      }
    }
  }
  
  // Deduplicate similar items
  return deduplicate(actionItems);
}

/**
 * Simple deduplication for similar strings
 */
function deduplicate(items: string[]): string[] {
  const result: string[] = [];
  
  for (const item of items) {
    // Check if this item is too similar to any existing item
    const isDuplicate = result.some(existing => {
      // Calculate similarity score
      const similarity = calculateSimilarity(item.toLowerCase(), existing.toLowerCase());
      return similarity > 0.7; // 70% similarity threshold
    });
    
    if (!isDuplicate) {
      result.push(item);
    }
  }
  
  return result;
}

/**
 * Calculate similarity between two strings (0-1 score)
 */
function calculateSimilarity(str1: string, str2: string): number {
  // Simple Jaccard similarity for words
  const words1 = str1.split(/\s+/).filter(w => w.length > 3);
  const words2 = str2.split(/\s+/).filter(w => w.length > 3);
  
  if (words1.length === 0 && words2.length === 0) return 1;
  if (words1.length === 0 || words2.length === 0) return 0;
  
  // Convert arrays to Sets for unique words
  const set1 = new Set(words1);
  const set2 = new Set(words2);
  
  // Calculate intersection size (fix for Set iteration error)
  const intersection = words1.filter(word => set2.has(word));
  const intersectionSize = intersection.length;
  
  // Jaccard similarity: intersection size / union size
  return intersectionSize / (set1.size + set2.size - intersectionSize);
} 