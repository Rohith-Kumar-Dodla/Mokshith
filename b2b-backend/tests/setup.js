import { jest, beforeAll, afterAll } from '@jest/globals';
import { setupTestDB, teardownTestDB } from './helpers/testUtils.js';
import dotenv from 'dotenv';

// Load test environment variables
dotenv.config({ path: '.env.test' });

// Set test environment
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_jwt_secret_key_for_testing';
process.env.JWT_REFRESH_SECRET = 'test_refresh_secret_key';
process.env.RAZORPAY_KEY_ID = 'test_razorpay_key';
process.env.RAZORPAY_KEY_SECRET = 'test_razorpay_secret';

// Setup before all tests
beforeAll(async () => {
  await setupTestDB();
}, 60000);

// Teardown after all tests
afterAll(async () => {
  await teardownTestDB();
}, 60000);

// Suppress console logs in tests (optional)
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};
