API Base URL configured as: https://sahabai-production.up.railway.app
index--M5T9rj1.js:363 [Auth Debug] Starting auth status check
index--M5T9rj1.js:363 [Auth Debug] Token found in storage: false
index--M5T9rj1.js:363 [Auth Debug] No auth token found, clearing auth state
index--M5T9rj1.js:410 Auth storage monitor activated
index--M5T9rj1.js:410 Current auth token: No token found
index--M5T9rj1.js:570 App initialized with token: No token
index--M5T9rj1.js:410 
            
            
           GET https://www.sahabai.dev/auth/validate 401 (Unauthorized)
YN @ index--M5T9rj1.js:410
(anonymous) @ index--M5T9rj1.js:570
pg @ index--M5T9rj1.js:40
_c @ index--M5T9rj1.js:40
YC @ index--M5T9rj1.js:40
ya @ index--M5T9rj1.js:38
B5 @ index--M5T9rj1.js:40
Oa @ index--M5T9rj1.js:40
I2 @ index--M5T9rj1.js:40
j @ index--M5T9rj1.js:25
T @ index--M5T9rj1.js:25Understand this errorAI
index--M5T9rj1.js:410 Token validation status: 401 
index--M5T9rj1.js:410 Token validation response: {success: false, message: 'No token provided'}
www.sahabai.dev/:1 <meta name="apple-mobile-web-app-capable" content="yes"> is deprecated. Please include <meta name="mobile-web-app-capable" content="yes">Understand this warningAI
www.sahabai.dev/:1 Error while trying to use the following icon from the Manifest: https://www.sahabai.dev/icon-192.png (Download error or resource isn't a valid image)Understand this errorAI
index--M5T9rj1.js:410 Setting auth_token in localStorage: eyJhbGciOi...
index--M5T9rj1.js:410 Token set at:
localStorage.setItem @ index--M5T9rj1.js:410
(anonymous) @ index--M5T9rj1.js:363
await in (anonymous)
j @ index--M5T9rj1.js:435
i$ @ index--M5T9rj1.js:37
l$ @ index--M5T9rj1.js:37
c$ @ index--M5T9rj1.js:37
vC @ index--M5T9rj1.js:37
$T @ index--M5T9rj1.js:37
(anonymous) @ index--M5T9rj1.js:37
Y0 @ index--M5T9rj1.js:40
cT @ index--M5T9rj1.js:37
kv @ index--M5T9rj1.js:37
j0 @ index--M5T9rj1.js:37
N$ @ index--M5T9rj1.js:37
index--M5T9rj1.js:363 Creating profile after registration...
index--M5T9rj1.js:363 Ensuring user profile exists for: 1b156fc5-994c-4b4c-a8f1-65a9ce6ffe06
index--M5T9rj1.js:363 Checking if profile already exists...
index--M5T9rj1.js:363 
            
            
           GET https://sahabai-production.up.railway.app/api/profile 404 (Not Found)
getUserProfile @ index--M5T9rj1.js:363
c @ index--M5T9rj1.js:363
(anonymous) @ index--M5T9rj1.js:363
await in (anonymous)
j @ index--M5T9rj1.js:435
i$ @ index--M5T9rj1.js:37
l$ @ index--M5T9rj1.js:37
c$ @ index--M5T9rj1.js:37
vC @ index--M5T9rj1.js:37
$T @ index--M5T9rj1.js:37
(anonymous) @ index--M5T9rj1.js:37
Y0 @ index--M5T9rj1.js:40
cT @ index--M5T9rj1.js:37
kv @ index--M5T9rj1.js:37
j0 @ index--M5T9rj1.js:37
N$ @ index--M5T9rj1.js:37Understand this errorAI
index--M5T9rj1.js:363 Profile not found
index--M5T9rj1.js:363 Profile not found, creating new one...
index--M5T9rj1.js:363 Creating profile directly for user: 1b156fc5-994c-4b4c-a8f1-65a9ce6ffe06
index--M5T9rj1.js:363 Sending direct profile creation request with data: {userId: '1b156fc5-994c-4b4c-a8f1-65a9ce6ffe06', generalPreferences: {…}, privacySettings: {…}}
index--M5T9rj1.js:363 [API] Creating or updating user profile with data: {userId: '1b156fc5-994c-4b4c-a8f1-65a9ce6ffe06', generalPreferences: {…}, privacySettings: {…}}
index--M5T9rj1.js:363 [API] Trying new /api/profile/create endpoint
index--M5T9rj1.js:363 
            
            
           GET https://sahabai-production.up.railway.app/api/profile 404 (Not Found)
getUserProfile @ index--M5T9rj1.js:363
h @ index--M5T9rj1.js:363
(anonymous) @ index--M5T9rj1.js:363
pg @ index--M5T9rj1.js:40
_c @ index--M5T9rj1.js:40
YC @ index--M5T9rj1.js:40
ya @ index--M5T9rj1.js:38
B5 @ index--M5T9rj1.js:40
Oa @ index--M5T9rj1.js:40
I2 @ index--M5T9rj1.js:40
j @ index--M5T9rj1.js:25
T @ index--M5T9rj1.js:25Understand this errorAI
index--M5T9rj1.js:363 Profile not found
index--M5T9rj1.js:363 Error loading public profile: Error: Profile not found
    at Object.getUserProfile (index--M5T9rj1.js:363:28229)
    at async h (index--M5T9rj1.js:363:33243)
h @ index--M5T9rj1.js:363
await in h
(anonymous) @ index--M5T9rj1.js:363
pg @ index--M5T9rj1.js:40
_c @ index--M5T9rj1.js:40
YC @ index--M5T9rj1.js:40
ya @ index--M5T9rj1.js:38
B5 @ index--M5T9rj1.js:40
Oa @ index--M5T9rj1.js:40
I2 @ index--M5T9rj1.js:40
j @ index--M5T9rj1.js:25
T @ index--M5T9rj1.js:25Understand this errorAI
index--M5T9rj1.js:363 Previous profile initialization failed: Error: Profile not found
    at Object.getUserProfile (index--M5T9rj1.js:363:28229)
    at async h (index--M5T9rj1.js:363:33243)
h @ index--M5T9rj1.js:363
await in h
(anonymous) @ index--M5T9rj1.js:363
pg @ index--M5T9rj1.js:40
_c @ index--M5T9rj1.js:40
YC @ index--M5T9rj1.js:40
ya @ index--M5T9rj1.js:38
B5 @ index--M5T9rj1.js:40
Oa @ index--M5T9rj1.js:40
I2 @ index--M5T9rj1.js:40
j @ index--M5T9rj1.js:25
T @ index--M5T9rj1.js:25Understand this errorAI
index--M5T9rj1.js:363 
            
            
           GET https://sahabai-production.up.railway.app/api/profile 404 (Not Found)
getUserProfile @ index--M5T9rj1.js:363
h @ index--M5T9rj1.js:363
await in h
(anonymous) @ index--M5T9rj1.js:363
pg @ index--M5T9rj1.js:40
_c @ index--M5T9rj1.js:40
YC @ index--M5T9rj1.js:40
ya @ index--M5T9rj1.js:38
B5 @ index--M5T9rj1.js:40
Oa @ index--M5T9rj1.js:40
I2 @ index--M5T9rj1.js:40
j @ index--M5T9rj1.js:25
T @ index--M5T9rj1.js:25Understand this errorAI
index--M5T9rj1.js:363 Profile not found
index--M5T9rj1.js:363 Error loading public profile: Error: Profile not found
    at Object.getUserProfile (index--M5T9rj1.js:363:28229)
    at async h (index--M5T9rj1.js:363:33243)
h @ index--M5T9rj1.js:363
await in h
(anonymous) @ index--M5T9rj1.js:363
pg @ index--M5T9rj1.js:40
_c @ index--M5T9rj1.js:40
YC @ index--M5T9rj1.js:40
ya @ index--M5T9rj1.js:38
B5 @ index--M5T9rj1.js:40
Oa @ index--M5T9rj1.js:40
I2 @ index--M5T9rj1.js:40
j @ index--M5T9rj1.js:25
T @ index--M5T9rj1.js:25Understand this errorAI
index--M5T9rj1.js:363 Uncaught (in promise) Error: Profile not found
    at Object.getUserProfile (index--M5T9rj1.js:363:28229)
    at async h (index--M5T9rj1.js:363:33243)
getUserProfile @ index--M5T9rj1.js:363
await in getUserProfile
h @ index--M5T9rj1.js:363
await in h
(anonymous) @ index--M5T9rj1.js:363
pg @ index--M5T9rj1.js:40
_c @ index--M5T9rj1.js:40
YC @ index--M5T9rj1.js:40
ya @ index--M5T9rj1.js:38
B5 @ index--M5T9rj1.js:40
Oa @ index--M5T9rj1.js:40
I2 @ index--M5T9rj1.js:40
j @ index--M5T9rj1.js:25
T @ index--M5T9rj1.js:25Understand this errorAI
index--M5T9rj1.js:363 
            
            
           POST https://sahabai-production.up.railway.app/api/profile/create 401 (Unauthorized)
createOrUpdateUserProfile @ index--M5T9rj1.js:363
c @ index--M5T9rj1.js:363
await in c
(anonymous) @ index--M5T9rj1.js:363
await in (anonymous)
j @ index--M5T9rj1.js:435
i$ @ index--M5T9rj1.js:37
l$ @ index--M5T9rj1.js:37
c$ @ index--M5T9rj1.js:37
vC @ index--M5T9rj1.js:37
$T @ index--M5T9rj1.js:37
(anonymous) @ index--M5T9rj1.js:37
Y0 @ index--M5T9rj1.js:40
cT @ index--M5T9rj1.js:37
kv @ index--M5T9rj1.js:37
j0 @ index--M5T9rj1.js:37
N$ @ index--M5T9rj1.js:37Understand this errorAI
index--M5T9rj1.js:363 [API] New endpoint failed with status: 401
index--M5T9rj1.js:363 [API] Falling back to /api/profile endpoint
index--M5T9rj1.js:363 
            
            
           POST https://sahabai-production.up.railway.app/api/profile 401 (Unauthorized)
createOrUpdateUserProfile @ index--M5T9rj1.js:363
await in createOrUpdateUserProfile
c @ index--M5T9rj1.js:363
await in c
(anonymous) @ index--M5T9rj1.js:363
await in (anonymous)
j @ index--M5T9rj1.js:435
i$ @ index--M5T9rj1.js:37
l$ @ index--M5T9rj1.js:37
c$ @ index--M5T9rj1.js:37
vC @ index--M5T9rj1.js:37
$T @ index--M5T9rj1.js:37
(anonymous) @ index--M5T9rj1.js:37
Y0 @ index--M5T9rj1.js:40
cT @ index--M5T9rj1.js:37
kv @ index--M5T9rj1.js:37
j0 @ index--M5T9rj1.js:37
N$ @ index--M5T9rj1.js:37Understand this errorAI
index--M5T9rj1.js:363 [API] Both endpoints failed. Status: 401
createOrUpdateUserProfile @ index--M5T9rj1.js:363
await in createOrUpdateUserProfile
c @ index--M5T9rj1.js:363
await in c
(anonymous) @ index--M5T9rj1.js:363
await in (anonymous)
j @ index--M5T9rj1.js:435
i$ @ index--M5T9rj1.js:37
l$ @ index--M5T9rj1.js:37
c$ @ index--M5T9rj1.js:37
vC @ index--M5T9rj1.js:37
$T @ index--M5T9rj1.js:37
(anonymous) @ index--M5T9rj1.js:37
Y0 @ index--M5T9rj1.js:40
cT @ index--M5T9rj1.js:37
kv @ index--M5T9rj1.js:37
j0 @ index--M5T9rj1.js:37
N$ @ index--M5T9rj1.js:37Understand this errorAI
index--M5T9rj1.js:363 [API] Error creating/updating profile: Error: Failed to create profile: 401
    at Object.createOrUpdateUserProfile (index--M5T9rj1.js:363:30827)
    at async c (index--M5T9rj1.js:363:40467)
    at async index--M5T9rj1.js:363:40871
    at async j (index--M5T9rj1.js:435:18962)
createOrUpdateUserProfile @ index--M5T9rj1.js:363
await in createOrUpdateUserProfile
c @ index--M5T9rj1.js:363
await in c
(anonymous) @ index--M5T9rj1.js:363
await in (anonymous)
j @ index--M5T9rj1.js:435
i$ @ index--M5T9rj1.js:37
l$ @ index--M5T9rj1.js:37
c$ @ index--M5T9rj1.js:37
vC @ index--M5T9rj1.js:37
$T @ index--M5T9rj1.js:37
(anonymous) @ index--M5T9rj1.js:37
Y0 @ index--M5T9rj1.js:40
cT @ index--M5T9rj1.js:37
kv @ index--M5T9rj1.js:37
j0 @ index--M5T9rj1.js:37
N$ @ index--M5T9rj1.js:37Understand this errorAI
index--M5T9rj1.js:363 Error ensuring user profile exists: Error: Failed to create profile: 401
    at Object.createOrUpdateUserProfile (index--M5T9rj1.js:363:30827)
    at async c (index--M5T9rj1.js:363:40467)
    at async index--M5T9rj1.js:363:40871
    at async j (index--M5T9rj1.js:435:18962)
c @ index--M5T9rj1.js:363
await in c
(anonymous) @ index--M5T9rj1.js:363
await in (anonymous)
j @ index--M5T9rj1.js:435
i$ @ index--M5T9rj1.js:37
l$ @ index--M5T9rj1.js:37
c$ @ index--M5T9rj1.js:37
vC @ index--M5T9rj1.js:37
$T @ index--M5T9rj1.js:37
(anonymous) @ index--M5T9rj1.js:37
Y0 @ index--M5T9rj1.js:40
cT @ index--M5T9rj1.js:37
kv @ index--M5T9rj1.js:37
j0 @ index--M5T9rj1.js:37
N$ @ index--M5T9rj1.js:37Understand this errorAI
index--M5T9rj1.js:363 Profile creation failed but registration succeeded: Error: Failed to create profile: 401
    at Object.createOrUpdateUserProfile (index--M5T9rj1.js:363:30827)
    at async c (index--M5T9rj1.js:363:40467)
    at async index--M5T9rj1.js:363:40871
    at async j (index--M5T9rj1.js:435:18962)
(anonymous) @ index--M5T9rj1.js:363
await in (anonymous)
j @ index--M5T9rj1.js:435
i$ @ index--M5T9rj1.js:37
l$ @ index--M5T9rj1.js:37
c$ @ index--M5T9rj1.js:37
vC @ index--M5T9rj1.js:37
$T @ index--M5T9rj1.js:37
(anonymous) @ index--M5T9rj1.js:37
Y0 @ index--M5T9rj1.js:40
cT @ index--M5T9rj1.js:37
kv @ index--M5T9rj1.js:37
j0 @ index--M5T9rj1.js:37
N$ @ index--M5T9rj1.js:37Understand this errorAI
index--M5T9rj1.js:363 Starting profile initialization...
index--M5T9rj1.js:363 Checking for existing profile...
index--M5T9rj1.js:363 
            
            
           GET https://sahabai-production.up.railway.app/api/profile 404 (Not Found)
getUserProfile @ index--M5T9rj1.js:363
g @ index--M5T9rj1.js:363
await in g
(anonymous) @ index--M5T9rj1.js:363
setTimeout
(anonymous) @ index--M5T9rj1.js:363
pg @ index--M5T9rj1.js:40
_c @ index--M5T9rj1.js:40
(anonymous) @ index--M5T9rj1.js:40
j @ index--M5T9rj1.js:25
T @ index--M5T9rj1.js:25Understand this errorAI
index--M5T9rj1.js:363 Profile not found
index--M5T9rj1.js:363 No existing profile found, creating initial user profile...
index--M5T9rj1.js:363 Attempting to create profile...
index--M5T9rj1.js:363 Checking if profile already exists...
index--M5T9rj1.js:363 
            
            
           GET https://sahabai-production.up.railway.app/api/profile 404 (Not Found)
getUserProfile @ index--M5T9rj1.js:363
g @ index--M5T9rj1.js:363
g @ index--M5T9rj1.js:363
await in g
(anonymous) @ index--M5T9rj1.js:363
setTimeout
(anonymous) @ index--M5T9rj1.js:363
pg @ index--M5T9rj1.js:40
_c @ index--M5T9rj1.js:40
(anonymous) @ index--M5T9rj1.js:40
j @ index--M5T9rj1.js:25
T @ index--M5T9rj1.js:25Understand this errorAI
index--M5T9rj1.js:363 Profile not found
index--M5T9rj1.js:363 No existing profile found, creating new profile
index--M5T9rj1.js:363 Error updating profile: Error: Profile not found
    at Object.getUserProfile (index--M5T9rj1.js:363:28229)
    at async g (index--M5T9rj1.js:363:34483)
    at async g (index--M5T9rj1.js:363:46226)
g @ index--M5T9rj1.js:363
await in g
g @ index--M5T9rj1.js:363
await in g
(anonymous) @ index--M5T9rj1.js:363
setTimeout
(anonymous) @ index--M5T9rj1.js:363
pg @ index--M5T9rj1.js:40
_c @ index--M5T9rj1.js:40
(anonymous) @ index--M5T9rj1.js:40
j @ index--M5T9rj1.js:25
T @ index--M5T9rj1.js:25Understand this errorAI
index--M5T9rj1.js:363 Error initializing profile: Error: Profile not found
    at Object.getUserProfile (index--M5T9rj1.js:363:28229)
    at async g (index--M5T9rj1.js:363:34483)
    at async g (index--M5T9rj1.js:363:46226)
g @ index--M5T9rj1.js:363
await in g
(anonymous) @ index--M5T9rj1.js:363
setTimeout
(anonymous) @ index--M5T9rj1.js:363
pg @ index--M5T9rj1.js:40
_c @ index--M5T9rj1.js:40
(anonymous) @ index--M5T9rj1.js:40
j @ index--M5T9rj1.js:25
T @ index--M5T9rj1.js:25Understand this errorAI