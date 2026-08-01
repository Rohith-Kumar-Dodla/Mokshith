import { asyncHandler } from '../../utils/asyncHandler.js';
import * as service from './invoice.service.js';
import Order from '../order/order.model.js';
import AppError from '../../errors/AppError.js';
import { successResponse } from '../../utils/responseHandler.js';

/**
 * Owner-or-admin gate for invoice routes keyed by orderId.
 * Mirrors order.service ownership checks used by GET /orders/:id/invoice.
 */
const assertOrderInvoiceAccess = async (orderId, user) => {
  const order = await Order.findById(orderId).select('userId');
  if (!order) throw new AppError('Order not found', 404);

  const orderUserId = order.userId?._id ?? order.userId;
  const userId = user?.id || user?._id;
  const role = user?.role || null;

  if (
    !(role === 'ADMIN' || role === 'SUPER_ADMIN') &&
    userId &&
    orderUserId.toString() !== userId.toString()
  ) {
    throw new AppError('Access denied', 403);
  }

  return order;
};

export const generateInvoice = asyncHandler(async (req, res) => {
  await assertOrderInvoiceAccess(req.params.orderId, req.user);
  const invoice = await service.generateInvoice(req.params.orderId);
  successResponse(res, invoice, 'Invoice generated');
});

export const getInvoiceByOrderId = asyncHandler(async (req, res) => {
  await assertOrderInvoiceAccess(req.params.orderId, req.user);
  const invoice = await service.getInvoiceByOrderId(req.params.orderId);
  if (!invoice) throw new AppError('Invoice not found', 404);
  successResponse(res, invoice, 'Invoice fetched');
});

export const getInvoices = asyncHandler(async (req, res) => {
  const invoices = await service.getInvoicesForUser(req.user.id);
  successResponse(res, invoices || []);
});