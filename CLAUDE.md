# MuhasabAI Project Guide

## Project Overview
MuhasabAI is an Islamic spiritual reflection and personal development platform with:
- Reflection journaling and conversations with AI
- HalaqAI (group discussion helper)
- WirdAI (spiritual practice tracking)
- Identity Builder framework
- Personalization system

## Common Commands
- Build: `npm run build`
- Dev server: `npm run dev`
- Test: `NODE_OPTIONS=--experimental-vm-modules npm test`
- Test specific file: `NODE_OPTIONS=--experimental-vm-modules npm test -- path/to/file`
- Coverage: `NODE_OPTIONS=--experimental-vm-modules npm run test:coverage`

## Codebase Structure
- **client/**: React frontend
  - **src/components/**: UI components
  - **src/hooks/**: Custom React hooks
  - **src/lib/**: Utility functions
  - **src/services/**: API client services
  - **src/pages/**: Route components
- **server/**: Express backend
  - **routes/**: API endpoints
  - **lib/**: Server utilities
  - **db/**: Database operations

## Completed Restructuring
1. **Consolidated AudioRecorder components:**
   - Created a unified component in `/components/audio-recorder/index.tsx`
   - Added a variant prop to support both simple and advanced use cases
   - Consistent interface that works with both TranscriptionContainer and ReflectionInput

2. **Consolidated personalization hooks:**
   - Merged `usePersonalization.ts` and `usePersonalization.tsx` 
   - Kept the context-based implementation with added functionality from the utility version
   - Cleaned up debug console logs

3. **Consolidated wird services:**
   - Merged `wird-service.ts` and `wirdService.ts` into a single comprehensive service
   - Added proper TypeScript interfaces for all data models
   - Maintained consistent naming and error handling patterns

## Known Issues
- Inconsistent naming conventions (kebab-case vs camelCase)
- Test suite setup issues that need resolution 

## Restructuring Plan (Ongoing)
1. **Standardize naming:** Consistent kebab-case for files, PascalCase for components
2. **Improve API service organization:** Consistent patterns for API clients
3. **Clean up unused code:** Remove deprecated implementations

## Resolved Issues
- Fixed Jest config to work with ES modules
- Fixed test setup to properly import Jest globals
- Consolidated duplicate AudioRecorder components
- Consolidated duplicate personalization hooks
- Consolidated duplicate wird services

*This file will be updated as we learn more about the codebase.*