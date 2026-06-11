import React from 'react';
import { FiHeart, FiShoppingCart, FiTrash2, FiBell } from 'react-icons/fi';

const WishlistCard = ({ item, onAddToCart, onRemove, onToggleNotify }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'low_stock':
        return 'bg-yellow-100 text-yellow-800';
      case 'out_of_stock':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'active':
        return 'In Stock';
      case 'low_stock':
        return 'Low Stock';
      case 'out_of_stock':
        return 'Out of Stock';
      default:
        return status;
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-3 sm:p-4 hover:shadow-md transition-shadow">
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
              {item.brand && (
                <p className="text-xs text-gray-400">{item.brand}</p>
              )}
            </div>
            <button
              onClick={() => onRemove && onRemove(item.id)}
              className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center"
              title="Remove from Wishlist"
            >
              <FiTrash2 className="w-4 h-4" />
            </button>
          </div>

          {/* Status Badge */}
          <div className="mb-2">
            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(item.status)}`}>
              {getStatusText(item.status)}
            </span>
          </div>

          {/* Price */}
          <div className="flex items-baseline gap-2 mb-2 sm:mb-3">
            <span className="text-base sm:text-lg font-bold text-gray-900">₹{item.price.toFixed(2)}</span>
            {item.mrp && (
              <span className="text-xs sm:text-sm text-gray-400 line-through">₹{item.mrp.toFixed(2)}</span>
            )}
            {item.wholesalePrice && (
              <span className="text-xs text-green-600 font-medium">
                Wholesale: ₹{item.wholesalePrice.toFixed(2)}
              </span>
            )}
          </div>

          {/* Rating */}
          <div className="flex items-center gap-1 mb-2 sm:mb-3">
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <svg
                  key={i}
                  className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${
                    i < Math.floor(item.rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'
                  }`}
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
            <span className="text-xs text-gray-500">({item.reviews})</span>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => onAddToCart && onAddToCart(item)}
              disabled={item.status === 'out_of_stock'}
              className={`flex-1 py-2.5 h-10 sm:h-12 px-3 sm:px-4 rounded-lg text-xs sm:text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
                item.status === 'out_of_stock'
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              <FiShoppingCart className="w-4 h-4" />
              {item.status === 'out_of_stock' ? 'Out of Stock' : 'Add to Cart'}
            </button>
            <button
              onClick={() => onToggleNotify && onToggleNotify(item.id)}
              className={`p-2 rounded-lg transition-colors min-h-[40px] min-w-[40px] flex items-center justify-center ${
                item.notifyWhenAvailable
                  ? 'bg-blue-100 text-blue-600'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              title={item.notifyWhenAvailable ? 'Disable Notification' : 'Notify When Available'}
            >
              <FiBell className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WishlistCard;
