# Database Environments & Workflows

Overview
--------
This document describes the database architecture, environment purposes, migration and seed processes, safety rules, and developer/QA workflows for the Mokshith B2B platform.

Environments (database names)
- Development (local): mokshith-dev
- QA / Playwright: mokshith-qa
- UAT: mokshith-uat
- Production: mokshith-production

Environment files
- `.env.development` → NODE_ENV=development, APP_DATABASE_NAME=mokshith-dev
- `.env.qa` → NODE_ENV=qa, APP_DATABASE_NAME=mokshith-qa
- `.env.uat` → NODE_ENV=uat, APP_DATABASE_NAME=mokshith-uat
- Environment variables in Render (production) → APP_DATABASE_NAME=mokshith-production

Database architecture
---------------------
- MongoDB Atlas is the primary data store. Applications connect via MONGO_URI or MONGO_URI_DIRECT.
- Mongoose models are the source of truth for collection schemas and indexes.
- Safety guards exist in `src/config/db.js` to block `dropDatabase()` or collection.drop in production.

Migration & Init Process
------------------------
1. `npm run db:init`
   - Connects to the configured MongoDB.
   - Imports all model files under `src/modules/**` and `src/models/**`.
   - Calls `createIndexes()` for each model so required indexes are built idempotently.
   - Upserts baseline settings & feature flags (non-destructive).
   - Aborts when connected to `mokshith-production`.

Seed Process (QA / UAT)
-----------------------
1. `npm run db:seed:qa`
   - Idempotent upserts for deterministic baseline data: Super Admin, Admin, Vendors, Delivery Partners, Customers, Companies, Categories, Products, Inventory.
   - Seeds platform settings, feature flags, tax & shipping configs, roles/permissions (stored in settings for QA visibility), notification templates.
   - Seeds representative orders (pending, confirmed, packed, shipped, delivered, cancelled) and associated payments (COD / Razorpay success / failure) and invoices/logistics entries.
   - Aborts if APP_DATABASE_NAME === `mokshith-production`.

Reset Process & Safety
----------------------
- Destructive scripts (full reset, mass delete) are intentionally moved to `dangerous-dev-tools/` and require:
  - NODE_ENV !== 'production'
  - DESTRUCTIVE_CONFIRM environment variable set to specific token
  - Interactive confirmation when executed directly
- Centralized assertions are in `src/utils/destructiveGuard.js`:
  - `assertDestructiveOperationAllowed()` enforces confirmations and blocks production.
  - `assertExpectedApplicationDatabase()` ensures the script targets allowed DBs per NODE_ENV.
  - `assertProductionSafe()` throws if production detected.
- `src/config/db.js` patches concrete MongoDB handles to prevent drop operations in production as an additional safeguard.

Developer workflow
------------------
1. Local development:
   - Use `.env.development` and the mokshith-dev database (or USE_IN_MEMORY_MONGO=true).
   - Run `npm run db:init` to ensure indexes & baseline settings.
   - Optionally run `npm run db:seed:qa` against a local dev DB for sample data (safe).

2. QA:
   - Use `.env.qa` with mokshith-qa DB.
   - Run `npm run db:init` then `npm run db:seed:qa`.
   - Confirm seeded accounts and representative orders exist.

3. UAT:
   - Use `.env.uat` with mokshith-uat DB.
   - Similar to QA.

4. Production (Render):
   - Configure environment variables securely (do NOT add secrets to repo).
   - Do NOT run seed or reset scripts. Production checks prevent accidental runs.

Playwright workflow (QA)
------------------------
1. Ensure `mokshith-qa` is provisioned and accessible from Playwright runners.
2. Run `npm run db:init` (non-destructive).
3. Run `npm run db:seed:qa` to populate deterministic baseline.
4. Run Playwright smoke/regression suites against the QA environment.

Safety rules
------------
- Never run destructive scripts against `mokshith-production`.
- Scripts must be idempotent (upserts, createIndexes).
- Use `APP_DATABASE_NAME` and NODE_ENV checks before any operation that may change substantial data.
- Keep dangerous scripts out of normal scripts and require explicit confirmation.

Monitoring & Auditing
---------------------
- All seed/init scripts log actions via the application's logger.
- Audit collection captures registration and important events.

Contact / Runbook
-----------------
- For assistance, contact platform engineering.
- To provision QA DB: create cluster/db in Atlas named `mokshith-qa` and set MONGO_URI in `.env.qa` or CI secrets.

