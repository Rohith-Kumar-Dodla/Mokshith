import { describe, it, expect } from 'vitest';
import {
  tiersToDiscountForm,
  discountFormToTiers,
  validateBulkDiscountForm,
} from './bulkPricingUtils';

describe('bulkPricingUtils', () => {
  describe('tiersToDiscountForm', () => {
    it('converts backend tiers to admin discount form', () => {
      const form = tiersToDiscountForm(
        [
          { minQuantity: 5, price: 90 },
          { minQuantity: 10, price: 80 },
        ],
        100
      );
      expect(form).toHaveLength(2);
      expect(form[0].minQuantity).toBe('5');
      expect(form[0].discountAmount).toBe('10');
      expect(form[1].discountAmount).toBe('20');
    });

    it('returns empty tier row when no tiers', () => {
      const form = tiersToDiscountForm([], 100);
      expect(form).toHaveLength(1);
      expect(form[0].minQuantity).toBe('');
    });
  });

  describe('discountFormToTiers', () => {
    it('converts admin form to backend tiers', () => {
      const tiers = discountFormToTiers(
        [
          { minQuantity: '5', discountAmount: '10' },
          { minQuantity: '10', discountAmount: '20' },
        ],
        100
      );
      expect(tiers).toEqual([
        { minQuantity: 5, price: 90 },
        { minQuantity: 10, price: 80 },
      ]);
    });

    it('skips empty rows', () => {
      const tiers = discountFormToTiers(
        [{ minQuantity: '', discountAmount: '' }],
        100
      );
      expect(tiers).toEqual([]);
    });
  });

  describe('validateBulkDiscountForm', () => {
    it('returns null for empty tiers', () => {
      expect(validateBulkDiscountForm([{ minQuantity: '', discountAmount: '' }], 100)).toBeNull();
    });

    it('rejects duplicate quantities', () => {
      const error = validateBulkDiscountForm(
        [
          { minQuantity: '5', discountAmount: '10' },
          { minQuantity: '5', discountAmount: '20' },
        ],
        100
      );
      expect(error).toMatch(/duplicate/i);
    });

    it('rejects discount >= base price', () => {
      const error = validateBulkDiscountForm(
        [{ minQuantity: '5', discountAmount: '100' }],
        100
      );
      expect(error).toMatch(/cannot be equal to or greater/i);
    });

    it('rejects non-positive quantity', () => {
      const error = validateBulkDiscountForm(
        [{ minQuantity: '0', discountAmount: '10' }],
        100
      );
      expect(error).toMatch(/positive integer/i);
    });
  });
});
