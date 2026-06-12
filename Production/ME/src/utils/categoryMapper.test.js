import { describe, it, expect } from 'vitest';
import { mapBackendCategory, mapBackendCategories } from './categoryMapper';

describe('categoryMapper', () => {
  describe('mapBackendCategory', () => {
    it('maps backend category to frontend card shape', () => {
      const mapped = mapBackendCategory({
        _id: 'cat-1',
        name: 'Grains',
        slug: 'grains',
        parentId: null,
        isActive: true,
      });

      expect(mapped.id).toBe('cat-1');
      expect(mapped._id).toBe('cat-1');
      expect(mapped.name).toBe('Grains');
      expect(mapped.description).toContain('Grains');
      expect(mapped.image).toBeTruthy();
      expect(mapped.productCount).toBe(0);
      expect(mapped.status).toBe('active');
    });

    it('maps inactive categories', () => {
      const mapped = mapBackendCategory({ _id: 'cat-2', name: 'Dairy', isActive: false });
      expect(mapped.status).toBe('inactive');
    });
  });

  describe('mapBackendCategories', () => {
    it('maps an array of categories', () => {
      const mapped = mapBackendCategories([
        { _id: 'cat-1', name: 'Grains', isActive: true },
        { _id: 'cat-2', name: 'Dairy', isActive: true },
      ]);

      expect(mapped).toHaveLength(2);
      expect(mapped[0].id).toBe('cat-1');
      expect(mapped[1].id).toBe('cat-2');
    });
  });
});
