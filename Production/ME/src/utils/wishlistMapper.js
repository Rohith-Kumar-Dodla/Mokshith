import {
  deriveProductStatus,
  getCategoryName,
  mapBackendProduct,
} from './productMapper';

export function mapBackendWishlistItem(item) {
  if (!item) {
    return null;
  }

  const rawProduct = item.productId;
  if (!rawProduct || typeof rawProduct !== 'object') {
    return null;
  }

  const product = mapBackendProduct(rawProduct);
  const productId = product.id || product._id;
  const moq = Number(rawProduct.moq ?? rawProduct.minOrderQty ?? product.minimumOrderQuantity ?? 1);
  const availableStock = Number(product.stock ?? 0);
  const imageUrl = product.imageUrl || product.image || '';
  const price = Number(product.price ?? 0);

  return {
    id: productId,
    productId,
    productName: product.name || 'Unknown Product',
    productImage: imageUrl,
    category: product.category || getCategoryName(rawProduct.categoryId),
    brand: product.brand || null,
    price,
    mrp: product.mrp ? Number(product.mrp) : null,
    wholesalePrice: price,
    rating: product.rating ?? null,
    reviews: product.reviews ?? null,
    status: deriveProductStatus(availableStock, moq),
    minimumOrderQuantity: moq,
    availableStock,
    addedDate: item.addedAt || item.createdAt || null,
    product,
  };
}

export function mapBackendWishlist(wishlist) {
  if (!wishlist) {
    return { id: null, items: [] };
  }

  const items = (wishlist.items ?? [])
    .map(mapBackendWishlistItem)
    .filter(Boolean);

  return {
    id: wishlist._id || wishlist.id || null,
    items,
    createdAt: wishlist.createdAt ?? null,
    updatedAt: wishlist.updatedAt ?? null,
  };
}
