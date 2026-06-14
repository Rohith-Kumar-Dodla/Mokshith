import Cart from './cart.model.js';

export const findCartByUser = async (userId) =>
  Cart.findOne({ userId })
    .populate({
      path: 'items.productId',
      select: 'name price stock moq minOrderQty image imageUrl imagePublicId categoryId isActive bulkPricing',
      populate: { path: 'categoryId', select: 'name' },
    });

export const createCart = async (data) => Cart.create(data);

export const updateCart = async (userId, data) =>
  Cart.findOneAndUpdate({ userId }, data, { new: true });