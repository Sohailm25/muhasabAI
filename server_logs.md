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
3 minutes ago

Filter
@deployment:8e5306eb-0202-43e3-a33a-9e74edabe08e -@replica:75c8235e-ab9f-4e20-b3ab-d0454c9ad6d3




You reached the start of the range → Mar 9, 2025 3:06 PM

Storage initialized at routes startup

[2025-03-09T20:07:50.019Z] [DATABASE] Starting database initialization...

(node:27) [DEP0040] DeprecationWarning: The `punycode` module is deprecated. Please use a userland alternative instead.

(Use `node --trace-deprecation ...` to show where the warning was created)

npm warn config production Use `--omit=dev` instead.

 

> rest-express@1.0.0 deploy

> npm run start

 

npm warn config production Use `--omit=dev` instead.

 

> rest-express@1.0.0 start

> NODE_ENV=production node dist/index.js

 

[2025-03-09T20:07:50.469Z] [DATABASE] Database connection test successful

[2025-03-09T20:07:50.470Z] [DATABASE] Database connection established successfully

[2025-03-09T20:07:50.540Z] [DATABASE] Database initialization complete

[2025-03-09T20:07:50.540Z] [DATABASE] Database initialization completed successfully

[IDENTITY DEBUG] Registering identity framework routes as first priority

[IDENTITY DEBUG] Setting up identity framework routes at top level

[ROUTE DEBUG] Registering identity framework routes

🚀 ROUTE REGISTRATION ORDER:

1. Registering wird routes at /api

2. Registering user routes at /api/user

3. Registering reflection routes at /api/reflections

4. Registering halaqa routes at /api/halaqas

[2025-03-09T20:07:50.552Z] [INFO] Server running on port 8080

[2025-03-09T20:07:51.700Z] [DATABASE] Database module initialized: Using database storage

[DATABASE] Using database storage

[2025-03-09T20:07:51.722Z] [DATABASE] Database mode: PostgreSQL

Google OAuth Callback URL configured as: https://sahabai-production.up.railway.app/auth/google/callback

🔵 [WIRD ROUTES] Initializing wird-routes.ts

[DATABASE] Using database storage

[WIRD ROUTER] Storage initialized successfully

🔵 [WIRD ROUTES] Registering routes:

🔵 [WIRD ROUTES] Registering POST /api/wirds/generate-suggestions route

[DATABASE] Using database storage

Storage initialized at routes startup

[2025-03-09T20:07:51.737Z] [DATABASE] Starting database initialization...

(node:27) [DEP0040] DeprecationWarning: The `punycode` module is deprecated. Please use a userland alternative instead.

(Use `node --trace-deprecation ...` to show where the warning was created)

[2025-03-09T20:07:51.899Z] [DATABASE] Database connection test successful

[2025-03-09T20:07:51.899Z] [DATABASE] Database connection established successfully

[2025-03-09T20:07:51.918Z] [DATABASE] Database initialization complete

[2025-03-09T20:07:51.918Z] [DATABASE] Database initialization completed successfully

[IDENTITY DEBUG] Registering identity framework routes as first priority

[IDENTITY DEBUG] Setting up identity framework routes at top level

[ROUTE DEBUG] Registering identity framework routes

🚀 ROUTE REGISTRATION ORDER:

1. Registering wird routes at /api

2. Registering user routes at /api/user

3. Registering reflection routes at /api/reflections

4. Registering halaqa routes at /api/halaqas

[2025-03-09T20:07:51.923Z] [INFO] Server running on port 8080

[SERVER] GET / - Headers: {"host":"www.sahabai.dev","user-agent":"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36","accept":"text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7","accept-encoding":"gzip, deflate, br, zstd","accept-language":"en-US,en;q=0.9","cookie":"_tccl_visitor=0ed8cfcc-d4a1-4931-8611-b7a28f1a5248","if-modified-since":"Sun, 09 Mar 2025 19:56:26 GMT","if-none-match":"W/\"959-1957c7aee10\"","priority":"u=0, i","sec-ch-ua":"\"Not(A:Brand\";v=\"99\", \"Google Chrome\";v=\"133\", \"Chromium\";v=\"133\"","sec-ch-ua-mobile":"?0","sec-ch-ua-platform":"\"macOS\"","sec-fetch-dest":"document","sec-fetch-mode":"navigate","sec-fetch-site":"cross-site","sec-fetch-user":"?1","upgrade-insecure-requests":"1","x-forwarded-for":"47.187.213.159","x-forwarded-host":"www.sahabai.dev","x-forwarded-proto":"https","x-railway-edge":"railway/us-east4","x-railway-request-id":"z1ifbcBJRLuVvAqY4TYbEA_2020806880","x-real-ip":"47.187.213.159","x-request-start":"1741550876285"}

[AUTH DEBUG] GET / Headers: {"authorization":"Not provided","user-agent":"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36"}

[AUTH DEBUG] No valid authorization header found

[SERVER] GET /assets/index-BCNjyqQe.js - Headers: {"host":"www.sahabai.dev","user-agent":"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36","accept":"*/*","accept-encoding":"gzip, deflate, br, zstd","accept-language":"en-US,en;q=0.9","cookie":"_tccl_visitor=0ed8cfcc-d4a1-4931-8611-b7a28f1a5248","origin":"https://www.sahabai.dev","priority":"u=1","referer":"https://www.sahabai.dev/","sec-ch-ua":";\"Not(A:Brand\";v=\"99\", \"Google Chrome\";v=\"133\", \"Chromium\";v=\"133\"","sec-ch-ua-mobile":"?0","sec-ch-ua-platform":"\"macOS\"","sec-fetch-dest":"script","sec-fetch-mode":"cors","sec-fetch-site":"same-origin","x-forwarded-for":"47.187.213.159","x-forwarded-host":"www.sahabai.dev","x-forwarded-proto":"https","x-railway-edge":"railway/us-east4","x-railway-request-id":"hzhWFvVXRpakU-6SH5ZPHQ_2020806880","x-real-ip":"47.187.213.159","x-request-start":"1741550876443"}

[AUTH DEBUG] GET /assets/index-BCNjyqQe.js Headers: {"authorization":"Not provided","user-agent":"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36","origin":"https://www.sahabai.dev","referer":"https://www.sahabai.dev/";}

[AUTH DEBUG] No valid authorization header found

[SERVER] GET /auth/validate - Headers: {"host":"www.sahabai.dev","user-agent":"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36","accept":"*/*","accept-encoding":"gzip, deflate, br, zstd","accept-language":"en-US,en;q=0.9","authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2NTc2NzU4NC1jNTExLTRlMmMtYWFkYi1hNzYwYjdmNjkwMjIiLCJpYXQiOjE3NDE1NTAyNjEsImV4cCI6MTc0MjE1NTA2MX0.XfNoXrSnGXdX-3MmqoQU6qQesEczVuT0_uf2fagIOlc","cookie":"_tccl_visitor=0ed8cfcc-d4a1-4931-8611-b7a28f1a5248","if-none-match":"W/\"64-U6z5EKJE8NQc/wUsC1WD6+730/U\"","priority":"u=1, i","referer":"https://www.sahabai.dev/","sec-ch-ua":";\"Not(A:Brand\";v=\"99\", \"Google Chrome\";v=\"133\", \"Chromium\";v=\"133\"","sec-ch-ua-mobile":"?0","sec-ch-ua-platform":"\"macOS\"","sec-fetch-dest":"empty","sec-fetch-mode":"cors","sec-fetch-site":"same-origin","x-forwarded-for":"47.187.213.159","x-forwarded-host":"www.sahabai.dev","x-forwarded-proto":"https","x-railway-edge":"railway/us-east4","x-railway-request-id":"9GqvbBSySYiD2g_x415xww_2020806880","x-real-ip":"47.187.213.159","x-request-start":"1741550876844"}

[AUTH DEBUG] GET /auth/validate Headers: {"authorization":"Bearer [hidden for security]","user-agent":"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36","referer":"https://www.sahabai.dev/";}

[AUTH DEBUG] Token format: eyJhbGciOi...uf2fagIOlc

[AUTH DEBUG] Token decode attempt: Success - Payload: {"userId":"65767584-c511-4e2c-aadb-a760b7f69022","iat":1741550261,"exp":1742155061}

[Validate Debug] Starting token validation

[Validate Debug] Auth header present: true

[Validate Debug] Token extracted from header

[Validate Debug] Verifying JWT token

[Validate Debug] JWT verification successful, user id: 65767584-c511-4e2c-aadb-a760b7f69022

[Validate Debug] Fetching user data from database

[Validate Debug] User not found in database

[SERVER] GET /api/profile - Headers: {"host":"sahabai-production.up.railway.app","user-agent":"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36","accept":"*/*","accept-encoding":"gzip, deflate, br, zstd","accept-language":"en-US,en;q=0.9","authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2NTc2NzU4NC1jNTExLTRlMmMtYWFkYi1hNzYwYjdmNjkwMjIiLCJpYXQiOjE3NDE1NTAyNjEsImV4cCI6MTc0MjE1NTA2MX0.XfNoXrSnGXdX-3MmqoQU6qQesEczVuT0_uf2fagIOlc","content-type":"application/json","origin":"https://www.sahabai.dev","priority":"u=1, i","referer":"https://www.sahabai.dev/","sec-ch-ua":";\"Not(A:Brand\";v=\"99\", \"Google Chrome\";v=\"133\", \"Chromium\";v=\"133\"","sec-ch-ua-mobile":"?0","sec-ch-ua-platform":"\"macOS\"","sec-fetch-dest":"empty","sec-fetch-mode":"cors","sec-fetch-site":"cross-site","x-forwarded-for":"47.187.213.159","x-forwarded-host":"sahabai-production.up.railway.app","x-forwarded-proto":"https","x-railway-edge":"railway/us-east4","x-railway-request-id":"zR0niBltR5qqc2OvZDQcmw_1002618245","x-real-ip":"47.187.213.159","x-request-start":"1741550876963"}

[AUTH DEBUG] GET /api/profile Headers: {"authorization":"Bearer [hidden for security]","content-type":"application/json","user-agent":"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36","origin":"https://www.sahabai.dev","referer":"https://www.sahabai.dev/";}

[AUTH DEBUG] Token format: eyJhbGciOi...uf2fagIOlc

[AUTH DEBUG] Token decode attempt: Success - Payload: {"userId":"65767584-c511-4e2c-aadb-a760b7f69022","iat":1741550261,"exp":1742155061}

[PROFILE ROUTES] GET / request received

[PROFILE ROUTES] Headers: {"host":"sahabai-production.up.railway.app","user-agent":"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36","accept":"*/*","accept-encoding":"gzip, deflate, br, zstd","accept-language":"en-US,en;q=0.9","authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2NTc2NzU4NC1jNTExLTRlMmMtYWFkYi1hNzYwYjdmNjkwMjIiLCJpYXQiOjE3NDE1NTAyNjEsImV4cCI6MTc0MjE1NTA2MX0.XfNoXrSnGXdX-3MmqoQU6qQesEczVuT0_uf2fagIOlc","content-type":"application/json","origin":"https://www.sahabai.dev","priority":"u=1, i","referer":"https://www.sahabai.dev/","sec-ch-ua":";\"Not(A:Brand\";v=\"99\", \"Google Chrome\";v=\"133\", \"Chromium\";v=\"133\"","sec-ch-ua-mobile":"?0","sec-ch-ua-platform":"\"macOS\"","sec-fetch-dest":"empty","sec-fetch-mode":"cors","sec-fetch-site":"cross-site","x-forwarded-for":"47.187.213.159","x-forwarded-host":"sahabai-production.up.railway.app","x-forwarded-proto":"https","x-railway-edge":"railway/us-east4","x-railway-request-id":"zR0niBltR5qqc2OvZDQcmw_1002618245","x-real-ip":"47.187.213.159","x-request-start":"1741550876963"}

[PROFILE ROUTES] GET /profile - Starting profile retrieval

[PROFILE ROUTES] Token extracted from header

[PROFILE ROUTES] Profile requested for authenticated user: 65767584-c511-4e2c-aadb-a760b7f69022

[SERVER] GET /auth/validate - Headers: {"host":"sahabai-production.up.railway.app","user-agent":"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36","accept":"*/*","accept-encoding":"gzip, deflate, br, zstd","accept-language":"en-US,en;q=0.9","authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2NTc2NzU4NC1jNTExLTRlMmMtYWFkYi1hNzYwYjdmNjkwMjIiLCJpYXQiOjE3NDE1NTAyNjEsImV4cCI6MTc0MjE1NTA2MX0.XfNoXrSnGXdX-3MmqoQU6qQesEczVuT0_uf2fagIOlc","content-type":"application/json","if-none-match":"W/\"64-U6z5EKJE8NQc/wUsC1WD6+730/U\"","origin":"https://www.sahabai.dev","priority":"u=1, i","referer":"https://www.sahabai.dev/","sec-ch-ua":";\"Not(A:Brand\";v=\"99\", \"Google Chrome\";v=\"133\", \"Chromium\";v=\"133\"","sec-ch-ua-mobile":"?0","sec-ch-ua-platform":"\"macOS\"","sec-fetch-dest":"empty","sec-fetch-mode":"cors","sec-fetch-site":"cross-site","x-forwarded-for":"47.187.213.159","x-forwarded-host":"sahabai-production.up.railway.app","x-forwarded-proto":"https","x-railway-edge":"railway/us-east4","x-railway-request-id":"d9zzI34rT-CbzVbraduawA_1002618245","x-real-ip":"47.187.213.159","x-request-start":"1741550876963"}

[AUTH DEBUG] GET /auth/validate Headers: {"authorization":"Bearer [hidden for security]","content-type":"application/json","user-agent":"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36","origin":"https://www.sahabai.dev","referer":"https://www.sahabai.dev/";}

[AUTH DEBUG] Token format: eyJhbGciOi...uf2fagIOlc

[AUTH DEBUG] Token decode attempt: Success - Payload: {"userId":"65767584-c511-4e2c-aadb-a760b7f69022","iat":1741550261,"exp":1742155061}

[Validate Debug] Starting token validation

[Validate Debug] Auth header present: true

[Validate Debug] Token extracted from header

[Validate Debug] Verifying JWT token

[Validate Debug] JWT verification successful, user id: 65767584-c511-4e2c-aadb-a760b7f69022

[Validate Debug] Fetching user data from database

[Validate Debug] User not found in database

[SERVER] GET /auth/validate - Headers: {"host":"sahabai-production.up.railway.app","user-agent":"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36","accept":"*/*","accept-encoding":"gzip, deflate, br, zstd","accept-language":"en-US,en;q=0.9","authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2NTc2NzU4NC1jNTExLTRlMmMtYWFkYi1hNzYwYjdmNjkwMjIiLCJpYXQiOjE3NDE1NTAyNjEsImV4cCI6MTc0MjE1NTA2MX0.XfNoXrSnGXdX-3MmqoQU6qQesEczVuT0_uf2fagIOlc","content-type":"application/json","origin":"https://www.sahabai.dev","priority":"u=1, i","referer":"https://www.sahabai.dev/","sec-ch-ua":";\"Not(A:Brand\";v=\"99\", \"Google Chrome\";v=\"133\", \"Chromium\";v=\"133\"","sec-ch-ua-mobile":"?0","sec-ch-ua-platform":"\"macOS\"","sec-fetch-dest":"empty","sec-fetch-mode":"cors","sec-fetch-site":"cross-site","x-forwarded-for":"47.187.213.159","x-forwarded-host":"sahabai-production.up.railway.app","x-forwarded-proto":"https","x-railway-edge":"railway/us-east4","x-railway-request-id":"7s6fd_5OToWOi5jTBpF9FQ_1002618245","x-real-ip":"47.187.213.159","x-request-start":"1741550877046"}

[AUTH DEBUG] GET /auth/validate Headers: {"authorization":"Bearer [hidden for security]","content-type":"application/json","user-agent":"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36","origin":"https://www.sahabai.dev","referer":"https://www.sahabai.dev/";}

[AUTH DEBUG] Token format: eyJhbGciOi...uf2fagIOlc

[AUTH DEBUG] Token decode attempt: Success - Payload: {"userId":"65767584-c511-4e2c-aadb-a760b7f69022","iat":1741550261,"exp":1742155061}

[Validate Debug] Starting token validation

[Validate Debug] Auth header present: true

[Validate Debug] Token extracted from header

[Validate Debug] Verifying JWT token

[Validate Debug] JWT verification successful, user id: 65767584-c511-4e2c-aadb-a760b7f69022

[Validate Debug] Fetching user data from database

[Validate Debug] User not found in database

[SERVER] GET /favicon.ico - Headers: {"host":"www.sahabai.dev","user-agent":"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36","accept":"image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8","accept-encoding":"gzip, deflate, br, zstd","accept-language":"en-US,en;q=0.9","cookie":"_tccl_visitor=0ed8cfcc-d4a1-4931-8611-b7a28f1a5248","if-modified-since":"Sun, 09 Mar 2025 19:56:26 GMT","if-none-match":"W/\"959-1957c7aee10\"","priority":"u=1, i","referer":"https://www.sahabai.dev/","sec-ch-ua":";\"Not(A:Brand\";v=\"99\", \"Google Chrome\";v=\"133\", \"Chromium\";v=\"133\"","sec-ch-ua-mobile":"?0","sec-ch-ua-platform":"\"macOS\"","sec-fetch-dest":"image","sec-fetch-mode":"no-cors","sec-fetch-site":"same-origin","x-forwarded-for":"47.187.213.159","x-forwarded-host":"www.sahabai.dev","x-forwarded-proto":"https","x-railway-edge":"railway/us-east4","x-railway-request-id":"xU8Yrm-aQ1CPIJq8Yaztvw_2020806880","x-real-ip":"47.187.213.159","x-request-start":"1741550877093"}

[AUTH DEBUG] GET /favicon.ico Headers: {"authorization":"Not provided","user-agent":"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36","referer":"https://www.sahabai.dev/";}

[AUTH DEBUG] No valid authorization header found

[SERVER] GET /auth/validate - Headers: {"host":"sahabai-production.up.railway.app","user-agent":"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36","accept":"*/*","accept-encoding":"gzip, deflate, br, zstd","accept-language":"en-US,en;q=0.9","authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2NTc2NzU4NC1jNTExLTRlMmMtYWFkYi1hNzYwYjdmNjkwMjIiLCJpYXQiOjE3NDE1NTAyNjEsImV4cCI6MTc0MjE1NTA2MX0.XfNoXrSnGXdX-3MmqoQU6qQesEczVuT0_uf2fagIOlc","content-type":"application/json","origin":"https://www.sahabai.dev","priority":"u=1, i","referer":"https://www.sahabai.dev/","sec-ch-ua":";\"Not(A:Brand\";v=\"99\", \"Google Chrome\";v=\"133\", \"Chromium\";v=\"133\"","sec-ch-ua-mobile":"?0","sec-ch-ua-platform":"\"macOS\"","sec-fetch-dest":"empty","sec-fetch-mode":"cors","sec-fetch-site":"cross-site","x-forwarded-for":"47.187.213.159","x-forwarded-host":"sahabai-production.up.railway.app","x-forwarded-proto":"https","x-railway-edge":"railway/us-east4","x-railway-request-id":"muj9fUTFTG-ZHbHgjCHtgQ_1002618245","x-real-ip":"47.187.213.159","x-request-start":"1741550877100"}


Railway
