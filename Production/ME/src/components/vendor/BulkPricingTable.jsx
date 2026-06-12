import React from 'react';

const getMinQty = (tier) => tier.minQty ?? tier.minQuantity ?? 0;

const BulkPricingTable = ({ bulkPricing }) => {
  if (!bulkPricing || bulkPricing.length === 0) {
    return null;
  }

  const normalizedTiers = bulkPricing.map((tier) => ({
    ...tier,
    minQty: getMinQty(tier),
    maxQty: tier.maxQty ?? null,
    price: Number(tier.price ?? 0),
    discount: Number(tier.discount ?? 0),
  }));

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
        <h3 className="font-semibold text-gray-900">Bulk Pricing</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Quantity Range
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Price per Unit
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                You Save
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {normalizedTiers.map((tier, index) => (
              <tr key={index} className={index === normalizedTiers.length - 1 ? 'bg-green-50' : ''}>
                <td className="px-4 py-3 text-sm text-gray-900">
                  {tier.minQty} - {tier.maxQty ? tier.maxQty : 'Above'} units
                </td>
                <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                  ₹{tier.price.toFixed(2)}
                </td>
                <td className="px-4 py-3 text-sm">
                  {tier.discount > 0 ? (
                    <span className="text-green-600 font-medium">
                      {tier.discount}% off
                    </span>
                  ) : (
                    <span className="text-gray-500">-</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {normalizedTiers.length > 0 && (
        <div className="px-4 py-2 bg-green-50 border-t border-green-100">
          <p className="text-xs text-green-700">
            Best price: ₹{normalizedTiers[normalizedTiers.length - 1].price.toFixed(2)} per unit ({normalizedTiers[normalizedTiers.length - 1].discount}% discount)
          </p>
        </div>
      )}
    </div>
  );
};

export default BulkPricingTable;
