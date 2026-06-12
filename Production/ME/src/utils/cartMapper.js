import { resolveEffectiveUnitPrice } from './pricingCalculator';
import {
  deriveProductStatus,
  getCategoryName,
  mapBackendProduct,
} from './productMapper';

export function mapBackendCartItem(item) {
  if (!item) {
    return null;
  }

  const rawProduct = item.productId;
  if (!rawProduct || typeof rawProduct !== 'object') {
    return null;
  }

  const product = mapBackendProduct(rawProduct);
  const quantity = Number(item.quantity ?? 1);
  const unitPrice = Number(product.price ?? 0);
  const pricing = resolveEffectiveUnitPrice({ apiPricing: null, product, quantity });
  const bulkPrice = pricing.unitPrice;
  const imageUrl = product.imageUrl || product.image || '';
  const moq = Number(rawProduct.minOrderQty ?? rawProduct.moq ?? product.minimumOrderQuantity ?? 1);
  const availableStock = Number(product.stock ?? 0);
  const productId = product.id || product._id;

  return {
    id: productId,
    productId,
    productName: product.name || 'Unknown Product',
    productImage: imageUrl,
    category: product.category || getCategoryName(rawProduct.categoryId),
    quantity,
    unitPrice,
    bulkPrice,
    subtotal: bulkPrice * quantity,
    minimumOrderQuantity: moq,
    availableStock,
    status: deriveProductStatus(availableStock, moq),
    product,
  };
}

export function mapBackendCart(cart) {
  if (!cart) {
    return {
      id: null,
      items: [],
      createdAt: null,
      updatedAt: null,
    };
  }

  const items = (cart.items ?? [])
    .map(mapBackendCartItem)
    .filter(Boolean);

  return {
    id: cart._id || cart.id || null,
    items,
    createdAt: cart.createdAt ?? null,
    updatedAt: cart.updatedAt ?? null,
  };
}
