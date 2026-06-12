import { describe, it, expect } from 'vitest';
import { mapBackendWishlist, mapBackendWishlistItem } from './wishlistMapper';

describe('wishlistMapper', () => {
  it('maps populated wishlist items', () => {
    const item = mapBackendWishlistItem({
      productId: {
        _id: 'prod-1',
        name: 'Basmati Rice',
        price: 120,
        stock: 50,
        moq: 5,
        categoryId: { name: 'Grains' },
        imageUrl: 'https://example.com/rice.jpg',
      },
    });

    expect(item.productId).toBe('prod-1');
    expect(item.productName).toBe('Basmati Rice');
    expect(item.category).toBe('Grains');
    expect(item.status).toBe('active');
  });

  it('returns empty wishlist when payload is null', () => {
    expect(mapBackendWishlist(null)).toEqual({ id: null, items: [] });
  });

  it('maps wishlist document with items array', () => {
    const mapped = mapBackendWishlist({
      _id: 'wish-1',
      items: [
        {
          productId: {
            _id: 'prod-2',
            name: 'Toor Dal',
            price: 90,
            stock: 0,
            moq: 2,
          },
        },
      ],
    });

    expect(mapped.id).toBe('wish-1');
    expect(mapped.items).toHaveLength(1);
    expect(mapped.items[0].status).toBe('out_of_stock');
  });
});
