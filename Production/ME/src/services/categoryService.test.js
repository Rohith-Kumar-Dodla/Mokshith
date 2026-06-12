import { describe, it, expect, beforeEach, vi } from 'vitest';
import categoryService from './categoryService';
import api from './api';

vi.mock('./api', () => ({
  default: {
    get: vi.fn(),
  },
}));

describe('categoryService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls categories list endpoint', async () => {
    api.get.mockResolvedValue({
      data: {
        success: true,
        data: [{ _id: 'cat-1', name: 'Grains' }],
      },
    });

    await categoryService.getCategories();

    expect(api.get).toHaveBeenCalledWith('/categories');
  });

  it('calls category by id endpoint', async () => {
    api.get.mockResolvedValue({
      data: {
        success: true,
        data: { _id: 'cat-1', name: 'Grains' },
      },
    });

    await categoryService.getCategoryById('cat-1');

    expect(api.get).toHaveBeenCalledWith('/categories/cat-1');
  });
});
