import { asyncHandler } from '../../utils/asyncHandler.js';
import * as adminService from '../admin/admin.service.js';
import { successResponse } from '../../utils/responseHandler.js';
import { USER_STATUS } from '../../constants/userStatus.js';

export const getAdminApprovals = asyncHandler(async (req, res) => {
  const approvals = await adminService.getAdminApprovals();
  successResponse(res, approvals);
});

export const getPendingAdminApprovals = asyncHandler(async (req, res) => {
  const approvals = await adminService.getPendingUsers();
  successResponse(res, approvals);
});

export const approveAdmin = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const user = await adminService.changeUserStatus(id, USER_STATUS.ACTIVE);
  successResponse(res, user, 'User approved successfully');
});

export const rejectAdmin = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const user = await adminService.changeUserStatus(id, USER_STATUS.REJECTED);
  successResponse(res, user, 'User rejected successfully');
});
