import { nowIso } from '../generators/users/_userUtils.js';

/**
 * customer.flow
 * - register customer via API
 * - login customer
 *
 * Returns structured result:
 * { success, executionTimeMs, createdIds: { userId }, warnings, errors }
 */
export async function runCustomerFlow({ client, config = {}, logger, dryRun = true, fixture } = {}) {
  const start = Date.now();
  const result = { success: false, createdIds: {}, warnings: [], errors: [], executionTimeMs: 0 };
  try {
    const payload = fixture || {
      name: `Customer ${Date.now()}`,
      email: `customer.${Date.now()}@qa.mokshith.local`,
      mobile: `9999${String(Date.now()).slice(-6)}`,
      password: config.defaultPassword || 'ChangeMeNow!',
    };

    if (dryRun) {
      logger?.info('DRY RUN: would POST /api/v1/auth/register', { payload: { ...payload, password: '***' } });
      result.createdIds.userId = null;
    } else {
      const reg = await client.post('/api/v1/auth/register', payload);
      if (!reg.ok) {
        result.errors.push({ stage: 'register', status: reg.status, data: reg.data });
        throw new Error('Registration failed');
      }
      result.createdIds.userId = reg.data?.data?.user?.id || reg.data?.data?.user?._id || null;
    }

    // Login (to obtain token)
    if (dryRun) {
      logger?.info('DRY RUN: would POST /api/v1/auth/login');
      result.token = null;
    } else {
      const loginPayload = { identifier: payload.email, password: payload.password };
      const login = await client.post('/api/v1/auth/login', loginPayload);
      if (!login.ok) {
        result.errors.push({ stage: 'login', status: login.status, data: login.data });
        throw new Error('Login failed');
      }
      result.token = login.data?.data?.accessToken || null;
    }

    result.success = result.errors.length === 0;
  } catch (err) {
    result.errors.push(err.message);
  } finally {
    result.executionTimeMs = Date.now() - start;
  }
  return result;
}

export default { runCustomerFlow };

