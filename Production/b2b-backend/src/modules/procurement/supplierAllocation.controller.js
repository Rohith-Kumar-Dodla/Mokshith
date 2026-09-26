import { asyncHandler } from '../../utils/asyncHandler.js';
import { successResponse } from '../../utils/responseHandler.js';
import * as service from './supplierAllocation.service.js';

export const getForOrder = asyncHandler(async (req, res) => successResponse(res, await service.getForOrder(req.params.orderId)));
export const queue = asyncHandler(async (req, res) => successResponse(res, await service.listQueue(req.query)));
export const metrics = asyncHandler(async (req, res) => successResponse(res, await service.getMetrics()));
export const allocate = asyncHandler(async (req, res) => successResponse(res, await service.allocate({ ...req.body, actorId: req.user._id, ip: req.ip }), 'Allocation created', 201));
export const createRequests = asyncHandler(async (req, res) => successResponse(res, await service.createRequests({ ...req.body, actorId: req.user._id, ip: req.ip }), 'Supplier requests created', 201));
