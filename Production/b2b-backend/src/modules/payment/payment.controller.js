import { asyncHandler } from '../../utils/asyncHandler.js';
import * as service from './payment.service.js';
import { successResponse } from '../../utils/responseHandler.js';

export const createRazorpayOrder = asyncHandler(async (req, res) => {
  const { amount } = req.body;

  const data = await service.createRazorpayOrder(amount, req.user.id);
  successResponse(res, data, 'Razorpay order created');
});

export const hybridPayment = asyncHandler(async (req, res) => {
  const { orderId, useCredit, totalAmount, paymentMethod } = req.body;

  // Fallback support for both body and params
  const finalOrderId = orderId || req.params.orderId;

  // Validation
  if (!finalOrderId) {
    throw new Error('orderId is required for hybrid payment');
  }

  const data = await service.hybridPayment(finalOrderId, req.user.id, useCredit, totalAmount, paymentMethod);

  successResponse(res, data, 'Hybrid payment processed');
});

export const initiatePayment = asyncHandler(async (req, res) => {
  const data = await service.initiatePayment(
    req.params.orderId,
    req.user.id
  );

  successResponse(res, data, 'Payment initiated');
});

export const verifyPayment = asyncHandler(async (req, res) => {
  const payment = await service.verifyPayment(req.body);

  successResponse(res, payment, 'Payment successful');
});

export const failPayment = asyncHandler(async (req, res) => {
  const { orderId, reason } = req.body;
  const result = await service.failPayment(orderId, reason);
  successResponse(res, result, 'Payment failure recorded');
});

export const razorpayWebhook = asyncHandler(async (req, res) => {
  const signature = req.headers['x-razorpay-signature'];
  
  // 🔒 CRITICAL: Only use raw body for signature verification
  // Never fall back to JSON.stringify to prevent signature bypass
  const rawBody = req.rawBody;
  
  if (!rawBody) {
    logger.error('Webhook rejected: rawBody missing', {
      path: req.path,
      contentType: req.headers['content-type']
    });
    throw new AppError('Webhook processing error - invalid request format', 400);
  }
  
  const result = await service.handleWebhook(rawBody, signature);
  successResponse(res, result, 'Webhook processed');
});

/**
 * 🔒 PHASE 4: Refund endpoints with authorization and validation
 */
export const createRefund = asyncHandler(async (req, res) => {
  const { orderId, amount, reason } = req.body;
  
  const refund = await service.createRefund(
    orderId,
    req.user.id,
    amount,
    reason,
    req.user // Pass full user object for role checking
  );
  
  successResponse(res, refund, 'Refund initiated successfully');
});

export const getRefundHistory = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  
  const refunds = await service.getRefundHistory(orderId);
  
  successResponse(res, refunds, 'Refund history retrieved');
});

export const getRefundById = asyncHandler(async (req, res) => {
  const { refundId } = req.params;
  
  const refund = await service.getRefundById(refundId);
  
  successResponse(res, refund, 'Refund details retrieved');
});