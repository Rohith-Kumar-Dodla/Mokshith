import { describe, it, expect } from '@jest/globals';
import {
  getBulkUnitPrice,
  getLegacyDiscountPercent,
  calculateLinePricing,
  validateBulkPricingTiers,
} from '../../src/utils/bulkPricing.utils.js';

describe('bulkPricing.utils', () => {
  describe('getBulkUnitPrice', () => {
    const tiers = [
      { minQuantity: 5, price: 90 },
      { minQuantity: 10, price: 80 },
      { minQuantity: 20, price: 70 },
    ];

    it('returns base price when quantity is below all tiers', () => {
      expect(getBulkUnitPrice(100, tiers, 4)).toBe(100);
    });

    it('returns tier price at exact threshold', () => {
      expect(getBulkUnitPrice(100, tiers, 5)).toBe(90);
      expect(getBulkUnitPrice(100, tiers, 10)).toBe(80);
      expect(getBulkUnitPrice(100, tiers, 20)).toBe(70);
    });

    it('returns highest applicable tier between thresholds', () => {
      expect(getBulkUnitPrice(100, tiers, 7)).toBe(90);
      expect(getBulkUnitPrice(100, tiers, 15)).toBe(80);
      expect(getBulkUnitPrice(100, tiers, 25)).toBe(70);
    });

    it('returns base price when no tiers configured', () => {
      expect(getBulkUnitPrice(100, [], 10)).toBe(100);
      expect(getBulkUnitPrice(100, null, 10)).toBe(100);
    });
  });

  describe('getLegacyDiscountPercent', () => {
    it('returns correct legacy discount percentages', () => {
      expect(getLegacyDiscountPercent(4)).toBe(0);
      expect(getLegacyDiscountPercent(5)).toBe(5);
      expect(getLegacyDiscountPercent(10)).toBe(10);
      expect(getLegacyDiscountPercent(15)).toBe(15);
      expect(getLegacyDiscountPercent(20)).toBe(20);
      expect(getLegacyDiscountPercent(25)).toBe(20);
    });
  });

  describe('calculateLinePricing', () => {
    const productWithTiers = {
      price: 100,
      bulkPricing: [
        { minQuantity: 5, price: 90 },
        { minQuantity: 10, price: 80 },
      ],
    };

    it('uses product bulk pricing when configured', () => {
      const result = calculateLinePricing(productWithTiers, 7);
      expect(result.unitPrice).toBe(90);
      expect(result.discountAmount).toBe(70);
      expect(result.itemTotal).toBe(630);
      expect(result.pricingSource).toBe('bulkPricing');
    });

    it('uses legacy pricing when no bulk tiers', () => {
      const product = { price: 1000 };
      const result = calculateLinePricing(product, 10);
      expect(result.discountPercent).toBe(10);
      expect(result.itemTotal).toBe(9000);
      expect(result.pricingSource).toBe('legacy');
    });

    it('returns no discount for legacy when qty below 5', () => {
      const product = { price: 100 };
      const result = calculateLinePricing(product, 3);
      expect(result.discountPercent).toBe(0);
      expect(result.itemTotal).toBe(300);
    });
  });

  describe('validateBulkPricingTiers', () => {
    it('accepts valid tiers', () => {
      const result = validateBulkPricingTiers(
        [
          { minQuantity: 5, price: 90 },
          { minQuantity: 10, price: 80 },
        ],
        100
      );
      expect(result).toHaveLength(2);
      expect(result[0].minQuantity).toBe(5);
    });

    it('rejects duplicate quantities', () => {
      expect(() =>
        validateBulkPricingTiers(
          [
            { minQuantity: 5, price: 90 },
            { minQuantity: 5, price: 80 },
          ],
          100
        )
      ).toThrow(/duplicate/i);
    });

    it('rejects discount >= base price', () => {
      expect(() =>
        validateBulkPricingTiers([{ minQuantity: 5, price: 100 }], 100)
      ).toThrow(/less than base price/i);
    });

    it('rejects non-positive quantity', () => {
      expect(() =>
        validateBulkPricingTiers([{ minQuantity: 0, price: 90 }], 100)
      ).toThrow(/positive integer/i);
    });

    it('rejects negative tier price', () => {
      expect(() =>
        validateBulkPricingTiers([{ minQuantity: 5, price: -10 }], 100)
      ).toThrow(/positive number/i);
    });

    it('returns empty array for empty input', () => {
      expect(validateBulkPricingTiers([], 100)).toEqual([]);
    });
  });
});
