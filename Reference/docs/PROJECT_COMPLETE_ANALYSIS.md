# PROJECT COMPLETE ANALYSIS — Mokshith Enterprises B2B Platform

**Audit Date:** June 11, 2026  
**Repository:** `c:\Users\USER\Mokshith-Entreprises`  
**Remote:** `https://github.com/Subhashande/Mokshith-Entreprises.git`  
**Current Branch:** `feature/frontendUI`  
**Total Tracked Files (excl. node_modules):** ~811  
**Auditor Scope:** Full repository — root, `b2b-backend`, `b2b-frontend`

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Repository Structure](#2-repository-structure)
3. [Technology Stack](#3-technology-stack)
4. [Architecture Overview](#4-architecture-overview)
5. [Folder-by-Folder Analysis](#5-folder-by-folder-analysis)
6. [File-by-File Analysis](#6-file-by-file-analysis)
7. [Database Documentation](#7-database-documentation)
8. [API Documentation](#8-api-documentation)
9. [Business Workflows](#9-business-workflows)
10. [Frontend Analysis](#10-frontend-analysis)
11. [Backend Analysis](#11-backend-analysis)
12. [Security Audit](#12-security-audit)
13. [Performance Audit](#13-performance-audit)
14. [Testing Audit](#14-testing-audit)
15. [DevOps Audit](#15-devops-audit)
16. [Feature Inventory](#16-feature-inventory)
17. [Quality Assessment](#17-quality-assessment)
18. [Strengths](#18-strengths)
19. [Weaknesses](#19-weaknesses)
20. [Risks](#20-risks)
21. [Missing Features](#21-missing-features)
22. [Recommendations](#22-recommendations)
23. [Final Verdict](#23-final-verdict)

---

## 1. Executive Summary

**Mokshith Enterprises** is a B2B/B2C wholesale e-commerce platform implemented as a **two-app monorepo** without workspace tooling. It consists of:

- **`b2b-backend`** — Node.js/Express 5 REST API with MongoDB, Redis, BullMQ, Socket.IO, Razorpay payments, and layered security
- **`b2b-frontend`** — React 19 SPA built with Vite 8, Redux Toolkit, Tailwind CSS v4, deployed to Vercel

The platform supports six user roles (`SUPER_ADMIN`, `ADMIN`, `VENDOR`, `B2B_CUSTOMER`, `B2C_CUSTOMER`, `DELIVERY_PARTNER`) across catalog browsing, cart/checkout, credit-based purchasing, Razorpay online payments, inventory management, logistics/delivery, analytics, and super-admin platform governance.

### Key Findings

| Area | Status | Score |
|------|--------|-------|
| Architecture | Layered modular monolith — well-structured backend | 7/10 |
| Backend | Production-grade patterns (idempotency, locks, queues) | 8/10 |
| Frontend | Feature-rich but incomplete routing and test wiring | 6/10 |
| Security | Strong middleware stack; some inconsistencies | 7/10 |
| Testing | Backend: extensive; Frontend: configured but not CI-wired | 6/10 |
| DevOps | Split CI pipelines; missing Dockerfile/docker-compose | 5/10 |
| Documentation | Backend excellent; root-level absent | 6/10 |

### Critical Gaps

1. **No root README or workspace orchestration** — developers must navigate two independent apps
2. **Missing `Dockerfile`** referenced in nested CI workflow
3. **Frontend `npm test` is a no-op stub** — 39 Vitest files never run in CI
4. **Unmounted backend routes** — `audit.routes.js`, `health.routes.js`
5. **Orphan frontend pages** — Invoice, Notification, Search, Offers, Shipment tracking unrouted
6. **Dual auth patterns** on backend (`protect`/`authorize` vs `authenticate`/`requirePermission`)
7. **`.env` files present locally** — must never be committed (currently untracked but on disk)

---

## 2. Repository Structure

### 2.1 Repository Map

```
Mokshith-Entreprises/                    # Git umbrella (no root package.json)
├── .github/workflows/
│   ├── backend-ci.yml                   # Active: lint, unit, integration, e2e, build, security
│   └── frontend-ci.yml                  # Active: lint, build, stub test, security
├── .gitignore                           # Shared ignore (includes **/package-lock.json)
│
├── b2b-backend/                         # Express 5 API (~430 source files)
│   ├── server.js                        # Entry: DB, Redis, Socket.IO, cron, workers
│   ├── seed.js / scripts/             # Database seeding
│   ├── src/
│   │   ├── app.js                       # Express assembly + middleware chain
│   │   ├── config/                      # 13 config modules
│   │   ├── constants/                   # 15 enum/constant files
│   │   ├── controllers/                 # Health controller
│   │   ├── docs/                        # OpenAPI, Postman, guidelines
│   │   ├── errors/                      # 7 custom error classes
│   │   ├── jobs/                        # 8 cron jobs
│   │   ├── middlewares/                 # 22 middleware files
│   │   ├── models/                      # RefreshToken (global)
│   │   ├── modules/                     # 27 feature modules (~171 files)
│   │   ├── queues/                      # 6 BullMQ queues
│   │   ├── routes/                      # v1, v2, health, index
│   │   ├── services/                    # 21 shared services
│   │   ├── utils/                       # 16 utility files
│   │   ├── validations/                 # Shared Joi schemas
│   │   └── workers/                     # 3 worker files
│   ├── tests/                           # unit (9), integration (28), e2e (2), load (14)
│   ├── code-guide/                      # 16 engineering docs
│   ├── ProjectDetails/                  # 5 legacy planning docs
│   └── .github/workflows/ci-cd.yml      # Legacy CI (references missing Dockerfile)
│
└── b2b-frontend/                        # React SPA (~297 source files)
    ├── index.html / index.css           # Vite entry
    ├── src/
    │   ├── app/                         # Redux store
    │   ├── components/                  # common, layout, ui, charts, feedback
    │   ├── config/                      # env, sentry, security headers
    │   ├── context/                     # Notification, Socket, Auth (unused), Theme
    │   ├── hooks/                       # 7 global hooks
    │   ├── modules/                     # 24 feature modules
    │   ├── routes/                      # AppRoutes, routeConfig, guards
    │   ├── services/                    # apiClient, storage, websocket
    │   ├── utils/                       # formatters, validators, token
    │   └── __tests__/                   # 39 Vitest test files
    ├── e2e/                             # 3 Playwright specs
    ├── public/                          # manifest, robots, sitemap
    ├── FrontEndDetails/                 # 5 planning docs
    └── vercel.json                      # SPA rewrite rules
```

### 2.2 Monorepo Characteristics

| Property | Value |
|----------|-------|
| Type | Folder-based monorepo (no npm/pnpm workspaces) |
| Apps | 2 (backend API + frontend SPA) |
| Shared packages | None |
| Root orchestration | `.gitignore` + path-filtered GitHub Actions only |
| Local full-stack dev | Manual — start backend (port 5000) + frontend (port 5173) separately |

---

## 3. Technology Stack

### 3.1 Backend (`b2b-backend`)

| Layer | Technology | Version |
|-------|-----------|---------|
| Runtime | Node.js (ESM) | — |
| Framework | Express | 5.2.1 |
| Database | MongoDB via Mongoose | 9.6.2 |
| Cache / Locks | Redis (ioredis + redis) | 5.5 / 6.0 |
| Job Queues | BullMQ | 5.41.6 |
| Auth | JWT, bcryptjs, @otplib (2FA) | — |
| Payments | Razorpay | 2.9.6 |
| File Storage | Local + optional AWS S3 | @aws-sdk/client-s3 3.1057 |
| Real-time | Socket.IO + Redis adapter | 4.8.3 |
| Validation | Joi | 17.13.3 |
| Security | Helmet, express-rate-limit, custom sanitizers, CSRF | — |
| Observability | Winston, Sentry | 3.17 / 10.55 |
| PDF | PDFKit | 0.18.0 |
| Cron | node-cron | 4.2.1 |
| Testing | Jest, Supertest, mongodb-memory-server | 30.4 / 7.0 |

### 3.2 Frontend (`b2b-frontend`)

| Layer | Technology | Version |
|-------|-----------|---------|
| UI Framework | React | 19.2.5 |
| Routing | react-router-dom | 7.14.1 |
| State | Redux Toolkit + react-redux | 2.11.2 / 9.2.0 |
| HTTP | Axios (central apiClient) | 1.15.1 |
| Real-time | socket.io-client | 4.8.3 |
| Icons | lucide-react | 1.8.0 |
| Build | Vite | 8.0.8 |
| CSS | Tailwind CSS v4 | @tailwindcss/postcss 4.2.4 |
| Error Tracking | @sentry/react | 10.55.0 |
| Unit Tests | Vitest + Testing Library | 4.1.7 |
| E2E | Playwright (configured, not in package.json deps) | — |
| Payments | Razorpay checkout.js (CDN in index.html) | — |
| Deploy | Vercel (vercel.json SPA rewrites) | — |

### 3.3 External Services & Integrations

| Service | Purpose | Config |
|---------|---------|--------|
| MongoDB Atlas / local MongoDB | Primary data store | `MONGO_URI` |
| Redis | Cache, rate limits, locks, queues, Socket.IO adapter | `REDIS_HOST`, `REDIS_PORT` |
| Razorpay | Payment gateway + webhooks | `RAZORPAY_KEY_ID/SECRET/WEBHOOK_SECRET` |
| AWS S3 (optional) | File uploads | `USE_S3_STORAGE`, `S3_*` vars |
| Sentry | Error tracking (both apps) | `SENTRY_DSN`, `VITE_SENTRY_DSN` |
| Render | Backend production host | Hardcoded in CORS + apiClient fallback |
| Vercel | Frontend production host | `vercel.json`, CORS whitelist |
| Cloudflare CDN (optional) | Image optimization/purge | `CDN_*`, `CLOUDFLARE_*` |

### 3.4 Authentication Mechanism

- **Backend:** JWT access tokens (15 min) + DB-backed refresh token rotation (`RefreshToken` model with family revocation)
- **Transport:** `Authorization: Bearer <token>` + double-submit CSRF cookie (`x-csrf-token` header)
- **2FA:** TOTP via `@otplib` with QR codes and backup codes
- **Frontend:** Redux `authSlice` + localStorage persistence; auto-refresh on 401 via `apiClient` interceptor
- **Roles:** 6 roles with RBAC permission map (`constants/permissions.js`)

---

## 4. Architecture Overview

### 4.1 Architecture Pattern

**Backend:** Layered Modular Monolith with feature-based modules

```
Request → Global Middleware Chain → Route → Module Middleware → Controller → Service → Repository → MongoDB
                                                                              ↓
                                                                         Redis / BullMQ / S3 / Razorpay
```

**Frontend:** Feature-based SPA with Redux + React Context

```
Browser → React Router → Layout → Page → Hook → Service → apiClient (Axios) → Backend API
                              ↓
                         Redux Store + SocketContext
```

### 4.2 Request Flow (Backend)

```
1. Sentry request handler
2. Correlation ID middleware
3. Monitoring middleware (timing)
4. Compression
5. CORS (whitelist + Vercel fallback)
6. IP block middleware (dynamic from settings)
7. Timeout (30s)
8. Security (Helmet CSP/HSTS + mongoSanitize + xssSanitize + apiLimiter)
9. cookieParser
10. Body parsers (10mb limit)
11. Morgan + requestLogger
12. Idempotency middleware (Redis)
13. Routes (/api/v1/*, /api/v2/*, /uploads/*)
14. notFound → Sentry error handler → errorHandler
```

### 4.3 Authentication Flow

```
Register/Login → bcrypt verify → [2FA gate if enabled] → JWT access + refresh token (DB)
     ↓
Client stores tokens in localStorage + Redux
     ↓
Authenticated requests: Bearer token + CSRF header
     ↓
401 → refresh-token endpoint → rotate tokens → retry queued requests
     ↓
Refresh reuse detected → revoke entire token family → force re-login
```

### 4.4 Authorization Flow

Two parallel systems coexist:

1. **Legacy:** `protect` + `authorize('ADMIN', ...)` — simple role string match
2. **RBAC:** `authenticate` + `requireRole` + `requirePermission` + `requireOwnershipOr`

`SUPER_ADMIN` bypasses all permission checks. Maintenance mode blocks non-super-admin at auth + order creation.

### 4.5 Database Flow

```
Mongoose.connect(MONGO_URI) → connection pool (2-10)
     ↓
Replica set detection → enables MongoDB transactions
     ↓
Repository layer → Model queries with soft-delete filters
     ↓
Optimistic locking (inventory.version), TTL indexes (RefreshToken.expiresAt)
```

### 4.6 State Management (Frontend)

| Layer | Mechanism | Persisted |
|-------|-----------|-----------|
| Auth | Redux `authSlice` | localStorage (token, refreshToken, csrfToken, user) |
| Cart | Redux `orderSlice` | localStorage (`mokshith_b2b_cart`) |
| Products | Redux `productSlice` | Session only |
| Admin/SuperAdmin | Redux slices | Session only |
| Toasts | NotificationContext | Ephemeral |
| Real-time | SocketContext | Connection state only |
| Feature flags | `useSystemConfig` hook | Fetched from `/settings/public/config` |

### 4.7 Error Handling Strategy

**Backend:** Custom error classes (`AppError`, `PaymentError`, etc.) → global `errorHandler` middleware sanitizes production 500s, maps Mongoose/JWT/Multer errors.

**Frontend:** `apiClient` interceptor handles 401 refresh; `ErrorBoundary` catches React errors; Sentry captures runtime exceptions.

### 4.8 Scalability Approach

- Horizontal: Redis adapter for Socket.IO, Redis-backed rate limiting, BullMQ workers
- Vertical: MongoDB connection pooling, response caching (Redis, 300-600s TTL)
- Concurrency: Distributed locks (payment), optimistic locking (inventory), idempotency keys (orders)
- **Limitation:** No container orchestration configs in repo; single-process workers

---

## 5. Folder-by-Folder Analysis

### 5.1 Root (`/`)

| Folder/File | Purpose | Architectural Role |
|-------------|---------|---------------------|
| `.github/workflows/` | Split CI/CD for backend and frontend | DevOps orchestration |
| `.gitignore` | Global ignore rules (includes lockfiles) | Repo hygiene |
| `PROJECT_COMPLETE_ANALYSIS.md` | This audit document | Documentation |

**No root README, package.json, Docker, or workspace config.**

### 5.2 `b2b-backend/` — Top Level

| Folder/File | Purpose |
|-------------|---------|
| `server.js` | Application bootstrap: env validation, DB/Redis connect, HTTP server, Socket.IO, cron, workers, graceful shutdown |
| `seed.js` | Root-level database seed entry |
| `package.json` | Dependencies and test/lint scripts |
| `jest.config.js` | Jest config with 80-90% coverage thresholds |
| `nodemon.json` | Dev hot-reload config |
| `eslint.config.js` / `.prettierrc` | Code quality |
| `.husky/pre-commit` | Git hooks via lint-staged |
| `scripts/` | `backup.js`, `cleanup.js`, `migrate.js`, `seed.js` — ops utilities |
| `logs/` | Runtime log files (access, error, combined) |
| `uploads/` | Generated invoice PDFs and product images |
| `code-guide/` | 16 internal engineering docs |
| `ProjectDetails/` | Legacy architecture planning docs |
| `tests/` | unit, integration, e2e, load test suites |

### 5.3 `b2b-backend/src/config/`

Centralized infrastructure configuration. All files load env vars and export singletons.

| File | Responsibility |
|------|---------------|
| `db.js` | Mongoose connection, pool sizing, replica set detection, transaction support |
| `redis.js` | ioredis client singleton |
| `env.js` | Environment variable parsing and defaults |
| `cors.js` | CORS whitelist (localhost, Render, Vercel domains) |
| `security.js` | Helmet CSP/HSTS + applies sanitizers + global rate limiter |
| `rateLimiter.js` | Redis-backed limiter configs (API, auth, payment, order) |
| `logger.js` | Winston logger with file/console transports |
| `sentry.js` | Sentry init, request/tracing/error handlers |
| `razorpay.js` | Razorpay SDK instance |
| `queue.js` | BullMQ queue connection config |
| `featureFlags.js` | Runtime feature flag defaults |
| `socketAdapter.js` | Redis adapter for horizontal Socket.IO scaling |

### 5.4 `b2b-backend/src/middlewares/` (22 files)

Security and cross-cutting request processing layer. See Section 11 for execution details.

### 5.5 `b2b-backend/src/modules/` (27 modules)

Each module follows **routes → controller → service → repository → model → validation** pattern:

| Module | Domain |
|--------|--------|
| `auth` | Registration, login, 2FA, sessions, password, logout |
| `user` | Profile, sessions, admin user management |
| `company` | B2B company CRUD |
| `vendor` | Vendor onboarding and approval |
| `category` | Product category hierarchy |
| `product` | Catalog CRUD, stock, status, bulk pricing |
| `pricing` | Dynamic price calculation engine |
| `promotion` | Coupon/promotion management |
| `cart` | Shopping cart |
| `wishlist` | User wishlists |
| `order` | Order creation, status, invoice download |
| `payment` | Razorpay integration, webhooks, hybrid payments, refunds |
| `invoice` | PDF invoice generation |
| `credit` | B2B credit accounts and ledger |
| `warehouse` | Warehouse management |
| `inventory` | Per-warehouse stock with optimistic locking |
| `shipment` | Shipment tracking records |
| `logistics` | Delivery partner queue, GPS, assignments |
| `notification` | In-app notifications |
| `analytics` | Dashboard aggregations |
| `settings` | System configuration key-value store |
| `support` | Support tickets |
| `review` | Product reviews |
| `search` | Product search |
| `admin` | User approvals, B2B/delivery partner creation |
| `superAdmin` | Platform governance, audit, config, categories |
| `audit` | Audit log queries (**routes not mounted**) |

### 5.6 `b2b-backend/src/services/` (21 shared services)

Cross-module utilities: audit, cache, delivery assignment, email (stub), encryption, fraud detection, file upload/validation, monitoring, notifications, PDF, queue manager, Redis, S3, scheduler, search, 2FA, vendor assignment, webhooks.

### 5.7 `b2b-backend/src/jobs/` + `workers/` + `queues/`

| Component | Purpose |
|-----------|---------|
| `jobs/cron.js` | Master cron scheduler |
| `jobs/paymentReconcile.job.js` | Stuck payment reconciliation (every 5 min) |
| `jobs/inventorySync.job.js` | Inventory synchronization |
| `jobs/cleanup.job.js` | Expired data cleanup |
| `workers/postOrder.worker.js` | Post-order async processing |
| `workers/postPayment.worker.js` | Post-payment async processing |
| `queues/*.queue.js` | BullMQ queues: audit, email, inventory, notification, payment, webhook |

### 5.8 `b2b-backend/tests/`

| Directory | Count | Coverage Focus |
|-----------|-------|---------------|
| `unit/` | 9 | Auth, password policy, 2FA, fraud, file validation, sanitizers |
| `integration/` | 28 | Auth, cart, orders, payments, inventory, queues, webhooks, rate limits |
| `e2e/` | 2 | Full checkout and order flows |
| `load/` | 14 | API load, concurrency, memory, CPU, queue throughput |

### 5.9 `b2b-frontend/src/` — Structure

| Directory | Purpose |
|-----------|---------|
| `app/` | Redux store, rootReducer, AppProvider, middleware |
| `components/common/` | Navbar, Footer, guards, CartDrawer, Loader |
| `components/layout/` | PublicLayout, MainLayout, AdminLayout, SuperAdminLayout, DeliveryLayout |
| `components/ui/` | Design system (Button, Input, Modal, Table, etc.) |
| `components/charts/` | AreaChart, BarChart, LineChart, PieChart, etc. |
| `components/feedback/` | Toast, ConfirmDialog, Alert, Skeleton |
| `config/` | env, sentry, securityHeaders, permissions, routes |
| `context/` | NotificationContext, SocketContext, AuthContext (unused), ThemeContext |
| `hooks/` | useAuth, usePermissions, useSystemConfig, useDebounce, etc. |
| `modules/` | 24 feature modules (pages, components, hooks, services, slices) |
| `routes/` | AppRoutes.jsx, routeConfig.js, routeGuards.js |
| `services/` | apiClient.js (single HTTP entry), storage.js, websocket.js |
| `utils/` | formatters, validators, token helpers, permissions |
| `__tests__/` | 39 Vitest files |

### 5.10 `b2b-frontend/e2e/`

3 Playwright specs: auth, accessibility, product-workflow + auth fixture.

---

## 6. File-by-File Analysis

> **Convention:** Each entry lists Path | Purpose | Key Exports | Dependencies | Security/Arch Notes  
> **Total files documented:** 811 (all tracked files excluding node_modules)

### 6.1 Root Files

| File | Purpose | Key Items | Dependencies | Notes |
|------|---------|-----------|--------------|-------|
| `.gitignore` | Global ignore rules | — | — | Ignores `**/package-lock.json`, all `.env` except `.env.example` |
| `.github/workflows/backend-ci.yml` | Backend CI pipeline | 7 jobs: lint, unit, integration, e2e, build-validation, security-audit, ci-success | Mongo 7 + Redis 7 services | Node 20.x; path-filtered to `b2b-backend/**` |
| `.github/workflows/frontend-ci.yml` | Frontend CI pipeline | 7 jobs: lint, build, test (stub), type-check, security-audit, vercel-preview, ci-success | — | Build uses placeholder API URLs; tests are no-op |

### 6.2 `b2b-backend` — Entry & Config Files

| File | Purpose | Key Exports | Security |
|------|---------|-------------|----------|
| `server.js` | App bootstrap | `startServer()`, graceful shutdown | Validates 7 required env vars; enforces 64-char JWT_SECRET in prod |
| `seed.js` | DB seeding entry | — | Dev only |
| `src/app.js` | Express app assembly | `default app` | Full middleware chain; static upload serving with CORS headers |
| `src/routes/index.js` | Route aggregator | mounts `/api/v1`, `/api/v2`, health endpoints | — |
| `src/routes/v1.routes.js` | V1 API router | 30 module mounts | Applies `authenticate` + `injectCsrfToken` at mount level |
| `src/routes/v2.routes.js` | V2 placeholder | health + root JSON | Future API version |
| `src/routes/health.routes.js` | Health routes | liveness/readiness | **Not mounted** — health handled in app.js directly |
| `jest.config.js` | Test config | coverage thresholds 80-90% | — |
| `eslint.config.js` | Lint rules | — | — |
| `.prettierrc` / `prettier.config.js` | Formatting | — | — |
| `nodemon.json` | Dev reload | watches `src/` | — |
| `.lintstagedrc.json` | Pre-commit hooks | lint + format staged files | — |
| `.husky/pre-commit` | Git hook runner | runs lint-staged | — |

### 6.3 `b2b-backend/src/config/` — All Files

| File | Purpose | Key Functions/Exports |
|------|---------|----------------------|
| `cors.js` | CORS policy | `corsConfig` — whitelist + vercel.app regex fallback |
| `db.js` | MongoDB connection | `connectDB()`, `getTransactionSupport()`, `isConnected` |
| `env.js` | Env parsing | typed env exports with defaults |
| `featureFlags.js` | Feature flag defaults | boolean toggles for reviews, COD, registrations |
| `logger.js` | Winston logger | `logger` — info/warn/error with optional file transport |
| `queue.js` | BullMQ config | queue connection options |
| `rateLimiter.js` | Rate limit configs | `apiLimiter`, `authLimiter`, `paymentLimiter`, `orderLimiter` |
| `razorpay.js` | Payment SDK | Razorpay instance with key_id/secret |
| `redis.js` | Redis client | `redisClient` singleton (ioredis) |
| `security.js` | Security middleware bundle | `securityMiddleware` — Helmet + sanitizers + rate limit |
| `sentry.js` | Error tracking | `initializeSentry`, `sentryRequestHandler`, `sentryErrorHandler` |
| `socketAdapter.js` | Socket.IO scaling | `configureSocketAdapter`, `cleanupSocketAdapter` |
| `__mocks__/redis.js` | Test mock | mocked Redis for Jest |

### 6.4 `b2b-backend/src/constants/` — All 15 Files

| File | Purpose | Key Exports |
|------|---------|-------------|
| `roles.js` | User roles enum | `SUPER_ADMIN`, `ADMIN`, `VENDOR`, `B2B_CUSTOMER`, `B2C_CUSTOMER`, `DELIVERY_PARTNER` |
| `permissions.js` | RBAC permission strings + role map | `PERMISSIONS`, `ROLE_PERMISSIONS` (~80 permissions) |
| `orderStatus.js` | Order lifecycle states | `PENDING_PAYMENT`, `CONFIRMED`, `SHIPPED`, `DELIVERED`, etc. |
| `paymentStatus.js` | Payment states | `INITIATED`, `PENDING`, `SUCCESS`, `FAILED` |
| `userStatus.js` | Account states | `PENDING`, `ACTIVE`, `SUSPENDED`, `REJECTED` |
| `vendorStatus.js` | Vendor approval states | `PENDING`, `APPROVED`, `REJECTED` |
| `creditStatus.js` | Credit account states | `ACTIVE`, `BLOCKED` |
| `deliveryStatus.js` | Delivery lifecycle | `ASSIGNED`, `OUT_FOR_DELIVERY`, `DELIVERED` |
| `notificationTypes.js` | Notification categories | `ORDER`, `PAYMENT`, `SYSTEM` |
| `cacheKeys.js` | Redis cache key patterns | prefixed keys for products, categories |
| `errorMessages.js` | Standardized error strings | user-facing messages |
| `featureFlags.js` | Feature flag keys | string constants |
| `fileTypes.js` | Allowed MIME types | upload validation |
| `httpStatus.js` | HTTP status code map | — |
| `queueNames.js` | BullMQ queue name constants | — |

### 6.5 `b2b-backend/src/errors/` — All 7 Files

| File | Class | Extends | Purpose |
|------|-------|---------|---------|
| `AppError.js` | `AppError` | `Error` | Base operational error with statusCode |
| `AuthError.js` | `AuthError` | `AppError` | Authentication failures |
| `NotFoundError.js` | `NotFoundError` | `AppError` | 404 resources |
| `PaymentError.js` | `PaymentError` | `AppError` | Payment gateway errors |
| `PermissionError.js` | `PermissionError` | `AppError` | RBAC denials |
| `RateLimitError.js` | `RateLimitError` | `AppError` | Rate limit exceeded |
| `ValidationError.js` | `ValidationError` | `AppError` | Joi validation failures |

### 6.6 `b2b-backend/src/middlewares/` — All 22 Files

| File | Export | Purpose | Security Relevance |
|------|--------|---------|-------------------|
| `auth.middleware.js` | `protect`, `authenticate` | JWT validation, user lookup, maintenance/status checks | **Critical** — gate for all protected routes |
| `role.middleware.js` | `authorize(...roles)` | Simple role string matching | Authorization |
| `permission.middleware.js` | `requirePermission`, `requireRole`, `requireOwnershipOr`, etc. | Granular RBAC + resource ownership | **Critical** — RBAC enforcement |
| `validate.middleware.js` | `validate(schema)` | Joi body/query/params validation | Input validation |
| `error.middleware.js` | `errorHandler` | Global error handler, sanitizes prod errors | Information disclosure prevention |
| `notFound.middleware.js` | `notFound` | 404 handler | — |
| `csrf.middleware.js` | `csrfProtection`, `injectCsrfToken` | Double-submit cookie CSRF | **Critical** — CSRF prevention |
| `idempotency.middleware.js` | `idempotencyMiddleware`, `operationIdempotency` | Redis-backed duplicate POST prevention | Payment/order safety |
| `rateLimiter.middleware.js` | re-exports from config | Per-route rate limiting | DoS prevention |
| `mongoSanitize.middleware.js` | `mongoSanitize` | Strips `$` and `.` keys | **Critical** — NoSQL injection prevention |
| `xssSanitize.middleware.js` | `xssSanitize` | XSS input sanitization | **Critical** — XSS prevention |
| `ipBlock.middleware.js` | `ipBlockMiddleware` | Dynamic IP blocking from settings | Security monitoring |
| `featureGuard.middleware.js` | `requireFeatureEnabled`, `requireRegistrationsEnabled` | Feature flag gates | Business rule enforcement |
| `cache.middleware.js` | `cacheMiddleware`, `clearCacheMiddleware` | Redis response caching | Performance |
| `upload.middleware.js` | `uploadImageToCloud`, multer config | File upload to S3/local | File security |
| `audit.middleware.js` | `auditMiddleware` | Request audit trail logging | Compliance |
| `securityAudit.middleware.js` | security event logging | Login, permission denied, payment events | Security monitoring |
| `monitoring.middleware.js` | `monitoringMiddleware`, `errorRateTracker` | Request timing, error rates | Observability |
| `correlation.middleware.js` | `correlationMiddleware` | Request/correlation IDs | Distributed tracing |
| `requestLogger.middleware.js` | `requestLogger` | Structured request logging | Observability |
| `timeout.middleware.js` | `timeoutMiddleware` | 30s request timeout | DoS prevention |
| `sanitize.middleware.js` | general sanitizer | Additional input cleaning | Security |

### 6.7 `b2b-backend/src/utils/` — All 16 Files

| File | Purpose | Used By |
|------|---------|---------|
| `asyncHandler.js` | Wraps async route handlers, catches errors | All controllers |
| `responseHandler.js` | Standardized success/error JSON responses | Controllers |
| `generateToken.js` | JWT access token generation | auth.service |
| `hashPassword.js` | bcrypt password hashing | auth.service |
| `comparePassword.js` | bcrypt password comparison | auth.service |
| `passwordPolicy.js` | Password strength validation + breach check | auth registration |
| `pagination.js` | Pagination helper for queries | repositories |
| `apiFeatures.js` | Filter, sort, limit, field selection | product repository |
| `currency.utils.js` | Currency formatting/calculation | order, payment |
| `date.utils.js` | Date formatting utilities | various |
| `encryption.utils.js` | AES encrypt/decrypt helpers | encryption.service |
| `file.utils.js` | File path/MIME utilities | upload middleware |
| `number.utils.js` | Number formatting/rounding | pricing |
| `retry.utils.js` | Exponential backoff retry | inventory, payment |
| `queryTimeout.js` | Global Mongoose query timeout | db.js startup |
| `cacheInvalidation.js` | Cache key invalidation patterns | product/category updates |
| `cdn.js` | CDN URL generation/optimization | S3 service |

### 6.8 `b2b-backend/src/services/` — All 21 Files

| File | Purpose | External APIs |
|------|---------|--------------|
| `audit.service.js` | Persist audit log entries | MongoDB Audit model |
| `cache.service.js` | Redis get/set/delete | Redis |
| `deliveryAssignment.service.js` | Auto-assign delivery partner to orders | User model (DELIVERY_PARTNER) |
| `email.service.js` | Email sending (**stub/mock**) | — |
| `encryption.service.js` | AES encryption using ENCRYPTION_SECRET | — |
| `featureFlag.service.js` | Check runtime feature flags | Settings model |
| `fileUpload.service.js` | Upload orchestration | S3 or local filesystem |
| `fileValidation.service.js` | MIME/size/malware signature check | — |
| `fraudDetection.service.js` | Login tracking, account lockouts | Redis |
| `monitoring.service.js` | System metrics collection | — |
| `notification.service.js` | Notification creation wrapper | Notification model + Socket.IO |
| `payment.service.js` | Legacy simple payment stub | — |
| `pdf.service.js` | PDF generation helper | PDFKit |
| `queueManager.service.js` | Enqueue post-payment/post-order jobs | BullMQ |
| `redis.service.js` | Basic Redis key operations | Redis |
| `s3.service.js` | AWS S3 upload/presign/CDN URLs | AWS S3 API |
| `scheduler.service.js` | Generic interval scheduler | — |
| `search.service.js` | Generic search helper | MongoDB text index |
| `twoFactorAuth.service.js` | TOTP setup/verify, QR generation | @otplib, qrcode |
| `vendorAssignment.service.js` | Vendor-to-order assignment logic | Vendor model |
| `webhook.service.js` | Webhook payload processing | — |

### 6.9 `b2b-backend/src/modules/` — Per-Module File Analysis

Each module typically contains: `*.routes.js`, `*.controller.js`, `*.service.js`, `*.repository.js`, `*.model.js`, `*.validation.js`

#### `auth/` (9 files incl. backups)

| File | Purpose | Key Logic |
|------|---------|-----------|
| `auth.routes.js` | 13 endpoints: register, login, refresh, 2FA, sessions, logout | authLimiter, CSRF on mutations |
| `auth.controller.js` | HTTP handlers for all auth operations | Delegates to auth.service |
| `auth.service.js` | Register, login, 2FA, refresh rotation, sessions, password change | bcrypt, JWT, RefreshToken family management |
| `auth.repository.js` | User/RefreshToken DB queries | — |
| `auth.token.js` | Token generation utilities | JWT sign/verify |
| `auth.validation.js` | Joi schemas: register, login, 2FA, changePassword | Input validation |
| `auth.controller.BACKUP.js` | Legacy backup | **Dead code** |
| `auth.controller.backup.txt` | Text backup | **Dead code** |

#### `user/` (7 files)

| File | Purpose |
|------|---------|
| `user.model.js` | User schema: 40+ fields (auth, 2FA, B2B, delivery partner, credit, addresses) |
| `user.routes.js` | Profile CRUD, sessions, admin user management |
| `user.controller.js` | HTTP handlers |
| `user.service.js` | Profile update, image upload, password change, admin operations |
| `user.repository.js` | User queries with soft-delete filter |
| `user.validation.js` | updateProfile, changePassword schemas |

#### `order/` (10 files)

| File | Purpose | Key Business Logic |
|------|---------|-------------------|
| `order.model.js` | Order schema with items, payment, status, idempotencyKey | Unique sparse idempotency index |
| `order.service.js` | **Core checkout engine** | MOQ validation, bulk discounts, GST 18%, stock reserve/deduct, credit/COD/online paths |
| `order.workflow.js` | Status transition rules | State machine for order lifecycle |
| `order.events.js` | Order event emitters | Socket.IO + notification triggers |
| `order.scheduler.js` | Scheduled order cleanup | Expired pending orders |
| `order.repository.js` | Order CRUD with pagination | — |
| `order.controller.js` | createOrder, getOrders, updateStatus, downloadInvoice | — |
| `order.routes.js` | 6 endpoints with idempotency + orderLimiter | — |
| `order.validation.js` | createOrder, updateStatus schemas | — |

#### `payment/` (9 files)

| File | Purpose | Key Business Logic |
|------|---------|-------------------|
| `payment.service.js` | **Payment orchestration** | Razorpay order creation, verify HMAC, hybrid (credit+online), distributed locks |
| `payment.webhook.js` | Razorpay webhook handler | Signature verification, idempotent event processing |
| `payment.gateway.js` | Razorpay SDK wrapper | createOrder, verifyPayment, refund |
| `payment.model.js` | Payment record schema | razorpayPaymentId unique sparse |
| `refund.model.js` | Refund tracking with inventory restoration | FULL/PARTIAL refund types |
| `payment.routes.js` | 6 endpoints incl. webhook (no CSRF) | paymentLimiter on all |
| `payment.controller.js` | HTTP handlers | — |
| `payment.repository.js` | Payment/refund queries | — |
| `payment.validation.js` | verifyPayment, hybrid schemas | — |

#### `inventory/` (7 files)

| File | Purpose | Key Business Logic |
|------|---------|-------------------|
| `inventory.model.js` | Per-warehouse stock with `version` field | Unique (productId, warehouseId); optimistic locking |
| `inventory.service.js` | Stock CRUD, reserve/finalize/release | Redis reservations (15min TTL), atomic reduceStock with retry |
| `inventory.repository.js` | Inventory queries | — |
| `inventory.controller.js` | addStock, updateStock, getLowStock, stats | — |
| `inventory.routes.js` | 5 endpoints with idempotency on mutations | — |
| `inventory.validation.js` | Stock operation schemas | — |

#### `credit/` (8 files)

| File | Purpose |
|------|---------|
| `credit.model.js` | Credit account: limit, used, available, status |
| `credit.ledger.js` | Ledger entries: DEBIT/CREDIT with amount, description |
| `credit.service.js` | useCredit, repayCredit, createCredit, ledger queries |
| `credit.scheduler.js` | Credit reminder cron |
| `credit.routes.js` | 5 endpoints |
| `credit.controller.js` | HTTP handlers |
| `credit.repository.js` | Credit/ledger queries |
| `credit.validation.js` | createCredit, creditAction schemas |

#### `logistics/` (8 files)

| File | Purpose |
|------|---------|
| `logistics.model.js` | Delivery record: partner, status, GPS location, ETA |
| `logistics.service.js` | Queue management, accept/start/deliver, location updates |
| `routeOptimization.js` | Route optimization helper (basic) |
| `logistics.routes.js` | 10 endpoints for delivery partners and admins |
| `logistics.controller.js` | HTTP handlers |
| `logistics.repository.js` | Logistics queries |
| `logistics.validation.js` | Status/location schemas |

#### `superAdmin/` (5 files)

| File | Purpose |
|------|---------|
| `superAdmin.service.js` | Admin CRUD, metrics, audit export, config, categories |
| `superAdmin.routes.js` | 16 endpoints mounted at `/super-admin` AND `/superadmin` |
| `superAdmin.controller.js` | HTTP handlers |
| `superAdmin.repository.js` | Aggregated queries for metrics/audit |
| `superAdmin.validation.js` | Admin/category/config schemas |

#### Remaining Modules (summary)

| Module | Files | Model | Key Endpoints |
|--------|-------|-------|--------------|
| `admin` | 5 | — | users, approvals, b2b-customers, delivery-partners, stats |
| `analytics` | 7 | — | dashboard, sales, orders-trends, categories, top-products, revenue |
| `audit` | 5 | Audit | GET logs (**routes not mounted**) |
| `cart` | 6 | Cart | add, get, remove |
| `category` | 6 | Category | CRUD with cache (300s) |
| `company` | 6 | Company | CRUD, getMyCompany |
| `invoice` | 7 | Invoice | generate PDF, get by orderId |
| `notification` | 8 | Notification | get, markAsRead + templates/queue |
| `pricing` | 6 | — | POST calculate price (pricing engine) |
| `product` | 8 | Product | public GET; protected CRUD with ownership |
| `promotion` | 6 | Promotion | CRUD + applyCoupon |
| `review` | 6 | Review | add (feature-gated), get by productId |
| `search` | 4 | — | GET search products |
| `settings` | 6 | Settings | key-value config, public config |
| `shipment` | 6 | Shipment | create, update status, get by order |
| `support` | 4 | Support | create ticket, get tickets, update status |
| `vendor` | 6 | Vendor | create, list, approve status |
| `warehouse` | 6 | Warehouse | CRUD |
| `wishlist` | 6 | Wishlist | add, remove, clear |

### 6.10 `b2b-backend/src/models/` + `workers/` + `queues/` + `jobs/`

| File | Purpose |
|------|---------|
| `models/RefreshToken.model.js` | Refresh token with family rotation, TTL index, reuse detection |
| `workers/index.js` | BullMQ worker manager startup/shutdown |
| `workers/postOrder.worker.js` | Async: notifications, analytics after order |
| `workers/postPayment.worker.js` | Async: invoice, inventory finalize after payment |
| `queues/audit.queue.js` | Audit log async writes |
| `queues/email.queue.js` | Email dispatch (mock) |
| `queues/inventory.queue.js` | Inventory sync jobs |
| `queues/notification.queue.js` | Notification delivery |
| `queues/payment.queue.js` | Payment reconciliation jobs |
| `queues/webhook.queue.js` | Webhook event processing |
| `jobs/cron.js` | Master cron scheduler |
| `jobs/analytics.job.js` | Periodic analytics aggregation |
| `jobs/cleanup.job.js` | Expired tokens, old logs cleanup |
| `jobs/creditReminder.job.js` | Credit payment reminders |
| `jobs/inventorySync.job.js` | Inventory synchronization |
| `jobs/notification.job.js` | Batch notification dispatch |
| `jobs/orderCleanup.job.js` | Abandoned order cleanup |
| `jobs/paymentReconcile.job.js` | Stuck payment → FAILED (every 5 min) |
| `controllers/health.controller.js` | Health, liveness, readiness, metrics endpoints |
| `docs/openapi.yaml` | OpenAPI 3.0 spec (partial) |
| `docs/postman.json` | Postman collection |
| `docs/swagger.js` | Swagger UI setup (if mounted) |
| `docs/api-guidelines.md` | API design guidelines |
| `scripts/seedWholesale.js` | Wholesale product/category seed data |

### 6.11 `b2b-backend/tests/` — All Test Files

| File | Type | Tests |
|------|------|-------|
| `setup.js` | Config | Forces test env, disables queue/workers/cron |
| `helpers/testUtils.js` | Helper | Test DB setup, user factory, auth helpers |
| `helpers/razorpayMock.js` | Mock | Razorpay SDK mock |
| `unit/auth.test.js` | Unit | Token generation, validation |
| `unit/user.test.js` | Unit | User model logic |
| `unit/product.test.js` | Unit | Product utilities |
| `unit/passwordPolicy.test.js` | Unit | Password strength rules |
| `unit/fraudDetection.test.js` | Unit | Login attempt tracking |
| `unit/twoFactorAuth.test.js` | Unit | TOTP setup/verify |
| `unit/fileValidation.test.js` | Unit | Upload MIME/size validation |
| `unit/mongoSanitize.test.js` | Unit | NoSQL injection prevention |
| `unit/mongoSanitize.manual.js` | Manual | Interactive sanitizer test |
| `unit/xssSanitize.manual.js` | Manual | Interactive XSS test |
| `integration/auth.integration.test.js` | Integration | Full auth flow |
| `integration/cart.integration.test.js` | Integration | Cart CRUD |
| `integration/category.integration.test.js` | Integration | Category management |
| `integration/checkout.integration.test.js` | Integration | Full checkout |
| `integration/health.endpoint.test.js` | Integration | Health endpoints |
| `integration/infrastructure.test.js` | Integration | DB/Redis connectivity |
| `integration/inventory.*.test.js` (3) | Integration | Stock, reservation, concurrency |
| `integration/order.*.test.js` (2) | Integration | Order creation, status |
| `integration/payment.*.test.js` (5) | Integration | Payment, webhook, concurrency, phase5 |
| `integration/refund.*.test.js` (2) | Integration | Refund flows |
| `integration/queue-*.test.js` (5) | Integration | Queue lifecycle, retry, DLQ, priority |
| `integration/product.integration.test.js` | Integration | Product CRUD |
| `integration/rate.limiter.test.js` | Integration | Rate limiting |
| `integration/webhook.replay.test.js` | Integration | Webhook idempotency |
| `integration/workers.test.js` | Integration | Worker processing |
| `integration/circuit.breaker.test.js` | Integration | Circuit breaker patterns |
| `integration/lock.cleanup.test.js` | Integration | Distributed lock cleanup |
| `integration/timeout.scenarios.test.js` | Integration | Request timeout handling |
| `integration/partial.failure.test.js` | Integration | Partial failure recovery |
| `e2e/order.e2e.test.js` | E2E | Full order lifecycle |
| `e2e/checkout.test.js` | E2E | Checkout to payment |
| `load/*.test.js` (14) | Load | API load, concurrency, memory, CPU, queue throughput |

### 6.12 `b2b-backend` — Documentation & Ops Files

| File | Purpose |
|------|---------|
| `README.md` | Comprehensive backend documentation (~1700 lines) |
| `code-guide/architecture.md` | System architecture |
| `code-guide/authentication-flow.md` | Auth sequence diagrams |
| `code-guide/payment-system.md` | Payment flow documentation |
| `code-guide/inventory-system.md` | Inventory reservation docs |
| `code-guide/queue-workers.md` | BullMQ worker architecture |
| `code-guide/security-hardening.md` | Security measures |
| `code-guide/deployment-guide.md` | PM2, env templates (Docker referenced but missing) |
| `code-guide/testing-guide.md` | Test strategy |
| `code-guide/*.md` (7 more) | API patterns, error handling, caching, monitoring, concurrency |
| `ProjectDetails/*` (5) | Legacy planning documents |
| `scripts/backup.js` | Database backup utility |
| `scripts/cleanup.js` | Data cleanup utility |
| `scripts/migrate.js` | Migration runner |
| `scripts/seed.js` | Seed script |
| `.github/workflows/ci-cd.yml` | Legacy CI (Node 18, Docker build — **Dockerfile missing**) |
| `uploads/invoices/*.pdf` (20+) | Generated invoice artifacts |
| `uploads/*.webp` | Product images |
| `logs/*.log` (4) | Runtime log files |

### 6.13 `b2b-frontend` — Config & Entry Files

| File | Purpose | Key Exports |
|------|---------|-------------|
| `index.html` | HTML shell | Razorpay preconnect, manifest link |
| `index.css` | Tailwind v4 entry | `@import "tailwindcss"` |
| `src/main.jsx` | React bootstrap | Sentry init, Redux Provider, App |
| `src/App.jsx` | Root component | RouterProvider with AppRoutes |
| `vite.config.js` | Vite build config | Manual chunks, Sentry plugin, `@` alias |
| `vitest.config.js` | Vitest config | 80% coverage thresholds, path aliases |
| `tailwind.config.js` | Design tokens | CSS variable-based theme |
| `postcss.config.js` | PostCSS | @tailwindcss/postcss + autoprefixer |
| `eslint.config.js` | Lint rules | Basic JS/JSX (no React plugin) |
| `playwright.config.js` | E2E config | baseURL from PLAYWRIGHT_BASE_URL |
| `vercel.json` | Deploy config | SPA catch-all rewrite to index.html |
| `.env.example` | Env template | VITE_API_URL, VITE_SOCKET_URL, VITE_RAZORPAY_KEY_ID |
| `HomePage.jsx` | Orphan landing page | **Not imported anywhere** |
| `README.md` | Frontend documentation | — |
| `FrontEndDetails/*.md` (5) | Planning docs | architecture, features, workflows |

### 6.14 `b2b-frontend/src/app/` — Redux Store

| File | Purpose |
|------|---------|
| `store.js` | Redux store creation with middleware |
| `rootReducer.js` | Combines: auth, admin, superAdmin, product, order slices |
| `AppProvider.jsx` | Wraps Redux + NotificationProvider + SocketProvider |
| `persistConfig.js` | Redux persist configuration |
| `storeHooks.js` | Typed useAppDispatch, useAppSelector |
| `storeMiddleware.js` | Custom Redux middleware |

### 6.15 `b2b-frontend/src/services/` — HTTP Layer

| File | Purpose | Key Logic |
|------|---------|-----------|
| `apiClient.js` | **Single HTTP client** | Axios instance, Bearer + CSRF headers, 401 auto-refresh, request queue |
| `storage.js` | localStorage wrapper | get/set/remove with JSON serialization |
| `endpoints.js` | API endpoint constants | Centralized path definitions |
| `interceptors.js` | Request/response interceptors | Token injection, error handling |
| `websocket.js` | Socket.io client wrapper | Connection management |
| `logger.js` | Client-side logging | Dev console logging |

### 6.16 `b2b-frontend/src/routes/`

| File | Purpose |
|------|---------|
| `AppRoutes.jsx` | **Master route tree** — 50+ routes with lazy loading, RoleGuard, ProtectedRoute |
| `routeConfig.js` | Route path constants (routes.HOME, routes.ADMIN_DASHBOARD, etc.) |
| `routeGuards.js` | Legacy HOC guard (storage-based) — superseded by ProtectedRoute |
| `PrivateRoutes.jsx` | Legacy private route wrapper — **unused** |

### 6.17 `b2b-frontend/src/components/` — All Files

#### `common/` (13 files)

| File | Purpose | Routed/Used |
|------|---------|------------|
| `Navbar.jsx` | Authenticated navigation with cart, role-aware links | MainLayout |
| `PublicNavbar.jsx` | Marketing site navigation | PublicLayout |
| `Footer.jsx` | Site footer with links | PublicLayout, MainLayout |
| `ProtectedRoute.jsx` | Auth gate + maintenance mode check | All protected routes |
| `RoleGuard.jsx` | Role-based access with redirect | Admin, SuperAdmin, Delivery routes |
| `RoleBasedRoute.jsx` | Switch-based role redirects | **Imported but unused** |
| `CartDrawer.jsx` | Slide-out cart panel | Navbar |
| `ErrorBoundary.jsx` | React error boundary | App root |
| `Loader.jsx` | Loading spinner | Lazy route fallback |
| `Sidebar.jsx` | Legacy role-based sidebar | **Not in active layouts** |
| `Breadcrumb.jsx` | Breadcrumb navigation | Admin pages |
| `PageHeader.jsx` | Page title + actions header | Various pages |
| `SearchBar.jsx` | Product search input | Navbar |

#### `layout/` (10 files)

| File | Purpose | Used For |
|------|---------|----------|
| `PublicLayout.jsx` | PublicNavbar + Footer + Outlet | Landing page |
| `MainLayout.jsx` | Navbar + Footer + socket toasts | Customer/product pages |
| `AdminLayout.jsx` | Sidebar nav + header + Outlet | Admin portal |
| `SuperAdminLayout.jsx` | SuperAdminSidebar + Header + Outlet | Super admin portal |
| `SuperAdminSidebar.jsx` | Super admin navigation menu | SuperAdminLayout |
| `SuperAdminHeader.jsx` | Super admin top bar | SuperAdminLayout |
| `DeliveryLayout.jsx` | Dark logistics nav + Outlet | Delivery partner |
| `UserLayout.jsx` | User dashboard layout | **Not used in routing** |
| `AdminLayout.css` | Admin layout styles | AdminLayout |
| `UserLayout.module.css` | User layout CSS modules | UserLayout |

#### `ui/` (17 files) — Design System

`Avatar`, `Badge`, `Button`, `Card`, `Drawer`, `Dropdown`, `EmptyState`, `Input`, `Modal`, `Pagination`, `PasswordField`, `Select`, `Stepper`, `Switch`, `Table`, `Tabs`, `Tooltip` — reusable UI primitives with consistent styling via Tailwind/CSS variables.

#### `charts/` (6 files)

`AreaChart`, `BarChart`, `FunnelChart`, `HeatmapChart`, `LineChart`, `PieChart` — SVG-based chart components for analytics dashboard.

#### `feedback/` (5 files)

`Alert`, `ConfirmDialog`, `EmptyState`, `Skeleton`, `Toast` — user feedback components.

### 6.18 `b2b-frontend/src/modules/` — All Module Files

#### `auth/` (12 files)

| File | Purpose | Routed |
|------|---------|--------|
| `pages/LoginPage.jsx` | Mobile + password login | `/login` |
| `pages/Register.jsx` | User registration form | `/register` |
| `pages/ForgotPassword.jsx` | Password reset request | **Not routed** |
| `pages/VerifyOTP.jsx` | OTP verification | **Not routed** |
| `components/LoginForm.jsx` | Login form UI | LoginPage |
| `components/RegisterForm.jsx` | Registration form UI | Register |
| `authSlice.js` | Redux: user, token, csrfToken, isAuthenticated | Global |
| `authService.js` / `services/authService.js` | API: login, register, logout, refresh, csrf | — |
| `hooks/useAuth.js` | Login/logout/register + CSRF fetch | — |
| `authApi.js` | RTK Query API slice (if used) | — |
| `types.js` | Auth type definitions | — |

#### `product/` (18 files)

| File | Purpose | Routed |
|------|---------|--------|
| `pages/LandingPage.jsx` | Composes 8 landing components | `/` |
| `pages/ProductPage.jsx` | Product catalog with filters | `/products`, `/home` |
| `pages/ProductDetails.jsx` | Single product view | `/products/:id` |
| `pages/ProductList.jsx` | Product list variant | **Not routed** |
| `pages/Home.jsx` | Home page variant | **Not routed** |
| `pages/Category.jsx` | Category-filtered products | **Not routed** |
| `components/ProductCard.jsx` | Product card UI | ProductPage |
| `components/ProductForm.jsx` | Admin product create/edit | Admin Products |
| `components/ProductFilters.jsx` | Filter sidebar | ProductPage |
| `components/BulkPricingTable.jsx` | Tier pricing display | ProductDetails |
| `components/VariantSelector.jsx` | Product variant picker | ProductDetails |
| `components/InventoryStatus.jsx` | Stock level indicator | ProductDetails |
| `productSlice.js` | Redux: products, pagination, selectedProduct | Global |
| `productService.js` / `services/productService.js` | API: CRUD, stock, status | — |
| `hooks/useProduct.js` | Product fetch/mutate hook | — |

#### `order/` (12 files)

| File | Purpose | Routed |
|------|---------|--------|
| `pages/Cart.jsx` | Shopping cart | `/cart` |
| `pages/Checkout.jsx` | Checkout form + payment method | `/checkout` |
| `pages/OrdersPage.jsx` | Order history list | `/orders` |
| `pages/OrderDetails.jsx` | Single order view + timeline | `/orders/:id` |
| `components/OrderTimeline.jsx` | Status progression UI | OrderDetails |
| `components/OrderStatusBadge.jsx` | Status badge component | OrdersPage |
| `orderSlice.js` | Redux: orders, cart (localStorage) | Global |
| `orderService.js` / `services/orderService.js` | API: create, list, status, invoice | — |
| `hooks/useOrder.js` | Order CRUD + cart operations | — |

#### `payment/` (8 files)

| File | Purpose | Routed |
|------|---------|--------|
| `pages/PaymentPage.jsx` | Razorpay checkout + hybrid payment | `/payment/:orderId` |
| `components/PaymentStatus.jsx` | Payment result display | PaymentPage |
| `config/paymentConfig.js` | Razorpay key + options | — |
| `utils/paymentSecurity.js` | Client-side payment validation | — |
| `paymentSlice.js` | Redux payment state | — |
| `services/paymentService.js` | API: create-order, verify, hybrid | — |
| `hooks/usePayment.js` | Payment flow orchestration | — |

#### `superAdmin/` (31 files)

| File | Purpose | Routed |
|------|---------|--------|
| `pages/SuperAdminPage.jsx` | Dashboard with metrics + welcome | `/super-admin/dashboard` |
| `pages/AdminsPage.jsx` | Admin user management | `/super-admin/admins` |
| `pages/PartnersPage.jsx` | Vendor/partner management | `/super-admin/partners` |
| `pages/CustomersPage.jsx` | B2B customer management | `/super-admin/customers` |
| `pages/DeliveryPartnersPage.jsx` | Delivery partner management | `/super-admin/delivery-partners` |
| `pages/CategoriesPage.jsx` | Category CRUD | `/super-admin/categories` |
| `pages/ProductsPage.jsx` | Product oversight | `/super-admin/products` |
| `pages/InventoryPage.jsx` | Inventory overview | `/super-admin/inventory` |
| `pages/OrdersPage.jsx` | Order oversight | `/super-admin/orders` |
| `pages/CreditPage.jsx` | Credit management | `/super-admin/credit` |
| `pages/RevenuePage.jsx` | Revenue analytics | `/super-admin/revenue` |
| `pages/ConfigurationPage.jsx` | System config | `/super-admin/configuration` |
| `pages/FeaturesPage.jsx` | Feature flags | `/super-admin/features` |
| `pages/SecurityPage.jsx` | Security settings | `/super-admin/security` |
| `pages/AuditPage.jsx` | Audit log viewer | `/super-admin/audit` |
| `pages/LogsPage.jsx` | System logs | `/super-admin/logs` |
| `pages/SettingsPage.jsx` | Super admin settings | `/super-admin/settings` |
| `pages/ProfilePage.jsx` | Super admin profile | `/super-admin/profile` |
| `components/WelcomeHero.jsx` | Dashboard hero section | SuperAdminPage |
| `components/MetricsCards.jsx` | KPI metric cards | SuperAdminPage |
| `components/AdminManagement.jsx` | Admin CRUD UI | AdminsPage |
| `components/PartnerAccountCreation.jsx` | Partner creation form | PartnersPage |
| `components/CategoryControl.jsx` | Category management UI | CategoriesPage |
| `components/SystemConfigForm.jsx` | Config editor | ConfigurationPage |
| `components/FeatureAndSecurityPanel.jsx` | Feature/security toggles | FeaturesPage |
| `components/AuditTable.jsx` | Audit log table | AuditPage |
| `components/DbShell.jsx` | Database shell viewer | LogsPage |
| `superAdminSlice.js` | Redux: config, metrics, admins, categories, auditLogs | Global |
| `services/superAdminService.js` | API: admins, categories, config, audit, metrics | — |
| `hooks/useSuperAdmin.js` | Super admin operations hook | — |

#### Remaining Frontend Modules (summary)

| Module | Key Pages | Routed | Service File |
|--------|-----------|--------|-------------|
| `admin` | AdminPage, Users, Products, Orders, Approvals, AdminProfile | Yes (partial) | adminService.js |
| `analytics` | AnalyticsPage | `/admin/analytics` | analyticsService.js |
| `company` | CompanyPage | `/vendor/company` | companyService.js |
| `credit` | CreditPage, CreditDashboard | `/credit` | creditService.js |
| `delivery` | DeliveryPage, Deliveries, DeliveryDetails | `/delivery/*` | deliveryService.js |
| `inventory` | InventoryPage | `/admin/inventory` | inventoryService.js |
| `invoice` | InvoicePage | **Not routed** | invoiceService.js |
| `landing` | 8 components (no pages/) | Via LandingPage | — |
| `logistics` | LogisticsPage | `/delivery/dashboard` | logisticsService.js |
| `notification` | NotificationPage | **Not routed** | notificationService.js |
| `offers` | OffersPage | **Not routed** | offerService.js |
| `promotion` | PromotionPage | `/admin/promotions` | promotionService.js |
| `public` | Pricing, Solutions, Contact, About | Yes | — |
| `review` | ReviewPage, Reviews | **Not routed** | reviewService.js |
| `search` | SearchPage | **Not routed** | searchService.js |
| `settings` | SettingsPage | `/admin/settings` | settingsService.js |
| `shipment` | ShipmentTrackingPage | **Not routed** | shipmentService.js |
| `support` | — (service only) | **No page** | supportService.js |
| `user` | Dashboard, Profile, Security, Help, Addresses, Settings, ActivityLogs | Partial | userService.js |
| `warehouse` | WarehousePage | `/admin/warehouse` | warehouseService.js |
| `wishlist` | WishlistPage | `/wishlist` | wishlistService.js |

### 6.19 `b2b-frontend/src/__tests__/` — All 39 Test Files

| File | Tests |
|------|-------|
| `setup.js` | Vitest global setup |
| `accessibility/accessibility.test.jsx` | Landing page a11y |
| `components/common/*.test.jsx` (6) | Footer, Navbar, Loader, ErrorBoundary, ProtectedRoute, RoleGuard |
| `components/feedback/*.test.jsx` (2) | Toast, ConfirmDialog |
| `components/ui/*.test.jsx` (10) | Button, Input, Modal, Card, Badge, Select, Table + accessibility/advanced |
| `modules/auth/*.test.js` (4) | authSlice, authService, OTPInput |
| `modules/landing/components/*.test.jsx` (8) | All landing section components |
| `modules/product/*.test.js` (2) | productSlice, LandingPage |
| `modules/order/orderSlice.test.js` | Order/cart Redux |
| `routes/routes.test.jsx` | Route configuration |
| `services/apiClient.test.js` | HTTP client + refresh |
| `services/storage.test.js` | localStorage wrapper |
| `utils/debounce.test.js` | Debounce utility |
| `utils/dateFormatter.test.js` | Date formatting |
| `mocks/handlers.js` | MSW request handlers |
| `mocks/server.js` | MSW server setup |
| `mocks/authContext.js` | Auth context mock |
| `mocks/orderContext.js` | Order context mock |
| `mocks/mockData.js` | Test fixture data |
| `utils/testUtils.js` / `testUtils.jsx` | Render helpers |

### 6.20 `b2b-frontend/e2e/` — All Files

| File | Purpose | Status |
|------|---------|--------|
| `auth.spec.js` | Login/logout E2E | **Likely stale** — expects email login, app uses mobile |
| `accessibility.spec.js` | A11y E2E checks | — |
| `product-workflow.spec.js` | Product browse-to-cart flow | — |
| `fixtures/auth.js` | Auth test fixture | — |

---

## 7. Database Documentation

### 7.1 Database Technology

- **Engine:** MongoDB (via Mongoose 9.6.2)
- **Connection:** `MONGO_URI` env var, pool size 2-10
- **Transactions:** Enabled when replica set detected
- **Soft Delete:** Users filtered by `isDeleted != true`
- **TTL Indexes:** `RefreshToken.expiresAt` auto-expires

### 7.2 Entity Relationship Diagram

```mermaid
erDiagram
    User ||--o| Company : "companyId"
    User ||--o| Credit : "userId"
    User ||--o{ Order : "userId"
    User ||--o| Cart : "userId"
    User ||--o| Wishlist : "userId"
    User ||--o{ RefreshToken : "userId"
    User ||--o{ Notification : "userId"
    User ||--o{ Review : "userId"
    User ||--o{ Support : "userId"
    User ||--o{ Audit : "userId"
    User ||--o{ CreditLedger : "userId"
    User ||--o{ Payment : "userId"
    User ||--o{ Invoice : "userId"

    Company ||--o{ Vendor : "companyId"
    Company ||--o{ Product : "companyId"

    Vendor ||--o{ Product : "vendorId"
    Category ||--o{ Product : "categoryId"
    Category ||--o| Category : "parentId"

    Product ||--o{ Inventory : "productId"
    Warehouse ||--o{ Inventory : "warehouseId"

    Order ||--o{ Payment : "orderId"
    Order ||--o| Invoice : "orderId"
    Order ||--o| Shipment : "orderId"
    Order ||--o| Logistics : "orderId"
    Order ||--o{ Refund : "orderId"

    Payment ||--o{ Refund : "paymentId"
    Warehouse ||--o{ Shipment : "warehouseId"
    Warehouse ||--o{ Logistics : "warehouseId"
    User ||--o{ Logistics : "deliveryPartnerId"
```

### 7.3 All Collections/Tables (24 Models)

| Collection | Model File | Key Fields | Indexes/Constraints |
|-----------|-----------|------------|-------------------|
| `users` | `user.model.js` | name, email (unique), mobile (unique), password, role, status, 2FA, credit, addresses, B2B/delivery fields | email, mobile unique; soft delete |
| `refreshtokens` | `RefreshToken.model.js` | userId, token (unique), family, expiresAt, isRevoked | TTL on expiresAt; token unique |
| `companies` | `company.model.js` | name, email (unique), gstNumber, address | email unique |
| `vendors` | `vendor.model.js` | name, companyId, status (PENDING/APPROVED/REJECTED) | — |
| `categories` | `category.model.js` | name, slug, parentId (self-ref), isActive | unique (name, parentId) |
| `products` | `product.model.js` | name, price, stock, categoryId, vendorId, bulkPricing[], variants[], moq | — |
| `carts` | `cart.model.js` | userId (unique), items[{productId, quantity}] | userId unique |
| `wishlists` | `wishlist.model.js` | userId (unique), items[{productId}] | userId unique |
| `orders` | `order.model.js` | userId, items[], totalAmount, paymentMethod, status, idempotencyKey | idempotencyKey unique sparse |
| `payments` | `payment.model.js` | orderId, userId, amount, status, razorpayPaymentId | razorpayPaymentId unique sparse |
| `refunds` | `refund.model.js` | orderId, paymentId, amount, refundType, status, inventoryRestored | — |
| `credits` | `credit.model.js` | userId (unique), creditLimit, usedCredit, availableCredit, status | userId unique |
| `creditledgers` | `credit.ledger.js` | userId, type (DEBIT/CREDIT), amount, description | — |
| `inventories` | `inventory.model.js` | productId, warehouseId, stock, version | unique (productId, warehouseId) |
| `warehouses` | `warehouse.model.js` | name, location, capacity, currentLoad, isActive | — |
| `shipments` | `shipment.model.js` | orderId, warehouseId, status, trackingNumber (unique) | trackingNumber unique |
| `logistics` | `logistics.model.js` | orderId, deliveryPartnerId, status, currentLocation, etaMinutes | — |
| `invoices` | `invoice.model.js` | orderId (unique), invoiceNumber (unique), amount, gst, fileUrl | orderId, invoiceNumber unique |
| `promotions` | `promotion.model.js` | code (unique uppercase), discountType, value, expiresAt | code unique |
| `reviews` | `review.model.js` | userId, productId, rating (1-5), comment | — |
| `notifications` | `notification.model.js` | userId, title, message, type, isRead | — |
| `supports` | `support.model.js` | userId, subject, message, status | — |
| `settings` | `settings.model.js` | key (unique), value (Mixed), description | key unique |
| `audits` | `audit.model.js` | userId, action, entity, entityId, severity, ip | — |

### 7.4 Data Flow — Order-to-Delivery

```
1. User adds products to Cart (carts collection)
2. Checkout → Order created (orders) with PENDING_PAYMENT or CONFIRMED
3. Payment method branch:
   - COD/CREDIT → reduceStock (inventories) immediately
   - ONLINE → reserveInventory (Redis, 15min TTL)
4. Payment verified → finalizeReservation → Payment record (payments)
5. Invoice generated (invoices) + PDF stored (uploads/)
6. Shipment created (shipments) linked to warehouse
7. Logistics record (logistics) with delivery partner assignment
8. Delivery partner updates status + GPS → DELIVERED
9. Notifications at each stage (notifications) + Socket.IO events
10. Audit trail logged (audits) throughout
```

---

## 8. API Documentation

**Base URL:** `/api/v1`  
**Auth:** `Authorization: Bearer <accessToken>` + `x-csrf-token` header (on mutations)  
**Total Endpoints:** ~120 across 30 route modules

### 8.1 Authentication APIs (`/api/v1/auth`)

| Method | Route | Auth | Purpose | Request | Response |
|--------|-------|------|---------|---------|----------|
| POST | `/register` | No | User registration | `{name, email, mobile, password, role?}` | `{user, accessToken, refreshToken}` |
| POST | `/login` | No | Login with mobile+password | `{mobile, password}` | `{user, accessToken, refreshToken, csrfToken}` or 2FA challenge |
| POST | `/refresh-token` | No | Rotate tokens | `{refreshToken}` | `{accessToken, refreshToken}` |
| GET | `/csrf-token` | No | Get CSRF token | — | `{csrfToken}` |
| POST | `/2fa/verify` | No | Verify 2FA code | `{mobile, code}` | `{accessToken, refreshToken}` |
| POST | `/2fa/enable` | Yes+CSRF | Enable 2FA | — | `{secret, qrCode}` |
| POST | `/2fa/verify-setup` | Yes+CSRF | Confirm 2FA setup | `{code}` | `{backupCodes}` |
| POST | `/2fa/disable` | Yes+CSRF | Disable 2FA | `{code}` | `{success}` |
| POST | `/change-password` | Yes+CSRF | Change password | `{currentPassword, newPassword}` | `{success}` |
| POST | `/logout` | Yes+CSRF | Logout current session | `{refreshToken}` | `{success}` |
| POST | `/logout-all` | Yes+CSRF | Revoke all sessions | — | `{success}` |
| GET | `/sessions` | Yes | List active sessions | — | `{sessions[]}` |
| DELETE | `/sessions/:tokenId` | Yes+CSRF | Revoke specific session | — | `{success}` |

### 8.2 User APIs (`/api/v1/users`)

| Method | Route | Auth | Role | Purpose |
|--------|-------|------|------|---------|
| GET | `/me` | Yes | Any | Get current user profile |
| PUT | `/me` | Yes+CSRF | Any | Update profile |
| POST | `/profile-image` | Yes+CSRF | Any | Upload profile image |
| PUT | `/change-password` | Yes+CSRF | Any | Change password |
| GET | `/sessions` | Yes | Any | List sessions |
| POST | `/logout-all` | Yes+CSRF | Any | Logout all devices |
| GET | `/` | Yes | ADMIN+ | List all users |
| GET | `/:id` | Yes | ADMIN+ | Get user by ID |
| DELETE | `/:id` | Yes+CSRF | SUPER_ADMIN | Soft-delete user |

### 8.3 Product APIs (`/api/v1/products`)

| Method | Route | Auth | Purpose |
|--------|-------|------|---------|
| GET | `/` | **Public** | List products (cached 300s) |
| GET | `/:id` | **Public** | Get product (cached 600s) |
| POST | `/` | Yes+CSRF+Role | Create product |
| PUT | `/:id` | Yes+CSRF+Ownership | Update product |
| DELETE | `/:id` | Yes+CSRF+Ownership | Delete product |
| PATCH | `/:id/stock` | Yes+CSRF+ADMIN | Update stock |
| PATCH | `/:id/status` | Yes+ADMIN | Toggle active status |

### 8.4 Order APIs (`/api/v1/orders`)

| Method | Route | Auth | Middleware | Purpose |
|--------|-------|------|-----------|---------|
| POST | `/` | Yes+CSRF | orderLimiter, idempotency | Create order from cart/items |
| POST | `/:id/fail` | Yes+CSRF | — | Mark order as failed |
| PATCH | `/:id/status` | Yes+CSRF | ADMIN+ | Update order status |
| GET | `/` | Yes | — | List user's orders |
| GET | `/:id` | Yes | — | Get order details |
| GET | `/:id/invoice` | Yes | — | Download invoice PDF |

**Create Order Request:**
```json
{
  "items": [{"productId": "...", "quantity": 10}],
  "paymentMethod": "COD|CREDIT|RAZORPAY|HYBRID",
  "address": {"street": "...", "city": "...", "pincode": "..."},
  "idempotencyKey": "unique-key"
}
```

### 8.5 Payment APIs (`/api/v1/payments`)

| Method | Route | Auth | Purpose |
|--------|-------|------|---------|
| POST | `/webhook` | **Webhook sig** | Razorpay webhook handler |
| POST | `/create-order` | Yes+CSRF | Create Razorpay order |
| POST | `/verify` | Yes+CSRF | Verify payment signature |
| POST | `/hybrid` | Yes+CSRF | Credit + online hybrid payment |
| POST | `/initiate/:orderId` | Yes+CSRF | Initiate payment for order |
| POST | `/fail` | Yes+CSRF | Mark payment as failed |

### 8.6 Credit APIs (`/api/v1/credit`)

| Method | Route | Auth | Role | Purpose |
|--------|-------|------|------|---------|
| POST | `/` | Yes | ADMIN+ | Create credit account |
| GET | `/` | Yes | Any | Get user's credit info |
| GET | `/ledger` | Yes | Any | Get credit transaction history |
| POST | `/use` | Yes+CSRF | Any | Use credit for order |
| POST | `/repay` | Yes+CSRF | Any | Repay credit |

### 8.7 Inventory APIs (`/api/v1/inventory`)

| Method | Route | Auth | Role | Purpose |
|--------|-------|------|------|---------|
| POST | `/` | Yes+CSRF | ADMIN | Add stock to warehouse |
| GET | `/` | Yes | Any | List inventory |
| GET | `/low-stock` | Yes | ADMIN | Low stock alerts |
| GET | `/stats` | Yes | ADMIN | Inventory statistics |
| PATCH | `/update` | Yes+CSRF | ADMIN/VENDOR | Update stock levels |

### 8.8 Logistics APIs (`/api/v1/logistics`)

| Method | Route | Auth | Role | Purpose |
|--------|-------|------|------|---------|
| GET | `/delivery-queue` | Yes | ADMIN/DELIVERY | Pending deliveries |
| GET | `/history` | Yes | ADMIN/DELIVERY | Delivery history |
| GET | `/my-assignments` | Yes | DELIVERY | Partner's assignments |
| POST | `/:id/accept` | Yes+CSRF | DELIVERY | Accept delivery |
| POST | `/:id/start` | Yes+CSRF | DELIVERY | Start delivery |
| POST | `/:id/delivered` | Yes+CSRF | DELIVERY | Mark delivered |
| POST | `/:id/location` | Yes+CSRF | DELIVERY | Update GPS location |
| POST | `/:orderId` | Yes+CSRF | ADMIN | Create shipment |

### 8.9 Super Admin APIs (`/api/v1/super-admin` + `/api/v1/superadmin`)

| Method | Route | Purpose |
|--------|-------|---------|
| GET | `/users` | List all users |
| GET/POST/PATCH/DELETE | `/admins[/:id]` | Admin CRUD |
| PATCH | `/users/:id/role` | Change user role |
| GET | `/stats` | Platform statistics |
| GET | `/metrics` | System metrics |
| GET | `/audit-logs` | Audit log query |
| GET | `/audit-logs/export` | Export audit logs |
| GET/POST | `/config` | System configuration |
| GET/POST/PATCH/DELETE | `/categories[/:id]` | Category management |

### 8.10 Remaining API Modules (Summary)

| Module | Base Path | Endpoints | Auth |
|--------|-----------|-----------|------|
| Companies | `/companies` | 5 | Yes |
| Vendors | `/vendors` | 3 | Yes |
| Categories | `/categories` | 3 | Yes |
| Pricing | `/pricing` | 1 | No |
| Promotions | `/promotions` | 6 | Yes (ADMIN for CRUD) |
| Cart | `/cart` | 3 | Yes |
| Wishlist | `/wishlist` | 4 | Yes |
| Invoices | `/invoices` | 2 | Yes |
| Warehouses | `/warehouses` | 4 | Yes (ADMIN) |
| Shipments | `/shipments` | 6 | Yes |
| Notifications | `/notifications` | 2 | Yes |
| Analytics | `/analytics` | 6 | Yes (ADMIN+) |
| Settings | `/settings` | 4 | Mixed (public config open) |
| Support | `/support` | 4 | Yes |
| Reviews | `/reviews` | 2 | Mixed |
| Search | `/search` | 1 | No |
| Admin | `/admin` | 9 | Yes (ADMIN+) |

### 8.11 Health & Infrastructure Endpoints (no `/api` prefix)

| Method | Route | Purpose |
|--------|-------|---------|
| GET | `/health` | Basic health check |
| GET | `/health/live` | Liveness probe |
| GET | `/health/ready` | Readiness probe (DB + Redis) |
| GET | `/metrics` | System metrics |
| GET | `/uploads/:filename` | Static file serving |

---

## 9. Business Workflows

### 9.1 User Registration & Onboarding

```
1. User visits /register → fills name, email, mobile, password
2. POST /auth/register → password policy check + breach check
3. User created with status=PENDING (except SUPER_ADMIN)
4. Credit account auto-created (default ₹50,000 limit)
5. Admin reviews in /admin/approvals
6. Admin approves → status=ACTIVE
7. User logs in → role-based redirect:
   - B2B_CUSTOMER → /home
   - B2C_CUSTOMER → /home
   - ADMIN → /admin/dashboard
   - DELIVERY_PARTNER → /delivery/dashboard
   - SUPER_ADMIN → /super-admin/dashboard
```

### 9.2 B2B Customer Order Workflow

```
1. Browse products at /products (public, no auth)
2. Add to cart (localStorage + server cart on auth)
3. Navigate to /checkout
4. Select payment method: COD | CREDIT | RAZORPAY | HYBRID
5. POST /orders with idempotency key
   → Validates MOQ, bulk discounts (5-20%), GST 18%
   → B2B rule: total quantity > 1
6. Payment branch:
   a. COD → order CONFIRMED, stock reduced immediately
   b. CREDIT → credit deducted, order CONFIRMED, stock reduced
   c. RAZORPAY → order PENDING_PAYMENT, stock reserved (Redis 15min)
      → Redirect to /payment/:orderId
      → Razorpay checkout modal
      → POST /payments/verify with signature
      → Stock finalized, order CONFIRMED
   d. HYBRID → credit portion first, remainder via Razorpay
7. Invoice auto-generated (PDF)
8. Notification + Socket.IO event: payment:success
9. Shipment created → delivery partner assigned
10. Track via order timeline at /orders/:id
```

### 9.3 Vendor Workflow

```
1. Vendor registers or is created by admin
2. Vendor status=PENDING until admin approves
3. Vendor creates products (POST /products) with ownership
4. Vendor manages inventory at /vendor/inventory
5. Vendor updates company profile at /vendor/company
6. Orders containing vendor products trigger notifications
```

### 9.4 Admin Workflow

```
1. Login → /admin/dashboard
2. Review pending approvals (/admin/approvals)
3. Manage users (/admin/users)
4. Manage products (/admin/products)
5. Monitor orders (/admin/orders)
6. View analytics (/admin/analytics)
7. Manage inventory (/admin/inventory)
8. Manage warehouses (/admin/warehouse)
9. Create promotions (/admin/promotions)
10. Configure settings (/admin/settings)
```

### 9.5 Delivery Partner Workflow

```
1. Login → /delivery/dashboard (LogisticsPage)
2. View delivery queue (GET /logistics/delivery-queue)
3. Accept delivery (POST /logistics/:id/accept)
4. Start delivery (POST /logistics/:id/start)
5. Update GPS location (POST /logistics/:id/location)
6. Mark delivered (POST /logistics/:id/delivered)
7. View history at /delivery/history
```

### 9.6 Super Admin Workflow

```
1. Login → /super-admin/dashboard
2. View platform metrics (WelcomeHero + MetricsCards)
3. Manage admins (/super-admin/admins)
4. Manage partners/vendors (/super-admin/partners)
5. Manage customers (/super-admin/customers)
6. Manage delivery partners (/super-admin/delivery-partners)
7. Category control (/super-admin/categories)
8. System configuration (/super-admin/configuration)
9. Feature flags (/super-admin/features)
10. Security settings (/super-admin/security)
11. Audit logs (/super-admin/audit)
12. Revenue analytics (/super-admin/revenue)
```

### 9.7 Payment Workflow (Detailed)

```
1. Order created with PENDING_PAYMENT status
2. Frontend calls POST /payments/create-order {orderId, amount}
3. Backend creates Razorpay order → returns {razorpayOrderId, amount, currency}
4. Frontend opens Razorpay checkout modal (checkout.js)
5. User completes payment on Razorpay
6. Frontend receives {razorpay_payment_id, razorpay_order_id, razorpay_signature}
7. POST /payments/verify → HMAC signature validation
8. On success:
   - Distributed lock acquired (Redis)
   - Amount mismatch check (anti-fraud)
   - finalizeInventoryReservation
   - Payment record created (SUCCESS)
   - Order status → CONFIRMED, paymentStatus → PAID
   - Invoice generated
   - BullMQ post-payment job enqueued
   - Socket.IO: payment:success event
9. Webhook (parallel path):
   - POST /payments/webhook with Razorpay signature
   - Idempotent event processing
   - Same finalization logic
10. Reconciliation cron (every 5 min):
    - Stuck INITIATED/PENDING payments → FAILED
```

### 9.8 Inventory Workflow

```
1. Admin adds stock: POST /inventory {productId, warehouseId, quantity}
2. Optimistic locking via version field on concurrent updates
3. On order (COD/CREDIT): reduceStock atomically with retry
4. On order (ONLINE): reserveInventory in Redis (900s TTL)
5. On payment success: finalizeReservation → deduct from MongoDB
6. On payment failure/timeout: releaseReservation → restore Redis count
7. Low stock alerts: GET /inventory/low-stock (ADMIN)
8. Inventory sync cron job reconciles Redis ↔ MongoDB
```

---

## 10. Frontend Analysis

### 10.1 Routing Architecture

- **Router:** React Router v7 with `createBrowserRouter` pattern
- **Lazy Loading:** Register, ProductDetails, public pages use `React.lazy`
- **Guards:** `ProtectedRoute` (auth) → `RoleGuard` (role) → Layout → Page
- **50+ routes** across 5 layout types

### 10.2 Page Inventory (Routed vs Orphan)

| Status | Count | Examples |
|--------|-------|---------|
| Routed | 42 | Landing, Login, Products, Cart, Checkout, Admin pages, SuperAdmin pages |
| Orphan (exist, not routed) | 12 | InvoicePage, NotificationPage, SearchPage, OffersPage, ShipmentTrackingPage, ForgotPassword, VerifyOTP, Admin Vendors, Admin DeliveryPartners, HomePage.jsx |
| Broken references | 2 | `routes.DELIVERY` undefined in RoleGuard; `/shipment/:id` in OrderDetails but no route |

### 10.3 API Integration Pattern

```
Page → useHook → service.js → apiClient.js → Backend /api/v1/*
                                      ↓
                              Auto 401 refresh
                              CSRF header injection
                              Bearer token from Redux/localStorage
```

All HTTP goes through single `apiClient.js` — no raw `fetch()` in `src/`.

### 10.4 Real-Time Integration

| Event | Source | Consumers |
|-------|--------|-----------|
| `join` (emit) | SocketContext on connect | — |
| `payment:success` | Backend after payment | MainLayout, PaymentPage |
| `delivery:assigned` | Backend on assignment | MainLayout |
| `delivery:statusUpdated` | Backend on status change | useDelivery |
| `delivery:locationUpdated` | Backend on GPS update | useDelivery, RouteMap |

### 10.5 Form Handling

- Login: mobile + password (not email)
- Register: name, email, mobile, password, role selection
- Checkout: address, payment method, order summary
- Admin forms: product CRUD, user management, approval actions
- Super admin: config editor, category CRUD, admin management
- No form library (Formik/React Hook Form) — manual state management

### 10.6 Frontend Gaps

1. `npm test` is a no-op — Vitest never runs in CI
2. Playwright not in package.json dependencies
3. MSW referenced in tests but not in dependencies
4. `AuthContext` defined but not wired in AppProvider
5. `ThemeContext` defined but not wired
6. Duplicate service files (e.g., `authService.js` at module root AND in `services/`)
7. E2E tests expect email login; app uses mobile
8. `VITE_API_URL` vs `VITE_API_BASE_URL` naming inconsistency

---

## 11. Backend Analysis

### 11.1 Complete Execution Flow

```
server.js
  ├── validateEnv()
  ├── connectDB() → Mongoose
  ├── redisClient.connect()
  ├── createServer(app) → HTTP
  ├── configureSocketAdapter(io) → Socket.IO + Redis
  ├── startWorkers() → BullMQ (if ENABLE_WORKERS)
  ├── startCronJobs() → node-cron (if ENABLE_CRON)
  └── listen(PORT)

app.js
  ├── middleware chain (16 layers)
  ├── routes/index.js
  │   ├── /api/v1 → v1.routes.js (30 modules)
  │   ├── /api/v2 → v2.routes.js (placeholder)
  │   ├── /health, /metrics
  │   └── /uploads/*
  ├── notFound → errorHandler
```

### 11.2 Controller → Service → Repository Pattern

Every module follows consistent layering:
- **Controller:** HTTP request/response, calls service, uses `asyncHandler`
- **Service:** Business logic, validation, orchestration, external API calls
- **Repository:** Database queries, pagination, filtering
- **Validation:** Joi schemas validated by `validate.middleware.js`
- **Routes:** Express router with middleware chain per endpoint

### 11.3 Validation Strategy

- **Library:** Joi 17.13.3
- **Middleware:** `validate(schema)` applied per-route
- **FormData:** Type coercion for multipart uploads
- **Shared:** `validations/common.validation.js`, `objectId.validation.js`, `pagination.validation.js`

### 11.4 Background Processing

| Type | Component | Trigger | Action |
|------|-----------|---------|--------|
| Cron | `paymentReconcile.job.js` | Every 5 min | Mark stuck payments FAILED |
| Cron | `inventorySync.job.js` | Scheduled | Redis ↔ MongoDB sync |
| Cron | `cleanup.job.js` | Scheduled | Expired tokens, old data |
| Cron | `orderCleanup.job.js` | Scheduled | Abandoned orders |
| Worker | `postOrder.worker.js` | BullMQ job | Notifications, analytics |
| Worker | `postPayment.worker.js` | BullMQ job | Invoice, inventory finalize |
| Queue | `webhook.queue.js` | Payment webhook | Async webhook processing |
| Queue | `notification.queue.js` | Various events | Async notification delivery |

### 11.5 Backend Gaps

1. `audit.routes.js` exists but not mounted in v1.routes.js
2. `health.routes.js` exists but health handled directly in app.js
3. Dual auth: `protect`/`authorize` vs `authenticate`/`requirePermission`
4. `email.service.js` is a stub — no real email sending
5. `JWT_REFRESH_SECRET` required at startup but `auth.token.js` may use `JWT_SECRET`
6. Settings route ordering: `GET /:key` may intercept `/public/config`
7. Auth backup files (`auth.controller.BACKUP.js`) should be removed
8. No `Dockerfile` despite CI and docs referencing it

---

## 12. Security Audit

### 12.1 Security Score: **7.2 / 10**

### 12.2 Authentication Implementation

| Control | Status | Details |
|---------|--------|---------|
| Password hashing | ✅ Strong | bcryptjs with salt |
| Password policy | ✅ Strong | Length, complexity, breach check via `passwordPolicy.js` |
| JWT access tokens | ✅ Good | 15-minute expiry |
| JWT secret strength | ✅ Good | 64-char minimum enforced in production |
| Refresh token rotation | ✅ Strong | DB-backed with family revocation on reuse |
| 2FA (TOTP) | ✅ Implemented | @otplib + QR codes + backup codes |
| Session management | ✅ Good | List/revoke sessions via refresh token records |
| Account lockout | ✅ Good | Fraud detection service with Redis tracking |
| Password history | ✅ Implemented | Stored on User model |

### 12.3 Authorization Implementation

| Control | Status | Details |
|---------|--------|---------|
| Role-based access | ✅ Implemented | 6 roles with route-level guards |
| Permission-based (RBAC) | ✅ Implemented | ~80 granular permissions |
| Resource ownership | ✅ Implemented | `requireOwnershipOr` for products |
| SUPER_ADMIN bypass | ⚠️ By design | Full access — expected for platform owner |
| Maintenance mode | ✅ Implemented | Blocks non-super-admin |
| Account status gate | ✅ Implemented | PENDING users blocked until approval |
| Dual auth patterns | ⚠️ Inconsistent | `protect`/`authorize` vs `authenticate`/`requirePermission` |

### 12.4 Token & Secret Handling

| Item | Status | Risk |
|------|--------|------|
| JWT in localStorage (frontend) | ⚠️ | XSS can steal tokens — mitigated by XSS sanitization |
| CSRF protection | ✅ | Double-submit cookie on mutations |
| Webhook signature verification | ✅ | HMAC with RAZORPAY_WEBHOOK_SECRET |
| `.env` files on disk | ⚠️ | Present locally, gitignored but risk if committed |
| `JWT_REFRESH_SECRET` vs `JWT_SECRET` | ⚠️ | Both required; signing may use same secret |
| Encryption service | ✅ | AES with ENCRYPTION_SECRET for sensitive data |

### 12.5 Input Validation & Injection Prevention

| Threat | Mitigation | Status |
|--------|-----------|--------|
| NoSQL injection | `mongoSanitize.middleware.js` strips `$` and `.` keys | ✅ |
| XSS | `xssSanitize.middleware.js` + Helmet CSP | ✅ |
| SQL injection | N/A (MongoDB) | — |
| File upload attacks | MIME validation, size limits, malware signature check | ✅ |
| Request body size | 10MB limit on JSON/urlencoded | ✅ |
| Joi validation | Per-route schema validation | ✅ |
| ObjectId validation | `objectId.validation.js` | ✅ |

### 12.6 Missing Protections & Risks

| Issue | Severity | Recommendation |
|-------|----------|---------------|
| CORS vercel.app regex fallback | Medium | Overly permissive — restrict to known domains |
| No rate limiting on public product/search endpoints | Low | Add per-IP limits |
| `email.service.js` is stub | Low | No email verification on registration |
| No Content-Security-Policy on frontend | Medium | Add CSP headers via Vercel config |
| Tokens in localStorage | Medium | Consider httpOnly cookies for refresh tokens |
| No API request signing | Low | Optional for high-security deployments |
| Audit routes not mounted | Low | Audit only via super-admin endpoint |
| No brute-force CAPTCHA | Low | Rate limiting exists but no CAPTCHA |
| `.env` present on developer machines | Medium | Ensure never committed; use secrets manager in prod |
| No dependency vulnerability scanning in CI | Medium | npm audit runs but `continue-on-error: true` |

---

## 13. Performance Audit

### 13.1 Performance Score: **7.0 / 10**

### 13.2 Backend Bottlenecks

| Area | Issue | Impact | Recommendation |
|------|-------|--------|---------------|
| Product listing | No MongoDB text index confirmed | Slow search on large catalogs | Add text index on product name/description |
| N+1 queries | Possible in order creation (per-item product fetch) | Mitigated by bulk-fetch in order.service | Verify all list endpoints use aggregation |
| Redis cache TTL | Fixed 300-600s | Stale data after updates | `clearCacheMiddleware` exists — verify all mutation routes use it |
| Payment locks | Redis distributed lock with retry/backoff | Good pattern | Monitor lock contention under load |
| Inventory version conflicts | Optimistic locking with retry | Good for concurrency | May need tuning under high contention |
| Socket.IO | Single-process without Redis adapter by default | Can't scale horizontally | Enable `USE_SOCKET_REDIS_ADAPTER=true` |
| Cron jobs | Single-process | No distributed cron leader | Use BullMQ repeatable jobs instead |
| PDF generation | Synchronous in request path | Blocks event loop on large invoices | Already queued in post-payment worker |

### 13.3 Frontend Performance

| Area | Issue | Recommendation |
|------|-------|---------------|
| Bundle splitting | Manual vendor chunks in vite.config | Good — verify chunk sizes |
| Lazy loading | Used for some routes | Extend to all heavy pages (admin, superAdmin) |
| Redux re-renders | No memoization audit performed | Add React.memo on list components |
| Image loading | No lazy loading on product images | Add loading="lazy" + srcset |
| Duplicate API calls | No request deduplication | Consider RTK Query for caching |
| Console dropping | esbuild drops console in prod | Good |
| Source maps | Enabled in production build | Disable or restrict access in prod |

### 13.4 Database Index Recommendations

| Collection | Recommended Index | Reason |
|-----------|------------------|--------|
| `products` | `{name: "text", description: "text"}` | Search performance |
| `orders` | `{userId: 1, createdAt: -1}` | User order history |
| `orders` | `{status: 1, createdAt: -1}` | Admin order filtering |
| `payments` | `{orderId: 1, status: 1}` | Payment lookup |
| `inventories` | `{stock: 1}` | Low stock queries |
| `audits` | `{createdAt: -1, severity: 1}` | Audit log queries |
| `notifications` | `{userId: 1, isRead: 1}` | Unread notifications |

### 13.5 Scalability Concerns

1. **Single MongoDB instance** — no sharding config documented
2. **No read replicas** — all reads hit primary
3. **BullMQ workers in same process** — should be separate deployment units at scale
4. **No CDN for API responses** — only static uploads
5. **No connection pooling on frontend** — Axios singleton is fine for browser

---

## 14. Testing Audit

### 14.1 Testing Score: **6.5 / 10**

### 14.2 Backend Testing

| Type | Files | Coverage Target | CI Integration |
|------|-------|----------------|----------------|
| Unit | 9 | 80-90% (auth/payment/inventory) | ✅ Runs in backend-ci.yml |
| Integration | 28 | 80% global | ✅ With Mongo + Redis services |
| E2E | 2 | — | ✅ With services |
| Load | 14 | — | ❌ Not in CI |

**Strengths:**
- Comprehensive payment/inventory/order test suites
- Concurrency and webhook replay tests
- Queue lifecycle, retry, DLQ tests (phase 6)
- Load tests exist (phase 7) but not CI-integrated
- mongodb-memory-server for isolated tests
- Razorpay mock helper

**Gaps:**
- No tests for: superAdmin, logistics, analytics, settings modules
- Load tests not in CI pipeline
- Coverage thresholds may not be enforced (no Codecov gate visible in root CI)

### 14.3 Frontend Testing

| Type | Files | Coverage Target | CI Integration |
|------|-------|----------------|----------------|
| Unit (Vitest) | 39 | 80% | ❌ `npm test` is no-op stub |
| E2E (Playwright) | 3 | — | ❌ Not in CI, not in package.json |

**Strengths:**
- Good component test coverage (UI kit, guards, landing)
- MSW mocks configured for API testing
- Accessibility tests exist
- Vitest config with 80% thresholds

**Gaps:**
- **Critical:** `package.json` test script does not run Vitest
- Playwright not in dependencies
- MSW not in dependencies
- Tests reference missing components (`OTPInput`, `dateFormatter`)
- E2E tests likely stale (email vs mobile login)
- No integration tests for admin/superAdmin workflows
- No coverage reports generated

### 14.4 Missing Test Areas

| Area | Priority | Suggested Tests |
|------|----------|----------------|
| Frontend checkout flow | High | Vitest integration with MSW |
| Frontend payment page | High | Razorpay mock + verify flow |
| Super admin pages | Medium | Component + API mock tests |
| Delivery partner flow | Medium | Logistics hook tests |
| Backend superAdmin module | Medium | Integration tests |
| Backend logistics module | Medium | Delivery assignment tests |
| Cross-browser E2E | Low | Playwright multi-browser |
| Contract tests (API) | Low | Pact or OpenAPI validation |

---

## 15. DevOps Audit

### 15.1 DevOps Score: **5.5 / 10**

### 15.2 CI/CD Pipeline Analysis

#### Root CI (Active)

| Workflow | Triggers | Jobs | Services |
|----------|----------|------|----------|
| `backend-ci.yml` | Push/PR to main, development, release/** (path: b2b-backend/**) | lint, unit-tests, integration-tests, e2e-tests, build-validation, security-audit, ci-success | Mongo 7, Redis 7 |
| `frontend-ci.yml` | Push/PR (path: b2b-frontend/**) | lint, build, test (stub), type-check, security-audit, vercel-preview, ci-success | — |

#### Nested CI (Legacy/Broken)

| Workflow | Issue |
|----------|-------|
| `b2b-backend/.github/workflows/ci-cd.yml` | References `./Dockerfile` which does not exist; Node 18.x; may conflict with root CI |

### 15.3 Build Process

| App | Build Command | Output | Notes |
|-----|--------------|--------|-------|
| Backend | No build step (Node.js direct) | — | `npm ci --production` for validation |
| Frontend | `vite build` | `dist/` | Manual vendor chunks, sourcemaps, Sentry upload |

### 15.4 Deployment

| Component | Target | Config | Status |
|-----------|--------|--------|--------|
| Frontend | Vercel | `vercel.json` (SPA rewrite) | ✅ Configured |
| Backend | Render | Hardcoded in CORS + apiClient fallback URL | ✅ Referenced |
| Backend Docker | GHCR | Referenced in legacy CI | ❌ No Dockerfile |
| Database | MongoDB Atlas / local | `MONGO_URI` | Manual setup |
| Redis | Local / cloud | `REDIS_HOST` | Manual setup |

### 15.5 Environment Management

| Concern | Status |
|---------|--------|
| `.env.example` (frontend) | ✅ Present |
| `.env.example` (backend) | ❌ Missing (documented in README) |
| Secrets in CI | ✅ GitHub Secrets for test vars |
| `.env` gitignored | ✅ Both apps |
| `package-lock.json` gitignored at root | ⚠️ Unusual — lockfiles may drift |
| Environment parity | ⚠️ CI uses test values; no staging config |

### 15.6 Logging & Monitoring

| Component | Tool | Status |
|-----------|------|--------|
| Backend logging | Winston (console + optional file) | ✅ |
| Backend errors | Sentry | ✅ (optional DSN) |
| Backend metrics | `/metrics` endpoint + monitoring middleware | ✅ |
| Backend request logging | Morgan + structured requestLogger | ✅ |
| Frontend errors | Sentry React | ✅ |
| Frontend logging | Custom logger.js (dev only) | ⚠️ Basic |
| APM/tracing | Sentry profiling (backend) | ✅ Optional |
| Log aggregation | — | ❌ No ELK/Datadog/CloudWatch |
| Alerting | — | ❌ No alert rules configured |
| Uptime monitoring | Health endpoints exist | ⚠️ No external monitor configured |

### 15.7 Production Readiness Checklist

| Item | Status |
|------|--------|
| Health checks (liveness/readiness) | ✅ |
| Graceful shutdown | ✅ (server.js) |
| Environment validation at startup | ✅ |
| CI/CD pipelines | ✅ (partial — frontend tests broken) |
| Docker containerization | ❌ |
| Infrastructure as Code | ❌ |
| Secrets management | ⚠️ Manual .env |
| Database backups | ⚠️ Script exists, no automation |
| CDN for static assets | ⚠️ Optional Cloudflare config |
| SSL/TLS | ✅ (Vercel/Render handle) |
| Rate limiting | ✅ |
| Error tracking | ✅ (Sentry) |

---

## 16. Feature Inventory

### 16.1 Existing Features (Complete)

| Module | Feature | Backend | Frontend |
|--------|---------|---------|----------|
| Auth | Registration, login, logout | ✅ | ✅ |
| Auth | JWT + refresh token rotation | ✅ | ✅ |
| Auth | 2FA (TOTP) | ✅ | ⚠️ UI partial |
| Auth | Session management | ✅ | ⚠️ Security page only |
| Auth | Password change | ✅ | ✅ |
| Products | Catalog browsing | ✅ | ✅ |
| Products | Product details | ✅ | ✅ |
| Products | Admin CRUD | ✅ | ✅ |
| Products | Bulk pricing display | ✅ | ✅ |
| Cart | Add/remove/view | ✅ | ✅ |
| Orders | Create order | ✅ | ✅ |
| Orders | Order history | ✅ | ✅ |
| Orders | Order details + timeline | ✅ | ✅ |
| Orders | Invoice download | ✅ | ⚠️ No dedicated page |
| Payments | Razorpay integration | ✅ | ✅ |
| Payments | Hybrid (credit+online) | ✅ | ✅ |
| Payments | Webhook handling | ✅ | — |
| Credit | Credit account | ✅ | ✅ |
| Credit | Ledger view | ✅ | ✅ |
| Inventory | Stock management | ✅ | ✅ |
| Warehouse | CRUD | ✅ | ✅ |
| Admin | User approvals | ✅ | ✅ |
| Admin | Dashboard + stats | ✅ | ✅ |
| Admin | Analytics | ✅ | ✅ |
| Super Admin | Full platform control | ✅ | ✅ |
| Super Admin | Audit logs | ✅ | ✅ |
| Super Admin | System config | ✅ | ✅ |
| Super Admin | Category management | ✅ | ✅ |
| Delivery | Queue + assignments | ✅ | ✅ |
| Delivery | GPS tracking | ✅ | ✅ |
| Delivery | Status workflow | ✅ | ✅ |
| Landing | Marketing page | — | ✅ |
| Public | Pricing, About, Contact, Solutions | — | ✅ |
| Notifications | In-app + Socket.IO | ✅ | ⚠️ No page routed |
| Promotions | CRUD + apply coupon | ✅ | ✅ |
| Wishlist | CRUD | ✅ | ✅ |
| Settings | System settings | ✅ | ✅ |
| Support | Ticket creation | ✅ | ⚠️ No page |
| Reviews | Add/view reviews | ✅ | ⚠️ No page routed |
| Search | Product search API | ✅ | ⚠️ No page routed |
| Real-time | Socket.IO events | ✅ | ✅ |

### 16.2 Partially Completed Features

| Feature | Backend | Frontend | Gap |
|---------|---------|----------|-----|
| 2FA setup UI | ✅ API | ⚠️ Security page partial | No dedicated 2FA setup flow |
| Email notifications | ⚠️ Stub service | — | No email provider integrated |
| Invoice management | ✅ PDF generation | ⚠️ InvoicePage exists, not routed | No invoice list UI |
| Shipment tracking | ✅ API | ⚠️ Page exists, not routed | Route not registered |
| Vendor management | ✅ API | ⚠️ Vendors.jsx not routed | Admin vendor page missing |
| Delivery partner admin | ✅ API | ⚠️ DeliveryPartners.jsx not routed | Admin delivery page missing |
| Forgot password | — | ⚠️ Page exists, not routed | No backend endpoint |
| OTP verification | — | ⚠️ Page exists, not routed | No backend OTP flow (only 2FA) |
| Offers module | — | ⚠️ Page + service (GET /offers) | Backend endpoint missing |
| Theme switching | — | ⚠️ ThemeContext exists, not wired | Dark mode not functional |
| User addresses | — | ⚠️ Addresses.jsx not routed | Partial backend support |
| User activity logs | — | ⚠️ ActivityLogs.jsx not routed | No backend endpoint |
| Refund UI | ✅ API | — | No frontend refund management |
| Company management | ✅ API | ✅ Vendor route only | No admin company view |

### 16.3 Missing Features

| Feature | Priority | Notes |
|---------|----------|-------|
| Email verification on registration | High | email.service is stub |
| Password reset via email | High | ForgotPassword page exists but no API |
| Mobile app | Medium | MobileAppPromotion component references it |
| Multi-language (i18n) | Medium | English only |
| Product comparison | Low | — |
| Order cancellation by customer | Medium | Backend has cancel permission, no UI |
| Refund management UI | Medium | Backend complete, no frontend |
| Reporting/PDF export (admin) | Medium | Analytics exists, no export |
| Bulk order import (B2B) | Medium | Common B2B need |
| Vendor dashboard | Medium | Vendors use admin routes |
| Chat/support live chat | Low | Support tickets only |
| Product recommendations | Low | — |
| Subscription/recurring orders | Low | — |
| GST invoice compliance (India) | Medium | Basic GST calculation exists |
| Multi-warehouse order splitting | Medium | Single warehouse per order |

### 16.4 Hidden/Undocumented Features

| Feature | Location | Notes |
|---------|----------|-------|
| Pricing engine | `pricing.engine.js` | POST /pricing not exposed in frontend |
| Route optimization | `routeOptimization.js` | Backend helper, not exposed via API |
| IP blocking | `ipBlock.middleware.js` | Dynamic from settings, no UI |
| Feature flags (runtime) | `featureFlag.service.js` + settings | Super admin FeaturesPage |
| Payment reconciliation cron | `paymentReconcile.job.js` | Runs every 5 min, no UI indicator |
| Idempotency system | `idempotency.middleware.js` | Transparent to users |
| Fraud detection | `fraudDetection.service.js` | Login lockout, no admin UI |
| CDN integration | `cdn.js` | Optional Cloudflare, no UI |
| Database shell | `DbShell.jsx` | Super admin component |
| API v2 placeholder | `v2.routes.js` | Returns JSON stub |

---

## 17. Quality Assessment

| Dimension | Score | Explanation |
|-----------|-------|-------------|
| **Architecture** | 7/10 | Clean modular monolith on backend; frontend has orphan pages and duplicate patterns. No workspace tooling at root. |
| **Frontend** | 6/10 | Modern stack (React 19, Vite 8, Tailwind v4) with good component library. Undermined by unrouted pages, broken RoleGuard redirect, test script stub, and env var inconsistencies. |
| **Backend** | 8/10 | Production-grade patterns: idempotency, distributed locks, optimistic locking, token rotation, webhook verification, comprehensive middleware. Minor inconsistencies in auth patterns. |
| **Security** | 7/10 | Strong middleware stack (Helmet, CSRF, sanitizers, rate limits, 2FA). Weakened by localStorage tokens, permissive CORS fallback, and missing email verification. |
| **Scalability** | 6/10 | Redis caching, BullMQ queues, Socket.IO adapter support. Limited by single-process workers, no Docker/K8s, no read replicas. |
| **Maintainability** | 7/10 | Consistent module pattern on backend. Frontend has duplicate service files and unused contexts. Good code-guide docs on backend. |
| **Testing** | 6/10 | Backend: 39 test files with good coverage targets. Frontend: 39 test files exist but CI runs no-op. Load tests not in CI. |
| **DevOps** | 5/10 | Split CI pipelines work for backend. Missing Dockerfile, no IaC, frontend tests broken in CI, no log aggregation. |
| **Documentation** | 6/10 | Backend README + 16 code-guide docs excellent. Frontend has planning docs. No root README. API docs (OpenAPI) partial. |

**Overall Project Score: 6.7 / 10**

---

## 18. Strengths

1. **Production-grade payment system** — Razorpay integration with distributed locks, webhook verification, hybrid payments, reconciliation cron, and comprehensive test suite
2. **Robust inventory management** — Optimistic locking, Redis reservations, finalize/release pattern with concurrency tests
3. **Layered security middleware** — 16-layer request pipeline with CSRF, sanitization, rate limiting, IP blocking, and audit trail
4. **Refresh token rotation** — DB-backed family revocation with reuse detection
5. **Comprehensive RBAC** — 80+ granular permissions with role mapping
6. **Real-time capabilities** — Socket.IO for payment/delivery events with optional Redis adapter for scaling
7. **Background processing** — BullMQ workers, cron jobs, and queue lifecycle tests
8. **Backend documentation** — 16 code-guide documents covering architecture, payments, inventory, security, deployment
9. **Modern frontend stack** — React 19, Vite 8, Tailwind v4, Redux Toolkit
10. **Feature-rich super admin portal** — 18 pages covering full platform governance
11. **Graceful shutdown** — Proper cleanup of HTTP, Socket.IO, workers, MongoDB, Redis
12. **Idempotency** — Redis-backed duplicate prevention for orders and inventory operations

---

## 19. Weaknesses

1. **No root-level project orchestration** — No README, workspace config, or docker-compose for local dev
2. **Frontend test pipeline broken** — `npm test` is a no-op; 39 Vitest files never execute in CI
3. **12+ orphan frontend pages** — Built but not routed (Invoice, Notification, Search, Offers, Shipment, etc.)
4. **Missing Dockerfile** — Referenced in CI and docs but not in repository
5. **Dual auth patterns on backend** — `protect`/`authorize` and `authenticate`/`requirePermission` used inconsistently
6. **Email service is stub** — No email verification, password reset, or notification emails
7. **Duplicate frontend service files** — e.g., `authService.js` at module root and in `services/` subdirectory
8. **Unused contexts** — `AuthContext`, `ThemeContext` defined but not wired
9. **Broken RoleGuard redirect** — `routes.DELIVERY` undefined in routeConfig.js
10. **Legacy/dead code** — auth backup files, unused layouts (UserLayout), unused guards (RoleBasedRoute)
11. **package-lock.json gitignored** — Unusual choice that may cause dependency drift
12. **No staging environment** — Only production URLs hardcoded (Render + Vercel)

---

## 20. Risks

| Risk | Severity | Likelihood | Impact |
|------|----------|-----------|--------|
| Frontend regressions undetected | **High** | High | Tests don't run in CI |
| Dependency drift (no lockfiles tracked) | **Medium** | Medium | Build failures in CI/prod |
| Token theft via XSS | **Medium** | Low | localStorage JWT storage |
| Payment race conditions | **Low** | Low | Mitigated by distributed locks (tested) |
| Inventory overselling | **Low** | Low | Mitigated by optimistic locking + reservations (tested) |
| Unauthorized access via dual auth patterns | **Medium** | Low | Inconsistent middleware application |
| Data loss (no automated backups) | **High** | Medium | backup.js exists but not scheduled |
| Single point of failure (no redundancy) | **Medium** | Medium | Single MongoDB, single Redis |
| Secrets exposure (.env on disk) | **Medium** | Low | Gitignored but present locally |
| Stale E2E tests giving false confidence | **Medium** | High | Email vs mobile login mismatch |
| CORS bypass via vercel.app regex | **Low** | Low | Any Vercel deployment allowed |

---

## 21. Missing Features

### High Priority
- Email verification and password reset flow
- Frontend test execution in CI
- Docker/containerization for backend
- Root README with setup instructions
- Route orphan pages (Invoice, Notification, Search, Shipment tracking)
- Fix RoleGuard `routes.DELIVERY` bug

### Medium Priority
- Refund management UI
- Order cancellation UI for customers
- Vendor-specific dashboard
- Admin vendor/delivery partner pages (wire existing components)
- Email notification provider integration
- Staging environment configuration
- Database backup automation
- Frontend env var naming consistency

### Low Priority
- i18n/multi-language support
- Product recommendations
- Live chat support
- Subscription orders
- API v2 implementation
- Dark mode (wire ThemeContext)
- Contract testing

---

## 22. Recommendations

### Immediate (Week 1)

1. **Fix frontend test script** — Change `package.json` test to `"vitest run"` and add Vitest/MSW to CI
2. **Route orphan pages** — Register Invoice, Notification, Search, Shipment, ForgotPassword routes in AppRoutes.jsx
3. **Fix RoleGuard bug** — Add `DELIVERY: '/delivery/dashboard'` to routeConfig.js
4. **Create root README.md** — Setup instructions for both apps, env vars, local dev commands
5. **Remove dead code** — auth backup files, unused RoleBasedRoute, wire or remove AuthContext/ThemeContext
6. **Add backend `.env.example`** — Document all required/optional env vars

### Short-term (Month 1)

7. **Create Dockerfile** — For backend with multi-stage build; fix legacy CI or remove it
8. **Add docker-compose.yml** — MongoDB + Redis + backend + frontend for local dev
9. **Unify auth middleware** — Migrate all routes to `authenticate` + `requirePermission` pattern
10. **Integrate email provider** — SendGrid/SES for verification, password reset, order notifications
11. **Track package-lock.json** — Remove from .gitignore for reproducible builds
12. **Wire frontend CI tests** — Run `npx vitest run --coverage` in frontend-ci.yml
13. **Update E2E tests** — Fix auth spec to use mobile login field
14. **Mount audit routes** — Or document that audit is super-admin only

### Medium-term (Quarter 1)

15. **Add MongoDB indexes** — As recommended in Section 13.4
16. **Implement password reset API** — Backend endpoint + wire ForgotPassword page
17. **Add staging environment** — Separate Render/Vercel preview deployments
18. **Set up log aggregation** — CloudWatch, Datadog, or ELK stack
19. **Automate database backups** — Cron job or MongoDB Atlas backup
20. **Add contract tests** — Validate frontend services against OpenAPI spec
21. **Consolidate duplicate services** — Single service file per module in frontend
22. **Add load tests to CI** — Run on release branches

### Long-term

23. **Kubernetes deployment** — For horizontal scaling of backend + workers
24. **Read replicas** — MongoDB read preference for product/catalog queries
25. **API v2** — GraphQL or improved REST with versioning
26. **Mobile app** — React Native or Flutter companion
27. **Multi-tenant architecture** — If expanding to multiple B2B marketplaces

---

## 23. Final Verdict

**Mokshith Enterprises** is a **substantially built B2B/B2C e-commerce platform** with a backend that demonstrates production engineering maturity — particularly in payments, inventory concurrency, and security middleware. The backend alone would score 8/10 for a wholesale commerce API.

The frontend has been actively developed (evidenced by the `feature/frontendUI` branch with new landing page, super admin portal, and public pages) but suffers from **integration debt**: pages built without routes, tests written without CI wiring, and duplicate patterns from iterative development.

### Project Maturity Assessment

| Stage | Component |
|-------|-----------|
| **Production-ready** | Backend API core (auth, orders, payments, inventory) |
| **Production-ready** | Backend security middleware |
| **Production-ready** | Backend test suite |
| **Near production** | Frontend UI components and design system |
| **Near production** | Super admin portal |
| **Needs work** | Frontend routing completeness |
| **Needs work** | Frontend test CI integration |
| **Needs work** | DevOps (Docker, IaC, monitoring) |
| **Needs work** | Email notifications |
| **Not started** | Mobile app, i18n, staging environment |

### Overall Verdict

The project is **~75% complete** for a minimum viable B2B platform. The backend can support production traffic for core commerce operations. The frontend provides functional user, admin, and super-admin experiences but requires routing fixes, test CI integration, and cleanup of technical debt before being considered production-grade.

**Recommended next step:** Fix the frontend test pipeline and route orphan pages, then deploy to staging for end-to-end validation before production launch.

---

*End of PROJECT COMPLETE ANALYSIS*  
*Generated: June 11, 2026*  
*Files analyzed: 811*  
*API endpoints documented: ~120*  
*Database models documented: 24*  
*Test files documented: 78 (39 backend + 39 frontend)*



