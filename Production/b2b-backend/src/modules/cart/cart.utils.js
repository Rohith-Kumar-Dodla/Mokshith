import mongoose from 'mongoose';

export function resolveUserId(user) {
  if (!user) {
    return null;
  }

  return user._id || user.id || null;
}

export function normalizeProductRef(productRef) {
  if (!productRef) {
    return null;
  }

  if (typeof productRef === 'string') {
    return productRef;
  }

  if (productRef._id) {
    return productRef._id.toString();
  }

  if (productRef.id) {
    return productRef.id.toString();
  }

  if (typeof productRef.toString === 'function' && mongoose.Types.ObjectId.isValid(productRef)) {
    return productRef.toString();
  }

  return null;
}

export function pruneStaleCartItems(cart) {
  if (!cart?.items?.length) {
    return false;
  }

  const validItems = cart.items.filter((item) => normalizeProductRef(item.productId));

  if (validItems.length === cart.items.length) {
    return false;
  }

  cart.items = validItems;
  cart.markModified('items');
  return true;
}
