import { describe, it, expect } from 'vitest';
import {
  deriveProductStatus,
  mapBackendProduct,
  mapBackendProducts,
  normalizeBulkPricing,
  getBulkPriceForQuantity,
  applyClientProductFilters,
} from './productMapper';

describe('productMapper', () => {
  describe('deriveProductStatus', () => {
    it('returns out_of_stock when stock is 0', () => {
      expect(deriveProductStatus(0, 10)).toBe('out_of_stock');
    });

    it('returns low_stock when stock is below moq', () => {
      expect(deriveProductStatus(5, 10)).toBe('low_stock');
    });

    it('returns inactive when isActive is false', () => {
      expect(deriveProductStatus(100, 10, false)).toBe('inactive');
    });

    it('returns active when stock meets moq', () => {
      expect(deriveProductStatus(50, 10)).toBe('active');
    });
  });

  describe('normalizeBulkPricing', () => {
    it('supports minQty field', () => {
      const tiers = normalizeBulkPricing([{ minQty: 10, price: 90 }], 100);
      expect(tiers[0].minQty).toBe(10);
      expect(tiers[0].minQuantity).toBe(10);
    });

    it('supports minQuantity field during transition', () => {
      const tiers = normalizeBulkPricing([{ minQuantity: 25, price: 80 }], 100);
      expect(tiers[0].minQty).toBe(25);
      expect(tiers[0].minQuantity).toBe(25);
    });

    it('computes discount from base price when missing', () => {
      const tiers = normalizeBulkPricing([{ minQty: 10, price: 80 }], 100);
      expect(tiers[0].discount).toBe(20);
    });
  });

  describe('mapBackendProduct', () => {
    it('maps backend fields to frontend shape', () => {
      const mapped = mapBackendProduct({
        _id: 'prod-1',
        name: 'Rice',
        price: 100,
        stock: 50,
        moq: 10,
        isActive: true,
        categoryId: { _id: 'cat-1', name: 'Grains' },
        bulkPricing: [{ minQuantity: 20, price: 90 }],
        imageUrl: 'https://example.com/rice.jpg',
      });

      expect(mapped.id).toBe('prod-1');
      expect(mapped._id).toBe('prod-1');
      expect(mapped.category).toBe('Grains');
      expect(mapped.categoryId).toBe('cat-1');
      expect(mapped.status).toBe('active');
      expect(mapped.minimumOrderQuantity).toBe(10);
      expect(mapped.imageUrl).toBe('https://example.com/rice.jpg');
      expect(mapped.rating).toBe(4);
      expect(mapped.reviews).toBe(0);
    });

    it('derives out_of_stock status', () => {
      const mapped = mapBackendProduct({ _id: '1', stock: 0, moq: 5 });
      expect(mapped.status).toBe('out_of_stock');
    });
  });

  describe('mapBackendProducts', () => {
    it('maps an array of products', () => {
      const mapped = mapBackendProducts([
        { _id: '1', stock: 10, moq: 5 },
        { _id: '2', stock: 0, moq: 5 },
      ]);
      expect(mapped).toHaveLength(2);
      expect(mapped[0].status).toBe('active');
      expect(mapped[1].status).toBe('out_of_stock');
    });
  });

  describe('getBulkPriceForQuantity', () => {
    it('returns tier price for matching quantity', () => {
      const product = mapBackendProduct({
        _id: '1',
        price: 100,
        stock: 100,
        moq: 1,
        bulkPricing: [
          { minQty: 10, price: 90 },
          { minQty: 50, price: 80 },
        ],
      });

      expect(getBulkPriceForQuantity(product, 25)).toBe(90);
      expect(getBulkPriceForQuantity(product, 60)).toBe(80);
    });
  });

  describe('applyClientProductFilters', () => {
    const products = mapBackendProducts([
      {
        _id: '1',
        name: 'Basmati Rice',
        price: 100,
        stock: 50,
        moq: 10,
        categoryId: { _id: 'cat-1', name: 'Grains' },
        brand: 'India Gate',
      },
      {
        _id: '2',
        name: 'Wheat Flour',
        price: 50,
        stock: 0,
        moq: 5,
        categoryId: { _id: 'cat-2', name: 'Flour' },
        brand: 'Aashirvaad',
      },
    ]);

    it('filters by categoryIds', () => {
      const filtered = applyClientProductFilters(products, { categoryIds: ['cat-1'] });
      expect(filtered).toHaveLength(1);
      expect(filtered[0].name).toBe('Basmati Rice');
    });

    it('filters by availability', () => {
      const filtered = applyClientProductFilters(products, { availability: 'out_of_stock' });
      expect(filtered).toHaveLength(1);
      expect(filtered[0].name).toBe('Wheat Flour');
    });
  });
});
