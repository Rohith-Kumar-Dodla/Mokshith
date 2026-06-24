class AppError extends Error {
  constructor(message, statusCode, code = undefined) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    // Optional machine-readable error code (e.g. ACCOUNT_NOT_FOUND)
    if (code) {
      this.code = code;
    }

    Error.captureStackTrace(this, this.constructor);
  }
}

export default AppError;