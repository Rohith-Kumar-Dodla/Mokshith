import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import Redis from 'ioredis-mock';
import { jest } from '@jest/globals';

let mongoServer;
let redisClient;

// Setup test database
export const setupTestDB = async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);
};

// Teardown test database
export const teardownTestDB = async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
  }
  if (mongoServer) {
    await mongoServer.stop();
  }
};

// Clear all collections
export const clearDatabase = async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany();
  }
};

// Setup Redis mock
export const setupRedis = () => {
  redisClient = new Redis();
  return redisClient;
};

// Teardown Redis
export const teardownRedis = async () => {
  if (redisClient) {
    await redisClient.flushall();
    redisClient.disconnect();
  }
};

// Mock external services
export const mockExternalServices = () => {
  // Mock Razorpay
  jest.mock('razorpay', () => {
    return jest.fn().mockImplementation(() => ({
      orders: {
        create: jest.fn().mockResolvedValue({
          id: 'order_mock123',
          amount: 10000,
          currency: 'INR',
          status: 'created',
        }),
        fetch: jest.fn().mockResolvedValue({
          id: 'order_mock123',
          status: 'paid',
        }),
      },
      payments: {
        fetch: jest.fn().mockResolvedValue({
          id: 'pay_mock123',
          order_id: 'order_mock123',
          status: 'captured',
          amount: 10000,
        }),
        capture: jest.fn().mockResolvedValue({
          id: 'pay_mock123',
          status: 'captured',
        }),
        refund: jest.fn().mockResolvedValue({
          id: 'rfnd_mock123',
          amount: 10000,
          status: 'processed',
        }),
      },
    }));
  });

  // Mock SendGrid/Email
  jest.mock('../../src/services/email.service.js', () => ({
    sendEmail: jest.fn().mockResolvedValue(true),
    sendOTPEmail: jest.fn().mockResolvedValue(true),
    sendOrderConfirmation: jest.fn().mockResolvedValue(true),
  }));

  // Mock Socket.IO
  jest.mock('socket.io', () => ({
    Server: jest.fn().mockImplementation(() => ({
      emit: jest.fn(),
      to: jest.fn().mockReturnThis(),
      in: jest.fn().mockReturnThis(),
    })),
  }));

  // Mock BullMQ
  jest.mock('bullmq', () => ({
    Queue: jest.fn().mockImplementation(() => ({
      add: jest.fn().mockResolvedValue({ id: 'job123' }),
      process: jest.fn(),
      close: jest.fn(),
    })),
    Worker: jest.fn().mockImplementation(() => ({
      on: jest.fn(),
      close: jest.fn(),
    })),
  }));
};

// Generate test user data
export const generateTestUser = (overrides = {}) => ({
  name: 'Test User',
  email: `test${Date.now()}@example.com`,
  mobile: `98765${Math.floor(Math.random() * 100000)}`,
  password: 'Test@1234',
  role: 'B2B_CUSTOMER',
  status: 'ACTIVE',
  ...overrides,
});

// Generate test product data
export const generateTestProduct = (overrides = {}) => ({
  name: 'Test Product',
  sku: `TEST-${Date.now()}`,
  price: 1000,
  stock: 100,
  moq: 10,
  categoryId: new mongoose.Types.ObjectId(),
  vendorId: new mongoose.Types.ObjectId(),
  isActive: true,
  ...overrides,
});

// Generate test order data
export const generateTestOrder = (overrides = {}) => ({
  customerId: new mongoose.Types.ObjectId(),
  items: [
    {
      productId: new mongoose.Types.ObjectId(),
      quantity: 10,
      price: 1000,
    },
  ],
  totalAmount: 10000,
  status: 'PENDING',
  ...overrides,
});

// Wait for async operations
export const waitFor = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Create authenticated request context
export const createAuthContext = (user) => ({
  user,
  ip: '127.0.0.1',
  headers: {
    authorization: `Bearer mock_token_${user._id}`,
  },
});

// Mock request object
export const mockRequest = (data = {}) => ({
  body: {},
  params: {},
  query: {},
  headers: {},
  user: null,
  ip: '127.0.0.1',
  ...data,
});

// Mock response object
export const mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  res.header = jest.fn().mockReturnValue(res);
  res.cookie = jest.fn().mockReturnValue(res);
  res.clearCookie = jest.fn().mockReturnValue(res);
  return res;
};

// Mock next function
export const mockNext = () => jest.fn();

// Verify JWT token structure
export const verifyTokenStructure = (token) => {
  expect(token).toBeDefined();
  expect(typeof token).toBe('string');
  expect(token.split('.')).toHaveLength(3);
};

// Verify password hash
export const verifyPasswordHash = (hash) => {
  expect(hash).toBeDefined();
  expect(typeof hash).toBe('string');
  expect(hash.length).toBeGreaterThan(50);
};

// Assert error response
export const assertErrorResponse = (error, statusCode, message) => {
  expect(error).toBeDefined();
  expect(error.statusCode).toBe(statusCode);
  if (message) {
    expect(error.message).toContain(message);
  }
};

// Assert validation error
export const assertValidationError = (error, field) => {
  assertErrorResponse(error, 400);
  if (field) {
    expect(error.message.toLowerCase()).toContain(field.toLowerCase());
  }
};

// Create test factories
export const factories = {
  user: generateTestUser,
  product: generateTestProduct,
  order: generateTestOrder,
};

export default {
  setupTestDB,
  teardownTestDB,
  clearDatabase,
  setupRedis,
  teardownRedis,
  mockExternalServices,
  generateTestUser,
  generateTestProduct,
  generateTestOrder,
  waitFor,
  createAuthContext,
  mockRequest,
  mockResponse,
  mockNext,
  verifyTokenStructure,
  verifyPasswordHash,
  assertErrorResponse,
  assertValidationError,
  factories,
};
