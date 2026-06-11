import ApiError from '../utils/ApiError.js';
import HttpStatus from '../constants/httpStatus.js';

/**
 * Authorization middleware
 * Checks if user has required role(s)
 * @param  {...string} allowedRoles - Array of allowed roles
 */
export const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new ApiError(
        HttpStatus.UNAUTHORIZED,
        'Authentication required'
      ));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(new ApiError(
        HttpStatus.FORBIDDEN,
        'You do not have permission to access this resource'
      ));
    }

    next();
  };
};

export default authorize;
