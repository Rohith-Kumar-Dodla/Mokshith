export const REQUIRED_DESTRUCTIVE_CONFIRM = 'I_UNDERSTAND_DATA_LOSS';

export const APPLICATION_DATABASE_NAME = 'test';

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

  const expected = process.env.APP_DATABASE_NAME?.trim() || APPLICATION_DATABASE_NAME;

  if (dbName !== expected) {
    throw new Error(
      `Wrong database selected: "${dbName}". Expected application database "${expected}". Aborting to prevent data loss.`
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

export default {
  REQUIRED_DESTRUCTIVE_CONFIRM,
  APPLICATION_DATABASE_NAME,
  assertDestructiveOperationAllowed,
  assertExpectedApplicationDatabase,
  logDestructiveWarning,
};
