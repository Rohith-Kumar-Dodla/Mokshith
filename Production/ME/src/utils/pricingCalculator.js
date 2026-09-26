import { getBulkPriceForQuantity } from './productMapper';

export function resolveEffectiveUnitPrice({ apiPricing, product, quantity }) {
  const qty = Number(quantity ?? 0);
  const basePrice = Number(product?.price ?? 0);

  if (apiPricing?.final != null && !Number.isNaN(Number(apiPricing.final))) {
    const unitPrice = Number(apiPricing.final);
    return {
      unitPrice,
      total: unitPrice * qty,
      discount: Number(apiPricing.discount ?? Math.max(basePrice - unitPrice, 0)),
      source: 'api',
      bulkApplied: unitPrice < basePrice,
    };
  }

  const unitPrice = getBulkPriceForQuantity(product, qty);
  return {
    unitPrice,
    total: unitPrice * qty,
    discount: Math.max(basePrice - unitPrice, 0),
    source: 'bulkPricing',
    bulkApplied: unitPrice < basePrice,
  };
}

export function getMoqUnitPrice(product) {
  const moq = Number(product?.minimumOrderQuantity ?? product?.moq ?? 1);
  return resolveEffectiveUnitPrice({ apiPricing: null, product, quantity: moq });
}

export function calculateCartTotals(cartItems = []) {
  const originalSubtotal = cartItems.reduce((sum, item) => sum + Number(item.unitPrice ?? 0) * Number(item.quantity ?? 0), 0);
  const bulkDiscount = cartItems.reduce((sum, item) => sum + Number(item.discountAmount ?? (Number(item.unitPrice ?? 0) - Number(item.bulkPrice ?? 0)) * Number(item.quantity ?? 0)), 0);
  const discountedSubtotal = cartItems.reduce((sum, item) => sum + Number(item.subtotal ?? 0), 0);
  const tax = discountedSubtotal * 0.18;
  const grandTotal = discountedSubtotal + tax;
  const itemCount = cartItems.length;

  return {
    subtotal: discountedSubtotal,
    originalSubtotal,
    discountedSubtotal,
    bulkDiscount,
    discount: bulkDiscount,
    tax,
    grandTotal,
    itemCount,
  };
}
