import { describe, it, expect } from 'vitest';
import {
  clampCartQuantity,
  getDefaultCartQuantity,
  getLinePricingPreview,
  getSelectionTotals,
  isProductSelectable,
} from './bulkAddToCartUtils';

const product = {
  id: 'p1',
  name: 'Rice',
  price: 100,
  minimumOrderQuantity: 5,
  stock: 20,
  status: 'active',
  bulkPricing: [{ minQuantity: 5, price: 90 }],
};

describe('bulkAddToCartUtils', () => {
  it('defaults quantity to MOQ when MOQ is greater than 1', () => {
    expect(getDefaultCartQuantity(product)).toBe(5);
  });

  it('defaults quantity to 1 when MOQ is missing', () => {
    expect(getDefaultCartQuantity({ price: 100 })).toBe(1);
  });

  it('clamps quantity to MOQ and stock', () => {
    expect(clampCartQuantity(product, 1)).toBe(5);
    expect(clampCartQuantity(product, 6)).toBe(6);
    expect(clampCartQuantity(product, 50)).toBe(20);
  });

  it('does not treat out-of-stock products as selectable', () => {
    expect(isProductSelectable({ status: 'out_of_stock' })).toBe(false);
    expect(isProductSelectable({ status: 'active' })).toBe(true);
  });

  it('uses existing bulk pricing for the line preview', () => {
    const preview = getLinePricingPreview(product, 6);
    expect(preview.unitPrice).toBe(90);
    expect(preview.lineTotal).toBe(540);
    expect(preview.bulkApplied).toBe(true);
    expect(preview.discountPerItem).toBe(10);
  });

  it('sums selected line totals', () => {
    expect(
      getSelectionTotals([
        { quantity: 5, lineTotal: 450 },
        { quantity: 2, lineTotal: 200 },
      ])
    ).toEqual({ totalItems: 7, estimatedTotal: 650 });
  });
});
