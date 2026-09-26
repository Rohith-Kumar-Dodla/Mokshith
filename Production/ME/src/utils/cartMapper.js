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
  const apiPricing = item.pricing
    ? { original: item.pricing.originalUnitPrice, final: item.pricing.finalUnitPrice, discount: item.pricing.discountAmount }
    : null;
  const pricing = resolveEffectiveUnitPrice({ apiPricing, product, quantity });
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
    subtotal: Number(item.pricing?.itemSubtotal ?? bulkPrice * quantity),
    discountAmount: Number(item.pricing?.discountAmount ?? pricing.discount * quantity),
    specialDiscountAmount: Number(item.pricing?.specialDiscountAmount ?? 0),
    bulkDiscountAmount: Number(item.pricing?.bulkDiscountAmount ?? 0),
    pricingSource: item.pricing?.pricingSource || pricing.source,
    promotionName: item.pricing?.promotionName || null,
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

  const mapped = {
    id: cart._id || cart.id || null,
    items,
    createdAt: cart.createdAt ?? null,
    updatedAt: cart.updatedAt ?? null,
  };
  if (cart.pricing) mapped.pricing = cart.pricing;
  return mapped;
}
