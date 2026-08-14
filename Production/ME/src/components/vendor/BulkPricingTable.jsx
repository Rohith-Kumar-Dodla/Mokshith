import React from 'react';

const getMinQty = (tier) => tier.minQty ?? tier.minQuantity ?? 0;

const BulkPricingTable = ({ bulkPricing, basePrice, currentQuantity }) => {
  if (!bulkPricing || bulkPricing.length === 0) {
    return null;
  }

  const normalizedTiers = bulkPricing.map((tier) => ({
    ...tier,
    minQty: getMinQty(tier),
    price: Number(tier.price ?? 0),
    discount: Number(tier.discount ?? 0),
  }));

  const qty = Number(currentQuantity ?? 0);
  const activeTierIndex = [...normalizedTiers]
    .reverse()
    .findIndex((tier) => qty >= tier.minQty);
  const activeIndex =
    activeTierIndex >= 0 ? normalizedTiers.length - 1 - activeTierIndex : -1;

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
        <h3 className="font-semibold text-gray-900">Bulk Offers</h3>
        {basePrice > 0 && (
          <p className="text-xs text-gray-600 mt-0.5">Base price: ₹{Number(basePrice).toFixed(2)}/item</p>
        )}
      </div>
      <div className="divide-y divide-gray-200">
        {normalizedTiers.map((tier, index) => {
          const savingsPerUnit = basePrice > 0 ? Math.max(basePrice - tier.price, 0) : 0;
          const isActive = index === activeIndex && qty >= tier.minQty;

          return (
            <div
              key={index}
              className={`px-4 py-3 flex items-center justify-between ${
                isActive ? 'bg-green-50 border-l-4 border-l-green-500' : ''
              }`}
            >
              <div>
                <p className={`text-sm font-medium ${isActive ? 'text-green-800' : 'text-gray-900'}`}>
                  Buy {tier.minQty}+
                </p>
                {isActive && (
                  <p className="text-xs text-green-600 mt-0.5">Currently applied</p>
                )}
              </div>
              <div className="text-right">
                <p className={`text-sm font-semibold ${isActive ? 'text-green-800' : 'text-gray-900'}`}>
                  ₹{tier.price.toFixed(2)}/item
                </p>
                {savingsPerUnit > 0 && (
                  <p className="text-xs text-green-600">Save ₹{savingsPerUnit.toFixed(2)}/item</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <div className="px-4 py-2 bg-gray-50 border-t border-gray-100">
        <p className="text-xs text-gray-500">
          Customers automatically get the best applicable discount based on quantity.
        </p>
      </div>
    </div>
  );
};

export default BulkPricingTable;
