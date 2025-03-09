Submitting standard text reflection
reflectionService.ts:169 useReflectionService.submitReflection called with content: testihng this out now...
reflectionService.ts:237 About to call reflectionService.submitReflection with personalization: false
reflectionService.ts:48 Submitting reflection with personalization: false
reflectionService.ts:67 🔴🔴🔴 Using API URL without query parameters: http://localhost:3000/api/reflection
reflectionService.ts:114 SENDING REQUEST BODY: {
  "content": "testihng this out now",
  "type": "text"
}
reflectionService.ts:115 SENDING REQUEST URL: http://localhost:3000/api/reflection
reflectionService.ts:116 SENDING REQUEST HEADERS: {Content-Type: 'application/json', Authorization: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2…A2NX0.uAejrT9j-Y9JNdqEFE-Z9p9KW3VwlKiLdalNmYhJ368'}
reflectionService.ts:119 


reflectionService.ts:120 🔴🔴🔴 CLIENT SENDING REQUEST TO URL 🔴🔴🔴
reflectionService.ts:121 🔴🔴🔴 FULL API URL: http://localhost:3000/api/reflection
reflectionService.ts:122 🔴🔴🔴 REQUEST CONTAINS NO QUERY PARAMETERS
reflectionService.ts:123 


reflectionService.ts:246 reflectionService.submitReflection returned result: success
ReflectionInput.tsx:62 API response: {reflection: {…}, conversation: {…}, understanding: "I notice you're testing this reflection system. Th…ions related to Islam that might be on your mind.", questions: Array(3)}
new.tsx:17 Reflection complete: {reflection: {…}, conversation: {…}, understanding: "I notice you're testing this reflection system. Th…ions related to Islam that might be on your mind.", questions: Array(3)}
new.tsx:20 API response top-level keys: (4) ['reflection', 'conversation', 'understanding', 'questions']
new.tsx:23 Understanding is present at top level: true
new.tsx:24 Questions are present at top level: true
new.tsx:27 Top-level understanding preview: I notice you're testing this reflection system. Th...
new.tsx:31 Top-level questions count: 3
new.tsx:33 First question: What aspects of your spiritual or religious life would you most like to reflect upon or explore through our conversations?
new.tsx:70 Direct from API response - understanding: I notice you're testing this reflection system. Th...
new.tsx:71 Direct from API response - questions: (3) ['What aspects of your spiritual or religious life w…eflect upon or explore through our conversations?', "Is there a particular Islamic concept, practice, o…ut lately that you'd like to discuss more deeply?", "How do you currently connect with your faith in yo…ou feel you'd like to strengthen that connection?"]
new.tsx:85 Saving reflection data to localStorage: {id: 2, reflectionId: 2, original: 'testihng this out now', understanding: "I notice you're testing this reflection system. Th…ions related to Islam that might be on your mind.", questions: Array(3), …}
new.tsx:87 Understanding: I notice you're testing this reflection system. Th...
new.tsx:88 Questions: (3) ['What aspects of your spiritual or religious life w…eflect upon or explore through our conversations?', "Is there a particular Islamic concept, practice, o…ut lately that you'd like to discuss more deeply?", "How do you currently connect with your faith in yo…ou feel you'd like to strengthen that connection?"]
new.tsx:93 Navigating to chat page: /chat/2
RequireAuth.tsx:33 [RequireAuth Debug] Render decision: {isAuthenticated: true}
RequireAuth.tsx:33 [RequireAuth Debug] Render decision: {isAuthenticated: true}
chat.tsx:46 [Chat Debug] Loading reflection data for ID: 2
chat.tsx:54 [Chat Debug] Loaded session data: {id: 2, reflectionId: 2, original: 'testihng this out now', understanding: "I notice you're testing this reflection system. Th…ions related to Islam that might be on your mind.", questions: Array(3), …}
chat.tsx:73 [Chat Debug] Converted to 2 messages
RequireAuth.tsx:22 [RequireAuth Debug] Auth state: {isAuthenticated: true, isLoading: false}
chat.tsx:46 [Chat Debug] Loading reflection data for ID: 2
chat.tsx:54 [Chat Debug] Loaded session data: {id: 2, reflectionId: 2, original: 'testihng this out now', understanding: "I notice you're testing this reflection system. Th…ions related to Islam that might be on your mind.", questions: Array(3), …}
chat.tsx:73 [Chat Debug] Converted to 2 messages
ConversationView.tsx:356 [ConversationView Debug] State update: {messagesLength: 2, questionsLength: 3, showQuestions: false, isSubmitting: false}
ConversationView.tsx:386 [ConversationView Debug] Conversation changed: 2
chat.tsx:591 [Chat Debug] Animation starting
ConversationView.tsx:356 [ConversationView Debug] State update: {messagesLength: 2, questionsLength: 3, showQuestions: false, isSubmitting: false}
ConversationView.tsx:386 [ConversationView Debug] Conversation changed: 2
chat.tsx:591 [Chat Debug] Animation starting
ConversationView.tsx:366 [ConversationView Debug] Message animation completed: 2-0
ConversationView.tsx:366 [ConversationView Debug] Message animation completed: 2-1
ConversationView.tsx:376 [ConversationView Debug] All messages animated, showing questions
chat.tsx:595 [Chat Debug] Animation completed
ConversationView.tsx:98 [DEBUG] FollowUpQuestions component received props: {questionsCount: 3, isVisible: true, firstQuestionPreview: 'What aspects of your spiritual...'}
ConversationView.tsx:110 [DEBUG] FollowUpQuestions is visible, rendering buttons
ConversationView.tsx:98 [DEBUG] FollowUpQuestions component received props: {questionsCount: 3, isVisible: true, firstQuestionPreview: 'What aspects of your spiritual...'}
ConversationView.tsx:110 [DEBUG] FollowUpQuestions is visible, rendering buttons
ConversationView.tsx:366 [ConversationView Debug] Message animation completed: 2-0
ConversationView.tsx:376 [ConversationView Debug] All messages animated, showing questions
chat.tsx:595 [Chat Debug] Animation completed
ConversationView.tsx:366 [ConversationView Debug] Message animation completed: 2-1
ConversationView.tsx:376 [ConversationView Debug] All messages animated, showing questions
chat.tsx:595 [Chat Debug] Animation completed
ConversationView.tsx:356 [ConversationView Debug] State update: {messagesLength: 2, questionsLength: 3, showQuestions: true, isSubmitting: false}
Grammarly.js:2 grm ERROR [iterable] ░░ Not supported: in app messages from Iterable
write @ Grammarly.js:2
handleEvent @ Grammarly.js:2
_logMessage @ Grammarly.js:2
error @ Grammarly.js:2
error @ Grammarly.js:2
onTrigger @ Grammarly.js:2
(anonymous) @ Grammarly.js:2
t.__tryOrUnsub @ Grammarly.js:2
t.next @ Grammarly.js:2
t._next @ Grammarly.js:2
t.next @ Grammarly.js:2
l @ Grammarly.js:2
t._execute @ Grammarly.js:2
t.execute @ Grammarly.js:2
t.flush @ Grammarly.js:2
setInterval
t.requestAsyncId @ Grammarly.js:2
t.schedule @ Grammarly.js:2
e.schedule @ Grammarly.js:2
t.schedule @ Grammarly.js:2
(anonymous) @ Grammarly.js:2
e._trySubscribe @ Grammarly.js:2
e.subscribe @ Grammarly.js:2
(anonymous) @ Grammarly.js:2
t.__tryOrUnsub @ Grammarly.js:2
t.next @ Grammarly.js:2
t._next @ Grammarly.js:2
t.next @ Grammarly.js:2
t.next @ Grammarly.js:2
t.next @ Grammarly.js:2
set @ Grammarly.js:2
(anonymous) @ Grammarly.js:2
t.__tryOrUnsub @ Grammarly.js:2
t.next @ Grammarly.js:2
t._next @ Grammarly.js:2
t.next @ Grammarly.js:2
t._next @ Grammarly.js:2
t.next @ Grammarly.js:2
t.next @ Grammarly.js:2
(anonymous) @ Grammarly.js:2
t.__tryOrUnsub @ Grammarly.js:2
t.next @ Grammarly.js:2
t._next @ Grammarly.js:2
t.next @ Grammarly.js:2
t.notifyNext @ Grammarly.js:2
t._next @ Grammarly.js:2
t.next @ Grammarly.js:2
_processObservableMessage @ Grammarly.js:2
(anonymous) @ Grammarly.js:2
t.__tryOrUnsub @ Grammarly.js:2
t.next @ Grammarly.js:2
t._next @ Grammarly.js:2
t.next @ Grammarly.js:2
t._next @ Grammarly.js:2
t.next @ Grammarly.js:2
t @ Grammarly.js:2
(anonymous) @ Grammarly.js:2
(anonymous) @ Grammarly.js:2
Ii.fire @ Grammarly.js:2
Ti._onBgPortMessage @ Grammarly.js:2Understand this errorAI
ConversationView.tsx:142 [DEBUG] FollowUpQuestions memoization - shouldUpdate: false
9ConversationView.tsx:142 [DEBUG] FollowUpQuestions memoization - shouldUpdate: false
ConversationView.tsx:142 [DEBUG] FollowUpQuestions memoization - shouldUpdate: false
9ConversationView.tsx:142 [DEBUG] FollowUpQuestions memoization - shouldUpdate: false
chat.tsx:209 Updating messages: (3) [{…}, {…}, {…}]
chat.tsx:201 Saved session to localStorage
ConversationView.tsx:356 [ConversationView Debug] State update: {messagesLength: 3, questionsLength: 3, showQuestions: false, isSubmitting: false}
ConversationView.tsx:386 [ConversationView Debug] Conversation changed: 2
chat.tsx:591 [Chat Debug] Animation starting
ConversationView.tsx:366 [ConversationView Debug] Message animation completed: 2-2
ConversationView.tsx:366 [ConversationView Debug] Message animation completed: 2-2
ConversationView.tsx:366 [ConversationView Debug] Message animation completed: 2-0
ConversationView.tsx:366 [ConversationView Debug] Message animation completed: 2-1
ConversationView.tsx:376 [ConversationView Debug] All messages animated, showing questions
chat.tsx:595 [Chat Debug] Animation completed
ConversationView.tsx:98 [DEBUG] FollowUpQuestions component received props: {questionsCount: 3, isVisible: true, firstQuestionPreview: 'What aspects of your spiritual...'}
ConversationView.tsx:110 [DEBUG] FollowUpQuestions is visible, rendering buttons
ConversationView.tsx:98 [DEBUG] FollowUpQuestions component received props: {questionsCount: 3, isVisible: true, firstQuestionPreview: 'What aspects of your spiritual...'}
ConversationView.tsx:110 [DEBUG] FollowUpQuestions is visible, rendering buttons
ConversationView.tsx:366 [ConversationView Debug] Message animation completed: 2-0
ConversationView.tsx:376 [ConversationView Debug] All messages animated, showing questions
chat.tsx:595 [Chat Debug] Animation completed
ConversationView.tsx:366 [ConversationView Debug] Message animation completed: 2-1
ConversationView.tsx:376 [ConversationView Debug] All messages animated, showing questions
chat.tsx:595 [Chat Debug] Animation completed
ConversationView.tsx:356 [ConversationView Debug] State update: {messagesLength: 3, questionsLength: 3, showQuestions: true, isSubmitting: false}