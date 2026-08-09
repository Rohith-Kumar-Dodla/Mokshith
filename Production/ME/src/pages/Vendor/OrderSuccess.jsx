import React, { useEffect, useState } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import orderService from '../../services/orderService';
import { mapBackendOrder } from '../../utils/orderMapper';
import { FiCheckCircle, FiShoppingBag, FiTruck, FiFileText } from 'react-icons/fi';

const OrderSuccess = () => {
  const location = useLocation();
  const stateOrder = location.state?.order;
  const statePaymentPending = location.state?.paymentPending;
  const statePaymentMethodId = location.state?.paymentMethodId;
  const [searchParams] = useSearchParams();
  const orderIdFromQuery = searchParams.get('orderId');

  const [order, setOrder] = useState(stateOrder || null);
  const [loading, setLoading] = useState(!stateOrder && !!orderIdFromQuery);
  const [error, setError] = useState('');

  const paymentPending = statePaymentPending;
  const paymentMethodId = statePaymentMethodId || (order && order.paymentMethod);
  const isBankTransfer = paymentMethodId === 'bank_transfer' || paymentMethodId === 'BANK_TRANSFER';
  const orderNumber = order?.orderNumber || order?.id || '—';
  const isTerminal =
    order?.status === 'delivered' ||
    order?.status === 'completed' ||
    ['DELIVERED', 'COMPLETED', 'CANCELLED', 'FAILED', 'REFUNDED', 'RETURNED'].includes(
      String(order?.backendStatus || order?.status || '').toUpperCase()
    );
  const estimatedDelivery = order?.estimatedDelivery;

  useEffect(() => {
    let mounted = true;
    async function fetchOrder() {
      if (!order && orderIdFromQuery) {
        setLoading(true);
        try {
          const resp = await orderService.getOrderById(orderIdFromQuery);
          const payload = resp?.data ?? resp;
          if (mounted) setOrder(mapBackendOrder(payload));
        } catch (err) {
          if (mounted) setError('Unable to load order details');
        } finally {
          if (mounted) setLoading(false);
        }
      }
    }
    fetchOrder();
    return () => {
      mounted = false;
    };
  }, [order, orderIdFromQuery]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-4">
        <div className="text-sm text-gray-600">Loading order details...</div>
      </div>
    );
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4">
      <div className="bg-white rounded-lg border border-gray-200 p-6 sm:p-8 max-w-md w-full text-center">
        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
          <FiCheckCircle className="w-8 h-8 sm:w-10 sm:h-10 text-green-600" />
        </div>

        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
          {paymentPending || isBankTransfer ? 'Order Created' : 'Order Confirmed!'}
        </h1>
        <p className="text-xs sm:text-sm text-gray-600 mb-4 sm:mb-6">
          {isBankTransfer
            ? 'Your order has been created. Complete the bank transfer and submit your payment proof.'
            : paymentPending
              ? 'Your order has been created and is awaiting online payment.'
              : 'Thank you for your order. Your order has been placed successfully.'}
        </p>

        <div className="bg-gray-50 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
          <div className="space-y-2 sm:space-y-3">
            <div>
              <p className="text-xs sm:text-sm text-gray-500">Order Number</p>
              <p className="text-base sm:text-lg font-bold text-gray-900">{orderNumber}</p>
            </div>
            {isTerminal ? (
              <div>
                <p className="text-xs sm:text-sm text-gray-500">Order Status</p>
                <p className="text-base sm:text-lg font-semibold text-gray-900 capitalize">
                  {String(order?.status || order?.backendStatus || 'Completed').replace(/_/g, ' ')}
                </p>
              </div>
            ) : estimatedDelivery ? (
              <div>
                <p className="text-xs sm:text-sm text-gray-500">Estimated Delivery</p>
                <p className="text-base sm:text-lg font-semibold text-gray-900">{estimatedDelivery}</p>
              </div>
            ) : null}
            {order?.amount ? (
              <div>
                <p className="text-xs sm:text-sm text-gray-500">Order Total</p>
                <p className="text-base sm:text-lg font-semibold text-gray-900">₹{Number(order.amount).toFixed(2)}</p>
              </div>
            ) : null}
          </div>
        </div>

        <div className="space-y-2 sm:space-y-3">
          {order?.id && isBankTransfer && (
            <Link
              to={`/vendor/orders/${order.id}/payment`}
              className="w-full py-2.5 h-10 sm:h-12 px-4 sm:px-6 bg-blue-600 text-white rounded-lg text-xs sm:text-sm font-medium flex items-center justify-center gap-1.5 sm:gap-2 hover:bg-blue-700 transition-colors"
            >
              <FiFileText className="w-4 h-4" />
              Submit Payment Proof
            </Link>
          )}
          {order?.id && (
            <Link
              to={`/vendor/orders/${order.id}`}
              className="w-full py-2.5 h-10 sm:h-12 px-4 sm:px-6 bg-blue-600 text-white rounded-lg text-xs sm:text-sm font-medium flex items-center justify-center gap-1.5 sm:gap-2 hover:bg-blue-700 transition-colors"
            >
              <FiFileText className="w-4 h-4" />
              View Order Details
            </Link>
          )}
          <Link
            to="/vendor/orders"
            className="w-full py-2.5 h-10 sm:h-12 px-4 sm:px-6 border border-gray-300 rounded-lg text-xs sm:text-sm font-medium text-gray-700 flex items-center justify-center gap-1.5 sm:gap-2 hover:bg-gray-50 transition-colors"
          >
            <FiFileText className="w-4 h-4" />
            View All Orders
          </Link>
          <Link
            to="/vendor/products"
            className="w-full py-2.5 h-10 sm:h-12 px-4 sm:px-6 border border-gray-300 rounded-lg text-xs sm:text-sm font-medium text-gray-700 flex items-center justify-center gap-1.5 sm:gap-2 hover:bg-gray-50 transition-colors"
          >
            <FiShoppingBag className="w-4 h-4" />
            Continue Shopping
          </Link>
        </div>

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
