import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import PageHeader from '../../components/vendor/PageHeader';
import WishlistCard from '../../components/vendor/WishlistCard';
import useWishlist from '../../hooks/useWishlist';
import useCart from '../../hooks/useCart';

const Wishlist = () => {
  const { loading, error, wishlistItems, removeFromWishlist, actionLoading } = useWishlist();
  const { addToCart } = useCart({ autoLoad: false });
  const [toast, setToast] = useState(null);

  const showToast = (type, message) => {
    setToast({ type, message });
    window.setTimeout(() => setToast(null), 4000);
  };

  const handleAddToCart = async (item) => {
    const quantity = Number(item.minimumOrderQuantity ?? 1);

    try {
      await addToCart(item.productId, quantity);
      showToast('success', `${item.productName} added to cart`);
    } catch (addError) {
      showToast('error', addError.message || 'Failed to add item to cart');
    }
  };

  const handleRemove = async (itemId) => {
    try {
      await removeFromWishlist(itemId);
      showToast('success', 'Removed from wishlist');
    } catch (removeError) {
      showToast('error', removeError.message || 'Failed to remove item');
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-8 sm:p-12 text-center">
        <p className="text-sm text-gray-600">Loading wishlist...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        title="Wishlist"
        subtitle={`Saved products (${wishlistItems.length})`}
      />

      {toast && (
        <div
          className={`rounded-lg border p-3 sm:p-4 ${
            toast.type === 'success'
              ? 'border-green-200 bg-green-50 text-green-700'
              : 'border-red-200 bg-red-50 text-red-700'
          }`}
        >
          {toast.message}
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {wishlistItems.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-8 sm:p-12 text-center">
          <p className="text-xs sm:text-sm text-gray-600 mb-4">Your wishlist is empty</p>
          <Link
            to="/vendor/products"
            className="inline-flex px-4 sm:px-6 py-2.5 h-10 sm:h-12 bg-blue-600 text-white rounded-lg text-xs sm:text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            Browse Products
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          {wishlistItems.map((item) => (
            <WishlistCard
              key={item.id}
              item={item}
              onAddToCart={handleAddToCart}
              onRemove={handleRemove}
              disabled={actionLoading}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Wishlist;
