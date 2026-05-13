import * as repo from './cart.repository.js';
import Product from '../product/product.model.js';
import AppError from '../../errors/AppError.js';
import mongoose from 'mongoose';

export const addToCart = async (userId, { productId, quantity }) => {
  // Input validation
  if (!mongoose.Types.ObjectId.isValid(productId)) {
    throw new AppError('Invalid product ID', 400);
  }

  if (!quantity || quantity < 1) {
    throw new AppError('Quantity must be at least 1', 400);
  }

  let cart = await repo.findCartByUser(userId);

  // 🔥 Optimized: Only select necessary fields
  const product = await Product.findById(productId)
    .select('name minOrderQty moq stock price basePrice isActive')
    .lean();
    
  if (!product) throw new AppError('Product not found', 404);
  
  if (!product.isActive) {
    throw new AppError('Product is not available', 400);
  }

  // 🔥 Wholesale MOQ validation
  const minQty = product.minOrderQty || product.moq || 1;
  if (quantity < minQty) {
    throw new AppError(`Minimum order quantity for ${product.name} is ${minQty}`, 400);
  }

  // 🔥 Stock validation
  if (product.stock && product.stock < quantity) {
    throw new AppError('Insufficient stock', 400);
  }

  if (!cart) {
    return repo.createCart({
      userId,
      items: [{ productId, quantity }],
    });
  }

  const existingItem = cart.items.find(
    (item) => item.productId._id.toString() === productId.toString()
  );

  if (existingItem) {
    existingItem.quantity += quantity;
    // Validate updated quantity against MOQ
    if (existingItem.quantity < minQty) {
      existingItem.quantity = minQty;
    }
  } else {
    cart.items.push({ productId, quantity });
  }

  return cart.save();
};

export const getCart = async (userId) => {
  return repo.findCartByUser(userId);
};

export const removeFromCart = async (userId, productId) => {
  if (!mongoose.Types.ObjectId.isValid(productId)) {
    throw new AppError('Invalid product ID', 400);
  }

  const cart = await repo.findCartByUser(userId);

  if (!cart) throw new AppError('Cart not found', 404);

  cart.items = cart.items.filter(
    (item) => item.productId._id.toString() !== productId.toString()
  );

  return cart.save();
};