# Admin V2 Implementation Specification

## Phase 0 — V1 Deep Audit and Architecture Lock

**Repository:** Mokshith Enterprises production codebase  
**Audit basis:** executable source, route wiring, models, services, frontend consumers, and tests inspected on 2026-09-23.  
**Phase 0 scope:** audit and specification only. No production code, schema, API, test, package, or environment file was changed.

## 1. Executive Summary

The repository is a two-application deployment: `Production/ME` is a Vite/React frontend and `Production/b2b-backend` is an Express/Mongoose backend. They are not a shared-package workspace. The backend mounts the same V1 router at `/api/v1` and `/api`, with a placeholder-only `/api/v2` router (`src/routes/index.js`, `src/routes/v2.routes.js`).

The current Admin portal already has working routes and reusable services for dashboard statistics, catalog/category management, inventory, users/vendors, orders, delivery assignment, analytics, support, and settings. Admin V2 must extend these seams. It must not introduce a second Admin API, order model, inventory model, or delivery system.

The canonical active delivery implementation is `Logistics` (`src/modules/logistics`) rather than `Shipment` (`src/modules/shipment`). The live Admin and Delivery Partner frontend call `/logistics/*`; order creation imports `createShipment` from `logistics.service.js`, and delivery status changes synchronize the Order through `orderStatusSync.js`. `Shipment` remains in the codebase and must not be deleted in Phase 0.

Inventory is currently dual-sourced: `Product.stock` remains on the product document while warehouse-level `Inventory.stock` and `reservedStock` are used by inventory services and order fulfillment. Order stock checks and deductions use `Inventory`; product creation/update paths also provision or synchronize a default-warehouse inventory record. V2 must first define and migrate this invariant before adding supplier- or warehouse-specific stock behavior.

Payment and order state have multiple writers: order creation, payment verification, Razorpay webhook handling, COD collection, order failure/status actions, refund processing, reconciliation jobs, and post-payment workers. Existing idempotency, Redis locks, optimistic inventory updates, and webhook replay protection are valuable extension points, but V2 payment changes require state-transition tests and compensation behavior.

No production distance, geocoding, routing, delivery-offer, distance-pricing, or escalation implementation was found. No dedicated Supplier portal was found; the backend `SUPPLIER` role exists, but current supplier management is Super Admin-only and the frontend role map has no Supplier portal mapping.

### Phase 0 decision summary

| Area | Locked decision |
|---|---|
| Admin UI | Reuse `ProtectedRoute`, `AdminLayout`, `PortalSidebar`, existing pages/services/hooks and mappers. |
| Orders | Extend `order` module and existing `/orders` contracts; preserve status/payment snapshots and compatibility mounts. |
| Delivery | Extend `Logistics`; do not build on `Shipment` or create a parallel delivery model. |
| Rejection | Extend existing atomic `logistics.service.rejectAssignment`; preserve the current unassigned `REJECTED` result. |
| Inventory | Treat warehouse `Inventory` as the fulfillment source in V2, but retain and reconcile `Product.stock` until an explicit migration is completed. |
| Payments | Extend current Payment/Razorpay/webhook/refund paths; do not create a new payment state machine in Phase 0. |
| Notifications | Reuse persisted `Notification`, `sendNotification`, queue, and Socket.IO conventions. |
| Supplier | Reuse Supplier/SupplierProduct/price-history/Super Admin architecture; add a deliberate Supplier authorization and frontend surface only in a later phase. |
| Distance/pricing | New V2 capabilities, not present in V1; introduce only after location data and ownership rules are specified. |

## 2. Repository Structure

### Applications and entry points

| Area | Actual location | Evidence |
|---|---|---|
| Frontend root | `Production/ME` | `package.json`, `index.html`, `src/main.jsx` |
| Frontend source | `Production/ME/src` | `App.jsx`, `pages`, `layouts`, `components`, `services`, `hooks`, `context` |
| Backend root | `Production/b2b-backend` | `package.json`, `server.js`, `src/app.js` |
| Backend source | `Production/b2b-backend/src` | `modules`, `middlewares`, `models`, `services`, `jobs`, `workers`, `queues` |
| Backend tests | `Production/b2b-backend/tests` | unit, integration, infrastructure, smoke |
| Frontend tests | colocated under `Production/ME/src` and `Production/ME/tests` | Vitest and Playwright configs |
| Playwright configs | `Production/ME/playwright*.config.ts` | Admin, orders, payments, logistics, inventory, smoke, functional, authorization, validation suites |
| Jest configs | `Production/b2b-backend/jest.config.cjs`, `jest.infrastructure.cjs` | backend test entry points |
| Database config | `src/config/db.js`, `src/config/env.js`, `src/config/environmentResolver.js` | Mongo/Mongoose startup and environment resolution |
| Redis/queues | `src/config/redis.js`, `src/config/queue.js`, `src/queues`, `src/workers`, `src/services/queueManager.service.js` | BullMQ, locks, reservations, async work |
| Deployment | `Production/docker-compose.yml`, both application Dockerfiles, `Production/ME/nginx.conf` | container and frontend serving configuration |
| Docs/scripts | `docs`, `ProjectDetails`, `code-guide`, `scripts`, `db-backups` | operational/reference artifacts; source wins on conflicts |

There is no root workspace package, no verified root CI workflow, and no verified Rancher manifest in the inspected tree. Frontend/backend package versions and scripts are independent.

### Backend module pattern

The dominant pattern is `route -> middleware/validation -> controller -> service -> repository/model -> responseHandler`. Some cross-cutting flows use services directly (`src/services/payment.service.js`, `src/services/deliveryAssignment.service.js`, `src/services/notification.service.js`).

### Middleware and API mounting

`src/app.js` applies security, CORS, parsing, maintenance, idempotency, and error middleware before `src/routes/index.js`. `src/routes/index.js` mounts:

```text
/api/v1/* -> v1.routes
/api/*    -> v1.routes (compatibility alias)
/api/v2/* -> v2.routes (health/placeholder only)
```

V1 module parents add `authenticate` and CSRF injection; individual routers add `protect`, roles, permissions, validation, ownership, rate limits, and idempotency as appropriate.

## 3. Admin Frontend Architecture

`Production/ME/src/App.jsx` lazy-loads Admin pages beneath:

```text
AuthProvider -> MaintenanceProvider -> BrowserRouter -> ErrorBoundary -> Suspense -> ProtectedRoute(admin) -> AdminLayout -> Outlet -> Admin page
```

`ProtectedRoute.jsx` checks authentication and the frontend role string `admin`; it is a portal-level gate, not a granular permission gate. Backend authorization remains authoritative.

`AdminLayout.jsx` uses `PortalSidebar`, `useMobileSidebar`, `useLogoutConfirm`, `useNotifications`, and `NotificationDrawer`. It provides:

- Dashboard, Categories, Products, Inventory, Vendors, Orders, Delivery Assignment, Reports, Analytics, Support, Settings navigation.
- Desktop collapsible sidebar and mobile hamburger/close behavior.
- Sticky header, notification bell/unread badge, current-user initials, and logout confirmation.
- Nested page rendering through `Outlet`.

The layout is the correct V2 insertion point. New navigation should preserve the existing sidebar/mobile accessibility behavior and should be added only when a corresponding backend contract exists.

`services/api.js` is the common Axios client. It attaches Bearer access tokens, sends cookies, fetches/attaches CSRF tokens for state-changing requests, performs one CSRF retry, queues concurrent refreshes after 401, preserves Idempotency-Key on order create, and redirects to `/login` after session invalidation. V2 services should use this client rather than a second HTTP client.

## 4. Admin Route Inventory

All Admin routes below are nested beneath `/admin/*` in `App.jsx`, wrapped by `ProtectedRoute requiredRole="admin"` and `AdminLayout`.

| Path | Component | Main consumers/evidence | Status |
|---|---|---|---|
| `/admin` | redirect | `App.jsx` | redirects to dashboard |
| `/admin/dashboard` | `pages/Admin/Dashboard.jsx` | `adminService.getStats`, notifications | active |
| `/admin/categories` | `pages/Admin/Categories.jsx` | `categoryService` | active |
| `/admin/products` | `pages/Admin/Products.jsx` | `productService`, upload/pricing helpers | active |
| `/admin/inventory` | `pages/Admin/Inventory.jsx` | `inventoryService` | active |
| `/admin/vendors` | `pages/Admin/Vendors.jsx` | `adminService`, `userService` | active |
| `/admin/orders` | `pages/Admin/Orders.jsx` | `orderService`, status/payment filters | active |
| `/admin/delivery-assignment` | `pages/Admin/DeliveryAssignment.jsx` | `deliveryService`, partner assignment | active |
| `/admin/reports` | `pages/Admin/Reports.jsx` | report/analytics calls and UI | partial |
| `/admin/analytics` | `pages/Admin/Analytics.jsx` | `analyticsService`, delivery analytics | partial |
| `/admin/support` | `pages/Admin/Support.jsx` | `supportService` | active |
| `/admin/settings` | `pages/Admin/Settings.jsx` | `settingsService` | active |

There is no registered `/admin/payment-verifications` route in `App.jsx`; related payment-proof functionality is routed to Super Admin. This is a compatibility fact, not a reason to add a new Admin page in Phase 0.

Relevant Admin component tests include `pages/Admin/Admin.hardening.test.jsx`, `Orders.hardening.test.jsx`, `DeliveryAssignment.hardening.test.jsx`, and `layouts/AdminLayout.supplierNav.test.jsx`. Playwright coverage is configured by `playwright.admin.*.config.ts`, plus order, logistics, inventory, payment, and notification suites.

## 5. Admin Backend/API Architecture

`src/routes/v1.routes.js` mounts `/admin` under `authenticate` and CSRF injection. `src/modules/admin/admin.routes.js` then applies `protect` and `authorize('ADMIN', 'SUPER_ADMIN')`.

Current Admin routes:

| Method/path | Controller/service/model | Request/response behavior |
|---|---|---|
| `GET /admin/users?role=` | `admin.controller.getUsers` -> `admin.service.getAllUsers` -> `User` | Optional role filter; non-deleted users, newest first; success envelope. |
| `POST /admin/b2b-customers` | `createB2BCustomer` -> `admin.service.createB2BCustomer` -> `User` | Hashes password, forces `B2B_CUSTOMER`, active/verified. |
| `GET /admin/approvals` | `getApprovals` -> `getPendingUsers` -> `User` | Pending non-Super-Admin users. |
| `POST /admin/approve/:id` | `approveUser` -> `changeUserStatus` | Writes `ACTIVE`. |
| `POST /admin/reject/:id` | `rejectUser` -> `changeUserStatus` | Writes `REJECTED`. |
| `GET /admin/stats` | `getStats` -> counts `User`/`Order` | Users, admins, orders, vendors, delivery partners, pending approvals; revenue intentionally omitted. |
| `PATCH /admin/users/:id` | `updateUserStatus` -> repository `findByIdAndUpdate` | Validated status body; writes User status. |
| `PATCH /admin/users/:id/credit` | `updateUserCredit` -> `User.findById`/save | Adjusts credit limit and available credit by difference. |

The separate `adminApprovals` and `superAdmin` modules provide additional governance APIs. Their routes should not be duplicated for V2; use the existing module whose authorization matches the operation.

## 6. Order Architecture

### Admin order trace

`pages/Admin/Orders.jsx` -> `services/orderService.getAllOrders` -> `GET /orders` -> `order.routes.get('/')` -> `order.controller.getOrders` -> `order.service.getOrders(req.user, query)` -> `order.repository`/`Order`, with Logistics population where requested. Admin order status writes use `orderService.updateOrderStatus` -> `PATCH /orders/:id/status` -> `order.controller.updateOrderStatus` -> `order.service.updateOrderStatus` -> `applyOrderStatusUpdate`/Order status history.

The same `/orders` endpoints serve customer/vendor and Admin views; role filtering occurs in the service. V2 must preserve this contract and add fields additively.

### Creation and lifecycle actually implemented

`order.service.createOrder`:

1. Checks `idempotencyKey` by `(idempotencyKey,userId)`.
2. Resolves request shipping address or derives one from the user via `vendorAddressToShippingAddress`.
3. Enforces order cutoff, COD, and credit feature settings.
4. Resolves request items or the Cart; bulk-loads Product documents.
5. Validates active status, catalog scope, quantity/MOQ, and calls `inventory.service.checkStock`.
6. Calculates product/bulk line pricing, tax, total weight, and commission; persists item price/discount snapshots.
7. Uses `COD`/`CREDIT` to confirm immediately; online methods start `PENDING_PAYMENT` with `PENDING` payment status.
8. Uses transaction support where configured, `reduceStock`/reservation paths, cart clearing, invoice/shipment/notification/post-order work.

Exact compensation differs by payment method and transaction availability; V2 must not assume all environments have replica-set transaction support.

### State values and writers

Order status values are defined in `src/constants/orderStatus.js`: `CREATED`, `PENDING_PAYMENT`, `PENDING`, `CONFIRMED`, `PROCESSING`, `PACKED`, `READY_TO_DISPATCH`, `SHIPPED`, `ASSIGNED`, `ACCEPTED`, `OUT_FOR_PICKUP`, `PICKED_UP`, `OUT_FOR_DELIVERY`, `DELIVERED`, `COMPLETED`, `CANCELLED`, `RETURNED`, `REFUNDED`, `FAILED`, `DELIVERY_FAILED`, `CUSTOMER_UNAVAILABLE`, `REJECTED`.

Payment status values are `PENDING`, `PAID`, `FAILED`, `REJECTED`, `REFUNDED` (`src/constants/paymentStatus.js`). Delivery status values are in `src/constants/deliveryStatus.js`.

| Writer | Order state impact |
|---|---|
| `order.service.createOrder` | initial order/payment state, stock/reservation, shipment creation. |
| `order.service.updateOrderStatus` and `orderStatusSync.js` | Admin/manual and logistics-driven order state plus history. |
| `payment.service.verifyPayment` | payment success/failure and order confirmation/finalization. |
| `payment.service.handleWebhook` | independently marks Payment success and Order `PAID`/`CONFIRMED`, finalizes reservation, clears cart, queues work. |
| `logistics.service.collectCodPayment` | Order payment status, COD collection fields, history, sockets. |
| `payment.service.createRefund` | refund record, payment `REFUNDED`, order `CANCELLED`, stock restoration for full refund. |
| failure/cleanup/reconcile workers | retries, failed payment/order handling, cleanup or reconciliation. |

This multiplicity is confirmed by `tests/unit/orderStatusSync.test.js`, `tests/integration/payment.webhook.idempotency.test.js`, payment/refund tests, delivery status-sync tests, and worker files. V2 must centralize transition rules or make every writer call the same transition service before adding new statuses.

## 7. Payment Architecture

The active payment module is `src/modules/payment`: routes, controller, service, gateway, model, validation, webhook path, and refund model. Frontend `services/paymentService.js` calls Razorpay create/initiate/verify/fail/hybrid and bank-transfer functions.

Payment flow is:

```text
Checkout -> payment controller/service -> Razorpay gateway + Payment document
         -> browser verification OR signed webhook
         -> Order/payment update -> inventory reservation finalization
         -> cart clear, invoice/post-payment jobs, Socket.IO
```

`payment.service.handleWebhook` uses the raw body/signature path, Redis webhook idempotency (`webhook:processed:*`), a payment lock, amount validation, payment/order updates, inventory reservation finalization and retry queue. `payment.webhook.js` is explicitly marked deprecated; `payment.controller.js` is the actual signature-validating handler. This distinction must remain in V2.

Refunds use `Refund` and Redis idempotency, call the Razorpay refund gateway, restore inventory for full refunds, and mark the order cancelled/refunded. Bank transfer proof uses the payment-proof module and Super Admin approval surfaces. COD is collected through Logistics, not the Razorpay path.

Production secrets/configuration were not inspected or reproduced. V2 must preserve variable names and require a separate live Razorpay certification before payment behavior changes.

## 8. Delivery Architecture

### Canonical active system: Logistics

Evidence of active use:

- `ME/src/services/deliveryService.js` calls `/logistics/my-assignments`, `/delivery-queue`, `/history`, `/analytics`, `/:id/assign`, `/:id/reassign`, `/:id/accept`, `/:id/reject`, `/pick`, `/start`, `/delivered`, `/collect-payment`, `/complete`, and `/location`.
- `pages/Admin/DeliveryAssignment.jsx` consumes the queue and assignment/reassignment actions.
- `order.service.js` imports `createShipment` from `modules/logistics/logistics.service.js`.
- Delivery Partner pages use Logistics endpoints and ownership checks.
- `tests/integration/logistics.rejectAssignment.test.js`, `delivery.assignment.isolation.test.js`, and `delivery.orderStatusSync.test.js` exercise the workflow.

`Logistics` fields include `orderId`, `warehouseId`, `deliveryPartnerId`, status, address text, customer/phone, ETA minutes, current lat/lng, tracking number, estimated/delivered/completed timestamps, proof/notes, last rejected partner, rejection timestamp, and rejection reason. Its status enum is the shared `DELIVERY_STATUS` set.

Assignment methods in `logistics.service.js` validate terminal/in-transit restrictions, validate active partner role/status, use conditional `updateShipmentIf` updates for races, sync the linked Order, notify stakeholders, and emit delivery events.

### Delivery status ownership

Admin/Super Admin can view queues and assign/reassign. A Delivery Partner can act only on its own assignment. `updateStatus` validates transitions, checks the linked order and COD precondition, writes Logistics, syncs Order status, and notifies stakeholders. `collectCodPayment` requires the assigned partner and `OUT_FOR_DELIVERY`, then writes Order payment collection details.

### Logistics vs Shipment

`Shipment` (`src/modules/shipment`) has only `CREATED`, `IN_TRANSIT`, `DELIVERED`, `orderId`, required `warehouseId`, and `trackingNumber`. Its routes are mounted under `/shipments`; creation/status routes are Admin-only and list routes use a Logistics controller. No active Admin or Delivery frontend call to `/shipments` was found. It is therefore legacy/parallel infrastructure, not the canonical V2 base. Do not remove it in Phase 0; first inventory any stored documents and external consumers before a future compatibility migration.

## 9. Logistics vs Shipment Analysis

| Dimension | Logistics | Shipment |
|---|---|---|
| Model | `modules/logistics/logistics.model.js` | `modules/shipment/shipment.model.js` |
| Active frontend consumer | Yes, Admin and Delivery Partner | None found in active portal services |
| State machine | Pending/assigned/accepted/picked/out-for-delivery/delivered/completed/cancelled/failed/rejected | Created/in-transit/delivered |
| Partner ownership | Yes | No partner field |
| Rejection | Atomic partner-specific rejection | None |
| Order synchronization | `orderStatusSync.js` | direct save only |
| Notifications/sockets | Yes | not equivalent |
| V2 strategy | Extend | Leave in place; do not use for new Admin V2 behavior |

The recommendation is evidence-based: active route consumers, service imports, status synchronization, and tests all point to Logistics.

## 10. Delivery Rejection Analysis

Current endpoint: `POST /api/v1/logistics/:id/reject` (also `/api/logistics/:id/reject`) -> `logistics.routes.js` -> `logistics.controller.rejectAssignment` -> `logistics.service.rejectAssignment`.

The route is protected by the V1 parent authentication/CSRF mount and Logistics-specific protection. The service requires a user ID and performs a conditional update requiring all three conditions: shipment ID, `deliveryPartnerId === userId`, and status `ASSIGNED`. It sets status `REJECTED`, records `lastRejectedPartnerId`, `rejectedAt`, and trimmed `rejectionReason`, and unsets `deliveryPartnerId`.

If no row updates, the service distinguishes not-found, non-ASSIGNED status conflict, wrong owner, and concurrent-update conflict. This is atomic at the document update boundary; it is not a multi-document transaction. It writes an audit action when possible, emits `delivery:assignmentRejected` and a delivery status update, and creates persisted notifications for all Admin and Super Admin users. It does not cancel/fail the Order, change Payment, release or deduct Inventory, create an offer, increment a rejection count, or automatically escalate.

After rejection: Admin sees an unassigned/rejected Logistics record and receives a notification; Super Admin receives the same notification; the rejecting partner loses the assignment; the customer order remains valid. The safest V2 extension point is immediately after the successful conditional update and before/alongside current notification emission, preserving the existing result while adding additive attempt/escalation metadata and a new controlled next-assignment action.

## 11. Inventory Architecture

`Product.stock` is a product-level numeric field. `Inventory` has `(productId, warehouseId)` unique records with `stock`, `reservedStock`, `reorderLevel`, and `version` (`inventory.model.js`). `inventory.service.js` creates/syncs a default-warehouse record from Product stock, but fulfillment checks aggregate `Inventory` records and deductions update Inventory atomically with a version predicate.

| Workflow | Current behavior |
|---|---|
| Product create/update | Product service/product events provision or synchronize default-warehouse Inventory. |
| Inventory add/update | Admin inventory APIs write Inventory directly; product stock is not necessarily changed by every inventory mutation. |
| Order create | `checkStock` reads aggregate Inventory; `reduceStock` deducts warehouse records with `$gte` + `version` and retries conflicts. |
| Pending online order | Redis reservation records are created by reservation functions; finalization is invoked after successful payment. |
| Cancellation/payment failure/refund | Restore paths call `restoreStock`; current restore selects the first product inventory record rather than preserving original warehouse allocation. |
| Concurrent orders | Optimistic versioning, conditional stock decrement, retry/backoff, and timeout are present. Availability check and later deduction are still separate phases. |
| API/UI | Admin Inventory uses `/inventory`; Product admin also exposes product stock operations. |

Conclusion: Inventory is the operational fulfillment source, while Product.stock is a legacy/summary/default-warehouse source. They are not proven invariant-synchronized under every mutation. V2 must retain both fields, define one authoritative allocation ledger, add reconciliation/backfill and warehouse-aware restoration, and preserve old product stock APIs until migration is certified. No schema change is made in Phase 0.

## 12. Product/Category Architecture

Product and Category modules use their own model/repository/service/controller/route/validation layers. Product carries price/base price, weight, MOQ/minimum order quantity, bulk pricing, `stock`, active/catalog scope, category and supplier-related fields as implemented by the model. Admin pages use `productService`, `categoryService`, image upload, and bulk-pricing helpers.

Order creation reads Product, snapshots name/price/quantity/discount/final price into OrderItem, validates active/catalog visibility/MOQ, and checks Inventory. Category deletion/update behavior is enforced in the category service and product/category integration tests. Supplier catalog relationships are represented separately by `SupplierProduct` and supplier modules; do not duplicate Product for V2.

Known V2 gaps are warehouse-aware stock selection, explicit supplier provenance in the fulfillment decision, complete promotion application in checkout, and a unified Product.stock/Inventory reconciliation contract. Existing CRUD and catalog visibility APIs should be extended additively.

## 13. Warehouse Architecture

`warehouse.model.js` defines a Warehouse with an address/location object, name, capacity, active state, and supplier/relationship fields as used by the module. `warehouse.service.js`, repository, controller, routes, `inventory.model.js`, Logistics, and warehouse transfer tests are the consumers.

The current default warehouse is created by `inventory.service.getOrCreateDefaultWarehouse()` with address text and Hyderabad/Telangana/India/500001 defaults. No verified `latitude`, `longitude`, geocoded location ID, geospatial index, or distance field exists in the Warehouse model. Logistics has `currentLocation.lat/lng` for a live shipment location, but this is not a warehouse/customer coordinate architecture.

Admin/Super Admin warehouse management is backend/module-driven; no separate Admin V2 location UI is present. Phase 2 may add nullable validated coordinates and a provider-independent location boundary only after migration/backfill and authorization decisions. Do not add fields now.

## 14. Supplier Architecture

Existing backend entities are `Supplier`, `SupplierCategory`, `SupplierProduct`, and `SupplierProductPriceHistory` under `src/modules/supplier`; Super Admin routes/services/controllers expose supplier CRUD, supplier categories/products, price history/comparison, status, and procurement-related flows. Integration tests include supplier, supplier category, supplier product, catalog, comparison, and price tests.

`SUPPLIER` exists in `constants/roles.js`, but current route protection and frontend navigation do not provide a Supplier portal. Supplier permissions are not a usable end-user policy, and the frontend role map does not map Supplier to a layout/dashboard. Super Admin supplier pages are not evidence of Supplier self-service.

V2 strategy: reuse supplier models and Super Admin management; define object-level supplier ownership and explicit API permissions before adding a Supplier dashboard. Preserve Super Admin APIs and do not expose them by simply adding a frontend route.

## 15. Promotion/Discount Architecture

The Promotion module has model, repository, service, controller, routes, and validation. Admin CRUD/toggle endpoints and an apply endpoint exist. Product bulk pricing is separately implemented through `bulkPricing.utils.js` and pricing APIs. Order creation calls `calculateLinePricing` for Product bulk pricing and stores line discount snapshots.

The inspected order creation path does not establish Promotion as the authoritative final checkout discount engine. Promotion CRUD/apply exists, but integration with cart/checkout/order payable totals, usage limits, customer eligibility, and persisted promotion snapshots is incomplete/partial. Therefore the authoritative current calculation for implemented discounts is backend order pricing plus product bulk pricing; frontend display is not trusted. V2 Phase 4 must define one server-side calculation and snapshot contract, not add a parallel coupon engine.

## 16. Notification Architecture

`Notification` stores `userId`, title, message, type (`ORDER`, `PAYMENT`, `SYSTEM`), `isRead`, and timestamps. `notification.service.sendNotification` persists first through the repository, then best-effort enqueues a BullMQ notification job. `notification.routes/controller` provide authenticated list/read/read-all operations. Socket.IO events are emitted directly by payment/logistics/order flows; frontend hooks and Admin/Delivery drawers consume notifications and/or socket status updates.

Current recipients include the order owner, delivery partner, Admin, and Super Admin depending on workflow. Email/background delivery is queue/job controlled and not guaranteed by the persisted-row path. V2 delivery offers/rejection/escalation should reuse `sendNotification`, existing recipient lookup, notification queue, and Socket.IO event naming conventions. Additive notification types/indexing and event contracts require tests; do not create a second notification store.

## 17. Authentication/RBAC Architecture

Backend roles are `SUPER_ADMIN`, `ADMIN`, `VENDOR`, `B2B_CUSTOMER`, `B2C_CUSTOMER`, `DELIVERY_PARTNER`, and `SUPPLIER` (`constants/roles.js`). Auth uses JWT access/refresh tokens, RefreshToken records, cookies/local storage on the frontend, CSRF for mutations, `protect`/`authenticate`, `authorize`, and permission middleware. Frontend maps backend roles into `super-admin`, `admin`, `vendor`, and `delivery` portal strings.

Admin routes allow `ADMIN` and `SUPER_ADMIN`; order status changes are Admin/Super Admin; Logistics ownership checks Delivery Partner assignment; inventory/product/category routes apply role/ownership policies in module routers. Object-level protection is strongest for Delivery Partner assignment and vendor-owned data, but Supplier self-service is absent and several Admin pages rely on role-only gates.

Security gaps relevant to V2: Supplier role/portal mismatch, frontend localStorage token exposure, role/permission duplication between frontend/backend, and selected frontend 403 neutralization in `api.js`. These are documented, not fixed in Phase 0. V2 must add explicit backend object-level checks before any Supplier or offer endpoint and add direct API authorization tests.

## 18. Database Relationship Map

```text
User
 ├─ owns Orders (Order.userId)
 ├─ may be Admin/Super Admin/Vendor/Delivery Partner/Supplier
 ├─ owns Notifications, Cart, Wishlist, RefreshTokens, settings/credit records
 └─ may be referenced by Logistics.deliveryPartnerId and rejection audit fields
Order
 ├─ has OrderItems -> Product
 ├─ references User, Payment/Refund, Invoice, Logistics through shipmentId/orderId
 ├─ stores address and pricing/payment/status snapshots
 └─ drives Inventory, notifications, invoices and analytics
Product
 ├─ references Category and supplier/catalog data where configured
 ├─ retains Product.stock
 └─ has Inventory records by Warehouse (unique productId+warehouseId)
Warehouse
 ├─ contains location/address/capacity/active data
 ├─ owns Inventory records
 └─ is referenced by Logistics and legacy Shipment
Supplier
 ├─ owns SupplierCategory/SupplierProduct/price-history records
 └─ is managed by Super Admin/procurement flows
Promotion -> product/category targeting and discount rules
Notification -> User
```

Important constraints/indexes found: Product/Inventory/Warehouse/Order/Logistics foreign-key-like ObjectId references; Inventory unique `(productId, warehouseId)`; Logistics partner/status index; indexed Order/Shipment links; unique tracking numbers; status indexes on Shipment. Query patterns require indexes for Admin order filters, Logistics status/partner/rejection queue, Notification `(userId,isRead,createdAt)`, Promotion active/date targeting, and Inventory product/warehouse scans. These are recommendations only; no indexes were added.

## 19. Transaction/Concurrency Analysis

| Workflow | Existing protection | Remaining V2 concern |
|---|---|---|
| Order create | Idempotency key, optional Mongo transaction, inventory retries, browser in-flight guard | availability check vs deduction, non-transaction environments, multi-item compensation |
| Inventory deduction | conditional `$gte` + version, retry/backoff, timeout | reservation and warehouse allocation are not a single durable ledger |
| Delivery assignment | conditional update, transition guards, ownership checks | workload selection and assignment history are not one transaction; offer/reject races need revision identity |
| Delivery rejection | conditional `_id + partner + ASSIGNED` update | notifications/audit occur after state write and are best effort; no escalation counter |
| Payment verify/webhook | Redis locks, webhook idempotency, signature/amount checks | independent writers can converge in different order; state transition contract needs centralization |
| COD collection | partner/status/COD checks, then Order save | no cross-document transaction with Logistics state; retry/idempotency contract should be explicit |
| Refund | Redis idempotency, Refund model, gateway call | inventory restoration may fail after financial success; original warehouse allocation is not retained |
| Queues/jobs | BullMQ/Redis gates, post-payment retries, reconciliation | operational availability and duplicate execution require contract tests |

V2 delivery offers, assignment, and pricing must use conditional updates/version fields or an equivalent existing atomic pattern. Do not use read-then-unconditional-save for competitive acceptance/rejection.

## 20. Testing Architecture

Backend coverage includes unit tests for auth, product, order status sync, payment filters, supplier services, validation/security utilities; integration tests for order, payment/webhook/refund, inventory/reservation/concurrency, delivery/logistics, notification worker, warehouse transfer, supplier, category/product, authentication, and infrastructure; smoke and load/capacity scripts also exist.

Frontend coverage includes colocated Vitest tests for services/hooks/layouts/pages and Playwright suites configured for authentication, Admin, orders, payments, inventory, logistics, notifications, wishlist, smoke, functional, authorization, and validation.

Coverage is strong for V1 happy paths, auth, payment idempotency, inventory concurrency, delivery isolation/rejection, and supplier Super Admin operations. Coverage is partial/absent for: Admin V2 offer lifecycle, distance provider/invalid coordinates, promotion-to-checkout final totals, Supplier direct authorization, cross-writer payment/order invariants, rejected-assignment escalation, offer expiry, and warehouse-preserving refund restoration.

Required V2 tests include:

- API contract and backward-compatibility tests for `/api/v1` and `/api` aliases.
- Admin role/permission and object-level tests for assignment, inventory, product, supplier, and payment operations.
- Location validation/provider failure/fallback tests.
- Offer amount, revision, expiry, acceptance/rejection, reassignment, and concurrent race tests.
- Inventory authority/reconciliation, reservation, cancellation/refund, and multi-warehouse tests.
- Payment verify/webhook/retry/order-state synchronization tests.
- Frontend Admin route, mobile layout, notification, filter, and optimistic-refresh tests.

## 21. Environment/Deployment Dependencies

Only variable names/configuration requirements are documented here; secrets are not exposed. Relevant names found in `.env.example`, `.env.production`, config, and deployment files include:

| Dependency | Variables/configuration |
|---|---|
| MongoDB | `MONGODB_URI`/database URL variants, environment resolver/database config |
| Redis | `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD`, `REDIS_DB`, `REDIS_URL`, `USE_SOCKET_REDIS_ADAPTER` |
| Auth | `JWT_SECRET`, `JWT_REFRESH_SECRET`, expiry settings, `AUTH_STRICT_MODE` |
| Payment | `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`, payment feature flags |
| Frontend API | `VITE_API_BASE_URL`, optional runtime `window.__BACKEND_URL__`, `VITE_RAZORPAY_KEY_ID` |
| Queues/jobs | `ENABLE_QUEUE`, `ENABLE_WORKERS`, `ENABLE_CRON` |
| Storage | `CLOUDINARY_*`, `USE_S3_STORAGE`, `S3_*`, upload paths |
| Email | `SMTP_*`, `EMAIL_FROM` |
| Observability | `SENTRY_DSN`, `LOG_LEVEL`, `ENABLE_FILE_LOGGING`, `MONITORING_ALERT_WEBHOOK`, `METRICS_TOKEN` |
| Feature/security | `ENABLE_MAINTENANCE_MODE`, `ENABLE_ANALYTICS`, `ENABLE_AUDIT_LOGS`, registration/CORS/rate-limit settings |

No maps/geocoding variable or provider configuration was found. Phase 2 must introduce such configuration only with a documented provider, timeout, cost, privacy, and fallback contract.

## 22. Existing Reusable Components

Reuse (do not rebuild):

- Frontend: `AdminLayout`, `PortalSidebar`, `ProtectedRoute`, `useMobileSidebar`, `useNotifications`, `services/api.js`, Admin cards/tables/status badges/modals, order and delivery mappers, existing filters and page headers.
- Orders: `modules/order` routes/controller/service/repository/model, `orderStatusSync.js`, idempotency middleware, invoice service, existing status/history fields.
- Delivery: `modules/logistics` model/repository/service/controller/routes, `deliveryAssignment.service.js` where applicable, conditional assignment/rejection updates, ownership checks, notifications, Socket.IO events, current Logistics tests.
- Inventory: `modules/inventory` model/repository/service, optimistic version updates, Redis reservation helpers, existing concurrency tests.
- Payments: `modules/payment`, Razorpay gateway/signature/webhook path, Payment/Refund models, Redis locks/idempotency, queue/reconcile workers.
- Catalog/suppliers: Product/Category/Supplier/SupplierProduct/price-history modules and existing Super Admin interfaces.
- Cross-cutting: `responseHandler`, validation middleware, auth/role/permission middleware, audit service, Redis/BullMQ, queue workers.

## 23. V2 Gaps

Confirmed missing or incomplete capabilities:

1. No production distance calculation, geocoding, routing, geospatial query, or map provider.
2. No distance-based delivery pricing or partner offer amount model.
3. No offer expiry, revision, rejection counter, escalation, or competitive assignment history.
4. Promotion apply/CRUD exists, but final checkout/order integration is incomplete.
5. Product.stock and Inventory.stock lack a proven all-path synchronization invariant.
6. Supplier role exists without a usable self-service authorization/frontend portal.
7. Legacy Shipment remains alongside active Logistics and has no migration/usage contract.
8. Payment/order state has multiple writers and requires a unified transition/compensation contract before expansion.
9. Notification persistence and sockets exist, but delivery-event taxonomy and external delivery guarantees are partial.
10. Warehouse/customer coordinates and address validation/geocoding are absent.
11. Reports/analytics and some Admin surfaces are partial; no redesign is authorized in Phase 0.

## 24. Recommended V2 Architecture

### Decision A — Extend Logistics as delivery aggregate

**Current:** `Logistics` drives active assignment/status/rejection and syncs Order.  
**Problem:** no offer history, distance, price, expiry, escalation, or attempt count.  
**Required V2:** additive delivery-attempt/offer metadata with conditional revision updates and preserved old status endpoints.  
**Extension point:** `logistics.model.js`, `logistics.service.js`, repository conditional-update helpers, existing Admin/Delivery services/pages.  
**Migration/backward compatibility:** keep existing fields/statuses and `/logistics/*`; do not delete Shipment until stored-data usage is verified.  
**Testing:** offer/reject/reassign race, expiry, old payload compatibility, notification/socket contracts.

### Decision B — Add location capability after data contract

**Current:** address strings and `currentLocation.lat/lng` only.  
**Problem:** warehouse and customer-origin distance cannot be calculated reliably.  
**Required V2:** validated nullable coordinates/location metadata, provider adapter, timeout/fallback/error policy.  
**Extension point:** Warehouse and order address snapshots plus a new narrowly scoped location/distance service only after requirements are locked.  
**Migration:** backfill is separate from schema rollout; do not block existing deliveries that lack coordinates.  
**Testing:** invalid/missing coordinates, provider failure, deterministic rounding and privacy.

### Decision C — Make Inventory allocation authoritative for fulfillment

**Current:** order fulfillment reads/deducts Inventory, while Product.stock remains and is synchronized only on selected paths.  
**Problem:** dual source and first-warehouse restore can misstate stock.  
**Required V2:** explicit allocation ledger/warehouse selection and reconciliation; preserve Product.stock as compatibility summary until migrated.  
**Extension point:** inventory service and order/payment/refund compensation paths.  
**Testing:** concurrent multi-item orders, reservation expiry, cancellation/refund, reconciliation.

### Decision D — Centralize state transitions without breaking APIs

**Current:** order/payment/logistics/COD/webhook/refund flows write overlapping state.  
**Problem:** order/payment divergence and duplicated side effects.  
**Required V2:** shared transition validation/idempotency/outbox-or-retry policy used by current writers; additive fields/events.  
**Extension point:** existing `orderStatusSync.js`, payment service, webhook, logistics service, workers.  
**Testing:** verify-vs-webhook race, retry, refund, COD, delivery status synchronization.

### Decision E — Complete Promotion integration server-side

**Current:** Promotion CRUD/apply and product bulk pricing exist; order path calculates line/bulk pricing but does not prove promotion finalization.  
**Required V2:** one authoritative server calculation with order snapshots, usage/eligibility/limits and backward-compatible totals.  
**Extension point:** Promotion service + order pricing path; no second discount engine.  
**Testing:** cart/checkout/order parity, limits, dates, refunds/cancellations.

### Decision F — Add Supplier surface only with explicit authorization

**Current:** supplier data and Super Admin management exist; no Supplier portal.  
**Required V2:** backend supplier ownership/permissions, frontend role mapping/layout, tests.  
**Compatibility:** preserve Super Admin supplier endpoints and deny unscoped access by default.

## 25. Admin V2 Dependency Map

```text
Supplier authorization/data
        ↓
Product/category + warehouse inventory authority
        ↓
Customer address snapshot + warehouse location
        ↓
Distance provider/calculation
        ↓
Delivery pricing rules
        ↓
Logistics offer/attempt metadata
        ↓
Admin assignment ↔ Partner accept/reject
        ↓
Reassignment/escalation
        ↓
Logistics delivery status ↔ Order status/payment
        ↓
Inventory finalization/refund/invoice
        ↓
Notifications, sockets, analytics
```

| Node | V1 state | V2 action |
|---|---|---|
| Customer/order | existing | extend snapshots/contracts only |
| Payment | existing/complex | harden transition synchronization |
| Inventory | partial dual source | define authority and reconcile |
| Warehouse | existing text location | add location contract in Phase 2 |
| Distance | missing | implement Phase 2 |
| Delivery pricing | missing | implement Phase 2 |
| Offer/assignment | assignment exists; offer missing | extend Logistics in Phase 3 |
| Accept/reject | exists | preserve and extend atomically |
| Escalation | missing | Phase 3 after rejection/offer metadata |
| Invoice | existing | align timing/policy in Phase 4/5 |
| Notifications | existing/partial | add V2 event types and tests |
| Analytics | existing/partial | add delivery/offer metrics after events are authoritative |

## 26. Phase 1–5 Implementation Map

### Phase 1 — Orders + Products + Categories + Inventory

Prerequisites: this architecture lock; preserve current routes/statuses; define Product.stock versus Inventory authority. Reuse current order/product/category/inventory modules, Admin pages, services, validations, and concurrency tests. Likely changes: order pricing/transition seams, Product/Category validation, Inventory allocation/reconciliation, Admin Orders/Products/Categories/Inventory. Tests: API compatibility, inventory concurrency/reservation/cancel/refund, order idempotency, product/category CRUD. Risk: changing totals or stock semantics; use additive fields and migration/backfill.

### Phase 2 — Warehouse + Location + Distance + Delivery Pricing

Prerequisites: Phase 1 stock/warehouse allocation decision; address snapshot policy; provider and fallback contract. Reuse Warehouse, Order address, Logistics warehouse references, existing Admin delivery UI. Likely changes: Warehouse/location schema, validation, distance/pricing service, logistics read model. Tests: coordinate validation, provider failure, deterministic pricing, missing-coordinate fallback, authorization. Risk: secret/cost/privacy, inconsistent historical addresses, no-coordinate orders.

### Phase 3 — Delivery Offers + Assignment + Accept/Reject + Escalation

Prerequisites: canonical Logistics lock, Phase 2 distance/pricing, atomic revision strategy. Reuse Logistics routes/service/model, existing assignment/rejection, notifications, sockets, Admin and Delivery pages. Likely changes: additive offer/attempt/revision fields, assignment history/escalation jobs, Admin/partner APIs and UI. Tests: concurrent accept/reject/reassign, expiry, reassignment, duplicate notifications, legacy endpoint behavior. Risk: race conditions and state/order synchronization.

### Phase 4 — Discounts + Payments + Notifications + Analytics

Prerequisites: authoritative order totals and transition contract. Reuse Promotion, payment/webhook/refund/COD, notification/queue/socket, analytics modules. Likely changes: server-side promotion snapshots, payment transition/reconciliation, event taxonomy, offer/delivery analytics. Tests: promotion parity, webhook/verify races, refund compensation, notification persistence, metric correctness. Risk: financial regressions; require test and staged rollout gates.

### Phase 5 — UI Finalization + Security + Full Testing

Prerequisites: all backend contracts and migrations stable. Reuse AdminLayout/portal primitives, existing Playwright configs, auth/RBAC middleware and tests. Likely changes: responsive polish, permission visibility, Supplier surface if approved, full contract/e2e/security tests. Tests: all Jest/Vitest/Playwright suites, direct unauthorized API calls, accessibility, smoke, deployment checks. Risk: UI masking backend authorization; keep backend authoritative.

## 27. V1 Compatibility Contract

The following must continue working unless a separately approved migration explicitly changes the contract:

- Frontend paths `/admin/dashboard`, `/categories`, `/products`, `/inventory`, `/vendors`, `/orders`, `/delivery-assignment`, `/reports`, `/analytics`, `/support`, `/settings` under `/admin/*`, plus Super Admin, Vendor, and Delivery Partner routes used by shared workflows.
- Backend `/api/v1/*` and compatibility `/api/*` mounts, including `/auth/*`, `/products`, `/categories`, `/cart`, `/orders`, `/payments`, `/invoices`, `/inventory`, `/logistics`, `/notifications`, `/admin`, and existing Super Admin/supplier routes.
- User roles and backend status strings in `roles.js`, `orderStatus.js`, `paymentStatus.js`, and `deliveryStatus.js`.
- Product.stock, Inventory.stock/reservedStock/version, Order address/item/payment/status/history fields, Logistics assignment/rejection fields, Payment/Refund records, and Notification read state.
- CSRF, refresh-token, idempotency, response envelopes, invoice blob behavior, sockets used by existing hooks, Docker/build/start scripts, and health endpoints.
- Existing unit, integration, infrastructure, smoke, Vitest, and Playwright tests must remain passing. No current test is to be rewritten during Phase 0.

## 28. Risk Register

| Risk | Evidence | Impact | Likelihood | Mitigation |
|---|---|---|---|---|
| Product.stock vs Inventory.stock | Product model/service plus Inventory sync and order Inventory reads | incorrect availability/reporting | High | define Inventory authority; reconcile and preserve compatibility field |
| Logistics vs Shipment | active `/logistics` workflow versus separate `/shipments` model/routes | divergent delivery state | High | extend Logistics; inventory Shipment usage before migration |
| Multiple payment state writers | verify, webhook, COD, refund, workers/reconcile | paid order not fulfilled or double side effects | High | shared transitions, locks/idempotency, race tests |
| Incomplete Promotion integration | Promotion apply exists; order pricing uses bulk pricing path | wrong payable/order snapshots | Medium | server-side final calculation and parity tests |
| Missing distance architecture | no provider/coordinates/geospatial code found | impossible to price/offer reliably | Certain | Phase 2 location/provider contract |
| Supplier role/portal gap | SUPPLIER constant but no frontend mapping/self-service API policy | unauthorized or unusable supplier surface | High | explicit permission and object ownership tests |
| Assignment concurrency | conditional assignment/rejection exists, workload selection is separate | double assignment or stale offer | Medium/High | revisioned atomic transitions and race tests |
| Payment/order synchronization | independent Order and Payment writes | inconsistent admin state | High | central transition/reconciliation |
| Notification consistency | persistence first, queue/socket best effort | missed real-time/event delivery | Medium | persisted source of truth, idempotent event handling |
| Backward compatibility | `/api` alias and shared frontend service contracts | V1 clients break | High | additive changes, contract tests, deprecation plan |
| Database migration | existing records may use legacy Shipment/Product stock/no coordinates | partial rollout/data loss | Medium | inventory/backfill/dual-read plan, no deletion before evidence |

## 29. Architecture Decision Table

| Area | Current implementation | V2 strategy | Evidence | Phase |
|---|---|---|---|---|
| Orders | Order module with shared Admin/customer endpoints and status sync | extend existing service/contracts | `modules/order/*`, Admin Orders | 1 |
| Payments | Razorpay Payment + verify/webhook/refund/COD writers | centralize transitions; preserve gateway/routes | `modules/payment/*`, Logistics COD | 4 |
| Inventory | Product.stock plus warehouse Inventory/reservations | Inventory fulfillment authority + reconciliation | `modules/inventory/*`, Product service | 1 |
| Products | Product CRUD/catalog/bulk pricing | extend fields/validation, no second model | `modules/product/*` | 1 |
| Categories | Category CRUD/catalog | extend existing module | `modules/category/*` | 1 |
| Warehouse | text address/capacity/active, no coordinates | additive location contract | `modules/warehouse/*` | 2 |
| Distance | no production implementation found | new bounded provider capability | repository-wide search | 2 |
| Delivery | Logistics active; Shipment parallel/legacy | extend Logistics only | `modules/logistics/*`, frontend deliveryService | 3 |
| Delivery Rejection | atomic assigned-partner rejection -> REJECTED/unassigned | extend after successful update; preserve semantics | `logistics.service.rejectAssignment` | 3 |
| Delivery Pricing | no proper implementation found | new server-side rule/service after distance | no pricing implementation | 2 |
| Promotions | CRUD/apply and bulk pricing, incomplete checkout integration | integrate one server-side calculation | `modules/promotion/*`, `bulkPricing.utils.js` | 4 |
| Notifications | persisted Notification + queue + sockets | extend event types/recipients | `notification.service.js`, model, queues | 4 |
| Supplier | Super Admin supplier catalog/procurement; no portal | reuse data; add explicit supplier surface later | `modules/supplier/*`, `superAdmin/*` | 5 |
| Authentication | JWT/refresh/CSRF/custom Axios session | preserve and extend role mapping carefully | auth modules, `api.js`, `AuthContext` | 5 |
| RBAC | role + permissions + ownership checks; Supplier incomplete | add object-level policies/tests before new surfaces | middleware/routes/tests | 5 |

## 30. Phase 0 Completion Checklist

- [x] Repository structure inspected from source tree.
- [x] Admin routes/layout/pages/services and relevant tests identified.
- [x] Admin order, payment, inventory, warehouse, supplier, promotion, notification, auth, and delivery dependencies traced.
- [x] Active Logistics versus legacy/parallel Shipment distinguished using consumers, imports, routes, and tests.
- [x] Delivery rejection endpoint, authorization, atomic update, notifications, sockets, and post-rejection behavior documented.
- [x] Product.stock versus Inventory.stock/reservedStock and concurrency behavior documented.
- [x] Warehouse/customer address and absence of coordinate/geocoding architecture documented.
- [x] Distance and delivery pricing non-findings recorded.
- [x] API architecture, relationships, transactions/concurrency, tests, environment variables, phases, risks, compatibility, and decision table included.
- [x] Existing systems explicitly marked for reuse/extension/leave unchanged; no unsupported replacement is recommended.
- [x] No V2 feature implementation, schema migration, API change, frontend change, test change, or package change performed.
- [x] Only this specification was created during the audit; pre-existing untracked `V1_CODEBASE_BASELINE_FOR_V2.md` was left untouched.

### Evidence and verification limits

This specification is grounded in the inspected source files and tests listed above. Live production databases, external CI/CD configuration, actual secrets, deployed queue topology, live Razorpay credentials/webhooks, and third-party map infrastructure were not accessed. Those items are explicitly unverified and must not be treated as implemented architecture.
