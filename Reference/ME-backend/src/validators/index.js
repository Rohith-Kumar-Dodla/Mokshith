import { validationResult } from 'express-validator';
import ApiError from '../utils/ApiError.js';
import HttpStatus from '../constants/httpStatus.js';

export const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map((error) => error.msg);
    throw new ApiError(
      HttpStatus.BAD_REQUEST,
      'Validation failed',
      errorMessages
    );
  }
  next();
};

export default validate;
