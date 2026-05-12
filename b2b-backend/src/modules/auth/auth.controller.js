import { asyncHandler } from '../../utils/asyncHandler.js';
import * as authService from './auth.service.js';
import { successResponse } from '../../utils/responseHandler.js';
import Audit from '../audit/audit.model.js';

export const register = asyncHandler(async (req, res) => {
  const user = await authService.register(req.body);
  
  // Log action
  await Audit.create({
    userId: user._id,
    userEmail: user.email,
    role: user.role,
    action: 'REGISTER',
    entity: 'USER',
    entityId: user._id,
    details: `User registered: ${user.email}`,
    ip: req.ip,
    severity: 'INFO'
  });

  successResponse(res, user, 'User registered');
});

export const login = asyncHandler(async (req, res) => {
  try {
    const data = await authService.loginWithPassword(req.body);
    const user = data.user || data;

    // Log success
    await Audit.create({
      userId: user._id,
      userEmail: user.email,
      role: user.role,
      action: 'LOGIN_SUCCESS',
      entity: 'USER',
      entityId: user._id,
      details: `User logged in: ${user.email}`,
      ip: req.ip,
      severity: 'INFO'
    });

    successResponse(res, data, 'Login successful');
  } catch (error) {
    // Log failure
    await Audit.create({
      userEmail: req.body.identifier,
      action: 'LOGIN_FAILED',
      entity: 'USER',
      details: `Failed login attempt for: ${req.body.identifier}. Reason: ${error.message}`,
      ip: req.ip,
      severity: 'WARNING'
    });
    throw error;
  }
});

export const sendOTP = asyncHandler(async (req, res) => {
  const otp = await authService.sendOTP(req.body.identifier);

  // 🔥 SECURITY FIX: Never expose OTP in response (even in dev)
  successResponse(res, { message: 'OTP sent to your email/SMS' }, 'OTP sent successfully');
});

export const verifyOTP = asyncHandler(async (req, res) => {
  const data = await authService.verifyOTP(req.body);
  successResponse(res, data, 'OTP verified');
});

export const refreshToken = asyncHandler(async (req, res) => {
  const { token } = req.body;

  const data = await authService.refreshAuthToken(token);

  successResponse(res, data, 'Token refreshed');
});