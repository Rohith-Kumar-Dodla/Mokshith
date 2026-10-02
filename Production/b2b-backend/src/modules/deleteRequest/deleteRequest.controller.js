import { asyncHandler } from '../../utils/asyncHandler.js';
import { successResponse } from '../../utils/responseHandler.js';
import * as service from './deleteRequest.service.js';

export const create = asyncHandler(async (req, res) => successResponse(res, await service.createDeleteRequest(req.body, req.user), 'Delete request submitted', 201));
export const list = asyncHandler(async (req, res) => successResponse(res, await service.listDeleteRequests(req.query)));
export const approve = asyncHandler(async (req, res) => successResponse(res, await service.approveDeleteRequest(req.params.id, req.user), 'Delete request approved'));
export const reject = asyncHandler(async (req, res) => successResponse(res, await service.rejectDeleteRequest(req.params.id, req.body.rejectionReason, req.user), 'Delete request rejected'));
