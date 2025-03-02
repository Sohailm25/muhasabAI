/**
 * Privacy settings for the user profile
 */
export interface PrivacySettings {
  allowPersonalization: boolean;
  localStorageOnly: boolean;
  enableSync: boolean;
}

/**
 * Public part of the user profile (not encrypted)
 */
export interface PublicProfile {
  userId?: string;
  version: string;
  lastUpdated: string;
  privacySettings: PrivacySettings;
}

/**
 * Private part of the user profile (encrypted)
 */
export interface PrivateProfile {
  knowledgeLevel?: string;
  topicsOfInterest?: string[];
  spiritualJourneyStage?: string;
  primaryGoals?: string[];
  reflectionStyle?: string;
  guidancePreferences?: string[];
  customPreferences?: Record<string, any>;
}

/**
 * Combined user profile type
 */
export interface ProfileType extends PublicProfile {
  privateProfile?: PrivateProfile;
} 