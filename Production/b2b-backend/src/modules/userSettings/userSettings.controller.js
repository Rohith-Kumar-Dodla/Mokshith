import { asyncHandler } from '../../utils/asyncHandler.js';
import { successResponse } from '../../utils/responseHandler.js';
import * as service from './userSettings.service.js';

export const getUserSettings = asyncHandler(async (req, res) => {
  const settings = await service.getOrCreateUserSettings(req.user.id, req.user.role);
  successResponse(res, settings);
});

export const updateUserSettings = asyncHandler(async (req, res) => {
  const settings = await service.updateUserSettings(req.user.id, req.user.role, req.body);
  successResponse(res, settings, 'Settings updated successfully');
});
