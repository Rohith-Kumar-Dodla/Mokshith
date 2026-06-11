import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FiShoppingCart, FiTrash2, FiArrowRight } from 'react-icons/fi';
import PageHeader from '../../components/vendor/PageHeader';
import CartItem from '../../components/vendor/CartItem';
import { vendorCart } from '../../data';

const Cart = () => {
  const [cartItems, setCartItems] = useState(vendorCart);

  const handleUpdateQuantity = (itemId, newQuantity) => {
    const updatedItems = cartItems.map(item => {
      if (item.id === itemId) {
        const updatedItem = { ...item, quantity: newQuantity };
        updatedItem.subtotal = updatedItem.bulkPrice * newQuantity;
        return updatedItem;
      }
      return item;
    });
    setCartItems(updatedItems);
  };

  const handleRemove = (itemId) => {
    setCartItems(cartItems.filter(item => item.id !== itemId));
  };

  const subtotal = cartItems.reduce((sum, item) => sum + item.subtotal, 0);
  const discount = cartItems.reduce((sum, item) => sum + (item.unitPrice - item.bulkPrice) * item.quantity, 0);
  const tax = subtotal * 0.18;
  const grandTotal = subtotal + tax;

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        title="Shopping Cart"
        subtitle="Review your items and proceed to checkout."
      />

      {cartItems.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-8 sm:p-12 text-center">
          <FiShoppingCart className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">Your cart is empty</h2>
          <p className="text-xs sm:text-sm text-gray-600 mb-4">Start adding products to your cart</p>
          <Link
            to="/vendor/products"
            className="inline-flex items-center gap-1.5 sm:gap-2 px-4 sm:px-6 py-2.5 h-10 sm:h-12 bg-blue-600 text-white rounded-lg text-xs sm:text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            Browse Products
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-3 sm:space-y-4">
            {cartItems.map((item) => (
              <CartItem
                key={item.id}
                item={item}
                onUpdateQuantity={handleUpdateQuantity}
                onRemove={handleRemove}
              />
            ))}
          </div>

          {/* Cart Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6 sticky top-20 sm:top-24">
              <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Order Summary</h2>

              <div className="space-y-2 sm:space-y-3 mb-3 sm:mb-4">
                <div className="flex justify-between text-xs sm:text-sm">
                  <span className="text-gray-600">Items ({cartItems.length})</span>
                  <span className="font-medium text-gray-900">₹{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xs sm:text-sm">
                  <span className="text-gray-600">Bulk Discount</span>
                  <span className="font-medium text-green-600">-₹{discount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xs sm:text-sm">
                  <span className="text-gray-600">Tax (18%)</span>
                  <span className="font-medium text-gray-900">₹{tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xs sm:text-sm">
                  <span className="text-gray-600">Estimated Delivery</span>
                  <span className="font-medium text-gray-900">3-5 business days</span>
                </div>
              </div>

              <hr className="border-gray-200 my-3 sm:my-4" />

              <div className="flex justify-between mb-4 sm:mb-6">
                <span className="text-base sm:text-lg font-semibold text-gray-900">Grand Total</span>
                <span className="text-lg sm:text-xl font-bold text-gray-900">₹{grandTotal.toFixed(2)}</span>
              </div>

              <div className="space-y-2 sm:space-y-3">
                <Link
                  to="/vendor/checkout"
                  className="w-full py-2.5 h-10 sm:h-12 px-4 sm:px-6 bg-blue-600 text-white rounded-lg text-xs sm:text-sm font-medium flex items-center justify-center gap-1.5 sm:gap-2 hover:bg-blue-700 transition-colors"
                >
                  <span className="hidden sm:inline">Proceed to Checkout</span>
                  <span className="sm:hidden">Checkout</span>
                  <FiArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  to="/vendor/products"
                  className="w-full py-2.5 h-10 sm:h-12 px-4 sm:px-6 border border-gray-300 rounded-lg text-xs sm:text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Continue Shopping
                </Link>
              </div>

              <div className="mt-3 sm:mt-4 p-2 sm:p-3 bg-green-50 rounded-lg">
                <p className="text-xs sm:text-sm text-green-700">
                  You're saving ₹{discount.toFixed(2)} on this order with bulk pricing!
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cart;
