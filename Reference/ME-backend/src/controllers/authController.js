import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/ApiResponse.js';
import HttpStatus from '../constants/httpStatus.js';
import * as authService from '../services/authService.js';

/**
 * Register a new user
 * POST /api/v1/auth/register
 */
export const register = asyncHandler(async (req, res) => {
  const { name, email, phone, password, role, confirmPassword } = req.body;

  const result = await authService.registerUser({
    name,
    email,
    phone,
    password,
    role,
    confirmPassword,
  });

  res.status(HttpStatus.CREATED).json(
    new ApiResponse(
      HttpStatus.CREATED,
      result,
      'User registered successfully'
    )
  );
});

/**
 * Login user
 * POST /api/v1/auth/login
 */
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const result = await authService.loginUser(email, password);

  res.status(HttpStatus.OK).json(
    new ApiResponse(
      HttpStatus.OK,
      result,
      'Login successful'
    )
  );
});

/**
 * Logout user
 * POST /api/v1/auth/logout
 */
export const logout = asyncHandler(async (req, res) => {
  const result = await authService.logoutUser();

  res.status(HttpStatus.OK).json(
    new ApiResponse(
      HttpStatus.OK,
      result,
      'Logout successful'
    )
  );
});

/**
 * Get current user
 * GET /api/v1/auth/me
 */
export const getCurrentUser = asyncHandler(async (req, res) => {
  const user = await authService.getCurrentUser(req.user.userId);

  res.status(HttpStatus.OK).json(
    new ApiResponse(
      HttpStatus.OK,
      { user },
      'User retrieved successfully'
    )
  );
});

/**
 * Change password
 * PUT /api/v1/auth/change-password
 */
export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword, confirmPassword } = req.body;

  const result = await authService.changePassword(
    req.user.userId,
    currentPassword,
    newPassword
  );

  res.status(HttpStatus.OK).json(
    new ApiResponse(
      HttpStatus.OK,
      result,
      'Password changed successfully'
    )
  );
});

export default {
  register,
  login,
  logout,
  getCurrentUser,
  changePassword,
};
