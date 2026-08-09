import { logger } from '../config/logger.js';
import AppError from '../errors/AppError.js';

export const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;
  error.statusCode = err.statusCode || 500;

  // 🔥 Log for developers (full technical detail; classification happens below)
  const logData = {
    message: err.message,
    statusCode: err.statusCode || 500,
    path: req.originalUrl,
    method: req.method,
    ip: req.ip,
    correlationId: req.correlationId,
    stack: err.stack,
  };

  // Classification-aware client messages below; log immediately with stack for ops
  if ((err.statusCode || 500) >= 500) {
    logger.error(logData);
  } else if ((err.statusCode || 500) >= 400 || err.name === 'CastError' || err.name === 'ValidationError') {
    logger.warn({ ...logData, stack: undefined });
  }

  // 🔥 Mongoose bad ObjectId — never expose path/value internals to clients
  if (err.name === 'CastError') {
    error = new AppError('Please check the submitted identifiers and try again.', 400);
    error.code = 'INVALID_ID';
  }

  // 🔥 Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0];
    const friendlyField =
      field === 'phone' || field === 'mobile'
        ? 'mobile number'
        : field === 'email'
          ? 'email address'
          : field;
    const message = field
      ? `This ${friendlyField} is already registered`
      : 'This record already exists';
    error = new AppError(message, 400);
    error.code = 'DUPLICATE_ENTRY';
  }

  // 🔥 Mongoose validation error — keep logs detailed, clients get safe text
  if (err.name === 'ValidationError') {
    const detail = Object.values(err.errors || {})
      .map((val) => val.message)
      .join(', ');
    logger.warn({
      message: 'Mongoose validation failed',
      detail,
      path: req.originalUrl,
      correlationId: req.correlationId,
    });
    error = new AppError('Please check the highlighted fields and try again.', 400);
    error.code = 'VALIDATION_ERROR';
  }

  // 🔥 JWT Errors
  if (err.name === 'JsonWebTokenError') {
    error = new AppError('Invalid token. Please log in again.', 401);
  }

  if (err.name === 'TokenExpiredError') {
    error = new AppError('Your token has expired. Please log in again.', 401);
  }

  if (err.name === 'PermissionError') {
    error = new AppError(err.message, 403);
  }

  // 🔥 Multer file upload errors
  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      error = new AppError('File size too large', 400);
    } else if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      error = new AppError('Unexpected file field', 400);
    } else {
      error = new AppError('File upload error', 400);
    }
  }

  // 🔥 MongoDB connectivity errors
  if (
    err.name === 'MongoNetworkError' ||
    err.name === 'MongoServerSelectionError' ||
    err.name === 'MongoNotConnectedError' ||
    err.message?.includes('Client must be connected')
  ) {
    error = new AppError('Database temporarily unavailable', 503);
  }

  const statusCode = error.statusCode || 500;

  // Don't expose internal error details for server faults or infra exceptions
  const isProduction = process.env.NODE_ENV === 'production';
  const looksInternal =
    /mongo|mongoose|redis|econn|etimedout|bullmq|stack|node_modules/i.test(String(error.message || ''));

  let message =
    (statusCode >= 500 && isProduction) || looksInternal
      ? statusCode >= 500
        ? 'Internal server error'
        : 'We could not process this request. Please try again.'
      : error.message || 'Server Error';

  if (statusCode === 500 && isProduction) {
    message = 'Internal server error';
  }

  // 🔥 Enhanced error response for better frontend integration
  const errorResponse = {
    success: false,
    message,
    error: {
      statusCode,
      timestamp: new Date().toISOString(),
      path: req.originalUrl,
      ...(req.correlationId ? { correlationId: req.correlationId } : {}),
    },
    data: null,
  };

  // Include error code for specific error types (useful for frontend)
  if (error.code && typeof error.code === 'string') {
    errorResponse.error.code = error.code;
  } else if (err.name === 'ValidationError') {
    errorResponse.error.code = 'VALIDATION_ERROR';
  } else if (err.name === 'CastError') {
    errorResponse.error.code = 'INVALID_ID';
  } else if (err.name === 'SESSION_REPLACED') {
    errorResponse.error.code = 'SESSION_REPLACED';
  } else if (err.code === 11000) {
    errorResponse.error.code = 'DUPLICATE_ENTRY';
  } else if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    errorResponse.error.code = 'AUTH_ERROR';
  } else if (err.name === 'MulterError') {
    errorResponse.error.code = 'FILE_UPLOAD_ERROR';
  } else if (
    err.name === 'MongoNetworkError' ||
    err.name === 'MongoServerSelectionError' ||
    err.name === 'MongoNotConnectedError'
  ) {
    errorResponse.error.code = 'DATABASE_UNAVAILABLE';
  }

  // If an AppError provided a machine-readable code, forward it for frontend mapping
  if (err.code && typeof err.code === 'string') {
    errorResponse.error.code = err.code;
  }

  // Add validation details for frontend (development only)
  if (process.env.NODE_ENV === 'development' && err.name === 'ValidationError') {
    errorResponse.error.details = err.errors;
  }

  res.status(statusCode).json(errorResponse);
};