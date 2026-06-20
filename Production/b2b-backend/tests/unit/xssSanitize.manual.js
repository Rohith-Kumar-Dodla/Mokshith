import { xssSanitizeMiddleware } from '../../src/middlewares/xssSanitize.middleware.js';
import { logger } from '../../src/config/logger.js';

// Simple mock logger to avoid console noise during tests
logger.debug = () => {};

// Converted to proper Jest test file. Keep as historical manual runner, but no-op to avoid double runs.
console.log('xssSanitize.manual.js preserved as archive; use xssSanitize.test.js for automated tests.');
