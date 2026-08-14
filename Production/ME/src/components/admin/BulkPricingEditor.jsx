import React from 'react';
import { FiPlus, FiTrash2 } from 'react-icons/fi';
import { formatBulkOfferPreview } from '../../utils/bulkPricingUtils';

const EMPTY_TIER = { minQuantity: '', discountAmount: '' };

const BulkPricingEditor = ({ tiers, basePrice, onChange, disabled = false }) => {
  const handleTierChange = (index, field, value) => {
    const updated = tiers.map((tier, i) =>
      i === index ? { ...tier, [field]: value } : tier
    );
    onChange(updated);
  };

  const handleAddTier = () => {
    onChange([...tiers, { ...EMPTY_TIER }]);
  };

  const handleRemoveTier = (index) => {
    if (tiers.length <= 1) {
      onChange([{ ...EMPTY_TIER }]);
      return;
    }
    onChange(tiers.filter((_, i) => i !== index));
  };

  const hasConfiguredTiers = tiers.some(
    (tier) => tier.minQuantity !== '' && tier.discountAmount !== ''
  );

  return (
    <div className="sm:col-span-2 border border-gray-200 rounded-lg p-4 bg-gray-50">
      <div className="mb-3">
        <h4 className="text-sm font-semibold text-gray-900">Bulk Discount (Optional)</h4>
        <p className="text-xs text-gray-600 mt-1">
          Give customers a discount when they buy more units of this product.
        </p>
      </div>

      <div className="space-y-3">
        {tiers.map((tier, index) => (
          <div key={index} className="flex flex-col sm:flex-row gap-2 sm:gap-3 items-start sm:items-end">
            <div className="flex-1 w-full">
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Minimum quantity
              </label>
              <input
                type="number"
                min="1"
                step="1"
                value={tier.minQuantity}
                onChange={(e) => handleTierChange(index, 'minQuantity', e.target.value)}
                className="w-full px-3 py-2 h-10 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                placeholder="5"
                disabled={disabled}
              />
            </div>
            <div className="flex-1 w-full">
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Discount per item
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">₹</span>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={tier.discountAmount}
                  onChange={(e) => handleTierChange(index, 'discountAmount', e.target.value)}
                  className="w-full pl-7 pr-3 py-2 h-10 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  placeholder="10"
                  disabled={disabled}
                />
              </div>
            </div>
            <button
              type="button"
              onClick={() => handleRemoveTier(index)}
              className="p-2 text-red-500 hover:bg-red-50 rounded-lg disabled:opacity-50"
              title="Remove tier"
              disabled={disabled}
            >
              <FiTrash2 size={16} />
            </button>
          </div>
        ))}
      </div>

      {hasConfiguredTiers && basePrice > 0 && (
        <div className="mt-3 space-y-1">
          {tiers
            .filter((tier) => tier.minQuantity !== '' && tier.discountAmount !== '')
            .map((tier, index) => (
              <p key={index} className="text-xs text-blue-700">
                {formatBulkOfferPreview(tier.minQuantity, tier.discountAmount, basePrice)}
              </p>
            ))}
        </div>
      )}

      <button
        type="button"
        onClick={handleAddTier}
        className="mt-3 inline-flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 font-medium disabled:opacity-50"
        disabled={disabled}
      >
        <FiPlus size={14} />
        Add another bulk discount
      </button>

      <p className="mt-3 text-xs text-gray-500">
        Customers automatically get the best applicable discount based on quantity.
      </p>
    </div>
  );
};

export default BulkPricingEditor;
