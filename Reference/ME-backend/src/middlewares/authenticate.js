import ApiError from '../utils/ApiError.js';
import HttpStatus from '../constants/httpStatus.js';
import { verifyToken } from '../utils/authUtils.js';
import User from '../models/User.js';

/**
 * Authentication middleware
 * Verifies JWT token and attaches user to request
 */
export const authenticate = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new ApiError(
        HttpStatus.UNAUTHORIZED,
        'No token provided. Please log in.'
      );
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token
    const decoded = verifyToken(token);

    // Find user by ID
    const user = await User.findById(decoded.userId);

    if (!user) {
      throw new ApiError(
        HttpStatus.UNAUTHORIZED,
        'User not found. Please log in again.'
      );
    }

    // Check if user is suspended
    if (user.status === 'suspended') {
      throw new ApiError(
        HttpStatus.FORBIDDEN,
        'Account has been suspended. Please contact support.'
      );
    }

    // Attach user to request
    req.user = {
      userId: user._id.toString(),
      role: user.role,
      email: user.email,
    };

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      next(new ApiError(
        HttpStatus.UNAUTHORIZED,
        'Invalid token. Please log in again.'
      ));
    } else if (error.name === 'TokenExpiredError') {
      next(new ApiError(
        HttpStatus.UNAUTHORIZED,
        'Token expired. Please log in again.'
      ));
    } else {
      next(error);
    }
  }
};

export default authenticate;
