export const REQUIRED_DESTRUCTIVE_CONFIRM = 'I_UNDERSTAND_DATA_LOSS';

// APPLICATION_DATABASE_NAME moved to centralized resolver. Keep a local alias for compatibility.
import { LEGACY_APPLICATION_DATABASE_NAME, getNodeEnv, isDatabaseAllowed, getAllowedDatabases } from '../config/environmentResolver.js';
export const APPLICATION_DATABASE_NAME = LEGACY_APPLICATION_DATABASE_NAME;

/**
 * Guard destructive maintenance scripts (seed, reset, wipe).
 * Blocked entirely in production; requires explicit confirmation elsewhere.
 */
export function assertDestructiveOperationAllowed(operationLabel) {
  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      `BLOCKED: "${operationLabel}" cannot run when NODE_ENV=production. Atlas data must be preserved.`
    );
  }

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
  if (process.env.NODE_ENV !== 'production') {
    return;
  }

  // Never allow seed/reset/drop operations in production
  throw new Error(
    `Destructive database operation blocked in production: "${operationLabel}". ` +
      'Manual administrative actions only.'
  );
}

export default {
  REQUIRED_DESTRUCTIVE_CONFIRM,
  APPLICATION_DATABASE_NAME,
  assertDestructiveOperationAllowed,
  assertExpectedApplicationDatabase,
  logDestructiveWarning,
  assertProductionSafe,
};
