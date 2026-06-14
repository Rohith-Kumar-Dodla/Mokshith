import { describe, it, expect } from '@jest/globals';
import { normalizeProductRef, pruneStaleCartItems } from '../../src/modules/cart/cart.utils.js';
import mongoose from 'mongoose';

describe('cart.utils', () => {
  it('normalizes populated product references', () => {
    const productId = new mongoose.Types.ObjectId();
    expect(normalizeProductRef({ _id: productId })).toBe(productId.toString());
  });

  it('normalizes raw ObjectId references', () => {
    const productId = new mongoose.Types.ObjectId();
    expect(normalizeProductRef(productId)).toBe(productId.toString());
  });

  it('returns null for missing product references', () => {
    expect(normalizeProductRef(null)).toBeNull();
  });

  it('prunes stale cart items with null populated products', () => {
    const validId = new mongoose.Types.ObjectId();
    const cart = {
      items: [
        { productId: { _id: validId }, quantity: 2 },
        { productId: null, quantity: 1 },
      ],
      markModified() {},
    };

    const pruned = pruneStaleCartItems(cart);

    expect(pruned).toBe(true);
    expect(cart.items).toHaveLength(1);
    expect(normalizeProductRef(cart.items[0].productId)).toBe(validId.toString());
  });
});
