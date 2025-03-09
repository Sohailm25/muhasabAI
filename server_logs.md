Welcome to Day 05 of Launch Week! Final stop: Central Station & $1M for Open Source!

View Details




sahabAI


production
Architecture
Observability
Logs
Settings

Share

Date range
1 day ago

Filter
@deployment:56cd12bf-8329-4fe4-9776-437b2d89dbd6 -@replica:332e6ba4-2ee0-4681-8a1a-9397f288f71e




You reached the start of the range → Mar 8, 2025 2:26 PM

Starting Container

Starting Container

npm warn config production Use `--omit=dev` instead.

 

> rest-express@1.0.0 deploy

> npm run start

 

npm warn config production Use `--omit=dev` instead.

 

> rest-express@1.0.0 start

> NODE_ENV=production node dist/index.js

 

Starting Container

npm warn config production Use `--omit=dev` instead.

 

> rest-express@1.0.0 deploy

> npm run start

 

npm warn config production Use `--omit=dev` instead.

 

> rest-express@1.0.0 start

> NODE_ENV=production node dist/index.js

 

[2025-03-09T20:23:29.252Z] [DATABASE] Database module initialized: Using database storage

[DATABASE] Using database storage

[2025-03-09T20:23:29.289Z] [DATABASE] Database mode: PostgreSQL

Google OAuth Callback URL configured as: https://sahabai-production.up.railway.app/auth/google/callback

🔵 [WIRD ROUTES] Initializing wird-routes.ts

[DATABASE] Using database storage

[WIRD ROUTER] Storage initialized successfully

🔵 [WIRD ROUTES] Registering routes:

🔵 [WIRD ROUTES] Registering POST /api/wirds/generate-suggestions route

[DATABASE] Using database storage

Storage initialized at routes startup

 

 

🔍 [SERVER INIT] Starting server initialization...

🔍 [SERVER INIT] Initialization timestamp: 2025-03-09T20:23:29.310Z

🔍 [SERVER INIT] Environment: production

[DB INIT] Starting database initialization...

[DB INIT] Database URL configured: Yes

[DB INIT] Environment: production

[2025-03-09T20:23:29.310Z] [DATABASE] Starting database initialization...

(node:27) [DEP0040] DeprecationWarning: The `punycode` module is deprecated. Please use a userland alternative instead.

(Use `node --trace-deprecation ...` to show where the warning was created)

[2025-03-09T20:23:29.527Z] [DATABASE] Database connection test successful

[2025-03-09T20:23:29.528Z] [DATABASE] Database connection established successfully

[2025-03-09T20:23:29.550Z] [DATABASE] Database initialization complete

[DB INIT] Database initialization completed successfully

[2025-03-09T20:23:29.550Z] [DATABASE] Database initialization completed successfully

[DB INIT] Testing database connection...

[DB INIT] Testing database connection

[DB INIT] Database connection test successful

[DB INIT] Checking for users in database...

[DB INIT] Getting user count from database

[DB INIT] Found 0 users in database

🔍 [SERVER INIT] Registering main routes via registerRoutes()...

 

 

🔍 [ROUTE DEBUG] Starting route registration...

🔍 [ROUTE DEBUG] Registration timestamp: 2025-03-09T20:23:29.552Z

[IDENTITY DEBUG] Registering identity framework routes as first priority

[IDENTITY DEBUG] Setting up identity framework routes at top level

🔍 [ROUTE DEBUG] Registering auth debug middleware

🔍 [ROUTE DEBUG] Registering health check endpoint

🔍 [ROUTE DEBUG] Registering Masjidi API routes at /api

🔍 [ROUTE DEBUG] Registering Profile API routes at /api

🔍 [ROUTE DEBUG] Registering Auth routes at /auth

[ROUTE DEBUG] Registering identity framework routes

🔍 [SERVER INIT] Main routes registered successfully

🔍 [SERVER INIT] Registering additional routes...

🔍 [SERVER INIT] Registering profile routes at /api

🔍 [SERVER INIT] Registering health routes at /api

[2025-03-09T20:23:29.556Z] [INFO] Server running on port 8080

🔍 [SERVER INIT] Registering insights routes at /api

🚀 ROUTE REGISTRATION ORDER:

1. Registering wird routes at /api

2. Registering user routes at /api/user

3. Registering reflection routes at /api/reflections


Log Explorer | Railway
[PROFILE ROUTES] Profile not found, returning 404

[2025-03-09T20:24:04.319Z] [INFO] GET /api/profile 404 in 72ms :: {"error":"Profile not found"}

[SERVER] GET /assets/index-BPt8K6KF.css - Headers: {"host":"www.sahabai.dev","user-agent":"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36","accept":"text/css,*/*;q=0.1","accept-encoding":"gzip, deflate, br, zstd","accept-language":"en-US,en;q=0.9","cookie":"_tccl_visitor=0ed8cfcc-d4a1-4931-8611-b7a28f1a5248","if-none-match":"W/\"1904f-1957c9315a8\"","priority":"u=0","referer":"https://www.sahabai.dev/home","sec-ch-ua":";\"Not(A:Brand\";v=\"99\", \"Google Chrome\";v=\"133\", \"Chromium\";v=\"133\"","sec-ch-ua-mobile":"?0","sec-ch-ua-platform":"\"macOS\"","sec-fetch-dest":"style","sec-fetch-mode":"no-cors","sec-fetch-site":"same-origin","x-forwarded-for":"47.187.213.159","x-forwarded-host":"www.sahabai.dev","x-forwarded-proto":"https","x-railway-edge":"railway/us-east4","x-railway-request-id":"hkS2jRMeS0mC9EfenlhH2Q_603524580","x-real-ip":"47.187.213.159","x-request-start":"1741551848403"}

[AUTH DEBUG] GET /assets/index-BPt8K6KF.css Headers: {"authorization":"Not provided","user-agent":"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36","referer":"https://www.sahabai.dev/home";}

[AUTH DEBUG] No valid authorization header found

[SERVER] GET /manifest.json - Headers: {"host":"www.sahabai.dev","user-agent":"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36","accept":"*/*","accept-encoding":"gzip, deflate, br, zstd","accept-language":"en-US,en;q=0.9","if-modified-since":"Sun, 09 Mar 2025 20:22:48 GMT","if-none-match":"W/\"1e5-1957c9311c0\"","priority":"u=1, i","referer":"https://www.sahabai.dev/home","sec-ch-ua":";\"Not(A:Brand\";v=\"99\", \"Google Chrome\";v=\"133\", \"Chromium\";v=\"133\"","sec-ch-ua-mobile":"?0","sec-ch-ua-platform":"\"macOS\"","sec-fetch-dest":"empty","sec-fetch-mode":"cors","sec-fetch-site":"same-origin","x-forwarded-for":"47.187.213.159","x-forwarded-host":"www.sahabai.dev","x-forwarded-proto":"https","x-railway-edge":"railway/us-east4","x-railway-request-id":"LVi_9iBYQsmFAosyKUv6Iw_603524580","x-real-ip":"47.187.213.159","x-request-start":"1741551848405"}

[AUTH DEBUG] GET /manifest.json Headers: {"authorization":"Not provided","user-agent":"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36","referer":"https://www.sahabai.dev/home";}

[AUTH DEBUG] No valid authorization header found

[SERVER] GET / - Headers: {"host":"www.sahabai.dev","user-agent":"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36","accept":"text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7","accept-encoding":"gzip, deflate, br, zstd","accept-language":"en-US,en;q=0.9","cookie":"_tccl_visitor=0ed8cfcc-d4a1-4931-8611-b7a28f1a5248","if-modified-since":"Sun, 09 Mar 2025 20:22:49 GMT","if-none-match":"W/\"959-1957c9315a8\"","priority":"u=0, i","sec-ch-ua":"\"Not(A:Brand\";v=\"99\", \"Google Chrome\";v=\"133\", \"Chromium\";v=\"133\"","sec-ch-ua-mobile":"?0","sec-ch-ua-platform":"\"macOS\"","sec-fetch-dest":"document","sec-fetch-mode":"navigate","sec-fetch-site":"none","sec-fetch-user":"?1","upgrade-insecure-requests":"1","x-forwarded-for":"47.187.213.159","x-forwarded-host":"www.sahabai.dev","x-forwarded-proto":"https","x-railway-edge":"railway/us-east4","x-railway-request-id":"b17W7tDEQ4mbcfy8HvhM7Q_603524580","x-real-ip":"47.187.213.159","x-request-start":"1741551864149"}

[AUTH DEBUG] GET / Headers: {"authorization":"Not provided","user-agent":"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36"}

[AUTH DEBUG] Token format: eyJhbGciOi...kRCmYYomu4

[AUTH DEBUG] No valid authorization header found

[AUTH DEBUG] Token decode attempt: Success - Payload: {"userId":"9bf37726-6f79-4f27-ba6b-4f99ddd8bcf8","iat":1741551832,"exp":1742156632}

[PROFILE ROUTES] GET / request received

[SERVER] GET /api/profile - Headers: {"host":"sahabai-production.up.railway.app","user-agent":"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36","accept":"*/*","accept-encoding":"gzip, deflate, br, zstd","accept-language":"en-US,en;q=0.9","authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI5YmYzNzcyNi02Zjc5LTRmMjctYmE2Yi00Zjk5ZGRkOGJjZjgiLCJpYXQiOjE3NDE1NTE4MzIsImV4cCI6MTc0MjE1NjYzMn0.vj_bXB-44ytURJIJjQbV0oNR-_eTG-dxakRCmYYomu4","content-type":"application/json","origin":"https://www.sahabai.dev","priority":"u=1, i","referer":"https://www.sahabai.dev/","sec-ch-ua":";\"Not(A:Brand\";v=\"99\", \"Google Chrome\";v=\"133\", \"Chromium\";v=\"133\"","sec-ch-ua-mobile":"?0","sec-ch-ua-platform":"\"macOS\"","sec-fetch-dest":"empty","sec-fetch-mode":"cors","sec-fetch-site":"cross-site","x-forwarded-for":"47.187.213.159","x-forwarded-host":"sahabai-production.up.railway.app","x-forwarded-proto":"https","x-railway-edge":"railway/us-east4","x-railway-request-id":"fVk81DjFTLi-hwMF6tQIyQ_882434190","x-real-ip":"47.187.213.159","x-request-start":"1741551864627"}

[AUTH DEBUG] GET /api/profile Headers: {"authorization":"Bearer [hidden for security]","content-type":"application/json","user-agent":"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36","origin":"https://www.sahabai.dev","referer":"https://www.sahabai.dev/";}

[AUTH DEBUG] Token format: eyJhbGciOi...kRCmYYomu4

[PROFILE ROUTES] Headers: {"host":"sahabai-production.up.railway.app","user-agent":"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36","accept":"*/*","accept-encoding":"gzip, deflate, br, zstd","accept-language":"en-US,en;q=0.9","authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI5YmYzNzcyNi02Zjc5LTRmMjctYmE2Yi00Zjk5ZGRkOGJjZjgiLCJpYXQiOjE3NDE1NTE4MzIsImV4cCI6MTc0MjE1NjYzMn0.vj_bXB-44ytURJIJjQbV0oNR-_eTG-dxakRCmYYomu4","content-type":"application/json","origin":"https://www.sahabai.dev","priority":"u=1, i","referer":"https://www.sahabai.dev/","sec-ch-ua":";\"Not(A:Brand\";v=\"99\", \"Google Chrome\";v=\"133\", \"Chromium\";v=\"133\"","sec-ch-ua-mobile":"?0","sec-ch-ua-platform":"\"macOS\"","sec-fetch-dest":"empty","sec-fetch-mode":"cors","sec-fetch-site":"cross-site","x-forwarded-for":"47.187.213.159","x-forwarded-host":"sahabai-production.up.railway.app","x-forwarded-proto":"https","x-railway-edge":"railway/us-east4","x-railway-request-id":"Aql3QBgiRq2HwbyBC-CxrQ_882434190","x-real-ip":"47.187.213.159","x-request-start":"1741551864857"}

[AUTH DEBUG] Token decode attempt: Success - Payload: {"userId":"9bf37726-6f79-4f27-ba6b-4f99ddd8bcf8","iat":1741551832,"exp":1742156632}

[PROFILE ROUTES] GET /profile - Starting profile retrieval

[PROFILE ROUTES] GET / request received

[PROFILE ROUTES] Request path: /profile

[PROFILE ROUTES] Request method: GET

[PROFILE ROUTES] Headers: {"host":"sahabai-production.up.railway.app","user-agent":"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36","accept":"*/*","accept-encoding":"gzip, deflate, br, zstd","accept-language":"en-US,en;q=0.9","authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI5YmYzNzcyNi02Zjc5LTRmMjctYmE2Yi00Zjk5ZGRkOGJjZjgiLCJpYXQiOjE3NDE1NTE4MzIsImV4cCI6MTc0MjE1NjYzMn0.vj_bXB-44ytURJIJjQbV0oNR-_eTG-dxakRCmYYomu4","content-type":"application/json","origin":"https://www.sahabai.dev","priority":"u=1, i","referer":"https://www.sahabai.dev/","sec-ch-ua":";\"Not(A:Brand\";v=\"99\", \"Google Chrome\";v=\"133\", \"Chromium\";v=\"133\"","sec-ch-ua-mobile":"?0","sec-ch-ua-platform":"\"macOS\"","sec-fetch-dest":"empty","sec-fetch-mode":"cors","sec-fetch-site":"cross-site","x-forwarded-for":"47.187.213.159","x-forwarded-host":"sahabai-production.up.railway.app","x-forwarded-proto":"https","x-railway-edge":"railway/us-east4","x-railway-request-id":"fVk81DjFTLi-hwMF6tQIyQ_882434190","x-real-ip":"47.187.213.159","x-request-start":"1741551864627"}

[PROFILE ROUTES] GET /profile - Starting profile retrieval

[PROFILE ROUTES] Request headers: {"host":"sahabai-production.up.railway.app","user-agent":"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36","accept":"*/*","accept-encoding":"gzip, deflate, br, zstd","accept-language":"en-US,en;q=0.9","authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI5YmYzNzcyNi02Zjc5LTRmMjctYmE2Yi00Zjk5ZGRkOGJjZjgiLCJpYXQiOjE3NDE1NTE4MzIsImV4cCI6MTc0MjE1NjYzMn0.vj_bXB-44ytURJIJjQbV0oNR-_eTG-dxakRCmYYomu4","content-type":"application/json","origin":"https://www.sahabai.dev","priority":"u=1, i","referer":"https://www.sahabai.dev/","sec-ch-ua":";\"Not(A:Brand\";v=\"99\", \"Google Chrome\";v=\"133\", \"Chromium\";v=\"133\"","sec-ch-ua-mobile":"?0","sec-ch-ua-platform":"\"macOS\"","sec-fetch-dest":"empty","sec-fetch-mode":"cors","sec-fetch-site":"cross-site","x-forwarded-for":"47.187.213.159","x-forwarded-host":"sahabai-production.up.railway.app","x-forwarded-proto":"https","x-railway-edge":"railway/us-east4","x-railway-request-id":"Aql3QBgiRq2HwbyBC-CxrQ_882434190","x-real-ip":"47.187.213.159","x-request-start":"1741551864857"}

[PROFILE ROUTES] Request path: /profile

[PROFILE ROUTES] Auth header present: true

[PROFILE ROUTES] Request method: GET

[PROFILE ROUTES] Auth header: Bearer eyJhbGci...

[PROFILE ROUTES] Token extracted from header: eyJhbGciOi...

[PROFILE ROUTES] Verifying JWT token with secret: sahab...

[PROFILE ROUTES] Request headers: {"host":"sahabai-production.up.railway.app","user-agent":"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36","accept":"*/*","accept-encoding":"gzip, deflate, br, zstd","accept-language":"en-US,en;q=0.9","authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI5YmYzNzcyNi02Zjc5LTRmMjctYmE2Yi00Zjk5ZGRkOGJjZjgiLCJpYXQiOjE3NDE1NTE4MzIsImV4cCI6MTc0MjE1NjYzMn0.vj_bXB-44ytURJIJjQbV0oNR-_eTG-dxakRCmYYomu4","content-type":"application/json","origin":"https://www.sahabai.dev","priority":"u=1, i","referer":"https://www.sahabai.dev/","sec-ch-ua":";\"Not(A:Brand\";v=\"99\", \"Google Chrome\";v=\"133\", \"Chromium\";v=\"133\"","sec-ch-ua-mobile":"?0","sec-ch-ua-platform":"\"macOS\"","sec-fetch-dest":"empty","sec-fetch-mode":"cors","sec-fetch-site":"cross-site","x-forwarded-for":"47.187.213.159","x-forwarded-host":"sahabai-production.up.railway.app","x-forwarded-proto":"https","x-railway-edge":"railway/us-east4","x-railway-request-id":"fVk81DjFTLi-hwMF6tQIyQ_882434190","x-real-ip":"47.187.213.159","x-request-start":"1741551864627"}

[PROFILE ROUTES] JWT verification successful, userId: 9bf37726-6f79-4f27-ba6b-4f99ddd8bcf8

[PROFILE ROUTES] Auth header present: true

[PROFILE ROUTES] Full decoded payload: {"userId":"9bf37726-6f79-4f27-ba6b-4f99ddd8bcf8","iat":1741551832,"exp":1742156632}

[PROFILE ROUTES] Auth header: Bearer eyJhbGci...

[PROFILE ROUTES] Profile requested for authenticated user: 9bf37726-6f79-4f27-ba6b-4f99ddd8bcf8

[PROFILE ROUTES] Token extracted from header: eyJhbGciOi...

[PROFILE ROUTES] Looking up profile in database for userId: 9bf37726-6f79-4f27-ba6b-4f99ddd8bcf8

[PROFILE ROUTES] Verifying JWT token with secret: sahab...

[DB DEBUG] Getting user profile for userId: 9bf37726-6f79-4f27-ba6b-4f99ddd8bcf8

[DB DEBUG] Database mode: PostgreSQL

[PROFILE ROUTES] JWT verification successful, userId: 9bf37726-6f79-4f27-ba6b-4f99ddd8bcf8

[DB DEBUG] Using database storage

[PROFILE ROUTES] Full decoded payload: {"userId":"9bf37726-6f79-4f27-ba6b-4f99ddd8bcf8","iat":1741551832,"exp":1742156632}

[POSTGRES DB] Looking up profile for userId: 9bf37726-6f79-4f27-ba6b-4f99ddd8bcf8

[PROFILE ROUTES] Profile requested for authenticated user: 9bf37726-6f79-4f27-ba6b-4f99ddd8bcf8

[POSTGRES DB] Executing query: SELECT * FROM user_profiles WHERE user_id = $1

[PROFILE ROUTES] Looking up profile in database for userId: 9bf37726-6f79-4f27-ba6b-4f99ddd8bcf8

[POSTGRES DB] Query result rows: 0

[DB DEBUG] Getting user profile for userId: 9bf37726-6f79-4f27-ba6b-4f99ddd8bcf8

[POSTGRES DB] No profile found for userId: 9bf37726-6f79-4f27-ba6b-4f99ddd8bcf8

[DB DEBUG] Database mode: PostgreSQL

[DB DEBUG] Profile lookup result: Not found

[DB DEBUG] Using database storage

[PROFILE ROUTES] Profile lookup result: Not found

[POSTGRES DB] Looking up profile for userId: 9bf37726-6f79-4f27-ba6b-4f99ddd8bcf8

[PROFILE ROUTES] Profile not found, returning 404

[POSTGRES DB] Executing query: SELECT * FROM user_profiles WHERE user_id = $1
[AUTH DEBUG] GET /favicon.ico Headers: {"authorization":"Not provided","user-agent":"Mozilla/5.0 (iPhone; CPU iPhone OS 17_4_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/123.0.6312.52 Mobile/15E148 Safari/604.1","referer":"https://www.sahabai.dev/";}

[AUTH DEBUG] No valid authorization header found

[SERVER] GET /manifest.json - Headers: {"host":"www.sahabai.dev","user-agent":"Mozilla/5.0 (iPhone; CPU iPhone OS 17_4_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/123.0.6312.52 Mobile/15E148 Safari/604.1","accept":"*/*","accept-encoding":"gzip, deflate, br, zstd","accept-language":"en-US,en;q=0.9","cache-control":"no-cache","pragma":"no-cache","priority":"u=2","referer":"https://www.sahabai.dev/","sec-fetch-dest":"manifest","sec-fetch-mode":"cors","sec-fetch-site":"same-origin","x-forwarded-for":"168.151.126.94","x-forwarded-host":"www.sahabai.dev","x-forwarded-proto":"https","x-railway-edge":"railway/europe-west4","x-railway-request-id":"MnzKvciDSZuRuCKdzdBu9w_274150231","x-real-ip":"168.151.126.94","x-request-start":"1741551921274";}

[AUTH DEBUG] GET /manifest.json Headers: {"authorization":"Not provided","user-agent":"Mozilla/5.0 (iPhone; CPU iPhone OS 17_4_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/123.0.6312.52 Mobile/15E148 Safari/604.1","referer":"https://www.sahabai.dev/";}

[AUTH DEBUG] No valid authorization header found

[SERVER] GET /icon-192.png - Headers: {"host":"www.sahabai.dev","user-agent":"Mozilla/5.0 (iPhone; CPU iPhone OS 17_4_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/123.0.6312.52 Mobile/15E148 Safari/604.1","accept":"image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8","accept-encoding":"gzip, deflate, br, zstd","accept-language":"en-US,en;q=0.9","cache-control":"no-cache","pragma":"no-cache","priority":"u=1, i","referer":"https://www.sahabai.dev/","sec-fetch-dest":"image","sec-fetch-mode":"no-cors","sec-fetch-site":"same-origin","x-forwarded-for":"104.244.83.141","x-forwarded-host":"www.sahabai.dev","x-forwarded-proto":"https","x-railway-edge":"railway/us-east4","x-railway-request-id":"a2XeN-bDRGyWHtNIDRQFbw_2020806880","x-real-ip":"104.244.83.141","x-request-start":"1741551921560";}

[AUTH DEBUG] GET /icon-192.png Headers: {"authorization":"Not provided","user-agent":"Mozilla/5.0 (iPhone; CPU iPhone OS 17_4_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/123.0.6312.52 Mobile/15E148 Safari/604.1","referer":"https://www.sahabai.dev/";}

[AUTH DEBUG] No valid authorization header found

[SERVER] GET /assets/index-BPt8K6KF.css - Headers: {"host":"www.sahabai.dev","user-agent":"Mozilla/5.0 (iPhone; CPU iPhone OS 17_4_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/123.0.6312.52 Mobile/15E148 Safari/604.1","accept":"text/css,*/*;q=0.1","accept-encoding":"gzip, deflate, br, zstd","accept-language":"en-US,en;q=0.9","cache-control":"no-cache","origin":"https://www.sahabai.dev","pragma":"no-cache","priority":"u=0","referer":"https://www.sahabai.dev/","sec-fetch-dest":"style","sec-fetch-mode":"cors","sec-fetch-site":"same-origin","x-forwarded-for":"104.252.186.111","x-forwarded-host":"www.sahabai.dev","x-forwarded-proto":"https","x-railway-edge":"railway/us-west1","x-railway-request-id":"W73lst8eSQK6FaaUKnbp3w_3485859946","x-real-ip":"104.252.186.111","x-request-start":"1741551920155";}

[AUTH DEBUG] GET /assets/index-BPt8K6KF.css Headers: {"authorization":"Not provided","user-agent":"Mozilla/5.0 (iPhone; CPU iPhone OS 17_4_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/123.0.6312.52 Mobile/15E148 Safari/604.1","origin":"https://www.sahabai.dev","referer":"https://www.sahabai.dev/";}

[AUTH DEBUG] No valid authorization header found

[SERVER] GET / - Headers: {"host":"www.sahabai.dev","user-agent":"Mozilla/5.0 (iPhone; CPU iPhone OS 17_4_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/123.0.6312.52 Mobile/15E148 Safari/604.1","accept":"text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7","accept-encoding":"gzip, deflate, br, zstd","accept-language":"en-US,en;q=0.9","cache-control":"no-cache","pragma":"no-cache","priority":"u=0, i","sec-fetch-dest":"document","sec-fetch-mode":"navigate","sec-fetch-site":"none","sec-fetch-user":"?1","upgrade-insecure-requests":"1","x-forwarded-for":"107.172.166.128","x-forwarded-host":"www.sahabai.dev","x-forwarded-proto":"https","x-railway-edge":"railway/us-west1","x-railway-request-id":"_2mQHXtcTEy7ze5avQBNvg_2654280189","x-real-ip":"107.172.166.128","x-request-start":"1741551920594"}

[AUTH DEBUG] GET /auth/validate Headers: {"authorization":"Not provided","user-agent":"Mozilla/5.0 (iPhone; CPU iPhone OS 17_4_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/123.0.6312.52 Mobile/15E148 Safari/604.1","referer":"https://www.sahabai.dev/";}

[AUTH DEBUG] No valid authorization header found

[AUTH DEBUG] GET / Headers: {"authorization":"Not provided","user-agent":"Mozilla/5.0 (iPhone; CPU iPhone OS 17_4_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/123.0.6312.52 Mobile/15E148 Safari/604.1"}

[Validate Debug] Starting token validation

[AUTH DEBUG] No valid authorization header found

[Validate Debug] Request path: /validate

[Validate Debug] Request method: GET

[Validate Debug] Auth header present: false

[SERVER] GET /assets/index-BPt8K6KF.css - Headers: {"host":"www.sahabai.dev","user-agent":"Mozilla/5.0 (iPhone; CPU iPhone OS 17_4_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/123.0.6312.52 Mobile/15E148 Safari/604.1","accept":"text/css,*/*;q=0.1","accept-encoding":"gzip, deflate, br, zstd","accept-language":"en-US,en;q=0.9","cache-control":"no-cache","origin":"https://www.sahabai.dev","pragma":"no-cache","priority":"u=0","referer":"https://www.sahabai.dev/","sec-fetch-dest":"style","sec-fetch-mode":"cors","sec-fetch-site":"same-origin","x-forwarded-for":"107.172.166.128","x-forwarded-host":"www.sahabai.dev","x-forwarded-proto":"https","x-railway-edge":"railway/us-west1","x-railway-request-id":"XO_g85bGSvapDk0za3u07Q_2654280189","x-real-ip":"107.172.166.128","x-request-start":"1741551920768";}

[AUTH DEBUG] No valid authorization header found

[Validate Debug] Auth header: None

[Validate Debug] Starting token validation

[Validate Debug] Invalid auth header format

[AUTH DEBUG] GET /assets/index-BPt8K6KF.css Headers: {"authorization":"Not provided","user-agent":"Mozilla/5.0 (iPhone; CPU iPhone OS 17_4_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/123.0.6312.52 Mobile/15E148 Safari/604.1","origin":"https://www.sahabai.dev","referer":"https://www.sahabai.dev/";}

[AUTH DEBUG] No valid authorization header found

[SERVER] GET /auth/validate - Headers: {"host":"www.sahabai.dev","user-agent":"Mozilla/5.0 (iPhone; CPU iPhone OS 17_4_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/123.0.6312.52 Mobile/15E148 Safari/604.1","accept":"*/*","accept-encoding":"gzip, deflate, br, zstd","accept-language":"en-US,en;q=0.9","authorization":"","cache-control":"no-cache","pragma":"no-cache","priority":"u=1, i","referer":"https://www.sahabai.dev/","sec-fetch-dest":"empty","sec-fetch-mode":"cors","sec-fetch-site":"same-origin","x-forwarded-for":"107.172.166.128","x-forwarded-host":"www.sahabai.dev","x-forwarded-proto":"https","x-railway-edge":"railway/us-west1","x-railway-request-id":"bjvISfYzSfeJ65gOqTI9tQ_2654280189","x-real-ip":"107.172.166.128","x-request-start":"1741551921613";}

[Validate Debug] Request path: /validate

[AUTH DEBUG] GET /auth/validate Headers: {"authorization":"Not provided","user-agent":"Mozilla/5.0 (iPhone; CPU iPhone OS 17_4_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/123.0.6312.52 Mobile/15E148 Safari/604.1","referer":"https://www.sahabai.dev/";}

[SERVER] GET /auth/validate - Headers: {"host":"www.sahabai.dev","user-agent":"Mozilla/5.0 (iPhone; CPU iPhone OS 17_4_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/123.0.6312.52 Mobile/15E148 Safari/604.1","accept":"*/*","accept-encoding":"gzip, deflate, br, zstd","accept-language":"en-US,en;q=0.9","authorization":"","cache-control":"no-cache","pragma":"no-cache","priority":"u=1, i","referer":"https://www.sahabai.dev/","sec-fetch-dest":"empty","sec-fetch-mode":"cors","sec-fetch-site":"same-origin","x-forwarded-for":"104.252.186.111","x-forwarded-host":"www.sahabai.dev","x-forwarded-proto":"https","x-railway-edge":"railway/us-west1","x-railway-request-id":"0rGZHmEaRE-dqQGE0oSGUQ_3485859946","x-real-ip":"104.252.186.111","x-request-start":"1741551921076";}

[Validate Debug] Request method: GET

[Validate Debug] Auth header present: false

[Validate Debug] Auth header: None

[Validate Debug] Invalid auth header format

[AUTH DEBUG] GET /manifest.json Headers: {"authorization":"Not provided","user-agent":"Mozilla/5.0 (iPhone; CPU iPhone OS 17_4_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/123.0.6312.52 Mobile/15E148 Safari/604.1","referer":"https://www.sahabai.dev/";}

[SERVER] GET /favicon.ico - Headers: {"host":"www.sahabai.dev","user-agent":"Mozilla/5.0 (iPhone; CPU iPhone OS 17_4_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/123.0.6312.52 Mobile/15E148 Safari/604.1","accept":"image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8","accept-encoding":"gzip, deflate, br, zstd","accept-language":"en-US,en;q=0.9","cache-control":"no-cache","pragma":"no-cache","priority":"u=1, i","referer":"https://www.sahabai.dev/","sec-fetch-dest":"image","sec-fetch-mode":"no-cors","sec-fetch-site":"same-origin","x-forwarded-for":"107.172.166.128","x-forwarded-host":"www.sahabai.dev","x-forwarded-proto":"https","x-railway-edge":"railway/us-west1","x-railway-request-id":"RhIuLrfuQfeUINPsxxs1vw_2654280189","x-real-ip":"107.172.166.128","x-request-start":"1741551921621";}

[AUTH DEBUG] No valid authorization header found

[AUTH DEBUG] GET /favicon.ico Headers: {"authorization":"Not provided","user-agent":"Mozilla/5.0 (iPhone; CPU iPhone OS 17_4_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/123.0.6312.52 Mobile/15E148 Safari/604.1","referer":"https://www.sahabai.dev/";}

[AUTH DEBUG] No valid authorization header found

[SERVER] GET /manifest.json - Headers: {"host":"www.sahabai.dev","user-agent":"Mozilla/5.0 (iPhone; CPU iPhone OS 17_4_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/123.0.6312.52 Mobile/15E148 Safari/604.1","accept":"*/*","accept-encoding":"gzip, deflate, br, zstd","accept-language":"en-US,en;q=0.9","cache-control":"no-cache","pragma":"no-cache","priority":"u=2","referer":"https://www.sahabai.dev/","sec-fetch-dest":"manifest","sec-fetch-mode":"cors","sec-fetch-site":"same-origin","x-forwarded-for":"107.172.166.128","x-forwarded-host":"www.sahabai.dev","x-forwarded-proto":"https","x-railway-edge":"railway/us-west1","x-railway-request-id":"utSF0WIMTLWunfji7UvATw_2654280189","x-real-ip":"107.172.166.128","x-request-start":"1741551921860";}

[SERVER] GET / - Headers: {"host":"sahabai-production.up.railway.app","user-agent":"Mozilla/5.0 (compatible)","accept":"*/*","baggage":"sentry-environment=production,sentry-public_key=e6210d6b5d3246c29d5667b356d11c63,sentry-release=ha_github_commits_consumer@428885,sentry-trace_id=e10e836562b74a33909eedcf4c67ae56","range":"bytes: 0-22","traceparent":"00-9c64f50c2289f1d33e5c07fc3af0566f-65a29eb650bb5db9-00","x-forwarded-for":"34.235.48.77","x-forwarded-host":"sahabai-production.up.railway.app","x-forwarded-proto":"https","x-railway-edge":"railway/us-east4","x-railway-request-id":"kh2QAdmmQ6Wk3ptNVKV9xg_1654200396","x-real-ip":"34.235.48.77","x-request-start":"1741551940337"}

[AUTH DEBUG] GET / Headers: {"authorization":"Not provided","user-agent":"Mozilla/5.0 (compatible)"}

[AUTH DEBUG] No valid authorization header found

[SERVER] GET /auth/validate - Headers: {"host":"www.sahabai.dev","user-agent":"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36","accept":"*/*","accept-encoding":"gzip, deflate, br, zstd","accept-language":"en-US,en;q=0.9","authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI5YmYzNzcyNi02Zjc5LTRmMjctYmE2Yi00Zjk5ZGRkOGJjZjgiLCJpYXQiOjE3NDE1NTE4MzIsImV4cCI6MTc0MjE1NjYzMn0.vj_bXB-44ytURJIJjQbV0oNR-_eTG-dxakRCmYYomu4","cookie":"_tccl_visitor=0ed8cfcc-d4a1-4931-8611-b7a28f1a5248","priority":"u=1, i","referer":"https://www.sahabai.dev/home","sec-ch-ua":";\"Not(A:Brand\";v=\"99\", \"Google Chrome\";v=\"133\", \"Chromium\";v=\"133\"","sec-ch-ua-mobile":"?0","sec-ch-ua-platform":"\"macOS\"","sec-fetch-dest":"empty","sec-fetch-mode":"cors","sec-fetch-site":"same-origin","x-forwarded-for":"47.187.213.159","x-forwarded-host":"www.sahabai.dev","x-forwarded-proto":"https","x-railway-edge":"railway/us-east4","x-railway-request-id":"2eIvWIk9ThqITA2m2kQ3Yw_603524580","x-real-ip":"47.187.213.159","x-request-start":"1741552077756"}

[AUTH DEBUG] GET /auth/validate Headers: {"authorization":"Bearer [hidden for security]","user-agent":"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36","referer":"https://www.sahabai.dev/home";}

[AUTH DEBUG] Token format: eyJhbGciOi...kRCmYYomu4

[AUTH DEBUG] Token decode attempt: Success - Payload: {"userId":"9bf37726-6f79-4f27-ba6b-4f99ddd8bcf8","iat":1741551832,"exp":1742156632}

[Validate Debug] Starting token validation

[Validate Debug] Request path: /validate

[Validate Debug] Request method: GET

[Validate Debug] Auth header present: true

[Validate Debug] Auth header: Bearer eyJhbGci...

[Validate Debug] Token extracted from header: eyJhbGciOi...

[Validate Debug] Verifying JWT token with secret: sahab...

[Validate Debug] JWT verification successful, user id: 9bf37726-6f79-4f27-ba6b-4f99ddd8bcf8

[Validate Debug] Full decoded payload: {"userId":"9bf37726-6f79-4f27-ba6b-4f99ddd8bcf8","iat":1741551832,"exp":1742156632}

[Validate Debug] Fetching user data from database for userId: 9bf37726-6f79-4f27-ba6b-4f99ddd8bcf8

[DB DEBUG] Looking up user by ID: 9bf37726-6f79-4f27-ba6b-4f99ddd8bcf8

[DB DEBUG] usersStore size: 1 entries