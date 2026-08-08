import React from 'react';
import { Link } from 'react-router-dom';
import { FiShoppingCart, FiHeart, FiEye, FiStar } from 'react-icons/fi';
import { getProductImageKey } from '../../utils/productMapper';

const ProductCard = ({
  product,
  onAddToCart,
  onAddToWishlist,
  onViewDetails,
  selectable = false,
  selected = false,
  onToggleSelect,
  hideAddToCart = false,
}) => {
  const productId = product.id || product._id;
  const imageSrc = product.imageUrl || product.image || '';
  const imageKey = getProductImageKey(product);
  const rating = product.rating ?? 4;
  const reviews = product.reviews ?? 0;
  const brand = product.brand || null;
  const canSelect = selectable && product.status !== 'out_of_stock';

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

  const calculateDiscount = () => {
    if (product.mrp && product.price) {
      return Math.round(((product.mrp - product.price) / product.mrp) * 100);
    }
    return 0;
  };

  return (
    <div
      className={`bg-white rounded-xl shadow-sm border overflow-hidden hover:shadow-md transition-shadow duration-300 ${
        selected ? 'border-blue-400 ring-2 ring-blue-100' : 'border-gray-100'
      }`}
    >
      <div className="relative h-36 sm:h-48 bg-gray-100">
        <img
          key={imageKey}
          src={imageSrc}
          alt={product.name}
          loading="lazy"
          decoding="async"
          className="w-full h-full img-responsive object-cover"
        />
        {selectable && (
          <div className="absolute top-2 sm:top-3 left-2 sm:left-3 z-10">
            <label className="inline-flex items-center min-h-[36px] min-w-[36px] bg-white/95 rounded-md shadow px-2 cursor-pointer">
              <input
                type="checkbox"
                checked={selected}
                disabled={!canSelect}
                onChange={() => onToggleSelect?.(product)}
                aria-label={`Select ${product.name}`}
                className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
              />
            </label>
          </div>
        )}
        <div className={`absolute top-2 sm:top-3 ${selectable ? 'left-14 sm:left-16' : 'left-2 sm:left-3'}`}>
          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(product.status)}`}>
            {getStatusText(product.status)}
          </span>
        </div>
        {calculateDiscount() > 0 && (
          <div className="absolute top-2 sm:top-3 right-2 sm:right-3">
            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-500 text-white">
              {calculateDiscount()}% OFF
            </span>
          </div>
        )}
        <div className="absolute bottom-2 sm:bottom-3 right-2 sm:right-3 flex gap-1.5 sm:gap-2">
          <button
            onClick={() => onAddToWishlist && onAddToWishlist(product)}
            className="p-2 bg-white rounded-full shadow-md hover:bg-gray-50 transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center"
            title="Add to Wishlist"
            type="button"
          >
            <FiHeart className="w-4 h-4 text-gray-600" />
          </button>
          {onViewDetails ? (
            <button
              onClick={() => onViewDetails(product)}
              className="p-2 bg-white rounded-full shadow-md hover:bg-gray-50 transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center"
              title="View Details"
              type="button"
            >
              <FiEye className="w-4 h-4 text-gray-600" />
            </button>
          ) : (
            <Link
              to={`/vendor/products/${productId}`}
              className="p-2 bg-white rounded-full shadow-md hover:bg-gray-50 transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center"
              title="View Details"
            >
              <FiEye className="w-4 h-4 text-gray-600" />
            </Link>
          )}
        </div>
      </div>

      <div className="p-3 sm:p-4">
        <p className="text-xs text-blue-600 font-medium mb-1">{product.category}</p>

        <h3 className="font-semibold text-sm sm:text-base text-gray-900 mb-2 line-clamp-2 min-h-[36px] sm:min-h-[40px]">
          {product.name}
        </h3>

        {brand && (
          <p className="text-xs text-gray-500 mb-2">{brand}</p>
        )}

        <div className="flex items-center gap-1 mb-2 sm:mb-3">
          <div className="flex items-center">
            {[...Array(5)].map((_, i) => (
              <FiStar
                key={i}
                className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${
                  i < Math.floor(rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'
                }`}
              />
            ))}
          </div>
          <span className="text-xs text-gray-500">({reviews})</span>
        </div>

        <div className="flex items-baseline gap-2 mb-2 sm:mb-3">
          <span className="text-lg sm:text-xl font-bold text-gray-900">₹{product.price.toFixed(2)}</span>
          {product.mrp && (
            <span className="text-xs sm:text-sm text-gray-400 line-through">₹{product.mrp.toFixed(2)}</span>
          )}
          {product.wholesalePrice && (
            <span className="text-xs text-green-600 font-medium">
              Wholesale: ₹{product.wholesalePrice.toFixed(2)}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between text-xs text-gray-500 mb-2 sm:mb-3">
          <span>MOQ: {product.minimumOrderQuantity} {product.unit}</span>
        </div>

        {!hideAddToCart && (
          <button
            type="button"
            onClick={() => onAddToCart && onAddToCart(product)}
            disabled={product.status === 'out_of_stock'}
            className={`w-full py-2.5 h-10 sm:h-12 px-4 rounded-lg text-xs sm:text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
              product.status === 'out_of_stock'
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            <FiShoppingCart className="w-4 h-4" />
            {product.status === 'out_of_stock' ? 'Out of Stock' : 'Add to Cart'}
          </button>
        )}
      </div>
    </div>
  );
};

export default React.memo(ProductCard, (prev, next) => {
  const prevProduct = prev.product;
  const nextProduct = next.product;

  return (
    prevProduct?.id === nextProduct?.id &&
    getProductImageKey(prevProduct) === getProductImageKey(nextProduct) &&
    prevProduct?.name === nextProduct?.name &&
    prevProduct?.price === nextProduct?.price &&
    prevProduct?.status === nextProduct?.status &&
    prev.selected === next.selected &&
    prev.selectable === next.selectable &&
    prev.hideAddToCart === next.hideAddToCart
  );
});
