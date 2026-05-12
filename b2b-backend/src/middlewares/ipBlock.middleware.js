import { fetchSetting } from '../modules/settings/settings.service.js';
import AppError from '../errors/AppError.js';
import Audit from '../modules/audit/audit.model.js';

export const ipBlockMiddleware = async (req, res, next) => {
  try {
    const ip = req.ip || req.connection.remoteAddress;
    const blockedIpsSetting = await fetchSetting('blockedIps');
    
    const blockedIps = blockedIpsSetting?.value || [];
    
    if (blockedIps.includes(ip)) {
      // Log blocked attempt
      await Audit.create({
        action: 'BLOCKED_ACCESS',
        entity: 'SYSTEM',
        details: `Access denied for blocked IP: ${ip}`,
        ip,
        severity: 'WARNING'
      });
      
      return next(new AppError('Access denied. Your IP has been blocked.', 403));
    }
    
    next();
  } catch (error) {
    next(error);
  }
};
