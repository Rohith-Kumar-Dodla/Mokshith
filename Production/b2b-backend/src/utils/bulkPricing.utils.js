/**
 * Shared bulk pricing resolver — single source of truth for product-level discounts.
 *
 * When a product has configured bulkPricing tiers, those tiers are used exclusively.
 * When no tiers are configured, legacy global quantity-percent tiers apply (backward compat).
 */

const LEGACY_DISCOUNT_TIERS = [
  { minQuantity: 20, discountPercent: 20 },
  { minQuantity: 15, discountPercent: 15 },
  { minQuantity: 10, discountPercent: 10 },
  { minQuantity: 5, discountPercent: 5 },
];

function normalizeTiers(bulkPricing) {
  if (!Array.isArray(bulkPricing) || bulkPricing.length === 0) {
    return [];
  }

  return bulkPricing
    .map((tier) => ({
      minQuantity: Number(tier.minQuantity ?? tier.minQty ?? 0),
      price: Number(tier.price ?? 0),
    }))
    .filter((tier) => tier.minQuantity > 0 && tier.price > 0)
    .sort((a, b) => a.minQuantity - b.minQuantity);
}

/**
 * Resolve the effective unit price for a given quantity.
 */
export function getBulkUnitPrice(basePrice, bulkPricing, quantity) {
  const base = Number(basePrice ?? 0);
  const qty = Number(quantity ?? 0);
  const tiers = normalizeTiers(bulkPricing);

  if (tiers.length > 0) {
    const matched = [...tiers].reverse().find((tier) => qty >= tier.minQuantity);
    return matched ? matched.price : base;
  }

  return base;
}

/**
 * Resolve legacy global percentage discount (used only when no product tiers exist).
 */
export function getLegacyDiscountPercent(quantity) {
  const qty = Number(quantity ?? 0);
  for (const tier of LEGACY_DISCOUNT_TIERS) {
    if (qty >= tier.minQuantity) {
      return tier.discountPercent;
    }
  }
  return 0;
}

/**
 * Calculate line-item pricing for an order/cart item.
 *
 * @returns {{ unitPrice, basePrice, discountAmount, discountPercent, itemTotal, pricingSource }}
 */
export function calculateLinePricing(product, quantity) {
  const basePrice = Number(product?.price ?? product?.basePrice ?? 0);
  const qty = Number(quantity ?? 0);
  const tiers = normalizeTiers(product?.bulkPricing);

  if (tiers.length > 0) {
    const unitPrice = getBulkUnitPrice(basePrice, tiers, qty);
    const discountPerUnit = Math.max(basePrice - unitPrice, 0);
    const discountAmount = discountPerUnit * qty;
    const discountPercent =
      basePrice > 0 ? Math.round((discountPerUnit / basePrice) * 100) : 0;

    return {
      unitPrice,
      basePrice,
      discountAmount,
      discountPercent,
      itemTotal: unitPrice * qty,
      pricingSource: 'bulkPricing',
    };
  }

  const discountPercent = getLegacyDiscountPercent(qty);
  const grossTotal = basePrice * qty;
  const discountAmount = grossTotal * (discountPercent / 100);
  const itemTotal = grossTotal - discountAmount;
  const unitPrice = qty > 0 ? itemTotal / qty : basePrice;

  return {
    unitPrice,
    basePrice,
    discountAmount,
    discountPercent,
    itemTotal,
    pricingSource: 'legacy',
  };
}

/** Apply product-scoped promotions without compounding quantity pricing. */
export function applyBestProductPromotion(product, quantity, quantityPricing, promotions = []) {
  const baseTotal = quantityPricing.basePrice * Number(quantity);

  const explicitPromotions = promotions.filter((promotion) => {
    if (!(promotion.promotionKind === 'SPECIAL' || promotion.promotionKind === 'BULK')) return false;
    const productIds = (promotion.productIds || []).map((id) => String(id?._id || id));
    return productIds.length === 0 || productIds.includes(String(product?._id || product?.id));
  });
  if (explicitPromotions.length > 0) {
    const qty = Number(quantity);
    const specialPromotions = explicitPromotions.filter((promotion) => promotion.promotionKind === 'SPECIAL');
    const bulkPromotions = explicitPromotions.filter((promotion) => promotion.promotionKind === 'BULK' && qty >= Number(promotion.minimumQuantity || 1));

    const calculatePromotionAmount = (promotion) => {
      const raw = promotion.discountType === 'PERCENTAGE'
        ? baseTotal * (Number(promotion.value) / 100)
        : Number(promotion.value);
      const amount = promotion.discountApplication === 'PER_UNIT' ? raw * qty : raw;
      return Math.max(0, Math.min(amount, baseTotal));
    };

    const specialPromotion = specialPromotions
      .map((promotion) => ({ promotion, amount: calculatePromotionAmount(promotion) }))
      .sort((a, b) => b.amount - a.amount)[0] || null;
    const bulkPromotion = bulkPromotions
      .map((promotion) => ({ promotion, amount: calculatePromotionAmount(promotion) }))
      .sort((a, b) => b.amount - a.amount)[0] || null;
    const specialDiscountAmount = specialPromotion?.amount || 0;
    const bulkDiscountAmount = bulkPromotion?.amount || 0;
    const discountAmount = Math.min(baseTotal, specialDiscountAmount + bulkDiscountAmount);
    const itemTotal = baseTotal - discountAmount;

    return {
      unitPrice: qty ? itemTotal / qty : quantityPricing.basePrice,
      basePrice: quantityPricing.basePrice,
      discountAmount,
      specialDiscountAmount,
      bulkDiscountAmount,
      discountPercent: quantityPricing.basePrice > 0 ? Math.round((discountAmount / baseTotal) * 100) : 0,
      itemTotal,
      pricingSource: 'combinedPromotions',
      promotion: specialPromotion?.promotion || bulkPromotion?.promotion || null,
      specialPromotion: specialPromotion?.promotion || null,
      bulkPromotion: bulkPromotion?.promotion || null,
    };
  }

  let best = { ...quantityPricing, promotion: null };

  for (const promotion of promotions) {
    const productIds = (promotion.productIds || []).map((id) => String(id?._id || id));
    if (!productIds.includes(String(product?._id || product?.id))) continue;

    let discountAmount = promotion.discountType === 'PERCENTAGE'
      ? baseTotal * (Number(promotion.value) / 100)
      : Number(promotion.value);
    if (promotion.maxDiscount != null) discountAmount = Math.min(discountAmount, Number(promotion.maxDiscount));
    discountAmount = Math.max(0, Math.min(discountAmount, baseTotal));
    const itemTotal = baseTotal - discountAmount;

    // A promotion competes with bulk/legacy pricing; discounts never compound.
    if (itemTotal < best.itemTotal) {
      best = {
        unitPrice: Number(quantity) ? itemTotal / Number(quantity) : quantityPricing.basePrice,
        basePrice: quantityPricing.basePrice,
        discountAmount,
        discountPercent: quantityPricing.basePrice > 0 ? Math.round((discountAmount / baseTotal) * 100) : 0,
        itemTotal,
        pricingSource: 'promotion',
        promotion,
      };
    }
  }
  return best;
}

/**
 * Validate bulk pricing tiers against a base product price.
 * Throws Error with message on invalid input.
 */
export function validateBulkPricingTiers(bulkPricing, basePrice) {
  if (bulkPricing === undefined || bulkPricing === null) {
    return [];
  }

  if (!Array.isArray(bulkPricing)) {
    throw new Error('bulkPricing must be an array');
  }

  if (bulkPricing.length === 0) {
    return [];
  }

  const price = Number(basePrice);
  if (!Number.isFinite(price) || price <= 0) {
    throw new Error('Base price must be a positive number to configure bulk pricing');
  }

  const seenQuantities = new Set();
  const normalized = [];

  for (const tier of bulkPricing) {
    const minQuantity = Number(tier.minQuantity ?? tier.minQty);
    const tierPrice = Number(tier.price);

    if (!Number.isInteger(minQuantity) || minQuantity <= 0) {
      throw new Error('Minimum quantity must be a positive integer');
    }

    if (!Number.isFinite(tierPrice) || tierPrice <= 0) {
      throw new Error('Tier price must be a positive number');
    }

    if (tierPrice >= price) {
      throw new Error(
        `Tier price (${tierPrice}) must be less than base price (${price})`
      );
    }

    if (seenQuantities.has(minQuantity)) {
      throw new Error(`Duplicate minimum quantity: ${minQuantity}`);
    }
    seenQuantities.add(minQuantity);

    normalized.push({ minQuantity, price: tierPrice });
  }

  normalized.sort((a, b) => a.minQuantity - b.minQuantity);
  return normalized;
}

export { normalizeTiers, LEGACY_DISCOUNT_TIERS };
