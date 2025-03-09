 

> rest-express@1.0.0 start

> NODE_ENV=production node dist/index.js

 

npm warn config production Use `--omit=dev` instead.

 

> rest-express@1.0.0 deploy

> npm run start

 

[2025-03-09T22:44:19.702Z] [DATABASE] Database connection test successful

[2025-03-09T22:44:19.702Z] [DATABASE] Database connection established successfully

[2025-03-09T22:44:19.762Z] [DATABASE] Database initialization complete

🔍 [SERVER INIT] Validating database schema...

[SCHEMA] Starting database schema validation

[SCHEMA] Checking if user_profiles table exists

[2025-03-09T22:44:20.205Z] [DATABASE] Database connection test successful

[2025-03-09T22:44:20.206Z] [DATABASE] Database connection established successfully

[POSTGRES] Connected to PostgreSQL database

[2025-03-09T22:44:20.251Z] [DATABASE] Connected to PostgreSQL database

[2025-03-09T22:44:20.279Z] [DATABASE] Database initialization complete

🔍 [SERVER INIT] Validating database schema...

[SCHEMA] Starting database schema validation

[SCHEMA] Checking if user_profiles table exists

[SCHEMA] user_profiles table exists

[SCHEMA] Checking for required columns in user_profiles table

[SCHEMA] Found columns: [

  'user_id',

  'created_at',

  'updated_at',

  'general_preferences',

  'privacy_settings',

  'usage_stats',

  'key_verification_hash'

]

🔍 [SERVER INIT] Running database migrations...

[MIGRATION] Starting migration process

[MIGRATION] Ensuring migrations table exists

[SCHEMA] Missing required columns in user_profiles table: preferences, sharing_preferences

⚠️ [SERVER INIT] Database schema validation failed. Running migrations...

[MIGRATION] Checking for previously applied migrations

[MIGRATION] Found 0 previously applied migrations

[MIGRATION] Error running migrations: ReferenceError: __dirname is not defined

    at runMigrations (file:///app/dist/index.js:5174:38)

    at process.processTicksAndRejections (node:internal/process/task_queues:105:5)

    at async initializeDatabaseWithMigrations (file:///app/dist/index.js:5365:5)

    at async startServer (file:///app/dist/index.js:5427:5)

❌ [SERVER INIT] Database initialization failed: ReferenceError: __dirname is not defined

    at runMigrations (file:///app/dist/index.js:5174:38)

    at process.processTicksAndRejections (node:internal/process/task_queues:105:5)

    at async initializeDatabaseWithMigrations (file:///app/dist/index.js:5365:5)

    at async startServer (file:///app/dist/index.js:5427:5)

❌ [SERVER INIT] Failed to start server: ReferenceError: __dirname is not defined

    at runMigrations (file:///app/dist/index.js:5174:38)

    at process.processTicksAndRejections (node:internal/process/task_queues:105:5)

    at async initializeDatabaseWithMigrations (file:///app/dist/index.js:5365:5)

    at async startServer (file:///app/dist/index.js:5427:5)

[2025-03-09T22:44:20.776Z] [DATABASE] Database module initialized: Using database storage

[POSTGRES] Initializing PostgreSQL connection pool
[POSTGRES] Database URL configured: Yes

[POSTGRES] Environment: production

[POSTGRES] PostgreSQL connection pool initialized successfully

[2025-03-09T22:44:20.793Z] [DATABASE] Database mode: PostgreSQL

🔵 [WIRD ROUTES] Initializing wird-routes.ts

[DATABASE] Using database storage

[WIRD ROUTER] Storage initialized successfully

🔵 [WIRD ROUTES] Registering routes:

🔵 [WIRD ROUTES] Registering POST /api/wirds/generate-suggestions route

Google OAuth Callback URL configured as: https://sahabai-production.up.railway.app/auth/google/callback

🔍 [SERVER INIT] Starting server initialization...

🔍 [SERVER INIT] Initialization timestamp: 2025-03-09T22:44:20.837Z

🔍 [SERVER INIT] Environment: production

🔍 [SERVER INIT] Initializing database...

[2025-03-09T22:44:20.837Z] [DATABASE] Starting database initialization...

(node:27) [DEP0040] DeprecationWarning: The `punycode` module is deprecated. Please use a userland alternative instead.

(Use `node --trace-deprecation ...` to show where the warning was created)

[2025-03-09T22:44:20.964Z] [DATABASE] Database connection test successful

[2025-03-09T22:44:20.964Z] [DATABASE] Database connection established successfully

[2025-03-09T22:44:20.977Z] [DATABASE] Database initialization complete

🔍 [SERVER INIT] Validating database schema...

[SCHEMA] Starting database schema validation

[SCHEMA] Checking if user_profiles table exists

[POSTGRES] Connected to PostgreSQL database

[2025-03-09T22:44:21.218Z] [DATABASE] Connected to PostgreSQL database

[SCHEMA] user_profiles table exists

[SCHEMA] Checking for required columns in user_profiles table

[SCHEMA] Found columns: [

  'user_id',

  'created_at',

  'updated_at',

  'general_preferences',

  'privacy_settings',

  'usage_stats',

  'key_verification_hash'

]

[SCHEMA] Missing required columns in user_profiles table: preferences, sharing_preferences

⚠️ [SERVER INIT] Database schema validation failed. Running migrations...

🔍 [SERVER INIT] Running database migrations...

[MIGRATION] Starting migration process

[MIGRATION] Ensuring migrations table exists

[MIGRATION] Checking for previously applied migrations

[MIGRATION] Found 0 previously applied migrations

[MIGRATION] Error running migrations: ReferenceError: __dirname is not defined

    at runMigrations (file:///app/dist/index.js:5174:38)

    at process.processTicksAndRejections (node:internal/process/task_queues:105:5)

    at async initializeDatabaseWithMigrations (file:///app/dist/index.js:5365:5)

    at async startServer (file:///app/dist/index.js:5427:5)

❌ [SERVER INIT] Database initialization failed: ReferenceError: __dirname is not defined

    at runMigrations (file:///app/dist/index.js:5174:38)

    at process.processTicksAndRejections (node:internal/process/task_queues:105:5)

    at async initializeDatabaseWithMigrations (file:///app/dist/index.js:5365:5)

    at async startServer (file:///app/dist/index.js:5427:5)

❌ [SERVER INIT] Failed to start server: ReferenceError: __dirname is not defined

    at runMigrations (file:///app/dist/index.js:5174:38)

    at process.processTicksAndRejections (node:internal/process/task_queues:105:5)

    at async initializeDatabaseWithMigrations (file:///app/dist/index.js:5365:5)

    at async startServer (file:///app/dist/index.js:5427:5)

npm warn config production Use `--omit=dev` instead.
[SCHEMA] Checking if user_profiles table exists

[2025-03-09T22:44:24.477Z] [DATABASE] Database module initialized: Using database storage

[POSTGRES] Initializing PostgreSQL connection pool

[POSTGRES] Database URL configured: Yes

[POSTGRES] Environment: production

[POSTGRES] PostgreSQL connection pool initialized successfully

[2025-03-09T22:44:24.493Z] [DATABASE] Database mode: PostgreSQL

🔵 [WIRD ROUTES] Initializing wird-routes.ts

[DATABASE] Using database storage

[WIRD ROUTER] Storage initialized successfully

🔵 [WIRD ROUTES] Registering routes:

🔵 [WIRD ROUTES] Registering POST /api/wirds/generate-suggestions route

Google OAuth Callback URL configured as: https://sahabai-production.up.railway.app/auth/google/callback

🔍 [SERVER INIT] Starting server initialization...

🔍 [SERVER INIT] Initialization timestamp: 2025-03-09T22:44:24.524Z

🔍 [SERVER INIT] Environment: production

🔍 [SERVER INIT] Initializing database...

[2025-03-09T22:44:24.524Z] [DATABASE] Starting database initialization...

(node:27) [DEP0040] DeprecationWarning: The `punycode` module is deprecated. Please use a userland alternative instead.

(Use `node --trace-deprecation ...` to show where the warning was created)

[2025-03-09T22:44:24.541Z] [DATABASE] Database module initialized: Using database storage

[POSTGRES] Initializing PostgreSQL connection pool

[POSTGRES] Database URL configured: Yes

[POSTGRES] Environment: production

[POSTGRES] PostgreSQL connection pool initialized successfully

[2025-03-09T22:44:24.557Z] [DATABASE] Database mode: PostgreSQL

🔵 [WIRD ROUTES] Initializing wird-routes.ts

[DATABASE] Using database storage

[WIRD ROUTER] Storage initialized successfully

🔵 [WIRD ROUTES] Registering routes:

🔵 [WIRD ROUTES] Registering POST /api/wirds/generate-suggestions route

Google OAuth Callback URL configured as: https://sahabai-production.up.railway.app/auth/google/callback

🔍 [SERVER INIT] Starting server initialization...

🔍 [SERVER INIT] Initialization timestamp: 2025-03-09T22:44:24.574Z

🔍 [SERVER INIT] Environment: production

🔍 [SERVER INIT] Initializing database...

[2025-03-09T22:44:24.574Z] [DATABASE] Starting database initialization...

(node:27) [DEP0040] DeprecationWarning: The `punycode` module is deprecated. Please use a userland alternative instead.

(Use `node --trace-deprecation ...` to show where the warning was created)

[2025-03-09T22:44:24.696Z] [DATABASE] Database connection test successful

[2025-03-09T22:44:24.696Z] [DATABASE] Database connection established successfully

[2025-03-09T22:44:24.716Z] [DATABASE] Database initialization complete

🔍 [SERVER INIT] Validating database schema...

[SCHEMA] Starting database schema validation

[SCHEMA] Checking if user_profiles table exists

[2025-03-09T22:44:24.875Z] [DATABASE] Database connection test successful

[2025-03-09T22:44:24.875Z] [DATABASE] Database connection established successfully

[POSTGRES] Connected to PostgreSQL database

[2025-03-09T22:44:24.903Z] [DATABASE] Connected to PostgreSQL database

[SCHEMA] user_profiles table exists

[2025-03-09T22:44:24.949Z] [DATABASE] Database initialization complete

🔍 [SERVER INIT] Validating database schema...

[SCHEMA] Starting database schema validation

[SCHEMA] Checking if user_profiles table exists

  'user_id',

  'created_at',

  'updated_at',

  'privacy_settings',

  'usage_stats',

🔍 [SERVER INIT] Running database migrations...

[MIGRATION] Ensuring migrations table exists

[MIGRATION] Checking for previously applied migrations

[MIGRATION] Error running migrations: ReferenceError: __dirname is not defined

❌ [SERVER INIT] Database initialization failed: ReferenceError: __dirname is not defined

    at runMigrations (file:///app/dist/index.js:5174:38)

    at process.processTicksAndRejections (node:internal/process/task_queues:105:5)

    at async startServer (file:///app/dist/index.js:5427:5)

    at runMigrations (file:///app/dist/index.js:5174:38)

    at async initializeDatabaseWithMigrations (file:///app/dist/index.js:5365:5)

    at async startServer (file:///app/dist/index.js:5427:5)
      'key_verification_hash'

]

[SCHEMA] Missing required columns in user_profiles table: preferences, sharing_preferences

⚠️ [SERVER INIT] Database schema validation failed. Running migrations...

🔍 [SERVER INIT] Running database migrations...

[MIGRATION] Starting migration process

[MIGRATION] Ensuring migrations table exists

[MIGRATION] Checking for previously applied migrations

> rest-express@1.0.0 deploy

> npm run start

 

npm warn config production Use `--omit=dev` instead.

 

> rest-express@1.0.0 start

> NODE_ENV=production node dist/index.js

 

npm warn config production Use `--omit=dev` instead.

 

> rest-express@1.0.0 deploy

> npm run start

 

npm warn config production Use `--omit=dev` instead.

 

> rest-express@1.0.0 start

> NODE_ENV=production node dist/index.js

 

npm warn config production Use `--omit=dev` instead.

 

> rest-express@1.0.0 deploy

> npm run start

 

npm warn config production Use `--omit=dev` instead.

 

> rest-express@1.0.0 start

> NODE_ENV=production node dist/index.js

 

[2025-03-09T22:44:27.725Z] [DATABASE] Database connection test successful

[2025-03-09T22:44:27.726Z] [DATABASE] Database connection established successfully

[2025-03-09T22:44:27.813Z] [DATABASE] Database initialization complete

🔍 [SERVER INIT] Validating database schema...

[SCHEMA] Starting database schema validation

[SCHEMA] Checking if user_profiles table exists

[POSTGRES] Connected to PostgreSQL database

[2025-03-09T22:44:28.284Z] [DATABASE] Connected to PostgreSQL database

[SCHEMA] user_profiles table exists

[SCHEMA] Checking for required columns in user_profiles table

[2025-03-09T22:44:28.393Z] [DATABASE] Database module initialized: Using database storage

[POSTGRES] Initializing PostgreSQL connection pool

[POSTGRES] Database URL configured: Yes

[POSTGRES] Environment: production

[POSTGRES] PostgreSQL connection pool initialized successfully

[2025-03-09T22:44:28.412Z] [DATABASE] Database mode: PostgreSQL

🔵 [WIRD ROUTES] Initializing wird-routes.ts
  'key_verification_hash'

]

[SCHEMA] Missing required columns in user_profiles table: preferences, sharing_preferences

⚠️ [SERVER INIT] Database schema validation failed. Running migrations...

🔍 [SERVER INIT] Running database migrations...

[MIGRATION] Starting migration process

[MIGRATION] Ensuring migrations table exists

🔍 [SERVER INIT] Starting server initialization...

🔍 [SERVER INIT] Initialization timestamp: 2025-03-09T22:44:28.431Z

🔍 [SERVER INIT] Environment: production

🔍 [SERVER INIT] Initializing database...

[2025-03-09T22:44:28.431Z] [DATABASE] Starting database initialization...

(node:27) [DEP0040] DeprecationWarning: The `punycode` module is deprecated. Please use a userland alternative instead.

(Use `node --trace-deprecation ...` to show where the warning was created)

[MIGRATION] Checking for previously applied migrations

[MIGRATION] Found 0 previously applied migrations

[MIGRATION] Error running migrations: ReferenceError: __dirname is not defined

    at runMigrations (file:///app/dist/index.js:5174:38)

    at process.processTicksAndRejections (node:internal/process/task_queues:105:5)

    at async initializeDatabaseWithMigrations (file:///app/dist/index.js:5365:5)

    at async startServer (file:///app/dist/index.js:5427:5)

❌ [SERVER INIT] Database initialization failed: ReferenceError: __dirname is not defined

    at runMigrations (file:///app/dist/index.js:5174:38)

    at process.processTicksAndRejections (node:internal/process/task_queues:105:5)

    at async initializeDatabaseWithMigrations (file:///app/dist/index.js:5365:5)

    at async startServer (file:///app/dist/index.js:5427:5)

❌ [SERVER INIT] Failed to start server: ReferenceError: __dirname is not defined

    at runMigrations (file:///app/dist/index.js:5174:38)

    at process.processTicksAndRejections (node:internal/process/task_queues:105:5)

    at async initializeDatabaseWithMigrations (file:///app/dist/index.js:5365:5)

    at async startServer (file:///app/dist/index.js:5427:5)

[2025-03-09T22:44:28.560Z] [DATABASE] Database connection test successful

[2025-03-09T22:44:28.561Z] [DATABASE] Database connection established successfully

[2025-03-09T22:44:28.559Z] [DATABASE] Database module initialized: Using database storage

[POSTGRES] Initializing PostgreSQL connection pool

[POSTGRES] Database URL configured: Yes

[POSTGRES] Environment: production

[POSTGRES] PostgreSQL connection pool initialized successfully

[2025-03-09T22:44:28.575Z] [DATABASE] Database mode: PostgreSQL

[2025-03-09T22:44:28.580Z] [DATABASE] Database initialization complete

🔍 [SERVER INIT] Validating database schema...

[SCHEMA] Starting database schema validation

[SCHEMA] Checking if user_profiles table exists

🔵 [WIRD ROUTES] Initializing wird-routes.ts

[DATABASE] Using database storage

[WIRD ROUTER] Storage initialized successfully

🔵 [WIRD ROUTES] Registering routes:

🔵 [WIRD ROUTES] Registering POST /api/wirds/generate-suggestions route

Google OAuth Callback URL configured as: https://sahabai-production.up.railway.app/auth/google/callback

🔍 [SERVER INIT] Starting server initialization...

🔍 [SERVER INIT] Initialization timestamp: 2025-03-09T22:44:28.593Z

🔍 [SERVER INIT] Environment: production

🔍 [SERVER INIT] Initializing database...

[2025-03-09T22:44:28.593Z] [DATABASE] Starting database initialization...

(node:27) [DEP0040] DeprecationWarning: The `punycode` module is deprecated. Please use a userland alternative instead.

(Use `node --trace-deprecation ...` to show where the warning was created)

[POSTGRES] Connected to PostgreSQL database

[2025-03-09T22:44:28.753Z] [DATABASE] Connected to PostgreSQL database

[SCHEMA] user_profiles table exists

[SCHEMA] Checking for required columns in user_profiles table


  'created_at',

  'updated_at',

  'general_preferences',

  'privacy_settings',

  'usage_stats',

  'key_verification_hash'

]

🔍 [SERVER INIT] Running database migrations...

[SCHEMA] Missing required columns in user_profiles table: preferences, sharing_preferences

⚠️ [SERVER INIT] Database schema validation failed. Running migrations...

[MIGRATION] Starting migration process

[MIGRATION] Ensuring migrations table exists

[MIGRATION] Checking for previously applied migrations

[MIGRATION] Found 0 previously applied migrations

[MIGRATION] Error running migrations: ReferenceError: __dirname is not defined

    at runMigrations (file:///app/dist/index.js:5174:38)

    at process.processTicksAndRejections (node:internal/process/task_queues:105:5)

    at async initializeDatabaseWithMigrations (file:///app/dist/index.js:5365:5)

    at async startServer (file:///app/dist/index.js:5427:5)

❌ [SERVER INIT] Database initialization failed: ReferenceError: __dirname is not defined

    at runMigrations (file:///app/dist/index.js:5174:38)

    at process.processTicksAndRejections (node:internal/process/task_queues:105:5)

    at async initializeDatabaseWithMigrations (file:///app/dist/index.js:5365:5)

    at async startServer (file:///app/dist/index.js:5427:5)

❌ [SERVER INIT] Failed to start server: ReferenceError: __dirname is not defined

    at runMigrations (file:///app/dist/index.js:5174:38)

    at process.processTicksAndRejections (node:internal/process/task_queues:105:5)

    at async initializeDatabaseWithMigrations (file:///app/dist/index.js:5365:5)

    at async startServer (file:///app/dist/index.js:5427:5)

[2025-03-09T22:44:28.980Z] [DATABASE] Database connection test successful

[2025-03-09T22:44:28.980Z] [DATABASE] Database connection established successfully

[2025-03-09T22:44:29.031Z] [DATABASE] Database initialization complete

🔍 [SERVER INIT] Validating database schema...

[SCHEMA] Starting database schema validation

[SCHEMA] Checking if user_profiles table exists

[POSTGRES] Connected to PostgreSQL database

[2025-03-09T22:44:29.559Z] [DATABASE] Connected to PostgreSQL database

[SCHEMA] user_profiles table exists

[SCHEMA] Checking for required columns in user_profiles table

[SCHEMA] Found columns: [

  'user_id',

  'created_at',

  'updated_at',

  'general_preferences',

  'privacy_settings',

  'usage_stats',

  'key_verification_hash'

]

[SCHEMA] Missing required columns in user_profiles table: preferences, sharing_preferences

⚠️ [SERVER INIT] Database schema validation failed. Running migrations...

🔍 [SERVER INIT] Running database migrations...

[MIGRATION] Starting migration process

[MIGRATION] Ensuring migrations table exists

[MIGRATION] Checking for previously applied migrations

[MIGRATION] Found 0 previously applied migrations

[MIGRATION] Error running migrations: ReferenceError: __dirname is not defined

    at runMigrations (file:///app/dist/index.js:5174:38)

    at process.processTicksAndRejections (node:internal/process/task_queues:105:5)

    at async initializeDatabaseWithMigrations (file:///app/dist/index.js:5365:5)

    at async startServer (file:///app/dist/index.js:5427:5)

❌ [SERVER INIT] Database initialization failed: ReferenceError: __dirname is not defined

    at runMigrations (file:///app/dist/index.js:5174:38)

    at process.processTicksAndRejections (node:internal/process/task_queues:105:5)


[POSTGRES] Environment: production

[POSTGRES] PostgreSQL connection pool initialized successfully

[2025-03-09T22:44:31.846Z] [DATABASE] Database mode: PostgreSQL

🔵 [WIRD ROUTES] Initializing wird-routes.ts

[DATABASE] Using database storage

[WIRD ROUTER] Storage initialized successfully

🔵 [WIRD ROUTES] Registering routes:

🔵 [WIRD ROUTES] Registering POST /api/wirds/generate-suggestions route

Google OAuth Callback URL configured as: https://sahabai-production.up.railway.app/auth/google/callback

🔍 [SERVER INIT] Starting server initialization...

🔍 [SERVER INIT] Initialization timestamp: 2025-03-09T22:44:31.882Z

🔍 [SERVER INIT] Environment: production

🔍 [SERVER INIT] Initializing database...

[2025-03-09T22:44:31.882Z] [DATABASE] Starting database initialization...

(node:27) [DEP0040] DeprecationWarning: The `punycode` module is deprecated. Please use a userland alternative instead.

(Use `node --trace-deprecation ...` to show where the warning was created)

[2025-03-09T22:44:32.047Z] [DATABASE] Database connection test successful

[2025-03-09T22:44:32.047Z] [DATABASE] Database connection established successfully

[2025-03-09T22:44:32.065Z] [DATABASE] Database initialization complete

🔍 [SERVER INIT] Validating database schema...

[SCHEMA] Starting database schema validation

[SCHEMA] Checking if user_profiles table exists

[POSTGRES] Connected to PostgreSQL database

[2025-03-09T22:44:32.290Z] [DATABASE] Connected to PostgreSQL database

[SCHEMA] user_profiles table exists

[SCHEMA] Checking for required columns in user_profiles table

[SCHEMA] Found columns: [

  'user_id',

  'created_at',

  'updated_at',

  'general_preferences',

  'privacy_settings',

  'usage_stats',

  'key_verification_hash'

]

[SCHEMA] Missing required columns in user_profiles table: preferences, sharing_preferences

⚠️ [SERVER INIT] Database schema validation failed. Running migrations...

🔍 [SERVER INIT] Running database migrations...

[MIGRATION] Starting migration process

[MIGRATION] Ensuring migrations table exists

[MIGRATION] Checking for previously applied migrations

[MIGRATION] Found 0 previously applied migrations

[MIGRATION] Error running migrations: ReferenceError: __dirname is not defined

    at runMigrations (file:///app/dist/index.js:5174:38)

    at process.processTicksAndRejections (node:internal/process/task_queues:105:5)

    at async initializeDatabaseWithMigrations (file:///app/dist/index.js:5365:5)

    at async startServer (file:///app/dist/index.js:5427:5)

❌ [SERVER INIT] Database initialization failed: ReferenceError: __dirname is not defined

    at runMigrations (file:///app/dist/index.js:5174:38)

    at process.processTicksAndRejections (node:internal/process/task_queues:105:5)

    at async initializeDatabaseWithMigrations (file:///app/dist/index.js:5365:5)

    at async startServer (file:///app/dist/index.js:5427:5)

❌ [SERVER INIT] Failed to start server: ReferenceError: __dirname is not defined

    at runMigrations (file:///app/dist/index.js:5174:38)

    at process.processTicksAndRejections (node:internal/process/task_queues:105:5)

    at async initializeDatabaseWithMigrations (file:///app/dist/index.js:5365:5)

    at async startServer (file:///app/dist/index.js:5427:5)

[2025-03-09T22:44:32.654Z] [DATABASE] Database module initialized: Using database storage

[POSTGRES] Initializing PostgreSQL connection pool

[POSTGRES] Database URL configured: Yes

[POSTGRES] Environment: production

[POSTGRES] PostgreSQL connection pool initialized successfully

[2025-03-09T22:44:32.669Z] [DATABASE] Database mode: PostgreSQL

🔵 [WIRD ROUTES] Initializing wird-routes.ts
[2025-03-09T22:45:38.456Z] [DATABASE] Connected to PostgreSQL database

[SCHEMA] user_profiles table exists

[SCHEMA] Checking for required columns in user_profiles table

[SCHEMA] Found columns: [

  'user_id',

  'created_at',

  'updated_at',

  'general_preferences',

  'privacy_settings',

  'usage_stats',

  'key_verification_hash'

]

[SCHEMA] Missing required columns in user_profiles table: preferences, sharing_preferences

⚠️ [SERVER INIT] Database schema validation failed. Running migrations...

🔍 [SERVER INIT] Running database migrations...

[MIGRATION] Starting migration process

[MIGRATION] Ensuring migrations table exists

[MIGRATION] Checking for previously applied migrations

[MIGRATION] Found 0 previously applied migrations

[MIGRATION] Error running migrations: ReferenceError: __dirname is not defined

    at runMigrations (file:///app/dist/index.js:5174:38)

    at process.processTicksAndRejections (node:internal/process/task_queues:105:5)

    at async initializeDatabaseWithMigrations (file:///app/dist/index.js:5365:5)

    at async startServer (file:///app/dist/index.js:5427:5)

❌ [SERVER INIT] Database initialization failed: ReferenceError: __dirname is not defined

    at runMigrations (file:///app/dist/index.js:5174:38)

    at process.processTicksAndRejections (node:internal/process/task_queues:105:5)

    at async initializeDatabaseWithMigrations (file:///app/dist/index.js:5365:5)

    at async startServer (file:///app/dist/index.js:5427:5)

❌ [SERVER INIT] Failed to start server: ReferenceError: __dirname is not defined

    at runMigrations (file:///app/dist/index.js:5174:38)

    at process.processTicksAndRejections (node:internal/process/task_queues:105:5)

    at async initializeDatabaseWithMigrations (file:///app/dist/index.js:5365:5)

    at async startServer (file:///app/dist/index.js:5427:5)