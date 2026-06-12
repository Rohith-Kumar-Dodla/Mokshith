import { jest, beforeAll, afterAll } from '@jest/globals';
import { setupTestDB, teardownTestDB } from './helpers/testUtils.js';

// Environment flags are set in tests/env.setup.js before modules load.

// Setup before all tests with extended timeout
beforeAll(async () => {
  console.log('🚀 Starting global test setup...');
  
  try {
    await setupTestDB();
    console.log('✅ Test database setup complete');
  } catch (error) {
    console.error('❌ Failed to setup test database:', error);
    throw error;
  }
}, 60000);

// Teardown after all tests with extended timeout
afterAll(async () => {
  console.log('🧹 Starting global test teardown...');
  
  try {
    await teardownTestDB();
    console.log('✅ Test database teardown complete');
  } catch (error) {
    console.error('❌ Failed to teardown test database:', error);
    // Don't throw - allow process to exit
  }
  
  // Give async operations time to complete
  await new Promise(resolve => setTimeout(resolve, 500));
}, 60000);

// Suppress console logs in tests (optional - can be disabled for debugging)
const SUPPRESS_LOGS = process.env.SUPPRESS_TEST_LOGS !== 'false';

if (SUPPRESS_LOGS) {
  global.console = {
    ...console,
    log: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };
}

// Handle unhandled promise rejections in tests
process.on('unhandledRejection', (reason, promise) => {
  console.error('🚨 Unhandled Promise Rejection in tests:', reason);
  // Don't exit - let Jest handle it
});

// Handle uncaught exceptions in tests
process.on('uncaughtException', (error) => {
  console.error('🚨 Uncaught Exception in tests:', error);
  // Don't exit - let Jest handle it
});
