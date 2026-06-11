import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FiCreditCard, FiSmartphone, FiTruck, FiCheck, FiDollarSign } from 'react-icons/fi';
import PageHeader from '../../components/vendor/PageHeader';
import { vendorCart } from '../../data';

const Checkout = () => {
  const [selectedPayment, setSelectedPayment] = useState('upi');
  const [formData, setFormData] = useState({
    deliveryAddress: '',
    businessName: 'Fresh Mart Grocery',
    contactPerson: 'Rajesh Kumar',
    phone: '+91 98765 43210',
    email: 'freshmart@example.com',
    specialInstructions: ''
  });

  const subtotal = vendorCart.reduce((sum, item) => sum + item.subtotal, 0);
  const discount = vendorCart.reduce((sum, item) => sum + (item.unitPrice - item.bulkPrice) * item.quantity, 0);
  const tax = subtotal * 0.18;
  const grandTotal = subtotal + tax;

  const paymentMethods = [
    { id: 'upi', label: 'UPI', icon: FiSmartphone, description: 'Pay using any UPI app' },
    { id: 'cod', label: 'Cash On Delivery', icon: FiTruck, description: 'Pay when you receive the order' },
    { id: 'bank', label: 'Bank Transfer', icon: FiDollarSign, description: 'Direct bank transfer' },
    { id: 'credit', label: 'Credit Line', icon: FiCreditCard, description: 'Use your available credit' },
    { id: 'wallet', label: 'Wallet', icon: FiDollarSign, description: 'Pay from your wallet balance' },
  ];

  const handlePlaceOrder = () => {
    console.log('Place order:', { formData, paymentMethod: selectedPayment });
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        title="Order Checkout"
        subtitle="Complete your order details and select payment method."
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Checkout Form */}
        <div className="lg:col-span-2 space-y-4 sm:space-y-6">
          {/* Delivery Address */}
          <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Delivery Address</h2>
            <div className="space-y-3 sm:space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Business Name
                </label>
                <input
                  type="text"
                  value={formData.businessName}
                  onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                  className="w-full px-4 py-2.5 h-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Delivery Address
                </label>
                <textarea
                  value={formData.deliveryAddress}
                  onChange={(e) => setFormData({ ...formData, deliveryAddress: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your complete delivery address"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contact Person
                  </label>
                  <input
                    type="text"
                    value={formData.contactPerson}
                    onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                    className="w-full px-4 py-2.5 h-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-2.5 h-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2.5 h-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Special Instructions */}
          <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Special Instructions</h2>
            <textarea
              value={formData.specialInstructions}
              onChange={(e) => setFormData({ ...formData, specialInstructions: e.target.value })}
              rows={3}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Any special instructions for delivery (optional)"
            />
          </div>

          {/* Payment Method */}
          <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Payment Method</h2>
            <div className="space-y-2 sm:space-y-3">
              {paymentMethods.map((method) => (
                <button
                  key={method.id}
                  onClick={() => setSelectedPayment(method.id)}
                  className={`w-full p-3 sm:p-4 border rounded-lg flex items-start gap-3 sm:gap-4 transition-colors ${
                    selectedPayment === method.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <div className={`p-2 rounded-lg ${
                    selectedPayment === method.id ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600'
                  }`}>
                    <method.icon className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <div className="text-left flex-1">
                    <h3 className="text-xs sm:text-sm font-medium text-gray-900">{method.label}</h3>
                    <p className="text-xs text-gray-500">{method.description}</p>
                  </div>
                  {selectedPayment === method.id && (
                    <FiCheck className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6 sticky top-20 sm:top-24">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Order Summary</h2>

            {/* Items Preview */}
            <div className="space-y-2 sm:space-y-3 mb-3 sm:mb-4 max-h-48 overflow-y-auto">
              {vendorCart.slice(0, 3).map((item) => (
                <div key={item.id} className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                    <img src={item.productImage} alt={item.productName} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm font-medium text-gray-900 truncate">{item.productName}</p>
                    <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                  </div>
                  <span className="text-xs sm:text-sm font-medium text-gray-900">₹{item.subtotal.toFixed(2)}</span>
                </div>
              ))}
              {vendorCart.length > 3 && (
                <p className="text-xs sm:text-sm text-gray-500 text-center">+{vendorCart.length - 3} more items</p>
              )}
            </div>

            <hr className="border-gray-200 my-3 sm:my-4" />

            {/* Pricing */}
            <div className="space-y-2 sm:space-y-3 mb-3 sm:mb-4">
              <div className="flex justify-between text-xs sm:text-sm">
                <span className="text-gray-600">Subtotal</span>
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
                <span className="text-gray-600">Delivery</span>
                <span className="font-medium text-green-600">FREE</span>
              </div>
            </div>

            <hr className="border-gray-200 my-3 sm:my-4" />

            <div className="flex justify-between mb-4 sm:mb-6">
              <span className="text-base sm:text-lg font-semibold text-gray-900">Grand Total</span>
              <span className="text-lg sm:text-xl font-bold text-gray-900">₹{grandTotal.toFixed(2)}</span>
            </div>

            <button
              onClick={handlePlaceOrder}
              className="w-full py-2.5 h-10 sm:h-12 px-4 sm:px-6 bg-blue-600 text-white rounded-lg text-xs sm:text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              Place Order
            </button>

            <p className="text-xs text-gray-500 text-center mt-2 sm:mt-3">
              By placing this order, you agree to our Terms & Conditions
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
