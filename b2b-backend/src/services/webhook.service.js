import { logger } from '../config/logger.js';

export const processWebhook = async (payload) => {
  logger.info('Processing webhook', { eventType: payload?.event });
};