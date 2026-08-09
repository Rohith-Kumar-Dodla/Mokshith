import { describe, it, expect } from 'vitest';
import {
  findOrderByIdempotencyKey,
  isDefiniteOrderFailure,
  isUncertainOrderError,
} from './orderReconciliation';

describe('orderReconciliation', () => {
  it('detects timeout/network/409 as uncertain outcomes', () => {
    expect(isUncertainOrderError({ code: 'ECONNABORTED', message: 'timeout of 10000ms exceeded' })).toBe(true);
    expect(isUncertainOrderError({
      response: { status: 409, data: { message: 'Duplicate operation in progress, please retry after a moment' } },
    })).toBe(true);
    expect(isUncertainOrderError({ request: {}, message: 'Network Error' })).toBe(true);
  });

  it('treats validation/auth CSRF responses as definite failures', () => {
    expect(isDefiniteOrderFailure({ response: { status: 403, data: { message: 'CSRF token missing' } } })).toBe(true);
    expect(isDefiniteOrderFailure({ response: { status: 400, data: { message: 'Invalid' } } })).toBe(true);
    expect(isDefiniteOrderFailure({ code: 'ECONNABORTED' })).toBe(false);
  });

  it('finds orders by idempotency key', () => {
    const orders = [
      { id: '1', idempotencyKey: 'order-a' },
      { id: '2', raw: { idempotencyKey: 'order-b' } },
    ];
    expect(findOrderByIdempotencyKey(orders, 'order-b')?.id).toBe('2');
    expect(findOrderByIdempotencyKey(orders, 'missing')).toBeNull();
  });
});
