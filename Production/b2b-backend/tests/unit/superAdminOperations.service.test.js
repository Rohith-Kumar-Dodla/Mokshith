import { describe, expect, test } from '@jest/globals';
import { dateRange, listTransactions } from '../../src/modules/superAdmin/operations.service.js';

describe('Super Admin V2 operations', () => {
  test('uses deterministic Asia/Kolkata boundaries for a selected date', () => {
    const range = dateRange({ startDate: '2026-09-29', endDate: '2026-09-29' });
    expect(range.start.toISOString()).toBe('2026-09-28T18:30:00.000Z');
    expect(range.end.toISOString()).toBe('2026-09-29T18:29:59.999Z');
  });

  test('rejects reversed date ranges', () => {
    expect(() => dateRange({ startDate: '2026-09-30', endDate: '2026-09-29' })).toThrow('Invalid date range');
  });

  test('does not fabricate supplier payment records', async () => {
    const result = await listTransactions({ type: 'supplier', page: 1, limit: 20 });
    expect(result.transactions).toEqual([]);
    expect(result.authoritativeSourceAvailable).toBe(true);
    expect(result.summary.totalAmount).toBe(0);
  });
});
