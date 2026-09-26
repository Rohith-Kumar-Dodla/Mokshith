import * as repo from './cart.repository.js';
import Product from '../product/product.model.js';
import AppError from '../../errors/AppError.js';
import { checkStock } from '../inventory/inventory.service.js';
import mongoose from 'mongoose';
import { logger } from '../../config/logger.js';
import { isSupplierOnlyProduct } from '../product/productCatalog.utils.js';
import { calculateLinePricing, applyBestProductPromotion } from '../../utils/bulkPricing.utils.js';
import { getEligiblePromotions } from '../promotion/promotion.service.js';
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

/**
 * Cart pricing is deliberately resolved from current Product/Promotion state on
 * every read. Cart documents contain intent (product + quantity), never prices.
 */
async function withAuthoritativePricing(cart) {
  if (!cart) return cart;
  const plain = cart.toObject ? cart.toObject() : cart;
  const validItems = (plain.items || []).filter((item) => item.productId?.isActive !== false);
  const products = validItems.map((item) => item.productId).filter(Boolean);
  const promotions = await getEligiblePromotions(products.map((product) => product._id));
  let subtotal = 0;
  let discount = 0;
  const items = validItems.map((item) => {
    const pricing = applyBestProductPromotion(
      item.productId,
      item.quantity,
      calculateLinePricing(item.productId, item.quantity),
      promotions
    );
    subtotal += pricing.basePrice * Number(item.quantity);
    discount += pricing.discountAmount;
    return {
      ...item,
      pricing: {
        originalUnitPrice: pricing.basePrice,
        finalUnitPrice: pricing.unitPrice,
        discountAmount: pricing.discountAmount,
        specialDiscountAmount: pricing.specialDiscountAmount || 0,
        bulkDiscountAmount: pricing.bulkDiscountAmount || 0,
        discountPercent: pricing.discountPercent,
        itemSubtotal: pricing.itemTotal,
        pricingSource: pricing.pricingSource,
        promotionId: pricing.promotion?._id || null,
        promotionName: pricing.promotion?.name || null,
        promotionCode: pricing.promotion?.code || null,
        specialPromotionId: pricing.specialPromotion?._id || null,
        bulkPromotionId: pricing.bulkPromotion?._id || null,
      },
    };
  });
  const discountedSubtotal = subtotal - discount;
  const tax = discountedSubtotal * 0.18;
  return {
    ...plain,
    items,
    pricing: { subtotal, discount, discountedSubtotal, tax, delivery: 0, grandTotal: discountedSubtotal + tax },
  };
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
    .select('name minOrderQty moq stock price basePrice isActive categoryId catalogScope')
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

  if (isSupplierOnlyProduct(product)) {
    throw new AppError('Product is not available', 400);
  }

  const minQty = Math.max(Number(product.minOrderQty ?? 1), Number(product.moq ?? 1));
  if (quantity < minQty) {
    throw new AppError(`Minimum order quantity for ${product.name} is ${minQty}`, 400);
  }

  let cart = await loadUserCart(userId);
  const targetProductId = productId.toString();
  const existingItem = cart?.items.find(
    (item) => normalizeProductRef(item.productId) === targetProductId
  );
  const requestedQty = existingItem ? existingItem.quantity + quantity : quantity;

  await checkStock(productId, requestedQty);

  if (!cart) {
    await repo.createCart({
      userId,
      items: [{ productId, quantity }],
    });
    return withAuthoritativePricing(await repo.findCartByUser(userId));
  }

  if (existingItem) {
    existingItem.quantity += quantity;
    if (existingItem.quantity < minQty) {
      existingItem.quantity = minQty;
    }
  } else {
    cart.items.push({ productId, quantity });
  }

  await cart.save();
  return withAuthoritativePricing(await repo.findCartByUser(userId));
};

export const getCart = async (user) => {
  const userId = resolveUserId(user);

  if (!userId) {
    throw new AppError('User not authenticated', 401);
  }

  return withAuthoritativePricing(await loadUserCart(userId));
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
  return withAuthoritativePricing(await repo.findCartByUser(userId));
};

export const updateQuantity = async (user, productId, quantity) => {
  const userId = resolveUserId(user);
  if (!userId) throw new AppError('User not authenticated', 401);
  if (!mongoose.Types.ObjectId.isValid(productId)) throw new AppError('Invalid product ID', 400);

  const nextQuantity = Number(quantity);
  if (!Number.isInteger(nextQuantity) || nextQuantity < 1) {
    throw new AppError('Quantity must be a positive whole number', 400);
  }

  const product = await Product.findById(productId)
    .select('name minOrderQty moq stock isActive catalogScope')
    .lean();
  if (!product || product.isActive === false || isSupplierOnlyProduct(product)) {
    throw new AppError('Product is not available', 400);
  }

  const minQty = Math.max(Number(product.minOrderQty ?? 1), Number(product.moq ?? 1));
  if (nextQuantity < minQty) {
    throw new AppError(`Minimum order quantity for ${product.name} is ${minQty}`, 400);
  }
  await checkStock(productId, nextQuantity);

  const cart = await loadUserCart(userId);
  if (!cart) throw new AppError('Cart not found', 404);
  const item = cart.items.find((entry) => normalizeProductRef(entry.productId) === String(productId));
  if (!item) throw new AppError('Cart item not found', 404);
  item.quantity = nextQuantity;
  await cart.save();
  return withAuthoritativePricing(await repo.findCartByUser(userId));
};
