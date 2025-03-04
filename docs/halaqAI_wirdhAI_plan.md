# Implementation Plan for HalaqAI and WirdhAI Features

## Overview

This document outlines the detailed implementation plan for the two remaining features of Sahab AI: HalaqAI and WirdhAI. For each feature, we'll cover the following aspects:

1. Database schema design
2. Backend API endpoints
3. Frontend components
4. AI prompt engineering
5. Integration with existing systems
6. Testing strategy
7. Deployment approach

## 1. HalaqAI Implementation

### 1.1. Database Schema Design

Create the following collections/tables:

```javascript
// halaqas collection
{
  id: String,                 // Unique identifier
  userId: String,             // Reference to user
  title: String,              // Title of the halaqa/lecture
  speaker: String,            // Name of the speaker (optional)
  date: Date,                 // Date when user attended
  topic: String,              // Main topic
  keyReflection: String,      // User's primary reflection
  impact: String,             // How it impacted the user
  actionItems: [              // Generated and user-modified action items
    {
      id: String,
      description: String,
      completed: Boolean,
      completedDate: Date
    }
  ],
  createdAt: Date,
  updatedAt: Date,
  isArchived: Boolean
}
```

### 1.2. Backend API Endpoints

Create the following RESTful endpoints:

```
POST /api/halaqas
- Creates a new halaqa entry
- Requires authentication
- Accepts: title, speaker, date, topic, keyReflection, impact

GET /api/halaqas
- Returns all halaqas for the authenticated user
- Supports pagination, filtering, and sorting

GET /api/halaqas/:id
- Returns a specific halaqa by ID

PUT /api/halaqas/:id
- Updates an existing halaqa entry

DELETE /api/halaqas/:id
- Archives a halaqa (soft delete)

POST /api/halaqas/:id/generate-actions
- Uses AI to generate action items based on the reflection
- Returns suggested action items

POST /api/halaqas/:id/action-items
- Adds a new action item to the halaqa

PUT /api/halaqas/:id/action-items/:itemId
- Updates an action item (e.g., marks as complete)

DELETE /api/halaqas/:id/action-items/:itemId
- Removes an action item
```

### 1.3. Frontend Components

#### 1.3.1. HalaqAI Entry Form Page

Create a multi-step form with the following components:

1. **BasicHalaqaInfo**
   - Input fields for title, speaker, date, topic
   - Next button

2. **ReflectionInputs**
   - Textarea for key reflection (with character counter)
   - Textarea for impact
   - Back and Next buttons

3. **ActionItemsGenerator**
   - Display generated action items
   - Allow editing/adding/removing action items
   - Save button

4. **ConfirmationScreen**
   - Summary of entered information
   - Edit buttons for each section
   - Submit button

#### 1.3.2. HalaqAI Dashboard

Create a dashboard that displays:

1. **HalaqaList**
   - Card-based list of halaqas
   - Sort by date (newest first)
   - Search/filter functionality
   - Quick view of completion status of action items

2. **HalaqaDetailView**
   - Shows full details of a halaqa
   - Allows editing
   - Shows action items with checkboxes to mark complete
   - Option to add more action items
   - Delete/archive button

### 1.4. AI Prompt Engineering

For generating action items, design a structured prompt:

```
You are HalaqAI, a feature of Sahab AI designed to help Muslims extract actionable insights from Islamic lectures.

The user attended a lecture with the following details:
- Title: {{title}}
- Speaker: {{speaker}}
- Topic: {{topic}}
- User's Key Reflection: {{keyReflection}}
- How it impacted them: {{impact}}

Based on this information, generate 3-5 specific, actionable items that the user could implement in their daily life. These should be:
1. Concrete and specific
2. Measurable when possible
3. Aligned with Islamic principles
4. Realistic for daily implementation
5. Varied in scope (immediate actions, medium-term habits, and long-term practices)

Do not include any controversial religious opinions or rulings. Focus on virtuous actions that align with broadly accepted Islamic principles.

Format each action item as a concise, imperative statement.
```

### 1.5. Integration with Existing Systems

1. Update the main navigation to include HalaqAI
2. Integrate with the notification system for action item reminders
3. Connect to the existing authentication system
4. Ensure client-side encryption works with the new data

### 1.6. Testing Strategy

1. **Unit Tests**
   - Test all API endpoints
   - Test data validation
   - Test AI prompt handling

2. **Integration Tests**
   - Test the form submission flow
   - Test action item generation
   - Test authentication integration

3. **User Acceptance Testing**
   - Define test scenarios for common user flows
   - Recruit 3-5 beta testers
   - Collect feedback and iterate

### 1.7. Deployment Approach

1. Deploy backend changes first
2. Deploy frontend components behind a feature flag
3. Enable for internal testers
4. Roll out to 10% of users
5. Monitor performance and errors
6. Roll out to all users

## 2. WirdhAI Implementation

### 2.1. Database Schema Design

Create the following collections/tables:

```javascript
// goals collection
{
  id: String,                // Unique identifier
  userId: String,            // Reference to user
  title: String,             // Goal title
  description: String,       // Detailed description
  identity: String,          // Identity statement ("I am a person who...")
  category: String,          // E.g., "Spiritual", "Knowledge", "Health", etc.
  startDate: Date,
  targetDate: Date,          // For time-bound goals
  isOngoing: Boolean,        // For continuous habits
  isCompleted: Boolean,
  completedDate: Date,
  isArchived: Boolean,
  createdAt: Date,
  updatedAt: Date
}

// habits collection (connected to goals)
{
  id: String,
  goalId: String,            // Reference to parent goal
  userId: String,
  title: String,
  description: String,
  
  // CLEAR model fields
  clear_cue: String,         // What triggers this habit
  clear_limitation: String,  // Potential obstacles
  clear_execution: String,   // How exactly to perform it
  clear_accountability: String, // How to track/be accountable
  clear_reward: String,      // Reward for completion
  
  frequency: {
    type: String,            // "daily", "weekly", "custom"
    daysOfWeek: [Number],    // For weekly: 0=Sunday, 6=Saturday
    timesPerDay: Number,     // For daily
    customPattern: String    // For custom frequency
  },
  
  reminder: {
    enabled: Boolean,
    time: String,            // "HH:MM" format
    timezone: String
  },
  
  streak: {
    current: Number,
    longest: Number,
    lastCompleted: Date
  },
  
  createdAt: Date,
  updatedAt: Date,
  isArchived: Boolean
}

// habit_logs collection
{
  id: String,
  habitId: String,           // Reference to habit
  userId: String,
  date: Date,                // Date of completion
  isCompleted: Boolean,
  notes: String,             // Optional reflection
  createdAt: Date,
  updatedAt: Date
}

// challenges collection (for 30-day challenges)
{
  id: String,
  userId: String,
  title: String,
  description: String,
  startDate: Date,
  endDate: Date,
  habits: [String],          // Array of habit IDs
  isActive: Boolean,
  isCompleted: Boolean,
  completedDate: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### 2.2. Backend API Endpoints

Create the following RESTful endpoints:

```
// Goals endpoints
POST /api/goals
GET /api/goals
GET /api/goals/:id
PUT /api/goals/:id
DELETE /api/goals/:id

// Habits endpoints
POST /api/habits
GET /api/habits
GET /api/habits/:id
PUT /api/habits/:id
DELETE /api/habits/:id
GET /api/habits/by-goal/:goalId

// Habit logs endpoints
POST /api/habit-logs
GET /api/habit-logs/by-habit/:habitId
GET /api/habit-logs/by-date-range
PUT /api/habit-logs/:id

// Challenges endpoints
POST /api/challenges
GET /api/challenges
GET /api/challenges/:id
PUT /api/challenges/:id
DELETE /api/challenges/:id
GET /api/challenges/active

// AI generation endpoints
POST /api/wird/generate-goal-suggestions
POST /api/wird/generate-habit-suggestions
POST /api/wird/generate-clear-model
```

### 2.3. Frontend Components

#### 2.3.1. Goal Creation Flow

1. **GoalTypeSelector**
   - Choose between spiritual goals, knowledge goals, etc.
   - Select if it's a one-time goal or ongoing habit

2. **GoalDetailsForm**
   - Input fields for title, description
   - Date selectors for start/target dates
   - Identity statement formulation help

3. **HabitCreationForm** (if goal requires habits)
   - Title and description
   - Frequency selection
   - CLEAR model inputs with guidance
   - Reminder settings

4. **ChallengeCreator**
   - Option to start as a 30-day challenge
   - Challenge customization

#### 2.3.2. WirdhAI Dashboard

1. **GoalSummary**
   - Overview of active goals
   - Progress indicators
   - Quick action buttons

2. **DailyHabits**
   - List of today's habits
   - Check-in functionality
   - Streak indicators

3. **ProgressGraphs**
   - Visualization of habit completion
   - Streak calendars
   - Achievement badges

4. **ChallengeTracker**
   - Active challenges
   - Countdown displays
   - Progress indicators

### 2.4. AI Prompt Engineering

For goal suggestion:

```
You are WirdhAI, a feature of Sahab AI designed to help Muslims create meaningful spiritual goals and habits.

Based on the user's profile:
- Knowledge level: {{knowledgeLevel}}
- Areas of interest: {{interestsArray}}
- Life stage: {{lifeStage}}
- Current challenges: {{challengesArray}}

Suggest 3-5 potential spiritual goals that would be appropriate for this user. For each goal:
1. Provide a clear title
2. Write a brief description
3. Suggest an identity statement that reinforces this goal (e.g., "I am a person who prioritizes Quran in my daily routine")
4. Suggest 1-2 specific habits that would support this goal
5. Explain how this goal aligns with Islamic principles of growth

Avoid suggesting goals related to controversial religious matters. Focus on virtuous practices with broad acceptance in the Muslim community.
```

For CLEAR model generation:

```
You are helping create a CLEAR model for a new habit in WirdhAI.

The user is trying to establish the following habit:
- Habit title: {{habitTitle}}
- Related to goal: {{goalTitle}}
- Description: {{habitDescription}}
- Frequency: {{frequency}}

Please generate a CLEAR model to help them successfully implement this habit:

C - Cue: What specific trigger or reminder would help initiate this habit?
L - Limitation: What potential obstacles might prevent this habit and how to overcome them?
E - Execution: What are the exact steps to perform this habit correctly?
A - Accountability: How can the user track progress and stay accountable?
R - Reward: What is a meaningful reward that reinforces this habit?

Ensure all suggestions are practical, aligned with Islamic principles, and appropriate for the user's life context.
```

### 2.5. Integration with Existing Systems

1. Update the main navigation to include WirdhAI
2. Integrate with notification system for habit reminders
3. Integrate with calendar systems for habit scheduling
4. Connect to the existing authentication system
5. Ensure client-side encryption works with the new data

### 2.6. Testing Strategy

1. **Unit Tests**
   - Test all API endpoints
   - Test streak calculation logic
   - Test reminder functionality
   - Test CLEAR model generation

2. **Integration Tests**
   - Test the goal creation flow
   - Test habit logging functionality
   - Test challenge creation and tracking
   - Test data visualization components

3. **User Acceptance Testing**
   - Define test scenarios for daily habit tracking
   - Test the 30-day challenge functionality
   - Recruit 5-7 beta testers
   - Collect feedback and iterate

### 2.7. Deployment Approach

1. Deploy database changes first
2. Deploy backend API endpoints
3. Deploy frontend components behind a feature flag
4. Enable for internal testers for 1 week
5. Fix issues and refine based on feedback
6. Roll out to 20% of users
7. Monitor system performance and stability
8. Gradually increase to all users over a 2-week period

## 3. Implementation Timeline

### Phase 1: Planning and Design (2 weeks)
- Complete database schema design
- Create wireframes and UI designs
- Finalize AI prompt designs
- Technical specification documents

### Phase 2: HalaqAI Development (4 weeks)
- Week 1-2: Backend development
- Week 2-3: Frontend development
- Week 3-4: AI integration and testing

### Phase 3: WirdhAI Development (6 weeks)
- Week 1-2: Database and core API development
- Week 2-4: Habit tracking system and goal management
- Week 4-5: Challenge system and progress visualization
- Week 5-6: AI integration and testing

### Phase 4: Integration and Testing (2 weeks)
- System integration
- User acceptance testing
- Performance optimization
- Bug fixes

### Phase 5: Deployment (2 weeks)
- Staged rollout of HalaqAI
- Monitoring and fixes
- Staged rollout of WirdhAI
- Final adjustments

## 4. Technical Considerations

### 4.1. Performance Considerations
- Implement efficient querying for habit logs (they will grow rapidly)
- Consider batch processing for notifications
- Optimize AI request frequency to manage costs

### 4.2. Security Considerations
- Ensure all user data is encrypted client-side
- Implement proper authentication for all API endpoints
- Consider rate limiting to prevent abuse

### 4.3. Scalability Considerations
- Design the habit logging system to handle high write volume
- Design the notification system to handle concurrent processing
- Optimize dashboard queries for performance as data grows

## 5. Documentation Requirements

### 5.1. Developer Documentation
- API endpoint documentation
- Database schema documentation
- Frontend component documentation
- Testing procedures

### 5.2. User Documentation
- How to use HalaqAI guide
- How to use WirdhAI guide
- FAQ for common issues
- Best practices for effective goal setting

## Conclusion

This implementation plan provides a comprehensive roadmap for developing the HalaqAI and WirdhAI features of Sahab AI. By following this structured approach, developers can ensure a systematic and effective implementation that meets the application's goals of supporting Muslim users in their spiritual growth journey.