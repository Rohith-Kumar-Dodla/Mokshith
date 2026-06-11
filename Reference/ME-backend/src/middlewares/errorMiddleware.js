import logger from '../utils/logger.js';
import ApiError from '../utils/ApiError.js';

const errorHandler = (err, req, res, next) => {
  let error = err;

  if (!(error instanceof ApiError)) {
    const statusCode = error.statusCode || 500;
    const message = error.message || 'Internal Server Error';
    error = new ApiError(statusCode, message, error.errors || []);
  }

  const response = {
    success: false,
    message: error.message,
    ...(error.errors && { errors: error.errors }),
  };

  logger.error(`Error: ${error.message} - Status: ${error.statusCode}`);

  res.status(error.statusCode).json(response);
};

export default errorHandler;
