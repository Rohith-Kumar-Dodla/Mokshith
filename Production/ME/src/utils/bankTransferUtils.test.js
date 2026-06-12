import { describe, it, expect } from 'vitest';
import { mapPaymentProofStatus, mapPaymentProof } from './bankTransferUtils';

describe('bankTransferUtils', () => {
  it('maps backend payment proof statuses to UI values', () => {
    expect(mapPaymentProofStatus('PENDING')).toBe('pending_verification');
    expect(mapPaymentProofStatus('APPROVED')).toBe('approved');
    expect(mapPaymentProofStatus('REJECTED')).toBe('rejected');
  });

  it('maps payment proof document', () => {
    const mapped = mapPaymentProof({
      _id: 'proof-1',
      orderId: 'order-1',
      utrNumber: 'UTR123',
      screenshot: '/uploads/proof.png',
      status: 'PENDING',
      amount: 5000,
      createdAt: '2026-06-01T10:00:00.000Z',
    });

    expect(mapped.id).toBe('proof-1');
    expect(mapped.utrNumber).toBe('UTR123');
    expect(mapped.status).toBe('pending_verification');
    expect(mapped.amount).toBe(5000);
  });

  it('returns null for empty proof', () => {
    expect(mapPaymentProof(null)).toBeNull();
  });
});
