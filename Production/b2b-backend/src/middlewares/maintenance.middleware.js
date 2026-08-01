import jwt from 'jsonwebtoken';
import AppError from '../errors/AppError.js';
import {
  getPlatformSettings,
  getDefaultMaintenanceMessage,
} from '../modules/platformSettings/platformSettings.service.js';
import { ROLES } from '../constants/roles.js';
import { logger } from '../config/logger.js';

const READ_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

const WRITE_ALLOWLIST = [
  /^\/api\/(?:v1\/)?auth\/(?:login|register|refresh-token|forgot-password|reset-password|csrf-token|verify-2fa)/,
  /^\/api\/(?:v1\/)?settings\/public\/config/,
  /^\/api\/(?:v1\/)?health(?:\/|$)/,
  /^\/health(?:\/|$)/,
  /^\/metrics$/,
];

function resolveRequestPath(req) {
  return (req.originalUrl || req.url || '').split('?')[0];
}

function isAllowlistedWrite(path) {
  return WRITE_ALLOWLIST.some((pattern) => pattern.test(path));
}

function extractBearerToken(req) {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.split(' ')[1];
  }
  if (req.cookies?.accessToken) {
    return req.cookies.accessToken;
  }
  return null;
}

function decodeSuperAdminFromRequest(req) {
  const token = extractBearerToken(req);
  if (!token || token === 'null' || token === 'undefined' || !process.env.JWT_SECRET) {
    return false;
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded?.role === ROLES.SUPER_ADMIN;
  } catch {
    return false;
  }
}

export const maintenanceMiddleware = async (req, res, next) => {
  try {
    const settings = await getPlatformSettings();
    if (!settings.maintenanceMode) {
      return next();
    }

    if (READ_METHODS.has(req.method)) {
      return next();
    }

    const path = resolveRequestPath(req);
    if (isAllowlistedWrite(path)) {
      return next();
    }

    if (decodeSuperAdminFromRequest(req)) {
      return next();
    }

    const message =
      settings.maintenanceMessage?.trim() || getDefaultMaintenanceMessage();

    return next(new AppError(message, 503, 'MAINTENANCE_MODE'));
  } catch (error) {
    logger.error('Maintenance middleware error', { error: error.message });
    return next(error);
  }
};
