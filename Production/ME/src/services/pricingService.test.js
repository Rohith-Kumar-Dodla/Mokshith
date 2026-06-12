import { describe, it, expect, beforeEach, vi } from 'vitest';
import pricingService from './pricingService';
import api from './api';

vi.mock('./api', () => ({
  default: {
    post: vi.fn(),
  },
}));

describe('pricingService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls pricing endpoint with price and quantity', async () => {
    api.post.mockResolvedValue({
      data: {
        success: true,
        message: 'Price calculated',
        data: {
          original: 100,
          final: 90,
          quantity: 50,
          discount: 10,
        },
      },
    });

    await pricingService.calculatePrice({ price: 100, quantity: 50 });

    expect(api.post).toHaveBeenCalledWith('/pricing', {
      price: 100,
      quantity: 50,
    });
  });
});
