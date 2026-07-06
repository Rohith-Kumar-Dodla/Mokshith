# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: authentication.smoke.spec.ts >> Authentication Smoke Suite >> S-ROLE-01 | Role-based redirect after login
- Location: tests\smoke\authentication.smoke.spec.ts:156:3

# Error details

```
AxiosError: Request failed with status code 400
```

# Test source

```ts
  1  | import { ROLES } from '../../../b2b-backend/src/constants/roles.js';
  2  | import apiClient from '../helpers/apiClient';
  3  | 
  4  | type UserPayload = {
  5  |   name: string;
  6  |   email?: string;
  7  |   mobile?: string;
  8  |   password: string;
  9  |   role?: string;
  10 | };
  11 | 
  12 | // Deterministic test users per role. Values chosen to avoid colliding with production.
  13 | export const UserFactory = {
  14 |   build(role = ROLES.B2B_CUSTOMER, index = 1): UserPayload {
  15 |     const normalizedRole = role || ROLES.B2B_CUSTOMER;
  16 |     const email = `test+${normalizedRole.toLowerCase()}${index}@example.com`;
  17 |     const mobile = `9000000${String(100 + index).slice(-4)}`; // not real-world valid, deterministic
  18 |     return {
  19 |       name: `Auto ${normalizedRole} ${index}`,
  20 |       email,
  21 |       mobile,
  22 |       password: 'Test@1234', // meets password policy in many environments
  23 |       role: normalizedRole,
  24 |     };
  25 |   },
  26 | 
  27 |   async create(role = ROLES.B2B_CUSTOMER, index = 1) {
  28 |     // CI safety: prefer seeded accounts in CI when configured
  29 |     const useSeeded = (process.env.TEST_USE_SEEDED_USERS || 'false').toLowerCase() === 'true';
  30 |     const runningInCI = (process.env.CI || 'false').toLowerCase() === 'true';
  31 | 
  32 |     if (runningInCI && useSeeded) {
  33 |       // Map role to seeded env var names
  34 |       const roleKey = String(role).toUpperCase();
  35 |       const envPrefix = `TEST_SEEDED_${roleKey}`;
  36 |       const seededMobile = process.env[`${envPrefix}_MOBILE`];
  37 |       const seededEmail = process.env[`${envPrefix}_EMAIL`];
  38 |       const seededPassword = process.env[`${envPrefix}_PASSWORD`];
  39 |       if (!seededPassword || (!seededMobile && !seededEmail)) {
  40 |         throw new Error(`UserFactory.create: seeded credentials for role ${roleKey} not fully configured. Set ${envPrefix}_EMAIL or ${envPrefix}_MOBILE and ${envPrefix}_PASSWORD in CI.`);
  41 |       }
  42 |       const payload = {
  43 |         name: `Seeded ${roleKey}`,
  44 |         email: seededEmail,
  45 |         mobile: seededMobile,
  46 |         password: seededPassword,
  47 |         role,
  48 |       };
  49 |       return { payload, response: { seeded: true } };
  50 |     }
  51 | 
  52 |     // Non-CI or CI with creation allowed: create dynamically
  53 |     const allowCreate = (process.env.ALLOW_TEST_USER_CREATION || 'true').toLowerCase() === 'true';
  54 |     if (runningInCI && !allowCreate) {
  55 |       throw new Error('UserFactory.create: dynamic user creation is disabled in CI. Enable TEST_USE_SEEDED_USERS or set ALLOW_TEST_USER_CREATION=true (not recommended).');
  56 |     }
  57 | 
  58 |     const payload = this.build(role, index);
> 59 |     const response = await apiClient.post('/auth/register', {
     |                      ^ AxiosError: Request failed with status code 400
  60 |       name: payload.name,
  61 |       email: payload.email,
  62 |       mobile: payload.mobile,
  63 |       password: payload.password,
  64 |       role: payload.role,
  65 |     });
  66 |     return { payload, response: response.data };
  67 |   },
  68 | };
  69 | 
  70 | export default UserFactory;
  71 | 
  72 | 
```