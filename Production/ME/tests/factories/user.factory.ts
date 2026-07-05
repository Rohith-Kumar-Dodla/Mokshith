import { ROLES } from '../../../b2b-backend/src/constants/roles.js';
import apiClient from '../helpers/apiClient';

type UserPayload = {
  name: string;
  email?: string;
  mobile?: string;
  password: string;
  role?: string;
};

// Deterministic test users per role. Values chosen to avoid colliding with production.
export const UserFactory = {
  build(role = ROLES.B2B_CUSTOMER, index = 1): UserPayload {
    const normalizedRole = role || ROLES.B2B_CUSTOMER;
    const email = `test+${normalizedRole.toLowerCase()}${index}@example.com`;
    const mobile = `9000000${String(100 + index).slice(-4)}`; // not real-world valid, deterministic
    return {
      name: `Auto ${normalizedRole} ${index}`,
      email,
      mobile,
      password: 'Test@1234', // meets password policy in many environments
      role: normalizedRole,
    };
  },

  async create(role = ROLES.B2B_CUSTOMER, index = 1) {
    // CI safety: prefer seeded accounts in CI when configured
    const useSeeded = (process.env.TEST_USE_SEEDED_USERS || 'false').toLowerCase() === 'true';
    const runningInCI = (process.env.CI || 'false').toLowerCase() === 'true';

    if (runningInCI && useSeeded) {
      // Map role to seeded env var names
      const roleKey = String(role).toUpperCase();
      const envPrefix = `TEST_SEEDED_${roleKey}`;
      const seededMobile = process.env[`${envPrefix}_MOBILE`];
      const seededEmail = process.env[`${envPrefix}_EMAIL`];
      const seededPassword = process.env[`${envPrefix}_PASSWORD`];
      if (!seededPassword || (!seededMobile && !seededEmail)) {
        throw new Error(`UserFactory.create: seeded credentials for role ${roleKey} not fully configured. Set ${envPrefix}_EMAIL or ${envPrefix}_MOBILE and ${envPrefix}_PASSWORD in CI.`);
      }
      const payload = {
        name: `Seeded ${roleKey}`,
        email: seededEmail,
        mobile: seededMobile,
        password: seededPassword,
        role,
      };
      return { payload, response: { seeded: true } };
    }

    // Non-CI or CI with creation allowed: create dynamically
    const allowCreate = (process.env.ALLOW_TEST_USER_CREATION || 'true').toLowerCase() === 'true';
    if (runningInCI && !allowCreate) {
      throw new Error('UserFactory.create: dynamic user creation is disabled in CI. Enable TEST_USE_SEEDED_USERS or set ALLOW_TEST_USER_CREATION=true (not recommended).');
    }

    const payload = this.build(role, index);
    const response = await apiClient.post('/auth/register', {
      name: payload.name,
      email: payload.email,
      mobile: payload.mobile,
      password: payload.password,
      role: payload.role,
    });
    return { payload, response: response.data };
  },
};

export default UserFactory;

