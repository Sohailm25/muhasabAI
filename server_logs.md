Welcome to Day 05 of Launch Week! Final stop: Central Station & $1M for Open Source!

View Details




sahabAI


production
Architecture
Observability
Logs
Settings

Share












Activity

sahabAI

Deployment successful

5 mins ago

sahabAI

Deployment slept

7 mins ago

sahabAI

Deployment successful

16 mins ago


1 change in sahabAI

sohailm25

·
16 mins ago

sahabAI

Deployment created

16 mins ago

sahabAI

Deployment slept

16 mins ago

sahabAI

Deployment slept

20 mins ago

sahabAI

Deployment resumed

27 mins ago

sahabAI

Deployment successful

27 mins ago


3 changes in sahabAI

sohailm25

·
27 mins ago

sahabAI

Deployment created

27 mins ago

sahabAI

Deployment slept

29 mins ago

sahabAI

Deployment slept

30 mins ago

sahabAI

Deployment slept

32 mins ago

sahabAI

Deployment successful

40 mins ago


Fetch More

sahabAI
Deployments
Variables
Metrics
Settings
www.sahabai.dev
US West, US East
4 Replicas




History



















sahabAI
/
5d61c0f
Mar 9, 2025 2:55 PM

Active

www.sahabai.dev

Details
Build Logs
Deploy Logs
HTTP Logs

Filter
Filter logs using "", (), AND, OR, -



You reached the start of the range → Mar 9, 2025 2:55 PM

[PROFILE ROUTES] Headers: {"host":"sahabai-production.up.railway.app","user-agent":"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36","accept":"*/*","accept-encoding":"gzip, deflate, br, zstd","accept-language":"en-US,en;q=0.9","authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2NTc2NzU4NC1jNTExLTRlMmMtYWFkYi1hNzYwYjdmNjkwMjIiLCJpYXQiOjE3NDE1NTAyNjEsImV4cCI6MTc0MjE1NTA2MX0.XfNoXrSnGXdX-3MmqoQU6qQesEczVuT0_uf2fagIOlc","content-type":"application/json","origin":"https://www.sahabai.dev","priority":"u=1, i","referer":"https://www.sahabai.dev/","sec-ch-ua":";\"Not(A:Brand\";v=\"99\", \"Google Chrome\";v=\"133\", \"Chromium\";v=\"133\"","sec-ch-ua-mobile":"?0","sec-ch-ua-platform":"\"macOS\"","sec-fetch-dest":"empty","sec-fetch-mode":"cors","sec-fetch-site":"cross-site","x-forwarded-for":"47.187.213.159","x-forwarded-host":"sahabai-production.up.railway.app","x-forwarded-proto":"https","x-railway-edge":"railway/us-east4","x-railway-request-id":"rnDJQTWFQ7eDUH_8MYSS7w_1002618245","x-real-ip":"47.187.213.159","x-request-start":"1741550298763"}

[PROFILE ROUTES] GET /profile - Starting profile retrieval

[PROFILE ROUTES] Token extracted from header

[PROFILE ROUTES] Profile requested for authenticated user: 65767584-c511-4e2c-aadb-a760b7f69022

[PROFILE ROUTES] Profile lookup result: Not found

[PROFILE ROUTES] Profile not found, returning 404

[2025-03-09T19:58:18.829Z] [INFO] GET /api/profile 404 in 64ms :: {"error":"Profile not found"}

[SERVER] GET /api/profile - Headers: {"host":"sahabai-production.up.railway.app","user-agent":"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36","accept":"*/*","accept-encoding":"gzip, deflate, br, zstd","accept-language":"en-US,en;q=0.9","authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2NTc2NzU4NC1jNTExLTRlMmMtYWFkYi1hNzYwYjdmNjkwMjIiLCJpYXQiOjE3NDE1NTAyNjEsImV4cCI6MTc0MjE1NTA2MX0.XfNoXrSnGXdX-3MmqoQU6qQesEczVuT0_uf2fagIOlc","content-type":"application/json","origin":"https://www.sahabai.dev","priority":"u=1, i","referer":"https://www.sahabai.dev/","sec-ch-ua":";\"Not(A:Brand\";v=\"99\", \"Google Chrome\";v=\"133\", \"Chromium\";v=\"133\"","sec-ch-ua-mobile":"?0","sec-ch-ua-platform":"\"macOS\"","sec-fetch-dest":"empty","sec-fetch-mode":"cors","sec-fetch-site":"cross-site","x-forwarded-for":"47.187.213.159","x-forwarded-host":"sahabai-production.up.railway.app","x-forwarded-proto":"https","x-railway-edge":"railway/us-east4","x-railway-request-id":"WpuyeU4_TOK_O_ZToFfOGw_1002618245","x-real-ip":"47.187.213.159","x-request-start":"1741550297584"}

[AUTH DEBUG] GET /api/profile Headers: {"authorization":"Bearer [hidden for security]","content-type":"application/json","user-agent":"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36","origin":"https://www.sahabai.dev","referer":"https://www.sahabai.dev/";}

[AUTH DEBUG] Token format: eyJhbGciOi...uf2fagIOlc

[AUTH DEBUG] Token decode attempt: Success - Payload: {"userId":"65767584-c511-4e2c-aadb-a760b7f69022","iat":1741550261,"exp":1742155061}

[PROFILE ROUTES] GET / request received

[PROFILE ROUTES] Headers: {"host":"sahabai-production.up.railway.app","user-agent":"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36","accept":"*/*","accept-encoding":"gzip, deflate, br, zstd","accept-language":"en-US,en;q=0.9","authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2NTc2NzU4NC1jNTExLTRlMmMtYWFkYi1hNzYwYjdmNjkwMjIiLCJpYXQiOjE3NDE1NTAyNjEsImV4cCI6MTc0MjE1NTA2MX0.XfNoXrSnGXdX-3MmqoQU6qQesEczVuT0_uf2fagIOlc","content-type":"application/json","origin":"https://www.sahabai.dev","priority":"u=1, i","referer":"https://www.sahabai.dev/","sec-ch-ua":";\"Not(A:Brand\";v=\"99\", \"Google Chrome\";v=\"133\", \"Chromium\";v=\"133\"","sec-ch-ua-mobile":"?0","sec-ch-ua-platform":"\"macOS\"","sec-fetch-dest":"empty","sec-fetch-mode":"cors","sec-fetch-site":"cross-site","x-forwarded-for":"47.187.213.159","x-forwarded-host":"sahabai-production.up.railway.app","x-forwarded-proto":"https","x-railway-edge":"railway/us-east4","x-railway-request-id":"WpuyeU4_TOK_O_ZToFfOGw_1002618245","x-real-ip":"47.187.213.159","x-request-start":"1741550297584"}

[PROFILE ROUTES] GET / request received

[PROFILE ROUTES] GET /profile - Starting profile retrieval

[PROFILE ROUTES] Token extracted from header

[PROFILE ROUTES] Profile requested for authenticated user: 65767584-c511-4e2c-aadb-a760b7f69022

[PROFILE ROUTES] Headers: {"host":"sahabai-production.up.railway.app","user-agent":"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36","accept":"*/*","accept-encoding":"gzip, deflate, br, zstd","accept-language":"en-US,en;q=0.9","authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2NTc2NzU4NC1jNTExLTRlMmMtYWFkYi1hNzYwYjdmNjkwMjIiLCJpYXQiOjE3NDE1NTAyNjEsImV4cCI6MTc0MjE1NTA2MX0.XfNoXrSnGXdX-3MmqoQU6qQesEczVuT0_uf2fagIOlc","content-type":"application/json","origin":"https://www.sahabai.dev","priority":"u=1, i","referer":"https://www.sahabai.dev/","sec-ch-ua":";\"Not(A:Brand\";v=\"99\", \"Google Chrome\";v=\"133\", \"Chromium\";v=\"133\"","sec-ch-ua-mobile":"?0","sec-ch-ua-platform":"\"macOS\"","sec-fetch-dest":"empty","sec-fetch-mode":"cors","sec-fetch-site":"cross-site","x-forwarded-for":"47.187.213.159","x-forwarded-host":"sahabai-production.up.railway.app","x-forwarded-proto":"https","x-railway-edge":"railway/us-east4","x-railway-request-id":"NH_Au5vFTfGWrUwn69e8Aw_1002618245","x-real-ip":"47.187.213.159","x-request-start":"1741550297856"}

[PROFILE ROUTES] GET /profile - Starting profile retrieval

[PROFILE ROUTES] Token extracted from header

[SERVER] GET /auth/validate - Headers: {"host":"sahabai-production.up.railway.app","user-agent":"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36","accept":"*/*","accept-encoding":"gzip, deflate, br, zstd","accept-language":"en-US,en;q=0.9","authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2NTc2NzU4NC1jNTExLTRlMmMtYWFkYi1hNzYwYjdmNjkwMjIiLCJpYXQiOjE3NDE1NTAyNjEsImV4cCI6MTc0MjE1NTA2MX0.XfNoXrSnGXdX-3MmqoQU6qQesEczVuT0_uf2fagIOlc","content-type":"application/json","if-none-match":"W/\"64-U6z5EKJE8NQc/wUsC1WD6+730/U\"","origin":"https://www.sahabai.dev","priority":"u=1, i","referer":"https://www.sahabai.dev/","sec-ch-ua":";\"Not(A:Brand\";v=\"99\", \"Google Chrome\";v=\"133\", \"Chromium\";v=\"133\"","sec-ch-ua-mobile":"?0","sec-ch-ua-platform":"\"macOS\"","sec-fetch-dest":"empty","sec-fetch-mode":"cors","sec-fetch-site":"cross-site","x-forwarded-for":"47.187.213.159","x-forwarded-host":"sahabai-production.up.railway.app","x-forwarded-proto":"https","x-railway-edge":"railway/us-east4","x-railway-request-id":"_FSLVTgJR6KRN_EA6gyp5Q_1002618245","x-real-ip":"47.187.213.159","x-request-start":"1741550297598"}

[PROFILE ROUTES] Profile requested for authenticated user: 65767584-c511-4e2c-aadb-a760b7f69022

[AUTH DEBUG] GET /auth/validate Headers: {"authorization":"Bearer [hidden for security]","content-type":"application/json","user-agent":"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36","origin":"https://www.sahabai.dev","referer":"https://www.sahabai.dev/";}

[PROFILE ROUTES] Profile lookup result: Not found

[AUTH DEBUG] Token format: eyJhbGciOi...uf2fagIOlc

[PROFILE ROUTES] Profile not found, returning 404

[AUTH DEBUG] Token decode attempt: Success - Payload: {"userId":"65767584-c511-4e2c-aadb-a760b7f69022","iat":1741550261,"exp":1742155061}

[2025-03-09T19:58:17.919Z] [INFO] GET /api/profile 404 in 61ms :: {"error":"Profile not found"}

[Validate Debug] Starting token validation

[Validate Debug] Auth header present: true

[Validate Debug] Token extracted from header

[Validate Debug] Verifying JWT token

[SERVER] GET /api/profile - Headers: {"host":"sahabai-production.up.railway.app","user-agent":"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36","accept":"*/*","accept-encoding":"gzip, deflate, br, zstd","accept-language":"en-US,en;q=0.9","authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2NTc2NzU4NC1jNTExLTRlMmMtYWFkYi1hNzYwYjdmNjkwMjIiLCJpYXQiOjE3NDE1NTAyNjEsImV4cCI6MTc0MjE1NTA2MX0.XfNoXrSnGXdX-3MmqoQU6qQesEczVuT0_uf2fagIOlc","content-type":"application/json","origin":"https://www.sahabai.dev","priority":"u=1, i","referer":"https://www.sahabai.dev/","sec-ch-ua":";\"Not(A:Brand\";v=\"99\", \"Google Chrome\";v=\"133\", \"Chromium\";v=\"133\"","sec-ch-ua-mobile":"?0","sec-ch-ua-platform":"\"macOS\"","sec-fetch-dest":"empty","sec-fetch-mode":"cors","sec-fetch-site":"cross-site","x-forwarded-for":"47.187.213.159","x-forwarded-host":"sahabai-production.up.railway.app","x-forwarded-proto":"https","x-railway-edge":"railway/us-east4","x-railway-request-id":"ZoiuaYaTQ6K0XngOf1Ehgw_1002618245","x-real-ip":"47.187.213.159","x-request-start":"1741550302387"}

[AUTH DEBUG] GET /api/profile Headers: {"authorization":"Bearer [hidden for security]","content-type":"application/json","user-agent":"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36","origin":"https://www.sahabai.dev","referer":"https://www.sahabai.dev/";}

[Validate Debug] JWT verification successful, user id: 65767584-c511-4e2c-aadb-a760b7f69022

[AUTH DEBUG] Token format: eyJhbGciOi...uf2fagIOlc

[Validate Debug] Fetching user data from database

[AUTH DEBUG] Token decode attempt: Success - Payload: {"userId":"65767584-c511-4e2c-aadb-a760b7f69022","iat":1741550261,"exp":1742155061}

[Validate Debug] User not found in database

[PROFILE ROUTES] Profile lookup result: Not found

[PROFILE ROUTES] GET / request received

[PROFILE ROUTES] Profile not found, returning 404

[2025-03-09T19:58:17.662Z] [INFO] GET /api/profile 404 in 62ms :: {"error":"Profile not found"}

[PROFILE ROUTES] Headers: {"host":"sahabai-production.up.railway.app","user-agent":"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36","accept":"*/*","accept-encoding":"gzip, deflate, br, zstd","accept-language":"en-US,en;q=0.9","authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2NTc2NzU4NC1jNTExLTRlMmMtYWFkYi1hNzYwYjdmNjkwMjIiLCJpYXQiOjE3NDE1NTAyNjEsImV4cCI6MTc0MjE1NTA2MX0.XfNoXrSnGXdX-3MmqoQU6qQesEczVuT0_uf2fagIOlc","content-type":"application/json","origin":"https://www.sahabai.dev","priority":"u=1, i","referer":"https://www.sahabai.dev/","sec-ch-ua":";\"Not(A:Brand\";v=\"99\", \"Google Chrome\";v=\"133\", \"Chromium\";v=\"133\"","sec-ch-ua-mobile":"?0","sec-ch-ua-platform":"\"macOS\"","sec-fetch-dest":"empty","sec-fetch-mode":"cors","sec-fetch-site":"cross-site","x-forwarded-for":"47.187.213.159","x-forwarded-host":"sahabai-production.up.railway.app","x-forwarded-proto":"https","x-railway-edge":"railway/us-east4","x-railway-request-id":"ZoiuaYaTQ6K0XngOf1Ehgw_1002618245","x-real-ip":"47.187.213.159","x-request-start":"1741550302387"}

[PROFILE ROUTES] GET /profile - Starting profile retrieval

[PROFILE ROUTES] Token extracted from header

[SERVER] GET /api/profile - Headers: {"host":"sahabai-production.up.railway.app","user-agent":"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36","accept":"*/*","accept-encoding":"gzip, deflate, br, zstd","accept-language":"en-US,en;q=0.9","authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2NTc2NzU4NC1jNTExLTRlMmMtYWFkYi1hNzYwYjdmNjkwMjIiLCJpYXQiOjE3NDE1NTAyNjEsImV4cCI6MTc0MjE1NTA2MX0.XfNoXrSnGXdX-3MmqoQU6qQesEczVuT0_uf2fagIOlc","content-type":"application/json","origin":"https://www.sahabai.dev","priority":"u=1, i","referer":"https://www.sahabai.dev/","sec-ch-ua":";\"Not(A:Brand\";v=\"99\", \"Google Chrome\";v=\"133\", \"Chromium\";v=\"133\"","sec-ch-ua-mobile":"?0","sec-ch-ua-platform":"\"macOS\"","sec-fetch-dest":"empty","sec-fetch-mode":"cors","sec-fetch-site":"cross-site","x-forwarded-for":"47.187.213.159","x-forwarded-host":"sahabai-production.up.railway.app","x-forwarded-proto":"https","x-railway-edge":"railway/us-east4","x-railway-request-id":"7cAJRc1WRaeDlgL4bnC1ig_1002618245","x-real-ip":"47.187.213.159","x-request-start":"1741550297741"}

[PROFILE ROUTES] Profile requested for authenticated user: 65767584-c511-4e2c-aadb-a760b7f69022

[PROFILE ROUTES] Profile lookup result: Not found

[AUTH DEBUG] GET /api/profile Headers: {"authorization":"Bearer [hidden for security]","content-type":"application/json","user-agent":"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36","origin":"https://www.sahabai.dev","referer":"https://www.sahabai.dev/";}

[PROFILE ROUTES] Profile not found, returning 404

[AUTH DEBUG] Token format: eyJhbGciOi...uf2fagIOlc

[2025-03-09T19:58:22.459Z] [INFO] GET /api/profile 404 in 68ms :: {"error":"Profile not found"}

[AUTH DEBUG] Token decode attempt: Success - Payload: {"userId":"65767584-c511-4e2c-aadb-a760b7f69022","iat":1741550261,"exp":1742155061}

[PROFILE ROUTES] GET / request received

[SERVER] GET /api/profile - Headers: {"host":"sahabai-production.up.railway.app","user-agent":"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36","accept":"*/*","accept-encoding":"gzip, deflate, br, zstd","accept-language":"en-US,en;q=0.9","authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2NTc2NzU4NC1jNTExLTRlMmMtYWFkYi1hNzYwYjdmNjkwMjIiLCJpYXQiOjE3NDE1NTAyNjEsImV4cCI6MTc0MjE1NTA2MX0.XfNoXrSnGXdX-3MmqoQU6qQesEczVuT0_uf2fagIOlc","content-type":"application/json","origin":"https://www.sahabai.dev","priority":"u=1, i","referer":"https://www.sahabai.dev/","sec-ch-ua":";\"Not(A:Brand\";v=\"99\", \"Google Chrome\";v=\"133\", \"Chromium\";v=\"133\"","sec-ch-ua-mobile":"?0","sec-ch-ua-platform":"\"macOS\"","sec-fetch-dest":"empty","sec-fetch-mode":"cors","sec-fetch-site":"cross-site","x-forwarded-for":"47.187.213.159","x-forwarded-host":"sahabai-production.up.railway.app","x-forwarded-proto":"https","x-railway-edge":"railway/us-east4","x-railway-request-id":"ehKfQej7QXGOJ9nNNCVhGQ_1002618245","x-real-ip":"47.187.213.159","x-request-start":"1741550302509"}


sahabAI | Railway
