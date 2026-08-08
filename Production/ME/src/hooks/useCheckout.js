import { useCallback, useRef, useState } from 'react';
import { getUserFacingErrorMessage } from '../utils/apiResponse';
import { useNavigate } from 'react-router-dom';
import orderService from '../services/orderService';
import paymentService from '../services/paymentService';
import api from '../services/api';
import { mapBackendOrder } from '../utils/orderMapper';
import { openRazorpayCheckout } from '../utils/razorpayCheckout';
import { fetchCsrfToken } from '../utils/csrf';
import {
  isDefiniteOrderFailure,
  isUncertainOrderError,
} from '../utils/orderReconciliation';

const PAYMENT_METHOD_MAP = {
  cod: 'COD',
  upi: 'UPI',
  credit: 'CREDIT',
  online: 'ONLINE',
  hybrid: 'ONLINE',
  card: 'CARD',
  // Map frontend Razorpay selection to backend 'ONLINE' enum to match payment model
  razorpay: 'ONLINE',
  bank_transfer: 'BANK_TRANSFER',
};

export function mapPaymentMethodToBackend(paymentId) {
  return PAYMENT_METHOD_MAP[paymentId] || 'COD';
}

const ONLINE_PAYMENT_METHODS = new Set(['razorpay', 'online', 'upi']);
const HYBRID_PAYMENT_METHODS = new Set(['hybrid']);
const BANK_TRANSFER_METHODS = new Set(['bank_transfer']);

const GLOBAL_PLACE_ORDER_KEY = '__b2bPlaceOrderInFlight';

const isPlaceOrderInFlightGlobally = () =>
  typeof window !== 'undefined' && window[GLOBAL_PLACE_ORDER_KEY] === true;

const setPlaceOrderInFlightGlobally = (inFlight) => {
  if (typeof window !== 'undefined') {
    window[GLOBAL_PLACE_ORDER_KEY] = inFlight;
  }
};

function unwrapPayload(response) {
  return response?.data ?? response;
}

async function reconcileCreatedOrder(idempotencyKey, lastPayload = null) {
  if (!idempotencyKey) return null;

  // Prefer idempotent replay with the same payload — backend returns the original order
  if (lastPayload) {
    try {
      const replay = await orderService.createOrder(
        { ...lastPayload, idempotencyKey },
        { skipInFlightGuard: true }
      );
      const orderPayload = unwrapPayload(replay);
      const mapped = mapBackendOrder(orderPayload);
      if (mapped?.id) return mapped;
    } catch {
      // Fall through to list reconciliation
    }
  }

  try {
    const listResponse = await orderService.getAllOrders({ page: 1, limit: 20 });
    const payload = unwrapPayload(listResponse);
    const orders = Array.isArray(payload)
      ? payload
      : payload?.orders ?? payload?.data?.orders ?? payload?.data ?? [];
    const match = orders.find(
      (order) => String(order?.idempotencyKey || '') === String(idempotencyKey)
    );
    return match ? mapBackendOrder(match) : null;
  } catch {
    return null;
  }
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
  const placeOrderInFlightRef = useRef(false);

  const finalizeSuccess = useCallback(
    async ({ mappedOrder, paymentPending, paymentMethodId }) => {
      if (onSuccess) {
        await onSuccess(mappedOrder);
      }

      navigate(`/vendor/order-success?orderId=${mappedOrder.id}`, {
        replace: true,
        state: {
          order: mappedOrder,
          paymentPending,
          paymentMethodId,
        },
      });

      return mappedOrder;
    },
    [navigate, onSuccess]
  );

  const placeOrder = useCallback(
    async ({ formData, paymentMethodId, orderTotal, idempotencyKey: providedIdempotencyKey }) => {
      if (isPlaceOrderInFlightGlobally() || placeOrderInFlightRef.current) {
        return;
      }
      placeOrderInFlightRef.current = true;
      setPlaceOrderInFlightGlobally(true);
      setSubmitting(true);
      setError(null);

      const shippingAddress = buildShippingAddress(formData);
      const idempotencyKey =
        providedIdempotencyKey ||
        `order-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

      try {
        await fetchCsrfToken(api, true);

        const payload = {
          paymentMethod: mapPaymentMethodToBackend(paymentMethodId),
          shippingAddress,
          idempotencyKey,
        };

        let response;
        try {
          response = await orderService.createOrder(payload);
        } catch (createError) {
          if (isDefiniteOrderFailure(createError)) {
            throw createError;
          }

          if (isUncertainOrderError(createError)) {
            const reconciled = await reconcileCreatedOrder(idempotencyKey, payload);
            if (reconciled?.id) {
              let paymentPending = reconciled?.backendStatus === 'PENDING_PAYMENT';
              if (
                !ONLINE_PAYMENT_METHODS.has(paymentMethodId) &&
                !HYBRID_PAYMENT_METHODS.has(paymentMethodId) &&
                !BANK_TRANSFER_METHODS.has(paymentMethodId)
              ) {
                return finalizeSuccess({
                  mappedOrder: reconciled,
                  paymentPending,
                  paymentMethodId,
                });
              }
              // Online / hybrid / bank_transfer still need their follow-up flows below
              response = { data: reconciled.raw || reconciled };
            } else {
              throw new Error(
                'Order status is uncertain. Please check My Orders before placing again.'
              );
            }
          } else {
            throw createError;
          }
        }

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

        return finalizeSuccess({
          mappedOrder,
          paymentPending,
          paymentMethodId,
        });
      } catch (submitError) {
        const message =
          getUserFacingErrorMessage(submitError, 'Failed to place order');
        setError(message);
        throw new Error(message);
      } finally {
        placeOrderInFlightRef.current = false;
        setPlaceOrderInFlightGlobally(false);
        setSubmitting(false);
      }
    },
    [finalizeSuccess, navigate, onSuccess]
  );

  return {
    submitting,
    error,
    placeOrder,
    setError,
  };
}

export default useCheckout;
