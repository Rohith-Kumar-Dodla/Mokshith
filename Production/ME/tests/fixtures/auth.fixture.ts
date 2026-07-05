import UserFactory from '../factories/user.factory';
import apiClient from '../helpers/apiClient';
import { ROLES } from '../../../b2b-backend/src/constants/roles.js';

export const AuthFixtures = {
  async createAndLogin(page, role = ROLES.B2B_CUSTOMER, index = 1) {
    // Create user via API (register)
    const { payload } = await UserFactory.create(role, index);

    // Login using API to obtain tokens; return payload for tests
    const loginRes = await apiClient.post('/auth/login', { mobile: payload.mobile, password: payload.password });
    return { user: payload, session: loginRes.data };
  },

  // Convenience methods for common roles
  async createAdmin(index = 1) {
    return this.createAndLogin(null, ROLES.ADMIN, index);
  },

  async createVendor(index = 1) {
    return this.createAndLogin(null, ROLES.VENDOR, index);
  },

  async createDeliveryPartner(index = 1) {
    return this.createAndLogin(null, ROLES.DELIVERY_PARTNER, index);
  },

  async createSuperAdmin(index = 1) {
    return this.createAndLogin(null, ROLES.SUPER_ADMIN, index);
  },

  async createGuest(index = 1) {
    return this.createAndLogin(null, ROLES.B2B_CUSTOMER, index);
  },

  async teardownUser(emailOrMobile) {
    // Try several known test-only cleanup endpoints; if none exist, log and continue.
    const endpoints = [
      '/testing/users/delete',
      '/test-utils/users/delete',
      '/auth/test-delete',
    ];
    for (const ep of endpoints) {
      try {
        await apiClient.post(ep, { identifier: emailOrMobile });
        return true;
      } catch (err: any) {
        const status = err?.response?.status;
        if (status === 404 || status === 405) {
          continue;
        }
        // For other failures, log and continue trying other endpoints
        console.warn(`teardownUser: attempt to delete ${emailOrMobile} at ${ep} failed:`, err?.message || err);
      }
    }
    // If cleanup endpoints are not available, document fallback behavior.
    console.warn(`teardownUser: no test-only cleanup endpoint available for ${emailOrMobile}. Please ensure test DB is ephemeral or provide a cleanup API.`);
    return false;
  },
};

export default AuthFixtures;

