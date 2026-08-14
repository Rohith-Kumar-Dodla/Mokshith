import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiMinus, FiPlus, FiShoppingCart } from 'react-icons/fi';
import Modal from '../admin/Modal';
import { getProductId, getLinePricingPreview, getSelectionTotals } from '../../utils/bulkAddToCartUtils';

const BulkAddToCartModal = ({
  isOpen,
  products = [],
  quantities = {},
  onQuantityChange,
  onClose,
  onConfirm,
  busy = false,
  progressLabel = '',
}) => {
  useEffect(() => {
    if (!isOpen) return undefined;

    const onKeyDown = (event) => {
      if (event.key === 'Escape' && !busy) {
        onClose();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, busy, onClose]);

  const lines = products.map((product) => {
    const productId = getProductId(product);
    return {
      product,
      productId,
      ...getLinePricingPreview(product, quantities[productId]),
    };
  });
  const { totalItems, estimatedTotal } = getSelectionTotals(lines);

  const handleClose = () => {
    if (!busy) onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Selected Products" size="lg">
      <div className="space-y-4 sm:space-y-6">
        <p className="text-sm text-gray-600">
          {products.length} product{products.length === 1 ? '' : 's'} selected
        </p>

        <div className="space-y-3">
          {lines.map((line) => {
            const { product, productId, quantity, basePrice, unitPrice, lineTotal, discountPerItem, bulkApplied } = line;
            const minQty = Number(product.minimumOrderQuantity ?? product.moq ?? 1);
            const maxQty = Number(product.stock ?? 999);
            const imageSrc = product.imageUrl || product.image || '';

            return (
              <div
                key={productId}
                className="bg-white rounded-lg border border-gray-200 p-3 sm:p-4"
              >
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                  <div className="w-full sm:w-20 h-20 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden">
                    {imageSrc ? (
                      <img src={imageSrc} alt={product.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">
                        No image
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-gray-900">{product.name}</h3>
                    <p className="text-xs text-gray-500 mb-2">{product.category}</p>

                    <div className="flex items-baseline gap-2 flex-wrap mb-2">
                      <span className="text-base font-bold text-gray-900">₹{unitPrice.toFixed(2)}</span>
                      <span className="text-xs text-gray-600">/ unit</span>
                      {bulkApplied && (
                        <span className="text-xs text-gray-400 line-through">₹{basePrice.toFixed(2)}</span>
                      )}
                    </div>

                    {bulkApplied && (
                      <div className="text-xs text-gray-600 mb-2 space-y-0.5">
                        <p>Regular price: ₹{basePrice.toFixed(2)}/item</p>
                        <p className="text-green-600">
                          Bulk price: ₹{unitPrice.toFixed(2)}/item
                          {discountPerItem > 0 ? ` (Save ₹${discountPerItem.toFixed(2)}/item)` : ''}
                        </p>
                      </div>
                    )}

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs sm:text-sm text-gray-600">Quantity:</span>
                        <button
                          type="button"
                          aria-label={`Decrease quantity for ${product.name}`}
                          onClick={() => onQuantityChange(product, -1)}
                          disabled={busy || quantity <= minQty}
                          className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <FiMinus className="w-4 h-4" />
                        </button>
                        <span
                          className="w-10 text-center text-sm font-medium text-gray-900"
                          aria-label={`${product.name} quantity`}
                        >
                          {quantity}
                        </span>
                        <button
                          type="button"
                          aria-label={`Increase quantity for ${product.name}`}
                          onClick={() => onQuantityChange(product, 1)}
                          disabled={busy || quantity >= maxQty}
                          className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <FiPlus className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="text-left sm:text-right">
                        <p className="text-xs text-gray-500">Line total</p>
                        <p className="text-sm font-bold text-gray-900">₹{lineTotal.toFixed(2)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="border-t border-gray-200 pt-4 space-y-1">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Total Items</span>
            <span className="font-medium text-gray-900">{totalItems}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Estimated Total</span>
            <span className="font-bold text-gray-900">₹{estimatedTotal.toFixed(2)}</span>
          </div>
          <p className="text-xs text-gray-500">
            Final price is confirmed by the cart. Estimated total is for preview only.
          </p>
        </div>

        {busy && (
          <p className="text-sm text-blue-700" aria-live="polite">
            {progressLabel || 'Adding to Cart...'}
          </p>
        )}

        <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={handleClose}
            disabled={busy}
            className="px-4 sm:px-6 py-2.5 h-12 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy || products.length === 0}
            className="inline-flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 h-12 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FiShoppingCart className="w-4 h-4" />
            {busy ? 'Adding to Cart...' : 'Add to Cart'}
          </button>
        </div>

        <p className="text-xs text-gray-500">
          You can review items anytime in <Link to="/vendor/cart" className="text-blue-600 hover:text-blue-700">View Cart</Link>.
        </p>
      </div>
    </Modal>
  );
};

export default BulkAddToCartModal;
