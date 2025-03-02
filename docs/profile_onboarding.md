# SahabAI Privacy-Focused Implementation Guide

## Implementation Document for Junior Engineers

### Table of Contents
1. [Introduction](#introduction)
2. [User Onboarding Information Collection](#user-onboarding-information-collection)
3. [Dynamic User Profile System](#dynamic-user-profile-system)
4. [Privacy-Preserving Architecture](#privacy-preserving-architecture)
5. [Cross-Session Personalization](#cross-session-personalization)
6. [Technical Implementation Details](#technical-implementation-details)
7. [Testing & Validation](#testing--validation)

## Introduction

This document provides implementation guidelines for enhancing SahabAI with a privacy-focused user profiling system. Our goal is to provide personalized Islamic reflection experiences while ensuring user privacy and data security. The implementation leverages our existing tech stack (React, TypeScript, Shadcn UI, Node.js, Express, PostgreSQL) and extends it with client-side encryption and secure data handling patterns.

## User Onboarding Information Collection

### Implementation Tasks

1. **Create Onboarding Flow Components**
   ```typescript
   // components/onboarding/OnboardingFlow.tsx
   import React, { useState } from 'react';
   import { Button } from '@/components/ui/button';
   import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
   import { SpiritualJourneyStep } from './SpiritualJourneyStep';
   import { PersonalContextStep } from './PersonalContextStep';
   import { ReflectionPreferencesStep } from './ReflectionPreferencesStep';
   import { TechnicalPreferencesStep } from './TechnicalPreferencesStep';
   import { PrivacySettingsStep } from './PrivacySettingsStep';
   
   export function OnboardingFlow() {
     const [currentStep, setCurrentStep] = useState(0);
     const [onboardingData, setOnboardingData] = useState({
       // Initialize with empty values for all fields
       spiritualJourneyStage: '',
       primaryGoals: [],
       knowledgeLevel: '',
       lifeStage: '',
       communityConnection: '',
       culturalBackground: '',
       reflectionStyle: '',
       guidancePreferences: [],
       topicsOfInterest: [],
       reflectionFrequency: '',
       inputMethod: '',
       languagePreferences: '',
       privacySettings: {
         localStorageOnly: false,
         allowPersonalization: true,
       }
     });
   
     // Steps configuration
     const steps = [
       { title: "Your Spiritual Journey", component: SpiritualJourneyStep },
       { title: "About You", component: PersonalContextStep },
       { title: "Reflection Preferences", component: ReflectionPreferencesStep },
       { title: "App Preferences", component: TechnicalPreferencesStep },
       { title: "Privacy Settings", component: PrivacySettingsStep },
     ];
   
     // Update data from each step
     const updateOnboardingData = (stepData) => {
       setOnboardingData(prev => ({ ...prev, ...stepData }));
     };
   
     // Navigate between steps
     const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, steps.length - 1));
     const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 0));
   
     // Complete onboarding
     const completeOnboarding = async () => {
       try {
         // Generate encryption keys for user data
         const encryptionKey = await generateUserEncryptionKey();
         
         // Encrypt sensitive profile data
         const { publicProfile, encryptedPrivateProfile } = await createEncryptedProfile(
           onboardingData, 
           encryptionKey
         );
         
         // Store public profile in database
         await api.createUserProfile(publicProfile);
         
         // Store encrypted private profile and encryption metadata locally
         storeLocalEncryptedProfile(encryptedPrivateProfile);
         
         // Navigate to main app
         router.push('/app/reflection');
       } catch (error) {
         console.error('Error completing onboarding:', error);
         // Show error to user
       }
     };
   
     // Render current step
     const CurrentStepComponent = steps[currentStep].component;
   
     return (
       <Card className="w-full max-w-3xl mx-auto">
         <CardHeader>
           <CardTitle>{steps[currentStep].title}</CardTitle>
           <CardDescription>Step {currentStep + 1} of {steps.length}</CardDescription>
         </CardHeader>
         <CardContent>
           <CurrentStepComponent 
             data={onboardingData} 
             updateData={updateOnboardingData} 
           />
           
           <div className="flex justify-between mt-6">
             {currentStep > 0 && (
               <Button variant="outline" onClick={prevStep}>Back</Button>
             )}
             {currentStep < steps.length - 1 ? (
               <Button onClick={nextStep}>Next</Button>
             ) : (
               <Button onClick={completeOnboarding}>Complete Setup</Button>
             )}
           </div>
         </CardContent>
       </Card>
     );
   }
   ```

2. **Create Individual Onboarding Step Components**

   Implement each component referenced in the OnboardingFlow:
   - `SpiritualJourneyStep.tsx`
   - `PersonalContextStep.tsx`
   - `ReflectionPreferencesStep.tsx`
   - `TechnicalPreferencesStep.tsx`
   - `PrivacySettingsStep.tsx`

   Example for the SpiritualJourneyStep:

   ```typescript
   // components/onboarding/SpiritualJourneyStep.tsx
   import React from 'react';
   import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
   import { Label } from '@/components/ui/label';
   import { Checkbox } from '@/components/ui/checkbox';
   
   interface SpiritualJourneyStepProps {
     data: any;
     updateData: (data: any) => void;
   }
   
   export function SpiritualJourneyStep({ data, updateData }: SpiritualJourneyStepProps) {
     // Journey stage options
     const journeyStages = [
       { value: 'exploring', label: 'Exploring Islam' },
       { value: 'returning', label: 'Returning to practice' },
       { value: 'established', label: 'Established practice' },
       { value: 'seeking-depth', label: 'Seeking deeper knowledge' },
     ];
     
     // Spiritual goals options
     const spiritualGoals = [
       { value: 'prayer', label: 'Prayer consistency' },
       { value: 'quran', label: 'Quran understanding' },
       { value: 'character', label: 'Character development' },
       { value: 'community', label: 'Community connection' },
       { value: 'dhikr', label: 'Daily remembrance' },
       { value: 'knowledge', label: 'Knowledge seeking' },
     ];
     
     // Knowledge level options
     const knowledgeLevels = [
       { value: 'beginner', label: 'I prefer simple explanations' },
       { value: 'intermediate', label: 'I understand basic Islamic concepts' },
       { value: 'advanced', label: 'I\'m comfortable with detailed scholarly discussions' },
     ];
     
     // Handle stage selection
     const handleStageChange = (value) => {
       updateData({ spiritualJourneyStage: value });
     };
     
     // Handle goals selection
     const handleGoalToggle = (value) => {
       const currentGoals = [...data.primaryGoals];
       if (currentGoals.includes(value)) {
         updateData({ primaryGoals: currentGoals.filter(goal => goal !== value) });
       } else {
         updateData({ primaryGoals: [...currentGoals, value] });
       }
     };
     
     // Handle knowledge level selection
     const handleKnowledgeChange = (value) => {
       updateData({ knowledgeLevel: value });
     };
     
     return (
       <div className="space-y-6">
         <div>
           <h3 className="text-lg font-medium">Where are you on your Islamic journey?</h3>
           <p className="text-sm text-muted-foreground mb-3">
             This helps us tailor content to your current stage.
           </p>
           
           <RadioGroup 
             value={data.spiritualJourneyStage} 
             onValueChange={handleStageChange}
           >
             {journeyStages.map(stage => (
               <div key={stage.value} className="flex items-center space-x-2 my-2">
                 <RadioGroupItem value={stage.value} id={`stage-${stage.value}`} />
                 <Label htmlFor={`stage-${stage.value}`}>{stage.label}</Label>
               </div>
             ))}
           </RadioGroup>
         </div>
         
         <div>
           <h3 className="text-lg font-medium">What aspects of spiritual growth are you focusing on?</h3>
           <p className="text-sm text-muted-foreground mb-3">
             Select all that apply. You can change these later.
           </p>
           
           {spiritualGoals.map(goal => (
             <div key={goal.value} className="flex items-center space-x-2 my-2">
               <Checkbox 
                 id={`goal-${goal.value}`} 
                 checked={data.primaryGoals.includes(goal.value)}
                 onCheckedChange={() => handleGoalToggle(goal.value)}
               />
               <Label htmlFor={`goal-${goal.value}`}>{goal.label}</Label>
             </div>
           ))}
         </div>
         
         <div>
           <h3 className="text-lg font-medium">How comfortable are you with Islamic terminology?</h3>
           <p className="text-sm text-muted-foreground mb-3">
             This helps us adjust the language we use.
           </p>
           
           <RadioGroup 
             value={data.knowledgeLevel} 
             onValueChange={handleKnowledgeChange}
           >
             {knowledgeLevels.map(level => (
               <div key={level.value} className="flex items-center space-x-2 my-2">
                 <RadioGroupItem value={level.value} id={`level-${level.value}`} />
                 <Label htmlFor={`level-${level.value}`}>{level.label}</Label>
               </div>
             ))}
           </RadioGroup>
         </div>
       </div>
     );
   }
   ```

3. **Create API Integration for Onboarding**

   ```typescript
   // services/profileService.ts
   import { api } from './api';
   import { encryptData, decryptData, generateEncryptionKey } from '../utils/encryption';
   
   export async function generateUserEncryptionKey() {
     const key = await window.crypto.subtle.generateKey(
       { name: 'AES-GCM', length: 256 },
       true,
       ['encrypt', 'decrypt']
     );
     
     // Export key to storable format
     const exportedKey = await window.crypto.subtle.exportKey('jwk', key);
     
     // Store securely in local storage
     localStorage.setItem(
       'sahabai_encryption_key',
       JSON.stringify(exportedKey)
     );
     
     return key;
   }
   
   export async function createEncryptedProfile(profileData, encryptionKey) {
     // Split profile into public and private parts
     const publicProfile = {
       userId: profileData.userId || crypto.randomUUID(),
       createdAt: new Date(),
       generalPreferences: {
         inputMethod: profileData.inputMethod,
         reflectionFrequency: profileData.reflectionFrequency,
         languagePreferences: profileData.languagePreferences,
       },
       privacySettings: profileData.privacySettings,
     };
     
     // Private data that will be encrypted
     const privateProfile = {
       spiritualJourneyStage: profileData.spiritualJourneyStage,
       primaryGoals: profileData.primaryGoals,
       knowledgeLevel: profileData.knowledgeLevel,
       lifeStage: profileData.lifeStage,
       communityConnection: profileData.communityConnection,
       culturalBackground: profileData.culturalBackground,
       reflectionStyle: profileData.reflectionStyle,
       guidancePreferences: profileData.guidancePreferences,
       topicsOfInterest: profileData.topicsOfInterest,
     };
     
     // Generate initialization vector for encryption
     const iv = window.crypto.getRandomValues(new Uint8Array(12));
     
     // Encrypt private profile
     const encryptedPrivateProfile = await encryptData(
       JSON.stringify(privateProfile),
       encryptionKey,
       iv
     );
     
     return {
       publicProfile,
       encryptedPrivateProfile: {
         data: encryptedPrivateProfile,
         iv: Array.from(iv)
       }
     };
   }
   
   export function storeLocalEncryptedProfile(encryptedProfile) {
     localStorage.setItem(
       'sahabai_encrypted_profile',
       JSON.stringify(encryptedProfile)
     );
   }
   ```

## Dynamic User Profile System

### Implementation Tasks

1. **Create Profile Schema and Types**

   ```typescript
   // types/profile.ts
   export interface PublicProfile {
     userId: string;
     createdAt: Date;
     updatedAt: Date;
     generalPreferences: {
       inputMethod: string;
       reflectionFrequency: string;
       languagePreferences: string;
     };
     privacySettings: {
       localStorageOnly: boolean;
       allowPersonalization: boolean;
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
   ```

2. **Create Profile Hook for Easy Access**

   ```typescript
   // hooks/useProfile.ts
   import { useState, useEffect, useCallback } from 'react';
   import { 
     PublicProfile,
     PrivateProfile,
     EncryptedProfileData
   } from '../types/profile';
   import { 
     encryptData, 
     decryptData, 
     getEncryptionKey 
   } from '../utils/encryption';
   import { api } from '../services/api';
   
   export function useProfile() {
     const [publicProfile, setPublicProfile] = useState<PublicProfile | null>(null);
     const [privateProfile, setPrivateProfile] = useState<PrivateProfile | null>(null);
     const [isLoading, setIsLoading] = useState(true);
     const [error, setError] = useState<Error | null>(null);
     
     // Load profiles on hook initialization
     useEffect(() => {
       async function loadProfiles() {
         try {
           setIsLoading(true);
           
           // Load public profile from server
           const publicData = await api.getUserProfile();
           setPublicProfile(publicData);
           
           // Load and decrypt private profile
           await loadPrivateProfile();
           
           setIsLoading(false);
         } catch (err) {
           console.error('Failed to load profiles:', err);
           setError(err instanceof Error ? err : new Error('Unknown error loading profile'));
           setIsLoading(false);
         }
       }
       
       loadProfiles();
     }, []);
     
     // Load and decrypt private profile from local storage
     const loadPrivateProfile = async () => {
       try {
         // Get encrypted profile from local storage
         const encryptedProfileString = localStorage.getItem('sahabai_encrypted_profile');
         if (!encryptedProfileString) {
           setPrivateProfile(null);
           return;
         }
         
         const encryptedProfile = JSON.parse(encryptedProfileString) as EncryptedProfileData;
         
         // Get encryption key
         const key = await getEncryptionKey();
         
         // Decrypt private profile
         const iv = new Uint8Array(encryptedProfile.iv);
         const decryptedData = await decryptData(encryptedProfile.data, key, iv);
         
         // Parse decrypted data
         const privateData = JSON.parse(decryptedData) as PrivateProfile;
         setPrivateProfile(privateData);
       } catch (err) {
         console.error('Failed to decrypt private profile:', err);
         setError(err instanceof Error ? err : new Error('Failed to decrypt profile data'));
       }
     };
     
     // Update both public and private profiles
     const updateProfile = async (
       publicUpdates?: Partial<PublicProfile>,
       privateUpdates?: Partial<PrivateProfile>
     ) => {
       try {
         // Update public profile if there are changes
         if (publicUpdates && publicProfile) {
           const updatedPublicProfile = {
             ...publicProfile,
             ...publicUpdates,
             updatedAt: new Date()
           };
           
           // Save to server
           await api.updateUserProfile(updatedPublicProfile);
           
           // Update local state
           setPublicProfile(updatedPublicProfile);
         }
         
         // Update private profile if there are changes
         if (privateUpdates && privateProfile) {
           const updatedPrivateProfile = {
             ...privateProfile,
             ...privateUpdates
           };
           
           // Get encryption key
           const key = await getEncryptionKey();
           
           // Generate new IV for security
           const iv = window.crypto.getRandomValues(new Uint8Array(12));
           
           // Encrypt updated private profile
           const encryptedData = await encryptData(
             JSON.stringify(updatedPrivateProfile),
             key,
             iv
           );
           
           // Store locally
           localStorage.setItem(
             'sahabai_encrypted_profile',
             JSON.stringify({
               data: encryptedData,
               iv: Array.from(iv)
             })
           );
           
           // Update local state
           setPrivateProfile(updatedPrivateProfile);
         }
         
         return true;
       } catch (err) {
         console.error('Failed to update profile:', err);
         setError(err instanceof Error ? err : new Error('Failed to update profile'));
         return false;
       }
     };
     
     // Get full context for AI personalization
     const getProfileForAI = useCallback(async () => {
       if (!privateProfile) return null;
       
       // Extract only what's needed for personalization
       return {
         spiritualJourneyStage: privateProfile.spiritualJourneyStage,
         primaryGoals: privateProfile.primaryGoals,
         knowledgeLevel: privateProfile.knowledgeLevel,
         lifeStage: privateProfile.lifeStage,
         reflectionStyle: privateProfile.reflectionStyle,
         topicsOfInterest: privateProfile.topicsOfInterest,
         guidancePreferences: privateProfile.guidancePreferences,
         // Include relevant dynamic attributes and patterns
         ...(privateProfile.dynamicAttributes && {
           topicsEngagedWith: privateProfile.dynamicAttributes.topicsEngagedWith,
           preferredReferences: privateProfile.dynamicAttributes.preferredReferences
         }),
         ...(privateProfile.observedPatterns && {
           recurringChallenges: privateProfile.observedPatterns.recurringChallenges,
           spiritualStrengths: privateProfile.observedPatterns.spiritualStrengths
         }),
         // Recent context for continuity
         ...(privateProfile.recentInteractions && {
           lastTopics: privateProfile.recentInteractions.lastTopics
         })
       };
     }, [privateProfile]);
     
     return {
       publicProfile,
       privateProfile,
       isLoading,
       error,
       updateProfile,
       getProfileForAI
     };
   }
   ```

3. **Create Profile Learning Component**

   ```typescript
   // components/ProfileLearner.tsx
   import { useEffect } from 'react';
   import { useProfile } from '../hooks/useProfile';
   import { analyzeReflection } from '../utils/reflectionAnalysis';
   
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
           // Analyze this reflection
           const analysis = analyzeReflection(userReflection, aiResponse);
           
           // Extract topics mentioned
           const topics = analysis.topics || [];
           
           // Update topic engagement counters
           const topicsEngagedWith = { ...privateProfile.dynamicAttributes?.topicsEngagedWith };
           topics.forEach(topic => {
             topicsEngagedWith[topic] = (topicsEngagedWith[topic] || 0) + 1;
           });
           
           // Track reference types found helpful
           const preferredReferences = { ...privateProfile.dynamicAttributes?.preferredReferences };
           if (analysis.referenceTypes) {
             analysis.referenceTypes.forEach(refType => {
               preferredReferences[refType] = (preferredReferences[refType] || 0) + 1;
             });
           }
           
           // Update emotional responsiveness
           const emotionalResponsiveness = { ...privateProfile.dynamicAttributes?.emotionalResponsiveness };
           if (analysis.emotions) {
             Object.entries(analysis.emotions).forEach(([emotion, strength]) => {
               emotionalResponsiveness[emotion] = 
                 ((emotionalResponsiveness[emotion] || 0) * 0.7) + (strength * 0.3);
             });
           }
           
           // Track recent topics
           const lastTopics = [
             ...topics,
             ...(privateProfile.recentInteractions?.lastTopics || [])
           ].slice(0, 10); // Keep only 10 most recent
           
           // Update private profile with learned information
           await updateProfile(undefined, {
             dynamicAttributes: {
               ...privateProfile.dynamicAttributes,
               topicsEngagedWith,
               preferredReferences,
               emotionalResponsiveness,
             },
             recentInteractions: {
               ...privateProfile.recentInteractions,
               lastTopics,
             }
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
   ```

## Privacy-Preserving Architecture

### Implementation Tasks

1. **Create Encryption Utilities**

   ```typescript
   // utils/encryption.ts
   
   // Get or create encryption key
   export async function getEncryptionKey() {
     try {
       // Try to get existing key from storage
       const storedKey = localStorage.getItem('sahabai_encryption_key');
       
       if (storedKey) {
         // Parse the stored key
         const keyData = JSON.parse(storedKey);
         
         // Import the key
         return await window.crypto.subtle.importKey(
           'jwk',
           keyData,
           { name: 'AES-GCM', length: 256 },
           false,
           ['encrypt', 'decrypt']
         );
       }
       
       // If no key exists, create a new one
       return await generateEncryptionKey();
     } catch (error) {
       console.error('Error getting encryption key:', error);
       throw new Error('Failed to access encryption key. Please reset your profile.');
     }
   }
   
   // Generate a new encryption key
   export async function generateEncryptionKey() {
     try {
       // Generate a new key
       const key = await window.crypto.subtle.generateKey(
         { name: 'AES-GCM', length: 256 },
         true,
         ['encrypt', 'decrypt']
       );
       
       // Export for storage
       const exportedKey = await window.crypto.subtle.exportKey('jwk', key);
       
       // Store securely
       localStorage.setItem(
         'sahabai_encryption_key',
         JSON.stringify(exportedKey)
       );
       
       return key;
     } catch (error) {
       console.error('Error generating encryption key:', error);
       throw new Error('Failed to create encryption key. Please check your browser settings.');
     }
   }
   
   // Encrypt data
   export async function encryptData(data: string, key: CryptoKey, iv: Uint8Array) {
     try {
       // Convert data to buffer
       const dataBuffer = new TextEncoder().encode(data);
       
       // Encrypt
       const encryptedBuffer = await window.crypto.subtle.encrypt(
         { name: 'AES-GCM', iv },
         key,
         dataBuffer
       );
       
       // Convert to base64 for storage
       return arrayBufferToBase64(encryptedBuffer);
     } catch (error) {
       console.error('Error encrypting data:', error);
       throw new Error('Failed to encrypt data.');
     }
   }
   
   // Decrypt data
   export async function decryptData(encryptedData: string, key: CryptoKey, iv: Uint8Array) {
     try {
       // Convert base64 to buffer
       const encryptedBuffer = base64ToArrayBuffer(encryptedData);
       
       // Decrypt
       const decryptedBuffer = await window.crypto.subtle.decrypt(
         { name: 'AES-GCM', iv },
         key,
         encryptedBuffer
       );
       
       // Convert to string
       return new TextDecoder().decode(decryptedBuffer);
     } catch (error) {
       console.error('Error decrypting data:', error);
       throw new Error('Failed to decrypt data. The encryption key may be invalid.');
     }
   }
   
   // Helper function: ArrayBuffer to Base64
   function arrayBufferToBase64(buffer: ArrayBuffer) {
     const bytes = new Uint8Array(buffer);
     let binary = '';
     
     for (let i = 0; i < bytes.byteLength; i++) {
       binary += String.fromCharCode(bytes[i]);
     }
     
     return btoa(binary);
   }
   
   // Helper function: Base64 to ArrayBuffer
   function base64ToArrayBuffer(base64: string) {
     const binaryString = atob(base64);
     const bytes = new Uint8Array(binaryString.length);
     
     for (let i = 0; i < binaryString.length; i++) {
       bytes[i] = binaryString.charCodeAt(i);
     }
     
     return bytes.buffer;
   }
   
   // Generate key backup
   export async function exportKeyForBackup() {
     try {
       const storedKey = localStorage.getItem('sahabai_encryption_key');
       
       if (!storedKey) {
         throw new Error('No encryption key found');
       }
       
       // Create a download of the key
       const blob = new Blob([storedKey], { type: 'application/json' });
       const url = URL.createObjectURL(blob);
       
       // Create download link
       const a = document.createElement('a');
       a.href = url;
       a.download = 'sahabai-key-backup.json';
       document.body.appendChild(a);
       a.click();
       
       // Clean up
       setTimeout(() => {
         document.body.removeChild(a);
         window.URL.revokeObjectURL(url);
       }, 0);
       
       return true;
     } catch (error) {
       console.error('Error exporting key for backup:', error);
       return false;
     }
   }
   
   // Import key from backup
   export async function importKeyFromBackup(file: File) {
     try {
       // Read file content
       const reader = new FileReader();
       
       return new Promise<boolean>((resolve, reject) => {
         reader.onload = async (event) => {
           try {
             const keyData = event.target?.result as string;
             
             // Validate key format
             const parsedKey = JSON.parse(keyData);
             if (!parsedKey.k || !parsedKey.alg) {
               throw new Error('Invalid key format');
             }
             
             // Store key
             localStorage.setItem('sahabai_encryption_key', keyData);
             
             // Test by getting the key
             await getEncryptionKey();
             
             resolve(true);
           } catch (error) {
             reject(error);
           }
         };
         
         reader.onerror = () => reject(new Error('Failed to read backup file'));
         
         reader.readAsText(file);
       });
     } catch (error) {
       console.error('Error importing key from backup:', error);
       return false;
     }
   }
   ```

2. **Create Private API Client**

   ```typescript
   // services/privateApiClient.ts
   import { getEncryptionKey, encryptData, decryptData } from '../utils/encryption';
   
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
   ```

3. **Create Backend Proxy for Claude API**

   ```typescript
   // server/routes/claude.js
   const express = require('express');
   const router = express.Router();
   const { anthropic } = require('../services/anthropic');
   
   // Proxy endpoint for Claude API
   router.post('/reflection', async (req, res) => {
     try {
       // Get request body
       const { model, max_tokens, messages } = req.body;
       
       // Call Claude API
       const response = await anthropic.messages.create({
         model,
         max_tokens,
         messages
       });
       
       // Extract and format the response
       // Parse out understanding and questions from response format
       const content = response.content[0].text;
       
       // Extract understanding response
       const understandingMatch = content.match(
         /<UNDERSTANDING_RESPONSE>([\s\S]*?)<\/UNDERSTANDING_RESPONSE>/
       );
       
       // Extract reflection questions
       const questionsMatch = content.match(
         /<REFLECTION_QUESTIONS>([\s\S]*?)<\/REFLECTION_QUESTIONS>/
       );
       
       const understanding = understandingMatch ? understandingMatch[1].trim() : "";
       
       // Parse questions into array
       let questions = [];
       if (questionsMatch) {
         const questionsText = questionsMatch[1];
         questions = questionsText
           .split(/Q\d+:/)
           .filter(q => q.trim())
           .map(q => q.trim());
       }
       
       // Send formatted response
       res.json({
         understanding,
         questions
       });
     } catch (error) {
       console.error('Error calling Claude API:', error);
       res.status(500).json({ error: 'Failed to process reflection' });
     }
   });
   
   module.exports = router;
   ```

## Cross-Session Personalization

### Implementation Tasks

1. **Create Database Schema**

   ```sql
   -- database/migrations/01_create_user_profiles.sql
   CREATE TABLE user_profiles (
     user_id UUID PRIMARY KEY,
     created_at TIMESTAMP NOT NULL DEFAULT NOW(),
     updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
     
     -- Non-sensitive preferences (plaintext)
     general_preferences JSONB NOT NULL DEFAULT '{}',
     
     -- Privacy settings
     privacy_settings JSONB NOT NULL DEFAULT '{}',
     
     -- Usage statistics
     usage_stats JSONB NOT NULL DEFAULT '{}',
     
     -- Key verification hash (for multi-device)
     key_verification_hash VARCHAR(255)
   );
   
   -- Add indexes
   CREATE INDEX idx_user_profiles_updated_at ON user_profiles(updated_at);
   ```

2. **Create Multi-Device Key Transfer Component**

   ```typescript
   // components/KeyTransfer.tsx
   import React, { useState } from 'react';
   import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
   import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
   import { Button } from '@/components/ui/button';
   import { Input } from '@/components/ui/input';
   import { exportKeyForBackup, importKeyFromBackup } from '../utils/encryption';
   import QRCode from 'react-qr-code';
   
   export function KeyTransfer() {
     const [activeTab, setActiveTab] = useState('export');
     const [keyData, setKeyData] = useState('');
     const [recoveryPhrase, setRecoveryPhrase] = useState('');
     const [backupFile, setBackupFile] = useState<File | null>(null);
     const [status, setStatus] = useState('');
     
     // Generate QR code with key data
     const generateQRCode = async () => {
       try {
         setStatus('Generating key data...');
         const storedKey = localStorage.getItem('sahabai_encryption_key');
         
         if (storedKey) {
           setKeyData(storedKey);
           setStatus('Key ready for transfer via QR code');
         } else {
           setStatus('No encryption key found');
         }
       } catch (error) {
         console.error('Error generating QR code:', error);
         setStatus('Failed to generate key data');
       }
     };
     
     // Handle file backup
     const handleBackupKey = async () => {
       try {
         setStatus('Creating backup file...');
         const result = await exportKeyForBackup();
         
         if (result) {
           setStatus('Backup file created successfully');
         } else {
           setStatus('Failed to create backup file');
         }
       } catch (error) {
         console.error('Error backing up key:', error);
         setStatus('Failed to create backup file');
       }
     };
     
     // Handle file selection for import
     const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
       if (e.target.files && e.target.files.length > 0) {
         setBackupFile(e.target.files[0]);
       }
     };
     
     // Import key from file
     const handleImportKey = async () => {
       if (!backupFile) {
         setStatus('Please select a backup file');
         return;
       }
       
       try {
         setStatus('Importing key...');
         const result = await importKeyFromBackup(backupFile);
         
         if (result) {
           setStatus('Key imported successfully');
         } else {
           setStatus('Failed to import key');
         }
       } catch (error) {
         console.error('Error importing key:', error);
         setStatus('Failed to import key');
       }
     };
     
     return (
       <Card className="w-full max-w-md mx-auto">
         <CardHeader>
           <CardTitle>Profile Key Management</CardTitle>
           <CardDescription>
             Transfer your encryption key to access your private data on multiple devices
           </CardDescription>
         </CardHeader>
         <CardContent>
           <Tabs value={activeTab} onValueChange={setActiveTab}>
             <TabsList className="grid grid-cols-2 mb-4">
               <TabsTrigger value="export">Export Key</TabsTrigger>
               <TabsTrigger value="import">Import Key</TabsTrigger>
             </TabsList>
             
             <TabsContent value="export">
               <div className="space-y-4">
                 <div>
                   <h3 className="font-medium mb-2">QR Code Transfer</h3>
                   <p className="text-sm text-muted-foreground mb-2">
                     Generate a QR code to scan from another device
                   </p>
                   
                   <Button onClick={generateQRCode}>Generate QR Code</Button>
                   
                   {keyData && (
                     <div className="mt-4 flex justify-center">
                       <QRCode value={keyData} size={200} />
                     </div>
                   )}
                 </div>
                 
                 <div className="pt-4 border-t">
                   <h3 className="font-medium mb-2">File Backup</h3>
                   <p className="text-sm text-muted-foreground mb-2">
                     Create a backup file to transfer your key
                   </p>
                   
                   <Button onClick={handleBackupKey}>
                     Download Backup File
                   </Button>
                 </div>
               </div>
             </TabsContent>
             
             <TabsContent value="import">
               <div className="space-y-4">
                 <div>
                   <h3 className="font-medium mb-2">Import from File</h3>
                   <p className="text-sm text-muted-foreground mb-2">
                     Select a backup file to restore your key
                   </p>
                   
                   <Input
                     type="file"
                     onChange={handleFileChange}
                     accept=".json"
                   />
                   
                   <Button 
                     onClick={handleImportKey}
                     className="mt-2"
                     disabled={!backupFile}
                   >
                     Import Key
                   </Button>
                 </div>
                 
                 <div className="pt-4 border-t">
                   <h3 className="font-medium mb-2">QR Code Scanner</h3>
                   <p className="text-sm text-muted-foreground mb-2">
                     Scan QR code from another device
                   </p>
                   
                   {/* QR scanner component would go here */}
                   <Button>
                     Open Scanner
                   </Button>
                 </div>
               </div>
             </TabsContent>
           </Tabs>
           
           {status && (
             <div className="mt-4 p-2 bg-muted rounded text-center">
               {status}
             </div>
           )}
         </CardContent>
       </Card>
     );
   }
   ```

3. **Create Profile Synchronization Service**

   ```typescript
   // services/profileSync.ts
   import { api } from './api';
   import { getEncryptionKey, encryptData, decryptData } from '../utils/encryption';
   
   export async function syncProfileAcrossDevices() {
     try {
       // Get user ID
       const userId = getUserId();
       
       // Check if we have a local private profile
       const hasLocalProfile = !!localStorage.getItem('sahabai_encrypted_profile');
       
       // Get encryption key
       const encryptionKey = await getEncryptionKey();
       
       if (hasLocalProfile) {
         // We have local data, check for newer server data
         const serverProfile = await api.getUserProfile(userId);
         
         if (new Date(serverProfile.updatedAt) > getLocalProfileUpdatedTime()) {
           // Server has newer data, merge with local
           await mergeProfiles(serverProfile);
         } else {
           // Local data is newer, update server
           await uploadLocalProfile();
         }
       } else {
         // No local data, try to get from server
         await downloadServerProfile();
       }
       
       return true;
     } catch (error) {
       console.error('Error syncing profile:', error);
       return false;
     }
   }
   
   // Helper function to merge profiles
   async function mergeProfiles(serverProfile) {
     try {
       // Get local encrypted profile
       const localEncryptedProfile = localStorage.getItem('sahabai_encrypted_profile');
       
       if (!localEncryptedProfile) {
         // No local profile, just save server data
         await downloadServerProfile();
         return;
       }
       
       // Get encryption key
       const key = await getEncryptionKey();
       
       // Parse local profile
       const localProfileData = JSON.parse(localEncryptedProfile);
       const localIv = new Uint8Array(localProfileData.iv);
       
       // Decrypt local profile
       const decryptedLocalProfile = await decryptData(
         localProfileData.data,
         key,
         localIv
       );
       
       const localProfile = JSON.parse(decryptedLocalProfile);
       
       // Get server encrypted data
       const serverEncryptedData = await api.getEncryptedProfileData(getUserId());
       
       if (!serverEncryptedData.data) {
         // No server data, just keep local
         return;
       }
       
       // Decrypt server profile
       const serverIv = new Uint8Array(serverEncryptedData.iv);
       const decryptedServerProfile = await decryptData(
         serverEncryptedData.data,
         key,
         serverIv
       );
       
       const serverPrivateProfile = JSON.parse(decryptedServerProfile);
       
       // Merge profiles (server data takes precedence for overlapping fields)
       const mergedProfile = deepMerge(localProfile, serverPrivateProfile);
       
       // Encrypt merged profile
       const newIv = window.crypto.getRandomValues(new Uint8Array(12));
       const encryptedMergedProfile = await encryptData(
         JSON.stringify(mergedProfile),
         key,
         newIv
       );
       
       // Save locally
       localStorage.setItem(
         'sahabai_encrypted_profile',
         JSON.stringify({
           data: encryptedMergedProfile,
           iv: Array.from(newIv)
         })
       );
       
       // Update server with merged profile
       await api.updateEncryptedProfileData(getUserId(), {
         data: encryptedMergedProfile,
         iv: Array.from(newIv)
       });
     } catch (error) {
       console.error('Error merging profiles:', error);
       throw error;
     }
   }
   
   // Upload local profile to server
   async function uploadLocalProfile() {
     try {
       const localEncryptedProfile = localStorage.getItem('sahabai_encrypted_profile');
       
       if (!localEncryptedProfile) {
         return;
       }
       
       // Parse local profile
       const localProfileData = JSON.parse(localEncryptedProfile);
       
       // Upload to server
       await api.updateEncryptedProfileData(getUserId(), localProfileData);
     } catch (error) {
       console.error('Error uploading local profile:', error);
       throw error;
     }
   }
   
   // Download profile from server
   async function downloadServerProfile() {
     try {
       // Get server encrypted data
       const serverEncryptedData = await api.getEncryptedProfileData(getUserId());
       
       if (!serverEncryptedData.data) {
         return;
       }
       
       // Save locally
       localStorage.setItem(
         'sahabai_encrypted_profile',
         JSON.stringify(serverEncryptedData)
       );
     } catch (error) {
       console.error('Error downloading server profile:', error);
       throw error;
     }
   }
   
   // Get local profile updated time
   function getLocalProfileUpdatedTime() {
     try {
       const localUpdatedAt = localStorage.getItem('sahabai_profile_updated_at');
       
       if (localUpdatedAt) {
         return new Date(localUpdatedAt);
       }
       
       return new Date(0); // Epoch time if no local update time
     } catch (error) {
       console.error('Error getting local profile updated time:', error);
       return new Date(0);
     }
   }
   
   // Deep merge helper
   function deepMerge(target, source) {
     const output = { ...target };
     
     if (isObject(target) && isObject(source)) {
       Object.keys(source).forEach(key => {
         if (isObject(source[key])) {
           if (!(key in target)) {
             Object.assign(output, { [key]: source[key] });
           } else {
             output[key] = deepMerge(target[key], source[key]);
           }
         } else {
           Object.assign(output, { [key]: source[key] });
         }
       });
     }
     
     return output;
   }
   
   // Check if value is object
   function isObject(item) {
     return item && typeof item === 'object' && !Array.isArray(item);
   }
   
   // Get user ID helper
   function getUserId() {
     // Implement based on your auth system
     return localStorage.getItem('sahabai_user_id');
   }
   ```

## Technical Implementation Details

### Core Components and Integration

1. **Reflection Component with Profile Integration**

   ```typescript
   // components/NewReflection.tsx
   import React, { useState, useEffect } from 'react';
   import { Button } from '@/components/ui/button';
   import { Textarea } from '@/components/ui/textarea';
   import { LoadingAnimation } from './LoadingAnimation';
   import { useProfile } from '../hooks/useProfile';
   import { getPersonalizedResponse } from '../services/privateApiClient';
   import { ProfileLearner } from './ProfileLearner';
   
   export function NewReflection() {
     const [reflection, setReflection] = useState('');
     const [isSubmitting, setIsSubmitting] = useState(false);
     const [response, setResponse] = useState<any>(null);
     const [error, setError] = useState<string | null>(null);
     const { privateProfile, getProfileForAI } = useProfile();
     
     const handleSubmit = async () => {
       if (!reflection.trim()) return;
       
       try {
         setIsSubmitting(true);
         setError(null);
         
         // Get profile context for personalization
         const profileContext = await getProfileForAI();
         
         // Get conversation history
         const conversationHistory = getConversationHistory();
         
         // Get personalized response
         const aiResponse = await getPersonalizedResponse(
           reflection,
           profileContext,
           conversationHistory
         );
         
         // Update response state
         setResponse(aiResponse);
         
         // Add to conversation history
         addToConversationHistory(reflection, aiResponse);
         
         setIsSubmitting(false);
       } catch (err) {
         console.error('Error submitting reflection:', err);
         setError('We encountered an issue processing your reflection. Please try again.');
         setIsSubmitting(false);
       }
     };
     
     return (
       <div className="space-y-4 max-w-3xl mx-auto">
         <h1 className="text-2xl font-bold">New Reflection</h1>
         
         <Textarea
           placeholder="Share your thoughts, experiences, or spiritual reflections..."
           value={reflection}
           onChange={(e) => setReflection(e.target.value)}
           rows={8}
           className="w-full"
         />
         
         <Button 
           onClick={handleSubmit} 
           disabled={isSubmitting || !reflection.trim()}
           className="w-full"
         >
           Submit Reflection
         </Button>
         
         {isSubmitting && <LoadingAnimation />}
         
         {error && (
           <div className="p-4 bg-red-50 text-red-800 rounded-md">
             {error}
           </div>
         )}
         
         {response && (
           <div className="space-y-6 mt-8">
             <div className="p-4 bg-amber-50 rounded-md">
               <h2 className="font-semibold mb-2">Understanding</h2>
               <p>{response.understanding}</p>
             </div>
             
             <div>
               <h2 className="font-semibold mb-3">Reflection Questions</h2>
               <div className="space-y-2">
                 {response.questions.map((question, index) => (
                   <div
                     key={index}
                     className="p-3 bg-blue-50 rounded-md cursor-pointer hover:bg-blue-100 transition-colors"
                   >
                     {question}
                   </div>
                 ))}
               </div>
             </div>
             
             {/* Silent component that learns from interactions */}
             <ProfileLearner 
               userReflection={reflection}
               aiResponse={response}
             />
           </div>
         )}
       </div>
     );
   }
   
   // Helper function to get conversation history
   function getConversationHistory() {
     const history = localStorage.getItem('sahabai_conversation_history');
     return history ? JSON.parse(history) : [];
   }
   
   // Helper function to add to conversation history
   function addToConversationHistory(reflection, response) {
     const history = getConversationHistory();
     
     history.push({
       timestamp: new Date().toISOString(),
       reflection,
       response
     });
     
     // Keep only last 10 interactions for context
     const trimmedHistory = history.slice(-10);
     
     localStorage.setItem(
       'sahabai_conversation_history',
       JSON.stringify(trimmedHistory)
     );
   }
   ```

2. **Privacy Settings Component**

   ```typescript
   // components/PrivacySettings.tsx
   import React from 'react';
   import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
   import { Switch } from '@/components/ui/switch';
   import { Button } from '@/components/ui/button';
   import { Alert, AlertDescription } from '@/components/ui/alert';
   import { useProfile } from '../hooks/useProfile';
   import { exportKeyForBackup } from '../utils/encryption';
   
   export function PrivacySettings() {
     const { publicProfile, updateProfile, error } = useProfile();
     
     const handlePrivacyToggle = async (setting, value) => {
       if (!publicProfile) return;
       
       const updatedSettings = {
         ...publicProfile.privacySettings,
         [setting]: value
       };
       
       await updateProfile({
         privacySettings: updatedSettings
       });
     };
     
     const handleDataExport = async () => {
       await exportAllUserData();
     };
     
     const handleDataDeletion = async () => {
       // Show confirmation dialog first
       if (confirm('Are you sure you want to delete all your data? This cannot be undone.')) {
         await deleteAllUserData();
       }
     };
     
     return (
       <Card className="w-full max-w-3xl mx-auto">
         <CardHeader>
           <CardTitle>Privacy Settings</CardTitle>
           <CardDescription>
             Control how your data is used and stored
           </CardDescription>
         </CardHeader>
         <CardContent className="space-y-6">
           {error && (
             <Alert variant="destructive">
               <AlertDescription>{error.message}</AlertDescription>
             </Alert>
           )}
           
           <div className="space-y-4">
             <div className="flex justify-between items-center">
               <div>
                 <h3 className="font-medium">Store reflections locally only</h3>
                 <p className="text-sm text-muted-foreground">
                   Your reflections will never leave your device
                 </p>
               </div>
               <Switch 
                 checked={publicProfile?.privacySettings?.localStorageOnly || false}
                 onCheckedChange={(checked) => handlePrivacyToggle('localStorageOnly', checked)}
               />
             </div>
             
             <div className="flex justify-between items-center">
               <div>
                 <h3 className="font-medium">Personalize questions and insights</h3>
                 <p className="text-sm text-muted-foreground">
                   Allow the app to learn your interests and tailor responses
                 </p>
               </div>
               <Switch 
                 checked={publicProfile?.privacySettings?.allowPersonalization !== false}
                 onCheckedChange={(checked) => handlePrivacyToggle('allowPersonalization', checked)}
               />
             </div>
             
             <div className="flex justify-between items-center">
               <div>
                 <h3 className="font-medium">Sync across devices</h3>
                 <p className="text-sm text-muted-foreground">
                   Securely sync your encrypted profile across devices
                 </p>
               </div>
               <Switch 
                 checked={publicProfile?.privacySettings?.enableSync !== false}
                 onCheckedChange={(checked) => handlePrivacyToggle('enableSync', checked)}
               />
             </div>
           </div>
           
           <div className="pt-4 border-t">
             <h3 className="font-medium mb-3">Data Management</h3>
             
             <div className="flex space-x-3">
               <Button variant="outline" onClick={handleDataExport}>
                 Export All My Data
               </Button>
               
               <Button variant="destructive" onClick={handleDataDeletion}>
                 Delete All My Data
               </Button>
             </div>
             
             <p className="text-sm text-muted-foreground mt-2">
               Deleting your data will permanently remove all your reflections and profile information
             </p>
           </div>
           
           <div className="pt-4 border-t">
             <h3 className="font-medium mb-3">Encryption Key Management</h3>
             
             <Button variant="outline" onClick={() => exportKeyForBackup()}>
               Backup Encryption Key
             </Button>
             
             <p className="text-sm text-muted-foreground mt-2">
               Your encryption key unlocks your private data. Keep this backup secure.
             </p>
           </div>
         </CardContent>
       </Card>
     );
   }
   
   // Helper function to export all user data
   async function exportAllUserData() {
     try {
       // Get public profile
       const publicProfile = await api.getUserProfile();
       
       // Get local encrypted profile
       const encryptedProfile = localStorage.getItem('sahabai_encrypted_profile');
       
       // Get conversation history
       const conversationHistory = localStorage.getItem('sahabai_conversation_history');
       
       // Get encryption key
       const encryptionKey = localStorage.getItem('sahabai_encryption_key');
       
       // Combine all data
       const exportData = {
         publicProfile,
         encryptedProfile: encryptedProfile ? JSON.parse(encryptedProfile) : null,
         conversationHistory: conversationHistory ? JSON.parse(conversationHistory) : [],
         encryptionKey: encryptionKey ? JSON.parse(encryptionKey) : null
       };
       
       // Create download file
       const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
       const url = URL.createObjectURL(blob);
       
       // Generate download link
       const a = document.createElement('a');
       a.href = url;
       a.download = `sahabai-data-${new Date().toISOString()}.json`;
       document.body.appendChild(a);
       a.click();
       
       // Clean up
       setTimeout(() => {
         document.body.removeChild(a);
         window.URL.revokeObjectURL(url);
       }, 0);
     } catch (error) {
       console.error('Error exporting user data:', error);
       throw error;
     }
   }
   
   // Helper function to delete all user data
   async function deleteAllUserData() {
     try {
       // Delete server-side data
       await api.deleteUserProfile();
       
       // Clear local storage
       localStorage.removeItem('sahabai_encrypted_profile');
       localStorage.removeItem('sahabai_conversation_history');
       localStorage.removeItem('sahabai_profile_updated_at');
       localStorage.removeItem('sahabai_encryption_key');
       
       // Reload the page to reset the application state
       window.location.href = '/';
     } catch (error) {
       console.error('Error deleting user data:', error);
       throw error;
     }
   }
   ```

## Testing & Validation

1. **User Profile Encryption Test**

   ```typescript
   // tests/profile-encryption.test.ts
   import { 
     generateEncryptionKey, 
     encryptData, 
     decryptData 
   } from '../utils/encryption';
   
   describe('Profile Encryption', () => {
     test('Should encrypt and decrypt profile data correctly', async () => {
       // Generate test key
       const key = await generateEncryptionKey();
       
       // Test profile data
       const profileData = {
         spiritualJourneyStage: 'exploring',
         primaryGoals: ['prayer', 'quran'],
         knowledgeLevel: 'beginner',
         reflectionStyle: 'emotion-focused'
       };
       
       // Generate IV
       const iv = window.crypto.getRandomValues(new Uint8Array(12));
       
       // Encrypt data
       const encrypted = await encryptData(
         JSON.stringify(profileData),
         key,
         iv
       );
       
       // Decrypt data
       const decrypted = await decryptData(
         encrypted,
         key,
         iv
       );
       
       // Parse decrypted data
       const decryptedProfile = JSON.parse(decrypted);
       
       // Verify decrypted data matches original
       expect(decryptedProfile).toEqual(profileData);
     });
     
     test('Should fail to decrypt with wrong key', async () => {
       // Generate test keys
       const key1 = await generateEncryptionKey();
       const key2 = await generateEncryptionKey();
       
       // Test profile data
       const profileData = {
         spiritualJourneyStage: 'exploring',
         primaryGoals: ['prayer', 'quran']
       };
       
       // Generate IV
       const iv = window.crypto.getRandomValues(new Uint8Array(12));
       
       // Encrypt data with key1
       const encrypted = await encryptData(
         JSON.stringify(profileData),
         key1,
         iv
       );
       
       // Attempt to decrypt with key2 (should fail)
       await expect(
         decryptData(encrypted, key2, iv)
       ).rejects.toThrow();
     });
   });
   ```

2. **Profile Sync Test**

   ```typescript
   // tests/profile-sync.test.ts
   import { syncProfileAcrossDevices } from '../services/profileSync';
   import { api } from '../services/api';
   
   // Mock API
   jest.mock('../services/api');
   
   describe('Profile Synchronization', () => {
     beforeEach(() => {
       // Clear local storage
       localStorage.clear();
       
       // Reset mocks
       jest.resetAllMocks();
     });
     
     test('Should download server profile when no local profile exists', async () => {
       // Mock server profile
       const mockServerProfile = {
         userId: '123',
         updatedAt: new Date().toISOString(),
         generalPreferences: { inputMethod: 'text' }
       };
       
       // Mock encrypted profile data
       const mockEncryptedData = {
         data: 'encryptedDataString',
         iv: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
       };
       
       // Setup mocks
       api.getUserProfile = jest.fn().mockResolvedValue(mockServerProfile);
       api.getEncryptedProfileData = jest.fn().mockResolvedValue(mockEncryptedData);
       
       // Run sync
       await syncProfileAcrossDevices();
       
       // Check if server profile was fetched
       expect(api.getUserProfile).toHaveBeenCalled();
       expect(api.getEncryptedProfileData).toHaveBeenCalled();
       
       // Check if local storage was updated
       const storedProfile = localStorage.getItem('sahabai_encrypted_profile');
       expect(storedProfile).toBeTruthy();
       expect(JSON.parse(storedProfile)).toEqual(mockEncryptedData);
     });
     
     test('Should upload local profile when it is newer than server', async () => {
       // Mock server profile (older)
       const mockServerProfile = {
         userId: '123',
         updatedAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
         generalPreferences: { inputMethod: 'text' }
       };
       
       // Setup local profile (newer)
       const mockLocalProfile = {
         data: 'localEncryptedData',
         iv: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
       };
       
       localStorage.setItem(
         'sahabai_encrypted_profile',
         JSON.stringify(mockLocalProfile)
       );
       
       localStorage.setItem(
         'sahabai_profile_updated_at',
         new Date().toISOString() // Current time
       );
       
       // Setup mocks
       api.getUserProfile = jest.fn().mockResolvedValue(mockServerProfile);
       api.updateEncryptedProfileData = jest.fn().mockResolvedValue(true);
       
       // Run sync
       await syncProfileAcrossDevices();
       
       // Check if local profile was uploaded
       expect(api.updateEncryptedProfileData).toHaveBeenCalledWith(
         expect.any(String),
         mockLocalProfile
       );
     });
   });
   ```

---

# SahabAI Privacy Policy

## Your Spiritual Journey, Your Privacy

At SahabAI, we believe your spiritual reflections deserve the highest level of privacy and security. This policy explains how we protect your data while providing a personalized reflection experience.

## Our Privacy Commitment

**Your reflections stay private.** We've built SahabAI with privacy at its core, using advanced encryption to ensure your spiritual journey remains between you and Allah.

## What Information We Collect

### During Onboarding
* **Spiritual journey context**: Your stage of Islamic practice, goals, and knowledge comfort level
* **Personal context**: Life stage, community connection, and cultural background
* **Reflection preferences**: How you prefer to process spiritual thoughts and receive guidance
* **Technical preferences**: How often you plan to reflect and your preferred input methods

### During App Usage
* **Your reflections**: The thoughts, experiences, and spiritual moments you share
* **Interaction patterns**: Which questions you find most helpful and topics you frequently reflect on
* **Action item completion**: Which suggested actions you mark as completed

## How Your Data Is Protected

### Client-Side Encryption
All sensitive data is encrypted on your device using a unique encryption key that only you possess. This means:
* Your reflections are encrypted before leaving your device
* Your spiritual journey details are encrypted locally
* Even we cannot read your private reflections or personal profile

### Split Data Architecture
We separate your data into two parts:
* **Public profile**: Basic, non-sensitive app preferences stored on our servers
* **Private profile**: Sensitive spiritual data stored encrypted on your device

### Your Encryption Key
* Generated securely on your device
* Never transmitted to our servers
* Required to access your private data
* Can be backed up for use across multiple devices

## How We Use Your Information

### Personalization Without Privacy Loss
* AI-generated questions are personalized using your encrypted profile, accessed only on your device
* Processing happens in secure, temporary sessions
* Insights are generated based on patterns in your reflections without human review

### What We Can & Cannot See

**We can see:**
* Basic usage statistics (with your consent)
* App preferences like language and notification settings
* Whether you're actively using the app

**We cannot see:**
* The content of your reflections
* Your specific spiritual challenges
* Personal details about your faith journey

## Your Privacy Controls

### Full Control Over Your Data
* **Store locally only**: Option to keep all data on your device
* **Personalization toggle**: Control whether the app learns from your patterns
* **Export your data**: Download all your information anytime
* **Delete your data**: Permanently remove all information with one click

### Multi-Device Privacy
* Transfer your encryption key securely between devices
* Use a backup file or QR code to maintain your privacy across devices
* Your profile remains encrypted during synchronization

## Third-Party Services

### Limited Data Sharing
* **Claude AI**: Processes your reflections to generate questions and insights, but cannot store your data
* **No advertising partners**: We never sell or share your data with advertisers
* **No analytics beyond basic usage**: We don't track your behavior for marketing purposes

## Your Rights and Choices

### You Always Have:
* **Right to access**: Export all your data in a standard format
* **Right to delete**: Remove all your information permanently
* **Right to restrict**: Use privacy settings to limit data processing
* **Right to portability**: Take your data with you anytime

## Questions or Concerns?

If you have any questions about our privacy practices, please contact us at [privacy@sahabai.com](mailto:privacy@sahabai.com).

*SahabAI - Supporting your spiritual journey with privacy and care.*