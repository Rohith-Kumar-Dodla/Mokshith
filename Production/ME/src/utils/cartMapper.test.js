import { describe, it, expect } from 'vitest';
import { mapBackendCartItem, mapBackendCart } from './cartMapper';

describe('cartMapper', () => {
  const backendItem = {
    productId: {
      _id: 'prod-1',
      name: 'Basmati Rice',
      price: 100,
      stock: 50,
      moq: 10,
      minOrderQty: 10,
      imageUrl: 'https://example.com/rice.jpg',
      bulkPricing: [
        { minQuantity: 25, price: 90 },
        { minQuantity: 50, price: 80 },
      ],
      categoryId: { _id: 'cat-1', name: 'Grains' },
    },
    quantity: 30,
  };

  it('maps backend cart item to frontend shape', () => {
    const mapped = mapBackendCartItem(backendItem);

    expect(mapped.id).toBe('prod-1');
    expect(mapped.productId).toBe('prod-1');
    expect(mapped.productName).toBe('Basmati Rice');
    expect(mapped.productImage).toBe('https://example.com/rice.jpg');
    expect(mapped.quantity).toBe(30);
    expect(mapped.unitPrice).toBe(100);
    expect(mapped.bulkPrice).toBe(90);
    expect(mapped.subtotal).toBe(2700);
    expect(mapped.minimumOrderQuantity).toBe(10);
    expect(mapped.availableStock).toBe(50);
    expect(mapped.status).toBe('active');
    expect(mapped.product).toBeDefined();
  });

  it('falls back to image when imageUrl is missing', () => {
    const mapped = mapBackendCartItem({
      productId: {
        _id: 'prod-2',
        name: 'Dal',
        price: 50,
        stock: 20,
        moq: 5,
        image: 'https://example.com/dal.jpg',
      },
      quantity: 5,
    });

    expect(mapped.productImage).toBe('https://example.com/dal.jpg');
  });

  it('maps MOQ from minOrderQty when present', () => {
    const mapped = mapBackendCartItem({
      productId: {
        _id: 'prod-3',
        name: 'Oil',
        price: 200,
        stock: 30,
        minOrderQty: 15,
        moq: 10,
      },
      quantity: 15,
    });

    expect(mapped.minimumOrderQuantity).toBe(15);
  });

  it('applies bulk pricing tiers to subtotal', () => {
    const mapped = mapBackendCartItem({
      productId: {
        _id: 'prod-4',
        name: 'Sugar',
        price: 40,
        stock: 100,
        moq: 5,
        bulkPricing: [{ minQuantity: 20, price: 35 }],
      },
      quantity: 20,
    });

    expect(mapped.bulkPrice).toBe(35);
    expect(mapped.subtotal).toBe(700);
  });

  it('handles missing bulkPricing with base price', () => {
    const mapped = mapBackendCartItem({
      productId: {
        _id: 'prod-5',
        name: 'Salt',
        price: 10,
        stock: 100,
        moq: 5,
      },
      quantity: 10,
    });

    expect(mapped.bulkPrice).toBe(10);
    expect(mapped.subtotal).toBe(100);
  });

  it('maps null cart to empty items', () => {
    const mapped = mapBackendCart(null);

    expect(mapped.items).toEqual([]);
    expect(mapped.id).toBeNull();
  });

  it('maps cart with multiple items and filters invalid entries', () => {
    const mapped = mapBackendCart({
      _id: 'cart-1',
      items: [backendItem, { productId: null, quantity: 1 }],
    });

    expect(mapped.id).toBe('cart-1');
    expect(mapped.items).toHaveLength(1);
  });
});
