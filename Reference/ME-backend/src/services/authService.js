import User from '../models/User.js';
import ApiError from '../utils/ApiError.js';
import HttpStatus from '../constants/httpStatus.js';
import { generateToken, comparePassword } from '../utils/authUtils.js';

/**
 * Register a new user
 * @param {object} userData - User registration data
 * @returns {object} Created user and token
 */
export const registerUser = async (userData) => {
  const { name, email, phone, password, role, confirmPassword } = userData;

  // Check if email already exists
  const existingEmail = await User.findOne({ email });
  if (existingEmail) {
    throw new ApiError(
      HttpStatus.CONFLICT,
      'Email already registered'
    );
  }

  // Check if phone already exists
  const existingPhone = await User.findOne({ phone });
  if (existingPhone) {
    throw new ApiError(
      HttpStatus.CONFLICT,
      'Phone number already registered'
    );
  }

  // Validate role (only vendor and delivery can register)
  const allowedRoles = ['vendor', 'delivery'];
  if (!allowedRoles.includes(role)) {
    throw new ApiError(
      HttpStatus.BAD_REQUEST,
      'Invalid role. Only vendor and delivery roles can register'
    );
  }

  // Create user
  const user = await User.create({
    name,
    email,
    phone,
    password,
    role,
    status: 'pending',
    isVerified: false,
  });

  // Generate token
  const token = generateToken({
    userId: user._id,
    role: user.role,
    email: user.email,
  });

  return {
    user: user.toJSON(),
    token,
  };
};

/**
 * Login user
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {object} User data and token
 */
export const loginUser = async (email, password) => {
  // Find user by email and include password field
  const user = await User.findOne({ email }).select('+password');

  if (!user) {
    throw new ApiError(
      HttpStatus.UNAUTHORIZED,
      'Invalid email or password'
    );
  }

  // Check if user is suspended
  if (user.status === 'suspended') {
    throw new ApiError(
      HttpStatus.FORBIDDEN,
      'Account has been suspended. Please contact support.'
    );
  }

  // Check if user is pending (needs admin approval)
  if (user.status === 'pending') {
    throw new ApiError(
      HttpStatus.FORBIDDEN,
      'Account is pending approval. Please wait for admin to approve your account.'
    );
  }

  // Check if user is inactive
  if (user.status === 'inactive') {
    throw new ApiError(
      HttpStatus.FORBIDDEN,
      'Account is inactive. Please contact support.'
    );
  }

  // Verify password
  const isPasswordValid = await comparePassword(password, user.password);
  if (!isPasswordValid) {
    throw new ApiError(
      HttpStatus.UNAUTHORIZED,
      'Invalid email or password'
    );
  }

  // Update last login
  user.lastLogin = new Date();
  await user.save();

  // Generate token
  const token = generateToken({
    userId: user._id,
    role: user.role,
    email: user.email,
  });

  return {
    user: user.toJSON(),
    token,
  };
};

/**
 * Get current user by ID
 * @param {string} userId - User ID
 * @returns {object} User data
 */
export const getCurrentUser = async (userId) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new ApiError(
      HttpStatus.NOT_FOUND,
      'User not found'
    );
  }

  return user.toJSON();
};

/**
 * Change user password
 * @param {string} userId - User ID
 * @param {string} currentPassword - Current password
 * @param {string} newPassword - New password
 * @returns {object} Success message
 */
export const changePassword = async (userId, currentPassword, newPassword) => {
  const user = await User.findById(userId).select('+password');

  if (!user) {
    throw new ApiError(
      HttpStatus.NOT_FOUND,
      'User not found'
    );
  }

  // Verify current password
  const isPasswordValid = await comparePassword(currentPassword, user.password);
  if (!isPasswordValid) {
    throw new ApiError(
      HttpStatus.UNAUTHORIZED,
      'Current password is incorrect'
    );
  }

  // Update password
  user.password = newPassword;
  await user.save();

  return {
    message: 'Password changed successfully',
  };
};

/**
 * Logout user (prepare for token blacklist in future)
 * @returns {object} Success message
 */
export const logoutUser = async () => {
  // For JWT-based auth, logout is mainly client-side (token removal)
  // In future, implement token blacklist/refresh token revocation
  return {
    message: 'Logged out successfully',
  };
};

export default {
  registerUser,
  loginUser,
  getCurrentUser,
  changePassword,
  logoutUser,
};
