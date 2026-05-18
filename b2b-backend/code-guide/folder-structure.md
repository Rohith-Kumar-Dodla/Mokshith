# Folder Structure & Responsibilities

> **Comprehensive guide to project organization and file responsibilities**

---

## Table of Contents

- [Root Structure](#root-structure)
- [Source Code Structure](#source-code-structure)
- [Configuration Files](#configuration-files)
- [Module Structure](#module-structure)
- [Testing Structure](#testing-structure)
- [File Naming Conventions](#file-naming-conventions)

---

## Root Structure

```
b2b-backend/
├── .env                      # Environment variables (never commit)
├── .env.example              # Example environment template
├── .gitignore                # Git ignore rules
├── .dockerignore             # Docker ignore rules
├── Dockerfile                # Docker container definition
├── docker-compose.yml        # Multi-container Docker setup
├── package.json              # Dependencies and scripts
├── package-lock.json         # Locked dependency versions
├── nodemon.json              # Nodemon configuration
├── eslint.config.js          # ESLint linting rules
├── prettier.config.js        # Prettier formatting rules
├── jest.config.json          # Jest testing configuration
├── server.js                 # Application entry point
├── seed.js                   # Database seeding script
├── README.md                 # Main documentation
│
├── .github/                  # GitHub workflows (CI/CD)
├── .husky/                   # Git hooks
├── code-guide/               # Engineering documentation
├── logs/                     # Application logs
├── node_modules/             # Installed dependencies (gitignored)
├── scripts/                  # Utility scripts
├── src/                      # Source code (main application)
├── tests/                    # Test suites
├── uploads/                  # User-uploaded files (gitignored)
└── ProjectDetails/           # Legacy project documentation
```

---

## Source Code Structure

```
src/
├── app.js                    # Express app configuration
│
├── config/                   # Configuration files
│   ├── cors.js               # CORS settings
│   ├── db.js                 # MongoDB connection
│   ├── env.js                # Environment variable loader
│   ├── featureFlags.js       # Feature toggle system
│   ├── logger.js             # Winston logger setup
│   ├── queue.js              # BullMQ queue factory
│   ├── rateLimiter.js        # Rate limiting configs
│   ├── razorpay.js           # Razorpay SDK initialization
│   ├── redis.js              # Redis client setup
│   ├── security.js           # Security middleware (Helmet)
│   ├── sentry.js             # Sentry error tracking
│   └── socketAdapter.js      # Socket.io Redis adapter
│
├── constants/                # Application constants
│   ├── cacheKeys.js          # Redis cache key patterns
│   ├── creditStatus.js       # Credit status enums
│   ├── deliveryStatus.js     # Delivery status enums
│   ├── errorMessages.js      # Standard error messages
│   ├── featureFlags.js       # Feature flag keys
│   ├── fileTypes.js          # Allowed file types
│   ├── httpStatus.js         # HTTP status codes
│   ├── notificationTypes.js  # Notification type enums
│   ├── orderStatus.js        # Order status enums
│   ├── paymentStatus.js      # Payment status enums
│   ├── permissions.js        # Permission definitions
│   ├── queueNames.js         # Queue name constants
│   ├── roles.js              # User role enums
│   ├── userStatus.js         # User status enums
│   └── vendorStatus.js       # Vendor status enums
│
├── docs/                     # API documentation
│   ├── api-guidelines.md     # API design standards
│   ├── openapi.yaml          # OpenAPI/Swagger spec
│   ├── postman.json          # Postman collection
│   └── swagger.js            # Swagger UI configuration
│
├── errors/                   # Custom error classes
│   ├── AppError.js           # Base application error
│   ├── AuthError.js          # Authentication errors
│   ├── NotFoundError.js      # 404 errors
│   ├── PaymentError.js       # Payment processing errors
│   ├── PermissionError.js    # Authorization errors
│   ├── RateLimitError.js     # Rate limit exceeded
│   └── ValidationError.js    # Input validation errors
│
├── jobs/                     # Background jobs and cron
│   ├── analytics.job.js      # Analytics aggregation job
│   ├── cleanup.job.js        # Data cleanup job
│   ├── creditReminder.job.js # Credit payment reminders
│   ├── cron.js               # Cron scheduler setup
│   ├── inventorySync.job.js  # Inventory sync job
│   ├── notification.job.js   # Notification processing
│   ├── orderCleanup.job.js   # Order archival job
│   └── paymentReconcile.job.js # Payment reconciliation
│
├── middlewares/              # Express middleware
│   ├── audit.middleware.js   # Audit logging
│   ├── auth.middleware.js    # JWT authentication
│   ├── cache.middleware.js   # Response caching
│   ├── correlation.middleware.js # Request correlation IDs
│   ├── csrf.middleware.js    # CSRF protection
│   ├── errorHandler.middleware.js # Global error handler
│   ├── idempotency.middleware.js # Idempotency keys
│   ├── monitoring.middleware.js # Performance monitoring
│   ├── permission.middleware.js # Permission checks
│   ├── role.middleware.js    # Role-based access control
│   ├── securityAudit.middleware.js # Security event logging
│   ├── upload.middleware.js  # File upload handling
│   └── validate.middleware.js # Joi validation
│
├── modules/                  # Feature modules (see below)
│
├── queues/                   # BullMQ queue definitions
│   ├── audit.queue.js        # Audit log queue
│   ├── email.queue.js        # Email delivery queue
│   ├── inventory.queue.js    # Inventory sync queue
│   ├── notification.queue.js # Notification queue
│   ├── payment.queue.js      # Payment processing queue
│   └── webhook.queue.js      # Webhook handling queue
│
├── routes/                   # Route definitions
│   └── v1.routes.js          # API v1 route aggregator
│
├── services/                 # Shared services
│   ├── cache.service.js      # Cache operations
│   ├── email.service.js      # Email sending
│   ├── encryption.service.js # Data encryption
│   ├── fileUpload.service.js # File handling
│   ├── fileValidation.service.js # File validation
│   ├── fraudDetection.service.js # Fraud detection
│   ├── monitoring.service.js # Monitoring utilities
│   ├── pdf.service.js        # PDF generation
│   ├── queueManager.service.js # Queue management
│   ├── redis.service.js      # Redis operations
│   ├── s3.service.js         # AWS S3 operations
│   ├── sms.service.js        # SMS sending
│   └── twoFactorAuth.service.js # 2FA operations
│
├── utils/                    # Utility functions
│   ├── asyncHandler.js       # Async error wrapper
│   ├── cacheInvalidation.js  # Cache invalidation helpers
│   ├── cdn.js                # CDN helpers
│   ├── helpers.js            # General helpers
│   ├── pagination.js         # Pagination utilities
│   ├── passwordPolicy.js     # Password validation
│   └── queryTimeout.js       # Query timeout wrapper
│
├── validations/              # Shared validation schemas
│   └── zod.schemas.example.js # Zod schema examples
│
└── workers/                  # Queue workers
    ├── audit.worker.js       # Audit log processor
    ├── email.worker.js       # Email sender worker
    ├── image.worker.js       # Image processing worker
    ├── inventory.worker.js   # Inventory sync worker
    ├── notification.worker.js # Notification sender
    ├── payment.worker.js     # Payment processor
    └── webhook.worker.js     # Webhook handler
```

---

## Module Structure

Each feature module follows consistent structure:

```
modules/<module-name>/
├── <module>.controller.js    # HTTP request handlers
├── <module>.service.js       # Business logic
├── <module>.repository.js    # Data access layer
├── <module>.model.js         # Mongoose schema
├── <module>.routes.js        # Route definitions
├── <module>.validation.js    # Joi validation schemas
└── <module>.events.js        # Domain events (optional)
```

### Available Modules

```
modules/
├── admin/                    # Admin management
├── analytics/                # Analytics and reporting
├── audit/                    # Audit logging
├── auth/                     # Authentication
├── cart/                     # Shopping cart
├── category/                 # Product categories
├── company/                  # Company profiles
├── credit/                   # Credit management (B2B)
├── inventory/                # Inventory management
├── invoice/                  # Invoice generation
├── logistics/                # Logistics and delivery
├── notification/             # Notifications
├── order/                    # Order management
├── payment/                  # Payment processing
├── product/                  # Product catalog
├── review/                   # Product reviews
├── search/                   # Search functionality
├── settings/                 # System settings
├── shipment/                 # Shipment tracking
├── support/                  # Customer support
├── user/                     # User management
├── vendor/                   # Vendor management
├── warehouse/                # Warehouse management
└── wishlist/                 # Wishlist
```

---

## Configuration Files

### Root Configuration

| File | Purpose |
|------|---------|
| `server.js` | Application entry point, starts Express server |
| `package.json` | Dependencies, scripts, project metadata |
| `nodemon.json` | Nodemon watch configuration |
| `eslint.config.js` | ESLint rules for code quality |
| `prettier.config.js` | Prettier formatting rules |
| `jest.config.json` | Jest test configuration |
| `docker-compose.yml` | Multi-container Docker setup (app + DB + Redis) |
| `Dockerfile` | Docker container build instructions |
| `.env.example` | Environment variable template |

### Configuration Directory (`src/config/`)

| File | Purpose | Key Exports |
|------|---------|-------------|
| `db.js` | MongoDB connection | `connectDB()` |
| `redis.js` | Redis client | `redisClient` |
| `logger.js` | Winston logger | `logger` |
| `queue.js` | BullMQ factory | `createQueue()` |
| `rateLimiter.js` | Rate limit configs | `generalLimiter`, `authLimiter`, `paymentLimiter` |
| `cors.js` | CORS settings | `corsOptions` |
| `security.js` | Helmet config | `securityMiddleware()` |
| `razorpay.js` | Razorpay SDK | `razorpayInstance` |
| `env.js` | Environment loader | `env` object |
| `featureFlags.js` | Feature toggles | `isFeatureEnabled()` |

---

## Testing Structure

```
tests/
├── setup.js                  # Global test setup
│
├── unit/                     # Unit tests (isolated)
│   ├── auth.test.js          # Auth service tests
│   ├── fileValidation.test.js # File validation tests
│   ├── fraudDetection.test.js # Fraud detection tests
│   ├── passwordPolicy.test.js # Password validation tests
│   └── twoFactorAuth.test.js # 2FA tests
│
├── integration/              # Integration tests (with DB)
│   ├── auth.integration.test.js # Auth flow tests
│   ├── circuit.breaker.test.js # Circuit breaker tests
│   ├── health.endpoint.test.js # Health check tests
│   ├── inventory.concurrency.test.js # Concurrency tests
│   ├── inventory.reservation.test.js # Reservation tests
│   ├── lock.cleanup.test.js  # Distributed lock tests
│   ├── order.test.js         # Order creation tests
│   ├── partial.failure.test.js # Partial failure handling
│   ├── payment.concurrency.test.js # Payment concurrency
│   ├── payment.integration.test.js # Payment flow tests
│   ├── payment.test.js       # Payment tests
│   ├── queue.retry.test.js   # Queue retry tests
│   ├── rate.limiter.test.js  # Rate limiter tests
│   ├── refund.integration.test.js # Refund tests
│   ├── timeout.scenarios.test.js # Timeout handling
│   ├── webhook.replay.test.js # Webhook replay protection
│   └── workers.test.js       # Worker tests
│
├── e2e/                      # End-to-end tests (full flows)
│   └── order.e2e.test.js     # Complete order flow test
│
├── load/                     # Load and performance tests
│   └── load-test.js          # Autocannon load test
│
└── helpers/                  # Test utilities
    ├── fixtures.js           # Test data fixtures
    ├── mocks.js              # Mock functions
    └── testHelpers.js        # Test helper functions
```

---

## File Naming Conventions

### Consistent Naming Rules

**Controllers:**
```
<module>.controller.js
Example: product.controller.js, order.controller.js
```

**Services:**
```
<module>.service.js
Example: payment.service.js, notification.service.js
```

**Repositories:**
```
<module>.repository.js
Example: user.repository.js, inventory.repository.js
```

**Models:**
```
<module>.model.js
Example: Order.model.js, Product.model.js
(Note: Capitalize model files as they export classes)
```

**Routes:**
```
<module>.routes.js
Example: auth.routes.js, cart.routes.js
```

**Validations:**
```
<module>.validation.js
Example: product.validation.js, order.validation.js
```

**Middleware:**
```
<purpose>.middleware.js
Example: auth.middleware.js, validate.middleware.js
```

**Queues:**
```
<queueName>.queue.js
Example: email.queue.js, payment.queue.js
```

**Workers:**
```
<queueName>.worker.js
Example: email.worker.js, notification.worker.js
```

**Jobs:**
```
<jobName>.job.js
Example: paymentReconcile.job.js, cleanup.job.js
```

**Tests:**
```
<module>.test.js (unit tests)
<module>.integration.test.js (integration tests)
<module>.e2e.test.js (end-to-end tests)
```

---

## Responsibility Matrix

### Core Files

| File | Responsibility | Modifies |
|------|----------------|----------|
| `server.js` | Start HTTP server, connect DB | None |
| `app.js` | Configure Express app, middleware | None |
| `src/routes/v1.routes.js` | Aggregate all API routes | None |

### Configuration Files

| File | Responsibility | Dependencies |
|------|----------------|--------------|
| `config/db.js` | MongoDB connection with retry | mongoose |
| `config/redis.js` | Redis client with reconnect | ioredis |
| `config/logger.js` | Winston logger setup | winston |
| `config/queue.js` | BullMQ queue factory | bullmq, redis |
| `config/rateLimiter.js` | Rate limiter configs | express-rate-limit, redis |

### Module Components

| Component | Responsibility | Should NOT |
|-----------|----------------|-----------|
| **Controller** | Handle HTTP, validate input, format response | Access database directly |
| **Service** | Business logic, orchestration | Handle HTTP directly |
| **Repository** | Data access, queries | Contain business logic |
| **Model** | Schema definition, validation | Contain query logic |
| **Routes** | Define endpoints, apply middleware | Contain logic |
| **Validation** | Define Joi schemas | Perform validation (middleware does) |

### Middleware Files

| Middleware | When Applied | Purpose |
|------------|--------------|---------|
| `auth.middleware.js` | Protected routes | Verify JWT, load user |
| `role.middleware.js` | After auth | Check user role |
| `permission.middleware.js` | After role | Fine-grained permissions |
| `validate.middleware.js` | Before controller | Validate request data |
| `cache.middleware.js` | Read endpoints | Serve cached responses |
| `idempotency.middleware.js` | Write endpoints | Prevent duplicates |
| `errorHandler.middleware.js` | End of chain | Handle all errors |

---

## Adding New Modules

### Steps to Add a Feature Module

1. **Create module directory:**
   ```bash
   mkdir src/modules/newfeature
   ```

2. **Create module files:**
   ```bash
   touch src/modules/newfeature/newfeature.controller.js
   touch src/modules/newfeature/newfeature.service.js
   touch src/modules/newfeature/newfeature.repository.js
   touch src/modules/newfeature/newfeature.model.js
   touch src/modules/newfeature/newfeature.routes.js
   touch src/modules/newfeature/newfeature.validation.js
   ```

3. **Define Mongoose schema** in `model.js`
4. **Implement data access** in `repository.js`
5. **Implement business logic** in `service.js`
6. **Implement HTTP handlers** in `controller.js`
7. **Define validation schemas** in `validation.js`
8. **Define routes** in `routes.js`
9. **Register routes** in `src/routes/v1.routes.js`
10. **Write tests** in `tests/unit/` and `tests/integration/`

---

## Import Path Examples

### ES Module Imports

```javascript
// From controller
import * as service from './newfeature.service.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { protect } from '../../middlewares/auth.middleware.js';

// From service
import * as repository from './newfeature.repository.js';
import { AppError } from '../../errors/AppError.js';
import logger from '../../config/logger.js';

// From repository
import Model from './newfeature.model.js';
import { Types } from 'mongoose';
```

**Important:** Always include `.js` extension in relative imports (ES modules requirement).

---

**Document Version:** 1.0  
**Last Updated:** May 2026  
**Maintained By:** Engineering Team
