import { asyncHandler } from '../../utils/asyncHandler.js';
import { successResponse } from '../../utils/responseHandler.js';
import * as service from './supplierOrder.service.js';

export const eligible = asyncHandler(async (req, res) => successResponse(res, await service.getEligibleForOrder(req.params.orderId)));
export const listForOrder = asyncHandler(async (req, res) => successResponse(res, await service.listForOrder(req.params.orderId)));
export const create = asyncHandler(async (req, res) => successResponse(res, await service.createForOrder({ ...req.body, actorId: req.user._id }), 'Supplier orders created', 201));
export const whatsapp = asyncHandler(async (req, res) => successResponse(res, await service.generateWhatsApp(req.params.id, req.user._id)));
export const whatsappOpened = asyncHandler(async (req, res) => successResponse(res, await service.markWhatsAppOpened(req.params.id, req.user._id)));
export const transition = asyncHandler(async (req, res) => successResponse(res, await service.transition(req.params.id, req.body.status, req.user._id, req.body.reason)));
