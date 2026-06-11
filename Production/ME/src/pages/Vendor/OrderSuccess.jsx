import React from 'react';
import { Link } from 'react-router-dom';
import { FiCheckCircle, FiShoppingBag, FiTruck, FiFileText } from 'react-icons/fi';

const OrderSuccess = () => {
  const orderNumber = 'ORD' + Math.floor(Math.random() * 100000);
  const estimatedDelivery = 'June 10, 2024';

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4">
      <div className="bg-white rounded-lg border border-gray-200 p-6 sm:p-8 max-w-md w-full text-center">
        {/* Success Icon */}
        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
          <FiCheckCircle className="w-8 h-8 sm:w-10 sm:h-10 text-green-600" />
        </div>

        {/* Success Message */}
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Order Confirmed!</h1>
        <p className="text-xs sm:text-sm text-gray-600 mb-4 sm:mb-6">
          Thank you for your order. Your order has been placed successfully.
        </p>

        {/* Order Details */}
        <div className="bg-gray-50 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
          <div className="space-y-2 sm:space-y-3">
            <div>
              <p className="text-xs sm:text-sm text-gray-500">Order Number</p>
              <p className="text-base sm:text-lg font-bold text-gray-900">{orderNumber}</p>
            </div>
            <div>
              <p className="text-xs sm:text-sm text-gray-500">Estimated Delivery</p>
              <p className="text-base sm:text-lg font-semibold text-gray-900">{estimatedDelivery}</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2 sm:space-y-3">
          <Link
            to="/vendor/orders"
            className="w-full py-2.5 h-10 sm:h-12 px-4 sm:px-6 bg-blue-600 text-white rounded-lg text-xs sm:text-sm font-medium flex items-center justify-center gap-1.5 sm:gap-2 hover:bg-blue-700 transition-colors"
          >
            <FiFileText className="w-4 h-4" />
            View Orders
          </Link>
          <Link
            to="/vendor/products"
            className="w-full py-2.5 h-10 sm:h-12 px-4 sm:px-6 border border-gray-300 rounded-lg text-xs sm:text-sm font-medium text-gray-700 flex items-center justify-center gap-1.5 sm:gap-2 hover:bg-gray-50 transition-colors"
          >
            <FiShoppingBag className="w-4 h-4" />
            Continue Shopping
          </Link>
        </div>

        {/* Additional Info */}
        <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-gray-200">
          <div className="flex items-center justify-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-gray-600">
            <FiTruck className="w-4 h-4" />
            <span>You will receive order updates via email and SMS</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderSuccess;
