# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: authentication.smoke.spec.ts >> Authentication Smoke Suite >> S-SESSION-02 | Session restore on app load
- Location: tests\smoke\authentication.smoke.spec.ts:139:3

# Error details

```
AxiosError: Request failed with status code 403
```

# Test source

```ts
  1  | import UserFactory from '../factories/user.factory';
  2  | import apiClient from '../helpers/apiClient';
  3  | import { ROLES } from '../../../b2b-backend/src/constants/roles.js';
  4  | 
  5  | export const AuthFixtures = {
  6  |   async createAndLogin(page, role = ROLES.B2B_CUSTOMER, index = 1) {
  7  |     // Create user via API (register)
  8  |     const { payload } = await UserFactory.create(role, index);
  9  | 
  10 |     // Login using API to obtain tokens; return payload for tests
> 11 |     const loginRes = await apiClient.post('/auth/login', { mobile: payload.mobile, password: payload.password });
     |                      ^ AxiosError: Request failed with status code 403
  12 |     return { user: payload, session: loginRes.data };
  13 |   },
  14 | 
  15 |   // Convenience methods for common roles
  16 |   async createAdmin(index = 1) {
  17 |     return this.createAndLogin(null, ROLES.ADMIN, index);
  18 |   },
  19 | 
  20 |   async createVendor(index = 1) {
  21 |     return this.createAndLogin(null, ROLES.VENDOR, index);
  22 |   },
  23 | 
  24 |   async createDeliveryPartner(index = 1) {
  25 |     return this.createAndLogin(null, ROLES.DELIVERY_PARTNER, index);
  26 |   },
  27 | 
  28 |   async createSuperAdmin(index = 1) {
  29 |     return this.createAndLogin(null, ROLES.SUPER_ADMIN, index);
  30 |   },
  31 | 
  32 |   async createGuest(index = 1) {
  33 |     return this.createAndLogin(null, ROLES.B2B_CUSTOMER, index);
  34 |   },
  35 | 
  36 |   async teardownUser(emailOrMobile) {
  37 |     // Try several known test-only cleanup endpoints; if none exist, log and continue.
  38 |     const endpoints = [
  39 |       '/testing/users/delete',
  40 |       '/test-utils/users/delete',
  41 |       '/auth/test-delete',
  42 |     ];
  43 |     for (const ep of endpoints) {
  44 |       try {
  45 |         await apiClient.post(ep, { identifier: emailOrMobile });
  46 |         return true;
  47 |       } catch (err: any) {
  48 |         const status = err?.response?.status;
  49 |         if (status === 404 || status === 405) {
  50 |           continue;
  51 |         }
  52 |         // For other failures, log and continue trying other endpoints
  53 |         console.warn(`teardownUser: attempt to delete ${emailOrMobile} at ${ep} failed:`, err?.message || err);
  54 |       }
  55 |     }
  56 |     // If cleanup endpoints are not available, document fallback behavior.
  57 |     console.warn(`teardownUser: no test-only cleanup endpoint available for ${emailOrMobile}. Please ensure test DB is ephemeral or provide a cleanup API.`);
  58 |     return false;
  59 |   },
  60 | };
  61 | 
  62 | export default AuthFixtures;
  63 | 
  64 | 
```