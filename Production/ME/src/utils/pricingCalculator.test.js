import { describe, it, expect } from 'vitest';
import { resolveEffectiveUnitPrice, getMoqUnitPrice, calculateCartTotals } from './pricingCalculator';
import { mapBackendProduct } from './productMapper';

describe('pricingCalculator', () => {
  const product = mapBackendProduct({
    _id: 'prod-1',
    price: 100,
    stock: 100,
    moq: 10,
    bulkPricing: [
      { minQuantity: 25, price: 90 },
      { minQuantity: 50, price: 80 },
    ],
  });

  it('uses API pricing when available', () => {
    const result = resolveEffectiveUnitPrice({
      apiPricing: { original: 100, final: 85, quantity: 60, discount: 15 },
      product,
      quantity: 60,
    });

    expect(result.unitPrice).toBe(85);
    expect(result.total).toBe(5100);
    expect(result.source).toBe('api');
    expect(result.bulkApplied).toBe(true);
  });

  it('falls back to bulk pricing tiers when API pricing is unavailable', () => {
    const result = resolveEffectiveUnitPrice({
      apiPricing: null,
      product,
      quantity: 30,
    });

    expect(result.unitPrice).toBe(90);
    expect(result.source).toBe('bulkPricing');
    expect(result.total).toBe(2700);
  });

  it('returns MOQ unit price from bulk tiers', () => {
    const result = getMoqUnitPrice(product);

    expect(result.unitPrice).toBe(100);
    expect(product.minimumOrderQuantity).toBe(10);
  });

  it('calculates cart totals with tax and bulk discount', () => {
    const totals = calculateCartTotals([
      {
        quantity: 30,
        unitPrice: 100,
        bulkPrice: 90,
        subtotal: 2700,
      },
      {
        quantity: 10,
        unitPrice: 50,
        bulkPrice: 50,
        subtotal: 500,
      },
    ]);

    expect(totals.subtotal).toBe(3200);
    expect(totals.bulkDiscount).toBe(300);
    expect(totals.tax).toBeCloseTo(576);
    expect(totals.grandTotal).toBeCloseTo(3776);
    expect(totals.itemCount).toBe(2);
  });
});
