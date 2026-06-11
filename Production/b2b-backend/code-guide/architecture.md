# System Architecture

> **Comprehensive architectural overview of the B2B + B2C e-commerce backend system**

---

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Architectural Pattern](#architectural-pattern)
- [Layer Breakdown](#layer-breakdown)
- [Component Diagram](#component-diagram)
- [Data Flow Architecture](#data-flow-architecture)
- [Technology Stack](#technology-stack)
- [Design Principles](#design-principles)
- [Scalability Architecture](#scalability-architecture)

---

## Architecture Overview

The system follows a **modular monolithic architecture** with clear separation of concerns. It's designed to be maintainable, scalable, and eventually decomposable into microservices if needed.

### Why Modular Monolithic?

**Advantages:**
- Single deployment unit (simpler operations)
- Shared data access without distributed transactions
- Easier debugging and testing
- Lower infrastructure costs
- Faster development velocity
- Can evolve to microservices gradually

**Trade-offs:**
- Entire application must scale together
- Single point of failure (mitigated by multiple instances)
- Requires discipline to maintain module boundaries

---

## Architectural Pattern

### Layered Architecture

```
┌────────────────────────────────────────────────────────────┐
│                    CLIENT LAYER                            │
│  (React Frontend, Mobile Apps, Third-party Integrations)  │
└───────────────────────┬────────────────────────────────────┘
                        │ HTTPS/REST APIs
                        ↓
┌────────────────────────────────────────────────────────────┐
│                  GATEWAY LAYER                             │
│  Rate Limiting, CORS, Security Headers, Request Logging    │
└───────────────────────┬────────────────────────────────────┘
                        ↓
┌────────────────────────────────────────────────────────────┐
│               AUTHENTICATION LAYER                         │
│  JWT Validation, Session Management, Token Refresh         │
└───────────────────────┬────────────────────────────────────┘
                        ↓
┌────────────────────────────────────────────────────────────┐
│              AUTHORIZATION LAYER                           │
│  RBAC (Role-Based Access Control), Permission Checks       │
└───────────────────────┬────────────────────────────────────┘
                        ↓
┌────────────────────────────────────────────────────────────┐
│              VALIDATION LAYER                              │
│  Input Sanitization, Schema Validation (Joi)               │
└───────────────────────┬────────────────────────────────────┘
                        ↓
┌────────────────────────────────────────────────────────────┐
│              BUSINESS LOGIC LAYER                          │
│  Controllers → Services → Repositories → Models            │
│  (25+ Feature Modules)                                     │
└───────────────────────┬────────────────────────────────────┘
                        ↓
┌────────────────────────────────────────────────────────────┐
│                DATA ACCESS LAYER                           │
│  MongoDB (Mongoose), Redis (ioredis), External APIs        │
└────────────────────────────────────────────────────────────┘
```

---

## Layer Breakdown

### 1. Gateway Layer

**Purpose:** First line of defense and traffic management

**Components:**
- **Rate Limiter:** Prevents abuse (100 req/15min global, customized per endpoint)
- **CORS Middleware:** Controls cross-origin requests
- **Helmet:** Sets secure HTTP headers
- **Request Logger (Morgan):** HTTP request/response logging
- **Compression:** Gzip response compression

**Implementation:** `src/config/security.js`, `src/config/cors.js`, `src/config/rateLimiter.js`

---

### 2. Authentication Layer

**Purpose:** Verify user identity

**Components:**
- **JWT Verification:** Validates access tokens
- **Token Expiration Check:** Ensures tokens are valid
- **User Lookup:** Fetches current user state from database
- **Session Management:** Redis-backed session tracking
- **Refresh Token Handling:** Token rotation for security

**Implementation:** `src/middlewares/auth.middleware.js`

**Flow:**
```
Request → Extract JWT from Authorization header
       → Verify signature with JWT_SECRET
       → Decode payload (userId, role, permissions)
       → Check token expiration
       → Fetch user from DB (verify still active)
       → Attach user to req.user
       → Pass to next middleware
```

---

### 3. Authorization Layer

**Purpose:** Verify user permissions

**Components:**
- **Role Middleware:** Checks user role (SuperAdmin, Admin, Vendor, Customer)
- **Permission Middleware:** Fine-grained permission checks
- **Resource Ownership:** Validates user owns the resource they're accessing

**Implementation:** `src/middlewares/role.middleware.js`, `src/middlewares/permission.middleware.js`

**Authorization Hierarchy:**
```
SuperAdmin (highest privileges)
  ↓
Admin (manage operations)
  ↓
Vendor (manage own products/orders)
  ↓
Customer (B2B/B2C buyers - lowest privileges)
```

---

### 4. Validation Layer

**Purpose:** Ensure data integrity

**Components:**
- **Joi Schema Validation:** Request body/params/query validation
- **MongoDB Injection Prevention:** Sanitizes MongoDB operators
- **XSS Protection:** Prevents cross-site scripting
- **File Upload Validation:** Type, size, and content validation

**Implementation:** `src/middlewares/validate.middleware.js`, `src/validations/*`

---

### 5. Business Logic Layer

**Purpose:** Core application functionality

**Pattern:** Repository + Service + Controller pattern

```
Controller (HTTP Layer)
    ↓
Service (Business Logic)
    ↓
Repository (Data Access Abstraction)
    ↓
Model (Database Schema)
```

**25+ Feature Modules:**
- Authentication (`auth`)
- Users (`user`)
- Products (`product`)
- Categories (`category`)
- Cart (`cart`)
- Orders (`order`)
- Payments (`payment`)
- Inventory (`inventory`)
- Invoices (`invoice`)
- Shipments (`shipment`)
- Logistics (`logistics`)
- Notifications (`notification`)
- Analytics (`analytics`)
- Audit (`audit`)
- And more...

**Each module structure:**
```
module/
├── module.controller.js   # HTTP request handling
├── module.service.js      # Business logic
├── module.repository.js   # Data access
├── module.model.js        # Mongoose schema
├── module.routes.js       # Route definitions
├── module.validation.js   # Joi schemas
└── module.events.js       # Domain events (optional)
```

---

### 6. Data Access Layer

**Purpose:** Interact with data stores

**Components:**
- **MongoDB Connection:** Mongoose ODM with connection pooling
- **Redis Connection:** ioredis client with auto-reconnect
- **Query Optimization:** Indexes, aggregation pipelines
- **Transaction Support:** MongoDB transactions for critical operations
- **Cache Layer:** Redis cache-aside pattern

**Implementation:** `src/config/db.js`, `src/config/redis.js`

---

## Component Diagram

```
┌──────────────────────────────────────────────────────────────────┐
│                         EXPRESS.JS SERVER                        │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌────────────────┐  ┌────────────────┐  ┌──────────────────┐  │
│  │  Auth Module   │  │  Order Module  │  │  Payment Module  │  │
│  │                │  │                │  │                  │  │
│  │ • Controller   │  │ • Controller   │  │ • Controller     │  │
│  │ • Service      │  │ • Service      │  │ • Service        │  │
│  │ • Repository   │  │ • Repository   │  │ • Gateway        │  │
│  │ • Model        │  │ • Model        │  │ • Webhook        │  │
│  │ • Routes       │  │ • Routes       │  │ • Model          │  │
│  └────────┬───────┘  └────────┬───────┘  └────────┬─────────┘  │
│           │                   │                    │            │
│           └───────────────────┴────────────────────┘            │
│                               ↓                                 │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │           SHARED SERVICES & UTILITIES                      │ │
│  │  • Email Service      • SMS Service      • PDF Generator  │ │
│  │  • File Upload        • Encryption       • Cache Service  │ │
│  │  • Logger (Winston)   • Queue Manager    • Redis Service  │ │
│  └────────────────────────────────────────────────────────────┘ │
│                               ↓                                 │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                    MIDDLEWARE STACK                        │ │
│  │  • Auth    • RBAC    • Validation    • Rate Limit         │ │
│  │  • CORS    • Helmet  • Compression   • Error Handler      │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
                               ↓
┌──────────────┬───────────────┬──────────────┬──────────────────┐
│   MongoDB    │     Redis     │   BullMQ     │   Razorpay API   │
│   (Primary   │   (Cache +    │   (Job       │   (Payments)     │
│    Data)     │    Locks)     │   Queue)     │                  │
└──────────────┴───────────────┴──────────────┴──────────────────┘
```

---

## Data Flow Architecture

### Read Operation Flow
```
1. Client Request (GET /api/v1/products)
   ↓
2. Rate Limiter (check request count)
   ↓
3. CORS (validate origin)
   ↓
4. Auth Middleware (verify JWT)
   ↓
5. Cache Check (Redis)
   ├─→ Cache Hit → Return cached data
   └─→ Cache Miss → Continue
   ↓
6. Controller.getProducts()
   ↓
7. Service.getProducts() (business logic)
   ↓
8. Repository.findAll() (data access)
   ↓
9. MongoDB Query (with indexes)
   ↓
10. Transform data
   ↓
11. Store in Cache (Redis with TTL)
   ↓
12. Return Response
```

### Write Operation Flow
```
1. Client Request (POST /api/v1/orders)
   ↓
2. Rate Limiter
   ↓
3. Auth & Authorization
   ↓
4. Input Validation (Joi schema)
   ↓
5. Controller.createOrder()
   ↓
6. Service.createOrder()
   ├─→ Check inventory availability
   ├─→ Acquire distributed lock (Redis)
   ├─→ Reserve inventory (atomic operation)
   ├─→ Create order (MongoDB transaction)
   ├─→ Create payment record
   ├─→ Release lock
   └─→ Invalidate cache
   ↓
7. Emit Domain Events
   ├─→ Queue: Send order confirmation email
   ├─→ Queue: Send notification to vendor
   └─→ Queue: Log audit event
   ↓
8. Return Response (order created)
   ↓
9. Background Jobs Process Queued Tasks
```

---

## Technology Stack

### Backend Framework
- **Node.js 18.x:** JavaScript runtime (ES Modules)
- **Express.js 4.22.2:** Web framework

### Database & Caching
- **MongoDB 8.x:** NoSQL document database (Mongoose ODM)
- **Redis 7.x:** In-memory data store (ioredis client)

### Job Queue
- **BullMQ 5.x:** Redis-backed job queue

### Authentication & Security
- **jsonwebtoken:** JWT token generation/verification
- **bcryptjs:** Password hashing
- **helmet:** Security headers
- **express-rate-limit:** Rate limiting
- **joi:** Schema validation

### Payments
- **Razorpay SDK:** Payment gateway integration

### File Handling
- **Multer:** File uploads
- **PDFKit:** PDF generation
- **AWS S3 SDK:** Cloud storage (optional)

### Monitoring & Logging
- **Winston:** Application logging
- **Morgan:** HTTP request logging
- **Sentry:** Error tracking (optional)

### Real-time
- **Socket.io:** WebSocket communication

### Testing
- **Jest:** Test framework
- **Supertest:** HTTP assertion library
- **mongodb-memory-server:** In-memory MongoDB for tests

---

## Design Principles

### 1. **Separation of Concerns**
Each module handles a specific domain. Clear boundaries between layers.

### 2. **DRY (Don't Repeat Yourself)**
Shared services and utilities prevent code duplication.

### 3. **Single Responsibility**
Each function/class has one reason to change.

### 4. **Dependency Injection**
Dependencies passed as parameters, not hardcoded.

### 5. **Fail Fast**
Validate inputs early, throw errors immediately.

### 6. **Idempotency**
Critical operations (payments, orders) are idempotent to prevent duplicate processing.

### 7. **Graceful Degradation**
System continues operating even if non-critical services (Redis, queue) fail.

### 8. **Security by Design**
Security measures baked into every layer.

---

## Scalability Architecture

### Horizontal Scaling Strategy

```
                    ┌──────────────────┐
                    │  Load Balancer   │
                    │  (Nginx/AWS ALB) │
                    └────────┬─────────┘
                             │
          ┌──────────────────┼──────────────────┐
          ↓                  ↓                  ↓
    ┌─────────┐        ┌─────────┐        ┌─────────┐
    │ Node.js │        │ Node.js │        │ Node.js │
    │Instance1│        │Instance2│        │Instance3│
    └────┬────┘        └────┬────┘        └────┬────┘
         │                  │                  │
         └──────────────────┴──────────────────┘
                            ↓
         ┌──────────────────┴──────────────────┐
         ↓                  ↓                  ↓
    ┌─────────┐      ┌───────────┐      ┌──────────┐
    │ MongoDB │      │   Redis   │      │  BullMQ  │
    │ Replica │      │  Cluster  │      │ Workers  │
    │   Set   │      │           │      │          │
    └─────────┘      └───────────┘      └──────────┘
```

### Scaling Considerations

**Application Tier:**
- Stateless design allows unlimited horizontal scaling
- Session data stored in Redis (shared across instances)
- No in-memory caching (all cache in Redis)
- PM2 cluster mode for single-server multi-instance

**Database Tier:**
- MongoDB replica set for read scaling
- Indexes on all frequently queried fields
- Aggregation pipelines for analytics
- Sharding strategy planned for >100M documents

**Cache Tier:**
- Redis cluster for high availability
- Cache-aside pattern with TTL-based invalidation
- Connection pooling

**Queue Tier:**
- Multiple worker processes for parallel job processing
- Queue prioritization (critical, high, normal, low)
- Retry strategies with exponential backoff

---

## Monitoring Architecture

```
Application Logs (Winston)
    ↓
Sentry (Error Tracking)
    ↓
Grafana Dashboards
    ↓
Alerts (PagerDuty/Slack)

Health Checks
    ↓
/health endpoint
    ↓
Load Balancer Health Checks
```

---

## Security Architecture

**Perimeter Security:**
- Rate limiting at gateway
- CORS enforcement
- HTTPS only (production)

**Application Security:**
- JWT-based authentication
- RBAC authorization
- Input validation
- SQL/NoSQL injection prevention
- XSS protection

**Data Security:**
- Password hashing (bcrypt)
- Sensitive data encryption
- Audit logging
- PII data handling

**Infrastructure Security:**
- Environment variable isolation
- Secrets management (AWS Secrets Manager recommended)
- Database authentication
- Redis password protection

---

## Future Architecture Evolution

### Planned Enhancements

1. **Microservices Migration (if needed):**
   - Extract payment service
   - Extract notification service
   - API gateway (Kong/Nginx)

2. **Event-Driven Architecture:**
   - Kafka for event streaming
   - CQRS pattern for read/write separation

3. **Advanced Caching:**
   - CDN for static assets
   - Edge caching

4. **Enhanced Monitoring:**
   - Distributed tracing (Jaeger)
   - APM (Application Performance Monitoring)

5. **Database Optimization:**
   - Read replicas
   - Database sharding
   - Time-series data (InfluxDB for analytics)

---

**Document Version:** 1.0  
**Last Updated:** May 2026  
**Maintained By:** Engineering Team
