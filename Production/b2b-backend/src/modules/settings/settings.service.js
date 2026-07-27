import * as repo from './settings.repository.js';
import AppError from '../../errors/AppError.js';
import {
  getPlatformSettings,
} from '../platformSettings/platformSettings.service.js';

// 🔥 Allowed keys (for safety)
const ALLOWED_KEYS = [
  'maintenanceMode',
  'maintenanceMessage',
  'siteName',
  'supportEmail',
  'defaultCurrency',
  'commissionRate',
  'orderCutoffTime',
  'maxCreditLimit',
  'allowRegistration',
  'enableCOD',
  'creditSystem',
  'cod',
  'notifications',
  'reviews',
  'recommendations',
  'dynamicPricing',
  'featureFlags',
  'MAINTENANCE_MODE',
  'MAX_ORDER_LIMIT',
  'DEFAULT_CURRENCY',
  'ENABLE_NOTIFICATIONS',
  'blockedIps',
];

export const updateSetting = async (key, value) => {
  if (!key) {
    throw new AppError('Setting key is required', 400);
  }

  // 🔥 Optional strict control
  if (!ALLOWED_KEYS.includes(key)) {
    throw new AppError('Invalid setting key', 400);
  }

  return repo.upsertSetting(key, value);
};

export const fetchSetting = async (key) => {
  const setting = await repo.getSetting(key);

  if (!setting) {
    return {
      key,
      value: null,
    };
  }

  return setting;
};

export const getAllSettings = async () => {
  return repo.getAllSettings();
};

export const getPublicConfig = async () => {
  const settings = await getAllSettings();
  const platform = await getPlatformSettings();
  const publicKeys = ['allowRegistration', 'enableCOD', 'siteName', 'defaultCurrency', 'featureFlags'];
  
  const config = settings.reduce((acc, s) => {
    if (publicKeys.includes(s.key)) {
      acc[s.key] = s.value;
    }
    return acc;
  }, {});

  return {
    ...config,
    maintenanceMode: platform.maintenanceMode,
    maintenanceMessage: platform.maintenanceMessage,
    supportPhone: platform.supportPhone,
    supportEmail: platform.supportEmail,
  };
};
