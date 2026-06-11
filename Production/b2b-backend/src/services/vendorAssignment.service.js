import { logger } from '../config/logger.js';

export const assignVendor = async ({ vendorId, orderId }) => {
  logger.info('Vendor assigned to order', { vendorId, orderId });
};