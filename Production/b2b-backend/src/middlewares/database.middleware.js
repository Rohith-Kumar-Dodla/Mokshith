import { assertDatabaseReady } from '../utils/databaseHealth.js';
import AppError from '../errors/AppError.js';

/**
 * Reject requests when MongoDB is not connected.
 * Prevents misleading "user not found" responses during partial startup or disconnects.
 */
export const requireDatabase = async (req, res, next) => {
  try {
    await assertDatabaseReady();
    next();
  } catch (error) {
    if (error instanceof AppError) {
      return next(error);
    }
    next(new AppError('Database temporarily unavailable', 503));
  }
};

export default requireDatabase;
