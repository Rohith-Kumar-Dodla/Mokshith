import { describe, expect, it } from '@jest/globals';
import { normalizeLoginIdentifier } from '../../src/utils/loginIdentifier.js';

describe('normalizeLoginIdentifier', () => {
  it('normalizes 10-digit mobile numbers', () => {
    expect(normalizeLoginIdentifier('9876543210')).toEqual({
      email: null,
      mobile: '9876543210',
      raw: '9876543210',
    });
  });

  it('strips +91 country code', () => {
    expect(normalizeLoginIdentifier('+919876543210')).toEqual({
      email: null,
      mobile: '9876543210',
      raw: '+919876543210',
    });
  });

  it('normalizes email to lowercase', () => {
    expect(normalizeLoginIdentifier('User@Example.com')).toEqual({
      email: 'user@example.com',
      mobile: null,
      raw: 'User@Example.com',
    });
  });
});
