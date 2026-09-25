import { applyBestProductPromotion, calculateLinePricing } from '../../src/utils/bulkPricing.utils.js';

describe('combined special and bulk promotions', () => {
  const product = { _id: 'product-1', price: 100, bulkPricing: [] };
  const promotions = [
    { _id: 'special-1', promotionKind: 'SPECIAL', discountType: 'FLAT', discountApplication: 'PER_UNIT', value: 10, productIds: ['product-1'] },
    { _id: 'bulk-1', promotionKind: 'BULK', discountType: 'FLAT', discountApplication: 'ORDER_FLAT', value: 25, minimumQuantity: 10, productIds: ['product-1'] },
  ];

  test.each([
    [7, 70, 0, 70],
    [10, 100, 25, 125],
    [12, 120, 25, 145],
    [20, 200, 25, 225],
  ])('quantity %i applies special and qualifying bulk discount', (quantity, special, bulk, total) => {
    const result = applyBestProductPromotion(product, quantity, calculateLinePricing(product, quantity), promotions);
    expect(result.specialDiscountAmount).toBe(special);
    expect(result.bulkDiscountAmount).toBe(bulk);
    expect(result.discountAmount).toBe(special + bulk);
    expect(result.itemTotal).toBe(100 * quantity - total);
  });
});
