import React from 'react';
import { FiPlus, FiMinus, FiTrash2 } from 'react-icons/fi';

const CartItem = ({ item, onUpdateQuantity, onRemove }) => {
  const calculateSavings = () => {
    if (item.unitPrice && item.bulkPrice) {
      return (item.unitPrice - item.bulkPrice) * item.quantity;
    }
    return 0;
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-3 sm:p-4 mb-3 sm:mb-4">
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
        {/* Product Image */}
        <div className="w-20 h-20 sm:w-24 sm:h-24 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden">
          <img
            src={item.productImage}
            alt={item.productName}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Product Details */}
        <div className="flex-1">
          <div className="flex justify-between items-start mb-2">
            <div>
              <h3 className="text-xs sm:text-sm font-semibold text-gray-900 mb-1">{item.productName}</h3>
              <p className="text-xs text-gray-500">{item.category}</p>
            </div>
            <button
              onClick={() => onRemove && onRemove(item.id)}
              className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center"
              title="Remove from Cart"
            >
              <FiTrash2 className="w-4 h-4" />
            </button>
          </div>

          {/* Price */}
          <div className="flex items-baseline gap-2 mb-2 sm:mb-3">
            <span className="text-base sm:text-lg font-bold text-gray-900">₹{item.bulkPrice.toFixed(2)}</span>
            {item.unitPrice !== item.bulkPrice && (
              <>
                <span className="text-xs sm:text-sm text-gray-400 line-through">₹{item.unitPrice.toFixed(2)}</span>
                <span className="text-xs text-green-600 font-medium">
                  Save ₹{calculateSavings().toFixed(2)}
                </span>
              </>
            )}
          </div>

          {/* Quantity and Subtotal */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4">
            {/* Quantity Controls */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => onUpdateQuantity && onUpdateQuantity(item.id, item.quantity - 1)}
                disabled={item.quantity <= item.minimumOrderQuantity}
                className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <FiMinus className="w-4 h-4" />
              </button>
              <span className="w-10 sm:w-12 text-center font-medium text-xs sm:text-sm">{item.quantity}</span>
              <button
                onClick={() => onUpdateQuantity && onUpdateQuantity(item.id, item.quantity + 1)}
                disabled={item.quantity >= item.availableStock}
                className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <FiPlus className="w-4 h-4" />
              </button>
            </div>

            {/* Subtotal */}
            <div className="text-right">
              <p className="text-xs text-gray-500">Subtotal</p>
              <p className="text-base sm:text-lg font-bold text-gray-900">₹{item.subtotal.toFixed(2)}</p>
            </div>
          </div>

          {/* Stock Warning */}
          {item.quantity >= item.availableStock && (
            <p className="text-xs text-orange-600 mt-2">
              Maximum stock reached ({item.availableStock} available)
            </p>
          )}

          {/* MOQ Warning */}
          {item.quantity < item.minimumOrderQuantity && (
            <p className="text-xs text-orange-600 mt-2">
              Minimum order quantity: {item.minimumOrderQuantity}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default CartItem;
