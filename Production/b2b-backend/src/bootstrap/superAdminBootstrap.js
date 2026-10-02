import User from '../modules/user/user.model.js';
import { ROLES } from '../constants/roles.js';
import { USER_STATUS } from '../constants/userStatus.js';
import { hashPassword } from '../utils/hashPassword.js';
import { logger } from '../config/logger.js';

const SUPER_ADMIN_FILTER = { role: ROLES.SUPER_ADMIN };

const DEVELOPMENT_SUPER_ADMIN = {
  name: 'Super Admin',
  email: 'superadmin@mokshith.local',
  mobile: '9999999999',
  password: 'superadmin123',
  role: ROLES.SUPER_ADMIN,
  status: USER_STATUS.ACTIVE,
};

/**
 * Ensures exactly one SUPER_ADMIN exists when the database has none.
 * Runs on every startup; creates a user only when SUPER_ADMIN count is 0.
 */
export async function bootstrapSuperAdmin() {
  const existingCount = await User.countDocuments(SUPER_ADMIN_FILTER);

  if (existingCount > 0) {
    logger.info('✓ Super Admin Found');
    return { action: 'found', count: existingCount };
  }

  const isProduction = process.env.NODE_ENV === 'production';
  if (isProduction && process.env.BOOTSTRAP_SUPER_ADMIN !== 'true') {
    logger.error('No Super Admin exists. Production bootstrap is disabled; provision the account through an approved deployment procedure.');
    return { action: 'skipped', reason: 'production-bootstrap-disabled' };
  }

  const bootstrap = isProduction ? {
    name: process.env.SUPER_ADMIN_NAME,
    email: process.env.SUPER_ADMIN_EMAIL,
    mobile: process.env.SUPER_ADMIN_MOBILE,
    password: process.env.SUPER_ADMIN_PASSWORD,
    role: ROLES.SUPER_ADMIN,
    status: USER_STATUS.ACTIVE,
  } : DEVELOPMENT_SUPER_ADMIN;
  if (!bootstrap.name || !bootstrap.email || !bootstrap.mobile || !bootstrap.password || (isProduction && bootstrap.password.length < 12)) {
    throw new Error('Secure Super Admin bootstrap credentials are incomplete or too weak');
  }

  const hashedPassword = await hashPassword(bootstrap.password);
  const now = new Date();

  try {
    await User.create({
      name: bootstrap.name,
      email: bootstrap.email,
      mobile: bootstrap.mobile,
      phone: bootstrap.mobile,
      password: hashedPassword,
      role: bootstrap.role,
      status: bootstrap.status,
      isVerified: true,
      lastPasswordChange: now,
      passwordHistory: [{ hash: hashedPassword, changedAt: now }],
    });

    logger.info('✓ Super Admin Created');
    return { action: 'created' };
  } catch (error) {
    if (error.code === 11000) {
      const recount = await User.countDocuments(SUPER_ADMIN_FILTER);
      if (recount > 0) {
        logger.info('✓ Super Admin Found');
        return { action: 'found', count: recount };
      }
    }

    throw error;
  }
}

export default bootstrapSuperAdmin;
