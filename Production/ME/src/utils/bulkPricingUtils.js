/**
 * Admin-side bulk discount helpers.
 * Admin enters minQuantity + discountAmount; backend stores minQuantity + price.
 */

export function tiersToDiscountForm(tiers = [], basePrice = 0) {
  if (!Array.isArray(tiers) || tiers.length === 0) {
    return [{ minQuantity: '', discountAmount: '' }];
  }

  return tiers.map((tier) => {
    const minQuantity = tier.minQuantity ?? tier.minQty ?? '';
    const tierPrice = Number(tier.price ?? 0);
    const discountAmount =
      basePrice > 0 && tierPrice > 0 ? Math.max(basePrice - tierPrice, 0) : '';
    return {
      minQuantity: String(minQuantity),
      discountAmount: discountAmount !== '' ? String(discountAmount) : '',
    };
  });
}

export function discountFormToTiers(formTiers = [], basePrice = 0) {
  const price = Number(basePrice);
  if (!Number.isFinite(price) || price <= 0) {
    return [];
  }

  return formTiers
    .filter((tier) => tier.minQuantity !== '' && tier.discountAmount !== '')
    .map((tier) => ({
      minQuantity: Number(tier.minQuantity),
      price: price - Number(tier.discountAmount),
    }));
}

export function validateBulkDiscountForm(formTiers = [], basePrice = 0) {
  const price = Number(basePrice);
  if (!Number.isFinite(price) || price <= 0) {
    return 'Product price must be set before configuring bulk discounts';
  }

  const filled = formTiers.filter(
    (tier) => tier.minQuantity !== '' || tier.discountAmount !== ''
  );

  if (filled.length === 0) {
    return null;
  }

  const seenQuantities = new Set();

  for (const tier of filled) {
    const minQty = Number(tier.minQuantity);
    const discount = Number(tier.discountAmount);

    if (!Number.isInteger(minQty) || minQty <= 0) {
      return 'Minimum quantity must be a positive integer';
    }

    if (!Number.isFinite(discount) || discount <= 0) {
      return 'Discount per item must be a positive amount';
    }

    if (discount >= price) {
      return `Discount (₹${discount}) cannot be equal to or greater than base price (₹${price})`;
    }

    if (seenQuantities.has(minQty)) {
      return `Duplicate minimum quantity: ${minQty}`;
    }
    seenQuantities.add(minQty);
  }

  return null;
}

export function formatBulkOfferPreview(minQuantity, discountAmount, basePrice) {
  const finalPrice = Number(basePrice) - Number(discountAmount);
  return `Buy ${minQuantity} or more → Save ₹${discountAmount} per item (₹${finalPrice}/item)`;
}
