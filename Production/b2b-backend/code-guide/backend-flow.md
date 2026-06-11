# Backend Request-Response Flow

> **Detailed explanation of how requests flow through the backend system**

---

## Table of Contents

- [Complete Request Lifecycle](#complete-request-lifecycle)
- [HTTP Request Flow](#http-request-flow)
- [Authentication Flow](#authentication-flow)
- [Authorization Flow](#authorization-flow)
- [Data Access Flow](#data-access-flow)
- [Error Handling Flow](#error-handling-flow)
- [Async Job Flow](#async-job-flow)
- [Example Flows](#example-flows)

---

## Complete Request Lifecycle

### High-Level Overview

```
Client → Server → Middleware Chain → Route Handler → Controller
                                                          ↓
                                                       Service
                                                          ↓
                                                      Repository
                                                          ↓
                                                       Database
                                                          ↓
Response ← Server ← Middleware Chain ← Controller ← Service ← Repository
```

---

## HTTP Request Flow

### Step-by-Step Breakdown

```
1. CLIENT SENDS REQUEST
   GET https://api.example.com/api/v1/products?category=electronics
   Headers:
     Authorization: Bearer eyJhbGc...
     Content-Type: application/json

2. REQUEST HITS EXPRESS SERVER
   server.js → app.js

3. MORGAN LOGGING MIDDLEWARE
   → Logs: "GET /api/v1/products 200 45ms"

4. HELMET MIDDLEWARE
   → Adds security headers (X-Frame-Options, etc.)

5. CORS MIDDLEWARE
   → Validates origin
   → Adds CORS headers (Access-Control-Allow-Origin, etc.)

6. COMPRESSION MIDDLEWARE
   → Prepares to compress response

7. JSON BODY PARSER
   → Parses JSON request body (if applicable)

8. RATE LIMITER MIDDLEWARE
   → Checks Redis: "rate_limit:127.0.0.1" → 15 requests in 15 minutes
   → If exceeded → Return 429 Too Many Requests
   → If OK → Increment counter → Continue

9. ROUTE MATCHING
   → Express router matches: /api/v1/products
   → Loads route handler from src/routes/v1.routes.js

10. AUTH MIDDLEWARE (protect)
    → Extracts JWT from Authorization header
    → Verifies token signature
    → Decodes payload: { id: "user123", role: "CUSTOMER" }
    → Fetches user from MongoDB
    → Attaches user to req.user
    → Continues

11. AUTHORIZATION MIDDLEWARE (authorize)
    → Checks if req.user.role matches allowed roles
    → If not authorized → Return 403 Forbidden
    → If authorized → Continue

12. VALIDATION MIDDLEWARE
    → Validates query parameters against Joi schema
    → If invalid → Return 400 Bad Request with errors
    → If valid → Continue

13. CACHE MIDDLEWARE (optional)
    → Checks Redis cache: "cache:products:electronics"
    → If cache hit → Return cached response immediately
    → If cache miss → Continue

14. CONTROLLER HANDLER
    → productController.getProducts()
    → Extracts query params: { category: "electronics" }
    → Calls service layer

15. SERVICE LAYER
    → productService.getProducts(filters)
    → Applies business logic
    → Calls repository layer

16. REPOSITORY LAYER
    → productRepository.findAll(filters)
    → Builds MongoDB query
    → Executes query with pagination

17. DATABASE QUERY
    → MongoDB executes query with indexes
    → Returns documents

18. DATA TRANSFORMATION
    → Repository transforms MongoDB docs to plain objects
    → Service applies additional business logic
    → Controller formats response

19. CACHE STORAGE (if cache miss)
    → Store result in Redis: "cache:products:electronics"
    → Set TTL: 300 seconds (5 minutes)

20. RESPONSE SENT
    → Controller returns:
       {
         "success": true,
         "data": [...products],
         "pagination": { "page": 1, "limit": 20, "total": 150 }
       }
    → Express sends response
    → Compression middleware compresses
    → Response sent to client

21. POST-RESPONSE LOGGING
    → Winston logs successful request
    → Audit middleware logs user action (if applicable)

22. CLIENT RECEIVES RESPONSE
    → Status: 200 OK
    → Body: JSON with products
```

---

## Authentication Flow

### JWT Token Verification

**File:** `src/middlewares/auth.middleware.js`

```
1. EXTRACT TOKEN
   → Read Authorization header: "Bearer <token>"
   → Split and extract token

2. TOKEN VALIDATION
   → Check if token exists
   → If missing → Return 401 Unauthorized

3. VERIFY SIGNATURE
   → jwt.verify(token, process.env.JWT_SECRET)
   → If signature invalid → Return 401 Unauthorized
   → If expired → Return 401 Token Expired

4. DECODE PAYLOAD
   → Extract: { id: "userId", role: "CUSTOMER", iat: timestamp }

5. USER LOOKUP
   → Query MongoDB: User.findById(decoded.id)
   → If user not found → Return 401 User no longer exists

6. USER STATUS CHECK
   → Check user.status === "ACTIVE"
   → If SUSPENDED/INACTIVE → Return 403 Account suspended

7. MAINTENANCE MODE CHECK
   → If system in maintenance mode
   → Allow SuperAdmin only
   → Block others → Return 503 Service Unavailable

8. ATTACH USER TO REQUEST
   → req.user = user
   → Continue to next middleware

SUCCESS → Request proceeds to authorization layer
FAILURE → Error response sent immediately
```

---

## Authorization Flow

### Role-Based Access Control (RBAC)

**File:** `src/middlewares/role.middleware.js`

```
1. AUTHORIZATION MIDDLEWARE INVOKED
   → authorize('ADMIN', 'VENDOR')

2. CHECK USER ROLE
   → Get req.user.role from auth middleware
   → Check if role in allowed roles

3. ROLE HIERARCHY
   SuperAdmin → Can access everything
   Admin → Can access admin + lower
   Vendor → Can access vendor + customer
   Customer → Basic access

4. PERMISSION CHECK (if fine-grained)
   → Get req.user.permissions array
   → Check if required permission exists
   → Example: "order:update", "product:delete"

5. RESOURCE OWNERSHIP (if applicable)
   → Check if user owns the resource
   → Example: User can only update their own profile
   → Compare req.user.id with resource.userId

6. DECISION
   → If authorized → Continue
   → If not authorized → Return 403 Forbidden

SUCCESS → Request proceeds to controller
FAILURE → 403 Forbidden response
```

---

## Data Access Flow

### Repository Pattern

```
1. CONTROLLER RECEIVES REQUEST
   → Validates input (already done by validation middleware)

2. CONTROLLER CALLS SERVICE
   → orderController.getOrders(req, res)
   → orderService.getOrders(userId, filters)

3. SERVICE BUSINESS LOGIC
   → Apply business rules
   → Example: B2B customers see bulk pricing
   → Determine what data to fetch

4. SERVICE CALLS REPOSITORY
   → orderRepository.findByUser(userId, filters)

5. REPOSITORY BUILDS QUERY
   → Construct MongoDB query object
   → Apply filters, sorting, pagination
   → Example:
     {
       userId: "user123",
       status: { $in: ["PAID", "SHIPPED"] },
       createdAt: { $gte: startDate }
     }

6. DATABASE QUERY EXECUTION
   → Mongoose executes query
   → MongoDB uses indexes
   → Returns raw documents

7. DATA TRANSFORMATION
   → Repository converts Mongoose docs to plain JS objects
   → Remove sensitive fields (passwords, internal IDs)
   → Format dates, numbers

8. RETURN TO SERVICE
   → Service receives clean data
   → Applies additional transformations if needed
   → Example: Calculate totals, add computed fields

9. RETURN TO CONTROLLER
   → Controller formats API response
   → Add metadata (pagination, timestamps)
   → Wrap in standard response format

10. SEND RESPONSE
    → res.json({ success: true, data: orders })
```

---

## Error Handling Flow

### Centralized Error Handler

**File:** `src/middlewares/errorHandler.middleware.js`

```
1. ERROR OCCURS ANYWHERE IN CODE
   → throw new AppError("Resource not found", 404)

2. EXPRESS CATCHES ERROR
   → next(error) called
   → Error propagates to error handling middleware

3. ERROR HANDLER MIDDLEWARE
   → Receives (err, req, res, next)

4. ERROR CLASSIFICATION
   → Check if err instanceof AppError (known error)
   → Check if err.name === "ValidationError" (Mongoose)
   → Check if err.name === "CastError" (Invalid ObjectId)
   → Check if err.code === 11000 (Duplicate key)

5. ERROR TRANSFORMATION
   → Convert error to standard format
   → Extract status code (default: 500)
   → Extract message

6. LOGGING
   → Winston logs error with stack trace
   → Error: "User not found", userId: "abc123", ip: "127.0.0.1"

7. SEND ERROR RESPONSE
   → Production:
     {
       "success": false,
       "message": "User not found",
       "code": "NOT_FOUND"
     }
   → Development:
     {
       "success": false,
       "message": "User not found",
       "code": "NOT_FOUND",
       "stack": "Error: User not found\n  at ..."
     }

8. CLIENT RECEIVES ERROR
   → Status: 404
   → Body: JSON error object
```

### Error Types

```
AuthError (401) → Authentication failed
PermissionError (403) → Authorization failed
NotFoundError (404) → Resource not found
ValidationError (400) → Input validation failed
PaymentError (402) → Payment processing failed
RateLimitError (429) → Too many requests
AppError (custom) → General application errors
```

---

## Async Job Flow

### Queue-Based Processing

```
1. CONTROLLER COMPLETES REQUEST
   → Order created successfully
   → Response sent to client immediately

2. EMIT DOMAIN EVENT
   → orderService.createOrder()
   → After successful order creation:
     orderQueue.add('order.created', { orderId, userId })

3. JOB ADDED TO QUEUE
   → BullMQ adds job to Redis queue
   → Job stored with metadata: { id, data, attempts, timestamp }

4. WORKER PICKS UP JOB
   → Worker process (src/workers/order.worker.js) polls queue
   → Gets job from Redis

5. PROCESS JOB
   → Worker executes job handler
   → Example: Send order confirmation email
     - Fetch order details
     - Generate email template
     - Send via email service
     - Update notification status

6. JOB RESULT
   → If successful:
     - Mark job as completed
     - Remove from queue
     - Log success
   → If failed:
     - Increment retry count
     - If attempts < max (3):
       - Requeue with exponential backoff
     - If attempts >= max:
       - Move to Dead Letter Queue
       - Alert ops team

7. PARALLEL JOBS
   → Multiple jobs can be queued simultaneously:
     - Send email notification
     - Send SMS notification
     - Update analytics
     - Log audit event
```

---

## Example Flows

### Example 1: User Login

```
POST /api/v1/auth/login
Body: { email: "user@example.com", password: "pass123" }

FLOW:
1. Rate limiter (auth endpoint: 5 req/15min)
2. Validation (email format, password length)
3. authController.login()
4. authService.login(email, password)
5. userRepository.findByEmail(email)
6. bcrypt.compare(password, user.hashedPassword)
7. If valid:
   - Generate JWT token (7 days expiry)
   - Generate refresh token (30 days expiry)
   - Store refresh token in Redis
   - Log audit event (user logged in)
8. Return:
   {
     "success": true,
     "token": "eyJhbGc...",
     "refreshToken": "refresh...",
     "user": { id, name, email, role }
   }
```

### Example 2: Create Order

```
POST /api/v1/orders
Headers: { Authorization: Bearer <token> }
Body: {
  items: [{ productId: "prod1", quantity: 5 }],
  shippingAddress: {...}
}

FLOW:
1. Auth middleware (verify JWT)
2. Authorization (check role: CUSTOMER/VENDOR)
3. Validation (Joi schema: items array, address format)
4. orderController.createOrder()
5. orderService.createOrder()
   a. Check inventory availability (inventoryService)
   b. Acquire Redis distributed lock: "lock:inventory:prod1"
   c. Reserve inventory (update stock atomically)
   d. Calculate total price (apply discounts)
   e. Start MongoDB transaction
   f. Create Order document
   g. Create Payment document (status: PENDING)
   h. Commit transaction
   i. Release lock
6. Emit events (async jobs):
   - Queue: Send order confirmation email
   - Queue: Send notification to vendor
   - Queue: Update analytics
   - Queue: Log audit event
7. Return response:
   {
     "success": true,
     "order": { id, total, status: "PENDING" }
   }
8. Background workers process queued jobs
```

### Example 3: Payment Webhook

```
POST /api/v1/payments/webhook
Headers: { x-razorpay-signature: "..." }
Body: {
  event: "payment.authorized",
  payload: { payment_id, order_id, amount }
}

FLOW:
1. Skip auth middleware (webhook endpoint)
2. Verify Razorpay signature (HMAC-SHA256)
3. paymentController.handleWebhook()
4. paymentService.processWebhook(payload)
   a. Find Payment document by razorpayOrderId
   b. Check idempotency (prevent duplicate processing)
   c. Acquire lock: "lock:payment:orderId"
   d. Update payment status: PENDING → SUCCESS
   e. Update order status: PENDING → PAID
   f. Release lock
5. Emit events:
   - Queue: Generate invoice
   - Queue: Send payment confirmation email
   - Queue: Notify warehouse (prepare shipment)
6. Return 200 OK (acknowledge webhook)
7. Background workers process jobs
```

---

## Flow Optimization Strategies

### 1. **Early Validation**
Validate inputs before expensive operations.

### 2. **Cache Hot Paths**
Cache frequently accessed data (products, categories).

### 3. **Async Processing**
Move non-critical operations to queues (emails, notifications).

### 4. **Connection Pooling**
Reuse database/Redis connections.

### 5. **Distributed Locking**
Prevent race conditions in concurrent operations.

### 6. **Transaction Management**
Use MongoDB transactions for multi-document updates.

### 7. **Index Optimization**
Ensure all frequently queried fields are indexed.

---

**Document Version:** 1.0  
**Last Updated:** May 2026  
**Maintained By:** Engineering Team
