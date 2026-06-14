import { describe, expect, it, beforeEach, afterEach } from '@jest/globals';
import {
  assertDestructiveOperationAllowed,
  APPLICATION_DATABASE_NAME,
} from '../../src/utils/destructiveGuard.js';

describe('destructiveGuard', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('blocks destructive operations in production', () => {
    process.env.NODE_ENV = 'production';
    process.env.DESTRUCTIVE_CONFIRM = 'I_UNDERSTAND_DATA_LOSS';

    expect(() => assertDestructiveOperationAllowed('test-op')).toThrow(/production/i);
  });

  it('requires explicit confirmation outside production', () => {
    process.env.NODE_ENV = 'development';
    delete process.env.DESTRUCTIVE_CONFIRM;

    expect(() => assertDestructiveOperationAllowed('test-op')).toThrow(/DESTRUCTIVE_CONFIRM/i);
  });

  it('uses test as the application database name', () => {
    expect(APPLICATION_DATABASE_NAME).toBe('test');
  });
});
