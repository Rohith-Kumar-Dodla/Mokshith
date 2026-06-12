import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiCreditCard, FiSmartphone, FiTruck, FiCheck } from 'react-icons/fi';
import PageHeader from '../../components/vendor/PageHeader';
import useCart from '../../hooks/useCart';
import useCheckout from '../../hooks/useCheckout';
import useCredit from '../../hooks/useCredit';
import { useAuth } from '../../context/AuthContext';

const PAYMENT_METHODS = [
  { id: 'cod', label: 'Cash On Delivery', icon: FiTruck, description: 'Pay when you receive the order' },
  { id: 'credit', label: 'Credit Line', icon: FiCreditCard, description: 'Pay fully with available credit' },
  { id: 'hybrid', label: 'Credit + Online', icon: FiCreditCard, description: 'Use credit first, pay remainder online' },
  { id: 'upi', label: 'UPI', icon: FiSmartphone, description: 'Pay online via UPI' },
  { id: 'online', label: 'Online Payment', icon: FiSmartphone, description: 'Pay the full amount online' },
];

const Checkout = () => {
  const { user } = useAuth();
  const [selectedPayment, setSelectedPayment] = useState('cod');
  const { loading, error, cartItems, subtotal, discount, tax, grandTotal, loadCart } = useCart();
  const { submitting, error: checkoutError, placeOrder } = useCheckout({
    onSuccess: async () => {
      await loadCart();
    },
  });
  const { credit, loading: creditLoading, validateAmount } = useCredit();
  const [formData, setFormData] = useState({
    deliveryAddress: '',
    businessName: '',
    contactPerson: '',
    phone: '',
    email: '',
    city: '',
    state: '',
    pincode: '',
    specialInstructions: '',
  });
  const [validationError, setValidationError] = useState('');

  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        businessName: prev.businessName || user.name || '',
        contactPerson: prev.contactPerson || user.name || '',
        phone: prev.phone || user.mobile || '',
        email: prev.email || user.email || '',
      }));
    }
  }, [user]);

  const validateForm = () => {
    if (!formData.deliveryAddress.trim()) return 'Delivery address is required';
    if (!formData.city.trim()) return 'City is required';
    if (!formData.state.trim()) return 'State is required';
    if (!/^\d{6}$/.test(String(formData.pincode).replace(/\D/g, ''))) return 'Pincode must be 6 digits';
    if (!formData.phone.trim()) return 'Phone number is required';
    return '';
  };

  const handlePlaceOrder = async () => {
    const validationMessage = validateForm();
    if (validationMessage) {
      setValidationError(validationMessage);
      return;
    }

    setValidationError('');

    if (selectedPayment === 'credit') {
      const creditError = validateAmount(grandTotal);
      if (creditError) {
        setValidationError(creditError);
        return;
      }
    }

    if (selectedPayment === 'hybrid') {
      if (!credit || credit.availableCredit <= 0) {
        setValidationError('No credit available for hybrid payment');
        return;
      }
      if (credit.availableCredit >= grandTotal) {
        setValidationError('Sufficient credit available. Use Credit Line instead.');
        return;
      }
    }

    try {
      await placeOrder({
        formData,
        paymentMethodId: selectedPayment,
        orderTotal: grandTotal,
      });
    } catch {
      // Error surfaced via checkoutError state.
    }
  };

  if (loading) {
    return (
      <div className="space-y-4 sm:space-y-6">
        <PageHeader
          title="Order Checkout"
          subtitle="Complete your order details and select payment method."
        />
        <div className="bg-white rounded-lg border border-gray-200 p-8 sm:p-12 text-center">
          <p className="text-sm text-gray-600">Loading checkout...</p>
        </div>
      </div>
    );
  }

  if (error && cartItems.length === 0) {
    return (
      <div className="space-y-4 sm:space-y-6">
        <PageHeader
          title="Order Checkout"
          subtitle="Complete your order details and select payment method."
        />
        <div className="bg-white rounded-lg border border-gray-200 p-8 sm:p-12 text-center">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">Unable to load cart</h2>
          <p className="text-xs sm:text-sm text-gray-600 mb-4">{error}</p>
          <Link
            to="/vendor/cart"
            className="inline-flex items-center gap-1.5 sm:gap-2 px-4 sm:px-6 py-2.5 h-10 sm:h-12 bg-blue-600 text-white rounded-lg text-xs sm:text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            Back to Cart
          </Link>
        </div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="space-y-4 sm:space-y-6">
        <PageHeader
          title="Order Checkout"
          subtitle="Complete your order details and select payment method."
        />
        <div className="bg-white rounded-lg border border-gray-200 p-8 sm:p-12 text-center">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">Your cart is empty</h2>
          <p className="text-xs sm:text-sm text-gray-600 mb-4">Add products before checking out</p>
          <Link
            to="/vendor/products"
            className="inline-flex items-center gap-1.5 sm:gap-2 px-4 sm:px-6 py-2.5 h-10 sm:h-12 bg-blue-600 text-white rounded-lg text-xs sm:text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            Browse Products
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        title="Order Checkout"
        subtitle="Complete your order details and select payment method."
      />

      {(validationError || checkoutError) && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {validationError || checkoutError}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="lg:col-span-2 space-y-4 sm:space-y-6">
          <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Delivery Address</h2>
            <div className="space-y-3 sm:space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Business Name</label>
                <input
                  type="text"
                  value={formData.businessName}
                  onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                  className="w-full px-4 py-2.5 h-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Address</label>
                <textarea
                  value={formData.deliveryAddress}
                  onChange={(e) => setFormData({ ...formData, deliveryAddress: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your complete delivery address"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-4 py-2.5 h-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                  <input
                    type="text"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    className="w-full px-4 py-2.5 h-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Pincode</label>
                  <input
                    type="text"
                    value={formData.pincode}
                    onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                    className="w-full px-4 py-2.5 h-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contact Person</label>
                  <input
                    type="text"
                    value={formData.contactPerson}
                    onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                    className="w-full px-4 py-2.5 h-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-2.5 h-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2.5 h-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

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

          <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Payment Method</h2>

            {!creditLoading && credit && (
              <div className="mb-4 p-3 sm:p-4 bg-blue-50 border border-blue-100 rounded-lg grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                <div>
                  <p className="text-blue-600">Credit Limit</p>
                  <p className="font-semibold text-blue-900">₹{credit.creditLimit.toLocaleString('en-IN')}</p>
                </div>
                <div>
                  <p className="text-blue-600">Used Credit</p>
                  <p className="font-semibold text-blue-900">₹{credit.usedCredit.toLocaleString('en-IN')}</p>
                </div>
                <div>
                  <p className="text-blue-600">Available Credit</p>
                  <p className="font-semibold text-blue-900">₹{credit.availableCredit.toLocaleString('en-IN')}</p>
                </div>
              </div>
            )}

            {selectedPayment === 'hybrid' && credit && (
              <div className="mb-4 p-3 rounded-lg border border-purple-200 bg-purple-50 text-sm text-purple-900">
                Credit applied: ₹{Math.min(credit.availableCredit, grandTotal).toLocaleString('en-IN')} •
                Online remainder: ₹{Math.max(grandTotal - credit.availableCredit, 0).toLocaleString('en-IN')}
              </div>
            )}

            <div className="space-y-2 sm:space-y-3">
              {PAYMENT_METHODS.map((method) => (
                <button
                  key={method.id}
                  type="button"
                  onClick={() => setSelectedPayment(method.id)}
                  disabled={
                    (method.id === 'credit' && credit && grandTotal > credit.availableCredit) ||
                    (method.id === 'hybrid' && (!credit || credit.availableCredit <= 0 || credit.availableCredit >= grandTotal))
                  }
                  className={`w-full p-3 sm:p-4 border rounded-lg flex items-start gap-3 sm:gap-4 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
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

        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6 sticky top-20 sm:top-24">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Order Summary</h2>

            <div className="space-y-2 sm:space-y-3 mb-3 sm:mb-4 max-h-48 overflow-y-auto">
              {cartItems.slice(0, 3).map((item) => (
                <div key={item.id} className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                    {item.productImage ? (
                      <img src={item.productImage} alt={item.productName} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[10px] text-gray-400">N/A</div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm font-medium text-gray-900 truncate">{item.productName}</p>
                    <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                  </div>
                  <span className="text-xs sm:text-sm font-medium text-gray-900">₹{item.subtotal.toFixed(2)}</span>
                </div>
              ))}
              {cartItems.length > 3 && (
                <p className="text-xs sm:text-sm text-gray-500 text-center">+{cartItems.length - 3} more items</p>
              )}
            </div>

            <hr className="border-gray-200 my-3 sm:my-4" />

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
              type="button"
              onClick={handlePlaceOrder}
              disabled={submitting}
              className="w-full py-2.5 h-10 sm:h-12 px-4 sm:px-6 bg-blue-600 text-white rounded-lg text-xs sm:text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {submitting
                ? (['upi', 'online', 'hybrid'].includes(selectedPayment) ? 'Processing Payment...' : 'Placing Order...')
                : (['upi', 'online', 'hybrid'].includes(selectedPayment) ? 'Pay & Place Order' : 'Place Order')}
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
