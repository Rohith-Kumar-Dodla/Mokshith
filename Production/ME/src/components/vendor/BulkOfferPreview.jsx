import React, { useMemo } from 'react';
import { normalizeBulkPricing } from '../../utils/productMapper';

export function getActiveBulkTierIndex(tiers = [], quantity = 0) {
  if (!tiers.length) return -1;

  let activeIndex = -1;
  tiers.forEach((tier, index) => {
    if (Number(quantity) >= Number(tier.minQty ?? tier.minQuantity ?? 0)) {
      activeIndex = index;
    }
  });
  return activeIndex;
}

export function formatBulkUnitPrice(value) {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return '₹0.00';
  return `₹${amount.toFixed(2)}`;
}

const BulkOfferPreview = ({ bulkPricing = [], basePrice = 0, quantity = 1 }) => {
  const tiers = useMemo(
    () => normalizeBulkPricing(bulkPricing, basePrice),
    [bulkPricing, basePrice]
  );

  const activeTierIndex = useMemo(
    () => getActiveBulkTierIndex(tiers, quantity),
    [tiers, quantity]
  );

  if (!tiers.length) {
    return null;
  }

  return (
    <div className="mb-2 sm:mb-3 rounded-lg border border-orange-100 bg-orange-50/70 px-2.5 py-2">
      <p className="text-[11px] sm:text-xs font-semibold uppercase tracking-wide text-orange-700 mb-1.5">
        🔥 Bulk Offers
      </p>
      <div className="space-y-1">
        {tiers.map((tier, index) => {
          const minQty = tier.minQty ?? tier.minQuantity ?? 0;
          const unitPrice = Number(tier.price ?? 0);
          const savePerUnit = Math.max(Number(basePrice) - unitPrice, 0);
          const isActive = index === activeTierIndex;

          return (
            <div
              key={`${minQty}-${unitPrice}`}
              className={`flex items-center justify-between gap-2 text-[11px] sm:text-xs ${
                isActive ? 'font-semibold text-orange-900' : 'text-gray-700'
              }`}
            >
              <span className="truncate">
                {isActive ? '✓ ' : ''}
                {minQty}+ {formatBulkUnitPrice(unitPrice)}/unit
              </span>
              {savePerUnit > 0 && (
                <span className={`shrink-0 ${isActive ? 'text-orange-800' : 'text-green-700'}`}>
                  Save {formatBulkUnitPrice(savePerUnit)}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default BulkOfferPreview;
