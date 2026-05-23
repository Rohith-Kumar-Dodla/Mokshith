# Testing Guide

> **Comprehensive guide to testing strategy, best practices, and test implementation**

---

## Table of Contents

- [Testing Strategy](#testing-strategy)
- [Test Environment Setup](#test-environment-setup)
- [Unit Testing](#unit-testing)
- [Integration Testing](#integration-testing)
- [End-to-End Testing](#end-to-end-testing)
- [Load Testing](#load-testing)
- [Test Patterns](#test-patterns)
- [Running Tests](#running-tests)

---

## Testing Strategy

### Testing Pyramid

```
        ┌─────────────┐
        │     E2E     │  ← 10% (Slow, expensive)
        ├─────────────┤
        │ Integration │  ← 30% (Medium speed/cost)
        ├─────────────┤
        │    Unit     │  ← 60% (Fast, cheap)
        └─────────────┘
```

**Unit Tests (60%):**
- Test individual functions/services in isolation
- Fast execution (<1ms per test)
- Mock external dependencies
- Files: `tests/unit/*.test.js`

**Integration Tests (30%):**
- Test API endpoints with real database
- Test database operations
- Test middleware chains
- Files: `tests/integration/*.test.js`

**E2E Tests (10%):**
- Test complete user workflows
- Test multiple systems together
- Files: `tests/e2e/*.test.js`

---

## Test Environment Setup

### Jest Configuration

**File:** `jest.config.json`

```json
{
  "testEnvironment": "node",
  "roots": ["<rootDir>/tests"],
  "testMatch": ["**/*.test.js"],
  "coverageDirectory": "coverage",
  "coverageReporters": ["text", "lcov", "html"],
  "collectCoverageFrom": [
    "src/**/*.js",
    "!src/**/*.test.js",
    "!src/config/**",
    "!src/docs/**"
  ],
  "setupFilesAfterEnv": ["<rootDir>/tests/setup.js"],
  "testTimeout": 30000,
  "verbose": true
}
```

### Global Test Setup

**File:** `tests/setup.js`

```javascript
import { jest, beforeAll, afterAll } from '@jest/globals';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import redisClient from '../src/config/redis.js';

let mongoServer;

// Setup before all tests
beforeAll(async () => {
  // 1. Start in-memory MongoDB
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();

  // 2. Connect to test database
  await mongoose.connect(mongoUri);

  // 3. Silence console logs during tests
  global.console = {
    ...console,
    log: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn()
  };
});

// Cleanup after all tests
afterAll(async () => {
  // 1. Close database connection
  await mongoose.disconnect();
  await mongoServer.stop();

  // 2. Close Redis connection
  await redisClient.quit();
});

// Clear database between tests
afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});
```

---

## Unit Testing

### Testing Services

**File:** `tests/unit/auth.test.js`

```javascript
import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import * as authService from '../../src/modules/auth/auth.service.js';
import User from '../../src/modules/user/user.model.js';
import bcrypt from 'bcryptjs';

describe('Auth Service', () => {
  describe('login', () => {
    it('should return tokens for valid credentials', async () => {
      // Arrange
      const mockUser = {
        _id: 'user123',
        email: 'test@example.com',
        password: await bcrypt.hash('password123', 10),
        status: 'ACTIVE'
      };

      jest.spyOn(User, 'findOne').mockResolvedValue(mockUser);

      // Act
      const result = await authService.login('test@example.com', 'password123');

      // Assert
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result.user.email).toBe('test@example.com');
    });

    it('should throw error for invalid credentials', async () => {
      // Arrange
      jest.spyOn(User, 'findOne').mockResolvedValue(null);

      // Act & Assert
      await expect(
        authService.login('invalid@example.com', 'wrongpassword')
      ).rejects.toThrow('Invalid credentials');
    });

    it('should throw error for inactive user', async () => {
      // Arrange
      const mockUser = {
        _id: 'user123',
        email: 'test@example.com',
        password: await bcrypt.hash('password123', 10),
        status: 'SUSPENDED'
      };

      jest.spyOn(User, 'findOne').mockResolvedValue(mockUser);

      // Act & Assert
      await expect(
        authService.login('test@example.com', 'password123')
      ).rejects.toThrow('Account is not active');
    });
  });

  describe('generateToken', () => {
    it('should generate valid JWT tokens', () => {
      // Arrange
      const user = { _id: 'user123', email: 'test@example.com', role: 'CUSTOMER' };

      // Act
      const { accessToken, refreshToken } = authService.generateToken(user);

      // Assert
      expect(accessToken).toBeDefined();
      expect(refreshToken).toBeDefined();
      expect(typeof accessToken).toBe('string');
      expect(typeof refreshToken).toBe('string');
    });
  });
});
```

### Testing Utilities

**File:** `tests/unit/passwordPolicy.test.js`

```javascript
import { describe, it, expect } from '@jest/globals';
import { validatePassword } from '../../src/utils/passwordPolicy.js';

describe('Password Policy', () => {
  it('should validate strong password', () => {
    const result = validatePassword('Strong@123');

    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should reject short password', () => {
    const result = validatePassword('Abc@1');

    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Password must be at least 8 characters');
  });

  it('should reject password without uppercase', () => {
    const result = validatePassword('password@123');

    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Must contain uppercase letter');
  });

  it('should reject password without number', () => {
    const result = validatePassword('Password@');

    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Must contain number');
  });
});
```

---

## Integration Testing

### Testing API Endpoints

**File:** `tests/integration/auth.integration.test.js`

```javascript
import { describe, it, expect, beforeEach } from '@jest/globals';
import request from 'supertest';
import app from '../../src/app.js';
import User from '../../src/modules/user/user.model.js';
import bcrypt from 'bcryptjs';

describe('Auth API', () => {
  describe('POST /api/v1/auth/register', () => {
    it('should register new user', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'John Doe',
          email: 'john@example.com',
          password: 'Password@123'
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.userId).toBeDefined();

      // Verify user created in database
      const user = await User.findOne({ email: 'john@example.com' });
      expect(user).toBeDefined();
      expect(user.name).toBe('John Doe');
    });

    it('should reject duplicate email', async () => {
      // Create existing user
      await User.create({
        name: 'Existing User',
        email: 'existing@example.com',
        password: await bcrypt.hash('Password@123', 10)
      });

      // Try to register with same email
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'New User',
          email: 'existing@example.com',
          password: 'Password@123'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('already exists');
    });
  });

  describe('POST /api/v1/auth/login', () => {
    beforeEach(async () => {
      // Create test user
      await User.create({
        name: 'Test User',
        email: 'test@example.com',
        password: await bcrypt.hash('Password@123', 10),
        status: 'ACTIVE'
      });
    });

    it('should login with valid credentials', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'test@example.com',
          password: 'Password@123'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.token).toBeDefined();
      expect(response.body.refreshToken).toBeDefined();
      expect(response.body.user.email).toBe('test@example.com');
    });

    it('should reject invalid password', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'test@example.com',
          password: 'WrongPassword@123'
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });
});
```

### Testing Order Flow

**File:** `tests/integration/order.test.js`

```javascript
import { describe, it, expect, beforeEach } from '@jest/globals';
import request from 'supertest';
import app from '../../src/app.js';
import User from '../../src/modules/user/user.model.js';
import Product from '../../src/modules/product/product.model.js';
import Inventory from '../../src/modules/inventory/inventory.model.js';

describe('Order API', () => {
  let authToken;
  let userId;
  let productId;

  beforeEach(async () => {
    // Create test user
    const user = await User.create({
      name: 'Test User',
      email: 'test@example.com',
      password: 'hashedpassword',
      status: 'ACTIVE'
    });
    userId = user._id;

    // Generate token
    const loginResponse = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'test@example.com', password: 'Password@123' });

    authToken = loginResponse.body.token;

    // Create test product
    const product = await Product.create({
      name: 'Test Product',
      price: 1000,
      category: 'Electronics',
      stock: 100
    });
    productId = product._id;

    // Create inventory
    await Inventory.create({
      productId: product._id,
      totalStock: 100,
      availableStock: 100,
      reservedStock: 0
    });
  });

  it('should create order with valid items', async () => {
    const response = await request(app)
      .post('/api/v1/orders')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        items: [
          { productId, quantity: 2 }
        ],
        shippingAddress: {
          street: '123 Main St',
          city: 'Mumbai',
          state: 'Maharashtra',
          pincode: '400001'
        }
      });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.order).toBeDefined();
    expect(response.body.order.status).toBe('PENDING');

    // Verify inventory reserved
    const inventory = await Inventory.findOne({ productId });
    expect(inventory.reservedStock).toBe(2);
    expect(inventory.availableStock).toBe(98);
  });

  it('should reject order with insufficient stock', async () => {
    const response = await request(app)
      .post('/api/v1/orders')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        items: [
          { productId, quantity: 150 } // More than available
        ],
        shippingAddress: {
          street: '123 Main St',
          city: 'Mumbai',
          state: 'Maharashtra',
          pincode: '400001'
        }
      });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain('Insufficient stock');
  });

  it('should require authentication', async () => {
    const response = await request(app)
      .post('/api/v1/orders')
      .send({
        items: [{ productId, quantity: 1 }]
      });

    expect(response.status).toBe(401);
  });
});
```

---

## End-to-End Testing

**File:** `tests/e2e/order.e2e.test.js`

```javascript
import { describe, it, expect } from '@jest/globals';
import request from 'supertest';
import app from '../../src/app.js';

describe('Complete Order Flow (E2E)', () => {
  it('should complete full order lifecycle', async () => {
    // 1. Register user
    const registerResponse = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'E2E Test User',
        email: 'e2e@example.com',
        password: 'Password@123'
      });

    expect(registerResponse.status).toBe(201);

    // 2. Login
    const loginResponse = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'e2e@example.com',
        password: 'Password@123'
      });

    const { token } = loginResponse.body;

    // 3. Browse products
    const productsResponse = await request(app)
      .get('/api/v1/products')
      .set('Authorization', `Bearer ${token}`);

    expect(productsResponse.status).toBe(200);
    const product = productsResponse.body.data[0];

    // 4. Add to cart
    const cartResponse = await request(app)
      .post('/api/v1/cart/add')
      .set('Authorization', `Bearer ${token}`)
      .send({
        productId: product._id,
        quantity: 2
      });

    expect(cartResponse.status).toBe(200);

    // 5. Create order
    const orderResponse = await request(app)
      .post('/api/v1/orders')
      .set('Authorization', `Bearer ${token}`)
      .send({
        items: [{ productId: product._id, quantity: 2 }],
        shippingAddress: {
          street: '123 Main St',
          city: 'Mumbai',
          state: 'Maharashtra',
          pincode: '400001'
        }
      });

    expect(orderResponse.status).toBe(201);
    const orderId = orderResponse.body.order._id;

    // 6. Get order details
    const orderDetailsResponse = await request(app)
      .get(`/api/v1/orders/${orderId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(orderDetailsResponse.status).toBe(200);
    expect(orderDetailsResponse.body.order.status).toBe('PENDING');

    // 7. Process payment (mock)
    // ...payment simulation...

    // 8. Verify order updated
    // ...

  });
});
```

---

## Load Testing

**File:** `tests/load/load-test.js`

```javascript
import autocannon from 'autocannon';

const run = async () => {
  const result = await autocannon({
    url: 'http://localhost:5000',
    connections: 100, // Concurrent connections
    duration: 30, // Test duration in seconds
    requests: [
      {
        method: 'GET',
        path: '/health'
      },
      {
        method: 'GET',
        path: '/api/v1/products'
      }
    ]
  });

  console.log('Load Test Results:');
  console.log(`Requests: ${result.requests.total}`);
  console.log(`Throughput: ${result.throughput.total} req/s`);
  console.log(`Latency (p95): ${result.latency.p95}ms`);
  console.log(`Errors: ${result.errors}`);
};

run().catch(console.error);
```

---

## Test Patterns

### AAA Pattern (Arrange-Act-Assert)

```javascript
it('should do something', async () => {
  // Arrange - Set up test data
  const user = await createTestUser();
  const product = await createTestProduct();

  // Act - Execute the code under test
  const result = await createOrder(user.id, product.id);

  // Assert - Verify the result
  expect(result).toBeDefined();
  expect(result.status).toBe('PENDING');
});
```

### Test Helpers

**File:** `tests/helpers/fixtures.js`

```javascript
import User from '../../src/modules/user/user.model.js';
import Product from '../../src/modules/product/product.model.js';
import bcrypt from 'bcryptjs';

export const createTestUser = async (overrides = {}) => {
  return await User.create({
    name: 'Test User',
    email: `test${Date.now()}@example.com`,
    password: await bcrypt.hash('Password@123', 10),
    status: 'ACTIVE',
    ...overrides
  });
};

export const createTestProduct = async (overrides = {}) => {
  return await Product.create({
    name: 'Test Product',
    price: 1000,
    category: 'Electronics',
    stock: 100,
    ...overrides
  });
};

export const getAuthToken = async (email = 'test@example.com') => {
  const loginResponse = await request(app)
    .post('/api/v1/auth/login')
    .send({ email, password: 'Password@123' });

  return loginResponse.body.token;
};
```

---

## Running Tests

### Commands

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test file
npm test -- tests/unit/auth.test.js

# Run in watch mode (TDD)
npm run test:watch

# Run only unit tests
npm run test:unit

# Run only integration tests
npm run test:integration

# Run only E2E tests
npm run test:e2e

# Run load tests
npm run test:load
```

### Coverage Report

```bash
npm run test:coverage

# View HTML report
open coverage/index.html
```

**Target Coverage:**
- Statements: >80%
- Branches: >75%
- Functions: >80%
- Lines: >80%

---

**Document Version:** 1.0  
**Last Updated:** May 2026  
**Maintained By:** Engineering Team
