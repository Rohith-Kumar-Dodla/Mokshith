import { asyncHandler } from '../../utils/asyncHandler.js';
import * as service from './order.service.js';
import { successResponse } from '../../utils/responseHandler.js';

export const createOrder = asyncHandler(async (req, res) => {
  // TEMP LOG: trace incoming order creation attempts (for debug)
  try {
    const incomingKeyHeader = req.headers['idempotency-key'] || null;
    console.debug('Order.create - incoming', {
      userId: req.user?.id,
      path: req.path,
      idempotencyHeader: incomingKeyHeader,
      bodyIdempotency: req.body?.idempotencyKey || null,
      paymentMethod: req.body?.paymentMethod,
      items: Array.isArray(req.body?.items) ? req.body.items.length : undefined,
    });
  } catch (e) {
    // ignore logging errors
  }

  const order = await service.createOrder(
    req.user.id,
    req.body
  );

  successResponse(res, order, 'Order created');
});

export const getOrders = asyncHandler(async (req, res) => {
  const result = await service.getOrders(req.user, req.query);
  successResponse(res, result);
});

export const getOrderById = asyncHandler(async (req, res) => {
  const order = await service.getOrderByIdWithUser(req.params.id, req.user);
  successResponse(res, order);
});

export const downloadInvoice = asyncHandler(async (req, res) => {
  const { filePath, fileName } = await service.downloadInvoice(req.params.id, req.user);
  res.download(filePath, fileName);
});

export const markOrderAsFailed = asyncHandler(async (req, res) => {
  const order = await service.markOrderAsFailedWithUser(req.params.id, req.user);
  successResponse(res, order, 'Order marked as failed');
});

export const updateOrderStatus = asyncHandler(async (req, res) => {
  const order = await service.updateOrderStatus(
    req.params.id,
    req.body.status,
    req.user,
    req.body.note
  );

  successResponse(res, order, 'Order status updated');
});