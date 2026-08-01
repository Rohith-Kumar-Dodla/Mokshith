# BACKEND IMPLEMENTATION DOCUMENTATION
## Mokshith B2B Platform  -  Master Reference for Enterprise QA, Security Review & Production Certification

| Field | Value |
|-------|-------|
| **Document Type** | Complete Backend Implementation Reference |
| **Project** | `b2b-backend` (`Production/b2b-backend`) |
| **Package Version** | 1.0.0 |
| **Runtime** | Node.js >= 20 (ES Modules) |
| **Stack** | Express 5 + Mongoose 9 + Redis (ioredis) + BullMQ + Socket.io + Joi + Winston + Razorpay |
| **Architecture** | Modular monolith (`src/modules/*`) with shared middlewares, queues, workers, and services |
| **API Base** | `/api/v1` (also aliased at `/api`) |
| **Document Generated** | 2026-07-27 |
| **Methodology** | Exhaustive source read of routes, controllers, services, models, middlewares, queues, workers, jobs, config |

> This document describes **what is currently implemented** in the backend. It is the master reference for enterprise testing, security review, production certification, and maintenance.

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Technology & Configuration Inventory](#2-technology--configuration-inventory)
3. [Application Bootstrap & Middleware Stack](#3-application-bootstrap--middleware-stack)
4. [Complete API Inventory](#4-complete-api-inventory)
5. [Complete Authentication Flow](#5-complete-authentication-flow)
6. [Complete Authorization Matrix](#6-complete-authorization-matrix)
7. [Complete Database Inventory](#7-complete-database-inventory)
8. [Complete Module Inventory](#8-complete-module-inventory)
9. [Complete Validation Inventory](#9-complete-validation-inventory)
10. [Complete Business Rule Inventory](#10-complete-business-rule-inventory)
11. [Complete Payment Flow](#11-complete-payment-flow)
12. [Complete Order Flow](#12-complete-order-flow)
13. [Complete Cart Flow](#13-complete-cart-flow)
14. [Complete Product Flow](#14-complete-product-flow)
15. [Complete Notification Flow](#15-complete-notification-flow)
16. [Complete Background Job Inventory](#16-complete-background-job-inventory)
17. [Complete Cache Inventory](#17-complete-cache-inventory)
18. [Complete Security Inventory](#18-complete-security-inventory)
19. [Complete Error Handling Inventory](#19-complete-error-handling-inventory)
20. [Complete Logging Inventory](#20-complete-logging-inventory)
21. [Logistics, Credit & Supporting Modules](#21-logistics-credit--supporting-modules)
22. [Known Implementation Limitations](#22-known-implementation-limitations)
23. [Backend Statistics](#23-backend-statistics)

---

## 1. System Overview

### 1.1 Product Purpose

Backend for Mokshith B2B wholesale commerce. Serves four primary actor types via JWT-authenticated REST APIs, plus public catalog/search and a Razorpay webhook.

| Role | Backend Enum | Primary Capabilities |
|------|--------------|----------------------|
| Super Admin | `SUPER_ADMIN` | Platform governance, admin CRUD, analytics/revenue, bank-proof approval, audit, config |
| Admin | `ADMIN` | Catalog/inventory, vendor/user approvals, order workflow, delivery assignment, ops stats |
| Vendor / B2B Customer | `VENDOR` / `B2B_CUSTOMER` | Browse, cart, checkout, credit, invoices, wishlist, bank-transfer proofs |
| Delivery Partner | `DELIVERY_PARTNER` | Accept/pick/start/deliver/complete shipments, location updates |
| B2C Customer | `B2C_CUSTOMER` | Similar to B2B minus credit (role exists in permissions matrix) |

### 1.2 Architectural Style

- **Modular monolith**: each domain under `src/modules/<name>/` typically contains routes, controller, service, model, validation, repository.
- **Entry**: `server.js` loads env, connects Mongo + Redis, creates HTTP + Socket.io, starts cron/workers when gated.
- **App factory**: `src/app.js` wires global middleware and mounts `/api`.
- **Dual mount**: v1 routes at `/api/v1` and `/api` for backward compatibility.
- **Realtime**: Socket.io rooms by `userId`; optional Redis adapter.
- **Async work**: BullMQ queues + node-cron; many workers stubbed or orphaned (see Section 16).

### 1.3 Source Tree

```
Production/b2b-backend/
|- server.js
|- scripts/ (db init, QA seed, migration preview, auth utilities)
|- dangerous-dev-tools/ (destructive seeds  -  gated)
`- src/
   |- app.js, bootstrap/
   |- config/
   |- constants/
   |- middlewares/ (23 files)
   |- modules/ (auth, user, product, order, payment, logistics, ...)
   |- models/ (RefreshToken, PasswordResetToken)
   |- routes/ (v1, v2; orphan health.routes.js)
   |- services/, queues/, workers/, jobs/
   |- utils/, validations/, errors/
   `- uploads/invoices/
```

---

## 2. Technology & Configuration Inventory

### 2.1 Runtime Dependencies (selected)

| Package | Role |
|---------|------|
| express ^5.2 | HTTP framework |
| mongoose ^9.6 | MongoDB ODM |
| ioredis / redis | Cache, locks, rate limit, queues |
| bullmq ^5.41 | Job queues |
| jsonwebtoken / bcryptjs | Auth |
| joi / validator | Validation / XSS escape |
| helmet / cors / compression / cookie-parser | Security & HTTP |
| express-rate-limit | Rate limiting |
| razorpay | Payments |
| cloudinary / @aws-sdk/client-s3 | Uploads |
| socket.io / @socket.io/redis-adapter | Realtime |
| winston / morgan / @sentry/node | Logging & APM |
| multer / pdfkit / qrcode / @otplib | Uploads, invoices, 2FA |
| node-cron | Scheduled jobs |

### 2.2 Environment Variables

| Variable | Required | Purpose |
|----------|----------|---------|
| `NODE_ENV` | Yes | development / qa / uat / production / test |
| `PORT` | No (5000) | HTTP port |
| `FRONTEND_URL` | Recommended | CORS + password-reset links |
| `MONGO_URI` / `MONGO_URI_DIRECT` | Yes | Mongo connection |
| `APP_DATABASE_NAME` | Env-gated | Expected DB name per environment |
| `USE_IN_MEMORY_MONGO` | Dev | Embedded Mongo for local |
| `JWT_SECRET` | Yes (>=64 chars prod) | Access + refresh JWT signing |
| `JWT_REFRESH_SECRET` | Validated | Present in env validation but **unused by token signer** |
| `JWT_EXPIRES_IN` | No (15m) | Access TTL |
| `JWT_REFRESH_EXPIRES_IN` | No (7d) | Refresh TTL |
| `AUTH_STRICT_MODE` | No (default true) | Password/fraud/rate-limit strictness |
| `RAZORPAY_KEY_ID/SECRET/WEBHOOK_SECRET` | Online pay | Gateway |
| `REDIS_*` / `REDIS_URL` | Recommended | Redis |
| `USE_SOCKET_REDIS_ADAPTER` | No | Socket horizontal scale |
| `CLOUDINARY_*` | Recommended | Image CDN |
| `USE_S3_STORAGE` + `S3_*` | Optional | Object storage |
| `SMTP_*` | Optional | Email (currently console mock) |
| `SENTRY_DSN` | Optional | Error tracking |
| `ENABLE_CRON` / `ENABLE_WORKERS` | Optional | Background processing gates |
| `LOG_LEVEL` | Optional | Winston level |
| `ENFORCE_CSRF_IN_TESTS` | Test | Force CSRF in test env |

### 2.3 Environment Database Policy

| NODE_ENV | Expected DB |
|----------|-------------|
| development | `mokshith-dev` |
| qa | `mokshith-qa` |
| uat | `mokshith-uat` |
| production | `mokshith-production` |
| test | `mokshith-test` |

Connect options: pool 2-10, serverSelectionTimeout 10s, socketTimeout 45s, IPv4 first. Production blocks `dropDatabase` / collection drop.

---

## 3. Application Bootstrap & Middleware Stack

### 3.1 Startup Sequence (`server.js`)

1. `loadEnv()` then `validateEnv()`
2. `initializeSentry(app)`
3. `setupQueryTimeout()`
4. `connectDB()` (+ Super Admin bootstrap)
5. `redisClient.connect()`
6. HTTP server + Socket.io
7. Optional Redis socket adapter; `global.io`
8. Listen on `PORT`
9. Conditionally `startCronJobs` / `startWorkers`
10. Graceful shutdown handlers

### 3.2 Global Middleware Order

| # | Middleware | Behavior |
|---|------------|----------|
| 1 | Upload CORS + static `/uploads` | Serve files |
| 2 | Health mounts | `/health`, `/api/health`, `/api/v1/health` (+ live/ready/redis) |
| 3 | `trust proxy = 1` | Correct client IP |
| 4 | Sentry request/tracing | Shim/passthrough in current setup |
| 5 | `correlationMiddleware` | `x-correlation-id` / `x-request-id` |
| 6 | monitoring + errorRateTracker | Duration, slow >3s |
| 7 | compression | Skip if `x-no-compression` |
| 8 | corsConfig | Allowlist + credentials |
| 9 | ipBlockMiddleware | Setting `blockedIps` |
| 10 | timeoutMiddleware(30000) | 408 after 30s |
| 11 | Helmet + mongoSanitize + xssSanitize + apiLimiter | Security |
| 12 | cookieParser | Cookies |
| 13 | express.json 10mb (rawBody for webhook) | Body parse |
| 14 | morgan + requestLogger | Access logs |
| 15 | idempotencyMiddleware | Header-gated Redis dedupe |
| 16 | `/metrics` | Monitoring |
| 17 | `/api` routes | v1/v2 |
| 18 | notFound | 404 JSON |
| 19 | Sentry error handler | Passthrough |
| 20 | errorHandler | Normalized JSON errors |

### 3.3 API Mounting

```
/api/v1/*  -> v1.routes.js (primary)
/api/*     -> v1.routes.js (alias)
/api/v2/*  -> v2.routes.js (placeholder)
```

`src/routes/health.routes.js` exists but is **not mounted** (orphaned).

---

## 4. Complete API Inventory

All v1 paths are available under **both** `/api/v1/...` and `/api/...`. Tables show canonical `/api/v1` paths.

### 4.1 Health / Metrics / Static / v2

| METHOD | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | `/health`, `/api/health`, `/api/v1/health` | No | Full health |
| GET | `*/health/live` | No | Liveness |
| GET | `*/health/ready` | No | Readiness (DB + Redis) |
| GET | `/api/v1/health/redis` | No | Redis-only |
| GET | `/metrics` | No | Monitoring metrics |
| GET | `/uploads/:filename`, `/uploads/:folder/:filename` | No | Serve uploads |
| GET | `/api/v2/`, `/api/v2/health` | No | v2 placeholders |

### 4.2 Auth  -  `/api/v1/auth` (requireDatabase)

| METHOD | Path | Auth | CSRF | Extra | Purpose |
|--------|------|------|------|-------|---------|
| POST | `/auth/register` | No | Issues token | authLimiter, registrations flag, Joi | Register PENDING |
| POST | `/auth/login` | No | Issues token | authLimiter, Joi | Login or 2FA challenge |
| POST | `/auth/forgot-password` | No | No | authLimiter | Reset request |
| POST | `/auth/reset-password` | No | No | authLimiter | Reset with token |
| POST | `/auth/refresh-token` | No | No |  -  | Rotate tokens |
| GET | `/auth/csrf-token` | No | No |  -  | Issue CSRF |
| POST | `/auth/logout` | No | No |  -  | Revoke refresh |
| POST | `/auth/2fa/verify` | No | No | authLimiter | Complete 2FA login |
| POST | `/auth/2fa/enable` | Yes | Yes |  -  | Start TOTP setup |
| POST | `/auth/2fa/verify-setup` | Yes | Yes | Joi | Confirm 2FA |
| POST | `/auth/2fa/disable` | Yes | Yes |  -  | Disable 2FA |
| POST | `/auth/change-password` | Yes | Yes | Joi | Change password |
| POST | `/auth/logout-all` | Yes | Yes |  -  | Revoke all sessions |
| GET | `/auth/sessions` | Yes | No |  -  | List sessions |
| DELETE | `/auth/sessions/:tokenId` | Yes | Yes |  -  | Revoke one |

### 4.3 Users  -  parent Auth + injectCsrf

| METHOD | Path | AuthZ | Purpose |
|--------|------|-------|---------|
| GET | `/users/me` | Auth | Profile |
| PUT | `/users/me` | Auth+CSRF+Joi | Update profile |
| POST | `/users/profile-image` | Auth+CSRF+upload | Profile image |
| PUT | `/users/change-password` | Auth+CSRF | Change password |
| GET | `/users/sessions` | Auth | Sessions |
| POST | `/users/logout-all` | Auth+CSRF | Logout all |
| GET | `/users/` | ADMIN/SA + USERS_LIST | List users |
| GET | `/users/:id` | ADMIN/SA + USERS_READ | Get user |
| DELETE | `/users/:id` | SUPER_ADMIN + USERS_DELETE | Delete user |

### 4.4 Catalog  -  Categories / Products / Pricing / Search / Reviews

| METHOD | Path | AuthZ | Purpose |
|--------|------|-------|---------|
| GET | `/categories`, `/categories/:id` | Public | List/detail |
| POST/PUT/DELETE | `/categories`... | ADMIN/SA + CSRF (+ upload) | CRUD |
| GET | `/products`, `/products/:id` | Public | List/detail |
| POST | `/products` | ADMIN/SA/VENDOR + PRODUCTS_CREATE + CSRF + upload | Create |
| PUT/DELETE | `/products/:id` | OwnershipOr permission + CSRF | Update/delete |
| PATCH | `/products/:id/stock` | Ownership + INVENTORY_UPDATE | Stock |
| PATCH | `/products/:id/status` | ADMIN/SA | Status |
| POST | `/pricing` | Public + Joi | Calculate price |
| GET | `/search` | Public | Product search |
| POST | `/reviews` | Auth + feature flag | Add review |
| GET | `/reviews/:productId` | Public | List reviews |

### 4.5 Commerce  -  Cart / Wishlist / Orders / Invoices / Credit / Promotions

| METHOD | Path | AuthZ | Purpose |
|--------|------|-------|---------|
| GET/POST | `/cart` | Auth | Get / add |
| DELETE | `/cart/:productId` | Auth | Remove |
| GET | `/wishlist` | Auth | Get |
| POST | `/wishlist/add` | Auth+Joi | Add |
| DELETE | `/wishlist/remove/:productId`, `/wishlist/clear` | Auth | Remove/clear |
| POST | `/orders` | Auth+CSRF+orderLimiter+Idem+Joi | Create order |
| GET | `/orders`, `/orders/:id` | Auth | List/detail |
| GET | `/orders/:id/invoice` | Auth | Invoice PDF |
| PATCH | `/orders/:id/status` | ADMIN/SA+CSRF+Joi | Status workflow |
| POST | `/orders/:id/fail` | Auth+CSRF | Mark failed |
| GET | `/invoices`, `/invoices/:orderId` | Auth | List/get |
| POST | `/invoices/:orderId` | Auth+Joi | Generate |
| GET | `/credit`, `/credit/ledger` | Auth | Balance/ledger |
| POST | `/credit` | ADMIN/SA | Create credit account |
| POST | `/credit/use`, `/credit/repay` | Auth+Joi | Use/repay |
| CRUD | `/promotions` | ADMIN | Promo management |
| POST | `/promotions/apply` | Auth+Joi | Apply coupon (**not wired into createOrder**) |

### 4.6 Payments

| METHOD | Path | AuthZ | Purpose |
|--------|------|-------|---------|
| POST | `/payments/webhook` | Public + paymentLimiter | Razorpay webhook |
| POST | `/payments/create-order` | Auth+CSRF+RL | Razorpay order |
| POST | `/payments/initiate/:orderId` | Auth+CSRF+RL | Initiate |
| POST | `/payments/verify` | Auth+CSRF+RL+Joi | Verify signature |
| POST | `/payments/fail` | Auth+CSRF+RL | Fail |
| POST | `/payments/hybrid` | Auth+CSRF+RL+Joi | Hybrid/COD/credit |
| POST | `/payments/refund` | Auth+CSRF+RL | Refund |
| GET | `/payments/refund/...` | Auth | Refund queries |
| GET | `/payments/bank-transfer/bank-details` | Auth | Bank details |
| POST | `/payments/bank-transfer/upload` | Auth+CSRF+multer+Joi | Upload proof |
| GET | `/payments/bank-transfer/pending` | SUPER_ADMIN | Pending proofs |
| GET | `/payments/bank-transfer/order/:orderId` | Auth | Proof by order |
| PATCH | `/payments/bank-transfer/:id/approve` | SUPER_ADMIN+CSRF | Approve |
| PATCH | `/payments/bank-transfer/:id/reject` | SUPER_ADMIN+CSRF | Reject |

### 4.7 Logistics / Shipments / Warehouses / Inventory

| METHOD | Path | Roles | Purpose |
|--------|------|-------|---------|
| GET | `/logistics/delivery-queue`, `/history`, `/analytics` | ADMIN/DP/SA | Ops views |
| GET | `/logistics/my-assignments` | DELIVERY_PARTNER | Assignments |
| POST | `/logistics/:id/accept|pick|start|delivered|complete|location` | DELIVERY_PARTNER | Lifecycle |
| POST | `/logistics/:orderId` | ADMIN/SA | Create shipment |
| PATCH | `/logistics/:id/assign|reassign` | ADMIN/SA+Joi | Assign partner |
| GET | `/logistics/:id`, `/logistics/` | Auth / ADMIN/SA | Details/list |
| CRUD-ish | `/shipments` | ADMIN (+ DP status) | Legacy shipment module |
| CRUD | `/warehouses` | ADMIN write | Warehouses |
| GET/POST/PATCH | `/inventory`... | ADMIN (+ VENDOR update) + Idem | Stock ops |

### 4.8 Admin / Super Admin / Analytics / Audit / Settings / Support / Upload / Companies / Vendors / Notifications

| Area | Key Endpoints | Roles |
|------|---------------|-------|
| Admin | `/admin/users`, `/admin/stats`, approve/reject, create B2B/DP, update status/credit | ADMIN/SA |
| Admin Approvals | `/admin-approvals`, pending, approve/reject | SUPER_ADMIN |
| Super Admin | `/super-admin` and `/superadmin` users/admins/stats/metrics/audit-logs/config/categories | SUPER_ADMIN |
| Analytics | `/analytics/dashboard|sales|...|revenue` SUPER_ADMIN; `/analytics/delivery` ADMIN/SA | As noted |
| Audit | `/audit`, `/audit/:id` | ADMIN/SA |
| Settings | `/settings`, `/settings/public/config`, `/settings/platform` | Mixed |
| Support | `/support`, my-tickets, all, status | Auth; admin for all |
| Upload | `/upload/image` | Auth+CSRF+cloud |
| Companies | CRUD + `/companies/me` | Auth; ADMIN/SA create |
| Vendors | create/list; PATCH status | Auth; ADMIN/SA approve |
| Notifications | GET; mark read / read-all | Auth |

**Approximate distinct v1 route method registrations:** ~179.

---

## 5. Complete Authentication Flow

### 5.1 Token Model

| Token | TTL | Secret | Payload | Client Storage |
|-------|-----|--------|---------|----------------|
| Access JWT | 15m | `JWT_SECRET` | `{ id, role, sessionId? }` | `Authorization: Bearer` or cookie `accessToken` |
| Refresh | 7d DB | Signed with `JWT_SECRET` + random suffix; stored in RefreshToken | Family rotation | Body / cookie `refreshToken` |
| CSRF | 24h cookie | 32-byte hex | N/A | Cookie `csrf-token` (httpOnly) + header `x-csrf-token` from response body |
| Password reset | 1h | SHA-256 hash | N/A | Email link |

**Note:** `JWT_REFRESH_SECRET` is env-validated but **not used** by the token signer.

### 5.2 Register

1. Rate limit + `allowRegistration` setting + Joi.
2. Fraud track registration IP/email.
3. Unique email/mobile; password policy (`AUTH_STRICT_MODE`).
4. Create user `PENDING`, default credit account (INR 50000), audit REGISTER.
5. Return user + csrfToken  -  **no access/refresh tokens**.

### 5.3 Login

1. Identifier = email or 10-digit mobile + password.
2. Fraud block check (when strict).
3. 404 `ACCOUNT_NOT_FOUND` if missing; maintenance blocks non-SUPER_ADMIN.
4. Non-SUPER_ADMIN must be `ACTIVE`.
5. Bad password -> fraud track + 401 `INVALID_CREDENTIALS`.
6. If 2FA enabled -> `{ requires2FA, userId }` without session.
7. Else new `activeSessionId`, issue tokens + CSRF.
8. Single-session: mismatched JWT sessionId -> `SESSION_REPLACED`.

### 5.4 Refresh Rotation

1. Load active refresh; on `reuseDetected` revoke entire family.
2. Mark used -> new access + new refresh same family -> revoke old.
3. User must be ACTIVE (or SUPER_ADMIN).

### 5.5 2FA (TOTP via @otplib)

- Enable returns QR + 10 bcrypt backup codes; verify-setup enables.
- Login verify with TOTP or backup (consumed).
- Disable requires password.

### 5.6 Logout / Sessions / Password Reset

- Logout: revoke refresh (public), clear cookie, clear activeSessionId.
- Logout-all / change-password: revoke all refresh tokens.
- Forgot/reset: opaque responses; revoke all refresh on reset; TTL 1h.

### 5.7 Authenticated Request Path

`protect`/`authenticate`: Bearer or `accessToken` cookie -> verify JWT -> load user -> session match -> maintenance/status -> `req.user`.

---

## 6. Complete Authorization Matrix

### 6.1 Roles

`SUPER_ADMIN | ADMIN | VENDOR | B2B_CUSTOMER | B2C_CUSTOMER | DELIVERY_PARTNER`

User statuses: `PENDING | ACTIVE | INACTIVE | SUSPENDED | REJECTED`

### 6.2 Mechanisms

| Mechanism | Behavior |
|-----------|----------|
| `authorize(...roles)` | Exact role allow-list |
| `requireRole` / `requirePermission` | RBAC; SUPER_ADMIN bypasses permissions |
| `requireOwnershipOr` | Vendor ownership of product |
| `checkResourceQuota` | Soft quotas |
| Feature guards | `allowRegistration`, `enableCOD`, reviews flag |

### 6.3 Capability Matrix

| Capability | SA | Admin | Vendor | B2B | DP | Public |
|------------|:--:|:-----:|:------:|:---:|:--:|:------:|
| Register/Login/Reset | Y | Y | Y | Y | Y | Y |
| Platform config / SA admin CRUD / financial analytics | Y | | | | | |
| Bank proof approve/reject | Y | | | | | |
| Admin registration approvals | Y | | | | | |
| Catalog write (categories) | Y | Y | | | | |
| Product write | Y | Y | Y* | | | |
| Inventory admin | Y | Y | Y (update) | | | |
| User approve/reject/status | Y | Y | | | | |
| Order status workflow | Y | Y | | | | |
| Delivery assign | Y | Y | | | | |
| Browse products/search | Y | Y | Y | Y | Y | Y |
| Cart/checkout/wishlist | | | Y | Y | | |
| Credit use | | | Y | Y | | |
| Delivery lifecycle | | | | | Y | |

\* Vendor limited to owned products via ownership middleware.

### 6.4 Soft Quotas

| Role | Limits |
|------|--------|
| VENDOR | products 1000, orders/day 500, images/product 10 |
| B2B_CUSTOMER | orders/day 100, cart 500 |
| B2C_CUSTOMER | orders/day 10, cart 50 |
| SUPER_ADMIN | bypass |

---

## 7. Complete Database Inventory

**Driver:** Mongoose 9. **Collections:** 28 (27 `*.model.js` + CreditLedger). Soft delete: **User only** (`isDeleted` + find middleware).

### 7.1 Connection

- URI: `MONGO_URI_DIRECT` > `MONGO_URI` > in-memory when `USE_IN_MEMORY_MONGO`.
- Pool 2-10; IPv4 first; env DB allowlist; Super Admin bootstrap after connect.
- Transactions only when replica set detected (`getTransactionSupport()`).

### 7.2 Collections Summary

| # | Model | Collection | Key Fields / Notes | Unique / Special Indexes |
|---|-------|------------|--------------------|--------------------------|
| 1 | User | users | name, email, mobile, password(select:false), role, status, companyId, 2FA, creditLimit/availableCredit, vehicle*, addresses, activeSessionId, isDeleted | unique email, mobile; soft-delete filter |
| 2 | Company | companies | name, email, phone, gstNumber, isActive, createdBy | unique email |
| 3 | Vendor | vendors | name, companyId, contact, status PENDING/APPROVED/REJECTED | companyId index |
| 4 | Product | products | name, price, stock, categoryId, vendorId, moq, gst, bulkPricing, variants, images, isActive | category/name indexes |
| 5 | Category | categories | name, slug, parentId, image, isActive | unique {name, parentId} |
| 6 | Order | orders | userId, items[], totalAmount, paymentMethod, paymentStatus, status, address, shipmentId, idempotencyKey, statusHistory, paymentAttempts | sparse unique idempotencyKey; compounds user/status/dates |
| 7 | Cart | carts | userId, items[{productId, quantity}] | unique userId |
| 8 | Payment | payments | orderId, userId, amount, status INITIATED/PENDING/SUCCESS/FAILED, method, razorpayPaymentId | sparse unique razorpayPaymentId |
| 9 | Refund | refunds | orderId, paymentId, amount, FULL/PARTIAL, status, razorpayRefundId, inventoryRestored | sparse unique razorpayRefundId |
| 10 | PaymentProof | paymentproofs | orderId, userId, amount, utrNumber, screenshot, PENDING/APPROVED/REJECTED | compounds order/status |
| 11 | Invoice | invoices | orderId unique, invoiceNumber unique, amounts, gst, fileUrl | |
| 12 | Inventory | inventories | productId, warehouseId, stock, reservedStock, reorderLevel, version | unique {productId, warehouseId} |
| 13 | Warehouse | warehouses | name, location, capacity, currentLoad, isActive | |
| 14 | Credit | credits | userId unique, creditLimit, usedCredit, availableCredit, ACTIVE/BLOCKED | pre-save available = limit - used |
| 15 | CreditLedger | creditledgers | userId, DEBIT/CREDIT, amount, description | |
| 16 | Logistics | logistics | orderId, warehouseId, deliveryPartnerId, DELIVERY_STATUS, trackingNumber unique, location, proof | |
| 17 | Shipment | shipments | orderId, warehouseId, CREATED/IN_TRANSIT/DELIVERED, trackingNumber | **Legacy parallel module** |
| 18 | Promotion | promotions | code unique, PERCENTAGE/FLAT, value, maxDiscount, expiresAt | |
| 19 | Notification | notifications | userId, title, message, ORDER/PAYMENT/SYSTEM, isRead | |
| 20 | Review | reviews | userId, productId, rating 1-5, comment | |
| 21 | Wishlist | wishlists | userId unique, items[{productId}] | |
| 22 | Audit | audits | userId, action, entity, details/data, severity | |
| 23 | Support | supports | userId, subject, message, OPEN/IN_PROGRESS/RESOLVED/CLOSED | |
| 24 | Settings | settings | key unique, value Mixed | platform flags |
| 25 | UserSettings | usersettings | userId unique, notifications, preferences, businessDetails | |
| 26 | PasswordResetToken | passwordresettokens | userId, tokenHash, expiresAt | **TTL** on expiresAt |
| 27 | RefreshToken | refreshtokens | userId, token unique, family, expiresAt, device, revoke flags, reuseDetected | **TTL** expiresAt; family compounds |

### 7.3 Relationships (refs)

```
User -> Company
Product -> Category, User(vendor), Company
Order -> User, Product(items), Logistics(shipmentId)
Cart/Wishlist/Credit/Notification/Review/Support/UserSettings/PaymentProof/RefreshToken/PasswordResetToken -> User
Payment/Refund/Invoice/Logistics/Shipment/PaymentProof -> Order
Inventory/Logistics/Shipment -> Warehouse
Refund -> Payment, Product(restoredItems)
Vendor -> Company
Category -> Category (parentId)
```

### 7.4 Transactions

- **Order placement:** session transaction when replica set; create order + credit deduct / stock reduce (COD/CREDIT) or Redis reserve (online).
- **Mark failed:** snapshot/majority transaction + restoreStock.
- **Hybrid payment:** Redis lock + optional Mongo transaction.
- Standalone Mongo: degrade to sequential writes / manual rollback.

### 7.5 Seed / Migration Scripts

| Script | Role |
|--------|------|
| `scripts/db/init-db.js` | createIndexes + baseline Settings (non-prod) |
| `scripts/db/seed-qa.js` | Idempotent QA dataset |
| `scripts/migration/preview.js` | Dry-run compare |
| `dangerous-dev-tools/*` | Destructive seeds (gated) |
| `scripts/migrate.js`, `scripts/seed.js` | Empty stubs |

---

## 8. Complete Module Inventory

For each module: Purpose | APIs (summary) | AuthZ | Validation | Business rules | DB | Transactions | Errors | Jobs | Status

### 8.1 auth
**Purpose:** Register/login/2FA/refresh/logout/password/sessions/CSRF.  
**APIs:** See Section 4.2. **Auth:** Mixed public/protected. **Validation:** Joi schemas for register/login/reset/2FA/change-password.  
**Rules:** PENDING users cannot login (except SA); single activeSessionId; refresh family reuse detection; AUTH_STRICT_MODE gates.  
**DB:** User, RefreshToken, PasswordResetToken, Credit (default on register). **Status:** Implemented.

### 8.2 user
**Purpose:** Profile, photo, admin user CRUD. **APIs:** `/users/*`. **AuthZ:** self vs ADMIN/SA permissions. **DB:** User. **Status:** Implemented.

### 8.3 product / category / pricing / search / review
**Purpose:** Catalog. **APIs:** public read; admin/vendor write. **Rules:** MOQ; price>0; ownership; in-memory product list cache 5m; pricing engine separate from checkout bulk tiers; reviews one-per-user-product; search Mongo limit 20. **Status:** Implemented (promotions/pricing engine not on checkout).

### 8.4 cart / wishlist
**Purpose:** Per-user cart/wishlist. **Rules:** MOQ/stock check on add; prune stale products; cleared after successful pay/COD/credit/bank approve. **Status:** Implemented.

### 8.5 order
**Purpose:** Create orders, workflow status, fail, invoice download. **Rules:** See Section 12. **Idempotency:** key + limiter. **DB:** Order. **Tx:** Yes when replica set. **Status:** Implemented.

### 8.6 payment / payment-proof / refund
**Purpose:** Razorpay, hybrid, webhook, bank proofs, refunds. **Rules:** See Section 11. **External:** Razorpay. **Status:** Implemented (bank amount policy weak).

### 8.7 invoice
**Purpose:** Generate/list invoices; PDF via pdfkit under `/uploads/invoices`. **Status:** Implemented (GST accounting may disagree with createOrder).

### 8.8 credit
**Purpose:** Credit accounts + ledger. **Rules:** ACTIVE/BLOCKED; maxCreditLimit; auto-create INR 50000 demo; dual User.credit* fields also updated by admin. **Status:** Partial (dual sources).

### 8.9 inventory / warehouse
**Purpose:** Multi-warehouse stock; optimistic version locking; default warehouse auto-create. **Rules:** checkStock across warehouses; no auto-seed missing rows on order. **Status:** Implemented.

### 8.10 logistics / shipment
**Purpose:** Delivery lifecycle (primary Logistics) + legacy Shipment module. **Rules:** Linear DP transitions; order status sync by rank; earnings ~5% in analytics. **Status:** Logistics implemented; Shipment legacy dual system.

### 8.11 notification
**Purpose:** Persist + queue + socket emit. **Email/SMS:** console mock / broken SMS import. **Status:** Partial.

### 8.12 admin / adminApprovals / superAdmin
**Purpose:** User governance, stats, SA config/audit/categories. **Status:** Implemented.

### 8.13 analytics / audit / settings / support / promotion / company / vendor / upload
**Purpose:** As named. **Notes:** Promotion apply not on checkout; Support no SLA; Upload Cloudinary/S3/local; Settings public config + platform keys. **Status:** Mostly implemented with noted gaps.

---

## 9. Complete Validation Inventory

| Area | Mechanism | Key Rules |
|------|-----------|-----------|
| All validated routes | `validate.middleware` + Joi | FormData coercion; 400 messages |
| Register | registerSchema | name, email, password policy, mobile, optional role |
| Login | loginSchema | mobile/identifier + password |
| Password | AUTH_STRICT_MODE | Strict: longer/complex (+ optional HIBP/history); non-strict min 6 |
| Orders | createOrderSchema | paymentMethod, shippingAddress |
| Order status | updateOrderStatusSchema + workflow | Allowed transitions only |
| Payments | verify/hybrid schemas | Razorpay fields; amounts |
| Bank proof | upload schema + multer | UTR; screenshot jpg/png/pdf <=5MB |
| Products/Categories | create/update schemas | Required fields; price>0 |
| Cart/Wishlist | add schemas | productId, quantity |
| Credit | create/use/repay schemas | amounts |
| Uploads | MIME + magic bytes + sanitize | jpeg/png/webp (+docs for general); 10MB; <=5 files |
| Mongo sanitize | middleware | Strip `$` and `.` keys |
| XSS sanitize | middleware | validator.escape strings |
| Idempotency key | header | `[a-zA-Z0-9_-]{1,255}` |

---

## 10. Complete Business Rule Inventory

1. New registrations default `PENDING` until Admin/SA approval (SUPER_ADMIN exempt).
2. Single active session per user via `activeSessionId`.
3. Refresh token family reuse revokes entire family.
4. Maintenance mode blocks non-SUPER_ADMIN login and can block order create.
5. Order cutoff time setting can 403 new orders.
6. COD gated by `enableCOD`; credit gated by `creditSystem`.
7. Checkout bulk discounts: qty tiers 5/10/15/20% then +18% GST.
8. COD -> CONFIRMED + PENDING payment + immediate stock reduce.
9. CREDIT -> CONFIRMED + PAID + stock reduce + credit deduct.
10. Online/bank -> PENDING_PAYMENT + Redis reservation 15 minutes.
11. Order status transitions enforced by workflow graph (Section 12).
12. Payment verify/webhook require HMAC; amount mismatch fails order.
13. Hybrid payment uses Redis lock; credit reverse on Razorpay failure.
14. Bank transfer: no exact amount enforcement; approve sets PROCESSING (bypasses PENDING_PAYMENT->CONFIRMED).
15. Refunds: PAID only; full refund restores stock + REFUNDED/CANCELLED.
16. Inventory optimistic lock with retries; restoreStock targets first warehouse.
17. Product list in-memory cache 5 minutes for default query.
18. Vendor product mutations ownership-enforced.
19. Soft quotas on products/orders/cart by role.
20. Notifications respect global notifications setting.
21. Logistics linear lifecycle; order status synced by rank when higher.
22. Fraud: login/OTP/registration/payment velocity (strict mode).

---

## 11. Complete Payment Flow

### 11.1 Methods Supported

`COD | ONLINE | CREDIT | RAZORPAY | UPI | CARD | HYBRID | BANK_TRANSFER`

### 11.2 Razorpay Path

1. `create-order` / `initiate` / `hybrid` creates gateway order (min INR 1).
2. Client verifies via `verify` with signature HMAC-SHA256.
3. Replay protection Redis `payment:processed:{paymentId}` 24h.
4. Lock `payment:lock:{orderId}` 60s.
5. On success: order PAID + CONFIRMED; finalize reservation; clear cart; socket `payment:success`; `queuePostPaymentJobs`.
6. Webhook `payment.captured`: raw body + `RAZORPAY_WEBHOOK_SECRET`; same success path; CSRF skipped.

### 11.3 Hybrid

- Optional credit debit then Razorpay for remainder.
- Full credit cover: PAID without gateway.
- COD branch inside hybrid: CONFIRMED + PENDING pay.
- Razorpay failure reverses credit with idempotent key.

### 11.4 Bank Transfer

1. Vendor uploads UTR + screenshot while PENDING_PAYMENT.
2. SUPER_ADMIN approves/rejects.
3. Approve: PAID + **PROCESSING**; finalize reservation; clear cart.
4. Reject: paymentStatus REJECTED; reservation **not** released.
5. Amount policy: exact match **not enforced**.

### 11.5 Refunds

- Admin or owner; Redis idempotency; Razorpay refund; FULL restores inventory.

### 11.6 Fail / Reconcile

- `failPayment` / mark failed: FAILED + release reservation; COD restores stock.
- Cron: PENDING/INITIATED payments >15m -> FAILED + restoreStock (**risk:** may inflate stock for reserved-only online orders).

---

## 12. Complete Order Flow

### 12.1 Create

Gates: address required; maintenance; cutoff; COD/credit flags; idempotencyKey.

Pricing: MOQ check; bulk % tiers; GST 18%; commission from settings; heavy vehicle if weight >100.

| Method | Order Status | Payment Status | Stock |
|--------|--------------|----------------|-------|
| COD | CONFIRMED | PENDING | Immediate reduce |
| CREDIT | CONFIRMED | PAID | Immediate reduce + debit |
| Online/Bank/etc. | PENDING_PAYMENT | PENDING | Redis reserve 900s |

Post COD/CREDIT: clear cart, invoice, notify, queuePostOrderJobs.

### 12.2 Status Workflow

```
CREATED -> PENDING_PAYMENT | PENDING | CONFIRMED | FAILED | CANCELLED
PENDING_PAYMENT -> CONFIRMED | FAILED | CANCELLED
PENDING -> CONFIRMED | CANCELLED | FAILED
CONFIRMED -> PROCESSING | PACKED | CANCELLED
PROCESSING -> PACKED | CANCELLED
PACKED -> READY_TO_DISPATCH | CANCELLED
READY_TO_DISPATCH -> SHIPPED | CANCELLED
SHIPPED -> OUT_FOR_DELIVERY | CANCELLED
OUT_FOR_DELIVERY -> DELIVERED | CANCELLED
DELIVERED -> COMPLETED | RETURNED
COMPLETED -> RETURNED
RETURNED -> REFUNDED
CANCELLED | FAILED | REFUNDED -> terminal
```

Admin `PATCH /orders/:id/status` validates transitions + statusHistory + audit.

### 12.3 Fail

`markOrderAsFailed` / payment fail: FAILED statuses; restoreStock when applicable.

---

## 13. Complete Cart Flow

1. `POST /cart` auth: product active, MOQ, stock for merged qty.
2. `GET /cart` prunes missing products.
3. `DELETE /cart/:productId` removes line.
4. Cleared on COD/CREDIT success, payment verify/webhook success, bank-transfer approve.
5. No quantity-update endpoint (remove + re-add only).

---

## 14. Complete Product Flow

1. Public list/detail/search.
2. Create: ADMIN/SA/VENDOR + permission; image upload; ensureProductInventory; invalidate cache.
3. Update/delete/stock: ownership or elevated permission.
4. Status patch: ADMIN/SA only.
5. Pricing API: optional dynamicPricing engine (qty 50/100 tiers)  -  **not** same as checkout bulk.
6. Categories: public read; ADMIN/SA write with cache clear.

---

## 15. Complete Notification Flow

1. Service checks notifications setting.
2. Enqueue BullMQ `notification` queue + persist Notification document.
3. Worker (when started): Socket.io `io.to(userId).emit("notification", ...)`.
4. Templates: ORDER_PLACED, PAYMENT_SUCCESS, LOW_CREDIT.
5. Email service: console mock. SMS job references missing `sms.service`  -  **broken**.
6. Module-level queue stubs when `USE_REAL_QUEUE=false`.

---

## 16. Complete Background Job Inventory

### 16.1 Startup Gates (`server.js`)

| Component | Gate |
|-----------|------|
| Cron | `NODE_ENV!=test`, `ENABLE_CRON!=false`, and (`ENABLE_CRON=true` OR `NODE_ENV=production`) |
| Workers (`workers/index.js`) | `ENABLE_WORKERS=true` |

### 16.2 Cron Jobs

| Job | Schedule | Behavior | Status |
|-----|----------|----------|--------|
| Payment reconcile | every 5m | Stuck PENDING/INITIATED payments >15m -> FAILED; restoreStock | Partial  -  stock inflate risk for reserved online |
| DB lock cleanup | every 10m | Cleanup | Wired when cron starts |
| cancelPendingOrders |  -  | Cancel PENDING >30m | **Not scheduled** |
| checkCreditLimits |  -  | Log low credit | **Not scheduled** |
| cleanupLogs / syncInventory |  -  | Console stubs | **Not scheduled** |

### 16.3 BullMQ Queues

| Queue | Producer | Consumer | Status |
|-------|----------|----------|--------|
| `post-payment` | queueManager | postPayment.worker | Queued work; worker **not started by server** (orphaned) |
| `post-order` | queueManager | postOrder.worker | Orphaned; also imports missing order.service exports |
| `notification` | notification.service | workers/index socket emit | Partial |
| `email` |  -  | mock log | Stub |
| `inventory` / `payment` / `audit` / `webhook` / `image-processing` / `data-archival` | various | stubs | Stub (`USE_REAL_QUEUE=false` for module queues) |

### 16.4 Post-Payment Intended Work (if worker ran)

1. `generateInvoice(orderId)`
2. `autoAssignDelivery(orderId)`

---

## 17. Complete Cache Inventory

### 17.1 Redis Key Patterns

| Key | Purpose | TTL |
|-----|---------|-----|
| `payment:lock:{orderId}` | Payment mutex | ~60s |
| `payment:processed:{razorpay_payment_id}` | Replay protection | 24h |
| `webhook:processed:{id}` | Webhook idempotency | 60s then 24h |
| `credit:reversal:{orderId}:{userId}` | Credit reverse idempotency | 1h |
| `refund:{orderId}:{userId}` | Refund idempotency | 24h |
| `inventory:reservation:{orderId}` | Soft stock hold | 900s |
| `fraud:*` / `fraud:blocked:*` | Fraud counters/blocks | varies |
| `cache:{url}` | HTTP GET cache middleware | configurable |
| Idempotency keys/locks | Mutation dedupe | ~15s lock / 24h result |
| `security:events` | Security audit list |  -  |
| Rate-limit keys | express-rate-limit Redis store | window |

### 17.2 Non-Redis

- In-process Map cache service.
- Product list memory cache 5 minutes.

---

## 18. Complete Security Inventory

### 18.1 JWT

- Access 15m; refresh DB-backed 7d with rotation + family reuse detection.
- Session binding via `activeSessionId` / `SESSION_REPLACED`.
- Both access and refresh JWTs signed with `JWT_SECRET` (refresh secret unused).

### 18.2 CSRF

- Double-submit: cookie `csrf-token` + header `x-csrf-token` (or body `_csrf`).
- Cookie httpOnly  -  clients must use response body token for header.
- Skipped for safe methods, webhooks/callbacks, public auth paths; test env unless enforced.

### 18.3 CORS

- Allowlist: localhost 5173-5175/3000, `*.vercel.app`, FRONTEND_URL.
- `credentials: true`; methods GET/POST/PUT/PATCH/DELETE/OPTIONS.
- Headers include Authorization, x-csrf-token, idempotency-key, x-razorpay-signature.

### 18.4 Helmet

- CSP allowing Razorpay; HSTS 1y; frameguard sameorigin; noSniff; xssFilter; hide X-Powered-By.

### 18.5 Rate Limiting (Redis)

| Limiter | Window | Max | Applied |
|---------|--------|-----|---------|
| apiLimiter | 15m | 1000 | All `/api` |
| authLimiter | 15m | 5 failed | Auth sensitive |
| paymentLimiter | 15m | 5 failed | Payments |
| orderLimiter | 5m | 10 | POST /orders |

Skip: test env, localhost, automated-test headers; auth/payment skip when AUTH_STRICT_MODE=false.

### 18.6 Input Sanitization

- mongoSanitize: strip `$` / `.` keys.
- xssSanitize: escape strings.
- Body 10MB; parameterLimit 100.

### 18.7 File Upload Security

- MIME/ext allowlists; magic-byte checks; filename sanitize; path traversal blocked.
- Max 10MB, <=5 files; payment proof 5MB jpg/png/pdf.
- Storage: Cloudinary / S3 / local disk.

### 18.8 Redis / BullMQ / Webhooks / Secrets

- Redis: locks, fraud, rate limit, idempotency, cache, queues, socket adapter.
- Webhook: raw body capture; HMAC with RAZORPAY_WEBHOOK_SECRET; CSRF skipped.
- Secrets via dotenv layered load + validateEnv; JWT length enforced in production.
- IP block list from settings; securityAudit events.

---

## 19. Complete Error Handling Inventory

### 19.1 Error Classes

| Class | Typical Status |
|-------|----------------|
| AppError | custom + code |
| PermissionError | 403 |
| NotFoundError | 404 |
| RateLimitError / PaymentError | named |

### 19.2 Response Shape

Success: `{ success: true, message, data }`

Error:
```json
{
  "success": false,
  "message": "...",
  "error": { "statusCode": 401, "timestamp": "...", "path": "...", "code": "INVALID_CREDENTIALS" },
  "data": null
}
```

### 19.3 Notable Codes

`ACCOUNT_NOT_FOUND`, `INVALID_CREDENTIALS`, `SESSION_REPLACED`, `VALIDATION_ERROR`, `AUTH_ERROR`, `DATABASE_UNAVAILABLE`, `DUPLICATE_ENTRY`, `FILE_UPLOAD_ERROR`, `REQUEST_TIMEOUT`, permission denials.

### 19.4 Global Handler

Normalizes Mongoose/JWT/Multer/DB errors; hides 500 details in production; last middleware after notFound.

---

## 20. Complete Logging Inventory

| System | Role |
|--------|------|
| Winston | Structured JSON; console; optional files error/combined/performance; LOG_LEVEL; correlation child loggers |
| Morgan | HTTP access `dev` |
| requestLogger | Extra method+URL console |
| correlationMiddleware | Start/finish with duration |
| monitoringMiddleware | Metrics + slow warnings |
| securityAudit | Winston warn + Redis security:events |
| Audit model | Mongo domain audit rows |
| Sentry | Optional DSN; strips cookies/auth; sample rate prod |

---

## 21. Logistics, Credit & Supporting Modules

### 21.1 Logistics Lifecycle

```
ASSIGNED -> ACCEPTED -> PICKED -> OUT_FOR_DELIVERY -> DELIVERED -> COMPLETED
```

Maps to order PROCESSING/PACKED/OUT_FOR_DELIVERY/DELIVERED/COMPLETED when rank increases.

Admin createShipment + assign/reassign; partner location updates; analytics.

### 21.2 Credit

- Collection statuses ACTIVE/BLOCKED (constants PENDING/APPROVED/REJECTED unused by model).
- Ledger DEBIT/CREDIT; maxCreditLimit setting; auto-create demo limit.
- Admin also patches User.creditLimit/availableCredit  -  dual store.

### 21.3 External Services Status

| Service | Status |
|---------|--------|
| Razorpay | Production-capable when keys set |
| Cloudinary | Env-gated |
| S3 | Optional USE_S3_STORAGE |
| Socket.io | Implemented; Redis adapter optional |
| Sentry | Env-gated |
| Email | Console mock |
| SMS | Missing service file |

---

## 22. Known Implementation Limitations

### 22.1 Critical / Certification Blockers

1. **post-payment / post-order BullMQ workers are not started by `server.js`**  -  jobs may enqueue with no consumer; auto invoice/assign may not run.
2. **Online stock is Redis soft-reservation only**  -  `Inventory.reservedStock` not hard-held; oversell risk if Redis down/TTL expires.
3. **Payment reconcile restoreStock can inflate inventory** for online reserved (non-deducted) orders.
4. **Bank-transfer approve sets PROCESSING**, bypassing workflow `PENDING_PAYMENT -> CONFIRMED`.
5. **`JWT_REFRESH_SECRET` unused**  -  both tokens use `JWT_SECRET`.

### 22.2 Functional Gaps

6. Promotion `apply` API not integrated into `createOrder`.
7. Pricing engine tiers differ from checkout bulk tiers.
8. Dual Logistics vs Shipment modules; Order.shipmentId refs Logistics.
9. Dual credit stores (Credit collection vs User fields).
10. Email mock; SMS job broken.
11. `USE_REAL_QUEUE=false` stubs many module queues.
12. `health.routes.js` orphaned; logistics import in app.js unused.
13. Bank transfer amount not enforced; bank details hardcoded in payment.config.
14. Invoice GST accounting may disagree with createOrder +18% model.
15. Global XSS escape can alter intentional special characters.
16. CSRF cookie httpOnly requires body token for header (document for clients).
17. cancelPendingOrders / credit limit schedulers not cron-wired.
18. Delivery auto-assign may look for lowercase `active` status mismatching `ACTIVE`.
19. Rejected bank proof does not release reservation.
20. Cart has no quantity-update endpoint.

---

## 23. Backend Statistics

Measured from `Production/b2b-backend/src` on **2026-07-27**.

| Metric | Count |
|--------|------:|
| **Total APIs** (route method registrations approx.) | **~179** |
| **Route files** (`*.routes.js`) | **33** |
| **Controllers** (`*.controller.js`) | **31** |
| **Services** (`*.service.js`) | **51** |
| **Middlewares** (`src/middlewares`) | **23** |
| **Models** (`*.model.js`) | **26** (+ CreditLedger = **28 collections**) |
| **Repositories** | **25** |
| **Validators** (`*.validation.js` / schemas) | **30** |
| **Workers** (`src/workers`) | **3** |
| **Jobs** (`src/jobs`) | **8** |
| **Queue modules** (`src/queues`) | **6** |
| **Utilities** (`src/utils`) | **24** |
| **Config files** (`src/config` excl. mocks) | **17** |
| **Domain modules** under `src/modules` | **~30** |
| **Source JS files** | **~327** |
| **Approximate Lines of Code (src)** | **~19,085** |

### Redis Usage Summary

Rate limiting, idempotency, payment/webhook locks, fraud counters, inventory reservations, HTTP cache, security events, BullMQ, optional Socket.io adapter.

### BullMQ Queues Summary

Real: `post-payment`, `post-order`, `notification`, `email`, plus stubs for inventory/payment/audit/webhook/image/archival. Module `USE_REAL_QUEUE=false` stubs many producers.

### Feature Module Roll-Up

1. Authentication & Sessions  
2. Users & Profile  
3. Catalog (Products/Categories/Search/Reviews/Pricing)  
4. Cart & Wishlist  
5. Orders & Workflow  
6. Payments (Razorpay/Hybrid/COD/Credit/Bank/Refunds)  
7. Invoices  
8. Credit & Ledger  
9. Inventory & Warehouses  
10. Logistics & Delivery  
11. Notifications  
12. Admin / Approvals / Super Admin  
13. Analytics & Audit  
14. Settings & Feature Flags  
15. Support Tickets  
16. Promotions / Companies / Vendors / Upload  

---

## Appendix A  -  Order Status Enum

`CREATED | PENDING_PAYMENT | PENDING | CONFIRMED | PROCESSING | PACKED | READY_TO_DISPATCH | SHIPPED | OUT_FOR_DELIVERY | DELIVERED | COMPLETED | CANCELLED | RETURNED | REFUNDED | FAILED`

## Appendix B  -  Payment / Delivery Enums

- Order paymentStatus: `PENDING | PAID | FAILED | REJECTED | REFUNDED`
- Payment record: `INITIATED | PENDING | SUCCESS | FAILED`
- PaymentProof: `PENDING | APPROVED | REJECTED`
- Delivery: `PENDING | ASSIGNED | ACCEPTED | PICKED | OUT_FOR_DELIVERY | DELIVERED | COMPLETED | CANCELLED | FAILED`

## Appendix C  -  Cookie & Header Names

| Name | Use |
|------|-----|
| `Authorization: Bearer` | Access JWT |
| Cookie `accessToken` | Access fallback |
| Cookie/body `refreshToken` | Refresh |
| Cookie `csrf-token` | CSRF (httpOnly) |
| Header `x-csrf-token` | CSRF submit |
| Header `idempotency-key` | Dedup |
| `x-correlation-id` / `x-request-id` | Tracing |
| `x-playwright-test` / `x-automated-test` | Bypass rate limits when =1 |
| `x-razorpay-signature` | Webhook |

---

*End of BACKEND_DOCUMENTATION.md  -  Master Backend Implementation Reference.*
