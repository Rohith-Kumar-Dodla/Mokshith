import { asyncHandler } from '../../utils/asyncHandler.js';
import * as adminService from '../admin/admin.service.js';
import { successResponse } from '../../utils/responseHandler.js';
import { USER_STATUS } from '../../constants/userStatus.js';
import { publishSuperAdminEvent } from '../notification/businessNotification.service.js';

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
  await publishSuperAdminEvent('USER_APPROVED', { entityType: 'USER', entityId: user._id, actorId: req.user?._id, businessKey: String(user.updatedAt?.getTime?.() || Date.now()), status: USER_STATUS.ACTIVE, message: `User “${user.name}” was approved.` });
  successResponse(res, user, 'User approved successfully');
});

export const rejectAdmin = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const user = await adminService.changeUserStatus(id, USER_STATUS.REJECTED);
  await publishSuperAdminEvent('USER_REJECTED', { entityType: 'USER', entityId: user._id, actorId: req.user?._id, businessKey: String(user.updatedAt?.getTime?.() || Date.now()), status: USER_STATUS.REJECTED, message: `User “${user.name}” was rejected.` });
  successResponse(res, user, 'User rejected successfully');
});
