import { resolveEffectiveUnitPrice } from './pricingCalculator';
import { getUserFacingErrorMessage } from './apiResponse';

export function getProductId(product) {
  return product?.id || product?._id || null;
}

export function getDefaultCartQuantity(product) {
  const moq = Number(product?.minimumOrderQuantity ?? product?.moq ?? 1);
  const minQty = Number.isFinite(moq) && moq > 0 ? moq : 1;
  return Math.max(1, Math.floor(minQty));
}

export function isProductSelectable(product) {
  return Boolean(product) && product.status !== 'out_of_stock' && product.status !== 'inactive';
}

export function clampCartQuantity(product, quantity) {
  const minQty = getDefaultCartQuantity(product);
  const stock = Number(product?.stock);
  const parsed = Number(quantity);
  const next = Number.isFinite(parsed) ? Math.floor(parsed) : minQty;
  const maxQty = Number.isFinite(stock) && stock > 0 ? stock : next;
  return Math.min(Math.max(next, minQty), maxQty);
}

export function getLinePricingPreview(product, quantity) {
  const qty = clampCartQuantity(product, quantity);
  const pricing = resolveEffectiveUnitPrice({
    apiPricing: null,
    product,
    quantity: qty,
  });
  const basePrice = Number(product?.price ?? 0);

  return {
    quantity: qty,
    basePrice,
    unitPrice: pricing.unitPrice,
    lineTotal: pricing.total,
    discountPerItem: pricing.discount,
    bulkApplied: pricing.bulkApplied,
  };
}

export function getSelectionTotals(lines = []) {
  return lines.reduce(
    (acc, line) => {
      acc.totalItems += Number(line.quantity ?? 0);
      acc.estimatedTotal += Number(line.lineTotal ?? 0);
      return acc;
    },
    { totalItems: 0, estimatedTotal: 0 }
  );
}

export function getCartAddErrorMessage(error) {
  if (error instanceof Error && error.message && !error.response) {
    return error.message;
  }
  return getUserFacingErrorMessage(error, 'This product could not be added to your cart.');
}
