# FRONTEND IMPLEMENTATION DOCUMENTATION
## Mokshith B2B Platform  -  Master Reference for Enterprise QA, Regression Testing & Production Certification

| Field | Value |
|-------|-------|
| **Document Type** | Complete Frontend Implementation Reference |
| **Project** | `mokshith-b2b-platform` (`Production/ME`) |
| **Package Version** | 1.0.0 |
| **Stack** | React 18.2 + Vite 8 + React Router 6.22 + Tailwind CSS 3.4 + Axios 1.6 + Recharts 3.8 |
| **State Management** | React Context API (`AuthContext` only) + custom hooks (no Redux / Zustand) |
| **Codebase Root** | `Production/ME/src` |
| **Document Generated** | 2026-07-27 |
| **Methodology** | Exhaustive source read of every page, component, hook, service, utility, layout, route, and config file under `src/` |

> This document describes **what is currently implemented** in the frontend. It is the master reference for enterprise testing, production certification, and maintenance. Do not treat README Phase-1 placeholder language as authoritative over this document.

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Technology & Configuration Inventory](#2-technology--configuration-inventory)
3. [Application Bootstrap & Architecture](#3-application-bootstrap--architecture)
4. [Complete Route Map](#4-complete-route-map)
5. [Authentication & Session Management](#5-authentication--session-management)
6. [Authorization Inventory](#6-authorization-inventory)
7. [API Integration Layer](#7-api-integration-layer)
8. [Complete Feature Inventory](#8-complete-feature-inventory)
9. [Complete Page Inventory](#9-complete-page-inventory)
10. [Complete Component Inventory](#10-complete-component-inventory)
11. [Complete Hook Inventory](#11-complete-hook-inventory)
12. [Complete Context / Provider Inventory](#12-complete-context--provider-inventory)
13. [Complete Utility Inventory](#13-complete-utility-inventory)
14. [Complete Validation Inventory](#14-complete-validation-inventory)
15. [Layouts Inventory](#15-layouts-inventory)
16. [Complete Responsive Inventory](#16-complete-responsive-inventory)
17. [Complete UI/UX Inventory](#17-complete-uiux-inventory)
18. [Error Handling, Loading & Empty States](#18-error-handling-loading--empty-states)
19. [SEO, PWA & Static Assets](#19-seo-pwa--static-assets)
20. [Testing Surface](#20-testing-surface)
21. [Known Implementation Limitations](#21-known-implementation-limitations)
22. [Frontend Statistics](#22-frontend-statistics)

---

## 1. System Overview

### 1.1 Product Purpose

Mokshith B2B Platform is a multi-portal wholesale commerce web application. It connects four exclusive roles on a single React SPA:

| Frontend Role | Backend Role | Portal Prefix | Primary Job |
|---------------|--------------|---------------|-------------|
| `super-admin` | `SUPER_ADMIN` | `/super-admin/*` | Platform governance, user approvals, financial analytics, bank-transfer verification (intended) |
| `admin` | `ADMIN` | `/admin/*` | Marketplace operations: catalog, inventory, vendors, orders, delivery assignment, operational reports |
| `vendor` | `VENDOR` (also maps from `B2B_CUSTOMER`) | `/vendor/*` | B2B buying: browse products, cart, checkout, orders, invoices, wishlist, profile |
| `delivery` | `DELIVERY_PARTNER` | `/delivery/*` | Last-mile logistics: accept/pick/start/deliver/complete assignments, earnings, performance |

Public surfaces: marketing Home (`/`), Login, Register, Forgot Password, Reset Password.

### 1.2 Architectural Style

- **SPA** served by Vite; production deploy via Vercel (`vercel.json`) and/or Docker + nginx (`Dockerfile`, `nginx.conf`).
- **All routes** declared in a single file: `src/App.jsx` (lazy-loaded pages + nested role layouts).
- **Single HTTP client**: Axios instance in `src/services/api.js` with Bearer auth, CSRF, refresh-token queue, and soft-fail interceptors.
- **Domain services** under `src/services/*.js` return `response.data` (except invoice blob download).
- **Custom hooks** encapsulate fetch/mutation/loading/error for pages.
- **Mappers** under `src/utils/*Mapper.js` normalize backend envelopes into UI models.
- **No Redux, Zustand, React Query, or global cart store**  -  cart/wishlist/orders live in hook-local state (refetched per consumer).

### 1.3 Source Tree (authoritative)

```
Production/ME/
├── index.html
├── package.json
├── vite.config.js / vitest.config.js / tailwind.config.js / postcss.config.js
├── playwright*.config.ts
├── .env / .env.example
├── public/
│   ├── robots.txt
│   └── assets/{google-play,app-store}-badge.svg
├── tests/                    # Playwright e2e
└── src/
    ├── main.jsx              # ReactDOM root + StrictMode
    ├── App.jsx               # AuthProvider + Router + all Routes
    ├── index.css             # Tailwind + shared component classes
    ├── context/AuthContext.jsx
    ├── routes/ProtectedRoute.jsx
    ├── layouts/              # Admin, SuperAdmin, Vendor, Delivery (+ unused DashboardLayout)
    ├── pages/                # Home, Auth, Admin, SuperAdmin, Vendor, DeliveryPartner
    ├── components/           # admin, superadmin, vendor, delivery, common, sections, settings
    ├── hooks/
    ├── services/
    └── utils/
```

**Not present on disk (despite historical references):** `MaintenanceContext`, `MaintenanceBanner`, `pages/Vendor/Support.jsx`, `pages/Admin/Support.jsx`, `src/api/`, Redux/Zustand stores, PWA service worker.

---

## 2. Technology & Configuration Inventory

### 2.1 Runtime Dependencies

| Package | Version (package.json) | Usage |
|---------|------------------------|-------|
| react / react-dom | ^18.2.0 | UI |
| react-router-dom | ^6.22.0 | Routing |
| axios | ^1.6.7 | HTTP |
| lucide-react | ^1.17.0 | Icons (Home / some pages) |
| react-icons | ^5.0.1 | Icons (portals) |
| recharts | ^3.8.1 | Charts (Admin/SA/Delivery analytics & earnings) |

### 2.2 Dev / Test Tooling

| Tool | Purpose |
|------|---------|
| Vite 8 + @vitejs/plugin-react | Dev server & build |
| Tailwind 3.4 + PostCSS + Autoprefixer | Styling |
| Vitest + Testing Library + jsdom | Unit/integration |
| Playwright (+ axe-core) | E2E / a11y / cart suites |
| ESLint (react, hooks, refresh) | Lint |

### 2.3 Environment Variables

| Variable | Required | Purpose |
|----------|----------|---------|
| `VITE_API_BASE_URL` | Yes in production | Axios `baseURL` (e.g. `http://localhost:5000/api/v1`). Also used by `bankTransferUtils.getApiOrigin()`. |
| `VITE_RAZORPAY_KEY_ID` | Yes for online pay | Client Razorpay Checkout key (`utils/razorpayCheckout.js`) |
| `VITE_AUTH_STRICT_MODE` | Optional | `true`/`false` overrides password min length (12 vs 6). If unset: strict in `PROD`, non-strict in dev. |
| `window.__BACKEND_URL__` | Optional runtime | Override when build-time env missing |

**Dev fallback base URL:** `http://localhost:5000/api/v1`  
**Prod without config:** empty `baseURL`; request interceptor rejects with `VITE_API_BASE_URL is not configured for this deployment`.

### 2.4 Design Tokens (`tailwind.config.js`)

| Token | Value |
|-------|-------|
| screens.sm | 320px |
| screens.md | 768px |
| screens.lg | 1024px |
| screens.xl | 1440px |
| screens.2xl | 1920px |
| colors.primary | `#0F172A` |
| colors.secondary | `#2563EB` |
| colors.accent | `#38BDF8` |
| colors.background | `#F8FAFC` |
| colors.text | `#111827` |
| colors.success / warning / danger | `#10B981` / `#F59E0B` / `#EF4444` |

Shared CSS utilities in `index.css`: `.btn-primary`, `.btn-secondary`, `.card`, `.input-field`, `.page-container`, `.modal`, `.table-responsive`, `.bottom-sheet`, `.img-responsive`. Body uses `bg-background text-text`; global `overflow-x: hidden`.

### 2.5 NPM Scripts

| Script | Command |
|--------|---------|
| `dev` | `vite` |
| `build` | `vite build` |
| `preview` | `vite preview` |
| `lint` | eslint js/jsx max-warnings 0 |
| `test` / `test:unit` / `test:integration` | `vitest` |
| `test:coverage` | `vitest --coverage` |
| `test:e2e` | playwright default config |
| `test:smoke` / `test:functional` / `test:validation` | dedicated playwright configs |
| `test:cart-*` | cart smoke/functional/authorization/validation |
| `test:accessibility` | `tests/e2e/accessibility.spec.ts` |

---

## 3. Application Bootstrap & Architecture

### 3.1 Entry Sequence

1. `index.html` mounts `#root`, sets title/description/canonical, preconnects backend host.
2. `main.jsx` renders `<React.StrictMode><App /></React.StrictMode>` and imports `index.css`.
3. `App.jsx` wraps:
   - `AuthProvider` (session restore)
   - `BrowserRouter`
   - `ErrorBoundary` (render-error catch)
   - `Suspense` with `PageLoader` ("Loading...") for all lazy routes
   - `Routes` (public + four protected portal trees + `*` -> `/`)

### 3.2 Lazy Loading

Every page and layout is `React.lazy(() => import(...))`. First paint of a portal shows the Suspense fallback. ProtectedRoute may additionally show a full-screen spinner while `AuthContext.loading` is true.

### 3.3 Cross-Cutting Guards

| Layer | Behavior |
|-------|----------|
| `ProtectedRoute` | Unauthenticated -> `/login`; wrong role -> `getDashboardRoute(role)`; loading -> spinner |
| Axios interceptors | Attach Bearer + CSRF; refresh on 401; CSRF retry; SESSION_REPLACED hard logout; soft-null 403 on analytics/bank-transfer |
| `ErrorBoundary` | Catches subtree render errors; offers Try Again / Go Home |
| Multi-tab auth | `storage` events on `logout` and `session_replaced` clear session |

### 3.4 Data Flow Pattern (typical feature)

```
Page -> Hook (loading/error/data) -> Service (axios) -> Backend /api/v1
                              ↘ Mapper -> UI model
```

Mutations typically: optimistic or post-success `refetch`, toast/banner message, modal close.

---

## 4. Complete Route Map

**Source of truth:** `src/App.jsx` only. No separate router config. No `RoleGate`. Nested children inherit protection from the parent `ProtectedRoute` wrapping each portal layout.

### 4.1 Public Routes (unprotected)

| Path | Component | Notes |
|------|-----------|-------|
| `/` | `pages/Home/Home` | Marketing landing |
| `/login` | `pages/Auth/Login` | No bounce-if-already-authenticated |
| `/register` | `pages/Auth/Register` | Roles: admin / vendor / delivery |
| `/forgot-password` | `pages/Auth/ForgotPassword` | Identifier = email or mobile |
| `/reset-password` | `pages/Auth/ResetPassword` | Requires `?token=` |

### 4.2 Super Admin Routes (`requiredRole="super-admin"`)

**Parent:** `/super-admin/*` -> `ProtectedRoute` -> `SuperAdminLayout` -> `<Outlet />`

| Path | Element | Status |
|------|---------|--------|
| `/super-admin` | Navigate -> `/super-admin/dashboard` | Implemented |
| `/super-admin/dashboard` | `SuperAdmin/Dashboard` | Implemented |
| `/super-admin/platform` | `SuperAdmin/Platform` | Partial (health tiles cosmetic) |
| `/super-admin/admin-approvals` | Navigate -> `/super-admin/user-management` | Legacy redirect |
| `/super-admin/vendors` | Navigate -> `/super-admin/user-management` | Legacy redirect |
| `/super-admin/delivery-partners` | Navigate -> `/super-admin/user-management` | Legacy redirect |
| `/super-admin/user-management` | `UserManagement` (embeds Approvals/Vendors/DeliveryPartners + AdminManagement) | Implemented |
| `/super-admin/orders` | `SuperAdmin/Orders` | Partial (mobile read-only) |
| `/super-admin/analytics` | `SuperAdmin/Analytics` | Implemented |
| `/super-admin/settings` | `SuperAdmin/Settings` | Implemented |
| `/super-admin/payment-verifications` | **NO ROUTE** (page file + sidebar link exist) | **Broken  -  falls through to `*` -> `/`** |

`AdminApprovals` is lazy-imported in `App.jsx` but never used as a route element (only embedded in UserManagement).

### 4.3 Admin Routes (`requiredRole="admin"`)

| Path | Element | Status |
|------|---------|--------|
| `/admin` | Navigate -> `/admin/dashboard` | |
| `/admin/dashboard` | `Admin/Dashboard` | Partial (no financial analytics) |
| `/admin/products` | `Admin/Products` | Implemented |
| `/admin/categories` | `Admin/Categories` | Implemented |
| `/admin/inventory` | `Admin/Inventory` | Implemented |
| `/admin/vendors` | `Admin/Vendors` | Implemented |
| `/admin/orders` | `Admin/Orders` -> `AdminOrderManagement` | Implemented |
| `/admin/payment-verifications` | Stub page ("moved to Super Admin") | Stub; not in sidebar |
| `/admin/delivery-assignment` | `Admin/DeliveryAssignment` | Implemented |
| `/admin/reports` | `Admin/Reports` | Partial |
| `/admin/analytics` | `Admin/Analytics` | Partial (delivery-only) |
| `/admin/settings` | `Admin/Settings` | Implemented |

### 4.4 Vendor Routes (`requiredRole="vendor"`)

| Path | Element | Status |
|------|---------|--------|
| `/vendor` | Navigate -> `/vendor/dashboard` | |
| `/vendor/dashboard` | `Vendor/Dashboard` | Implemented |
| `/vendor/products` | `Vendor/Products` | Implemented |
| `/vendor/products/:id` | `Vendor/ProductDetails` | Partial (reviews stub) |
| `/vendor/categories` | `Vendor/Categories` | Implemented |
| `/vendor/cart` | `Vendor/Cart` | Partial (no qty edit) |
| `/vendor/checkout` | `Vendor/Checkout` | Partial (COD + Razorpay UI) |
| `/vendor/order-success` | `Vendor/OrderSuccess` | Implemented |
| `/vendor/orders/:id/payment` | `Vendor/BankTransferPayment` | Implemented |
| `/vendor/orders` | `Vendor/Orders` | Implemented |
| `/vendor/orders/:id` | `Vendor/OrderDetails` | Implemented |
| `/vendor/invoices` | `Vendor/Invoices` | Implemented |
| `/vendor/invoices/:id` | Same `Invoices` component (`:id` unused) | Partial |
| `/vendor/wishlist` | `Vendor/Wishlist` | Implemented |
| `/vendor/profile` | `Vendor/Profile` | Implemented |
| `/vendor/settings` | `Vendor/Settings` | Implemented |

### 4.5 Delivery Routes (`requiredRole="delivery"`)

| Path | Element | Status |
|------|---------|--------|
| `/delivery` | Navigate -> `/delivery/dashboard` | |
| `/delivery/dashboard` | `DeliveryPartner/Dashboard` | Partial |
| `/delivery/assigned-orders` | `AssignedOrders` | Implemented |
| `/delivery/order-details/:id` | `OrderDetails` | Implemented |
| `/delivery/history` | `History` | Implemented |
| `/delivery/earnings` | `Earnings` | Implemented |
| `/delivery/performance` | `Performance` | Partial (synthetic ratings) |
| `/delivery/profile` | `Profile` | Implemented |
| `/delivery/settings` | `Settings` | Implemented |

### 4.6 Catch-All & Redirect Behavior

| Condition | Behavior |
|-----------|----------|
| Unknown path `*` | `<Navigate to="/" replace />` |
| Not authenticated on protected tree | `/login` |
| Authenticated wrong role | Own role dashboard via `getDashboardRoute` |
| Auth loading | Full-screen spinner (no redirect) |
| Logout success | `/login` (replace) |
| SESSION_REPLACED / refresh failure | Clear storage -> `/login` (hard navigation if not on public path) |
| Register success | `/login` with location state message (Login does not display it) |
| Reset password success | Message then navigate `/login` after 2s |
| Checkout COD/online success | `/vendor/order-success?orderId=...` |
| Checkout bank_transfer success | `/vendor/orders/:id/payment` |

### 4.7 Exact Path Inventory

```
/  /login  /register  /forgot-password  /reset-password
/super-admin  /super-admin/dashboard  /super-admin/platform
/super-admin/admin-approvals  /super-admin/vendors  /super-admin/delivery-partners
/super-admin/user-management  /super-admin/orders  /super-admin/analytics  /super-admin/settings
/admin  /admin/dashboard  /admin/products  /admin/categories  /admin/inventory
/admin/vendors  /admin/orders  /admin/payment-verifications  /admin/delivery-assignment
/admin/reports  /admin/analytics  /admin/settings
/vendor  /vendor/dashboard  /vendor/products  /vendor/products/:id  /vendor/categories
/vendor/cart  /vendor/checkout  /vendor/order-success  /vendor/orders/:id/payment
/vendor/orders  /vendor/orders/:id  /vendor/invoices  /vendor/invoices/:id
/vendor/wishlist  /vendor/profile  /vendor/settings
/delivery  /delivery/dashboard  /delivery/assigned-orders  /delivery/order-details/:id
/delivery/history  /delivery/earnings  /delivery/performance  /delivery/profile  /delivery/settings
* -> /
```

**Protected route trees:** 4 (`/super-admin/*`, `/admin/*`, `/vendor/*`, `/delivery/*`).  
**Registered child route path segments (excluding index redirects):** 42 functional pages + 3 legacy SA redirects + 1 catch-all.

---

## 5. Authentication & Session Management

### 5.1 AuthContext (`src/context/AuthContext.jsx`)

**State shape**

| Field | Type | Meaning |
|-------|------|---------|
| `user` | object\|null | Backend user from `/users/me` or login |
| `role` | string\|null | Frontend role: `super-admin`\|`admin`\|`vendor`\|`delivery` |
| `isAuthenticated` | boolean | Session active |
| `loading` | boolean | True until `restoreSession` completes |

**Exported API:** `{ user, role, isAuthenticated, loading, login, verify2FALogin, logout, register }` via `useAuth()`.

### 5.2 Token Storage (`utils/authStorage.js`)  -  localStorage only

| Key | Purpose |
|-----|---------|
| `accessToken` | Bearer JWT |
| `token` | Legacy fallback read by `getAccessToken()` |
| `refreshToken` | Refresh |
| `csrfToken` | CSRF header value |
| `user` | JSON user |
| `role` | Frontend role string |
| `isAuthenticated` | `"true"` flag |
| `logout` | Cross-tab logout signal (timestamp) |
| `session_replaced` | Cross-tab forced re-login signal |

Cookies are used only via Axios `withCredentials: true` for CSRF cookie pairing  -  **access tokens are not stored in cookies**.

### 5.3 Session Restoration (on AuthProvider mount)

1. If no `refreshToken` -> `clearSession()` and finish.
2. Try `authService.getCurrentUser()` (`GET /users/me`) -> `applyUserSession` -> `ensureCsrfToken()`.
3. On failure -> `authService.refreshToken(refreshToken)` -> persist new tokens -> apply user -> force CSRF.
4. On refresh failure -> `clearSession()`.

`applyUserSession` maps backend role via `mapBackendRoleToFrontend`; throws `"Unsupported user role"` if unmapped.

### 5.4 Login Flow

1. UI: 10-digit mobile + password (`Login.jsx`).
2. `login(mobile, password)` -> `POST /auth/login`.
3. If `requires2FA` -> return `{ requires2FA, userId, message }` (no session yet); UI swaps to OTP (`maxLength=8`).
4. `verify2FALogin(userId, code)` -> `POST /auth/2fa/verify` -> apply session.
5. Else apply session with access/refresh/csrf tokens.
6. Navigate `getDashboardRoute(result.role)`.
7. Errors mapped by `mapLoginError`: `ACCOUNT_NOT_FOUND`/404 -> `"No account found"`; else `"Invalid credentials"`.

### 5.5 Register Flow

- Fields: name, email, phone, password, confirmPassword, role (`admin`\|`vendor`\|`delivery`, default `admin`).
- Phone stripped to digits; role mapped to backend enum.
- `POST /auth/register`  -  **does not auto-login**.
- Success -> `/login` with state message about Super Admin approval.

### 5.6 Password Reset

| Step | Endpoint | Notes |
|------|----------|-------|
| Forgot | `POST /auth/forgot-password` `{ identifier }` | May return `resetUrl` for dev display |
| Reset | `POST /auth/reset-password` `{ token, newPassword }` | Token from query; client enforces match, not full complexity |

### 5.7 Logout

1. Layouts use `useLogoutConfirm` -> `ConfirmDialog`.
2. Confirm -> `useLogout` -> `auth.logout()`: ensure CSRF, `POST /auth/logout` with refreshToken, set `localStorage.logout`, always `clearSession` in `finally`.
3. Navigate `/login` replace.

### 5.8 Token Refresh (Axios response interceptor)

- On `401` (excluding login/refresh, excluding already `_retry`): queue concurrent requests; single `POST /auth/refresh-token`; persist tokens; force CSRF; replay.
- Failure / no refresh token -> clear auth -> `/login`.
- CSRF `403` (message contains `csrf`): force-refresh CSRF, retry once (`_csrfRetry`).
- `SESSION_REPLACED` error code: write `session_replaced`, clear auth, hard redirect `/login`.

### 5.9 CSRF (`utils/csrf.js`)

- `GET /auth/csrf-token`; persist via `persistSession`; dedupe concurrent fetches.
- Attached as `x-csrf-token` on POST/PUT/PATCH/DELETE (except csrf-token endpoint itself).

### 5.10 Auth Service Endpoints

| Function | Method | Path |
|----------|--------|------|
| login | POST | `/auth/login` |
| logout | POST | `/auth/logout` |
| refreshToken | POST | `/auth/refresh-token` |
| getCsrfToken | GET | `/auth/csrf-token` |
| register | POST | `/auth/register` |
| getCurrentUser | GET | `/users/me` |
| updateProfile | PUT | `/users/me` |
| uploadProfileImage | POST | `/users/profile-image` |
| changePassword | POST | `/auth/change-password` |
| forgotPassword | POST | `/auth/forgot-password` |
| resetPassword | POST | `/auth/reset-password` |
| getSessions | GET | `/auth/sessions` |
| revokeSession | DELETE | `/auth/sessions/${tokenId}` |
| logoutAllDevices | POST | `/auth/logout-all` |
| enable2FA | POST | `/auth/2fa/enable` |
| verify2FASetup | POST | `/auth/2fa/verify-setup` |
| disable2FA | POST | `/auth/2fa/disable` |
| verify2FALogin | POST | `/auth/2fa/verify` |

---

## 6. Authorization Inventory

### 6.1 Role Mapping (`utils/roleMap.js`)

| Backend | Frontend | Dashboard |
|---------|----------|-----------|
| SUPER_ADMIN | super-admin | `/super-admin/dashboard` |
| ADMIN | admin | `/admin/dashboard` |
| VENDOR | vendor | `/vendor/dashboard` |
| B2B_CUSTOMER | vendor | `/vendor/dashboard` |
| DELIVERY_PARTNER | delivery | `/delivery/dashboard` |

Register maps frontend -> backend: vendor -> `VENDOR` only (not B2B_CUSTOMER). Super-admin cannot self-register.

### 6.2 Enforcement Model

- **Exclusive single-role match:** `role !== requiredRole` -> bounce to own dashboard.
- **No multi-role allow-lists**, no permission matrix, no resource-level ACLs in the frontend.
- Page-level authorization is entirely by portal prefix.

### 6.3 Capability Matrix (route-level)

| Capability | Super Admin | Admin | Vendor | Delivery | Public |
|------------|:-----------:|:-----:|:------:|:--------:|:------:|
| Marketing home | Y | Y | Y | Y | Y |
| Login / Register / Reset | Y | Y | Y | Y | Y |
| Platform stats / audit | Y | | | | |
| User approvals | Y | | | | |
| Manage admins/vendors/DPs (SA hub) | Y | | | | |
| Financial analytics dashboard | Y | | | | |
| Bank transfer approve/reject (intended) | Y* | | | | |
| Catalog CRUD | | Y | | | |
| Inventory SET | | Y | | | |
| Vendor approve/reject/suspend | | Y | | | |
| Order status workflow | Y | Y | | | |
| Delivery assignment | | Y | | | |
| Ops reports CSV | | Y | | | |
| Delivery analytics charts | | Y | | | |
| Browse/buy products | | | Y | | |
| Cart / checkout / wishlist | | | Y | | |
| Vendor orders / invoices | | | Y | | |
| Bank proof upload | | | Y | | |
| Delivery lifecycle actions | | | | Y | |
| Delivery earnings / performance | | | | Y | |
| Shared SettingsPage | Y | Y | Y | Y | |

\* Super Admin Payment Verifications page exists but **is not routed**  -  effectively unavailable.

### 6.4 UI-Only Role Branching (SettingsPage)

- Company / GST fields: vendor, admin, super-admin.
- Business details: vendor, admin.
- Vehicle fields: delivery.

### 6.5 Financial Data Separation

- Admin Dashboard / Reports / Analytics **intentionally skip** `analyticsService.getDashboard()` (`setAnalytics(null)`).
- Super Admin Analytics calls `getDashboard()` and shows revenue.
- Admin Payment Verifications is a stub directing to Super Admin.

---

## 7. API Integration Layer

### 7.1 Axios Client (`services/api.js`)

| Setting | Value |
|---------|-------|
| Library | `axios.create` |
| baseURL | `VITE_API_BASE_URL` \| `window.__BACKEND_URL__` \| dev fallback |
| timeout | 10000 ms (FormData >= 60000) |
| withCredentials | true |
| Default Content-Type | application/json |

**Request interceptor:** prod baseURL guard; Bearer; FormData Content-Type strip; CSRF for mutations; DEV debug log.

**Response interceptor:** SESSION_REPLACED hard logout; CSRF one-shot retry; 401 refresh queue; soft-resolve `{ data: null, status: 200 }` for 403 on `/analytics` and `/payments/bank-transfer*`; public-path skip for login redirect.

**Retry:** Token refresh + CSRF only. **No** generic 5xx/network retry. **No** HTTP cache library (only `_refresh=Date.now()` query bust on some GETs).

### 7.2 Service Module Catalog

All paths relative to `baseURL` (typically `.../api/v1`). Default return: `response.data`. Errors propagate to callers.

#### authService  -  see Section 5.10

#### userService
| Function | Method | Path |
|----------|--------|------|
| getAllUsers | GET | `/users` |
| getUserById | GET | `/users/${userId}` |
| deleteUser | DELETE | `/users/${userId}` |
| getUsersByRole | GET | `/admin/users?role=...` |

#### productService
| Function | Method | Path | Notes |
|----------|--------|------|-------|
| getAllProducts | GET | `/products` | optional `_refresh` bust |
| getProductById | GET | `/products/${id}` | |
| createProduct | POST | `/products` | JSON or FormData |
| updateProduct | PUT | `/products/${id}` | JSON or FormData |
| deleteProduct | DELETE | `/products/${id}` | |
| updateProductStock | PATCH | `/products/${id}/stock` | `{ stock }` |

#### categoryService
| Function | Method | Path |
|----------|--------|------|
| getCategories | GET | `/categories` |
| getCategoryById | GET | `/categories/${id}` |
| createCategory | POST | `/categories` |
| updateCategory | PUT | `/categories/${id}` |
| deleteCategory | DELETE | `/categories/${id}` |

#### searchService
| searchProducts | GET | `/search?q=` | Maps via `mapBackendProducts`; returns `{ products, pagination }` |

#### pricingService
| calculatePrice | POST | `/pricing` | `{ price, quantity }` |

#### cartService
| getCart | GET | `/cart` |
| addToCart | POST | `/cart` | `{ productId, quantity }` |
| removeFromCart | DELETE | `/cart/${productId}` |

#### orderService
| getAllOrders | GET | `/orders` |
| getOrderById | GET | `/orders/${id}` |
| createOrder | POST | `/orders` | Optional `Idempotency-Key`; in-flight dedupe via `window.__b2bCreateOrderInFlight` |
| updateOrderStatus | PATCH | `/orders/${id}/status` |
| downloadInvoice | GET | `/orders/${id}/invoice` | `responseType: blob`; returns full Axios response |

#### wishlistService
| getWishlist | GET | `/wishlist` |
| addToWishlist | POST | `/wishlist/add` |
| removeFromWishlist | DELETE | `/wishlist/remove/${productId}` |
| clearWishlist | DELETE | `/wishlist/clear` |

#### creditService
| getCredit | GET | `/credit` |
| getLedger | GET | `/credit/ledger` |
| useCredit | POST | `/credit/use` | `{ orderId }` |
| repayCredit | POST | `/credit/repay` | `{ amount }` |

#### paymentService
| createRazorpayOrder | POST | `/payments/create-order` | `{ amount }` |
| initiatePayment | POST | `/payments/initiate/${orderId}` |
| verifyPayment | POST | `/payments/verify` |
| failPayment | POST | `/payments/fail` | `{ orderId, reason }` |
| hybridPayment | POST | `/payments/hybrid` |
| getBankTransferDetails | GET | `/payments/bank-transfer/bank-details` |
| uploadBankTransferProof | POST | `/payments/bank-transfer/upload` | FormData: orderId, utrNumber, screenshot |
| getPendingBankTransfers | GET | `/payments/bank-transfer/pending` |
| approveBankTransfer | PATCH | `/payments/bank-transfer/${proofId}/approve` |
| rejectBankTransfer | PATCH | `/payments/bank-transfer/${proofId}/reject` | `{ reason }` |
| getBankTransferByOrder | GET | `/payments/bank-transfer/order/${orderId}` |

#### invoiceService
| getInvoices | GET | `/invoices` |
| getInvoiceByOrderId | GET | `/invoices/${orderId}` |
| generateInvoice | POST | `/invoices/${orderId}` |

#### deliveryService (logistics)
| getMyAssignments | GET | `/logistics/my-assignments` |
| getDeliveryQueue | GET | `/logistics/delivery-queue` |
| getDeliveryHistory | GET | `/logistics/history` |
| getDeliveryAnalytics | GET | `/logistics/analytics` |
| createShipment | POST | `/logistics/${orderId}` |
| assignDeliveryPartner | PATCH | `/logistics/${shipmentId}/assign` | `{ deliveryPartnerId }` |
| reassignDeliveryPartner | PATCH | `/logistics/${shipmentId}/reassign` |
| getShipmentDetails | GET | `/logistics/${shipmentId}` |
| acceptDelivery | POST | `/logistics/${shipmentId}/accept` |
| pickUpDelivery | POST | `/logistics/${shipmentId}/pick` |
| startDelivery | POST | `/logistics/${shipmentId}/start` |
| markAsDelivered | POST | `/logistics/${shipmentId}/delivered` |
| completeDelivery | POST | `/logistics/${shipmentId}/complete` |
| updateLocation | POST | `/logistics/${shipmentId}/location` |
| getNotifications / markNotificationRead | GET/PATCH | `/notifications*` |
| getProfile / updateProfile | GET/PUT | `/users/me` |

#### adminService
| getStats | GET | `/admin/stats` |
| getUsers | GET | `/admin/users` |
| updateUserStatus | PATCH | `/admin/users/${userId}` | `{ status }` |
| approveUser | POST | `/admin/approve/${userId}` |
| rejectUser | POST | `/admin/reject/${userId}` |

#### adminApprovalService
| getAll | GET | `/admin-approvals` |
| getPending | GET | `/admin-approvals/pending` |
| approve | PATCH | `/admin-approvals/${id}/approve` |
| reject | PATCH | `/admin-approvals/${id}/reject` |

#### superAdminService
| getStats | GET | `/super-admin/stats` |
| getMetrics | GET | `/super-admin/metrics` |
| getAuditLogs | GET | `/super-admin/audit-logs` |
| getUsers | GET | `/super-admin/users` |

#### analyticsService
| getDashboard | GET | `/analytics/dashboard` |
| getDeliveryAnalytics | GET | `/analytics/delivery` |

#### notificationService
| getNotifications | GET | `/notifications` |
| markAsRead | PATCH | `/notifications/${id}/read` |
| markAllAsRead | PATCH | `/notifications/read-all` |

#### settingsService
| getSettings | GET | `/settings` |
| updateSettings | PUT | `/settings` |

#### inventoryService (not in barrel `index.js`)
| getInventory | GET | `/inventory` |
| getLowStockItems | GET | `/inventory/low-stock` |
| getInventoryStats | GET | `/inventory/stats` |
| updateStock | PATCH | `/inventory/update` | Admin UI: `{ productId, warehouseId, stock, type: "SET" }` |
| addStock | POST | `/inventory` |

#### uploadService (not in barrel; **unused by pages/hooks**)
| uploadImage | POST | `/upload/image` | FormData image + folder |

### 7.3 Barrel Exports (`services/index.js`)

Exports all services above **except** `uploadService` and `inventoryService` (imported by direct path where used).

### 7.4 Related Client Utilities

| Utility | Role |
|---------|------|
| `apiResponse.unwrapApiList/Data` | Normalize envelopes |
| `loginErrorMapper` | Login UX messages |
| `csrf` | Token fetch + error detect |
| `razorpayCheckout` | Load script + open checkout; amount in paise |
| `bankTransferUtils` | Resolve upload URLs; map proof status |

---

## 8. Complete Feature Inventory

Each feature below uses the mandatory 20-point enterprise template.

### 8.1 Public Marketing / Landing

1. **Feature Name:** Home Landing Page
2. **Purpose:** Brand marketing, social proof, live category/product teasers, CTAs to register or role dashboard.
3. **User Roles:** Public; authenticated users redirected to role dashboard via CTAs.
4. **Pages:** `/` -> Home.jsx
5. **Components:** Navbar; lazy SocialProof, ProductCategories, WholesaleDeals, BusinessFeatures, MobileAppPromotion; inline Hero/Showcase/CTA/Footer.
6. **Dialogs:** None (mobile nav dialog in Navbar).
7. **API Calls:** ProductCategories -> categoryService.getCategories; WholesaleDeals -> productService.getAllProducts({page:1,limit:4,isActive:true}).
8. **Validation:** N/A.
9. **State Management:** AuthContext for CTA; section-local loading/empty.
10. **Business Rules:** handleGetStarted: authenticated -> getDashboardRoute(role); else /register. Category/deal cards link to /register.
11. **Error Handling:** Section fetch failures -> empty arrays / empty UI.
12. **Loading Behavior:** Suspense fallback null; section skeletons.
13. **Success Behavior:** Static + live sections render.
14. **Edge Cases Handled:** Authenticated user still sees Sign In; many footer/social href="#".
15. **Limitations:** Home uses inline footer (not shared Footer.jsx); marketing numbers static.
16. **Dependencies:** lucide-react, AuthContext, roleMap.
17. **Related Modules:** Auth, Vendor catalog.
18. **Accessibility:** main#main; aria-labels on social/store badges.
19. **Responsive:** Breakpoints 640/768/1024; stacked hero; hide floating cards on small.
20. **Implementation Status:** Implemented (marketing + partial live data).

### 8.2 Authentication (Login / Register / Reset / 2FA)

1. **Feature Name:** Authentication Suite
2. **Purpose:** Credential login, optional 2FA, self-registration pending approval, password recovery.
3. **User Roles:** Public for entry; all roles post-login.
4. **Pages:** /login, /register, /forgot-password, /reset-password.
5. **Components:** Navbar, Card, Button, PasswordInput.
6. **Dialogs:** None (inline 2FA step).
7. **API Calls:** authService login/verify2FA/register/forgot/reset; AuthContext orchestration.
8. **Validation:** Mobile 10 digits; Register: name>=2, email regex, phone 10 digits, password length policy, confirm match; Reset: token required, passwords match.
9. **State Management:** Local form/error/loading; AuthContext session.
10. **Business Rules:** 2FA gate before session; register no auto-login; password min 12 strict / 6 non-strict; super-admin not selectable on register.
11. **Error Handling:** mapLoginError; banner messages from API.
12. **Loading Behavior:** Button disabled + Signing in... / Creating... / Sending... / Resetting...
13. **Success Behavior:** Navigate dashboard or login; reset waits 2s.
14. **Edge Cases Handled:** Back from 2FA clears pending; forgot may show dev resetUrl.
15. **Limitations:** Login ignores Register location.state.message; Reset does not enforce complexity client-side beyond match; no auth bounce if already logged in.
16. **Dependencies:** AuthContext, authValidationPolicy, PasswordInput.
17. **Related Modules:** ProtectedRoute, Settings 2FA, Super Admin approvals.
18. **Accessibility:** Labels; PasswordInput toggle aria-label.
19. **Responsive:** Centered max-w-md cards; pt-24/32.
20. **Implementation Status:** Implemented.

### 8.3 Vendor Catalog Browse & Product Details

1. **Feature Name:** Vendor Product Catalog
2. **Purpose:** Search/filter wholesale products; view details with bulk pricing; add cart/wishlist.
3. **User Roles:** vendor.
4. **Pages:** /vendor/products, /vendor/products/:id, /vendor/categories.
5. **Components:** PageHeader, ProductCard, SearchBar, FilterPanel, BulkPricingTable.
6. **Dialogs:** Toast banners.
7. **API Calls:** useProducts -> productService/searchService; useProductDetails; useProductPricing -> pricingService; useCategories; useCart.add; useWishlist.add.
8. **Validation:** Qty >= MOQ; reject out_of_stock; qty clamped to stock.
9. **State Management:** Hook filters/search/viewMode; quantity/tabs on details.
10. **Business Rules:** Default add qty = MOQ; client filters after fetch (limit 100); API price preferred over client bulk tiers; reviews tab hardcoded.
11. **Error Handling:** Full-page load error; toast on action fail; not-found UI.
12. **Loading Behavior:** Loading products/product...; pricing ellipsis.
13. **Success Behavior:** Toast; navigation to details; related products.
14. **Edge Cases Handled:** URL ?categoryId=; duplicate add blocked via ref; empty filters.
15. **Limitations:** List view omits wishlist; reviews stub; rating default 4; no server-side filter pagination UX.
16. **Dependencies:** productMapper, pricingCalculator.
17. **Related Modules:** Cart, Wishlist, Checkout.
18. **Accessibility:** Image alts; status text; tabs not full ARIA tabs.
19. **Responsive:** 1-4 col grids; filter full-width mobile.
20. **Implementation Status:** Implemented / ProductDetails Partial.

### 8.4 Cart & Checkout & Payments

1. **Feature Name:** Vendor Cart, Checkout, Payments
2. **Purpose:** Review cart; place order with COD or Razorpay; support bank-transfer/credit/hybrid in hook layer; upload bank proof.
3. **User Roles:** vendor (checkout); super-admin intended for proof approval.
4. **Pages:** /vendor/cart, /vendor/checkout, /vendor/order-success, /vendor/orders/:id/payment.
5. **Components:** CartItem, BankTransferDetails, PaymentProofForm, StatusBadge, PageHeader.
6. **Dialogs:** Toasts; placement locks via window globals.
7. **API Calls:** cartService; orderService.createOrder (+ Idempotency-Key); paymentService initiate/verify/fail/hybrid/bank; razorpayCheckout; CSRF force-refresh before place.
8. **Validation:** Checkout: address/city/state required; pincode /^\d{6}$/; phone required; credit/hybrid checks if selected.
9. **State Management:** useCart totals; selectedPayment default cod; placementLocked + mutex refs; useCredit; useBankTransferDetails/Proof.
10. **Business Rules:** Tax 18% via calculateCartTotals; UI PAYMENT_METHODS = cod|razorpay only; useCheckout maps credit/hybrid/bank_transfer/online; double-submit guards __b2bCheckoutPlacing / __b2bPlaceOrderInFlight / __b2bOrderClickMutex; bank success -> payment page; payment fail -> failPayment then throw.
11. **Error Handling:** Banners; empty cart guards.
12. **Loading Behavior:** Loading cart; Placing Order... / Processing Payment...
13. **Success Behavior:** Navigate success or bank payment; reload cart onSuccess.
14. **Edge Cases Handled:** Prefill from user; cart empty; rejected proof resubmit.
15. **Limitations:** Cart qty edit disabled; credit/hybrid/bank not in selectable UI; SA payment verification unrouted; bank details still fetched.
16. **Dependencies:** useCheckout, paymentService, orderMapper.
17. **Related Modules:** Orders, Invoices, SuperAdmin PaymentVerifications.
18. **Accessibility:** Field labels; payment as buttons; min 44px CTAs.
19. **Responsive:** 1/3 sticky summary; stack on mobile.
20. **Implementation Status:** Partial (COD+Razorpay primary; bank proof upload implemented).

### 8.5 Vendor Orders & Invoices

1. **Feature Name:** Vendor Order Lifecycle & Billing
2. **Purpose:** List/filter orders; detail timeline; invoice PDF download; bank proof on PENDING_PAYMENT.
3. **User Roles:** vendor.
4. **Pages:** /vendor/orders, /vendor/orders/:id, /vendor/invoices, /vendor/invoices/:id.
5. **Components:** OrderCard, OrderTimeline, StatsCard, SearchBar, StatusBadge, PaymentProofForm, BankTransferDetails.
6. **Dialogs:** Toasts.
7. **API Calls:** useOrders / useOrderDetails; orderService.downloadInvoice (blob); invoiceService.getInvoices; useBankTransferProof.
8. **Validation:** UTR + screenshot on proof form.
9. **State Management:** filterStatus/searchTerm; invoiceError/toast.
10. **Business Rules:** Search matches id/orderNumber/item names; canSubmitProof when BANK_TRANSFER or PENDING_PAYMENT pending; Print = download.
11. **Error Handling:** Banners; invoice fail may navigate to details.
12. **Loading Behavior:** Loading orders/order/invoices.
13. **Success Behavior:** PDF download invoice-{id}.pdf; toast on proof.
14. **Edge Cases Handled:** Empty filters; mobile select vs desktop chips.
15. **Limitations:** invoices/:id unused; summary no separate tax line.
16. **Dependencies:** orderMapper, invoiceService.
17. **Related Modules:** Checkout, BankTransferPayment.
18. **Accessibility:** sr-only status label; action titles.
19. **Responsive:** Stats grids; horizontal scroll tables.
20. **Implementation Status:** Implemented / Invoices Partial.

### 8.6 Wishlist

1. **Feature Name:** Vendor Wishlist
2. **Purpose:** Save products; move to cart; remove.
3. **User Roles:** vendor.
4. **Pages:** /vendor/wishlist; also badges in VendorLayout.
5. **Components:** WishlistCard, PageHeader.
6. **Dialogs:** Toast.
7. **API Calls:** wishlistService via useWishlist; cart add.
8. **Validation:** Qty = MOQ default 1.
9. **State Management:** Hook wishlist + toast.
10. **Business Rules:** Add uses productId + MOQ.
11. **Error Handling:** Banner + toast.
12. **Loading Behavior:** Loading wishlist.
13. **Success Behavior:** Toasts; empty -> browse products CTA.
14. **Edge Cases Handled:** onToggleNotify not wired.
15. **Limitations:** Notify-when-available unused.
16. **Dependencies:** wishlistMapper.
17. **Related Modules:** Products, Cart.
18. **Accessibility:** Button titles.
19. **Responsive:** 1-2 col grid.
20. **Implementation Status:** Implemented.

### 8.7 Vendor Profile & Analytics

1. **Feature Name:** Vendor Profile Dashboard Analytics
2. **Purpose:** Edit contact fields; view spend/credit analytics; dashboard overview.
3. **User Roles:** vendor.
4. **Pages:** /vendor/profile, /vendor/dashboard.
5. **Components:** AnalyticsCard, OrderCard, ProductCard, PageHeader.
6. **Dialogs:** None.
7. **API Calls:** useProfile; useVendorAnalytics (orders+credit); useProducts/Orders/Wishlist on dashboard.
8. **Validation:** HTML types only on profile.
9. **State Management:** isEditing formData; memo slices for recent/recommended.
10. **Business Rules:** Editable name/email/phone only; GST/address read-only on profile; recommended = first 4 products.
11. **Error Handling:** Combined banners.
12. **Loading Behavior:** Profile/dashboard loading gates.
13. **Success Behavior:** Exit edit; grids render.
14. **Edge Cases Handled:** Empty recent/analytics messages.
15. **Limitations:** Not personalized recommendations.
16. **Dependencies:** vendorAnalytics, authService.
17. **Related Modules:** Settings, Orders.
18. **Accessibility:** Headings; labels.
19. **Responsive:** Metric grids 2/4 cols.
20. **Implementation Status:** Implemented.

### 8.8 Shared Settings / Sessions / 2FA

1. **Feature Name:** Account Settings
2. **Purpose:** Profile photo, password, sessions, 2FA, notification prefs, theme/language.
3. **User Roles:** All authenticated roles via SettingsPage role prop.
4. **Pages:** /vendor|/admin|/super-admin|/delivery/settings.
5. **Components:** SettingsPage, PageHeader (per portal), toasts.
6. **Dialogs:** Inline 2FA disable confirm; toast.
7. **API Calls:** useSettings -> authService + settingsService (profile, photo, password, sessions, 2FA, settings).
8. **Validation:** Password match; min length policy text; profile required fields.
9. **State Management:** activeTab; forms; twoFASetup.
10. **Business Rules:** Role-gated fields; default notification prefs all true; theme light / lang en.
11. **Error Handling:** Toast error/success from hook.
12. **Loading Behavior:** Settings loading text.
13. **Success Behavior:** Save toasts; QR/backup codes on 2FA setup.
14. **Edge Cases Handled:** Session revoke; logout all devices.
15. **Limitations:** Theme preference may not apply globally; SA settings may double PageHeader.
16. **Dependencies:** useSettings, authValidationPolicy.
17. **Related Modules:** Login 2FA, Profile pages.
18. **Accessibility:** Tabs; min-h 44px controls.
19. **Responsive:** Horizontal tabs mobile; multi-col desktop.
20. **Implementation Status:** Implemented.

### 8.9 Admin Catalog & Inventory

1. **Feature Name:** Admin Products, Categories, Inventory
2. **Purpose:** CRUD products/categories with images; SET stock levels; low-stock alerts.
3. **User Roles:** admin.
4. **Pages:** /admin/products, /admin/categories, /admin/inventory.
5. **Components:** Admin PageHeader/Card/Modal/SearchBar/FilterDropdown/StatusBadge, TableResponsive, ImageUpload.
6. **Dialogs:** Add/Edit/View modals; window.confirm delete; Update Stock modal.
7. **API Calls:** useProducts, useCategories, inventoryService get/stats/updateStock.
8. **Validation:** Product: name, category, price>0; Category: name; Stock >=0.
9. **State Management:** Hook + local modal/form/filters.
10. **Business Rules:** Stock filters in>50 / low 1-50 / out=0; MOQ default 1; update type SET.
11. **Error Handling:** Full-page + inline form errors; success toast 4s.
12. **Loading Behavior:** Loading products/categories/inventory...
13. **Success Behavior:** Modal close; refetch.
14. **Edge Cases Handled:** Placeholder images; empty filtered lists.
15. **Limitations:** Client-side product filters; invalid sm:size icon props ignored.
16. **Dependencies:** productMapper, inventoryMapper, imageUtils.
17. **Related Modules:** Vendor catalog.
18. **Accessibility:** Labels; action titles.
19. **Responsive:** min-w tables with overflow-x.
20. **Implementation Status:** Implemented.

### 8.10 Admin / Super Admin Order Management

1. **Feature Name:** Order Operations Workflow
2. **Purpose:** Search/filter/paginate orders; advance status via NEXT_STATUS_MAP.
3. **User Roles:** admin, super-admin.
4. **Pages:** /admin/orders, /super-admin/orders.
5. **Components:** AdminOrderManagement; SA mobile MobileOrders branch.
6. **Dialogs:** View/Manage modal; status confirm.
7. **API Calls:** orderService.getAllOrders, updateOrderStatus.
8. **Validation:** Debounced search; status/date filters.
9. **State Management:** orders, pagination, selectedStatus, dates, selectedOrder.
10. **Business Rules:** NEXT_STATUS_MAP: PENDING->CONFIRMED|CANCELLED ... DELIVERED->COMPLETED|RETURNED ... RETURNED->REFUNDED.
11. **Error Handling:** Card error.
12. **Loading Behavior:** Loading orders...
13. **Success Behavior:** Silent reload after status update.
14. **Edge Cases Handled:** Empty list; pagination.
15. **Limitations:** SA mobile read-only (limit 20); possible stale selectedOrder after update.
16. **Dependencies:** orderMapper, useDebouncedValue.
17. **Related Modules:** Delivery assignment.
18. **Accessibility:** Date aria-labels; 44px buttons.
19. **Responsive:** Date filters hidden md:flex; table scroll.
20. **Implementation Status:** Implemented / SA mobile Partial.

### 8.11 Delivery Assignment (Admin)

1. **Feature Name:** Delivery Assignment
2. **Purpose:** Assign/reassign delivery partners to unassigned/active shipments.
3. **User Roles:** admin.
4. **Pages:** /admin/delivery-assignment.
5. **Components:** Admin UI kit; useDeliveryAssignment.
6. **Dialogs:** Assign/Reassign modal.
7. **API Calls:** deliveryService queue/assign/reassign/createShipment; admin users for partners.
8. **Validation:** Confirm disabled until partner selected.
9. **State Management:** Tabs unassigned/active/completed; search; modal.
10. **Business Rules:** Pending orders statuses CONFIRMED|PROCESSING|PACKED|SHIPPED without queue entry; needsShipment creates then assigns; only active partners.
11. **Error Handling:** Hook error banner.
12. **Loading Behavior:** Initial + Refresh.
13. **Success Behavior:** Modal close; refresh lists.
14. **Edge Cases Handled:** Empty tab messages.
15. **Limitations:** Partner rating/vehicle may be sparse.
16. **Dependencies:** adminDeliveryMapper.
17. **Related Modules:** Delivery Partner AssignedOrders.
18. **Accessibility:** Partner rows role=button + Enter.
19. **Responsive:** Stacked cards; partner grid.
20. **Implementation Status:** Implemented.

### 8.12 Admin Vendors & Super Admin User Management

1. **Feature Name:** User Governance
2. **Purpose:** Approve/reject registrations; manage vendors/admins/delivery partners; suspend/activate.
3. **User Roles:** admin (vendors); super-admin (hub).
4. **Pages:** /admin/vendors; /super-admin/user-management (+ redirects from approvals/vendors/delivery-partners).
5. **Components:** DataTable, StatusBadge, SearchBar, Modal; embedded AdminApprovals, Vendors, DeliveryPartners; AdminManagement inline.
6. **Dialogs:** window.confirm approve/reject; vendor profile modal (Admin); dead Quick Actions modal (SA).
7. **API Calls:** adminApprovalService pending/approve/reject; adminService getUsers/approve/reject/updateUserStatus.
8. **Validation:** Client search/status filters.
9. **State Management:** section tabs; per-list loading/actionId.
10. **Business Rules:** Approve enables login; reject blocks; suspend when approved; DP ACTIVE/INACTIVE toggle; Reset Password disabled (backend not exposed).
11. **Error Handling:** Banners; some DP action errors swallowed.
12. **Loading Behavior:** Per section.
13. **Success Behavior:** Reload lists.
14. **Edge Cases Handled:** Empty pending; nested PageHeaders when embedding.
15. **Limitations:** DP Edit alert stub; Create Admin stub in dead modal; columns TDZ risk in DeliveryPartners.
16. **Dependencies:** vendorMapper.
17. **Related Modules:** Register, Auth.
18. **Accessibility:** aria-current tabs; action titles.
19. **Responsive:** 2x2 mobile tab grid; DataTable bottom sheet.
20. **Implementation Status:** Implemented with stubs.

### 8.13 Analytics & Reports

1. **Feature Name:** Analytics and Operational Reports
2. **Purpose:** Charts and CSV exports; financial data Super-Admin only.
3. **User Roles:** admin (ops/delivery), super-admin (full financial).
4. **Pages:** /admin/analytics, /admin/reports, /super-admin/analytics, /super-admin/dashboard, /super-admin/platform.
5. **Components:** recharts; DashboardCard; ActivityFeed; Card; downloadCsv.
6. **Dialogs:** None.
7. **API Calls:** analyticsService getDashboard/getDeliveryAnalytics; adminService.getStats; superAdminService stats/metrics/audit-logs.
8. **Validation:** Reports: non-CSV formats rejected.
9. **State Management:** Local analytics/stats; Admin forces analytics null.
10. **Business Rules:** Admin never fetches financial dashboard; SA shows revenue; Platform health mostly hardcoded.
11. **Error Handling:** Banners.
12. **Loading Behavior:** Loading analytics/report/dashboard...
13. **Success Behavior:** Charts/CSV download.
14. **Edge Cases Handled:** Empty chart states; invalid recharts sm* props ignored.
15. **Limitations:** Date range UI unused; PDF/Excel unimplemented; Platform not real infra monitoring.
16. **Dependencies:** exportCsv, recharts.
17. **Related Modules:** Orders, Delivery.
18. **Accessibility:** Charts limited accessibility.
19. **Responsive:** useViewport mobile layouts on SA.
20. **Implementation Status:** Partial / SA Analytics Implemented.

### 8.14 Bank Transfer Verification

1. **Feature Name:** Payment Proof Verification
2. **Purpose:** Super Admin approve/reject vendor bank transfer proofs.
3. **User Roles:** super-admin (intended); vendor uploads.
4. **Pages:** SuperAdmin/PaymentVerifications.jsx (UNROUTED); Admin stub at /admin/payment-verifications.
5. **Components:** TableResponsive, Modal, StatusBadge, usePendingBankTransfers.
6. **Dialogs:** Reject reason modal; toast.
7. **API Calls:** paymentService pending/approve/reject.
8. **Validation:** Rejection reason required.
9. **State Management:** Hook proofs + actionLoading + reject modal.
10. **Business Rules:** Manual review; any amount accepted after approval; vendor can resubmit after reject.
11. **Error Handling:** Banner + toast.
12. **Loading Behavior:** Loading proofs.
13. **Success Behavior:** Toast; close modal.
14. **Edge Cases Handled:** Structural JSX issues noted in page; mobile disable gaps.
15. **Limitations:** **Not reachable via App.jsx route**; sidebar link broken.
16. **Dependencies:** useBankTransfer, bankTransferUtils.
17. **Related Modules:** Vendor BankTransferPayment.
18. **Accessibility:** Reject form labels.
19. **Responsive:** Cards mobile / table desktop.
20. **Implementation Status:** Partial / effectively dead (unrouted).

### 8.15 Delivery Partner Operations

1. **Feature Name:** Delivery Lifecycle & Earnings
2. **Purpose:** View assignments; accept->pick->start->deliver->complete; history; earnings; performance; profile.
3. **User Roles:** delivery.
4. **Pages:** All /delivery/* pages.
5. **Components:** DeliveryCard, OrderDetailsCard, TimelineTracker, MetricCard, EarningsCard, PerformanceCard, ProfileCard, FilterPanel, SearchBar, StatusBadge, NotificationDrawer.
6. **Dialogs:** Logout confirm; notification drawer.
7. **API Calls:** useDelivery -> logistics endpoints; updateProfile; notifications.
8. **Validation:** Proof image optional; notes free text; profile fields minimal.
9. **State Management:** Hook assignments/history/analytics; local filters; order action state; 30s poll on AssignedOrders when visible.
10. **Business Rules:** NEXT_ACTIONS map; complete only after delivered; earnings ~ 5% of order in history mapper; performance rating pie fabricated from counts.
11. **Error Handling:** Error pages/banners.
12. **Loading Behavior:** Loading texts; action Updating...
13. **Success Behavior:** Refresh after actions; charts.
14. **Edge Cases Handled:** Not found -> back; FileReader base64 proof.
15. **Limitations:** Dashboard change deltas hardcoded; bell always red; AnalyticsCard unused; synthetic ratings.
16. **Dependencies:** deliveryMapper, recharts.
17. **Related Modules:** Admin Delivery Assignment.
18. **Accessibility:** Labels; search clear aria-label.
19. **Responsive:** Card grids; table scroll.
20. **Implementation Status:** Implemented / Dashboard & Performance Partial.

### 8.16 Notifications

1. **Feature Name:** In-App Notifications
2. **Purpose:** Fetch notifications; show unread badges; drawer UI.
3. **User Roles:** vendor, admin, super-admin (useNotifications); delivery (useDelivery notifications).
4. **Pages:** Layouts (drawers); Admin Dashboard activities.
5. **Components:** Role-specific NotificationDrawer.
6. **Dialogs:** Drawer overlay.
7. **API Calls:** notificationService get/markAsRead/markAllAsRead; deliveryService equivalents.
8. **Validation:** N/A.
9. **State Management:** notifications, unreadCount.
10. **Business Rules:** Badge caps at 9+.
11. **Error Handling:** Hook error (often silent in layout).
12. **Loading Behavior:** Background load.
13. **Success Behavior:** List render.
14. **Edge Cases Handled:** Delivery layout always shows red dot (not count-based).
15. **Limitations:** Mark All as Read buttons are no-ops in drawers (no onClick wired).
16. **Dependencies:** mapNotifications.
17. **Related Modules:** Layouts.
18. **Accessibility:** Drawer close; aria on bell.
19. **Responsive:** Full-height right drawer.
20. **Implementation Status:** Partial (read APIs exist; mark-all UI stub).

---

## 9. Complete Page Inventory

For every page file under `src/pages` (48 page modules). Columns: Purpose | Actions | Permissions | Components | APIs | Validation | Constraints.

### 9.1 Home & Auth

| Page | Purpose | Available Actions | Permissions | Components | API Dependencies | Validation | Known Constraints |
|------|---------|-------------------|-------------|------------|------------------|------------|-------------------|
| Home | Marketing landing | Get Started, Sign In, browse sections | Public | Navbar, sections | categories, products (sections) | None | Static marketing; footer duplicates |
| Login | Authenticate | Submit, 2FA verify, links | Public | Navbar, Card, Button, PasswordInput | login, verify2FA | Mobile 10-digit, required | No auth bounce; ignores register message |
| Register | Self-register | Submit role+creds | Public | Same + role select | register | Name/email/phone/password policy | No super-admin; awaits approval |
| ForgotPassword | Request reset | Submit identifier | Public | Navbar, Card, Button | forgotPassword | Required identifier | May show dev resetUrl |
| ResetPassword | Set new password | Submit | Public + token | PasswordInput | resetPassword | Token; match | Weak client complexity check |

### 9.2 Vendor Pages

| Page | Purpose | Actions | Permissions | Components | APIs | Validation | Constraints |
|------|---------|---------|-------------|------------|------|------------|------------|
| Dashboard | Overview | Navigate quick links | vendor | AnalyticsCard, OrderCard, ProductCard | useOrders, useProducts, useWishlist, useVendorAnalytics |  -  | Recommended = first 4 |
| Products | Browse catalog | Search, filter, add cart/wishlist, view | vendor | ProductCard, SearchBar, FilterPanel | useProducts, useCategories, cart, wishlist | MOQ / OOS | Limit 100 client filter |
| ProductDetails | Detail + pricing | Qty, add cart/wishlist, tabs | vendor | BulkPricingTable, ProductCard | useProductDetails, useProductPricing | Qty>=MOQ | Reviews stub |
| Categories | Category grid | Open products by categoryId | vendor | PageHeader | useCategories |  -  | No search |
| Cart | Review cart | Remove, checkout | vendor | CartItem | useCart |  -  | No qty edit |
| Checkout | Place order | Fill address, pay, place | vendor | BankTransferDetails | useCart, useCheckout, useCredit, bank details | Address/pincode/phone | Only COD+Razorpay selectable |
| OrderSuccess | Confirmation | Links to order/payment | vendor | Icons | getOrderById optional |  -  | Error lightly shown |
| BankTransferPayment | Upload proof | Submit UTR+file | vendor | BankTransferDetails, PaymentProofForm, StatusBadge | useBankTransferProof, upload | UTR+file | Rarely reached from UI payment list |
| Orders | Order list | Filter, search, invoice, details | vendor | OrderCard, SearchBar, StatsCard | useOrders, downloadInvoice |  -  |  -  |
| OrderDetails | Order detail | Proof, invoice, print | vendor | OrderTimeline, proof components | useOrderDetails, bank proof, invoice | Proof rules |  -  |
| Invoices | Billing list | Filter, download | vendor | StatusBadge | getInvoices, downloadInvoice |  -  | `:id` unused |
| Wishlist | Saved items | Add cart, remove | vendor | WishlistCard | useWishlist, useCart | MOQ | Notify unused |
| Profile | Business profile | Edit contact | vendor | AnalyticsCard | useProfile, useVendorAnalytics | HTML | GST read-only |
| Settings | Account settings | Tabs save/2FA/sessions | vendor | SettingsPage | useSettings | Password policy | Theme may not apply globally |

### 9.3 Admin Pages

| Page | Purpose | Actions | Permissions | Components | APIs | Validation | Constraints |
|------|---------|---------|-------------|------------|------|------------|------------|
| Dashboard | Ops overview | Quick links | admin | Card, notifications | adminService.getStats |  -  | No financial analytics |
| Products | Catalog CRUD | Create/edit/delete/view/filter | admin | Modal, ImageUpload, TableResponsive | useProducts, useCategories | Name/category/price | Client filters |
| Categories | Category CRUD | Create/edit/delete/view | admin | Modal, ImageUpload | useCategories | Name | Sales display may be empty |
| Inventory | Stock control | Filter, SET stock | admin | Modal | inventoryService | stock>=0 | sm:size prop invalid |
| Vendors | Vendor ops | Approve/reject/suspend/view | admin | Modal | adminService | Filters | No confirm dialogs |
| Orders | Area orders | Status workflow | admin | AdminOrderManagement | orderService | Filters | Shared component |
| PaymentVerifications | Restriction notice | None | admin (deep link) | PageHeader | None |  -  | Stub |
| DeliveryAssignment | Assign DPs | Assign/reassign | admin | Modal | useDeliveryAssignment | Partner required |  -  |
| Reports | CSV export | Export | admin | Card | stats + delivery analytics | CSV only | Hollow financial cards |
| Analytics | Delivery charts | View | admin | recharts | getDeliveryAnalytics |  -  | Financial empty by design |
| Settings | Account | SettingsPage | admin | SettingsPage | useSettings | Password |  -  |

### 9.4 Super Admin Pages

| Page | Purpose | Actions | Permissions | Components | APIs | Validation | Constraints |
|------|---------|---------|-------------|------------|------|------------|------------|
| Dashboard | Platform KPIs | Quick links | super-admin | DashboardCard, ActivityFeed | stats, metrics, audit-logs |  -  | Growth often 0 |
| Platform | Monitoring | View metrics | super-admin | DashboardCard | stats, metrics |  -  | Health hardcoded |
| UserManagement | User hub | Tabs: approvals/admins/vendors/DPs | super-admin | Embedded pages + AdminManagement | admin + approval services | Filters | Dead modal/card lists; reset password disabled |
| AdminApprovals | Pending approvals | Approve/reject | super-admin (embedded) | DataTable | adminApprovalService | confirm | Standalone route redirected |
| Vendors (SA) | Vendor list | Approve/reject/suspend | super-admin (embedded) | DataTable | adminService | Filters | Eye unused |
| DeliveryPartners | DP list | Activate/deactivate | super-admin (embedded) | DataTable | adminService | Filters | Edit stub; silent errors |
| Orders | Global orders | Desktop workflow; mobile list | super-admin | AdminOrderManagement / MobileOrders | orderService | Filters | Mobile read-only |
| Analytics | Financial analytics | Charts | super-admin | recharts | getDashboard |  -  |  -  |
| Settings | Account | SettingsPage | super-admin | SettingsPage | useSettings | Password | Double header risk |
| PaymentVerifications | Approve bank proofs | Approve/reject | super-admin intended | Table, Modal | usePendingBankTransfers | Reject reason | **No route in App.jsx** |

### 9.5 Delivery Partner Pages

| Page | Purpose | Actions | Permissions | Components | APIs | Validation | Constraints |
|------|---------|---------|-------------|------------|------|------------|------------|
| Dashboard | Ops KPIs | Quick links | delivery | MetricCard, StatusBadge | useDelivery |  -  | Hardcoded deltas |
| AssignedOrders | Assignment list | Filter/search/open | delivery | DeliveryCard, SearchBar, FilterPanel | useDelivery + 30s poll | Client filters |  -  |
| OrderDetails | Lifecycle | accept/pick/start/deliver/complete + proof | delivery | OrderDetailsCard, TimelineTracker | useDelivery actions | Notes/proof optional | Base64 proof size |
| History | Completed | Search | delivery | SearchBar, StatusBadge | history |  -  | No pagination |
| Earnings | Earnings charts | View | delivery | EarningsCard, recharts | earningsSeries, analytics |  -  | No bonuses UI |
| Performance | Metrics/achievements | View | delivery | PerformanceCard, recharts | performanceMetrics |  -  | Synthetic rating pie |
| Profile | Partner profile | Edit name/email/phone | delivery | ProfileCard | updateProfile | Minimal | Vehicle read-only |
| Settings | Account | SettingsPage | delivery | SettingsPage (vendor PageHeader) | useSettings | Password/vehicle | Overlaps Profile |

---

## 10. Complete Component Inventory

Total component JSX modules under `src/components` (excluding tests): **60**.

### 10.1 Shared / Root

| Component | Path | Props | Purpose | Key Behaviors |
|-----------|------|-------|---------|---------------|
| Navbar | components/Navbar.jsx |  -  | Public fixed nav | Scroll solidifies; mobile dialog Escape/body lock; minimalPaths hide hamburger on `/`,`/login`,`/register` |
| Footer | components/Footer.jsx |  -  | Shared dark footer | Copyright 2024; social `#`; underused by Home |
| Button | components/Button.jsx | children, variant, size, className, disabled, ... | Styled button | variants primary/secondary/danger/success; sizes sm/md/lg |
| Card | components/Card.jsx | children, className, hover | Auth/form card | Optional lift hover |

### 10.2 Common

| Component | Props | Purpose | Key Behaviors |
|-----------|-------|---------|---------------|
| ErrorBoundary | children | Catch render errors | Try Again / Go Home; console log |
| ConfirmDialog | isOpen, onClose, onConfirm, title, message, labels, loading, confirmVariant | Modal confirm | Focus trap; Escape; body lock; used by logout |
| PasswordInput | name, value, onChange, ... | Password + show/hide | aria-label toggle |
| PortalSidebar | id, menuItems, brandSubtitle, sidebarOpen, mobileMenuOpen, onMobileClose, onLogoutClick, isActive | Role portal nav | Collapsed labels; aria-hidden when closed |
| TableResponsive | children, className | Horizontal scroll table region | role=region aria-label |
| ImageUpload | label, value, previewUrl, onChange, onClear, disabled, required, error | Image picker | JPEG/PNG/WebP; max 10MB; object URL cleanup |

### 10.3 Settings

| SettingsPage | PageHeader, role | Shared settings UI | Tabs: profile, account, security, notifications, preferences; 2FA QR; sessions; photo upload |

### 10.4 Sections (Home)

| Component | API | Behavior |
|-----------|-----|----------|
| BusinessFeatures | none | 6 static feature cards |
| SocialProof | none | 4 static capability tiles |
| ProductCategories | getCategories | Max 8 active; link /register; skeletons |
| WholesaleDeals | getAllProducts limit 4 | Live products; CTA /register |
| MobileAppPromotion | none | Store badges href=#; phone mock |

### 10.5 Vendor Components

| Component | Props | Purpose |
|-----------|-------|---------|
| ProductCard | product, onAddToCart?, onAddToWishlist?, onViewDetails? | Catalog card with badges; memo |
| CartItem | item, onUpdateQuantity?, onRemove?, quantityEditingDisabled, removing | Line item; qty lock message |
| OrderCard | order, onViewDetails?, onViewInvoice?, onDownloadInvoice?, onTrack? | Order summary toolbar |
| WishlistCard | item, onAddToCart?, onRemove?, onToggleNotify?, disabled | Wishlist row |
| SearchBar | onSearch?, placeholder, className | Debounce 300ms |
| FilterPanel | categories, brands, onFilterChange?, className | Sort/category/brand/price/availability |
| PageHeader | title, subtitle?, actions?, breadcrumbs? | Page chrome |
| StatusBadge | status, size | Colored pill |
| StatsCard | title, value, icon | Compact metric |
| AnalyticsCard | title, value, change?, icon?, color, trend? | Dashboard metric |
| BulkPricingTable | bulkPricing | Tier table; highlight last |
| BankTransferDetails | bankDetails, amount?, loading? | Bank account panel |
| PaymentProofForm | orderId, onSuccess?, disabled?, submitLabel? | UTR + screenshot -> upload API |
| OrderTimeline | timeline[] | Vertical progress |
| NotificationDrawer | isOpen, onClose, notifications[] | Right drawer; Mark All noop |

### 10.6 Admin Components

| Component | Purpose |
|-----------|---------|
| PageHeader | Title + CTA/actions |
| Card | Panel; optional onClick |
| Modal | Center modal sizes sm-xl; overlay close |
| StatusBadge | Status pill |
| SearchBar | Controlled search + clear |
| FilterDropdown | Outside-click filter menu |
| NotificationDrawer | Drawer; Mark All noop |
| AdminOrderManagement | Shared order ops: search, filters, pagination, NEXT_STATUS_MAP modal |

### 10.7 Super Admin Components

| Component | Purpose |
|-----------|---------|
| PageHeader | Title + actions |
| DashboardCard | KPI + growth % |
| DataTable | Columns/data; mobile ActionCell bottom sheet; shortens IDs |
| Modal | Body scroll lock; mobile full-height |
| StatusBadge | Status with dot |
| SearchBar | Internal state; onSearch each keystroke |
| FilterDropdown | Outside-click filter |
| ActivityFeed | Typed activity list |
| NotificationDrawer | Outside click; per-item check noop |

### 10.8 Delivery Components

| Component | Purpose | Status |
|-----------|---------|--------|
| DeliveryCard | Assignment card -> details | Used |
| OrderDetailsCard | Detail sections | Used |
| TimelineTracker | Lifecycle steps | Used |
| MetricCard | Dashboard metric | Used |
| EarningsCard | Earnings tile INR  | Used |
| PerformanceCard | Perf tile (red color map incomplete) | Used |
| ProfileCard | Profile summary + Edit | Used |
| FilterPanel | status/priority/date collapsible | Used |
| SearchBar | Uncontrolled callback | Used |
| StatusBadge | Delivery statuses | Used |
| NotificationDrawer | Typed icons; Mark All noop | Used |
| AnalyticsCard | Generic metric | **Unused / dead** |

---

## 11. Complete Hook Inventory

22 hook modules (excluding tests).

| Hook | File | Returns (summary) | Primary Consumers |
|------|------|-------------------|-------------------|
| useAuth | context (not hooks/) | user, role, isAuthenticated, loading, login, verify2FALogin, logout, register | Entire app |
| useCheckout | useCheckout.js | submitting, error, placeOrder, setError + helpers mapPaymentMethodToBackend, buildShippingAddress | Vendor Checkout |
| useCredit | useCredit.js | credit, ledger, loading, error, refresh*, validateAmount | Checkout, useVendorAnalytics |
| useDebouncedValue | useDebouncedValue.js | debounced value | AdminOrderManagement |
| useProductPricing | useProductPricing.js | unitPrice, total, discount, source, bulkApplied, moqUnitPrice, pricingLoading/Error, apiPricing | ProductDetails |
| useCart | useCart.js | cart, items, totals, load/add/remove, loading flags | VendorLayout, Cart, Checkout, Products, ProductDetails, Wishlist |
| useLogoutConfirm | useLogoutConfirm.jsx | requestLogout, LogoutConfirmDialog | All role layouts |
| useDelivery | useDelivery.js | assignments, history, profile, notifications, analytics, earningsSeries, performanceMetrics, actions | DeliveryLayout + all DP pages |
| useSettings | useSettings.js | profile, settings, sessions, CRUD/2FA/password/photo helpers | SettingsPage |
| useWishlist | useWishlist.js | wishlist, items, add/remove/clear | VendorLayout, Products, ProductDetails, Wishlist, Dashboard |
| useProductDetails | useProductDetails.js | product, relatedProducts, loading, error, refetch | ProductDetails |
| useLogout | useLogout.js | async logout+navigate | useLogoutConfirm |
| useFocusTrap | useFocusTrap.js | containerRef | ConfirmDialog |
| useOrders | useOrders.js | orders, stats, loadOrders | Vendor Orders/Dashboard, useVendorAnalytics |
| useOrderDetails | useOrders.js | order, loadOrder | Vendor OrderDetails |
| useVendorAnalytics | useVendorAnalytics.js | analytics, loading, error, orders | Dashboard, Profile |
| useBankTransferDetails | useBankTransfer.js | bankDetails, loading, error | Checkout |
| useBankTransferProof | useBankTransfer.js | proof, bankDetails, orderInfo, reload | BankTransferPayment, OrderDetails |
| usePendingBankTransfers | useBankTransfer.js | proofs, approveProof, rejectProof | SuperAdmin PaymentVerifications |
| useProducts | useProducts.js | products, filtered, CRUD, filters, search | Vendor Products/Dashboard, Admin Products |
| useDeliveryAssignment | useDeliveryAssignment.js | unassigned/active/history/partners, assign/reassign | Admin DeliveryAssignment |
| useMobileSidebar | useMobileSidebar.js | open/close/toggle + route Escape lock | All role layouts |
| useCategories | useCategories.js | categories, CRUD, messages | Vendor Categories/Products, Admin Categories/Products |
| useViewport | useViewport.js | isMobile/Tablet/Desktop | SuperAdmin pages, DataTable |
| useProfile | useProfile.js | profile, edit/save | Vendor Profile |
| useNotifications | useNotifications.js | notifications, unreadCount, mark* | Vendor/Admin/SA layouts, Admin Dashboard |

---

## 12. Complete Context / Provider Inventory

| Provider | Path | Value | Wired in App? |
|----------|------|-------|---------------|
| AuthProvider / useAuth | context/AuthContext.jsx | Session + login/register/logout/2FA | **Yes** (root) |
| MaintenanceContext |  -  |  -  | **Does not exist** |
| CartContext / ThemeContext / etc. |  -  |  -  | **None**  -  domain state is hook-local |

---

## 13. Complete Utility Inventory

21 utility modules (excluding tests).

| File | Exports | Purpose |
|------|---------|---------|
| apiResponse.js | unwrapApiList, unwrapApiData | Envelope normalization |
| authStorage.js | get/persist/clear token helpers | localStorage session |
| authValidationPolicy.js | isAuthStrictMode, getPasswordMinLength, getPasswordRequirementsText, validatePasswordLength | Password policy |
| bankTransferUtils.js | getApiOrigin, resolveUploadUrl, mapPaymentProofStatus, mapPaymentProof | Bank proof mapping/URLs |
| cartMapper.js | mapBackendCartItem, mapBackendCart | Cart UI model |
| categoryMapper.js | mapBackendCategory(ies) | Category UI + image fallbacks |
| csrf.js | fetchCsrfToken, isCsrfError | CSRF |
| deliveryMapper.js | status map, shipment/history/profile/notifications mappers, compute analytics/earnings/performance | Delivery UI |
| exportCsv.js | downloadCsv | CSV Blob download |
| imageUtils.js | getImageVersion, withImageCacheBust | Cache-bust images |
| inventoryMapper.js | map inventory/stats; LOW_STOCK_THRESHOLD=10 | Inventory UI |
| loginErrorMapper.js | mapLoginError | Login messages |
| orderMapper.js | status/payment maps, timeline, vendor/admin order views, computeOrderStats | Orders UI |
| pricingCalculator.js | resolveEffectiveUnitPrice, getMoqUnitPrice, calculateCartTotals (tax 18%) | Pricing |
| productMapper.js | status derive, bulk tiers, map products, client filters | Products UI |
| razorpayCheckout.js | loadRazorpayScript, openRazorpayCheckout | Gateway |
| roleMap.js | role maps, getDashboardRoute | AuthZ routing |
| vendorAnalytics.js | monthly spend, top categories, frequent products, computeVendorAnalytics | Vendor analytics |
| vendorMapper.js | mapUserStatus, mapBackendStatus, mapVendorUser | Vendor admin rows |
| wishlistMapper.js | mapBackendWishlistItem/Wishlist | Wishlist UI |
| adminDeliveryMapper.js | map queue/history/partners | Admin assignment |

---

## 14. Complete Validation Inventory

| Surface | Rules | Enforced Where |
|---------|-------|----------------|
| Login mobile | `[0-9]{10}`, maxLength 10, required | HTML + pattern |
| Login password | required | HTML |
| 2FA OTP | required, maxLength 8 | HTML |
| Register name | required, >=2 chars | validateForm |
| Register email | required, `/\S+@\S+\.\S+/` | validateForm |
| Register phone | 10 digits after strip | validateForm |
| Register password | validatePasswordLength (12 strict / 6 else) | validateForm |
| Register confirm | must match | validateForm |
| Reset password | token present; passwords match | client |
| Forgot identifier | required | HTML |
| Checkout address | deliveryAddress, city, state required | validateForm |
| Checkout pincode | `/^\d{6}$/` | validateForm |
| Checkout phone | required | validateForm |
| Checkout credit/hybrid | available credit / status BLOCKED via useCredit.validateAmount | when those methods selected |
| Payment proof | UTR + screenshot required; jpg/png/pdf | PaymentProofForm |
| Admin product | name, category, price > 0 | Modal form |
| Admin category | name required | Modal form |
| Inventory stock | number >= 0 | Modal |
| Settings password change | match + policy text | SettingsPage |
| Settings profile | required fields | SettingsPage |
| ImageUpload | JPEG/PNG/WebP; <=10MB | ImageUpload |
| SA reject proof | reason required | PaymentVerifications |
| Delivery assignment | partner selected before confirm | Modal |
| Reports export | CSV only | Reports page |

**Note:** Strict password messaging mentions upper/lower/number/symbol but `validatePasswordLength` only checks **length**, not complexity classes.

---

## 15. Layouts Inventory

| Layout | Path | Role | Shell Features | Status |
|--------|------|------|----------------|--------|
| SuperAdminLayout | layouts/SuperAdminLayout.jsx | super-admin | PortalSidebar, notifications, logout confirm, mobile sidebar | Implemented (payment nav broken) |
| AdminLayout | layouts/AdminLayout.jsx | admin | Same; Payment Verifications removed from nav | Implemented |
| VendorLayout | layouts/VendorLayout.jsx | vendor | Cart/wishlist/unread badges; menu includes shop paths | Implemented |
| DeliveryLayout | layouts/DeliveryLayout.jsx | delivery | useDelivery notifications; always-on bell dot | Implemented |
| DashboardLayout | layouts/DashboardLayout.jsx | multi (prop) | Legacy hardcoded nav with `<a href>` | **Dead / unused** |

---

## 16. Complete Responsive Inventory

### 16.1 Breakpoints

| Name | Width |
|------|-------|
| sm | 320px (Tailwind override  -  unusual; many `sm:` utilities fire earlier than typical 640px) |
| md | 768px |
| lg | 1024px |
| xl | 1440px |
| 2xl | 1920px |

`useViewport`: mobile <768, tablet 768-1023, desktop >=1024.

### 16.2 Patterns by Surface

| Area | Mobile Behavior | Desktop Behavior |
|------|-----------------|------------------|
| Public Home | Stacked hero; hide floating cards; single-col sections | Multi-col grids |
| Auth cards | Full-width with padding | max-w-md centered |
| Portal layouts | Hamburger + PortalSidebar drawer; body scroll lock | Collapsible sidebar ml-64/ml-20 |
| Tables | TableResponsive overflow-x; SA DataTable action bottom sheet | Full tables |
| Vendor orders filters | `<select>` | Chip buttons |
| Vendor cart/checkout | Stacked | 1/3 sticky summary |
| SA Dashboard/Orders/Analytics | Dedicated mobile layouts via useViewport | Full desktop |
| SA Orders mobile | Read-only cards limit 20 | AdminOrderManagement workflow |
| Touch targets | min-h/[44px] on many controls | Same |
| Global | overflow-x hidden on html/body/#root |  -  |

### 16.3 Known Responsive Issues

- Tailwind `sm: 320px` makes many `sm:` styles apply on nearly all phones (design may assume classic 640px).
- Dynamic Tailwind classes like `bg-${color}-50` on Delivery Dashboard may not be generated.
- Invalid props (`sm:size`, `smHeight`, `smOuterRadius`) are ignored by React/recharts.

---

## 17. Complete UI/UX Inventory

### 17.1 Design Language

- Enterprise SaaS: slate primary, blue secondary, light gray background.
- Cards with shadow/hover; rounded-lg/xl; blue focus rings on inputs.
- Status pills with color maps per portal.
- Icons: lucide-react (marketing) + react-icons/fi/fa (portals).

### 17.2 Feedback Patterns

| Pattern | Where |
|---------|-------|
| Inline red/green banners | Most pages |
| Fixed toasts (4s) | Vendor products/wishlist/proof; Settings |
| Button loading text | Auth, checkout, forms |
| Full-page loading text/spinner | Lists, ProtectedRoute |
| Empty states with CTA | Cart, wishlist, orders, categories |
| window.confirm / alert | Admin delete; SA approvals; DP edit stub |
| ConfirmDialog | Logout |
| Modals | Admin/SA CRUD and order manage |
| Drawers | Notifications |
| Skeletons | Home sections |

### 17.3 Navigation / Breadcrumbs

- Portal sidebars are primary nav.
- Vendor `PageHeader` supports optional breadcrumbs prop (used sparingly).
- No global breadcrumb system.
- Exact path `isActive` (no nested highlight for `/vendor/products/:id` under Products).

### 17.4 Charts

- Recharts on Admin Analytics, Super Admin Analytics, Delivery Earnings/Performance, Vendor Profile monthly bars (CSS).
- Accessibility of charts is limited (no full a11y layer).

### 17.5 Dialogs / Drawers / Tables / Forms (counts)

| UI Type | Approximate Inventory |
|---------|----------------------|
| Dialogs / Modals | ConfirmDialog; admin Modal; superadmin Modal; multiple page-level modals (product/category/stock/assign/order/reject/2FA) |
| Drawers | 3 NotificationDrawer variants (admin/SA/vendor) + delivery NotificationDrawer |
| Tables | AdminOrderManagement table; Admin products/categories/inventory/vendors; SA DataTable; Vendor invoices; Delivery history; Inventory |
| Forms | Authx4; Checkout; PaymentProof; Admin product/category/stock; Settings multi-tab; Profiles; Delivery complete notes/proof |

---

## 18. Error Handling, Loading & Empty States

### 18.1 Global

| Layer | Behavior |
|-------|----------|
| ErrorBoundary | Render fallback UI with retry/home |
| Axios | Auth redirect / CSRF retry / soft-null 403 analytics & bank-transfer |
| Auth loading | Full-screen spinner in ProtectedRoute |
| Suspense | PageLoader text |

### 18.2 Per-Feature Patterns

- Hooks expose `loading` / `error` / sometimes `actionLoading` / `successMessage`.
- Common message extraction: `error?.response?.data?.message || error?.message || fallback`.
- Empty carts/wishlists/orders show CTA buttons.
- Soft errors: keep showing data with amber/red banner (e.g. categories refresh).

---

## 19. SEO, PWA & Static Assets

| Item | Status |
|------|--------|
| Document title | `Mokshith B2B Platform` in index.html |
| Meta description | Present |
| Canonical | `https://mokshith-entreprises.vercel.app/` |
| robots.txt | Allow all; Sitemap points to vercel sitemap.xml |
| Per-route SEO / react-helmet | **Not implemented** |
| Open Graph / Twitter cards | **Not implemented** |
| PWA / service worker / manifest | **Not implemented** |
| Public assets | google-play-badge.svg, app-store-badge.svg |
| Favicon | /vite.svg |
| Backend preconnect | mokshith-backend.onrender.com |

---

## 20. Testing Surface

| Layer | Location / Scripts |
|-------|-------------------|
| Unit (Vitest) | Co-located `*.test.js(x)` for AuthContext, ProtectedRoute, many hooks/services/utils, Login/Register/Cart |
| E2E (Playwright) | `tests/`; configs: default, smoke, functional, validation, cart-* suites |
| Accessibility | `test:accessibility` -> accessibility.spec.ts + axe-core |
| Coverage | `test:coverage` |

---

## 21. Known Implementation Limitations

### 21.1 Critical / Blocking for Certification

1. **`/super-admin/payment-verifications` is linked in SuperAdminLayout but has no `<Route>` in App.jsx**  -  navigation falls through to Home. Bank proof approval UI is effectively unreachable.
2. **Admin financial analytics intentionally disabled**; Reports/Analytics often show empty/zero financial sections by design.
3. **Checkout UI only exposes COD and Razorpay** while hook supports credit/hybrid/bank_transfer  -  bank-transfer payment page rarely reached from checkout.
4. **NotificationDrawer "Mark All as Read" is a no-op** across portal drawers.

### 21.2 Functional Gaps / Partials

5. Cart quantity editing disabled ("Quantity changes not yet supported").
6. Product Details reviews are hardcoded stubs.
7. Vendor invoices `:id` route param unused.
8. Register success message not displayed on Login.
9. Login/Register do not redirect already-authenticated users.
10. Super Admin Orders mobile is read-only.
11. Delivery Performance rating distribution is synthetic; Dashboard metric deltas hardcoded.
12. Platform Monitoring health tiles are cosmetic.
13. DeliveryPartners Edit shows `alert("...not implemented")`; status action errors may be swallowed.
14. UserManagement Quick Actions modal / card list helpers are dead code; Reset Password disabled.
15. Admin Payment Verifications is a stub page.
16. `uploadService` unused; `DashboardLayout` unused; `delivery/AnalyticsCard` unused.
17. Theme/language preferences in Settings may not apply application-wide.
18. Password policy text claims complexity but client only validates length.
19. Soft 403 swallow on analytics/bank-transfer can hide real authorization failures as empty data.
20. Home/shared Footer inconsistency; copyright year 2024 hardcoded.
21. No PWA; no per-route SEO; no Redux/query cache  -  data can be stale across pages until remount/refetch.
22. Tailwind `sm:320px` breakpoint may diverge from designer expectations.

### 21.3 Security / Session Notes for QA

- Access/refresh tokens in **localStorage** (XSS-sensitive).
- CSRF required on mutations with cookie credentials.
- Multi-tab logout and SESSION_REPLACED handled.
- Concurrent place-order / createOrder guarded by window flags + Idempotency-Key.

---

## 22. Frontend Statistics

Counts measured from `Production/ME/src` on **2026-07-27** (non-test source unless noted).

| Metric | Count |
|--------|------:|
| **Total Pages** (page JSX modules) | **48** |
|  -  Home | 1 |
|  -  Auth | 4 |
|  -  Vendor | 14 |
|  -  Admin | 11 |
|  -  Super Admin | 10 |
|  -  Delivery Partner | 8 |
| **Total Components** (components/**/*.jsx excl. tests) | **60** |
| **Total Hooks** (hooks/* excl. tests) | **22** |
| **Total Contexts** | **1** (`AuthContext`) |
| **Total Layouts** | **5** (4 active + 1 dead) |
| **Total Routes** (path strings registered in App.jsx including redirects & catch-all) | **~55** path entries |
| **Protected Route Trees** | **4** |
| **Public Routes** | **5** |
| **Dialogs / Modal systems** | ConfirmDialog + admin Modal + SA Modal + >=10 page modals |
| **Tables** (major) | >=10 table UIs |
| **Forms** (major page/forms) | >=15 |
| **API Service Modules** | **22** (incl. api.js + 21 domain; barrel omits 2) |
| **Utilities** | **21** |
| **Feature Modules** (documented Section 8) | **16** |
| **Unit test files** | **40** |
| **Total src files** (js/jsx/css) | **225** |
| **Non-test src files** | **185** |
| **Approximate Lines of Code (all src)** | **~24,170** |
| **Approximate LOC (non-test)** | **~21,424** |
| **Approximate LOC (tests)** | **~2,746** |

### Feature Module Roll-Up

1. Public Marketing / Landing  
2. Authentication (Login / Register / Reset / 2FA)  
3. Vendor Catalog Browse & Product Details  
4. Cart & Checkout & Payments  
5. Vendor Orders & Invoices  
6. Wishlist  
7. Vendor Profile & Analytics  
8. Shared Settings / Sessions / 2FA  
9. Admin Catalog & Inventory  
10. Admin / Super Admin Order Management  
11. Delivery Assignment (Admin)  
12. Admin Vendors & Super Admin User Management  
13. Analytics & Reports  
14. Bank Transfer Verification  
15. Delivery Partner Operations  
16. Notifications  

---

## Appendix A  -  Order Status Workflow (Admin UI)

```
PENDING -> CONFIRMED | CANCELLED
CONFIRMED -> PROCESSING | PACKED | CANCELLED
PROCESSING -> PACKED | CANCELLED
PACKED -> READY_TO_DISPATCH | CANCELLED
READY_TO_DISPATCH -> SHIPPED | CANCELLED
SHIPPED -> OUT_FOR_DELIVERY | CANCELLED
OUT_FOR_DELIVERY -> DELIVERED | CANCELLED
DELIVERED -> COMPLETED | RETURNED
COMPLETED -> RETURNED
RETURNED -> REFUNDED
```

## Appendix B  -  Delivery Lifecycle Actions

```
accept -> pick -> start -> delivered -> complete (+ optional proof/notes)
```

Endpoints: `/logistics/${shipmentId}/{accept|pick|start|delivered|complete}`.

## Appendix C  -  Payment Method Mapping (`useCheckout`)

| UI / Hook ID | Backend Enum |
|--------------|--------------|
| cod | COD |
| upi | UPI |
| credit | CREDIT |
| online / hybrid / razorpay | ONLINE |
| card | CARD |
| bank_transfer | BANK_TRANSFER |
| (default) | COD |

Checkout page currently renders only `cod` and `razorpay`.

## Appendix D  -  Tax

Cart/checkout display **Tax (18%)**. Computation in `calculateCartTotals`: `tax = subtotal * 0.18`; `grandTotal = subtotal + tax`. Bulk discount tracked separately from taxable subtotal as implemented.

---

*End of FRONTEND_DOCUMENTATION.md  -  Master Frontend Implementation Reference.*
