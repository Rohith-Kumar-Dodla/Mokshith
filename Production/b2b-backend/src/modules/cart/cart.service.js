import * as repo from './cart.repository.js';
import Product from '../product/product.model.js';
import AppError from '../../errors/AppError.js';
import mongoose from 'mongoose';
import { logger } from '../../config/logger.js';
import {
  normalizeProductRef,
  pruneStaleCartItems,
  resolveUserId,
} from './cart.utils.js';

async function loadUserCart(userId) {
  const cart = await repo.findCartByUser(userId);

  if (!cart) {
    return null;
  }

  const pruned = pruneStaleCartItems(cart);
  if (pruned) {
    logger.warn('Removed stale cart items with missing products', {
      userId: userId?.toString?.(),
      remainingItems: cart.items.length,
    });
    await cart.save();
  }

  return cart;
}

export const addToCart = async (user, { productId, quantity }) => {
  const userId = resolveUserId(user);

  if (!userId) {
    throw new AppError('User not authenticated', 401);
  }

  logger.debug('Add to cart request', {
    userId: userId.toString(),
    productId,
    quantity,
  });

  if (!mongoose.Types.ObjectId.isValid(productId)) {
    throw new AppError('Invalid product ID', 400);
  }

  if (!quantity || quantity < 1) {
    throw new AppError('Quantity must be at least 1', 400);
  }

  const product = await Product.findById(productId)
    .select('name minOrderQty moq stock price basePrice isActive categoryId')
    .lean();

  logger.debug('Add to cart product lookup', {
    productId,
    found: Boolean(product),
    isActive: product?.isActive,
    stock: product?.stock,
    categoryId: product?.categoryId?.toString?.() ?? product?.categoryId,
  });

  if (!product) {
    throw new AppError('Product not found', 404);
  }

  if (!product.isActive) {
    throw new AppError('Product is not available', 400);
  }

  const minQty = product.minOrderQty || product.moq || 1;
  if (quantity < minQty) {
    throw new AppError(`Minimum order quantity for ${product.name} is ${minQty}`, 400);
  }

  if (Number(product.stock ?? 0) < quantity) {
    throw new AppError('Insufficient stock', 400);
  }

  let cart = await loadUserCart(userId);

  if (!cart) {
    await repo.createCart({
      userId,
      items: [{ productId, quantity }],
    });
    return repo.findCartByUser(userId);
  }

  const targetProductId = productId.toString();
  const existingItem = cart.items.find(
    (item) => normalizeProductRef(item.productId) === targetProductId
  );

  if (existingItem) {
    existingItem.quantity += quantity;
    if (existingItem.quantity < minQty) {
      existingItem.quantity = minQty;
    }
  } else {
    cart.items.push({ productId, quantity });
  }

  await cart.save();
  return repo.findCartByUser(userId);
};

export const getCart = async (user) => {
  const userId = resolveUserId(user);

  if (!userId) {
    throw new AppError('User not authenticated', 401);
  }

  return loadUserCart(userId);
};

export const removeFromCart = async (user, productId) => {
  const userId = resolveUserId(user);

  if (!userId) {
    throw new AppError('User not authenticated', 401);
  }

  if (!mongoose.Types.ObjectId.isValid(productId)) {
    throw new AppError('Invalid product ID', 400);
  }

  const cart = await loadUserCart(userId);

  if (!cart) {
    throw new AppError('Cart not found', 404);
  }

  const targetProductId = productId.toString();
  cart.items = cart.items.filter(
    (item) => normalizeProductRef(item.productId) !== targetProductId
  );

  await cart.save();
  return repo.findCartByUser(userId);
};
