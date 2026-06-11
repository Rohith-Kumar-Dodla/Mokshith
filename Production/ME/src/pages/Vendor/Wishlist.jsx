import React from 'react';
import PageHeader from '../../components/vendor/PageHeader';
import WishlistCard from '../../components/vendor/WishlistCard';
import { vendorWishlist } from '../../data';

const Wishlist = () => {
  const handleAddToCart = (item) => {
    console.log('Add to cart:', item);
  };

  const handleRemove = (itemId) => {
    console.log('Remove from wishlist:', itemId);
  };

  const handleToggleNotify = (itemId) => {
    console.log('Toggle notification:', itemId);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        title="Wishlist"
        subtitle={`Saved products (${vendorWishlist.length})`}
      />

      {vendorWishlist.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-8 sm:p-12 text-center">
          <p className="text-xs sm:text-sm text-gray-600 mb-4">Your wishlist is empty</p>
          <button className="px-4 sm:px-6 py-2.5 h-10 sm:h-12 bg-blue-600 text-white rounded-lg text-xs sm:text-sm font-medium hover:bg-blue-700 transition-colors">
            Browse Products
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          {vendorWishlist.map((item) => (
            <WishlistCard
              key={item.id}
              item={item}
              onAddToCart={handleAddToCart}
              onRemove={handleRemove}
              onToggleNotify={handleToggleNotify}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Wishlist;
