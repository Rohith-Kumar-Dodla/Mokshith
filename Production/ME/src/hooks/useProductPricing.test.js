import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import useProductPricing from './useProductPricing';
import pricingService from '../services/pricingService';
import { mapBackendProduct } from '../utils/productMapper';

vi.mock('../services/pricingService', () => ({
  default: {
    calculatePrice: vi.fn(),
  },
}));

describe('useProductPricing', () => {
  const product = mapBackendProduct({
    _id: 'prod-1',
    price: 100,
    stock: 100,
    moq: 10,
    bulkPricing: [{ minQuantity: 25, price: 90 }],
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('uses backend pricing response when available', async () => {
    pricingService.calculatePrice.mockResolvedValue({
      data: {
        original: 100,
        final: 85,
        quantity: 50,
        discount: 15,
      },
    });

    const { result } = renderHook(() => useProductPricing(product, 50));

    await waitFor(() => {
      expect(result.current.pricingLoading).toBe(false);
    });

    expect(pricingService.calculatePrice).toHaveBeenCalledWith({
      price: 100,
      quantity: 50,
    });
    expect(result.current.unitPrice).toBe(85);
    expect(result.current.source).toBe('api');
  });

  it('falls back to bulk pricing when API fails', async () => {
    pricingService.calculatePrice.mockRejectedValue(new Error('Pricing unavailable'));

    const { result } = renderHook(() => useProductPricing(product, 30));

    await waitFor(() => {
      expect(result.current.pricingLoading).toBe(false);
    });

    expect(result.current.unitPrice).toBe(90);
    expect(result.current.source).toBe('bulkPricing');
  });
});
