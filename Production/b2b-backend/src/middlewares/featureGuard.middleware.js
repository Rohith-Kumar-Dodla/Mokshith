import { fetchSetting } from '../modules/settings/settings.service.js';
import AppError from '../errors/AppError.js';

/**
 * Middleware to check if a specific feature is enabled
 * @param {string} featureKey - The key of the feature in settings
 * @param {string} errorMessage - Custom error message if feature is disabled
 */
export const requireFeatureEnabled = (featureKey, errorMessage) => {
  return async (req, res, next) => {
    try {
      const setting = await fetchSetting(featureKey);
      
      // Assume feature is enabled if not set, or check specifically for true
      // Usually feature flags are boolean
      if (setting && setting.value === false) {
        return next(new AppError(errorMessage || `${featureKey} is currently disabled`, 403));
      }
      
      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Specifically for registration check
 */
export const requireRegistrationsEnabled = () => {
  return async (req, res, next) => {
    try {
      const setting = await fetchSetting('allowRegistration');
      if (setting && setting.value === false) {
        return next(new AppError('New registrations are currently disabled.', 403));
      }
      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Specifically for COD check
 */
export const requireCODEnabled = () => {
  return async (req, res, next) => {
    try {
      const setting = await fetchSetting('enableCOD');
      if (setting && setting.value === false) {
        return next(new AppError('Cash on Delivery is currently unavailable.', 403));
      }
      next();
    } catch (error) {
      next(error);
    }
  };
};
