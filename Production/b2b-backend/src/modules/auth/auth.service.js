import AppError from '../../errors/AppError.js';
import {
  findUserByEmailOrMobile,
  createUser,
  updateUser,
  findUserById,
} from './auth.repository.js';

import { hashPassword } from '../../utils/hashPassword.js';
import { comparePassword } from '../../utils/comparePassword.js';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyToken,
} from './auth.token.js';
import { fetchSetting } from '../settings/settings.service.js';
import { USER_STATUS } from '../../constants/userStatus.js';
import { ROLES } from '../../constants/roles.js';
import { createCreditAccount } from '../credit/credit.service.js';
import { validatePassword, checkPasswordBreach } from '../../utils/passwordPolicy.js';
import { isAuthStrictMode } from '../../config/authStrictMode.js';
import { fraudDetection } from '../../services/fraudDetection.service.js';
import { twoFactorAuth } from '../../services/twoFactorAuth.service.js';
import RefreshToken from '../../models/RefreshToken.model.js';
import PasswordResetToken from '../../models/PasswordResetToken.model.js';
import crypto from 'crypto';
import { logger } from '../../config/logger.js';
import { sendEmail } from '../../services/email.service.js';

const checkMaintenanceMode = async (user) => {
  const maintenance = await fetchSetting('maintenanceMode');
  const maintenanceOld = await fetchSetting('MAINTENANCE_MODE');
  if ((maintenance?.value === true || maintenanceOld?.value === true) && user?.role !== ROLES.SUPER_ADMIN) {
    throw new AppError('System under maintenance', 503);
  }
};

export const register = async (data, req = {}) => {
  const { email, mobile, password } = data;
  const ip = req.ip || 'unknown';

  // Track registration attempts (fraud detection)
  await fraudDetection.trackRegistration(ip, email);

  // Check if email or mobile already exists
  const existingEmail = email ? await findUserByEmailOrMobile(email) : null;
  const existingMobile = mobile ? await findUserByEmailOrMobile(mobile) : null;

  if (existingEmail || existingMobile) {
    const field = existingEmail ? 'Email' : 'Mobile number';
    throw new AppError(`${field} already registered`, 400);
  }

  // Validate password against security policy
  validatePassword(password, { name: data.name, email, mobile });

  // RE-ENABLE BEFORE PRODUCTION: breach check disabled when AUTH_STRICT_MODE=false
  if (isAuthStrictMode()) {
    const breachCheck = await checkPasswordBreach(password);
    if (breachCheck.breached && breachCheck.count > 1000) {
      logger.warn('User attempted to register with breached password', { email, breachCount: breachCheck.count });
      throw new AppError(
        'This password has been exposed in data breaches. Please choose a different password',
        400
      );
    }
  }

  const hashedPassword = await hashPassword(password);

  const user = await createUser({
    name: data.name,
    email,
    mobile,
    phone: mobile,
    password: hashedPassword,
    role: data.role || ROLES.B2B_CUSTOMER,
    status: USER_STATUS.PENDING,
    lastPasswordChange: new Date(),
    passwordHistory: [{ hash: hashedPassword, changedAt: new Date() }],
  });

  // Create default credit account
  try {
    await createCreditAccount(user._id, 50000);
  } catch (err) {
    logger.error('Failed to create credit account:', err);
  }

  logger.info('User registered', { userId: user._id, email, role: user.role });

  return user;
};

// PASSWORD LOGIN
export const loginWithPassword = async ({ mobile, identifier, password }, req = {}) => {
  const loginIdentifier = identifier || mobile;
  const ip = req.ip || 'unknown';

  if (!loginIdentifier) {
    throw new AppError('Login identifier is required', 400);
  }

  // Check if user is temporarily blocked
  const blockCheck = await fraudDetection.isUserBlocked(loginIdentifier);
  if (blockCheck.blocked) {
    throw new AppError(
      `Account temporarily locked due to ${blockCheck.reason}. Please try again later`,
      403
    );
  }

  const user = await findUserByEmailOrMobile(loginIdentifier);

  if (!user) {
    // Track failed attempt even if user doesn't exist (to prevent enumeration)
    await fraudDetection.trackLoginAttempt(loginIdentifier, ip, false);
    throw new AppError('No account found with this mobile number.', 404);
  }

  // Check Maintenance Mode
  await checkMaintenanceMode(user);

  // Check Approval Status
  if (user.role !== ROLES.SUPER_ADMIN && user.status !== USER_STATUS.ACTIVE) {
    let message = 'Your account is inactive or suspended. Please contact support.';
    if (user.status === USER_STATUS.PENDING) {
      message = 'Your account is awaiting Super Admin approval.';
    } else if (user.status === USER_STATUS.REJECTED) {
      message = 'Your registration has been rejected.';
    }
    throw new AppError(message, 403);
  }

  // Verify password
  const isMatch = await comparePassword(password, user.password);

  if (!isMatch) {
    // Track failed login attempt
    await fraudDetection.trackLoginAttempt(loginIdentifier, ip, false);
    logger.warn('Failed login attempt', { identifier: loginIdentifier, ip });
    throw new AppError('Invalid credentials', 401);
  }

  // Track successful login
  await fraudDetection.trackLoginAttempt(loginIdentifier, ip, true);

  // Check if 2FA is enabled
  if (user.twoFactorEnabled) {
    // Return indicator that 2FA is required
    return {
      requires2FA: true,
      userId: user._id,
      email: user.email,
      twoFactorMethod: user.twoFactorMethod || 'totp'
    };
  }

  // Generate tokens
  // Create a single active session id and persist on user
  const sessionId = crypto.randomUUID();
  const userAgent = req.get?.('user-agent') || 'unknown';
  const device = parseUserAgent(userAgent);

  await updateUser(user._id, {
    activeSessionId: sessionId,
    lastLoginAt: new Date(),
    lastLoginDevice: `${device.browser} ${device.os}`,
    lastLoginIp: req.ip || 'unknown',
  });

  // Ensure access token contains sessionId
  user.activeSessionId = sessionId;
  const accessToken = generateAccessToken(user);
  const refreshTokenValue = await createRefreshToken(user, req);

  logger.info('User logged in', { userId: user._id, ip });

  return { 
    user: sanitizeUser(user), 
    accessToken, 
    refreshToken: refreshTokenValue 
  };
};

// REFRESH TOKEN WITH ROTATION
export const refreshAuthToken = async (token, req = {}) => {
  const ip = req.ip || 'unknown';
  
  // Find active refresh token
  const refreshTokenDoc = await RefreshToken.findActiveToken(token);

  if (!refreshTokenDoc) {
    logger.warn('Invalid or expired refresh token used', { ip });
    throw new AppError('Invalid refresh token', 401);
  }

  // Check for token reuse (rotation abuse detection)
  if (refreshTokenDoc.reuseDetected) {
    logger.error('Refresh token reuse detected - revoking entire family', {
      userId: refreshTokenDoc.userId,
      family: refreshTokenDoc.family,
      ip
    });

    // Revoke entire token family
    await RefreshToken.revokeFamily(refreshTokenDoc.family, 'token_reuse_detected');
    
    throw new AppError('Security violation detected. Please log in again', 401);
  }

  // Mark token as used
  await refreshTokenDoc.markUsed();

  // Get user
  const user = await findUserById(refreshTokenDoc.userId);

  if (!user) {
    throw new AppError('User not found', 404);
  }

  // Check if user is active
  if (user.status !== USER_STATUS.ACTIVE && user.role !== ROLES.SUPER_ADMIN) {
    throw new AppError('Account is not active', 403);
  }

  // Generate new access token
  const accessToken = generateAccessToken(user);

  // Generate new refresh token (rotation)
  const newRefreshToken = await createRefreshToken(user, req, refreshTokenDoc.family);

  // Revoke old refresh token
  await refreshTokenDoc.revoke('system', 'rotated');

  logger.info('Tokens rotated successfully', { userId: user._id });

  return { 
    accessToken, 
    refreshToken: newRefreshToken,
    user: sanitizeUser(user)
  };
};

/**
 * Create refresh token with device tracking
 */
const createRefreshToken = async (user, req = {}, existingFamily = null) => {
  const ip = req.ip || 'unknown';
  const userAgent = req.get?.('user-agent') || 'unknown';

  // Ensure refresh token is unique by appending a short random suffix
  const tokenValue = `${generateRefreshToken(user)}.${crypto.randomBytes(6).toString('hex')}`;
  const family = existingFamily || crypto.randomBytes(16).toString('hex');

  const deviceInfo = parseUserAgent(userAgent);

  await RefreshToken.create({
    userId: user._id,
    token: tokenValue,
    family,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    deviceInfo,
    ipAddress: ip
  });

  return tokenValue;
};

/**
 * Verify 2FA code during login
 */
export const verify2FALogin = async ({ userId, code }, req = {}) => {
  const user = await findUserById(userId);

  if (!user) {
    throw new AppError('User not found', 404);
  }

  if (!user.twoFactorEnabled) {
    throw new AppError('2FA is not enabled for this account', 400);
  }

  // Verify 2FA code
  const result = await twoFactorAuth.validateLogin2FA(
    code,
    user.twoFactorSecret,
    user.twoFactorBackupCodes || []
  );

  if (!result.valid) {
    await fraudDetection.trackOTPAttempt(userId, false);
    throw new AppError('Invalid 2FA code', 401);
  }

  // If backup code was used, mark it as used
  if (result.method === 'backup_code') {
    user.twoFactorBackupCodes.splice(result.usedCodeIndex, 1);
    await user.save();
    logger.warn('Backup code used for login', { userId: user._id });
  }

  // Generate tokens
  const accessToken = generateAccessToken(user);
  const refreshToken = await createRefreshToken(user, req);

  logger.info('2FA login successful', { userId: user._id, method: result.method });

  return {
    user: sanitizeUser(user),
    accessToken,
    refreshToken
  };
};

/**
 * Enable 2FA for user
 */
export const enable2FA = async (userId) => {
  const user = await findUserById(userId);

  if (!user) {
    throw new AppError('User not found', 404);
  }

  if (user.twoFactorEnabled) {
    throw new AppError('2FA is already enabled', 400);
  }

  const { secret, qrCode, backupCodes, hashedBackupCodes } = await twoFactorAuth.enable2FA(user);

  // Store secret and backup codes
  await updateUser(user._id, {
    twoFactorSecret: secret,
    twoFactorBackupCodes: hashedBackupCodes,
    twoFactorEnabled: false // Will be enabled after verification
  });

  logger.info('2FA setup initiated', { userId: user._id });

  return {
    qrCode,
    backupCodes, // Return plain codes to user ONCE
    secret // For manual entry
  };
};

/**
 * Verify and confirm 2FA setup
 */
export const verify2FASetup = async (userId, code) => {
  const user = await findUserById(userId);

  if (!user || !user.twoFactorSecret) {
    throw new AppError('2FA setup not initiated', 400);
  }

  const isValid = twoFactorAuth.verifyToken(code, user.twoFactorSecret);

  if (!isValid) {
    throw new AppError('Invalid verification code', 400);
  }

  // Enable 2FA
  await updateUser(user._id, {
    twoFactorEnabled: true
  });

  logger.info('2FA enabled', { userId: user._id });

  return { success: true };
};

/**
 * Disable 2FA
 */
export const disable2FA = async (userId, password) => {
  const user = await findUserById(userId);

  if (!user) {
    throw new AppError('User not found', 404);
  }

  // Verify password
  const isMatch = await comparePassword(password, user.password);

  if (!isMatch) {
    throw new AppError('Invalid password', 401);
  }

  // Disable 2FA
  await updateUser(user._id, {
    twoFactorEnabled: false,
    twoFactorSecret: null,
    twoFactorBackupCodes: []
  });

  logger.warn('2FA disabled', { userId: user._id });

  return { success: true };
};

/**
 * Change password with security checks
 */
export const changePassword = async (userId, oldPassword, newPassword) => {
  const user = await findUserById(userId);

  if (!user) {
    throw new AppError('User not found', 404);
  }

  // Verify old password
  const isMatch = await comparePassword(oldPassword, user.password);

  if (!isMatch) {
    throw new AppError('Current password is incorrect', 401);
  }

  // Validate new password
  validatePassword(newPassword, { 
    name: user.name, 
    email: user.email, 
    mobile: user.mobile 
  });

  // Check if new password is different from old
  if (oldPassword === newPassword) {
    throw new AppError('New password must be different from current password', 400);
  }

  // RE-ENABLE BEFORE PRODUCTION: password history check disabled when AUTH_STRICT_MODE=false
  if (isAuthStrictMode() && user.passwordHistory && user.passwordHistory.length > 0) {
    for (const historyItem of user.passwordHistory.slice(-5)) {
      const isReused = await comparePassword(newPassword, historyItem.hash);
      if (isReused) {
        throw new AppError('Cannot reuse recent passwords', 400);
      }
    }
  }

  // RE-ENABLE BEFORE PRODUCTION: breach check disabled when AUTH_STRICT_MODE=false
  if (isAuthStrictMode()) {
    const breachCheck = await checkPasswordBreach(newPassword);
    if (breachCheck.breached && breachCheck.count > 1000) {
      throw new AppError(
        'This password has been exposed in data breaches. Please choose a different password',
        400
      );
    }
  }

  // Hash new password
  const hashedPassword = await hashPassword(newPassword);

  // Update password and history
  const passwordHistory = user.passwordHistory || [];
  passwordHistory.push({ hash: hashedPassword, changedAt: new Date() });

  // Keep only last 5 passwords
  if (passwordHistory.length > 5) {
    passwordHistory.shift();
  }

  await updateUser(user._id, {
    password: hashedPassword,
    lastPasswordChange: new Date(),
    passwordHistory
  });

  // Invalidate all sessions (force re-login)
  await RefreshToken.revokeAllUserTokens(user._id, 'password_change');

  logger.info('Password changed', { userId: user._id });

  return { success: true, message: 'Password changed successfully. Please log in again' };
};

/**
 * Logout - revoke refresh token
 */
export const logout = async (refreshToken) => {
  if (!refreshToken) {
    return { success: true };
  }

  const tokenDoc = await RefreshToken.findActiveToken(refreshToken);

  if (tokenDoc) {
    await tokenDoc.revoke('user', 'manual_logout');
    // Clear activeSessionId for the user to invalidate sessions
    try {
      await updateUser(tokenDoc.userId, { activeSessionId: null });
    } catch (err) {
      logger.warn('Failed to clear activeSessionId on logout', { userId: tokenDoc.userId });
    }
    logger.info('User logged out', { userId: tokenDoc.userId });
  }

  return { success: true };
};

/**
 * Logout from all devices
 */
export const logoutAll = async (userId) => {
  await RefreshToken.revokeAllUserTokens(userId, 'logout_all');
  logger.info('User logged out from all devices', { userId });
  return { success: true };
};

/**
 * Get active sessions
 */
export const getActiveSessions = async (userId) => {
  return await RefreshToken.getActiveUserTokens(userId);
};

/**
 * Revoke specific session
 */
export const revokeSession = async (userId, tokenId) => {
  const token = await RefreshToken.findById(tokenId);

  if (!token || token.userId.toString() !== userId.toString()) {
    throw new AppError('Session not found', 404);
  }

  await token.revoke('user', 'manual_revocation');

  return { success: true };
};

/**
 * Sanitize user data (remove sensitive fields)
 */
const sanitizeUser = (user) => {
  const userObj = user.toObject ? user.toObject() : user;
  delete userObj.password;
  delete userObj.refreshToken;
  delete userObj.twoFactorSecret;
  delete userObj.twoFactorBackupCodes;
  delete userObj.passwordHistory;
  delete userObj.otp;
  return userObj;
};

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000;

export const requestPasswordReset = async (identifier) => {
  const user = await findUserByEmailOrMobile(identifier);

  if (!user) {
    return { message: 'If an account exists, a reset link has been sent' };
  }

  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

  await PasswordResetToken.deleteMany({ userId: user._id, usedAt: null });
  await PasswordResetToken.create({
    userId: user._id,
    tokenHash,
    expiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS),
  });

  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const resetUrl = `${frontendUrl}/reset-password?token=${rawToken}`;

  await sendEmail({
    to: user.email,
    subject: 'Reset your Mokshith Enterprises password',
    message: `Use this link to reset your password (valid for 1 hour): ${resetUrl}`,
  });

  logger.info('Password reset requested', { userId: user._id });

  return {
    message: 'If an account exists, a reset link has been sent',
    ...(process.env.NODE_ENV === 'development' ? { resetUrl } : {}),
  };
};

export const resetPassword = async (token, newPassword) => {
  if (!token) {
    throw new AppError('Reset token is required', 400);
  }

  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const resetDoc = await PasswordResetToken.findOne({
    tokenHash,
    usedAt: null,
    expiresAt: { $gt: new Date() },
  });

  if (!resetDoc) {
    throw new AppError('Invalid or expired reset token', 400);
  }

  const user = await findUserById(resetDoc.userId);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  validatePassword(newPassword, {
    name: user.name,
    email: user.email,
    mobile: user.mobile,
  });

  const hashedPassword = await hashPassword(newPassword);

  await updateUser(user._id, {
    password: hashedPassword,
    lastPasswordChange: new Date(),
  });

  resetDoc.usedAt = new Date();
  await resetDoc.save();

  await RefreshToken.revokeAllUserTokens(user._id, 'password_reset');

  return { success: true };
};

/**
 * Parse user agent for device tracking
 */
const parseUserAgent = (userAgent) => {
  // Simple parsing - use ua-parser-js in production
  const isChrome = /Chrome/.test(userAgent);
  const isFirefox = /Firefox/.test(userAgent);
  const isSafari = /Safari/.test(userAgent) && !isChrome;
  const isEdge = /Edg/.test(userAgent);

  const isWindows = /Windows/.test(userAgent);
  const isMac = /Macintosh/.test(userAgent);
  const isLinux = /Linux/.test(userAgent);
  const isAndroid = /Android/.test(userAgent);
  const isiOS = /iPhone|iPad/.test(userAgent);

  return {
    browser: isChrome ? 'Chrome' : isFirefox ? 'Firefox' : isSafari ? 'Safari' : isEdge ? 'Edge' : 'Unknown',
    os: isWindows ? 'Windows' : isMac ? 'macOS' : isLinux ? 'Linux' : isAndroid ? 'Android' : isiOS ? 'iOS' : 'Unknown',
    deviceName: isiOS || isAndroid ? 'Mobile' : 'Desktop',
    userAgent
  };
};