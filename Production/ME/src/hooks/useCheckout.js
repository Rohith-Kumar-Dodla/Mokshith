import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import orderService from '../services/orderService';
import paymentService from '../services/paymentService';
import { mapBackendOrder } from '../utils/orderMapper';
import { openRazorpayCheckout } from '../utils/razorpayCheckout';

const PAYMENT_METHOD_MAP = {
  cod: 'COD',
  upi: 'UPI',
  credit: 'CREDIT',
  online: 'ONLINE',
  hybrid: 'ONLINE',
  card: 'CARD',
  razorpay: 'RAZORPAY',
  bank_transfer: 'BANK_TRANSFER',
};

export function mapPaymentMethodToBackend(paymentId) {
  return PAYMENT_METHOD_MAP[paymentId] || 'COD';
}

const ONLINE_PAYMENT_METHODS = new Set(['upi', 'online']);
const HYBRID_PAYMENT_METHODS = new Set(['hybrid']);
const BANK_TRANSFER_METHODS = new Set(['bank_transfer']);

function unwrapPayload(response) {
  return response?.data ?? response;
}

export function buildShippingAddress(formData) {
  const phone = String(formData.phone || '').replace(/\D/g, '').slice(-10);

  return {
    name: formData.contactPerson || formData.businessName || formData.name || 'Customer',
    phone,
    addressLine: formData.deliveryAddress || formData.addressLine || '',
    city: formData.city || '',
    state: formData.state || '',
    pincode: String(formData.pincode || '').replace(/\D/g, '').slice(0, 6),
  };
}

async function processOnlinePayment(orderId, mappedOrder, formData) {
  const paymentInit = unwrapPayload(await paymentService.initiatePayment(orderId));
  const gateway = paymentInit?.gateway ?? paymentInit?.data?.gateway ?? {};
  const paymentAmount = Number(
    gateway.amount ? gateway.amount / 100 : mappedOrder?.amount ?? 0
  );

  const verificationPayload = await openRazorpayCheckout({
    amount: paymentAmount,
    currency: gateway.currency || 'INR',
    orderId,
    razorpayOrderId: gateway.id || gateway.order_id || gateway.gatewayOrderId,
    customerName: formData.contactPerson || formData.businessName,
    customerEmail: formData.email,
    customerPhone: formData.phone,
    description: `Payment for order ${mappedOrder?.orderNumber || orderId}`,
  });

  await paymentService.verifyPayment(verificationPayload);

  return {
    ...mappedOrder,
    paymentStatus: 'paid',
    backendStatus: 'CONFIRMED',
  };
}

async function processHybridPayment(orderId, mappedOrder, formData, totalAmount) {
  const hybridResult = unwrapPayload(
    await paymentService.hybridPayment({
      orderId,
      totalAmount,
      useCredit: true,
      paymentMethod: 'HYBRID',
    })
  );

  if (hybridResult.paidFullyByCredit) {
    return {
      ...mappedOrder,
      paymentStatus: 'paid',
      backendStatus: 'CONFIRMED',
      creditUsed: hybridResult.creditUsed,
    };
  }

  const gateway = hybridResult.gateway || {};
  const remainingAmount = Number(hybridResult.remainingAmount || 0);
  const paymentAmount = gateway.amount ? gateway.amount / 100 : remainingAmount;

  const verificationPayload = await openRazorpayCheckout({
    amount: paymentAmount,
    currency: 'INR',
    orderId,
    razorpayOrderId: gateway.gatewayOrderId || gateway.id,
    customerName: formData.contactPerson || formData.businessName,
    customerEmail: formData.email,
    customerPhone: formData.phone,
    description: `Hybrid payment for order ${mappedOrder?.orderNumber || orderId}`,
  });

  await paymentService.verifyPayment(verificationPayload);

  return {
    ...mappedOrder,
    paymentStatus: 'paid',
    backendStatus: 'CONFIRMED',
    creditUsed: hybridResult.creditUsed,
  };
}

export function useCheckout({ onSuccess } = {}) {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const placeOrder = useCallback(
    async ({ formData, paymentMethodId, orderTotal }) => {
      setSubmitting(true);
      setError(null);

      try {
        const shippingAddress = buildShippingAddress(formData);
        const idempotencyKey = `order-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
        // TEMP LOG: help debug duplicate submissions
        console.debug('Placing order - generated idempotencyKey', { idempotencyKey, user: formData?.email || 'unknown' });

        const payload = {
          paymentMethod: mapPaymentMethodToBackend(paymentMethodId),
          shippingAddress,
          idempotencyKey,
        };

        const response = await orderService.createOrder(payload);
        const orderPayload = unwrapPayload(response);
        let mappedOrder = mapBackendOrder(orderPayload);
        const orderId = mappedOrder?.id;
        const totalAmount = Number(orderTotal ?? mappedOrder?.amount ?? 0);
        let paymentPending = mappedOrder?.backendStatus === 'PENDING_PAYMENT';

        if (HYBRID_PAYMENT_METHODS.has(paymentMethodId)) {
          try {
            mappedOrder = await processHybridPayment(orderId, mappedOrder, formData, totalAmount);
            paymentPending = false;
          } catch (paymentError) {
            await paymentService.failPayment(orderId, paymentError.message || 'Hybrid payment failed');
            throw paymentError;
          }
        } else if (ONLINE_PAYMENT_METHODS.has(paymentMethodId)) {
          try {
            mappedOrder = await processOnlinePayment(orderId, mappedOrder, formData);
            paymentPending = false;
          } catch (paymentError) {
            await paymentService.failPayment(orderId, paymentError.message || 'Payment failed');
            throw paymentError;
          }
        } else if (BANK_TRANSFER_METHODS.has(paymentMethodId)) {
          if (onSuccess) {
            await onSuccess(mappedOrder);
          }

          navigate(`/vendor/orders/${orderId}/payment`, {
            replace: true,
            state: { order: mappedOrder },
          });

          return mappedOrder;
        }

        if (onSuccess) {
          await onSuccess(mappedOrder);
        }

        navigate('/vendor/order-success', {
          replace: true,
          state: {
            order: mappedOrder,
            paymentPending,
            paymentMethodId,
          },
        });

        return mappedOrder;
      } catch (submitError) {
        const message =
          submitError?.response?.data?.message ||
          submitError.message ||
          'Failed to place order';
        setError(message);
        throw new Error(message);
      } finally {
        setSubmitting(false);
      }
    },
    [navigate, onSuccess]
  );

  return {
    submitting,
    error,
    placeOrder,
    setError,
  };
}

export default useCheckout;
