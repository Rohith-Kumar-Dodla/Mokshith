import ApiError from '../utils/ApiError.js';
import HttpStatus from '../constants/httpStatus.js';

const notFound = (req, res, next) => {
  const error = new ApiError(
    HttpStatus.NOT_FOUND,
    `Route ${req.originalUrl} not found`
  );
  next(error);
};

export default notFound;
