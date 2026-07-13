/**
 * apiVerifier: Checks backend endpoints for basic availability.
 * Uses provided HTTP client (createClient) or a mock for tests.
 */
export async function verifyApi({ client, logger } = {}) {
  const result = { ok: true, checks: [], errors: [] };
  try {
    // Health
    const health = await client.get('/api/v1/health');
    result.checks.push({ endpoint: '/api/v1/health', ok: health.ok, status: health.status });
    if (!health.ok) result.ok = false;

    // Auth (login schema check - not sending credentials)
    const authInfo = await client.get('/api/v1/auth/info');
    result.checks.push({ endpoint: '/api/v1/auth/info', ok: authInfo.ok, status: authInfo.status });
  } catch (err) {
    result.ok = false;
    result.errors.push(err.message);
  }
  return result;
}

export default { verifyApi };

