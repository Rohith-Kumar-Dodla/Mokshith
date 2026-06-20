import { mongoSanitizeMiddleware } from '../../src/middlewares/mongoSanitize.middleware.js';
import { logger } from '../../src/config/logger.js';

// Simple mock logger to avoid console noise during tests
logger.warn = () => {};

// Converted to proper Jest test file. Keep as historical manual runner, but no-op to avoid double runs.
console.log('mongoSanitize.manual.js preserved as archive; use mongoSanitize.test.js for automated tests.');
