import React from 'react';
import { FiPackage, FiMapPin, FiUser, FiPhone, FiDollarSign, FiClock } from 'react-icons/fi';

const OrderDetailsCard = ({ order }) => {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6 space-y-4 sm:space-y-6">
      {/* Order Information */}
      <div>
        <h3 className="text-xs sm:text-sm font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center gap-2">
          <FiPackage size={14} className="sm:size-18 text-blue-500" />
          Order Information
        </h3>
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          <div>
            <p className="text-xs text-gray-500 mb-1">Order ID</p>
            <p className="font-medium text-xs sm:text-sm text-gray-900">{order?.id}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Order Amount</p>
            <p className="font-medium text-xs sm:text-sm text-gray-900">₹{order?.orderAmount?.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Items Count</p>
            <p className="font-medium text-xs sm:text-sm text-gray-900">{order?.itemsCount}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Distance</p>
            <p className="font-medium text-xs sm:text-sm text-gray-900">{order?.distance} km</p>
          </div>
        </div>
      </div>

      {/* Vendor Information */}
      <div className="pt-3 sm:pt-4 border-t border-gray-100">
        <h3 className="text-xs sm:text-sm font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center gap-2">
          <FiUser size={14} className="sm:size-18 text-blue-500" />
          Vendor Information
        </h3>
        <div className="space-y-2 sm:space-y-3">
          <div>
            <p className="text-xs text-gray-500 mb-1">Vendor Name</p>
            <p className="font-medium text-xs sm:text-sm text-gray-900">{order?.vendor}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Pickup Location</p>
            <p className="font-medium text-xs sm:text-sm text-gray-900">{order?.pickupLocation}</p>
          </div>
        </div>
      </div>

      {/* Delivery Information */}
      <div className="pt-3 sm:pt-4 border-t border-gray-100">
        <h3 className="text-xs sm:text-sm font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center gap-2">
          <FiMapPin size={14} className="sm:size-18 text-blue-500" />
          Delivery Information
        </h3>
        <div className="space-y-2 sm:space-y-3">
          <div>
            <p className="text-xs text-gray-500 mb-1">Delivery Location</p>
            <p className="font-medium text-xs sm:text-sm text-gray-900">{order?.deliveryLocation}</p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <div>
              <p className="text-xs text-gray-500 mb-1">Customer Name</p>
              <p className="font-medium text-xs sm:text-sm text-gray-900">{order?.customerName}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Customer Phone</p>
              <p className="font-medium text-xs sm:text-sm text-gray-900 flex items-center gap-2">
                <FiPhone size={12} className="sm:size-14" />
                {order?.customerPhone}
              </p>
            </div>
          </div>
          {order?.specialInstructions && (
            <div>
              <p className="text-xs text-gray-500 mb-1">Special Instructions</p>
              <p className="font-medium text-xs sm:text-sm text-gray-900">{order?.specialInstructions}</p>
            </div>
          )}
        </div>
      </div>

      {/* Time Information */}
      <div className="pt-3 sm:pt-4 border-t border-gray-100">
        <h3 className="text-xs sm:text-sm font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center gap-2">
          <FiClock size={14} className="sm:size-18 text-blue-500" />
          Time Information
        </h3>
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          <div>
            <p className="text-xs text-gray-500 mb-1">Assigned Time</p>
            <p className="font-medium text-xs sm:text-sm text-gray-900">
              {new Date(order?.assignedTime).toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Estimated Delivery</p>
            <p className="font-medium text-xs sm:text-sm text-gray-900">
              {new Date(order?.estimatedDelivery).toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* Products Information */}
      {order?.products && order.products.length > 0 && (
        <div className="pt-3 sm:pt-4 border-t border-gray-100">
          <h3 className="text-xs sm:text-sm font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center gap-2">
            <FiPackage size={14} className="sm:size-18 text-blue-500" />
            Products
          </h3>
          <div className="space-y-2 sm:space-y-3">
            {order.products.map((product, index) => (
              <div key={index} className="flex justify-between items-center p-2 sm:p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-xs sm:text-sm text-gray-900">{product.name}</p>
                  <p className="text-xs text-gray-500">Qty: {product.quantity}</p>
                </div>
                <p className="font-medium text-xs sm:text-sm text-gray-900">₹{product.price.toFixed(2)}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderDetailsCard;
