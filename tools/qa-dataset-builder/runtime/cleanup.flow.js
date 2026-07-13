/**
 * cleanup.flow
 * - Optional cleanup flow to remove ephemeral runtime artifacts via API (not DB deletes)
 */
export async function runCleanupFlow({ client, token, options = {}, config = {}, logger, dryRun = true } = {}) {
  const start = Date.now();
  const result = { success: false, executionTimeMs: 0, details: null, errors: [] };
  try {
    if (dryRun) {
      logger?.info('DRY RUN: would call cleanup endpoints with options', options);
      result.success = true;
    } else {
      const res = await client.post('/api/v1/admin/cleanup', options, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) result.errors.push({ stage: 'cleanup', status: res.status });
      else {
        result.details = res.data;
        result.success = true;
      }
    }
  } catch (err) {
    result.errors.push(err.message);
  } finally {
    result.executionTimeMs = Date.now() - start;
  }
  return result;
}

export default { runCleanupFlow };

