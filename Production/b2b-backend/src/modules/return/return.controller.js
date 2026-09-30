import { asyncHandler } from '../../utils/asyncHandler.js';
import { successResponse } from '../../utils/responseHandler.js';
import * as service from './return.service.js';

export const create = asyncHandler(async (req, res) => successResponse(res, await service.createReturn(req.body, req.user), 'Return request created'));
export const list = asyncHandler(async (req, res) => successResponse(res, await service.listReturns(req.query, req.user)));
export const getById = asyncHandler(async (req, res) => successResponse(res, await service.getReturn(req.params.id, req.user)));
export const cancel = asyncHandler(async (req, res) => successResponse(res, await service.cancelReturn(req.params.id, req.user), 'Return cancelled'));
export const approve = asyncHandler(async (req, res) => successResponse(res, await service.approveReturn(req.params.id, req.user), 'Return approved'));
export const reject = asyncHandler(async (req, res) => successResponse(res, await service.rejectReturn(req.params.id, req.body.note, req.user), 'Return rejected'));
export const receive = asyncHandler(async (req, res) => successResponse(res, await service.receiveReturn(req.params.id, req.body, req.user), 'Return received'));
export const inspect = asyncHandler(async (req, res) => successResponse(res, await service.inspectReturn(req.params.id, req.body, req.user), 'Inspection completed'));
export const refund = asyncHandler(async (req, res) => successResponse(res, await service.refundReturn(req.params.id, req.user), 'Refund processed'));
export const replace = asyncHandler(async (req, res) => successResponse(res, await service.replaceReturn(req.params.id, req.user), 'Replacement processed'));
