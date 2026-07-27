export const REQUIRED_DESTRUCTIVE_CONFIRM = 'I_UNDERSTAND_DATA_LOSS';

// APPLICATION_DATABASE_NAME moved to centralized resolver. Keep a local alias for compatibility.
import { LEGACY_APPLICATION_DATABASE_NAME, getNodeEnv, isDatabaseAllowed, getAllowedDatabases } from '../config/environmentResolver.js';
export const APPLICATION_DATABASE_NAME = LEGACY_APPLICATION_DATABASE_NAME;

/**
 * Multi-layered production detection.
 * Uses multiple checks to ensure production is correctly identified.
 */
export function isProduction() {
  // Primary check: NODE_ENV
  if (process.env.NODE_ENV === 'production') {
    return true;
  }

  // Secondary check: Database name from environment resolver
  const expectedDb = process.env.APP_DATABASE_NAME || 
                     (process.env.NODE_ENV && process.env.NODE_ENV !== 'development' ? 
                      getAppDatabaseName() : null);
  if (expectedDb === 'mokshith-production') {
    return true;
  }

  // Tertiary check: Render-specific environment variables
  if (process.env.RENDER === 'true' || process.env.RENDER_SERVICE_ID) {
    // If on Render, check if we're not in a dev environment
    if (process.env.RENDER_ENVIRONMENT !== 'dev' && 
        process.env.RENDER_ENVIRONMENT !== 'preview') {
      return true;
    }
  }

  // Quaternary check: Explicit production flag
  if (process.env.IS_PRODUCTION === 'true') {
    return true;
  }

  return false;
}

/**
 * Check if current environment is development.
 */
export function isDevelopment() {
  const nodeEnv = getNodeEnv();
  return nodeEnv === 'development' || nodeEnv === 'dev';
}

/**
 * Check if current environment is test.
 */
export function isTest() {
  return process.env.NODE_ENV === 'test' || 
         process.env.JEST_WORKER_ID !== undefined ||
         process.env.VITEST === 'true';
}

/**
 * Check if the current database is a production database.
 */
export function isProductionDatabase(dbName) {
  if (!dbName) return false;
  return dbName === 'mokshith-production';
}

/**
 * Check if the current database is a development database.
 */
export function isDevelopmentDatabase(dbName) {
  if (!dbName) return false;
  return dbName === 'mokshith-dev' || dbName === 'test' || dbName === LEGACY_APPLICATION_DATABASE_NAME;
}

/**
 * Assert that we are NOT in production.
 * Throws if production is detected.
 */
export function assertNotProduction(operationLabel = 'Operation') {
  if (isProduction()) {
    throw new Error(
      `BLOCKED: "${operationLabel}" cannot run in production environment. ` +
      `Current NODE_ENV="${process.env.NODE_ENV || 'unset'}". ` +
      `Atlas production data must be preserved.`
    );
  }
}

/**
 * Assert that we are NOT connected to a production database.
 * Throws if production database is detected.
 */
export function assertNotProductionDatabase(dbName, operationLabel = 'Operation') {
  if (isProductionDatabase(dbName)) {
    throw new Error(
      `BLOCKED: "${operationLabel}" cannot run against production database "${dbName}". ` +
      `Production database operations are blocked to prevent data loss.`
    );
  }
}

/**
 * Guard destructive maintenance scripts (seed, reset, wipe).
 * Blocked entirely in production; requires explicit confirmation elsewhere.
 */
export function assertDestructiveOperationAllowed(operationLabel) {
  assertNotProduction(operationLabel);

  if (process.env.DESTRUCTIVE_CONFIRM !== REQUIRED_DESTRUCTIVE_CONFIRM) {
    throw new Error(
      `BLOCKED: "${operationLabel}" requires explicit confirmation.\n` +
        `Set DESTRUCTIVE_CONFIRM=${REQUIRED_DESTRUCTIVE_CONFIRM} and re-run only if you intend to destroy data.`
    );
  }
}

/**
 * Ensure scripts connect to the intended Atlas application database.
 */
export function assertExpectedApplicationDatabase(dbName, { allowInMemory = false } = {}) {
  if (allowInMemory && process.env.USE_IN_MEMORY_MONGO === 'true') {
    return;
  }

  if (process.env.NODE_ENV === 'test') {
    return;
  }

  // Additional safety: Never allow production database connection for destructive scripts
  assertNotProductionDatabase(dbName, 'Database connection');

  // Use centralized resolver policy
  const nodeEnv = getNodeEnv();
  if (!isDatabaseAllowed(nodeEnv, dbName, { allowInMemory })) {
    const allowed = getAllowedDatabases(nodeEnv);
    throw new Error(
      `Wrong database selected: "${dbName}". Allowed databases for NODE_ENV="${nodeEnv}" are: ${JSON.stringify(allowed)}. Aborting to prevent data loss.`
    );
  }
}

export function logDestructiveWarning(operationLabel) {
  console.error('');
  console.error('⚠️  DESTRUCTIVE OPERATION WARNING');
  console.error(`⚠️  ${operationLabel}`);
  console.error('⚠️  This will permanently delete business data from MongoDB Atlas.');
  console.error('⚠️  Production execution is blocked.');
  console.error(
    `⚠️  To proceed in non-production, set DESTRUCTIVE_CONFIRM=${REQUIRED_DESTRUCTIVE_CONFIRM}`
  );
  console.error('');
}

/**
 * Additional production-safety guard.
 *
 * Usage:
 *  - Call before any operation that may remove many documents or drop databases/collections.
 *  - When running in production this will refuse:
 *     - seed/reset scripts
 *     - dropDatabase / dropCollection
 *     - deleteMany without a non-empty filter
 */
export function assertProductionSafe(operationLabel, { filter } = {}) {
  if (!isProduction()) {
    return;
  }

  // Never allow seed/reset/drop operations in production
  throw new Error(
    `Destructive database operation blocked in production: "${operationLabel}". ` +
      'Manual administrative actions only.'
  );
}

/**
 * Safe guard for any potentially destructive operation.
 * This is the main entry point that should be used throughout the application.
 */
export function assertSafeDestructiveOperation(operationLabel, options = {}) {
  const { 
    allowInProduction = false, 
    allowInTest = true,
    requireConfirmation = true 
  } = options;

  // Always block in production unless explicitly allowed
  if (isProduction() && !allowInProduction) {
    throw new Error(
      `BLOCKED: "${operationLabel}" is not allowed in production. ` +
      `Set allowInProduction=true to override (not recommended).`
    );
  }

  // Allow in test environment by default
  if (isTest() && allowInTest) {
    return;
  }

  // Require confirmation in non-production environments
  if (requireConfirmation && process.env.DESTRUCTIVE_CONFIRM !== REQUIRED_DESTRUCTIVE_CONFIRM) {
    throw new Error(
      `BLOCKED: "${operationLabel}" requires explicit confirmation.\n` +
        `Set DESTRUCTIVE_CONFIRM=${REQUIRED_DESTRUCTIVE_CONFIRM} to proceed.`
    );
  }
}

export default {
  REQUIRED_DESTRUCTIVE_CONFIRM,
  APPLICATION_DATABASE_NAME,
  isProduction,
  isDevelopment,
  isTest,
  isProductionDatabase,
  isDevelopmentDatabase,
  assertNotProduction,
  assertNotProductionDatabase,
  assertDestructiveOperationAllowed,
  assertExpectedApplicationDatabase,
  logDestructiveWarning,
  assertProductionSafe,
  assertSafeDestructiveOperation,
};
