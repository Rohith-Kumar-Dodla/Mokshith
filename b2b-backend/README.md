# B2B + B2C E-Commerce Backend

> **Enterprise-grade Node.js backend powering a multi-tenant wholesale and retail e-commerce platform**

[![Node.js](https://img.shields.io/badge/Node.js-18.x-green.svg)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.22.2-lightgrey.svg)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-8.x-green.svg)](https://www.mongodb.com/)
[![Redis](https://img.shields.io/badge/Redis-7.x-red.svg)](https://redis.io/)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

---

## 📋 Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Environment Setup](#environment-setup)
- [Running the Application](#running-the-application)
- [Testing](#testing)
- [API Documentation](#api-documentation)
- [Queue Workers](#queue-workers)
- [Payment Integration](#payment-integration)
- [Redis Usage](#redis-usage)
- [Deployment](#deployment)
- [Monitoring & Logging](#monitoring--logging)
- [Security](#security)
- [Scalability](#scalability)
- [Troubleshooting](#troubleshooting)
- [Documentation](#documentation)
- [Contributing](#contributing)

---

## 🎯 Overview

This backend system powers a comprehensive B2B and B2C e-commerce platform designed for wholesale and retail operations. Built with modern Node.js practices, it handles multi-tenant operations, complex inventory management, payment processing, order fulfillment, and real-time notifications.

**Key Capabilities:**
- Multi-tenant architecture (B2B wholesalers + B2C customers)
- Complete order lifecycle management with payment processing
- Real-time inventory tracking with reservation system
- Distributed queue-based async job processing
- Redis-backed caching and distributed locking
- Role-based access control (RBAC) with fine-grained permissions
- Payment gateway integration (Razorpay) with webhook handling
- Comprehensive audit logging and analytics

---

## 🏗️ Architecture

The system follows a **modular monolithic architecture** with clear separation of concerns:

```
┌─────────────────────────────────────────────────────────────┐
│                      API GATEWAY LAYER                      │
│  (Rate Limiting, CORS, Security Headers, Request Logging)  │
└────────────────────┬────────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────────────┐
│                   AUTHENTICATION LAYER                       │
│      (JWT Validation, Session Management, 2FA Support)      │
└────────────────────┬────────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────────────┐
│                   AUTHORIZATION LAYER                        │
│    (Role-Based Access Control, Permission Middleware)       │
└────────────────────┬────────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────────────┐
│                     BUSINESS LOGIC LAYER                     │
│  (25+ Feature Modules: Auth, Orders, Payments, Inventory)  │
└────────────────────┬────────────────────────────────────────┘
                     ↓
┌──────────┬──────────────┬──────────────┬───────────────────┐
│  MongoDB │    Redis     │   BullMQ     │   Razorpay API    │
│ (Primary │  (Cache +    │  (Async Job  │  (Payments)       │
│   Data)  │   Locks)     │  Processing) │                   │
└──────────┴──────────────┴──────────────┴───────────────────┘
```

### System Flow Overview

```
User Request → Rate Limiter → CORS → Helmet Security
     ↓
Authentication (JWT) → Authorization (RBAC) → Validation (Joi)
     ↓
Controller → Service Layer → Repository Pattern
     ↓
MongoDB (Mongoose) ← → Redis Cache
     ↓
Response + Queue Jobs (Email, Notifications, Webhooks)
```

---

## ✨ Key Features

### 🔐 Authentication & Authorization
- JWT-based authentication with refresh tokens
- Role-based access control (SuperAdmin, Admin, Vendor, Customer)
- Fine-grained permission system
- OTP-based login support
- Two-factor authentication (2FA) ready
- Session management with Redis

### 🛒 E-Commerce Core
- Multi-tenant product catalog management
- Advanced search and filtering
- Shopping cart with session persistence
- Wishlist functionality
- Bulk ordering for B2B customers
- Dynamic pricing for wholesale buyers

### 📦 Order Management
- Complete order lifecycle (Draft → Paid → Processing → Shipped → Delivered)
- Order cancellation and refund handling
- Partial shipments support
- Order status tracking with notifications
- Automated invoice generation
- Order history and analytics

### 💳 Payment System
- Razorpay payment gateway integration
- Secure payment signature verification
- Webhook handling for payment updates
- Refund processing
- Credit system for B2B customers
- Payment reconciliation jobs
- Support for multiple payment methods

### 📊 Inventory Management
- Real-time stock tracking
- Inventory reservation on order placement
- Low stock alerts
- Automatic inventory sync jobs
- Multi-warehouse support
- Stock movement history

### 🚚 Logistics & Delivery
- Shipment tracking
- Delivery partner assignment
- Real-time location tracking
- Delivery status notifications
- Logistics analytics

### 🔔 Notifications
- Email notifications
- SMS support (integration ready)
- Real-time push notifications via Socket.io
- Queue-based async notification processing
- Notification preferences management

### 📈 Analytics & Reporting
- Sales analytics
- Order analytics
- Inventory reports
- User activity tracking
- Revenue reporting
- Custom report generation

### 🛡️ Security Features
- Helmet.js for security headers
- XSS protection
- MongoDB injection prevention
- Rate limiting (global + endpoint-specific)
- CORS configuration
- Request correlation IDs
- Comprehensive audit logging
- CSRF protection (ready)
- Input sanitization
- Secure password hashing (bcrypt)

---

## 🛠️ Tech Stack

### Core Technologies
- **Runtime:** Node.js 18.x (ES Modules)
- **Framework:** Express.js 4.22.2
- **Database:** MongoDB 8.x (Mongoose ODM)
- **Cache/Queue:** Redis 7.x + BullMQ 5.x
- **API Protocol:** RESTful APIs

### Key Dependencies
- **Authentication:** jsonwebtoken, bcryptjs, otplib
- **Validation:** Joi, validator
- **Security:** helmet, express-rate-limit, xss-clean, express-mongo-sanitize
- **Payments:** razorpay SDK
- **File Handling:** multer, pdfkit
- **Logging:** winston, morgan
- **Real-time:** socket.io
- **Monitoring:** @sentry/node (integration ready)
- **Cloud Storage:** AWS S3 SDK (integration ready)
- **Job Queue:** BullMQ + ioredis
- **Testing:** Jest, Supertest, mongodb-memory-server

### Development Tools
- **Linting:** ESLint
- **Formatting:** Prettier
- **Git Hooks:** Husky + lint-staged
- **Process Manager:** Nodemon (dev), PM2 (production recommended)
- **Load Testing:** Autocannon

---

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js:** v18.x or higher
- **npm:** v9.x or higher (comes with Node.js)
- **MongoDB:** v8.x or higher
- **Redis:** v7.x or higher
- **Git:** Latest version

### System Requirements
- **RAM:** Minimum 4GB (8GB recommended for development)
- **Disk Space:** 5GB free space
- **OS:** Windows 10/11, macOS 11+, or Linux (Ubuntu 20.04+)

---

## 🚀 Installation

### 1. Clone the Repository
```bash
git clone <repository-url>
cd b2b-backend
```

### 2. Install Dependencies
```bash
npm install
```

This will install all production and development dependencies (~900 packages).

### 3. Verify Installation
```bash
npm list --depth=0
```

---

## ⚙️ Environment Setup

### 1. Create Environment File
Copy the example environment file:
```bash
cp .env.example .env
```

### 2. Configure Environment Variables

Edit `.env` with your configuration:

```bash
# Server Configuration
NODE_ENV=development
PORT=5000

# Database
MONGO_URI=mongodb://localhost:27017/b2b-ecommerce
# For MongoDB Atlas: mongodb+srv://username:password@cluster.mongodb.net/dbname

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d

# Redis Configuration
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# Payment Gateway (Razorpay)
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret

# AWS S3 (Optional - for file storage)
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=ap-south-1
AWS_S3_BUCKET=your-bucket-name

# Email Service (Optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
EMAIL_FROM=noreply@yourdomain.com

# Sentry (Optional - for error tracking)
SENTRY_DSN=your_sentry_dsn

# Feature Flags
ENABLE_MAINTENANCE_MODE=false
ENABLE_ANALYTICS=true
ENABLE_AUDIT_LOGS=true
```

### 3. Start Required Services

**MongoDB:**
```bash
# If using Docker
docker run -d -p 27017:27017 --name mongodb mongo:8

# Or start local MongoDB service
# Windows: Start MongoDB service from Services
# macOS: brew services start mongodb-community
# Linux: sudo systemctl start mongod
```

**Redis:**
```bash
# If using Docker
docker run -d -p 6379:6379 --name redis redis:7

# Or start local Redis service
# Windows: redis-server
# macOS: brew services start redis
# Linux: sudo systemctl start redis
```

### 4. Verify Service Connections
```bash
# Test MongoDB connection
mongosh mongodb://localhost:27017

# Test Redis connection
redis-cli ping
# Should return: PONG
```

---

## 🎮 Running the Application

### Development Mode (with hot reload)
```bash
npm run dev
```

The server will start on `http://localhost:5000` with automatic restarts on file changes.

### Production Mode
```bash
npm start
```

### Using Docker Compose
```bash
docker-compose up -d
```

This starts the entire stack (backend + MongoDB + Redis).

### Health Check
Once started, verify the server is running:
```bash
curl http://localhost:5000/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2026-05-18T10:30:00.000Z",
  "uptime": 42.5,
  "database": "connected",
  "redis": "connected"
}
```

---

## 🧪 Testing

### Run All Tests
```bash
npm test
```

### Run Specific Test Suites
```bash
# Unit tests only
npm run test:unit

# Integration tests only
npm run test:integration

# End-to-end tests only
npm run test:e2e

# Load/performance tests
npm run test:load
```

### Test with Coverage
```bash
npm run test:coverage
```

Coverage reports are generated in `coverage/` directory.

### Watch Mode (for TDD)
```bash
npm run test:watch
```

### Test Structure
```
tests/
├── unit/              # Unit tests for individual functions/services
├── integration/       # Integration tests for API endpoints
├── e2e/              # End-to-end workflow tests
├── load/             # Load and performance tests
├── helpers/          # Test utilities and mocks
└── setup.js          # Global test configuration
```

---

## 📚 API Documentation

### Access API Documentation
- **Swagger UI:** `http://localhost:5000/api-docs`
- **OpenAPI Spec:** `src/docs/openapi.yaml`
- **Postman Collection:** `src/docs/postman.json`

### API Versioning
All APIs are versioned under `/api/v1/` prefix:

```
Base URL: http://localhost:5000/api/v1
```

### Key Endpoint Categories

| Category | Base Path | Description |
|----------|-----------|-------------|
| Authentication | `/api/v1/auth` | Login, register, OTP, refresh tokens |
| Users | `/api/v1/users` | User management |
| Products | `/api/v1/products` | Product catalog |
| Orders | `/api/v1/orders` | Order management |
| Payments | `/api/v1/payments` | Payment processing |
| Inventory | `/api/v1/inventory` | Stock management |
| Cart | `/api/v1/cart` | Shopping cart |
| Notifications | `/api/v1/notifications` | User notifications |
| Admin | `/api/v1/admin` | Admin operations |

### Authentication
Most endpoints require JWT authentication:

```bash
Authorization: Bearer <your-jwt-token>
```

---

## 🔄 Queue Workers

The system uses **BullMQ** for asynchronous job processing with Redis as the backing store.

### Available Queues

| Queue Name | Purpose | Priority | Retry Strategy |
|------------|---------|----------|----------------|
| `emailQueue` | Email delivery | Normal | 3 attempts, exponential backoff |
| `notificationQueue` | Push notifications | High | 5 attempts |
| `inventoryQueue` | Stock sync | Normal | 2 attempts |
| `paymentQueue` | Payment processing | Critical | 5 attempts |
| `webhookQueue` | Third-party webhooks | Normal | 3 attempts |
| `auditQueue` | Audit log processing | Low | 1 attempt |
| `imageQueue` | Image processing | Low | 2 attempts |
| `archivalQueue` | Data archival | Low | 1 attempt |

### Worker Overview
Workers automatically process jobs from their respective queues:

```
Job Added → Queue → Worker Picks Up → Process → Success/Failure
                                          ↓
                                      Retry on Failure
                                          ↓
                                      Dead Letter Queue (after max retries)
```

### Background Jobs (Cron)

Scheduled jobs run automatically:

| Job | Schedule | Description |
|-----|----------|-------------|
| `paymentReconcile` | Daily 2:00 AM | Reconcile Razorpay payments |
| `inventorySync` | Every 15 min | Sync inventory across warehouses |
| `creditReminder` | Daily 9:00 AM | Send credit payment reminders |
| `orderCleanup` | Daily 1:00 AM | Archive old completed orders |
| `analyticsJob` | Hourly | Update analytics cache |
| `cleanup` | Daily 3:00 AM | Clean expired sessions/tokens |

### Queue Monitoring
Monitor queue health and job status:

```bash
# View queue stats (requires Redis CLI)
redis-cli keys "bull:*:*"

# Or use BullMQ dashboard (if configured)
# http://localhost:5000/admin/queues
```

---

## 💳 Payment Integration

### Razorpay Setup

1. **Create Razorpay Account:** [razorpay.com](https://razorpay.com)
2. **Get API Credentials:** Dashboard → Settings → API Keys
3. **Configure Webhook:** Dashboard → Settings → Webhooks
   - URL: `https://yourdomain.com/api/v1/payments/webhook`
   - Events: `payment.authorized`, `payment.failed`, `refund.created`
4. **Update `.env`:** Add your Key ID and Secret

### Payment Flow

```
1. User initiates checkout
   ↓
2. Backend creates Razorpay order
   ↓
3. Frontend shows Razorpay checkout modal
   ↓
4. User completes payment on Razorpay
   ↓
5. Razorpay sends webhook to backend
   ↓
6. Backend verifies webhook signature (HMAC-SHA256)
   ↓
7. Update order status to PAID
   ↓
8. Trigger invoice generation
   ↓
9. Send confirmation email/notification
```

### Payment Security
- **Signature Verification:** All webhooks are verified using HMAC-SHA256
- **Idempotency:** Duplicate webhook handling prevented
- **Amount Validation:** Server-side amount verification
- **Retry Logic:** Failed payments retried via queue
- **Audit Trail:** All payment events logged

### Testing Payments
Razorpay provides test credentials:
- **Test Key ID:** Use test mode keys from dashboard
- **Test Cards:** [Razorpay Test Cards](https://razorpay.com/docs/payments/test-card-details/)

---

## 🔴 Redis Usage

Redis serves multiple critical functions in the system:

### 1. Caching Strategy
- **User Sessions:** JWT refresh tokens
- **Product Catalog:** Frequently accessed products
- **Inventory Counts:** Real-time stock levels
- **Analytics Data:** Aggregated statistics
- **Rate Limit Counters:** Request tracking per IP/user

**Cache Invalidation:**
```javascript
// Automatic invalidation on data updates
// TTL-based expiration (5-60 minutes depending on data type)
// Manual invalidation for critical updates
```

### 2. Distributed Locking
Prevents race conditions in concurrent operations:

```javascript
// Example: Inventory reservation
Lock Key: `lock:inventory:${productId}`
TTL: 10 seconds
Use Cases:
- Order placement (inventory deduction)
- Payment processing
- Concurrent stock updates
```

### 3. Queue Backend
BullMQ uses Redis for reliable job queuing.

### 4. Real-time Features
- Socket.io adapter for multi-instance communication
- Pub/Sub for real-time notifications

### Redis Connection Management
- **Connection Pool:** ioredis with auto-reconnect
- **Failover:** Graceful degradation if Redis unavailable
- **Monitoring:** Connection health checks

### Redis Monitoring
```bash
# Monitor Redis operations
redis-cli monitor

# Check memory usage
redis-cli info memory

# View all keys (development only)
redis-cli keys "*"
```

---

## 🚀 Deployment

### Production Checklist

- [ ] Set `NODE_ENV=production` in environment
- [ ] Generate strong `JWT_SECRET` (min 32 chars)
- [ ] Configure production MongoDB (replica set recommended)
- [ ] Configure production Redis (persistence enabled)
- [ ] Set up Razorpay production keys
- [ ] Configure AWS S3 for file storage
- [ ] Set up SSL/TLS certificates
- [ ] Configure CORS for production domains
- [ ] Enable Sentry for error tracking
- [ ] Set up CI/CD pipeline
- [ ] Configure CDN for static assets
- [ ] Set up database backups
- [ ] Configure monitoring and alerts

### Using PM2 (Recommended)

```bash
# Install PM2 globally
npm install -g pm2

# Start application
pm2 start server.js --name b2b-backend

# Start with cluster mode (multi-instance)
pm2 start server.js -i max --name b2b-backend

# Save process list
pm2 save

# Setup auto-restart on server reboot
pm2 startup
```

### Docker Deployment

```bash
# Build image
docker build -t b2b-backend:latest .

# Run container
docker run -d \
  --name b2b-backend \
  -p 5000:5000 \
  --env-file .env \
  b2b-backend:latest
```

### Using Docker Compose
```bash
docker-compose -f docker-compose.prod.yml up -d
```

### Environment Variables for Production

```bash
NODE_ENV=production
PORT=5000

# Use connection strings with authentication
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/dbname?retryWrites=true
REDIS_HOST=redis.production.com
REDIS_PORT=6379
REDIS_PASSWORD=strong-redis-password

# Secure JWT secret
JWT_SECRET=<64-char-random-string>

# Production Razorpay keys
RAZORPAY_KEY_ID=rzp_live_...
RAZORPAY_KEY_SECRET=...

# Enable monitoring
SENTRY_DSN=https://...
```

### Scaling Strategy

**Horizontal Scaling:**
- Run multiple Node.js instances behind a load balancer
- Redis handles session sharing
- MongoDB replica set for read scaling

**Vertical Scaling:**
- Increase server resources (CPU/RAM)
- Optimize database indexes
- Redis memory optimization

---

## 📊 Monitoring & Logging

### Winston Logging

Logs are structured and categorized:

```javascript
Levels: error, warn, info, http, debug
Output: Console (dev) + File (production)
Log Files:
  - logs/error.log (errors only)
  - logs/combined.log (all logs)
  - logs/http.log (HTTP requests)
```

### Request Logging (Morgan)
- HTTP request/response logging
- Response time tracking
- Custom format for production

### Audit Logs
- User actions tracked in MongoDB
- Sensitive operations logged (payments, admin actions)
- IP address and user agent captured
- Retention policy: 90 days

### Health Check Endpoint
```bash
GET /health
```

Returns system health metrics:
```json
{
  "status": "healthy",
  "timestamp": "2026-05-18T10:30:00.000Z",
  "uptime": 42.5,
  "database": "connected",
  "redis": "connected",
  "memory": {
    "used": "150MB",
    "total": "512MB"
  }
}
```

### Recommended Monitoring Tools
- **Sentry:** Error tracking and performance monitoring
- **PM2 Plus:** Process monitoring and management
- **MongoDB Atlas:** Built-in database monitoring
- **Redis Insight:** Redis monitoring and debugging
- **Grafana + Prometheus:** Custom metrics dashboards

---

## 🛡️ Security

### Security Measures Implemented

#### 1. **Helmet.js**
- Secure HTTP headers
- XSS protection
- Clickjacking prevention
- Content Security Policy

#### 2. **Rate Limiting**
```javascript
Global: 100 requests per 15 minutes per IP
Auth endpoints: 5 requests per 15 minutes
Payment endpoints: 10 requests per 15 minutes
```

#### 3. **Input Validation**
- Joi schema validation for all inputs
- MongoDB injection prevention (express-mongo-sanitize)
- XSS protection (xss-clean)
- File upload validation (type, size)

#### 4. **Authentication Security**
- JWT with RS256 algorithm
- Refresh token rotation
- Token expiration (7 days access, 30 days refresh)
- Password hashing (bcrypt with 10 rounds)
- OTP expiration (5 minutes)

#### 5. **Authorization**
- Role-based access control (RBAC)
- Fine-grained permissions
- Ownership validation for resource access

#### 6. **CORS Configuration**
- Whitelist allowed origins
- Credentials support
- Preflight caching

#### 7. **Audit Logging**
- All sensitive operations logged
- IP tracking and correlation IDs
- User action history

#### 8. **Payment Security**
- Webhook signature verification
- HTTPS enforcement for webhooks
- PCI compliance considerations

### Security Best Practices

```bash
# Never commit .env files
# Rotate JWT secrets regularly
# Use environment variables for all secrets
# Enable HTTPS in production
# Implement CSRF protection for state-changing operations
# Regular security audits: npm audit
# Keep dependencies updated
# Implement request timeout
# Use prepared statements (Mongoose does this)
```

---

## ⚡ Scalability

### Current Scalability Features

#### 1. **Horizontal Scaling Ready**
- Stateless application design
- Session data in Redis (shared across instances)
- Queue-based async processing
- Load balancer compatible

#### 2. **Database Optimization**
- Mongoose indexes on frequently queried fields
- Pagination for large result sets
- Aggregation pipelines for analytics
- Connection pooling

#### 3. **Caching Strategy**
- Redis caching for hot data
- Cache-aside pattern
- TTL-based invalidation
- Conditional caching based on load

#### 4. **Queue System**
- Async processing for heavy operations
- Job prioritization
- Retry mechanisms
- Dead letter queues

#### 5. **Connection Pooling**
- MongoDB connection pool (default 10 connections)
- Redis connection pool via ioredis
- HTTP keep-alive enabled

### Performance Optimizations

```javascript
// Implemented optimizations:
- Compression middleware for responses
- Lazy loading of modules
- Database query optimization
- Efficient error handling (no stack traces to client)
- Response streaming for large files
- CDN integration ready (AWS S3)
```

### Load Testing

```bash
# Run load tests with Autocannon
npm run test:load
```

**Current Performance Targets:**
- Response time: <200ms (p95)
- Throughput: 1000 req/s per instance
- Database query time: <50ms average
- Cache hit ratio: >80%

---

## 📦 Backend Module Organization

The backend follows a **modular monolithic architecture** with 25+ feature modules organized by domain:

### Core Modules

**Authentication & Authorization:**
- `auth/` - JWT authentication, OTP, token management
- `user/` - User profile, preferences, management
- `admin/` - Administrative operations, user management
- `superAdmin/` - System-wide configuration, feature flags

**E-Commerce Core:**
- `product/` - Product catalog, CRUD operations
- `category/` - Product categorization, hierarchy
- `search/` - Elasticsearch-ready search functionality
- `cart/` - Shopping cart management
- `wishlist/` - Wishlist functionality
- `review/` - Product reviews and ratings

**Order & Payment:**
- `order/` - Order lifecycle management
- `payment/` - Razorpay integration, refunds
- `credit/` - B2B credit system, credit limits
- `invoice/` - Invoice generation (PDF)

**Inventory & Logistics:**
- `inventory/` - Real-time stock tracking, reservations
- `warehouse/` - Multi-warehouse support
- `shipment/` - Shipment tracking, status updates
- `logistics/` - Delivery partner management

**Business Management:**
- `company/` - Company profiles for B2B
- `vendor/` - Vendor management, onboarding
- `pricing/` - Dynamic pricing, wholesale rates
- `promotion/` - Discount codes, campaigns

**System & Analytics:**
- `notification/` - Email, SMS, push notifications
- `analytics/` - Business intelligence, reports
- `audit/` - Audit logging, compliance
- `settings/` - System configuration

### Module Structure Pattern

Each module follows consistent structure:

```
module/
├── module.model.js          # MongoDB schema with Mongoose
├── module.controller.js     # Request handlers
├── module.service.js        # Business logic layer
├── module.repository.js     # Data access layer (optional)
├── module.validation.js     # Joi schemas for input validation
├── module.routes.js         # Express route definitions
└── __tests__/
    ├── module.unit.test.js
    └── module.integration.test.js
```

### Shared Infrastructure

**Configuration Layer (`src/config/`):**
- `db.js` - MongoDB connection with retry logic
- `redis.js` - Redis client (ioredis) for cache/locks
- `queue.js` - BullMQ queue factory
- `logger.js` - Winston logging configuration
- `security.js` - Helmet, CORS, rate limiting
- `razorpay.js` - Razorpay SDK initialization

**Middleware Layer (`src/middlewares/`):**
- `auth.middleware.js` - JWT validation, session check
- `authorization.middleware.js` - RBAC permission checks
- `validation.middleware.js` - Joi schema validation
- `cache.middleware.js` - Redis cache interceptor
- `rateLimiter.middleware.js` - Request throttling
- `audit.middleware.js` - Action logging
- `errorHandler.middleware.js` - Centralized error handling

**Utilities (`src/utils/`):**
- `asyncHandler.js` - Async/await error wrapper
- `responseFormatter.js` - Standard API responses
- `cacheInvalidation.js` - Cache management
- `fileUpload.js` - Multer configuration
- `passwordPolicy.js` - Password strength validation

---

## 🔒 Inventory Reservation System

### Why Inventory Reservation?

Prevents overselling in concurrent scenarios:

```
❌ Without Reservation:
User A checks stock: 10 available
User B checks stock: 10 available
Both proceed to checkout
Both orders succeed → Oversold!

✅ With Reservation:
User A adds to cart → Reserve 5 units (10 - 5 = 5 available)
User B adds to cart → Reserve 3 units (5 - 3 = 2 available)
User C tries to add 5 → Rejected (insufficient stock)
```

### Reservation Lifecycle

```
1. Add to Cart
   ↓
2. Check Available Stock
   ↓
3. Acquire Distributed Lock (Redis)
   ↓
4. Reserve Stock Atomically
   availableStock -= quantity
   reservedStock += quantity
   ↓
5. Release Lock
   ↓
6. Stock reserved for 15 minutes
   ↓
7. Order Placed → Convert reservation to sale
   reservedStock -= quantity
   soldStock += quantity
   ↓
8. OR Timeout → Release reservation
   reservedStock -= quantity
   availableStock += quantity
```

### Implementation Details

**Distributed Locking (Redis):**
```javascript
// Acquire lock before stock operations
const lockKey = `lock:inventory:${productId}`;
await acquireLock(lockKey, 10); // 10 second TTL

try {
  // Critical section - atomic stock update
  await Inventory.findOneAndUpdate(
    { productId, availableStock: { $gte: quantity } },
    {
      $inc: { availableStock: -quantity, reservedStock: quantity }
    }
  );
} finally {
  await releaseLock(lockKey);
}
```

**Reservation Expiry:**
- Cart reservations expire after 15 minutes
- Background job releases expired reservations
- User notified if reservation expires during checkout

**Concurrency Safety:**
- MongoDB atomic operations (`$inc`, `$set`)
- Optimistic locking with version numbers
- Redis distributed locks for multi-step operations

---

## 🔐 Concurrency & Race Condition Handling

### Challenges Addressed

**1. Payment Double Processing:**
```
✅ Solution: Idempotency keys + Redis locks
```

**2. Inventory Overselling:**
```
✅ Solution: Atomic updates + distributed locks
```

**3. Lost Updates:**
```
✅ Solution: MongoDB optimistic concurrency control
```

### Strategies Implemented

#### 1. **Distributed Locks (Redis)**

Used for multi-step critical operations:

```javascript
// Example: Process payment
const lockKey = `lock:payment:${orderId}`;
await withLock(lockKey, 30, async () => {
  // Check if already processed
  const existing = await Payment.findOne({ orderId, status: 'SUCCESS' });
  if (existing) return existing;

  // Process payment
  const result = await razorpay.orders.create({...});
  await Payment.create({...});
  
  return result;
});
```

#### 2. **Atomic Database Operations**

MongoDB atomic operators prevent lost updates:

```javascript
// ✅ Atomic - Safe
await Product.findByIdAndUpdate(
  productId,
  { $inc: { views: 1 } }
);

// ❌ Non-atomic - Race condition
const product = await Product.findById(productId);
product.views += 1;
await product.save();
```

#### 3. **Idempotency Keys**

Prevent duplicate operations from retries:

```javascript
// Client sends idempotency key
POST /api/v1/payments
Headers: {
  'Idempotency-Key': 'order_123_payment_1'
}

// Server checks if request already processed
const cached = await redis.get(`idempotency:${key}`);
if (cached) return JSON.parse(cached);

// Process and cache result for 24 hours
const result = await processPayment(...);
await redis.setex(`idempotency:${key}`, 86400, JSON.stringify(result));
```

#### 4. **Optimistic Locking**

Mongoose version control for conflict detection:

```javascript
// Enable versioning
const schema = new mongoose.Schema({...}, {
  optimisticConcurrency: true
});

// Update with retry on version conflict
try {
  await order.save();
} catch (error) {
  if (error.name === 'VersionError') {
    // Retry with fresh data
  }
}
```

#### 5. **MongoDB Transactions**

For multi-document consistency:

```javascript
const session = await mongoose.startSession();
session.startTransaction();

try {
  // Multiple operations in transaction
  await Order.create([orderData], { session });
  await Inventory.updateMany({...}, { session });
  await Credit.update({...}, { session });
  
  await session.commitTransaction();
} catch (error) {
  await session.abortTransaction();
  throw error;
} finally {
  session.endSession();
}
```

---

## 🔄 CI/CD & Deployment Automation

### GitHub Actions Workflow

**Automated Pipeline:**

```yaml
# .github/workflows/backend.yml

1. Lint & Code Quality
   - ESLint checks
   - Prettier formatting
   
2. Security Audit
   - npm audit
   - Dependency vulnerability scan
   
3. Testing
   - Unit tests (Jest)
   - Integration tests
   - Coverage threshold: 80%
   
4. Build Docker Image
   - Multi-stage build
   - Security scanning
   
5. Deploy to Staging
   - Automated on main branch
   - Health check verification
   
6. Deploy to Production
   - Manual approval required
   - Blue-green deployment
   - Automatic rollback on failure
```

### Docker Multi-Stage Build

**Optimized Dockerfile:**

```dockerfile
# Stage 1: Dependencies
FROM node:18-alpine AS deps
COPY package*.json ./
RUN npm ci --only=production

# Stage 2: Build
FROM node:18-alpine AS builder
COPY . .
COPY --from=deps /node_modules ./node_modules

# Stage 3: Production
FROM node:18-alpine
WORKDIR /app
COPY --from=builder /node_modules ./node_modules
COPY --from=builder /src ./src
USER node
EXPOSE 5000
CMD ["node", "server.js"]
```

### Deployment Strategies

**Zero-Downtime Deployment (PM2):**

```bash
# Rolling restart - instances restart one at a time
pm2 reload ecosystem.config.js --update-env

# Health check before routing traffic
pm2 start ecosystem.config.js --wait-ready
```

**Blue-Green Deployment (Docker/K8s):**

```bash
# Deploy new version (green)
docker-compose -f docker-compose.green.yml up -d

# Health check green environment
./scripts/health-check.sh green

# Switch traffic from blue to green
./scripts/switch-traffic.sh blue green

# Keep blue for rollback capability
```

---

## 🩺 Troubleshooting

### Common Issues & Solutions

#### 1. **MongoDB Connection Failed**

```bash
Error: MongoNetworkError: connect ECONNREFUSED 127.0.0.1:27017
```

**Solutions:**
```bash
# Check if MongoDB is running
mongosh --eval "db.adminCommand('ping')"

# Start MongoDB
# Windows: net start MongoDB
# macOS: brew services start mongodb-community
# Linux: sudo systemctl start mongod

# Verify connection string in .env
MONGO_URI=mongodb://localhost:27017/b2b-ecommerce
```

#### 2. **Redis Connection Failed**

```bash
Error: Redis connection to 127.0.0.1:6379 failed
```

**Solutions:**
```bash
# Check if Redis is running
redis-cli ping

# Start Redis
# Windows: redis-server.exe
# macOS: brew services start redis
# Linux: sudo systemctl start redis

# Check Redis configuration
redis-cli CONFIG GET bind
```

#### 3. **Port Already in Use**

```bash
Error: listen EADDRINUSE: address already in use :::5000
```

**Solutions:**
```bash
# Find process using port 5000
# Windows: netstat -ano | findstr :5000
# macOS/Linux: lsof -i :5000

# Kill the process
# Windows: taskkill /PID <pid> /F
# macOS/Linux: kill -9 <pid>

# Or change port in .env
PORT=5001
```

#### 4. **JWT Token Invalid**

```bash
Error: jwt malformed / jwt expired
```

**Solutions:**
- Verify `JWT_SECRET` in `.env` matches between frontend/backend
- Check token expiration (`JWT_EXPIRES_IN`)
- Clear browser localStorage and re-login
- Ensure token format: `Bearer <token>`

#### 5. **Payment Webhook Not Received**

**Solutions:**
- Verify webhook URL in Razorpay dashboard
- Ensure server is publicly accessible (use ngrok for local testing)
- Check webhook signature verification logic
- Review `logs/http.log` for incoming webhook requests
- Verify `RAZORPAY_WEBHOOK_SECRET` in `.env`

#### 6. **Queue Jobs Not Processing**

**Solutions:**
```bash
# Check Redis connection
redis-cli PING

# Verify workers are running
pm2 list | grep workers

# Check queue health
redis-cli KEYS "bull:*:waiting"

# Restart workers
pm2 restart b2b-workers

# View worker logs
pm2 logs b2b-workers
```

#### 7. **High Memory Usage**

**Solutions:**
```bash
# Check memory usage
pm2 monit

# Increase Node.js memory limit
NODE_OPTIONS="--max-old-space-size=4096" node server.js

# Enable memory restart in PM2
pm2 start server.js --max-memory-restart 1G

# Analyze memory leaks
node --inspect server.js
# Open chrome://inspect in Chrome
```

### Debug Mode

Enable detailed logging:

```bash
# .env
LOG_LEVEL=debug
NODE_ENV=development

# Run with inspector
npm run dev:debug

# Attach debugger on port 9229
# VS Code: F5 (Attach to Node Process)
```

### Health Check Debugging

```bash
# Detailed health check
curl http://localhost:5000/api/v1/health/detailed

# Expected output
{
  "status": "UP",
  "services": {
    "mongodb": { "status": "UP", "responseTime": "5ms" },
    "redis": { "status": "UP", "responseTime": "2ms" }
  },
  "memory": {...},
  "uptime": 3600
}
```

---

## 📖 Documentation

### Complete Documentation Suite

All comprehensive documentation is located in the `/code-guide` directory:

#### Architecture & Design
- **[architecture.md](code-guide/architecture.md)** - System architecture, layers, components, design principles
- **[backend-flow.md](code-guide/backend-flow.md)** - Complete request lifecycle, auth/authz flows, example scenarios
- **[folder-structure.md](code-guide/folder-structure.md)** - Project organization, module structure, naming conventions

#### Core Systems
- **[authentication-flow.md](code-guide/authentication-flow.md)** - JWT strategy, RBAC, 2FA, session management
- **[payment-system.md](code-guide/payment-system.md)** - Razorpay integration, webhooks, refunds, credit system
- **[inventory-system.md](code-guide/inventory-system.md)** - Stock management, reservations, distributed locks
- **[queue-workers.md](code-guide/queue-workers.md)** - BullMQ architecture, 8 queues, cron jobs, monitoring

#### Infrastructure
- **[redis-caching.md](code-guide/redis-caching.md)** - Cache strategies, distributed locking, session store
- **[concurrency-handling.md](code-guide/concurrency-handling.md)** - Race conditions, atomic operations, transactions
- **[error-handling.md](code-guide/error-handling.md)** - Custom errors, centralized handler, Winston logging

#### Operations
- **[testing-guide.md](code-guide/testing-guide.md)** - Jest config, unit/integration/E2E tests, coverage
- **[deployment-guide.md](code-guide/deployment-guide.md)** - Production checklist, PM2, Docker, scaling
- **[security-hardening.md](code-guide/security-hardening.md)** - Security measures, RBAC, PCI compliance
- **[monitoring-healthchecks.md](code-guide/monitoring-healthchecks.md)** - Logging, metrics, Sentry, health endpoints

#### API Design
- **[api-patterns.md](code-guide/api-patterns.md)** - RESTful design, response formatting, pagination, versioning

### Project Architecture Files

Located in `/ProjectDetails`:
- **COMPLETE SYSTEM ARCHITECTURE** - High-level system overview
- **DEVELOPMENT ORDER** - Module implementation sequence
- **INDIVIDUAL WORKFLOWS** - Business process flows
- **features** - Feature list and capabilities
- **projectStructure** - Detailed folder structure

### API Documentation
- **Swagger UI:** `http://localhost:5000/api-docs`
- **OpenAPI Spec:** `src/docs/openapi.yaml`
- **Postman Collection:** `src/docs/postman.json`
- **API Guidelines:** `src/docs/api-guidelines.md`

---

## 🤝 Contributing

### Development Workflow

1. **Clone & Setup**
   ```bash
   git clone <repository-url>
   cd b2b-backend
   npm install
   cp .env.example .env
   ```

2. **Create Feature Branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Make Changes**
   - Follow existing code patterns
   - Add tests for new features
   - Update documentation

4. **Run Tests**
   ```bash
   npm run lint
   npm test
   npm run test:coverage
   ```

5. **Commit Changes**
   ```bash
   git add .
   git commit -m "feat: add new feature"
   ```

   **Commit Message Format:**
   ```
   feat: Add new feature
   fix: Fix bug
   docs: Update documentation
   test: Add tests
   refactor: Refactor code
   chore: Update dependencies
   ```

6. **Push & Create PR**
   ```bash
   git push origin feature/your-feature-name
   ```

### Code Standards

**ESLint Rules:**
- Enforced via pre-commit hooks (Husky)
- Run manually: `npm run lint`
- Auto-fix: `npm run lint:fix`

**Prettier Formatting:**
- Auto-formats on save (if configured in IDE)
- Run manually: `npm run format`

**Testing Requirements:**
- Unit tests for all services
- Integration tests for API endpoints
- Minimum 80% code coverage
- All tests must pass before merge

### Pull Request Guidelines

**PR Template:**
```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] Manual testing completed

## Checklist
- [ ] Code follows project style
- [ ] Self-review completed
- [ ] Comments added for complex logic
- [ ] Documentation updated
- [ ] No console.log statements
- [ ] Environment variables documented
```

### Project Maintainers

- **Lead Developer:** [Name]
- **DevOps:** [Name]
- **QA Lead:** [Name]

### Getting Help

- **Issues:** [GitHub Issues](repository-issues-url)
- **Discussions:** [GitHub Discussions](repository-discussions-url)
- **Wiki:** [Project Wiki](repository-wiki-url)

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **Node.js Community** - For the amazing ecosystem
- **MongoDB** - For reliable database solutions
- **Redis** - For high-performance caching
- **Razorpay** - For seamless payment integration
- **Open Source Contributors** - For all dependencies used

---

**Built with ❤️ by Mokshith Enterprises**

*Last Updated: May 2026*

## 🔧 Troubleshooting

### Common Issues

#### **Issue:** `Cannot connect to MongoDB`
**Solution:**
```bash
# Check if MongoDB is running
mongosh mongodb://localhost:27017

# Verify MONGO_URI in .env
# Ensure MongoDB service is started
```

#### **Issue:** `Redis connection refused`
**Solution:**
```bash
# Check if Redis is running
redis-cli ping

# Verify REDIS_HOST and REDIS_PORT in .env
# Start Redis service
```

#### **Issue:** `JWT token invalid`
**Solution:**
- Verify `JWT_SECRET` is set in `.env`
- Ensure token is sent in `Authorization: Bearer <token>` header
- Check token expiration

#### **Issue:** `Razorpay signature verification failed`
**Solution:**
- Verify `RAZORPAY_KEY_SECRET` in `.env`
- Check webhook payload format
- Ensure webhook is sent from Razorpay IP

#### **Issue:** `Tests failing with "jest is not defined"`
**Solution:**
- Ensure `@jest/globals` is installed
- Verify `NODE_OPTIONS=--experimental-vm-modules` is set
- Check `tests/setup.js` imports

#### **Issue:** `Port 5000 already in use`
**Solution:**
```bash
# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:5000 | xargs kill -9

# Or change PORT in .env
```

### Debug Mode

```bash
# Enable debug logs
DEBUG=* npm run dev

# Or set in .env
LOG_LEVEL=debug
```

### Getting Help

1. Check documentation in `/code-guide` folder
2. Review API documentation at `/api-docs`
3. Check logs in `/logs` folder
4. Contact DevOps team or create an issue

---

## 📖 Documentation

Detailed documentation is available in the `/code-guide` directory:

- **[Architecture](code-guide/architecture.md)** - System design and component overview
- **[Backend Flow](code-guide/backend-flow.md)** - Request/response lifecycle
- **[Folder Structure](code-guide/folder-structure.md)** - Project organization
- **[Authentication Flow](code-guide/authentication-flow.md)** - Auth implementation details
- **[Payment System](code-guide/payment-system.md)** - Payment processing workflow
- **[Inventory System](code-guide/inventory-system.md)** - Stock management
- **[Queue Workers](code-guide/queue-workers.md)** - Async job processing
- **[Redis Caching](code-guide/redis-caching.md)** - Cache strategies
- **[Testing Guide](code-guide/testing-guide.md)** - Testing practices
- **[Security Hardening](code-guide/security-hardening.md)** - Security implementation
- **[Deployment Guide](code-guide/deployment-guide.md)** - Deployment procedures
- **[Monitoring & Health Checks](code-guide/monitoring-healthchecks.md)** - Observability
- **[API Patterns](code-guide/api-patterns.md)** - API design standards
- **[Concurrency Handling](code-guide/concurrency-handling.md)** - Race condition prevention
- **[Error Handling](code-guide/error-handling.md)** - Error management patterns

---

## 🤝 Contributing

### Development Workflow

1. Create a feature branch: `git checkout -b feature/your-feature`
2. Make changes and write tests
3. Run linter: `npm run lint:fix`
4. Format code: `npm run format`
5. Run tests: `npm test`
6. Commit with meaningful message
7. Push and create pull request

### Code Standards
- Follow ESLint configuration
- Use Prettier for formatting
- Write tests for new features
- Update documentation
- Add JSDoc comments for functions
- Use meaningful variable names
- Keep functions small and focused

### Git Commit Messages
```
feat: Add new feature
fix: Bug fix
docs: Documentation changes
style: Code formatting
refactor: Code restructuring
test: Test updates
chore: Build/config changes
```

---

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

## 👥 Team & Support

**Developed by:** Mokshith Enterprises Development Team  
**Last Updated:** May 2026  
**Node.js Version:** 18.x  
**Framework:** Express 4.22.2  
**Database:** MongoDB 8.x

---

## 🚀 Quick Start Commands

```bash
# Install dependencies
npm install

# Setup environment
cp .env.example .env

# Start development server
npm run dev

# Run tests
npm test

# Check code quality
npm run validate

# Build for production
npm start
```

---

**Happy Coding! 🎉**
