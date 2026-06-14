import User from '../modules/user/user.model.js';
import { ROLES } from '../constants/roles.js';
import { USER_STATUS } from '../constants/userStatus.js';
import { hashPassword } from '../utils/hashPassword.js';
import { logger } from '../config/logger.js';

const SUPER_ADMIN_FILTER = { role: ROLES.SUPER_ADMIN };

const BOOTSTRAP_SUPER_ADMIN = {
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

  const hashedPassword = await hashPassword(BOOTSTRAP_SUPER_ADMIN.password);
  const now = new Date();

  try {
    await User.create({
      name: BOOTSTRAP_SUPER_ADMIN.name,
      email: BOOTSTRAP_SUPER_ADMIN.email,
      mobile: BOOTSTRAP_SUPER_ADMIN.mobile,
      phone: BOOTSTRAP_SUPER_ADMIN.mobile,
      password: hashedPassword,
      role: BOOTSTRAP_SUPER_ADMIN.role,
      status: BOOTSTRAP_SUPER_ADMIN.status,
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
