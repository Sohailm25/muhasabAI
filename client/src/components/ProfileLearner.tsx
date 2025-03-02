import { useEffect } from 'react';
import { useProfile } from '../hooks/useProfile';
import { analyzeReflection } from '../lib/reflectionAnalysis';

interface ProfileLearnerProps {
  userReflection: string;
  aiResponse: any;
}

export function ProfileLearner({ userReflection, aiResponse }: ProfileLearnerProps) {
  const { privateProfile, updateProfile } = useProfile();
  
  useEffect(() => {
    // Skip if no reflection or AI response
    if (!userReflection || !aiResponse || !privateProfile) return;
    
    async function learnFromInteraction() {
      try {
        // We've already checked privateProfile is not null above
        // Using non-null assertion to satisfy TypeScript
        const profile = privateProfile!;
        
        // Analyze this reflection
        const analysis = analyzeReflection(userReflection, aiResponse);
        
        // Extract topics mentioned
        const topics = analysis.topics || [];
        
        // Update topic engagement counters
        const topicsEngagedWith = profile.dynamicAttributes?.topicsEngagedWith || {};
        topics.forEach(topic => {
          topicsEngagedWith[topic] = (topicsEngagedWith[topic] || 0) + 1;
        });
        
        // Track reference types found helpful
        const preferredReferences = profile.dynamicAttributes?.preferredReferences || {};
        if (analysis.referenceTypes && analysis.referenceTypes.length > 0) {
          analysis.referenceTypes.forEach(refType => {
            preferredReferences[refType] = (preferredReferences[refType] || 0) + 1;
          });
        }
        
        // Update emotional responsiveness
        const emotionalResponsiveness = profile.dynamicAttributes?.emotionalResponsiveness || {};
        if (analysis.emotions && Object.keys(analysis.emotions).length > 0) {
          Object.entries(analysis.emotions).forEach(([emotion, strength]) => {
            emotionalResponsiveness[emotion] = 
              ((emotionalResponsiveness[emotion] || 0) * 0.7) + (strength * 0.3);
          });
        }
        
        // Track language complexity
        const languageComplexity = 
          (profile.dynamicAttributes?.languageComplexity || 5) * 0.7 + 
          (analysis.complexity || 5) * 0.3;
        
        // Track recent topics
        const lastTopics = [
          ...topics,
          ...(profile.recentInteractions?.lastTopics || [])
        ].slice(0, 10); // Keep only 10 most recent
        
        // Ensure we have valid arrays for recentInteractions
        const lastActionItems = profile.recentInteractions?.lastActionItems || [];
        const completedActionItems = profile.recentInteractions?.completedActionItems || [];
        
        // Update private profile with learned information
        await updateProfile(undefined, {
          dynamicAttributes: {
            topicsEngagedWith,
            preferredReferences,
            emotionalResponsiveness,
            languageComplexity
          },
          recentInteractions: {
            lastTopics,
            lastActionItems,
            completedActionItems
          }
        });
        
        console.log('Profile updated with learned preferences', {
          topics,
          languageComplexity,
          emotionalTopics: Object.keys(emotionalResponsiveness).filter(
            emotion => emotionalResponsiveness[emotion] > 5
          )
        });
      } catch (error) {
        console.error('Error learning from interaction:', error);
      }
    }
    
    learnFromInteraction();
  }, [userReflection, aiResponse, privateProfile, updateProfile]);
  
  // This is a background component with no UI
  return null;
} 